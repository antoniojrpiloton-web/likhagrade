<?php

namespace Tests\Feature\MultiTenancy;

use App\Actions\Auth\RegisterUserAction;
use App\Actions\Organization\InviteTeacherAction;
use App\Actions\Organization\RegisterOrganizationAction;
use App\Enums\TenantRole;
use App\Enums\TenantType;
use App\Enums\UserStatus;
use App\Models\Department;
use App\Models\Tenant;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DualModeOrganizationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_organization_registration_creates_org_tenant_with_owner_and_trial_subscription(): void
    {
        $response = $this->post(route('organization.register.store'), [
            'org_name' => 'Surigao del Norte State University',
            'org_type' => 'University',
            'contact_person' => 'Dr. Gregorio Gamboa',
            'contact_email' => 'president@snsu.edu.ph',
            'contact_number' => '+63 86 826 0134',
            'address' => 'Narciso St., Surigao City, Philippines',
            'first_name' => 'Gregorio',
            'last_name' => 'Gamboa',
            'email' => 'dr.gamboa@gmail.com',
            'password' => 'SecurePass123!',
            'password_confirmation' => 'SecurePass123!',
            'terms' => true,
        ]);

        $response->assertRedirect(route('app.dashboard'));

        $this->assertDatabaseHas('tenants', [
            'name' => 'Surigao del Norte State University',
            'type' => TenantType::Organization->value,
            'org_type' => 'University',
            'contact_email' => 'president@snsu.edu.ph',
        ]);

        $tenant = Tenant::where('name', 'Surigao del Norte State University')->first();
        $this->assertNotNull($tenant);

        $user = User::where('email', 'dr.gamboa@gmail.com')->first();
        $this->assertNotNull($user);
        $this->assertEquals($user->id, $tenant->owner_id);

        // Verify role
        $this->assertTrue($user->hasTenantRole($tenant, TenantRole::OrganizationOwner));

        // Verify subscription belongs to tenant
        $subscription = $tenant->subscription;
        $this->assertNotNull($subscription);
        $this->assertEquals('Institutional Trial', $subscription->plan_name);
        $this->assertEquals(5000, $subscription->scans_limit);
        $this->assertEquals(50, $subscription->members_limit);
        $this->assertEquals($tenant->id, $subscription->tenant_id);
    }

    public function test_existing_teacher_can_register_organization_and_maintain_both_workspaces(): void
    {
        $registerUser = app(RegisterUserAction::class);
        $teacher = $registerUser->execute([
            'first_name' => 'Maria',
            'last_name' => 'Santos',
            'email' => 'maria.santos@gmail.com',
            'password' => 'Secret123!',
        ]);
        $teacher->markEmailAsVerified();

        $personalTenant = $teacher->personalTenant();
        $this->assertNotNull($personalTenant);

        $this->actingAs($teacher);

        $response = $this->post(route('organization.register.store'), [
            'org_name' => 'St. Paul College Surigao',
            'org_type' => 'College',
            'contact_person' => 'Maria Santos',
            'contact_email' => 'admin@spcs.edu.ph',
        ]);

        $response->assertRedirect(route('app.dashboard'));

        $orgTenant = Tenant::where('name', 'St. Paul College Surigao')->first();
        $this->assertNotNull($orgTenant);

        // Teacher is a member in both workspaces
        $this->assertTrue($personalTenant->hasMember($teacher));
        $this->assertTrue($orgTenant->hasMember($teacher));

        // Switch to personal workspace
        $switchPersonal = $this->post(route('app.tenant.switch'), [
            'tenant_id' => $personalTenant->id,
        ]);
        $switchPersonal->assertRedirect(route('app.dashboard'));
        $this->assertEquals($personalTenant->id, session('active_tenant_id'));

        // Switch back to organization workspace
        $switchOrg = $this->post(route('app.tenant.switch'), [
            'tenant_id' => $orgTenant->id,
        ]);
        $switchOrg->assertRedirect(route('app.dashboard'));
        $this->assertEquals($orgTenant->id, session('active_tenant_id'));
    }

    public function test_organization_admin_can_invite_teacher_with_assigned_role(): void
    {
        $registerOrg = app(RegisterOrganizationAction::class);
        $result = $registerOrg->execute([
            'org_name' => 'SNSU Main Campus',
            'org_type' => 'University',
            'contact_person' => 'Dean Lead',
            'contact_email' => 'dean@snsu.edu.ph',
            'first_name' => 'Dean',
            'last_name' => 'Lead',
            'email' => 'dean.lead@gmail.com',
            'password' => 'Secret123!',
        ]);

        $admin = $result['user'];
        $admin->markEmailAsVerified();
        $tenant = $result['tenant'];

        // Create department
        $department = $tenant->departments()->create([
            'name' => 'College of Computing',
            'code' => 'CC',
        ]);

        $this->actingAs($admin)
            ->withSession(['active_tenant_id' => $tenant->id]);

        $response = $this->post(route('app.organization.invite'), [
            'email' => 'prof.alan@yahoo.com',
            'role' => 'Teacher',
            'department_id' => $department->id,
        ]);

        $response->assertSessionHas('success');

        $this->assertDatabaseHas('tenant_invitations', [
            'tenant_id' => $tenant->id,
            'department_id' => $department->id,
            'email' => 'prof.alan@yahoo.com',
            'role' => 'Teacher',
            'status' => 'pending',
        ]);
    }

    public function test_invited_teacher_accepts_invitation_and_shares_organization_subscription_without_duplicate_billing(): void
    {
        $registerOrg = app(RegisterOrganizationAction::class);
        $orgResult = $registerOrg->execute([
            'org_name' => 'SNSU Main Campus',
            'org_type' => 'University',
            'contact_person' => 'Dean Lead',
            'contact_email' => 'dean@snsu.edu.ph',
            'first_name' => 'Dean',
            'last_name' => 'Lead',
            'email' => 'dean.lead@gmail.com',
            'password' => 'Secret123!',
        ]);

        $admin = $orgResult['user'];
        $tenant = $orgResult['tenant'];

        $inviteAction = app(InviteTeacherAction::class);
        $invitation = $inviteAction->execute(
            tenant: $tenant,
            inviter: $admin,
            email: 'invited.instructor@gmail.com',
            role: 'Instructor'
        );

        // Teacher accepts invitation as new user
        $response = $this->post(route('invitations.accept', $invitation->token), [
            'first_name' => 'Alan',
            'last_name' => 'Turing',
            'password' => 'Secret123!',
            'password_confirmation' => 'Secret123!',
            'terms' => true,
        ]);

        $response->assertRedirect(route('app.dashboard'));

        $teacher = User::where('email', 'invited.instructor@gmail.com')->first();
        $this->assertNotNull($teacher);

        // Teacher has Instructor role in SNSU
        $this->assertTrue($teacher->hasTenantRole($tenant, TenantRole::Instructor));

        // Teacher belongs to organization
        $this->assertTrue($tenant->hasMember($teacher));

        // Crucial requirement: No separate user subscription created!
        // Subscriptions belong to tenants, not individual users.
        $this->assertEquals(1, $tenant->subscription()->count());
    }

    public function test_organization_admin_can_manage_departments_and_assign_faculty(): void
    {
        $registerOrg = app(RegisterOrganizationAction::class);
        $result = $registerOrg->execute([
            'org_name' => 'SNSU Main Campus',
            'org_type' => 'University',
            'contact_person' => 'Dean Lead',
            'contact_email' => 'dean@snsu.edu.ph',
            'first_name' => 'Dean',
            'last_name' => 'Lead',
            'email' => 'dean.lead@gmail.com',
            'password' => 'Secret123!',
        ]);

        $admin = $result['user'];
        $admin->markEmailAsVerified();
        $tenant = $result['tenant'];

        $this->actingAs($admin)->withSession(['active_tenant_id' => $tenant->id]);

        // Create department
        $createDeptResponse = $this->post(route('app.departments.store'), [
            'name' => 'College of Engineering',
            'code' => 'COE',
            'description' => 'Engineering and Architecture Division',
        ]);

        $createDeptResponse->assertSessionHas('success');

        $dept = Department::where('name', 'College of Engineering')->first();
        $this->assertNotNull($dept);
        $this->assertEquals($tenant->id, $dept->tenant_id);

        // Assign admin as Department Admin
        $assignResponse = $this->post(route('app.departments.assign', $dept->id), [
            'user_id' => $admin->id,
            'role' => 'Department Admin',
        ]);

        $assignResponse->assertSessionHas('success');
        $this->assertTrue($dept->users()->where('users.id', $admin->id)->exists());
    }

    public function test_superadmin_can_distinguish_individual_vs_organization_customers_in_datatable(): void
    {
        // 1. Create personal workspace
        $registerUser = app(RegisterUserAction::class);
        $registerUser->execute([
            'first_name' => 'Individual',
            'last_name' => 'Teacher',
            'email' => 'individual@gmail.com',
            'password' => 'Secret123!',
        ]);

        // 2. Create organization workspace
        $registerOrg = app(RegisterOrganizationAction::class);
        $registerOrg->execute([
            'org_name' => 'SNSU University System',
            'org_type' => 'University',
            'contact_person' => 'President',
            'contact_email' => 'president@snsu.edu.ph',
            'first_name' => 'Org',
            'last_name' => 'Owner',
            'email' => 'orgowner@gmail.com',
            'password' => 'Secret123!',
        ]);

        // 3. Create SuperAdmin
        $superadmin = User::factory()->create([
            'email' => 'dytech98@gmail.com',
            'status' => UserStatus::Active,
        ]);
        $superadmin->markEmailAsVerified();
        setPermissionsTeamId(null);
        $superadmin->assignRole('SuperAdmin');

        $this->actingAs($superadmin);

        $response = $this->getJson(route('platform.tenants.data'));

        $response->assertOk();
        $response->assertJsonStructure([
            'data',
            'recordsTotal',
            'recordsFiltered',
        ]);

        $data = $response->json('data');
        $this->assertGreaterThanOrEqual(2, count($data));

        $types = collect($data)->pluck('customer_type.type')->all();
        $this->assertContains('personal', $types);
        $this->assertContains('organization', $types);
    }

    public function test_tenant_isolation_prevents_individual_workspace_from_inviting_or_creating_departments(): void
    {
        $registerUser = app(RegisterUserAction::class);
        $soloUser = $registerUser->execute([
            'first_name' => 'Solo',
            'last_name' => 'Teacher',
            'email' => 'solo@gmail.com',
            'password' => 'Secret123!',
        ]);
        $soloUser->markEmailAsVerified();

        $personalTenant = $soloUser->personalTenant();
        $this->assertNotNull($personalTenant);

        $this->actingAs($soloUser)->withSession(['active_tenant_id' => $personalTenant->id]);

        // Attempt to create department in personal workspace => 403 Forbidden
        $deptResponse = $this->post(route('app.departments.store'), [
            'name' => 'Illegal Dept',
            'code' => 'ILL',
        ]);
        $deptResponse->assertForbidden();

        // Attempt to send org invitation from personal workspace => 403 Forbidden
        $inviteResponse = $this->post(route('app.organization.invite'), [
            'email' => 'someone@gmail.com',
            'role' => 'Teacher',
        ]);
        $inviteResponse->assertForbidden();
    }
}
