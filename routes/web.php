<?php

use App\Http\Controllers\App\AcademicPeriodController;
use App\Http\Controllers\App\AcademicSetupController;
use App\Http\Controllers\App\AnswerKeyController;
use App\Http\Controllers\App\DashboardController;
use App\Http\Controllers\App\ExaminationController;
use App\Http\Controllers\App\OmrAnswerSheetController;
use App\Http\Controllers\App\ProfileController;
use App\Http\Controllers\App\SchoolClassController;
use App\Http\Controllers\App\SectionController;
use App\Http\Controllers\App\StudentController;
use App\Http\Controllers\App\StudentImportController;
use App\Http\Controllers\App\SubjectController;
use App\Http\Controllers\App\WorkspaceController;
use App\Http\Controllers\Auth\EmailVerificationController;
use App\Http\Controllers\Auth\GoogleAuthController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\PasswordResetController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Organization\DepartmentController;
use App\Http\Controllers\Organization\InvitationController;
use App\Http\Controllers\Organization\OrganizationRegistrationController;
use App\Http\Controllers\Platform\PlatformAuditLogsController;
use App\Http\Controllers\Platform\PlatformDashboardController;
use App\Http\Controllers\Platform\PlatformImpersonationController;
use App\Http\Controllers\Platform\PlatformMonitoringController;
use App\Http\Controllers\Platform\PlatformOrganizationsController;
use App\Http\Controllers\Platform\PlatformSettingsController;
use App\Http\Controllers\Platform\PlatformSubscriptionsController;
use App\Http\Controllers\Platform\PlatformTenantsController;
use App\Http\Controllers\Platform\PlatformUsersController;
use App\Http\Controllers\Tenant\TenantSwitchController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome');
})->name('home');

Route::get('/organization/register', [OrganizationRegistrationController::class, 'create'])->name('organization.register');
Route::post('/organization/register', [OrganizationRegistrationController::class, 'store'])->name('organization.register.store');

Route::get('/invitations/{token}', [InvitationController::class, 'show'])->name('invitations.show');
Route::post('/invitations/{token}/accept', [InvitationController::class, 'accept'])->name('invitations.accept');

Route::get('/auth/google/redirect', [GoogleAuthController::class, 'redirect'])->name('auth.google');
Route::get('/auth/google/callback', [GoogleAuthController::class, 'callback'])->name('auth.google.callback');

Route::middleware('guest')->group(function () {
    Route::get('/register', [RegisterController::class, 'create'])->name('register');
    Route::post('/register', [RegisterController::class, 'store'])->name('register.store');

    Route::get('/login', [LoginController::class, 'create'])->name('login');
    Route::post('/login', [LoginController::class, 'store'])->name('login.store');

    Route::get('/forgot-password', [PasswordResetController::class, 'createForgot'])->name('password.request');
    Route::post('/forgot-password', [PasswordResetController::class, 'sendResetLink'])->name('password.email');

    Route::get('/reset-password/{token}', [PasswordResetController::class, 'createReset'])->name('password.reset');
    Route::post('/reset-password', [PasswordResetController::class, 'updatePassword'])->name('password.update');
});

Route::match(['get', 'post'], '/logout', [LoginController::class, 'destroy'])->name('logout');

Route::middleware('auth')->group(function () {
    Route::post('/platform/impersonate/leave', [PlatformImpersonationController::class, 'leave'])->name('platform.impersonate.leave');

    Route::get('/email/verify', [EmailVerificationController::class, 'notice'])->name('verification.notice');
    Route::get('/email/verify/{id}/{hash}', [EmailVerificationController::class, 'verify'])
        ->middleware(['signed', 'throttle:6,1'])
        ->name('verification.verify');
    Route::post('/email/verification-notification', [EmailVerificationController::class, 'resend'])
        ->middleware('throttle:6,1')
        ->name('verification.send');
});

Route::middleware(['auth', 'verified', 'tenant'])->prefix('app')->name('app.')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::get('/exams', [ExaminationController::class, 'index'])->name('exams');
    Route::get('/exams/create', [ExaminationController::class, 'create'])->name('exams.create');
    Route::post('/exams', [ExaminationController::class, 'store'])->name('exams.store');
    Route::get('/exams/{exam}', [ExaminationController::class, 'show'])->name('exams.show');
    Route::get('/exams/{exam}/edit', [ExaminationController::class, 'edit'])->name('exams.edit');
    Route::match(['put', 'patch'], '/exams/{exam}', [ExaminationController::class, 'update'])->name('exams.update');
    Route::post('/exams/{exam}/duplicate', [ExaminationController::class, 'duplicate'])->name('exams.duplicate');
    Route::post('/exams/{exam}/archive', [ExaminationController::class, 'toggleArchive'])->name('exams.archive');
    Route::post('/exams/{exam}/status', [ExaminationController::class, 'setStatus'])->name('exams.status');
    Route::get('/exams/{exam}/answer-key', [AnswerKeyController::class, 'show'])->name('exams.answer-key');
    Route::match(['post', 'put'], '/exams/{exam}/answer-key', [AnswerKeyController::class, 'update'])->name('exams.answer-key.update');
    Route::get('/exams/{exam}/answer-sheets', [OmrAnswerSheetController::class, 'index'])->name('exams.answer-sheets');
    Route::match(['get', 'post'], '/exams/{exam}/answer-sheets/generate', [OmrAnswerSheetController::class, 'generate'])->name('exams.answer-sheets.generate');
    Route::get('/exams/{exam}/answer-sheets/batches/{batch}/download', [OmrAnswerSheetController::class, 'downloadBatch'])->name('exams.answer-sheets.download-batch');
    Route::get('/exams/{exam}/answer-sheets/spec', [OmrAnswerSheetController::class, 'specification'])->name('exams.answer-sheets.spec');

    Route::get('/classes', [SchoolClassController::class, 'index'])->name('classes');
    Route::post('/classes', [SchoolClassController::class, 'store'])->name('classes.store');
    Route::get('/classes/{class}', [SchoolClassController::class, 'show'])->name('classes.show');
    Route::patch('/classes/{class}', [SchoolClassController::class, 'update'])->name('classes.update');
    Route::post('/classes/{class}/archive', [SchoolClassController::class, 'toggleArchive'])->name('classes.archive');
    Route::post('/classes/{class}/enroll', [SchoolClassController::class, 'enrollStudent'])->name('classes.enroll');
    Route::delete('/classes/{class}/students/{student}', [SchoolClassController::class, 'removeStudent'])->name('classes.remove-student');

    Route::get('/students', [StudentController::class, 'index'])->name('students');
    Route::post('/students', [StudentController::class, 'store'])->name('students.store');
    Route::patch('/students/{student}', [StudentController::class, 'update'])->name('students.update');
    Route::post('/students/{student}/archive', [StudentController::class, 'toggleArchive'])->name('students.archive');
    Route::post('/students/{student}/enroll', [StudentController::class, 'enrollInClass'])->name('students.enroll');
    Route::post('/students/import/preview', [StudentImportController::class, 'preview'])->name('students.import.preview');
    Route::post('/students/import/confirm', [StudentImportController::class, 'confirm'])->name('students.import.confirm');

    Route::get('/academic-setup', [AcademicSetupController::class, 'index'])->name('academic-setup');
    Route::post('/academic-periods', [AcademicPeriodController::class, 'store'])->name('academic-periods.store');
    Route::patch('/academic-periods/{period}', [AcademicPeriodController::class, 'update'])->name('academic-periods.update');
    Route::post('/academic-periods/{period}/archive', [AcademicPeriodController::class, 'toggleArchive'])->name('academic-periods.archive');
    Route::post('/academic-periods/{period}/set-current', [AcademicPeriodController::class, 'setCurrent'])->name('academic-periods.set-current');

    Route::post('/subjects', [SubjectController::class, 'store'])->name('subjects.store');
    Route::patch('/subjects/{subject}', [SubjectController::class, 'update'])->name('subjects.update');
    Route::post('/subjects/{subject}/archive', [SubjectController::class, 'toggleArchive'])->name('subjects.archive');

    Route::post('/sections', [SectionController::class, 'store'])->name('sections.store');
    Route::patch('/sections/{section}', [SectionController::class, 'update'])->name('sections.update');
    Route::post('/sections/{section}/archive', [SectionController::class, 'toggleArchive'])->name('sections.archive');

    Route::get('/workspace', [WorkspaceController::class, 'show'])->name('workspace');
    Route::patch('/workspace', [WorkspaceController::class, 'update'])->name('workspace.update');
    Route::get('/workspace/activity-logs/data', [WorkspaceController::class, 'activityLogsData'])->name('workspace.activity-logs.data');

    Route::post('/organization/invite', [InvitationController::class, 'store'])->name('organization.invite');
    Route::post('/departments', [DepartmentController::class, 'store'])->name('departments.store');
    Route::patch('/departments/{department}', [DepartmentController::class, 'update'])->name('departments.update');
    Route::delete('/departments/{department}', [DepartmentController::class, 'destroy'])->name('departments.destroy');
    Route::post('/departments/{department}/assign', [DepartmentController::class, 'assignMember'])->name('departments.assign');

    Route::get('/profile', [ProfileController::class, 'show'])->name('profile');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::put('/profile/password', [ProfileController::class, 'updatePassword'])->name('profile.password');

    Route::post('/tenant/switch', [TenantSwitchController::class, 'switch'])->name('tenant.switch');
});

Route::middleware(['auth', 'verified', 'superadmin'])->prefix('platform')->name('platform.')->group(function () {
    Route::get('/dashboard', [PlatformDashboardController::class, 'index'])->name('dashboard');

    Route::get('/users/export', [PlatformUsersController::class, 'export'])->name('users.export');
    Route::get('/users', [PlatformUsersController::class, 'index'])->name('users');
    Route::get('/users/data', [PlatformUsersController::class, 'data'])->name('users.data');
    Route::post('/users', [PlatformUsersController::class, 'store'])->name('users.store');
    Route::get('/users/{user}', [PlatformUsersController::class, 'show'])->name('users.show');
    Route::patch('/users/{user}', [PlatformUsersController::class, 'update'])->name('users.update');
    Route::delete('/users/{user}', [PlatformUsersController::class, 'destroy'])->name('users.destroy');
    Route::post('/users/{user}/suspend', [PlatformUsersController::class, 'suspend'])->name('users.suspend');
    Route::post('/users/{user}/activate', [PlatformUsersController::class, 'activate'])->name('users.activate');
    Route::post('/users/{user}/reset-password', [PlatformUsersController::class, 'resetPassword'])->name('users.reset-password');
    Route::post('/users/{user}/impersonate', [PlatformImpersonationController::class, 'impersonate'])->name('users.impersonate');

    Route::get('/tenants/export', [PlatformTenantsController::class, 'export'])->name('tenants.export');
    Route::get('/tenants', [PlatformTenantsController::class, 'index'])->name('tenants');
    Route::get('/tenants/data', [PlatformTenantsController::class, 'data'])->name('tenants.data');
    Route::post('/tenants', [PlatformTenantsController::class, 'store'])->name('tenants.store');
    Route::get('/tenants/{tenant}', [PlatformTenantsController::class, 'show'])->name('tenants.show');
    Route::patch('/tenants/{tenant}', [PlatformTenantsController::class, 'update'])->name('tenants.update');
    Route::delete('/tenants/{tenant}', [PlatformTenantsController::class, 'destroy'])->name('tenants.destroy');
    Route::post('/tenants/{tenant}/suspend', [PlatformTenantsController::class, 'suspend'])->name('tenants.suspend');
    Route::post('/tenants/{tenant}/activate', [PlatformTenantsController::class, 'activate'])->name('tenants.activate');
    Route::post('/tenants/{tenant}/members', [PlatformTenantsController::class, 'addMember'])->name('tenants.members.add');
    Route::patch('/tenants/{tenant}/members/{user}', [PlatformTenantsController::class, 'updateMemberRole'])->name('tenants.members.update');
    Route::delete('/tenants/{tenant}/members/{user}', [PlatformTenantsController::class, 'removeMember'])->name('tenants.members.remove');

    Route::get('/organizations', [PlatformOrganizationsController::class, 'index'])->name('organizations');
    Route::get('/organizations/data', [PlatformOrganizationsController::class, 'data'])->name('organizations.data');
    Route::post('/organizations', [PlatformOrganizationsController::class, 'store'])->name('organizations.store');
    Route::get('/organizations/{tenant}', [PlatformOrganizationsController::class, 'show'])->name('organizations.show');
    Route::post('/organizations/{tenant}/verify', [PlatformOrganizationsController::class, 'verify'])->name('organizations.verify');
    Route::post('/organizations/{tenant}/revoke-verification', [PlatformOrganizationsController::class, 'revokeVerification'])->name('organizations.revoke-verification');
    Route::post('/organizations/{tenant}/departments', [PlatformOrganizationsController::class, 'addDepartment'])->name('organizations.departments.store');
    Route::delete('/organizations/{tenant}/departments/{department}', [PlatformOrganizationsController::class, 'destroyDepartment'])->name('organizations.departments.destroy');

    Route::get('/subscriptions', [PlatformSubscriptionsController::class, 'index'])->name('subscriptions');
    Route::get('/subscriptions/data', [PlatformSubscriptionsController::class, 'data'])->name('subscriptions.data');
    Route::post('/subscriptions', [PlatformSubscriptionsController::class, 'store'])->name('subscriptions.store');
    Route::patch('/subscriptions/{subscription}', [PlatformSubscriptionsController::class, 'update'])->name('subscriptions.update');
    Route::post('/subscriptions/{subscription}/cancel', [PlatformSubscriptionsController::class, 'cancel'])->name('subscriptions.cancel');

    Route::get('/activity-logs', [PlatformAuditLogsController::class, 'index'])->name('activity-logs');
    Route::get('/activity-logs/data', [PlatformAuditLogsController::class, 'data'])->name('activity-logs.data');

    Route::get('/monitoring', [PlatformMonitoringController::class, 'index'])->name('monitoring');
    Route::post('/monitoring/clear-cache', [PlatformMonitoringController::class, 'clearCache'])->name('monitoring.clear-cache');
    Route::post('/monitoring/clear-config', [PlatformMonitoringController::class, 'clearConfig'])->name('monitoring.clear-config');
    Route::post('/monitoring/clear-routes', [PlatformMonitoringController::class, 'clearRoutes'])->name('monitoring.clear-routes');
    Route::post('/monitoring/clear-views', [PlatformMonitoringController::class, 'clearViews'])->name('monitoring.clear-views');
    Route::post('/monitoring/optimize', [PlatformMonitoringController::class, 'optimize'])->name('monitoring.optimize');
    Route::post('/monitoring/clear-logs', [PlatformMonitoringController::class, 'clearLogs'])->name('monitoring.clear-logs');

    Route::get('/settings', [PlatformSettingsController::class, 'index'])->name('settings');
    Route::post('/settings', [PlatformSettingsController::class, 'update'])->name('settings.update');
});
