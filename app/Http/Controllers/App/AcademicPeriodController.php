<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use App\Models\AcademicPeriod;
use App\Services\AuditService;
use App\Services\TenantContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AcademicPeriodController extends Controller
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
            'type' => ['required', 'string', Rule::in(['semester', 'term', 'quarter', 'year'])],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'is_current' => ['boolean'],
        ]);

        if (! empty($validated['is_current'])) {
            AcademicPeriod::where('tenant_id', $tenantId)->update(['is_current' => false]);
        }

        $period = AcademicPeriod::create([
            'tenant_id' => $tenantId,
            'name' => $validated['name'],
            'code' => $validated['code'] ?? null,
            'type' => $validated['type'],
            'start_date' => $validated['start_date'] ?? null,
            'end_date' => $validated['end_date'] ?? null,
            'is_current' => $validated['is_current'] ?? false,
            'is_archived' => false,
        ]);

        $this->auditService->log(
            'academic_period.created',
            "Created academic period: {$period->name}",
            $period,
            null,
            $period->toArray()
        );

        return back()->with('success', "Academic period '{$period->name}' created successfully.");
    }

    public function update(Request $request, AcademicPeriod $period): RedirectResponse
    {
        $tenantId = $this->tenantContext->id();

        if ($period->tenant_id !== $tenantId) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'code' => ['nullable', 'string', 'max:50'],
            'type' => ['required', 'string', Rule::in(['semester', 'term', 'quarter', 'year'])],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'is_current' => ['boolean'],
        ]);

        if (! empty($validated['is_current']) && ! $period->is_current) {
            AcademicPeriod::where('tenant_id', $tenantId)->where('id', '!=', $period->id)->update(['is_current' => false]);
        }

        $oldValues = $period->toArray();
        $period->update($validated);

        $this->auditService->log(
            'academic_period.updated',
            "Updated academic period: {$period->name}",
            $period,
            $oldValues,
            $period->toArray()
        );

        return back()->with('success', "Academic period '{$period->name}' updated successfully.");
    }

    public function toggleArchive(AcademicPeriod $period): RedirectResponse
    {
        if ($period->tenant_id !== $this->tenantContext->id()) {
            abort(403);
        }

        $newState = ! $period->is_archived;
        $period->update(['is_archived' => $newState]);

        $statusStr = $newState ? 'archived' : 'restored';
        $this->auditService->log(
            "academic_period.{$statusStr}",
            "{$statusStr} academic period: {$period->name}",
            $period
        );

        return back()->with('success', "Academic period '{$period->name}' {$statusStr}.");
    }

    public function setCurrent(AcademicPeriod $period): RedirectResponse
    {
        $tenantId = $this->tenantContext->id();

        if ($period->tenant_id !== $tenantId) {
            abort(403);
        }

        AcademicPeriod::where('tenant_id', $tenantId)->update(['is_current' => false]);
        $period->update(['is_current' => true, 'is_archived' => false]);

        $this->auditService->log(
            'academic_period.set_current',
            "Set academic period as current: {$period->name}",
            $period
        );

        return back()->with('success', "Academic period '{$period->name}' set as active.");
    }
}
