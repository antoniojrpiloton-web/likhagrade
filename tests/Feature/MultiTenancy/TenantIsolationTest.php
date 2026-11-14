<?php

namespace Tests\Feature\MultiTenancy;

use App\Actions\Auth\RegisterUserAction;
use App\Enums\TenantStatus;
use App\Models\AuditLog;
use App\Models\Tenant;
use App\Services\TenantContext;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_two_registered_teachers_receive_independent_workspaces(): void
    {
        $registerAction = app(RegisterUserAction::class);

        $teacherA = $registerAction->execute([
            'first_name' => 'Alice',
            'last_name' => 'Smith',
            'email' => 'teacherA@gmail.com',
            'password' => 'Password123!',
        ]);

        $teacherB = $registerAction->execute([
            'first_name' => 'Bob',
            'last_name' => 'Jones',
            'email' => 'teacherB@yahoo.com',
            'password' => 'Password123!',
        ]);

        $workspaceA = $teacherA->personalTenant();
        $workspaceB = $teacherB->personalTenant();

        $this->assertNotNull($workspaceA);
        $this->assertNotNull($workspaceB);
        $this->assertNotEquals($workspaceA->id, $workspaceB->id);
        $this->assertEquals('Alice Smith Workspace', $workspaceA->name);
        $this->assertEquals('Bob Jones Workspace', $workspaceB->name);

        // Memberships are isolated
        $this->assertTrue($workspaceA->hasMember($teacherA));
        $this->assertFalse($workspaceA->hasMember($teacherB));

        $this->assertTrue($workspaceB->hasMember($teacherB));
        $this->assertFalse($workspaceB->hasMember($teacherA));
    }

    public function test_teacher_cannot_switch_to_another_teachers_workspace(): void
    {
        $registerAction = app(RegisterUserAction::class);

        $teacherA = $registerAction->execute([
            'first_name' => 'Alice',
            'last_name' => 'Smith',
            'email' => 'alice@school.com',
            'password' => 'Password123!',
        ]);
        $teacherA->markEmailAsVerified();

        $teacherB = $registerAction->execute([
            'first_name' => 'Bob',
            'last_name' => 'Jones',
            'email' => 'bob@school.com',
            'password' => 'Password123!',
        ]);
        $teacherB->markEmailAsVerified();

        $workspaceB = $teacherB->personalTenant();

        // Teacher A attempts to switch to Teacher B's workspace (IDOR attack)
        $response = $this->actingAs($teacherA)->post('/app/tenant/switch', [
            'tenant_id' => $workspaceB->id,
        ]);

        $response->assertStatus(403);
    }

    public function test_teacher_cannot_access_suspended_workspace(): void
    {
        $registerAction = app(RegisterUserAction::class);

        $teacher = $registerAction->execute([
            'first_name' => 'Charlie',
            'last_name' => 'Brown',
            'email' => 'charlie@gmail.com',
            'password' => 'Password123!',
        ]);
        $teacher->markEmailAsVerified();

        $workspace = $teacher->personalTenant();
        $workspace->update(['status' => TenantStatus::Suspended]);

        $response = $this->actingAs($teacher)
            ->withSession(['active_tenant_id' => $workspace->id])
            ->get('/app/dashboard');

        $response->assertStatus(403);
    }

    public function test_tenant_context_service_and_scoping_behavior(): void
    {
        $registerAction = app(RegisterUserAction::class);

        $teacherA = $registerAction->execute([
            'first_name' => 'Teacher',
            'last_name' => 'One',
            'email' => 'one@gmail.com',
            'password' => 'Password123!',
        ]);

        $teacherB = $registerAction->execute([
            'first_name' => 'Teacher',
            'last_name' => 'Two',
            'email' => 'two@gmail.com',
            'password' => 'Password123!',
        ]);

        $tenantA = $teacherA->personalTenant();
        $tenantB = $teacherB->personalTenant();

        $tenantContext = app(TenantContext::class);

        // Set context to Tenant A
        $tenantContext->set($tenantA);
        $this->assertEquals($tenantA->id, $tenantContext->id());
        $this->assertTrue($tenantContext->hasTenant());

        // Create log in Tenant A
        AuditLog::create([
            'tenant_id' => $tenantA->id,
            'user_id' => $teacherA->id,
            'action' => 'test.tenant_a',
            'description' => 'Log for A',
        ]);

        // Create log in Tenant B
        AuditLog::create([
            'tenant_id' => $tenantB->id,
            'user_id' => $teacherB->id,
            'action' => 'test.tenant_b',
            'description' => 'Log for B',
        ]);

        // Querying with tenant_id filter isolates records
        $logsA = AuditLog::where('tenant_id', $tenantContext->id())->get();
        $this->assertTrue($logsA->contains('action', 'test.tenant_a'));
        $this->assertFalse($logsA->contains('action', 'test.tenant_b'));

        // Reset context
        $tenantContext->forget();
        $this->assertFalse($tenantContext->hasTenant());
        $this->assertNull($tenantContext->id());
    }
}
