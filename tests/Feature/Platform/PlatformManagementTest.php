<?php

namespace Tests\Feature\Platform;

use App\Enums\TenantRole;
use App\Enums\TenantStatus;
use App\Enums\TenantType;
use App\Enums\UserStatus;
use App\Models\Department;
use App\Models\Tenant;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class PlatformManagementTest extends TestCase
{
    use RefreshDatabase;

    protected User $superAdmin;

    protected User $teacher;

    protected Tenant $personalTenant;

    protected Tenant $orgTenant;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);

        $this->superAdmin = User::factory()->create([
            'email' => 'admin@likhagrade.com',
            'status' => UserStatus::Active,
        ]);
        setPermissionsTeamId(null);
        $this->superAdmin->assignRole('SuperAdmin');

        $this->teacher = User::factory()->create([
            'email' => 'teacher@school.edu',
            'status' => UserStatus::Active,
        ]);

        $this->personalTenant = Tenant::create([
            'name' => 'Teacher Workspace',
            'type' => TenantType::Personal,
            'owner_id' => $this->teacher->id,
            'status' => TenantStatus::Active,
        ]);

        $this->personalTenant->members()->attach($this->teacher->id, [
            'membership_role' => TenantRole::Owner->value,
            'status' => 'active',
            'joined_at' => now(),
        ]);
        $this->personalTenant->getOrCreateDefaultSubscription();

        $this->orgTenant = Tenant::create([
            'name' => 'State University',
            'type' => TenantType::Organization,
            'org_type' => 'University',
            'owner_id' => $this->teacher->id,
            'status' => TenantStatus::Active,
            'is_verified_institution' => false,
            'verification_status' => 'pending',
            'contact_person' => 'Dean Smith',
            'contact_email' => 'dean@su.edu',
        ]);

        $this->orgTenant->members()->attach($this->teacher->id, [
            'membership_role' => TenantRole::OrganizationOwner->value,
            'status' => 'active',
            'joined_at' => now(),
        ]);
        $this->orgTenant->getOrCreateDefaultSubscription();
    }

    public function test_superadmin_can_access_platform_dashboard(): void
    {
        $response = $this->actingAs($this->superAdmin)->get(route('platform.dashboard'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Platform/Dashboard')
            ->has('metrics')
            ->has('growth_trends')
            ->has('recent_registrations')
            ->has('recent_activity')
        );
    }

    public function test_ordinary_teacher_cannot_access_platform_dashboard(): void
    {
        $response = $this->actingAs($this->teacher)->get(route('platform.dashboard'));

        $response->assertForbidden();
    }

    public function test_superadmin_can_create_user_with_workspace(): void
    {
        $response = $this->actingAs($this->superAdmin)->post(route('platform.users.store'), [
            'first_name' => 'Maria',
            'last_name' => 'Santos',
            'email' => 'maria.santos@gmail.com',
            'password' => 'Password123!',
            'status' => 'active',
            'create_workspace' => true,
            'workspace_name' => 'Maria Santos Workspace',
        ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('users', [
            'email' => 'maria.santos@gmail.com',
            'first_name' => 'Maria',
        ]);

        $newUser = User::where('email', 'maria.santos@gmail.com')->first();
        $this->assertNotNull($newUser);

        $this->assertDatabaseHas('tenants', [
            'owner_id' => $newUser->id,
            'name' => 'Maria Santos Workspace',
        ]);
    }

    public function test_superadmin_can_update_user_profile(): void
    {
        $response = $this->actingAs($this->superAdmin)->patch(route('platform.users.update', $this->teacher->id), [
            'first_name' => 'Updated',
            'last_name' => 'Teacher',
            'email' => 'updated.teacher@school.edu',
            'status' => 'active',
            'is_verified' => true,
        ]);

        $response->assertRedirect();
        $this->teacher->refresh();

        $this->assertEquals('Updated', $this->teacher->first_name);
        $this->assertEquals('updated.teacher@school.edu', $this->teacher->email);
    }

    public function test_superadmin_can_delete_user(): void
    {
        $victim = User::factory()->create();

        $response = $this->actingAs($this->superAdmin)->delete(route('platform.users.destroy', $victim->id));

        $response->assertRedirect();
        $this->assertSoftDeleted('users', ['id' => $victim->id]);
    }

    public function test_superadmin_can_impersonate_and_leave_user_session(): void
    {
        $impersonateResponse = $this->actingAs($this->superAdmin)->post(route('platform.users.impersonate', $this->teacher->id));

        $impersonateResponse->assertRedirect(route('app.dashboard'));
        $this->assertAuthenticatedAs($this->teacher);

        $leaveResponse = $this->post(route('platform.impersonate.leave'));
        $leaveResponse->assertRedirect(route('platform.users'));
        $this->assertAuthenticatedAs($this->superAdmin);
    }

    public function test_superadmin_can_export_users_csv(): void
    {
        $response = $this->actingAs($this->superAdmin)->get(route('platform.users.export'));

        $response->assertOk();
        $response->assertHeader('content-type', 'text/csv; charset=UTF-8');
    }

    public function test_superadmin_can_retrieve_users_datatable(): void
    {
        $response = $this->actingAs($this->superAdmin)->getJson(route('platform.users.data'));

        $response->assertOk();
        $response->assertJsonStructure([
            'data',
            'recordsTotal',
            'recordsFiltered',
        ]);
    }

    public function test_superadmin_can_retrieve_tenants_datatable(): void
    {
        $response = $this->actingAs($this->superAdmin)->getJson(route('platform.tenants.data'));

        $response->assertOk();
        $response->assertJsonStructure([
            'data',
            'recordsTotal',
            'recordsFiltered',
        ]);
        $this->assertGreaterThanOrEqual(2, count($response->json('data')));
    }

    public function test_superadmin_can_view_user_detail_with_memberships_and_activity(): void
    {
        $response = $this->actingAs($this->superAdmin)->getJson(route('platform.users.show', $this->teacher->id));

        $response->assertOk();
        $response->assertJsonStructure([
            'user' => ['id', 'name', 'email', 'status', 'is_superadmin'],
            'memberships',
            'recent_activity',
        ]);
    }

    public function test_superadmin_can_suspend_user_with_recorded_reason(): void
    {
        $response = $this->actingAs($this->superAdmin)->post(route('platform.users.suspend', $this->teacher->id), [
            'reason' => 'Violation of academic integrity terms',
        ]);

        $response->assertRedirect();
        $this->teacher->refresh();

        $this->assertEquals(UserStatus::Suspended, $this->teacher->status);
        $this->assertEquals('Violation of academic integrity terms', $this->teacher->suspension_reason);
        $this->assertNotNull($this->teacher->suspended_at);
    }

    public function test_superadmin_cannot_suspend_another_superadmin(): void
    {
        $anotherAdmin = User::factory()->create(['status' => UserStatus::Active]);
        setPermissionsTeamId(null);
        $anotherAdmin->assignRole('SuperAdmin');

        $response = $this->actingAs($this->superAdmin)->post(route('platform.users.suspend', $anotherAdmin->id), [
            'reason' => 'Unauthorized attempt',
        ]);

        $response->assertSessionHasErrors('user');
        $anotherAdmin->refresh();
        $this->assertEquals(UserStatus::Active, $anotherAdmin->status);
    }

    public function test_superadmin_can_reactivate_suspended_user(): void
    {
        $this->teacher->update([
            'status' => UserStatus::Suspended,
            'suspension_reason' => 'Temporary investigation',
            'suspended_at' => now(),
        ]);

        $response = $this->actingAs($this->superAdmin)->post(route('platform.users.activate', $this->teacher->id));

        $response->assertRedirect();
        $this->teacher->refresh();

        $this->assertEquals(UserStatus::Active, $this->teacher->status);
    }

    public function test_superadmin_can_dispatch_password_reset_for_user(): void
    {
        Notification::fake();

        $response = $this->actingAs($this->superAdmin)->post(route('platform.users.reset-password', $this->teacher->id));

        $response->assertRedirect();
        $response->assertSessionHas('success');
    }

    public function test_superadmin_can_create_workspace(): void
    {
        $response = $this->actingAs($this->superAdmin)->post(route('platform.tenants.store'), [
            'name' => 'Mathematics Department',
            'type' => 'personal',
            'owner_id' => $this->teacher->id,
            'plan_name' => 'Department Pro',
            'scans_limit' => 5000,
            'exams_limit' => 50,
        ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('tenants', [
            'name' => 'Mathematics Department',
            'owner_id' => $this->teacher->id,
        ]);
    }

    public function test_superadmin_can_update_workspace(): void
    {
        $response = $this->actingAs($this->superAdmin)->patch(route('platform.tenants.update', $this->personalTenant->ulid), [
            'name' => 'Renamed Workspace',
            'type' => 'personal',
            'status' => 'active',
            'owner_id' => $this->teacher->id,
        ]);

        $response->assertRedirect();
        $this->personalTenant->refresh();

        $this->assertEquals('Renamed Workspace', $this->personalTenant->name);
    }

    public function test_superadmin_can_manage_tenant_members(): void
    {
        $newMember = User::factory()->create();

        $addResponse = $this->actingAs($this->superAdmin)->post(route('platform.tenants.members.add', $this->personalTenant->ulid), [
            'user_id' => $newMember->id,
            'role' => 'Teacher',
        ]);
        $addResponse->assertRedirect();
        $this->assertTrue($this->personalTenant->hasMember($newMember));

        $updateRoleResponse = $this->actingAs($this->superAdmin)->patch(route('platform.tenants.members.update', [$this->personalTenant->ulid, $newMember->id]), [
            'role' => 'Instructor',
        ]);
        $updateRoleResponse->assertRedirect();

        $removeResponse = $this->actingAs($this->superAdmin)->delete(route('platform.tenants.members.remove', [$this->personalTenant->ulid, $newMember->id]));
        $removeResponse->assertRedirect();
        $this->assertFalse($this->personalTenant->hasMember($newMember));
    }

    public function test_superadmin_can_delete_workspace(): void
    {
        $response = $this->actingAs($this->superAdmin)->delete(route('platform.tenants.destroy', $this->personalTenant->ulid));

        $response->assertRedirect();
        $this->assertSoftDeleted('tenants', ['id' => $this->personalTenant->id]);
    }

    public function test_superadmin_can_export_tenants_csv(): void
    {
        $response = $this->actingAs($this->superAdmin)->get(route('platform.tenants.export'));

        $response->assertOk();
        $response->assertHeader('content-type', 'text/csv; charset=UTF-8');
    }

    public function test_superadmin_can_create_organization_and_departments(): void
    {
        $createOrgResponse = $this->actingAs($this->superAdmin)->post(route('platform.organizations.store'), [
            'name' => 'Surigao State College of Technology',
            'org_type' => 'College',
            'owner_id' => $this->teacher->id,
            'contact_person' => 'President',
            'contact_email' => 'pres@ssct.edu.ph',
            'is_verified' => true,
        ]);

        $createOrgResponse->assertRedirect();
        $createdOrg = Tenant::where('name', 'Surigao State College of Technology')->first();
        $this->assertNotNull($createdOrg);
        $this->assertTrue($createdOrg->isVerifiedInstitution());

        $addDeptResponse = $this->actingAs($this->superAdmin)->post(route('platform.organizations.departments.store', $createdOrg->ulid), [
            'name' => 'College of Information Technology',
            'code' => 'CIT',
        ]);
        $addDeptResponse->assertRedirect();

        $dept = Department::where('tenant_id', $createdOrg->id)->where('code', 'CIT')->first();
        $this->assertNotNull($dept);

        $deleteDeptResponse = $this->actingAs($this->superAdmin)->delete(route('platform.organizations.departments.destroy', [$createdOrg->ulid, $dept->id]));
        $deleteDeptResponse->assertRedirect();
        $this->assertDatabaseMissing('departments', ['id' => $dept->id]);
    }

    public function test_superadmin_can_create_and_cancel_subscription(): void
    {
        $assignResponse = $this->actingAs($this->superAdmin)->post(route('platform.subscriptions.store'), [
            'tenant_id' => $this->personalTenant->id,
            'plan_name' => 'Campus Unlimited',
            'billing_cycle' => 'yearly',
            'status' => 'active',
            'scans_limit' => 50000,
            'exams_limit' => 500,
            'members_limit' => 200,
        ]);

        $assignResponse->assertRedirect();
        $this->personalTenant->refresh();
        $sub = $this->personalTenant->subscription;
        $this->assertEquals('Campus Unlimited', $sub->plan_name);
        $this->assertEquals(50000, $sub->scans_limit);

        $cancelResponse = $this->actingAs($this->superAdmin)->post(route('platform.subscriptions.cancel', $sub->id));
        $cancelResponse->assertRedirect();
        $sub->refresh();
        $this->assertEquals('canceled', $sub->status);
    }

    public function test_superadmin_can_access_monitoring_telemetry(): void
    {
        $response = $this->actingAs($this->superAdmin)->get(route('platform.monitoring'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Platform/Monitoring')
            ->has('system_specs')
            ->has('server_metrics')
            ->has('table_stats')
            ->has('recent_logs')
        );
    }

    public function test_superadmin_can_trigger_operational_cache_purges(): void
    {
        $clearCacheResponse = $this->actingAs($this->superAdmin)->post(route('platform.monitoring.clear-cache'));
        $clearCacheResponse->assertRedirect();

        $clearConfigResponse = $this->actingAs($this->superAdmin)->post(route('platform.monitoring.clear-config'));
        $clearConfigResponse->assertRedirect();

        $clearRoutesResponse = $this->actingAs($this->superAdmin)->post(route('platform.monitoring.clear-routes'));
        $clearRoutesResponse->assertRedirect();

        $clearViewsResponse = $this->actingAs($this->superAdmin)->post(route('platform.monitoring.clear-views'));
        $clearViewsResponse->assertRedirect();

        $optimizeResponse = $this->actingAs($this->superAdmin)->post(route('platform.monitoring.optimize'));
        $optimizeResponse->assertRedirect();

        $clearLogsResponse = $this->actingAs($this->superAdmin)->post(route('platform.monitoring.clear-logs'));
        $clearLogsResponse->assertRedirect();
    }
}
