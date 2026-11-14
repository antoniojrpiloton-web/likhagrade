<?php

namespace Tests\Feature\Academic;

use App\Actions\Auth\RegisterUserAction;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class TeacherDashboardTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_newly_created_teacher_workspace_can_access_dashboard_with_zero_academic_records(): void
    {
        $registerAction = app(RegisterUserAction::class);
        $teacher = $registerAction->execute([
            'first_name' => 'Maria',
            'last_name' => 'Santos',
            'email' => 'maria.santos@school.edu',
            'password' => 'Password123!',
        ]);
        $teacher->markEmailAsVerified();

        $workspace = $teacher->personalTenant();

        $response = $this->actingAs($teacher)
            ->withSession(['active_tenant_id' => $workspace->id])
            ->get(route('app.dashboard'));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('App/Dashboard')
            ->where('workspace.id', $workspace->id)
            ->where('stats.total_exams', 0)
            ->where('stats.total_scans', 0)
            ->where('stats.active_classes', 0)
            ->where('stats.registered_students', 0)
            ->where('stats.total_subjects', 0)
            ->has('recent_classes', 0)
            ->has('recent_exams', 0)
            ->has('recent_scans', 0)
        );
    }

    public function test_empty_workspace_does_not_redirect_to_forced_setup(): void
    {
        $registerAction = app(RegisterUserAction::class);
        $teacher = $registerAction->execute([
            'first_name' => 'Pedro',
            'last_name' => 'Cruz',
            'email' => 'pedro.cruz@school.edu',
            'password' => 'Password123!',
        ]);
        $teacher->markEmailAsVerified();

        $workspace = $teacher->personalTenant();

        $response = $this->actingAs($teacher)
            ->withSession(['active_tenant_id' => $workspace->id])
            ->get(route('app.dashboard'));

        $response->assertOk();
        $response->assertSessionMissing('errors');
    }
}
