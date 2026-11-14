<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use App\Services\TenantContext;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $user = $request->user();
        $tenantContext = app(TenantContext::class);
        $currentTenant = $tenantContext->get();

        $userTenants = [];
        $currentTenantData = null;

        if ($user) {
            $userTenants = $user->tenants()
                ->where('tenants.status', 'active')
                ->where('tenant_user.status', 'active')
                ->select(['tenants.id', 'tenants.ulid', 'tenants.name', 'tenants.slug', 'tenants.type', 'tenants.org_type'])
                ->get()
                ->map(fn (Tenant $t) => [
                    'id' => $t->id,
                    'ulid' => $t->ulid,
                    'name' => $t->name,
                    'slug' => $t->slug,
                    'type' => $t->type?->value ?? 'personal',
                    'org_type' => $t->org_type,
                    'role' => $user->roleInTenant($t),
                    'is_current' => $currentTenant && $currentTenant->id === $t->id,
                ]);

            if ($currentTenant) {
                $sub = $currentTenant->subscription()->first();
                $departments = $currentTenant->departments()->select(['id', 'name', 'code'])->get();

                $currentTenantData = [
                    'id' => $currentTenant->id,
                    'ulid' => $currentTenant->ulid,
                    'name' => $currentTenant->name,
                    'slug' => $currentTenant->slug,
                    'type' => $currentTenant->type?->value ?? 'personal',
                    'org_type' => $currentTenant->org_type,
                    'is_verified_institution' => $currentTenant->isVerifiedInstitution(),
                    'verification_status' => $currentTenant->verification_status ?? 'pending',
                    'status' => $currentTenant->status?->value ?? 'active',
                    'role' => $user->roleInTenant($currentTenant),
                    'is_owner' => $currentTenant->owner_id === $user->id,
                    'subscription' => $sub ? [
                        'plan_name' => $sub->plan_name,
                        'status' => $sub->status,
                        'scans_used' => $sub->scans_used,
                        'scans_limit' => $sub->scans_limit,
                        'exams_used' => $sub->exams_used,
                        'exams_limit' => $sub->exams_limit,
                        'members_limit' => $sub->members_limit,
                    ] : null,
                    'departments' => $departments,
                ];
            }
        }

        return [
            ...parent::share($request),
            'appName' => config('app.name', 'LikhaGrade'),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'first_name' => $user->first_name,
                    'last_name' => $user->last_name,
                    'name' => $user->name,
                    'email' => $user->email,
                    'email_verified_at' => $user->email_verified_at?->toISOString(),
                    'is_verified' => $user->hasVerifiedEmail(),
                    'theme_preference' => $user->theme_preference ?? 'light',
                    'is_superadmin' => $user->isSuperAdmin(),
                ] : null,
                'tenant' => $currentTenantData,
                'user_tenants' => $userTenants,
                'impersonator' => $request->session()->has('impersonator_id') ? [
                    'id' => $request->session()->get('impersonator_id'),
                    'name' => $request->session()->get('impersonator_name'),
                ] : null,
            ],
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
                'info' => $request->session()->get('info'),
            ],
        ];
    }
}
