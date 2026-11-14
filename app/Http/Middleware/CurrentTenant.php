<?php

namespace App\Http\Middleware;

use App\Enums\TenantStatus;
use App\Models\Tenant;
use App\Services\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CurrentTenant
{
    public function __construct(
        protected TenantContext $tenantContext
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return $next($request);
        }

        $tenant = null;
        $headerTenantId = $request->header('X-Tenant-Id');
        $headerTenantUlid = $request->header('X-Tenant-ULID');

        if ($headerTenantId) {
            $candidate = Tenant::where('id', $headerTenantId)->first();
            if ($candidate && ($user->isSuperAdmin() || $user->hasAccessToTenant($candidate))) {
                $tenant = $candidate;
            }
        } elseif ($headerTenantUlid) {
            $candidate = Tenant::where('ulid', $headerTenantUlid)->first();
            if ($candidate && ($user->isSuperAdmin() || $user->hasAccessToTenant($candidate))) {
                $tenant = $candidate;
            }
        }

        if (! $tenant && $request->hasSession()) {
            $sessionTenantId = $request->session()->get('active_tenant_id');
            if ($sessionTenantId) {
                $candidate = Tenant::where('id', $sessionTenantId)->first();
                if ($candidate && ($user->isSuperAdmin() || $user->hasAccessToTenant($candidate))) {
                    $tenant = $candidate;
                } else {
                    $request->session()->forget('active_tenant_id');
                }
            }
        }

        if (! $tenant || $tenant->isSuspended() || $tenant->isInactive()) {
            $activeTenant = $user->tenants()
                ->where('tenants.status', TenantStatus::Active)
                ->where('tenant_user.status', 'active')
                ->first();

            if ($activeTenant) {
                $tenant = $activeTenant;
                if ($request->hasSession()) {
                    $request->session()->put('active_tenant_id', $tenant->id);
                }
            } elseif (! $tenant) {
                $tenant = $user->personalTenant();
                if ($tenant && $request->hasSession()) {
                    $request->session()->put('active_tenant_id', $tenant->id);
                }
            }
        }

        if ($tenant) {
            if ($tenant->isSuspended() && ! $user->isSuperAdmin()) {
                abort(403, 'Your workspace has been suspended. Please contact support.');
            }

            if ($tenant->isInactive() && ! $user->isSuperAdmin()) {
                abort(403, 'This workspace is currently inactive.');
            }

            $this->tenantContext->set($tenant);
        }

        return $next($request);
    }
}
