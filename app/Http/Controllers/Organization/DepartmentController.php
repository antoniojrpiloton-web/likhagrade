<?php

namespace App\Http\Controllers\Organization;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\User;
use App\Services\AuditService;
use App\Services\TenantContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class DepartmentController extends Controller
{
    public function __construct(
        protected TenantContext $tenantContext,
        protected AuditService $auditService
    ) {}

    public function store(Request $request): RedirectResponse
    {
        $tenant = $this->tenantContext->get();
        if (! $tenant || ! $tenant->isOrganization()) {
            abort(403, 'Departments are only available for organization workspaces.');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:190'],
            'code' => ['nullable', 'string', 'max:50'],
            'description' => ['nullable', 'string', 'max:500'],
            'head_user_id' => ['nullable', 'exists:users,id'],
        ]);

        $department = $tenant->departments()->create($validated);

        $this->auditService->log(
            action: 'department.created',
            description: "Created department \"{$department->name}\"",
            subject: $department,
            tenant: $tenant,
            user: $request->user()
        );

        return back()->with('success', "Department {$department->name} created successfully.");
    }

    public function update(Request $request, Department $department): RedirectResponse
    {
        $tenant = $this->tenantContext->get();
        if (! $tenant || $department->tenant_id !== $tenant->id) {
            abort(403, 'Unauthorized department modification.');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:190'],
            'code' => ['nullable', 'string', 'max:50'],
            'description' => ['nullable', 'string', 'max:500'],
            'head_user_id' => ['nullable', 'exists:users,id'],
        ]);

        $oldName = $department->name;
        $department->update($validated);

        $this->auditService->log(
            action: 'department.updated',
            description: "Updated department \"{$oldName}\"",
            subject: $department,
            tenant: $tenant,
            user: $request->user()
        );

        return back()->with('success', 'Department updated successfully.');
    }

    public function assignMember(Request $request, Department $department): RedirectResponse
    {
        $tenant = $this->tenantContext->get();
        if (! $tenant || $department->tenant_id !== $tenant->id) {
            abort(403);
        }

        $validated = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'role' => ['required', 'string', 'in:Department Admin,Teacher,Instructor'],
        ]);

        $targetUser = User::findOrFail($validated['user_id']);
        if (! $tenant->hasMember($targetUser)) {
            abort(422, 'User must first be a member of the organization.');
        }

        $department->users()->syncWithoutDetaching([
            $targetUser->id => ['role' => $validated['role']],
        ]);

        $this->auditService->log(
            action: 'department.member_assigned',
            description: "Assigned {$targetUser->name} to {$department->name} as {$validated['role']}",
            subject: $department,
            tenant: $tenant,
            user: $request->user()
        );

        return back()->with('success', "Assigned {$targetUser->name} to {$department->name}.");
    }

    public function destroy(Request $request, Department $department): RedirectResponse
    {
        $tenant = $this->tenantContext->get();
        if (! $tenant || $department->tenant_id !== $tenant->id) {
            abort(403);
        }

        $name = $department->name;
        $department->delete();

        $this->auditService->log(
            action: 'department.deleted',
            description: "Deleted department \"{$name}\"",
            subject: $tenant,
            tenant: $tenant,
            user: $request->user()
        );

        return back()->with('success', "Department {$name} removed.");
    }
}
