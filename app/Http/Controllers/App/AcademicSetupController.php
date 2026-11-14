<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use App\Models\AcademicPeriod;
use App\Models\Section;
use App\Models\Subject;
use App\Services\TenantContext;
use Inertia\Inertia;
use Inertia\Response;

class AcademicSetupController extends Controller
{
    public function __construct(
        protected TenantContext $tenantContext
    ) {}

    public function index(): Response
    {
        $tenantId = $this->tenantContext->id();

        $periods = AcademicPeriod::where('tenant_id', $tenantId)
            ->withCount('classes')
            ->orderByDesc('is_current')
            ->orderBy('is_archived')
            ->latest('created_at')
            ->get();

        $subjects = Subject::where('tenant_id', $tenantId)
            ->withCount('classes')
            ->orderBy('is_archived')
            ->orderBy('name')
            ->get();

        $sections = Section::where('tenant_id', $tenantId)
            ->withCount('classes')
            ->orderBy('is_archived')
            ->orderBy('name')
            ->get();

        return Inertia::render('App/AcademicSetup', [
            'periods' => $periods,
            'subjects' => $subjects,
            'sections' => $sections,
        ]);
    }
}
