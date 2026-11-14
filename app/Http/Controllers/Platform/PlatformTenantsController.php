<?php

namespace App\Http\Controllers\Platform;

use App\Actions\Platform\ActivateTenantAction;
use App\Actions\Platform\SuspendTenantAction;
use App\DataTables\TenantsDataTable;
use App\Enums\TenantRole;
use App\Enums\TenantStatus;
use App\Enums\TenantType;
use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Tenant;
use App\Models\User;
use App\Services\AuditService;
use App\Services\PlatformDashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PlatformTenantsController extends Controller
{
    public function __construct(
        protected AuditService $auditService,
        protected SuspendTenantAction $suspendTenantAction,
        protected ActivateTenantAction $activateTenantAction,
        protected PlatformDashboardService $dashboardService
    ) {}

    public function index(): Response
    {
        $usersList = User::select(['id', 'name', 'email'])
            ->orderBy('name')
            ->get();

        return Inertia::render('Platform/Tenants', [
            'users_list' => $usersList,
        ]);
    }

    public function data(Request $request, TenantsDataTable $dataTable): JsonResponse
    {
        return $dataTable->render($request);
    }

    public function show(Tenant $tenant): JsonResponse
    {
        $tenant->load([
            'owner:id,name,email',
            'subscription',
            'departments.members:id,name,email',
            'members' => function ($query) {
                $query->select('users.id', 'users.name', 'users.email', 'users.status')
                    ->withPivot('membership_role', 'status', 'joined_at');
            },
        ]);

        $recentActivity = AuditLog::where('tenant_id', $tenant->id)
            ->with('user:id,name,email')
            ->latest('created_at')
            ->take(10)
            ->get()
            ->map(fn ($log) => [
                'id' => $log->id,
                'action' => $log->action,
                'description' => $log->description,
                'user' => $log->user ? $log->user->name : 'System',
                'created_at' => $log->created_at->format('M d, Y H:i:s'),
                'time_ago' => $log->created_at->diffForHumans(),
            ]);

        $members = $tenant->members->map(fn ($user) => [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'status' => $user->status?->value ?? 'active',
            'membership_role' => $user->pivot->membership_role,
            'membership_status' => $user->pivot->status,
            'joined_at' => $user->pivot->joined_at ? $user->pivot->joined_at->format('M d, Y') : null,
        ]);

        $departments = $tenant->departments->map(fn ($dept) => [
            'id' => $dept->id,
            'name' => $dept->name,
            'code' => $dept->code,
            'members_count' => $dept->members->count(),
        ]);

        return response()->json([
            'tenant' => [
                'id' => $tenant->id,
                'ulid' => $tenant->ulid,
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'type' => $tenant->type?->value ?? 'personal',
                'org_type' => $tenant->org_type,
                'status' => $tenant->status?->value ?? 'active',
                'suspension_reason' => $tenant->suspension_reason,
                'suspended_at' => $tenant->suspended_at ? $tenant->suspended_at->format('M d, Y H:i') : null,
                'is_verified_institution' => $tenant->isVerifiedInstitution(),
                'verification_status' => $tenant->verification_status,
                'contact_person' => $tenant->contact_person,
                'contact_email' => $tenant->contact_email,
                'contact_number' => $tenant->contact_number,
                'address' => $tenant->address,
                'created_at' => $tenant->created_at->format('M d, Y H:i'),
                'owner' => $tenant->owner ? [
                    'id' => $tenant->owner->id,
                    'name' => $tenant->owner->name,
                    'email' => $tenant->owner->email,
                ] : null,
            ],
            'subscription' => $tenant->subscription,
            'members' => $members,
            'departments' => $departments,
            'recent_activity' => $recentActivity,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:190'],
            'type' => ['required', Rule::in(['personal', 'organization'])],
            'owner_id' => ['required', 'exists:users,id'],
            'org_type' => ['nullable', 'string', 'max:100'],
            'contact_person' => ['nullable', 'string', 'max:100'],
            'contact_email' => ['nullable', 'email', 'max:190'],
            'plan_name' => ['nullable', 'string', 'max:100'],
            'scans_limit' => ['nullable', 'integer', 'min:0'],
            'exams_limit' => ['nullable', 'integer', 'min:0'],
        ]);

        $actor = $request->user();

        $tenant = DB::transaction(function () use ($validated, $actor) {
            $owner = User::findOrFail($validated['owner_id']);

            $tenant = Tenant::create([
                'name' => $validated['name'],
                'type' => TenantType::from($validated['type']),
                'org_type' => $validated['org_type'] ?? null,
                'contact_person' => $validated['contact_person'] ?? $owner->name,
                'contact_email' => $validated['contact_email'] ?? $owner->email,
                'owner_id' => $owner->id,
                'status' => TenantStatus::Active,
                'is_verified_institution' => $validated['type'] === 'organization',
                'verification_status' => $validated['type'] === 'organization' ? 'verified' : 'pending',
            ]);

            $role = $validated['type'] === 'organization'
                ? TenantRole::OrganizationOwner->value
                : TenantRole::Owner->value;

            $tenant->members()->attach($owner->id, [
                'membership_role' => $role,
                'status' => 'active',
                'joined_at' => now(),
            ]);

            Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
            setPermissionsTeamId($tenant->id);
            $owner->assignRole($role);

            $tenant->subscription()->create([
                'plan_name' => $validated['plan_name'] ?? ($tenant->isOrganization() ? 'Institutional Pro' : 'Educator Trial'),
                'billing_cycle' => 'monthly',
                'status' => 'active',
                'scans_limit' => $validated['scans_limit'] ?? ($tenant->isOrganization() ? 10000 : 1000),
                'scans_used' => 0,
                'exams_limit' => $validated['exams_limit'] ?? ($tenant->isOrganization() ? 100 : 25),
                'exams_used' => 0,
                'members_limit' => $tenant->isOrganization() ? 50 : 1,
                'starts_at' => now(),
            ]);

            $this->auditService->log(
                action: 'platform.tenant_created',
                description: "Created workspace \"{$tenant->name}\" ({$tenant->type->value})",
                subject: $tenant,
                newValues: ['name' => $tenant->name, 'type' => $tenant->type->value, 'owner_id' => $owner->id],
                tenant: $tenant,
                user: $actor
            );

            return $tenant;
        });

        $this->dashboardService->clearCache();

        return back()->with('success', "Workspace \"{$tenant->name}\" created successfully.");
    }

    public function update(Request $request, Tenant $tenant): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:190'],
            'type' => ['required', Rule::in(['personal', 'organization'])],
            'status' => ['required', Rule::in(['active', 'suspended', 'inactive'])],
            'suspension_reason' => ['nullable', 'string', 'max:500'],
            'org_type' => ['nullable', 'string', 'max:100'],
            'contact_person' => ['nullable', 'string', 'max:100'],
            'contact_email' => ['nullable', 'email', 'max:190'],
            'contact_number' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:500'],
            'owner_id' => ['required', 'exists:users,id'],
        ]);

        $actor = $request->user();

        $oldValues = [
            'name' => $tenant->name,
            'type' => $tenant->type->value,
            'status' => $tenant->status->value,
            'owner_id' => $tenant->owner_id,
        ];

        $tenant->update([
            'name' => $validated['name'],
            'type' => TenantType::from($validated['type']),
            'status' => TenantStatus::from($validated['status']),
            'suspension_reason' => $validated['status'] === 'suspended' ? ($validated['suspension_reason'] ?? $tenant->suspension_reason) : null,
            'suspended_at' => $validated['status'] === 'suspended' ? ($tenant->suspended_at ?? now()) : null,
            'org_type' => $validated['org_type'] ?? null,
            'contact_person' => $validated['contact_person'] ?? null,
            'contact_email' => $validated['contact_email'] ?? null,
            'contact_number' => $validated['contact_number'] ?? null,
            'address' => $validated['address'] ?? null,
            'owner_id' => $validated['owner_id'],
        ]);

        $this->auditService->log(
            action: 'platform.tenant_updated',
            description: "Updated workspace details for \"{$tenant->name}\"",
            subject: $tenant,
            oldValues: $oldValues,
            newValues: $validated,
            tenant: $tenant,
            user: $actor
        );

        $this->dashboardService->clearCache();

        return back()->with('success', "Workspace \"{$tenant->name}\" updated successfully.");
    }

    public function destroy(Request $request, Tenant $tenant): RedirectResponse
    {
        $actor = $request->user();
        $name = $tenant->name;

        $tenant->delete();

        $this->auditService->log(
            action: 'platform.tenant_deleted',
            description: "Deleted workspace \"{$name}\"",
            subject: $tenant,
            user: $actor
        );

        $this->dashboardService->clearCache();

        return back()->with('success', "Workspace \"{$name}\" has been removed.");
    }

    public function addMember(Request $request, Tenant $tenant): RedirectResponse
    {
        $validated = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'role' => ['required', 'string'],
        ]);

        $user = User::findOrFail($validated['user_id']);

        if ($tenant->hasMember($user)) {
            return back()->with('error', 'User is already an enrolled member of this workspace.');
        }

        $tenant->members()->attach($user->id, [
            'membership_role' => $validated['role'],
            'status' => 'active',
            'joined_at' => now(),
        ]);

        Role::firstOrCreate(['name' => $validated['role'], 'guard_name' => 'web']);
        setPermissionsTeamId($tenant->id);
        $user->assignRole($validated['role']);

        $this->auditService->log(
            action: 'platform.tenant_member_added',
            description: "SuperAdmin added {$user->email} to \"{$tenant->name}\" as {$validated['role']}",
            subject: $tenant,
            newValues: ['user_id' => $user->id, 'role' => $validated['role']],
            tenant: $tenant,
            user: $request->user()
        );

        return back()->with('success', "Added {$user->name} to workspace.");
    }

    public function updateMemberRole(Request $request, Tenant $tenant, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'role' => ['required', 'string'],
        ]);

        $tenant->members()->updateExistingPivot($user->id, [
            'membership_role' => $validated['role'],
        ]);

        Role::firstOrCreate(['name' => $validated['role'], 'guard_name' => 'web']);
        setPermissionsTeamId($tenant->id);
        $user->syncRoles([$validated['role']]);

        $this->auditService->log(
            action: 'platform.tenant_member_role_updated',
            description: "Updated {$user->email} role to {$validated['role']} in \"{$tenant->name}\"",
            subject: $tenant,
            tenant: $tenant,
            user: $request->user()
        );

        return back()->with('success', "Updated {$user->name}'s role to {$validated['role']}.");
    }

    public function removeMember(Request $request, Tenant $tenant, User $user): RedirectResponse
    {
        if ($tenant->owner_id === $user->id) {
            return back()->with('error', 'Cannot remove the primary owner of the workspace.');
        }

        setPermissionsTeamId($tenant->id);
        $user->roles()->detach();

        $tenant->members()->detach($user->id);

        $this->auditService->log(
            action: 'platform.tenant_member_removed',
            description: "Removed {$user->email} from workspace \"{$tenant->name}\"",
            subject: $tenant,
            tenant: $tenant,
            user: $request->user()
        );

        return back()->with('success', "Removed {$user->name} from workspace.");
    }

    public function suspend(Request $request, Tenant $tenant): RedirectResponse
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ]);

        $this->suspendTenantAction->execute($tenant, $request->user(), $validated['reason']);

        return back()->with('success', "Workspace \"{$tenant->name}\" has been suspended.");
    }

    public function activate(Request $request, Tenant $tenant): RedirectResponse
    {
        $this->activateTenantAction->execute($tenant, $request->user());

        return back()->with('success', "Workspace \"{$tenant->name}\" has been reactivated.");
    }

    public function export(Request $request): StreamedResponse
    {
        $tenants = Tenant::with(['owner:id,name,email', 'subscription'])
            ->withCount('members')
            ->orderBy('id', 'desc')
            ->get();

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="likhagrade_workspaces_'.date('Ymd_His').'.csv"',
        ];

        return response()->stream(function () use ($tenants) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['ID', 'ULID', 'Name', 'Type', 'Org Type', 'Owner Name', 'Owner Email', 'Members Count', 'Plan', 'Scans Limit', 'Status', 'Created At']);

            foreach ($tenants as $tenant) {
                fputcsv($handle, [
                    $tenant->id,
                    $tenant->ulid,
                    $tenant->name,
                    $tenant->type?->value ?? 'personal',
                    $tenant->org_type ?? '',
                    $tenant->owner?->name ?? 'None',
                    $tenant->owner?->email ?? '',
                    $tenant->members_count,
                    $tenant->subscription?->plan_name ?? 'Free',
                    $tenant->subscription?->scans_limit ?? 0,
                    $tenant->status?->value ?? 'active',
                    $tenant->created_at ? $tenant->created_at->toIso8601String() : '',
                ]);
            }

            fclose($handle);
        }, 200, $headers);
    }
}
