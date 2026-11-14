<?php

namespace Tests\Feature\Permissions;

use App\Actions\Auth\RegisterUserAction;
use App\Models\Tenant;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class RolesAndPermissionsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_expected_platform_and_tenant_roles_are_seeded(): void
    {
        $this->assertDatabaseHas('roles', ['name' => 'SuperAdmin']);
        $this->assertDatabaseHas('roles', ['name' => 'Admin']);
        $this->assertDatabaseHas('roles', ['name' => 'Teacher']);
        $this->assertDatabaseHas('roles', ['name' => 'Instructor']);

        // Check platform permissions
        $this->assertDatabaseHas('permissions', ['name' => 'platform.dashboard.view']);
        $this->assertDatabaseHas('permissions', ['name' => 'platform.users.manage']);
        $this->assertDatabaseHas('permissions', ['name' => 'platform.tenants.manage']);

        // Check tenant permissions
        $this->assertDatabaseHas('permissions', ['name' => 'tenant.dashboard.view']);
        $this->assertDatabaseHas('permissions', ['name' => 'tenant.members.manage']);
        $this->assertDatabaseHas('permissions', ['name' => 'tenant.settings.manage']);

        // Check future modules permissions
        $this->assertDatabaseHas('permissions', ['name' => 'examinations.view']);
        $this->assertDatabaseHas('permissions', ['name' => 'scanning.perform']);
        $this->assertDatabaseHas('permissions', ['name' => 'results.view']);
    }

    public function test_tenant_admin_receives_tenant_permissions(): void
    {
        $adminRole = Role::where('name', 'Admin')->first();

        $this->assertTrue($adminRole->hasPermissionTo('tenant.dashboard.view'));
        $this->assertTrue($adminRole->hasPermissionTo('tenant.members.manage'));
        $this->assertTrue($adminRole->hasPermissionTo('tenant.settings.manage'));
        $this->assertFalse($adminRole->hasPermissionTo('platform.users.manage'));
    }

    public function test_tenant_teacher_has_restricted_permissions(): void
    {
        $teacherRole = Role::where('name', 'Teacher')->first();

        $this->assertTrue($teacherRole->hasPermissionTo('tenant.dashboard.view'));
        $this->assertTrue($teacherRole->hasPermissionTo('examinations.create'));
        $this->assertFalse($teacherRole->hasPermissionTo('tenant.members.manage'));
        $this->assertFalse($teacherRole->hasPermissionTo('platform.dashboard.view'));
    }

    public function test_ordinary_teacher_cannot_escalate_to_superadmin(): void
    {
        $registerAction = app(RegisterUserAction::class);
        $teacher = $registerAction->execute([
            'first_name' => 'Jane',
            'last_name' => 'Doe',
            'email' => 'jane.doe@example.com',
            'password' => 'Pass12345!',
        ]);

        $this->assertFalse($teacher->isSuperAdmin());

        // Verify that assigning a tenant-level role does not grant SuperAdmin privileges
        $workspace = $teacher->personalTenant();
        setPermissionsTeamId($workspace->id);
        $teacher->assignRole('Admin');

        $this->assertFalse($teacher->isSuperAdmin());
    }
}
