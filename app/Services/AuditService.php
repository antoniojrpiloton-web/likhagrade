<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Arr;

class AuditService
{
    protected array $redactedKeys = [
        'password',
        'password_confirmation',
        'remember_token',
        'token',
        'secret',
        'api_key',
    ];

    public function log(
        string $action,
        string $description,
        ?Model $subject = null,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?Tenant $tenant = null,
        ?User $user = null,
    ): AuditLog {
        $tenantId = $tenant?->id ?? app(TenantContext::class)->id();
        $userId = $user?->id ?? auth()->id();

        return AuditLog::create([
            'tenant_id' => $tenantId,
            'user_id' => $userId,
            'action' => $action,
            'subject_type' => $subject ? get_class($subject) : null,
            'subject_id' => $subject ? (string) $subject->getKey() : null,
            'description' => $description,
            'old_values' => $oldValues ? $this->sanitizeValues($oldValues) : null,
            'new_values' => $newValues ? $this->sanitizeValues($newValues) : null,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'created_at' => now(),
        ]);
    }

    protected function sanitizeValues(array $values): array
    {
        return Arr::map($values, function ($value, $key) {
            if (in_array(strtolower($key), $this->redactedKeys, true)) {
                return '[REDACTED]';
            }

            if (is_array($value)) {
                return $this->sanitizeValues($value);
            }

            return $value;
        });
    }
}
