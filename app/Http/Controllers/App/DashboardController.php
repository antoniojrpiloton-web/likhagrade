<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Examination;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Subject;
use App\Services\TenantContext;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request, TenantContext $tenantContext): Response
    {
        $tenant = $tenantContext->get();
        $user = $request->user();

        $memberCount = $tenant ? $tenant->members()->count() : 1;
        $subscription = $tenant?->subscription;

        $recentLogs = $tenant ? AuditLog::where('tenant_id', $tenant->id)
            ->latest('created_at')
            ->take(6)
            ->get()
            ->map(fn ($log) => [
                'id' => $log->id,
                'action' => $log->action,
                'description' => $log->description,
                'time_ago' => $log->created_at->diffForHumans(),
            ]) : [];

        $examsCount = $tenant ? Examination::where('tenant_id', $tenant->id)->where('status', '!=', 'archived')->count() : 0;
        $classesCount = $tenant ? SchoolClass::where('tenant_id', $tenant->id)->where('is_archived', false)->count() : 0;
        $studentsCount = $tenant ? Student::where('tenant_id', $tenant->id)->where('is_archived', false)->count() : 0;
        $subjectsCount = $tenant ? Subject::where('tenant_id', $tenant->id)->where('is_archived', false)->count() : 0;

        $recentClasses = $tenant ? SchoolClass::where('tenant_id', $tenant->id)
            ->where('is_archived', false)
            ->with(['subject:id,name,color', 'section:id,name'])
            ->withCount('students')
            ->latest('created_at')
            ->take(4)
            ->get() : [];

        $recentExams = $tenant ? Examination::where('tenant_id', $tenant->id)
            ->where('status', '!=', 'archived')
            ->with(['subject:id,name,color', 'schoolClass:id,name'])
            ->latest('created_at')
            ->take(4)
            ->get() : [];

        return Inertia::render('App/Dashboard', [
            'workspace' => $tenant ? [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'type' => $tenant->type?->value ?? 'personal',
                'status' => $tenant->status?->value ?? 'active',
                'role' => $user->roleInTenant($tenant),
                'member_count' => $memberCount,
            ] : null,
            'stats' => [
                'total_exams' => $examsCount,
                'total_scans' => $subscription?->scans_used ?? 0,
                'scans_limit' => $subscription?->scans_limit ?? 100,
                'active_classes' => $classesCount,
                'registered_students' => $studentsCount,
                'total_subjects' => $subjectsCount,
            ],
            'recent_classes' => $recentClasses,
            'recent_activity' => $recentLogs,
            'recent_exams' => $recentExams,
            'recent_scans' => [],
        ]);
    }
}
