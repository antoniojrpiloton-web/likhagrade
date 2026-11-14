<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WorkspaceController extends Controller
{
    public function __construct(
        protected TenantContext $tenantContext
    ) {}

    public function show(Request $request): JsonResponse
    {
        $tenant = $this->tenantContext->get();

        if (! $tenant) {
            return response()->json([
                'message' => 'No active workspace found for user.',
            ], 404);
        }

        $subscription = $tenant->subscription;

        return response()->json([
            'workspace' => [
                'id' => $tenant->id,
                'ulid' => $tenant->ulid,
                'name' => $tenant->name,
                'type' => $tenant->type?->value ?? 'personal',
                'status' => $tenant->status?->value ?? 'active',
                'is_verified' => (bool) $tenant->is_verified_institution,
            ],
            'scans' => [
                'used' => $subscription?->scans_used ?? 0,
                'limit' => $subscription?->scans_limit ?? 100,
                'remaining' => max(0, ($subscription?->scans_limit ?? 100) - ($subscription?->scans_used ?? 0)),
            ],
            'features' => [
                'quick_scan_enabled' => true,
                'academic_management_optional' => true,
            ],
        ]);
    }
}
