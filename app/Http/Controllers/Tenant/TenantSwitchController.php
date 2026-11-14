<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Services\AuditService;
use App\Services\TenantContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class TenantSwitchController extends Controller
{
    public function __construct(
        protected TenantContext $tenantContext,
        protected AuditService $auditService
    ) {}

    public function switch(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'tenant_id' => ['required', 'integer', 'exists:tenants,id'],
        ]);

        $user = $request->user();
        $targetTenant = Tenant::findOrFail($validated['tenant_id']);

        if (! $user->hasAccessToTenant($targetTenant)) {
            abort(403, 'Unauthorized access to requested workspace.');
        }

        if ($targetTenant->isSuspended()) {
            return back()->with('error', 'Cannot switch to a suspended workspace.');
        }

        if ($targetTenant->isInactive()) {
            return back()->with('error', 'Cannot switch to an inactive workspace.');
        }

        $request->session()->put('active_tenant_id', $targetTenant->id);
        $this->tenantContext->set($targetTenant);

        $this->auditService->log(
            action: 'tenant.switched',
            description: "Switched active workspace to \"{$targetTenant->name}\"",
            subject: $targetTenant,
            tenant: $targetTenant,
            user: $user
        );

        return redirect()->route('app.dashboard')->with('success', "Switched to workspace {$targetTenant->name}");
    }
}
