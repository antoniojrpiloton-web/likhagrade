<?php

namespace Tests\Feature\Academic;

use App\Actions\Auth\RegisterUserAction;
use App\Models\Section;
use App\Models\Subject;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SubjectAndSectionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_teacher_can_create_edit_and_archive_subjects(): void
    {
        $registerAction = app(RegisterUserAction::class);
        $teacher = $registerAction->execute([
            'first_name' => 'Ana',
            'last_name' => 'Reyes',
            'email' => 'ana.reyes@school.edu',
            'password' => 'Password123!',
        ]);
        $teacher->markEmailAsVerified();

        $workspace = $teacher->personalTenant();

        $createResponse = $this->actingAs($teacher)
            ->withSession(['active_tenant_id' => $workspace->id])
            ->post(route('app.subjects.store'), [
                'name' => 'General Mathematics',
                'code' => 'MATH101',
                'description' => 'Algebra and trigonometry foundation.',
                'color' => '#3b82f6',
            ]);

        $createResponse->assertSessionHasNoErrors();
        $createResponse->assertRedirect();

        $subject = Subject::where('tenant_id', $workspace->id)->first();
        $this->assertNotNull($subject);
        $this->assertEquals('General Mathematics', $subject->name);
        $this->assertEquals('MATH101', $subject->code);
        $this->assertFalse($subject->is_archived);

        $updateResponse = $this->actingAs($teacher)
            ->withSession(['active_tenant_id' => $workspace->id])
            ->patch(route('app.subjects.update', $subject->id), [
                'name' => 'Advanced Mathematics',
                'code' => 'MATH102',
                'description' => 'Calculus foundation.',
                'color' => '#10b981',
            ]);

        $updateResponse->assertSessionHasNoErrors();
        $subject->refresh();
        $this->assertEquals('Advanced Mathematics', $subject->name);
        $this->assertEquals('MATH102', $subject->code);

        $archiveResponse = $this->actingAs($teacher)
            ->withSession(['active_tenant_id' => $workspace->id])
            ->post(route('app.subjects.archive', $subject->id));

        $archiveResponse->assertSessionHasNoErrors();
        $subject->refresh();
        $this->assertTrue($subject->is_archived);

        $restoreResponse = $this->actingAs($teacher)
            ->withSession(['active_tenant_id' => $workspace->id])
            ->post(route('app.subjects.archive', $subject->id));

        $restoreResponse->assertSessionHasNoErrors();
        $subject->refresh();
        $this->assertFalse($subject->is_archived);
    }

    public function test_teacher_can_create_edit_and_archive_sections(): void
    {
        $registerAction = app(RegisterUserAction::class);
        $teacher = $registerAction->execute([
            'first_name' => 'Carlos',
            'last_name' => 'Tan',
            'email' => 'carlos.tan@school.edu',
            'password' => 'Password123!',
        ]);
        $teacher->markEmailAsVerified();

        $workspace = $teacher->personalTenant();

        $createResponse = $this->actingAs($teacher)
            ->withSession(['active_tenant_id' => $workspace->id])
            ->post(route('app.sections.store'), [
                'name' => 'Grade 10 - Diamond',
                'code' => 'G10-DIA',
                'grade_level' => 'Grade 10',
                'room' => 'Rm 301',
            ]);

        $createResponse->assertSessionHasNoErrors();

        $section = Section::where('tenant_id', $workspace->id)->first();
        $this->assertNotNull($section);
        $this->assertEquals('Grade 10 - Diamond', $section->name);

        $updateResponse = $this->actingAs($teacher)
            ->withSession(['active_tenant_id' => $workspace->id])
            ->patch(route('app.sections.update', $section->id), [
                'name' => 'Grade 10 - Emerald',
                'code' => 'G10-EME',
                'grade_level' => 'Grade 10',
                'room' => 'Rm 302',
            ]);

        $updateResponse->assertSessionHasNoErrors();
        $section->refresh();
        $this->assertEquals('Grade 10 - Emerald', $section->name);

        $archiveResponse = $this->actingAs($teacher)
            ->withSession(['active_tenant_id' => $workspace->id])
            ->post(route('app.sections.archive', $section->id));

        $archiveResponse->assertSessionHasNoErrors();
        $section->refresh();
        $this->assertTrue($section->is_archived);
    }

    public function test_tenant_isolation_prevents_cross_workspace_subject_tampering(): void
    {
        $registerAction = app(RegisterUserAction::class);
        $teacherA = $registerAction->execute([
            'first_name' => 'Teacher',
            'last_name' => 'One',
            'email' => 'teacher1@school.edu',
            'password' => 'Password123!',
        ]);
        $teacherA->markEmailAsVerified();

        $teacherB = $registerAction->execute([
            'first_name' => 'Teacher',
            'last_name' => 'Two',
            'email' => 'teacher2@school.edu',
            'password' => 'Password123!',
        ]);
        $teacherB->markEmailAsVerified();

        $workspaceA = $teacherA->personalTenant();
        $workspaceB = $teacherB->personalTenant();

        $subjectA = Subject::create([
            'tenant_id' => $workspaceA->id,
            'name' => 'Private Subject A',
            'code' => 'PSA',
            'is_archived' => false,
        ]);

        $response = $this->actingAs($teacherB)
            ->withSession(['active_tenant_id' => $workspaceB->id])
            ->patch(route('app.subjects.update', $subjectA->id), [
                'name' => 'Hacked Subject',
            ]);

        $response->assertForbidden();
        $subjectA->refresh();
        $this->assertEquals('Private Subject A', $subjectA->name);
    }
}
