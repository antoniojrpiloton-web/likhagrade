<?php

namespace App\Enums;

enum TenantType: string
{
    case Personal = 'personal';
    case Organization = 'organization';

    public function label(): string
    {
        return match ($this) {
            self::Personal => 'Personal Workspace',
            self::Organization => 'Organization',
        };
    }
}
