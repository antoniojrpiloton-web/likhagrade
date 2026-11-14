<?php

namespace Tests\Feature\Academic;

use App\Actions\Auth\RegisterUserAction;
use App\Models\AcademicPeriod;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AcademicPeriodTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_teacher_can_create_and_manage_academic_periods(): void
    {
        $registerAction = app(RegisterUserAction::class);
        $teacher = $registerAction->execute([
            'first_name' => 'Elena',
            'last_name' => 'Torres',
            'email' => 'elena.torres@school.edu',
            'password' => 'Password123!',
        ]);
        $teacher->markEmailAsVerified();

        $workspace = $teacher->personalTenant();

        $createResponse = $this->actingAs($teacher)
            ->withSession(['active_tenant_id' => $workspace->id])
            ->post(route('app.academic-periods.store'), [
                'name' => 'AY 2026-2027 1st Semester',
                'code' => '2627-1S',
                'type' => 'semester',
                'start_date' => '2026-08-01',
                'end_date' => '2026-12-20',
                'is_current' => true,
            ]);

        $createResponse->assertSessionHasNoErrors();

        $period = AcademicPeriod::where('tenant_id', $workspace->id)->first();
        $this->assertNotNull($period);
        $this->assertEquals('AY 2026-2027 1st Semester', $period->name);
        $this->assertTrue($period->is_current);

        $createSecond = $this->actingAs($teacher)
            ->withSession(['active_tenant_id' => $workspace->id])
            ->post(route('app.academic-periods.store'), [
                'name' => 'AY 2026-2027 2nd Semester',
                'code' => '2627-2S',
                'type' => 'semester',
                'start_date' => '2027-01-10',
                'end_date' => '2027-05-30',
                'is_current' => true,
            ]);

        $createSecond->assertSessionHasNoErrors();

        $period->refresh();
        $this->assertFalse($period->is_current);

        $setResponse = $this->actingAs($teacher)
            ->withSession(['active_tenant_id' => $workspace->id])
            ->post(route('app.academic-periods.set-current', $period->id));

        $setResponse->assertSessionHasNoErrors();
        $period->refresh();
        $this->assertTrue($period->is_current);
    }
}
