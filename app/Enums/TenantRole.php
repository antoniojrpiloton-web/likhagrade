<?php

namespace App\Enums;

enum TenantRole: string
{
    // Individual Tenant Roles
    case Owner = 'Owner';
    case Teacher = 'Teacher';

    // Organization Tenant Roles
    case OrganizationOwner = 'Organization Owner';
    case OrganizationAdmin = 'Organization Admin';
    case DepartmentAdmin = 'Department Admin';
    case Instructor = 'Instructor';

    // Legacy/compatibility
    case Admin = 'Admin';

    public function label(): string
    {
        return match ($this) {
            self::Owner => 'Workspace Owner',
            self::OrganizationOwner => 'Institution Owner',
            self::OrganizationAdmin => 'Institution Admin',
            self::DepartmentAdmin => 'Department Admin',
            self::Teacher => 'Teacher',
            self::Instructor => 'Instructor',
            self::Admin => 'Admin',
        };
    }

    public static function forIndividual(): array
    {
        return [
            self::Owner,
            self::Teacher,
        ];
    }

    public static function forOrganization(): array
    {
        return [
            self::OrganizationOwner,
            self::OrganizationAdmin,
            self::DepartmentAdmin,
            self::Teacher,
            self::Instructor,
        ];
    }
}
