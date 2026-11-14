<?php

namespace App\Http\Controllers\App;

use App\DataTables\AuditLogsDataTable;
use App\Http\Controllers\Controller;
use App\Models\TenantInvitation;
use App\Services\AuditService;
use App\Services\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WorkspaceController extends Controller
{
    public function __construct(
        protected TenantContext $tenantContext,
        protected AuditService $auditService
    ) {}

    public function show(Request $request): Response
    {
        $tenant = $this->tenantContext->get();
        $user = $request->user();

        $members = $tenant ? $tenant->members()
            ->select(['users.id', 'users.first_name', 'users.last_name', 'users.name', 'users.email', 'users.status'])
            ->get()
            ->map(fn ($member) => [
                'id' => $member->id,
                'name' => $member->name,
                'email' => $member->email,
                'role' => $member->pivot->membership_role,
                'status' => $member->pivot->status,
                'joined_at' => $member->pivot->joined_at ? $member->pivot->joined_at->format('M d, Y') : null,
                'is_owner' => $member->id === $tenant->owner_id,
            ]) : [];

        $departments = $tenant ? $tenant->departments()
            ->with(['head:id,name', 'users:id'])
            ->get()
            ->map(fn ($d) => [
                'id' => $d->id,
                'name' => $d->name,
                'code' => $d->code,
                'description' => $d->description,
                'head_name' => $d->head?->name,
                'member_count' => $d->users->count(),
            ]) : [];

        $invitations = $tenant ? $tenant->invitations()
            ->with(['department:id,name', 'inviter:id,name'])
            ->where('status', 'pending')
            ->latest()
            ->get()
            ->map(fn (TenantInvitation $inv) => [
                'id' => $inv->id,
                'email' => $inv->email,
                'role' => $inv->role,
                'department_name' => $inv->department?->name,
                'inviter_name' => $inv->inviter?->name,
                'invite_url' => route('invitations.show', $inv->token),
                'expires_at' => $inv->expires_at->format('M d, Y'),
            ]) : [];

        $subscription = $tenant ? $tenant->getOrCreateDefaultSubscription() : null;

        return Inertia::render('App/Workspace', [
            'workspace' => $tenant ? [
                'id' => $tenant->id,
                'ulid' => $tenant->ulid,
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'type' => $tenant->type?->value ?? 'personal',
                'org_type' => $tenant->org_type,
                'contact_person' => $tenant->contact_person,
                'contact_email' => $tenant->contact_email,
                'contact_number' => $tenant->contact_number,
                'address' => $tenant->address,
                'is_verified_institution' => $tenant->isVerifiedInstitution(),
                'status' => $tenant->status?->value ?? 'active',
                'is_owner' => $tenant->owner_id === $user->id,
                'role' => $user->roleInTenant($tenant),
            ] : null,
            'members' => $members,
            'departments' => $departments,
            'invitations' => $invitations,
            'subscription' => $subscription ? [
                'plan_name' => $subscription->plan_name,
                'billing_cycle' => $subscription->billing_cycle,
                'status' => $subscription->status,
                'scans_used' => $subscription->scans_used,
                'scans_limit' => $subscription->scans_limit,
                'exams_used' => $subscription->exams_used,
                'exams_limit' => $subscription->exams_limit,
                'members_limit' => $subscription->members_limit,
                'starts_at' => $subscription->starts_at?->format('M d, Y'),
            ] : null,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $tenant = $this->tenantContext->get();
        $user = $request->user();

        if (! $tenant || (! $user->isSuperAdmin() && $tenant->owner_id !== $user->id && ! in_array($user->roleInTenant($tenant), ['Admin', 'Organization Owner', 'Organization Admin'], true))) {
            abort(403, 'You do not have permission to modify workspace settings.');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:190'],
            'org_type' => ['nullable', 'string', 'max:100'],
            'contact_person' => ['nullable', 'string', 'max:100'],
            'contact_email' => ['nullable', 'email', 'max:190'],
            'contact_number' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:500'],
        ]);

        $old = $tenant->only(array_keys($validated));
        $tenant->update($validated);

        $this->auditService->log(
            action: 'tenant.updated',
            description: "Updated workspace settings for \"{$tenant->name}\"",
            subject: $tenant,
            oldValues: $old,
            newValues: $validated,
            tenant: $tenant,
            user: $user
        );

        return back()->with('success', 'Workspace settings updated successfully.');
    }

    public function activityLogsData(Request $request): JsonResponse
    {
        $tenant = $this->tenantContext->get();

        if (! $tenant) {
            abort(404, 'No active workspace context.');
        }

        $dataTable = new AuditLogsDataTable($tenant->id);

        return $dataTable->render($request);
    }
}
