<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use App\Models\Section;
use App\Services\AuditService;
use App\Services\TenantContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class SectionController extends Controller
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
            'grade_level' => ['nullable', 'string', 'max:50'],
            'room' => ['nullable', 'string', 'max:50'],
        ]);

        $section = Section::create([
            'tenant_id' => $tenantId,
            'name' => $validated['name'],
            'code' => $validated['code'] ?? null,
            'grade_level' => $validated['grade_level'] ?? null,
            'room' => $validated['room'] ?? null,
            'is_archived' => false,
        ]);

        $this->auditService->log(
            'section.created',
            "Created section: {$section->name}",
            $section,
            null,
            $section->toArray()
        );

        return back()->with('success', "Section '{$section->name}' created successfully.");
    }

    public function update(Request $request, Section $section): RedirectResponse
    {
        if ($section->tenant_id !== $this->tenantContext->id()) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'code' => ['nullable', 'string', 'max:50'],
            'grade_level' => ['nullable', 'string', 'max:50'],
            'room' => ['nullable', 'string', 'max:50'],
        ]);

        $oldValues = $section->toArray();
        $section->update($validated);

        $this->auditService->log(
            'section.updated',
            "Updated section: {$section->name}",
            $section,
            $oldValues,
            $section->toArray()
        );

        return back()->with('success', "Section '{$section->name}' updated successfully.");
    }

    public function toggleArchive(Section $section): RedirectResponse
    {
        if ($section->tenant_id !== $this->tenantContext->id()) {
            abort(403);
        }

        $newState = ! $section->is_archived;
        $section->update(['is_archived' => $newState]);

        $statusStr = $newState ? 'archived' : 'restored';
        $this->auditService->log(
            "section.{$statusStr}",
            "{$statusStr} section: {$section->name}",
            $section
        );

        return back()->with('success', "Section '{$section->name}' {$statusStr}.");
    }
}
