<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use App\Models\Subject;
use App\Services\AuditService;
use App\Services\TenantContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class SubjectController extends Controller
{
    public function __construct(
        protected TenantContext $tenantContext,
        protected AuditService $auditService
    ) {}

    public function store(Request $request): RedirectResponse
    {
        $tenantId = $this->tenantContext->id();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'code' => ['nullable', 'string', 'max:50'],
            'description' => ['nullable', 'string', 'max:1000'],
            'color' => ['nullable', 'string', 'max:30'],
        ]);

        $subject = Subject::create([
            'tenant_id' => $tenantId,
            'name' => $validated['name'],
            'code' => $validated['code'] ?? null,
            'description' => $validated['description'] ?? null,
            'color' => $validated['color'] ?? '#3b82f6',
            'is_archived' => false,
        ]);

        $this->auditService->log(
            'subject.created',
            "Created subject: {$subject->name}",
            $subject,
            null,
            $subject->toArray()
        );

        return back()->with('success', "Subject '{$subject->name}' created successfully.");
    }

    public function update(Request $request, Subject $subject): RedirectResponse
    {
        if ($subject->tenant_id !== $this->tenantContext->id()) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'code' => ['nullable', 'string', 'max:50'],
            'description' => ['nullable', 'string', 'max:1000'],
            'color' => ['nullable', 'string', 'max:30'],
        ]);

        $oldValues = $subject->toArray();
        $subject->update($validated);

        $this->auditService->log(
            'subject.updated',
            "Updated subject: {$subject->name}",
            $subject,
            $oldValues,
            $subject->toArray()
        );

        return back()->with('success', "Subject '{$subject->name}' updated successfully.");
    }

    public function toggleArchive(Subject $subject): RedirectResponse
    {
        if ($subject->tenant_id !== $this->tenantContext->id()) {
            abort(403);
        }

        $newState = ! $subject->is_archived;
        $subject->update(['is_archived' => $newState]);

        $statusStr = $newState ? 'archived' : 'restored';
        $this->auditService->log(
            "subject.{$statusStr}",
            "{$statusStr} subject: {$subject->name}",
            $subject
        );

        return back()->with('success', "Subject '{$subject->name}' {$statusStr}.");
    }
}
