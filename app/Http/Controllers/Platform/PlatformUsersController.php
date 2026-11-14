<?php

namespace App\Http\Controllers\Platform;

use App\Actions\Platform\ActivateUserAction;
use App\Actions\Platform\SuspendUserAction;
use App\DataTables\UsersDataTable;
use App\Enums\TenantRole;
use App\Enums\TenantStatus;
use App\Enums\TenantType;
use App\Enums\UserStatus;
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
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PlatformUsersController extends Controller
{
    public function __construct(
        protected AuditService $auditService,
        protected SuspendUserAction $suspendUserAction,
        protected ActivateUserAction $activateUserAction,
        protected PlatformDashboardService $dashboardService
    ) {}

    public function index(): Response
    {
        $tenantsList = Tenant::select(['id', 'name', 'type'])
            ->orderBy('name')
            ->get();

        return Inertia::render('Platform/Users', [
            'tenants_list' => $tenantsList,
        ]);
    }

    public function data(Request $request, UsersDataTable $dataTable): JsonResponse
    {
        return $dataTable->render($request);
    }

    public function show(User $user): JsonResponse
    {
        $memberships = $user->tenants()
            ->with(['subscription:id,tenant_id,plan_name,status'])
            ->get()
            ->map(fn ($tenant) => [
                'tenant_id' => $tenant->id,
                'tenant_ulid' => $tenant->ulid,
                'tenant_name' => $tenant->name,
                'tenant_type' => $tenant->type?->value ?? 'personal',
                'membership_role' => $tenant->pivot->membership_role,
                'membership_status' => $tenant->pivot->status,
                'joined_at' => $tenant->pivot->joined_at ? $tenant->pivot->joined_at->format('M d, Y') : null,
                'plan_name' => $tenant->subscription?->plan_name ?? 'Free',
            ]);

        $recentActivity = AuditLog::where('user_id', $user->id)
            ->latest('created_at')
            ->take(10)
            ->get()
            ->map(fn ($log) => [
                'id' => $log->id,
                'action' => $log->action,
                'description' => $log->description,
                'ip_address' => $log->ip_address,
                'created_at' => $log->created_at->format('M d, Y H:i:s'),
                'time_ago' => $log->created_at->diffForHumans(),
            ]);

        return response()->json([
            'user' => [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'name' => $user->name,
                'email' => $user->email,
                'avatar_url' => $user->avatar_url,
                'google_id' => $user->google_id ? true : false,
                'status' => $user->status?->value ?? 'active',
                'suspension_reason' => $user->suspension_reason,
                'suspended_at' => $user->suspended_at ? $user->suspended_at->format('M d, Y H:i') : null,
                'email_verified_at' => $user->email_verified_at ? $user->email_verified_at->format('M d, Y H:i') : null,
                'is_superadmin' => $user->isSuperAdmin(),
                'created_at' => $user->created_at->format('M d, Y H:i'),
            ],
            'memberships' => $memberships,
            'recent_activity' => $recentActivity,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:190', 'unique:users,email'],
            'password' => ['required', PasswordRule::defaults()],
            'status' => ['required', Rule::in(['active', 'suspended', 'inactive'])],
            'is_superadmin' => ['nullable', 'boolean'],
            'create_workspace' => ['nullable', 'boolean'],
            'workspace_name' => ['nullable', 'string', 'max:190'],
        ]);

        $actor = $request->user();

        $user = DB::transaction(function () use ($validated, $actor) {
            $fullName = trim($validated['first_name'].' '.$validated['last_name']);

            $user = User::create([
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'name' => $fullName,
                'email' => strtolower(trim($validated['email'])),
                'password' => Hash::make($validated['password']),
                'status' => UserStatus::from($validated['status']),
                'email_verified_at' => now(),
            ]);

            if (! empty($validated['is_superadmin'])) {
                setPermissionsTeamId(null);
                $user->assignRole('SuperAdmin');
            }

            if (! empty($validated['create_workspace'])) {
                $wsName = ! empty($validated['workspace_name'])
                    ? $validated['workspace_name']
                    : "{$fullName}'s Workspace";

                $tenant = Tenant::create([
                    'name' => $wsName,
                    'type' => TenantType::Personal,
                    'owner_id' => $user->id,
                    'status' => TenantStatus::Active,
                ]);

                $tenant->members()->attach($user->id, [
                    'membership_role' => TenantRole::Admin->value,
                    'status' => 'active',
                    'joined_at' => now(),
                ]);

                $tenant->getOrCreateDefaultSubscription();
            }

            $this->auditService->log(
                action: 'platform.user_created',
                description: "Created user {$user->email} from platform admin",
                subject: $user,
                newValues: ['email' => $user->email, 'status' => $user->status->value],
                user: $actor
            );

            return $user;
        });

        $this->dashboardService->clearCache();

        return back()->with('success', "User {$user->name} created successfully.");
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:190', Rule::unique('users', 'email')->ignore($user->id)],
            'status' => ['required', Rule::in(['active', 'suspended', 'inactive'])],
            'suspension_reason' => ['nullable', 'string', 'max:500'],
            'is_verified' => ['nullable', 'boolean'],
            'is_superadmin' => ['nullable', 'boolean'],
        ]);

        $actor = $request->user();

        if ($user->id === $actor->id && $validated['status'] !== 'active') {
            return back()->with('error', 'You cannot change your own active status.');
        }

        $oldValues = [
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'email' => $user->email,
            'status' => $user->status?->value,
        ];

        $fullName = trim($validated['first_name'].' '.$validated['last_name']);

        $updateData = [
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'name' => $fullName,
            'email' => strtolower(trim($validated['email'])),
            'status' => UserStatus::from($validated['status']),
            'suspension_reason' => $validated['status'] === 'suspended' ? ($validated['suspension_reason'] ?? $user->suspension_reason) : null,
            'suspended_at' => $validated['status'] === 'suspended' ? ($user->suspended_at ?? now()) : null,
        ];

        if (! empty($validated['is_verified']) && ! $user->email_verified_at) {
            $updateData['email_verified_at'] = now();
        }

        $user->update($updateData);

        if (isset($validated['is_superadmin']) && ! $user->isSuperAdmin() && $validated['is_superadmin']) {
            setPermissionsTeamId(null);
            $user->assignRole('SuperAdmin');
        }

        $this->auditService->log(
            action: 'platform.user_updated',
            description: "Updated profile and status for {$user->email}",
            subject: $user,
            oldValues: $oldValues,
            newValues: $updateData,
            user: $actor
        );

        $this->dashboardService->clearCache();

        return back()->with('success', "User {$user->name} updated successfully.");
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        $actor = $request->user();

        if ($user->id === $actor->id) {
            return back()->with('error', 'You cannot delete your own account.');
        }

        if ($user->isSuperAdmin()) {
            return back()->with('error', 'SuperAdmin platform administrators cannot be deleted.');
        }

        $userEmail = $user->email;
        $userName = $user->name;

        $user->delete();

        $this->auditService->log(
            action: 'platform.user_deleted',
            description: "Deleted user account {$userEmail}",
            subject: $user,
            oldValues: ['email' => $userEmail, 'name' => $userName],
            user: $actor
        );

        $this->dashboardService->clearCache();

        return back()->with('success', "User account {$userName} has been removed.");
    }

    public function suspend(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ]);

        $this->suspendUserAction->execute($user, $request->user(), $validated['reason']);

        return back()->with('success', "User account {$user->email} has been suspended.");
    }

    public function activate(Request $request, User $user): RedirectResponse
    {
        $this->activateUserAction->execute($user, $request->user());

        return back()->with('success', "User account {$user->email} has been reactivated.");
    }

    public function resetPassword(Request $request, User $user): RedirectResponse
    {
        if ($user->isSuperAdmin()) {
            return back()->with('error', 'SuperAdmin passwords cannot be reset via this action.');
        }

        $token = Password::broker()->createToken($user);
        $user->sendPasswordResetNotification($token);

        $this->auditService->log(
            action: 'platform.user_password_reset_sent',
            description: "Sent password reset link to {$user->email}",
            subject: $user,
            user: $request->user()
        );

        return back()->with('success', "Password reset notification dispatched to {$user->email}.");
    }

    public function export(Request $request): StreamedResponse
    {
        $users = User::query()
            ->withCount('tenants')
            ->orderBy('id', 'desc')
            ->get();

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="likhagrade_users_'.date('Ymd_His').'.csv"',
        ];

        return response()->stream(function () use ($users) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['ID', 'Name', 'Email', 'Status', 'Workspaces Count', 'Verified At', 'Created At']);

            foreach ($users as $user) {
                fputcsv($handle, [
                    $user->id,
                    $user->name,
                    $user->email,
                    $user->status?->value ?? 'active',
                    $user->tenants_count,
                    $user->email_verified_at ? $user->email_verified_at->toIso8601String() : 'Unverified',
                    $user->created_at ? $user->created_at->toIso8601String() : '',
                ]);
            }

            fclose($handle);
        }, 200, $headers);
    }
}
