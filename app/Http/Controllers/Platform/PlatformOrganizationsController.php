<?php

namespace App\Http\Controllers\Platform;

use App\Actions\Platform\VerifyOrganizationAction;
use App\DataTables\OrganizationsDataTable;
use App\Enums\TenantRole;
use App\Enums\TenantStatus;
use App\Enums\TenantType;
use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\Tenant;
use App\Models\User;
use App\Services\AuditService;
use App\Services\PlatformDashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class PlatformOrganizationsController extends Controller
{
    public function __construct(
        protected VerifyOrganizationAction $verifyOrganizationAction,
        protected AuditService $auditService,
        protected PlatformDashboardService $dashboardService
    ) {}

    public function index(): Response
    {
        $usersList = User::select(['id', 'name', 'email'])
            ->orderBy('name')
            ->get();

        return Inertia::render('Platform/Organizations', [
            'users_list' => $usersList,
        ]);
    }

    public function data(Request $request, OrganizationsDataTable $dataTable): JsonResponse
    {
        return $dataTable->render($request);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:190'],
            'org_type' => ['required', 'string', 'max:100'],
            'owner_id' => ['required', 'exists:users,id'],
            'contact_person' => ['required', 'string', 'max:100'],
            'contact_email' => ['required', 'email', 'max:190'],
            'contact_number' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:500'],
            'is_verified' => ['nullable', 'boolean'],
        ]);

        $actor = $request->user();

        $tenant = DB::transaction(function () use ($validated, $actor) {
            $owner = User::findOrFail($validated['owner_id']);

            $tenant = Tenant::create([
                'name' => $validated['name'],
                'type' => TenantType::Organization,
                'org_type' => $validated['org_type'],
                'contact_person' => $validated['contact_person'],
                'contact_email' => strtolower(trim($validated['contact_email'])),
                'contact_number' => $validated['contact_number'] ?? null,
                'address' => $validated['address'] ?? null,
                'owner_id' => $owner->id,
                'status' => TenantStatus::Active,
                'is_verified_institution' => ! empty($validated['is_verified']),
                'verification_status' => ! empty($validated['is_verified']) ? 'verified' : 'pending',
            ]);

            $tenant->members()->attach($owner->id, [
                'membership_role' => TenantRole::OrganizationOwner->value,
                'status' => 'active',
                'joined_at' => now(),
            ]);

            Role::firstOrCreate(['name' => TenantRole::OrganizationOwner->value, 'guard_name' => 'web']);
            setPermissionsTeamId($tenant->id);
            $owner->assignRole(TenantRole::OrganizationOwner->value);

            $tenant->subscription()->create([
                'plan_name' => 'Institutional Enterprise',
                'billing_cycle' => 'monthly',
                'status' => 'active',
                'scans_limit' => 20000,
                'scans_used' => 0,
                'exams_limit' => 200,
                'exams_used' => 0,
                'members_limit' => 100,
                'starts_at' => now(),
            ]);

            $this->auditService->log(
                action: 'platform.organization_created',
                description: "Created institutional organization \"{$tenant->name}\"",
                subject: $tenant,
                newValues: ['name' => $tenant->name, 'org_type' => $tenant->org_type, 'owner_id' => $owner->id],
                tenant: $tenant,
                user: $actor
            );

            return $tenant;
        });

        $this->dashboardService->clearCache();

        return back()->with('success', "Educational institution \"{$tenant->name}\" created successfully.");
    }

    public function verify(Request $request, Tenant $tenant): RedirectResponse
    {
        $this->verifyOrganizationAction->verify($tenant, $request->user());

        return back()->with('success', "Educational institution \"{$tenant->name}\" verified successfully.");
    }

    public function revokeVerification(Request $request, Tenant $tenant): RedirectResponse
    {
        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $this->verifyOrganizationAction->revoke($tenant, $request->user(), $validated['reason'] ?? null);

        return back()->with('success', "Verification for \"{$tenant->name}\" has been revoked.");
    }

    public function show(Tenant $tenant): JsonResponse
    {
        if (! $tenant->isOrganization()) {
            abort(404, 'Organization not found.');
        }

        $tenant->load([
            'owner:id,name,email',
            'subscription',
            'departments.members:id,name,email',
            'invitations' => function ($query) {
                $query->latest()->take(20);
            },
            'members' => function ($query) {
                $query->select('users.id', 'users.name', 'users.email', 'users.status')
                    ->withPivot('membership_role', 'status', 'joined_at');
            },
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
            'members' => $dept->members->map(fn ($m) => [
                'id' => $m->id,
                'name' => $m->name,
                'email' => $m->email,
            ]),
        ]);

        $invitations = $tenant->invitations->map(fn ($inv) => [
            'id' => $inv->id,
            'email' => $inv->email,
            'role' => $inv->role,
            'status' => $inv->status,
            'created_at' => $inv->created_at->format('M d, Y'),
            'expires_at' => $inv->expires_at->format('M d, Y'),
        ]);

        return response()->json([
            'tenant' => [
                'id' => $tenant->id,
                'ulid' => $tenant->ulid,
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'type' => $tenant->type?->value ?? 'organization',
                'org_type' => $tenant->org_type,
                'status' => $tenant->status?->value ?? 'active',
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
            'invitations' => $invitations,
        ]);
    }

    public function addDepartment(Request $request, Tenant $tenant): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:190'],
            'code' => ['nullable', 'string', 'max:20'],
        ]);

        $dept = $tenant->departments()->create($validated);

        $this->auditService->log(
            action: 'platform.department_created',
            description: "Created department \"{$dept->name}\" in \"{$tenant->name}\"",
            subject: $dept,
            tenant: $tenant,
            user: $request->user()
        );

        return back()->with('success', "Academic department \"{$dept->name}\" added.");
    }

    public function destroyDepartment(Request $request, Tenant $tenant, Department $department): RedirectResponse
    {
        $name = $department->name;
        $department->delete();

        $this->auditService->log(
            action: 'platform.department_deleted',
            description: "Deleted department \"{$name}\" from \"{$tenant->name}\"",
            subject: $tenant,
            tenant: $tenant,
            user: $request->user()
        );

        return back()->with('success', "Department \"{$name}\" removed.");
    }
}
