<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        // Platform permissions
        $platformPermissions = [
            'platform.dashboard.view',
            'platform.users.view',
            'platform.users.manage',
            'platform.tenants.view',
            'platform.tenants.manage',
            'platform.analytics.view',
            'platform.audit_logs.view',
            'platform.settings.manage',
        ];

        // Tenant permissions
        $tenantPermissions = [
            'tenant.dashboard.view',
            'tenant.members.view',
            'tenant.members.manage',
            'tenant.departments.manage',
            'tenant.subscription.view',
            'tenant.subscription.manage',
            'tenant.invitations.manage',
            'tenant.settings.view',
            'tenant.settings.manage',
        ];

        // Future examination & scanning permissions
        $futurePermissions = [
            'examinations.view',
            'examinations.create',
            'examinations.update',
            'examinations.delete',
            'answer_keys.manage',
            'answer_sheets.generate',
            'scanning.perform',
            'scanning.review',
            'results.view',
            'results.manage',
            'reports.export',
        ];

        $allPermissions = array_merge($platformPermissions, $tenantPermissions, $futurePermissions);

        foreach ($allPermissions as $permissionName) {
            Permission::firstOrCreate([
                'name' => $permissionName,
                'guard_name' => 'web',
            ]);
        }

        // 1. Platform-level SuperAdmin Role
        setPermissionsTeamId(null);
        $superAdminRole = Role::firstOrCreate([
            'name' => 'SuperAdmin',
            'guard_name' => 'web',
            'tenant_id' => null,
        ]);
        $superAdminRole->syncPermissions($platformPermissions);

        // 2. Individual Workspace Roles
        $ownerRole = Role::firstOrCreate([
            'name' => 'Owner',
            'guard_name' => 'web',
            'tenant_id' => null,
        ]);
        $ownerRole->syncPermissions(array_merge($tenantPermissions, $futurePermissions));

        $adminRole = Role::firstOrCreate([
            'name' => 'Admin',
            'guard_name' => 'web',
            'tenant_id' => null,
        ]);
        $adminRole->syncPermissions(array_merge($tenantPermissions, $futurePermissions));

        // 3. Organization Workspace Roles
        $orgOwnerRole = Role::firstOrCreate([
            'name' => 'Organization Owner',
            'guard_name' => 'web',
            'tenant_id' => null,
        ]);
        $orgOwnerRole->syncPermissions(array_merge($tenantPermissions, $futurePermissions));

        $orgAdminRole = Role::firstOrCreate([
            'name' => 'Organization Admin',
            'guard_name' => 'web',
            'tenant_id' => null,
        ]);
        $orgAdminRole->syncPermissions(array_merge($tenantPermissions, $futurePermissions));

        $deptAdminRole = Role::firstOrCreate([
            'name' => 'Department Admin',
            'guard_name' => 'web',
            'tenant_id' => null,
        ]);
        $deptAdminRole->syncPermissions([
            'tenant.dashboard.view',
            'tenant.members.view',
            'examinations.view',
            'examinations.create',
            'examinations.update',
            'examinations.delete',
            'answer_keys.manage',
            'answer_sheets.generate',
            'scanning.perform',
            'scanning.review',
            'results.view',
            'results.manage',
            'reports.export',
        ]);

        $teacherRole = Role::firstOrCreate([
            'name' => 'Teacher',
            'guard_name' => 'web',
            'tenant_id' => null,
        ]);
        $teacherRole->syncPermissions([
            'tenant.dashboard.view',
            'examinations.view',
            'examinations.create',
            'examinations.update',
            'examinations.delete',
            'answer_keys.manage',
            'answer_sheets.generate',
            'scanning.perform',
            'scanning.review',
            'results.view',
            'results.manage',
            'reports.export',
        ]);

        $instructorRole = Role::firstOrCreate([
            'name' => 'Instructor',
            'guard_name' => 'web',
            'tenant_id' => null,
        ]);
        $instructorRole->syncPermissions([
            'tenant.dashboard.view',
            'examinations.view',
            'answer_sheets.generate',
            'scanning.perform',
            'scanning.review',
            'results.view',
        ]);
    }
}
