<?php

namespace App\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Models\PlatformSetting;
use App\Services\AuditService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PlatformSettingsController extends Controller
{
    public function __construct(
        protected AuditService $auditService
    ) {}

    public function index(): Response
    {
        $settings = [
            'allow_teacher_registration' => PlatformSetting::get('allow_teacher_registration', true),
            'allow_organization_registration' => PlatformSetting::get('allow_organization_registration', true),
            'default_personal_scans' => PlatformSetting::get('default_personal_scans', 500),
            'default_org_scans' => PlatformSetting::get('default_org_scans', 5000),
            'default_personal_exams' => PlatformSetting::get('default_personal_exams', 20),
            'default_org_exams' => PlatformSetting::get('default_org_exams', 50),
            'support_email' => PlatformSetting::get('support_email', 'support@likhagrade.com'),
            'announcement_banner' => PlatformSetting::get('announcement_banner', ''),
            'require_institution_verification' => PlatformSetting::get('require_institution_verification', false),
        ];

        $systemInfo = [
            'app_name' => config('app.name'),
            'app_env' => config('app.env'),
            'app_debug' => config('app.debug'),
            'php_version' => PHP_VERSION,
            'laravel_version' => app()->version(),
            'database_driver' => config('database.default'),
            'database_name' => DB::connection()->getDatabaseName(),
            'queue_connection' => config('queue.default'),
            'session_driver' => config('session.driver'),
            'superadmin_email' => config('app.superadmin_email', env('SUPERADMIN_EMAIL', 'dytech98@gmail.com')),
        ];

        return Inertia::render('Platform/Settings', [
            'settings' => $settings,
            'system_info' => $systemInfo,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'allow_teacher_registration' => ['required', 'boolean'],
            'allow_organization_registration' => ['required', 'boolean'],
            'default_personal_scans' => ['required', 'integer', 'min:10', 'max:1000000'],
            'default_org_scans' => ['required', 'integer', 'min:100', 'max:5000000'],
            'default_personal_exams' => ['required', 'integer', 'min:1', 'max:10000'],
            'default_org_exams' => ['required', 'integer', 'min:1', 'max:50000'],
            'support_email' => ['required', 'email', 'max:190'],
            'announcement_banner' => ['nullable', 'string', 'max:500'],
            'require_institution_verification' => ['required', 'boolean'],
        ]);

        $oldSettings = [
            'allow_teacher_registration' => PlatformSetting::get('allow_teacher_registration', true),
            'allow_organization_registration' => PlatformSetting::get('allow_organization_registration', true),
            'default_personal_scans' => PlatformSetting::get('default_personal_scans', 500),
            'default_org_scans' => PlatformSetting::get('default_org_scans', 5000),
            'default_personal_exams' => PlatformSetting::get('default_personal_exams', 20),
            'default_org_exams' => PlatformSetting::get('default_org_exams', 50),
            'support_email' => PlatformSetting::get('support_email', 'support@likhagrade.com'),
            'announcement_banner' => PlatformSetting::get('announcement_banner', ''),
            'require_institution_verification' => PlatformSetting::get('require_institution_verification', false),
        ];

        PlatformSetting::set('allow_teacher_registration', $validated['allow_teacher_registration'], 'boolean');
        PlatformSetting::set('allow_organization_registration', $validated['allow_organization_registration'], 'boolean');
        PlatformSetting::set('default_personal_scans', $validated['default_personal_scans'], 'integer');
        PlatformSetting::set('default_org_scans', $validated['default_org_scans'], 'integer');
        PlatformSetting::set('default_personal_exams', $validated['default_personal_exams'], 'integer');
        PlatformSetting::set('default_org_exams', $validated['default_org_exams'], 'integer');
        PlatformSetting::set('support_email', $validated['support_email'], 'string');
        PlatformSetting::set('announcement_banner', $validated['announcement_banner'] ?? '', 'string');
        PlatformSetting::set('require_institution_verification', $validated['require_institution_verification'], 'boolean');

        $this->auditService->log(
            action: 'platform.settings_updated',
            description: 'Updated platform configuration settings',
            subject: null,
            oldValues: $oldSettings,
            newValues: $validated,
            user: $request->user()
        );

        return back()->with('success', 'Platform settings updated successfully.');
    }
}
