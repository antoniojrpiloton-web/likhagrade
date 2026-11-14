<?php

namespace Tests\Feature\DataTables;

use App\Actions\Auth\RegisterUserAction;
use App\Actions\SuperAdmin\BootstrapSuperAdminAction;
use App\Models\AuditLog;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DataTablesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_superadmin_can_retrieve_paginated_users_via_datatable(): void
    {
        $superAdminAction = app(BootstrapSuperAdminAction::class);
        $result = $superAdminAction->execute('superadmin@likhagrade.com', 'Pass12345!');
        $superAdmin = $result['user'];

        // Seed 15 test users
        User::factory()->count(15)->create();

        // Query with length 10
        $response = $this->actingAs($superAdmin)->getJson('/platform/users/data?draw=1&start=0&length=10');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'draw',
            'recordsTotal',
            'recordsFiltered',
            'data',
        ]);

        $json = $response->json();
        $this->assertEquals(1, $json['draw']);
        $this->assertCount(10, $json['data']);
        $this->assertGreaterThanOrEqual(16, $json['recordsTotal']);
    }

    public function test_datatable_search_and_sorting(): void
    {
        $superAdminAction = app(BootstrapSuperAdminAction::class);
        $result = $superAdminAction->execute('superadmin2@likhagrade.com', 'Pass12345!');
        $superAdmin = $result['user'];

        User::factory()->create([
            'first_name' => 'UniqueZack',
            'last_name' => 'Zimmerman',
            'name' => 'UniqueZack Zimmerman',
            'email' => 'unique.zack@example.com',
        ]);

        User::factory()->create([
            'first_name' => 'Normal',
            'last_name' => 'User',
            'name' => 'Normal User',
            'email' => 'normal@example.com',
        ]);

        // Search for UniqueZack
        $response = $this->actingAs($superAdmin)
            ->getJson('/platform/users/data?draw=2&start=0&length=10&search[value]=UniqueZack');

        $response->assertStatus(200);
        $json = $response->json();
        $this->assertEquals(1, $json['recordsFiltered']);
        $this->assertEquals('UniqueZack Zimmerman', $json['data'][0]['name']);
    }

    public function test_workspace_datatable_is_strictly_scoped_to_active_tenant(): void
    {
        $registerAction = app(RegisterUserAction::class);

        $teacherA = $registerAction->execute([
            'first_name' => 'Teacher',
            'last_name' => 'Alpha',
            'email' => 'alpha@test.com',
            'password' => 'Pass12345!',
        ]);
        $teacherA->markEmailAsVerified();
        $tenantA = $teacherA->personalTenant();

        $teacherB = $registerAction->execute([
            'first_name' => 'Teacher',
            'last_name' => 'Beta',
            'email' => 'beta@test.com',
            'password' => 'Pass12345!',
        ]);
        $teacherB->markEmailAsVerified();
        $tenantB = $teacherB->personalTenant();

        // Create specific logs
        AuditLog::create([
            'tenant_id' => $tenantA->id,
            'user_id' => $teacherA->id,
            'action' => 'test.unique_alpha_action',
            'description' => 'Alpha isolated log',
        ]);

        AuditLog::create([
            'tenant_id' => $tenantB->id,
            'user_id' => $teacherB->id,
            'action' => 'test.unique_beta_action',
            'description' => 'Beta isolated log',
        ]);

        // Teacher A queries workspace activity logs DataTable
        $response = $this->actingAs($teacherA)
            ->withSession(['active_tenant_id' => $tenantA->id])
            ->getJson('/app/workspace/activity-logs/data?draw=1&start=0&length=10');

        $response->assertStatus(200);
        $json = $response->json();

        // Must contain Alpha's action, must NOT contain Beta's action
        $actions = array_column($json['data'], 'action');
        $this->assertContains('test.unique_alpha_action', $actions);
        $this->assertNotContains('test.unique_beta_action', $actions);
    }

    public function test_unauthorized_user_cannot_access_platform_datatable_endpoints(): void
    {
        $registerAction = app(RegisterUserAction::class);
        $teacher = $registerAction->execute([
            'first_name' => 'Normal',
            'last_name' => 'Teacher',
            'email' => 'teacher@school.com',
            'password' => 'Pass12345!',
        ]);
        $teacher->markEmailAsVerified();

        $response = $this->actingAs($teacher)->getJson('/platform/users/data');
        $response->assertStatus(403);

        $response = $this->actingAs($teacher)->getJson('/platform/tenants/data');
        $response->assertStatus(403);
    }
}
