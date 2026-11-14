<?php

namespace Tests\Feature\Academic;

use App\Actions\Auth\RegisterUserAction;
use App\Models\AcademicPeriod;
use App\Models\Examination;
use App\Models\SchoolClass;
use App\Models\Subject;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExaminationManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_teacher_can_view_examinations_index(): void
    {
        $teacher = $this->createTeacher('Teacher A', 'teachera@test.com');
        $workspace = $teacher->personalTenant();

        $response = $this->actingAs($teacher)
            ->withSession(['active_tenant_id' => $workspace->id])
            ->get(route('app.exams'));

        $response->assertOk();
    }

    public function test_quick_exam_creation_redirects_immediately_to_answer_key_editor(): void
    {
        $teacher = $this->createTeacher('Teacher Quick', 'quick@test.com');
        $workspace = $teacher->personalTenant();

        $response = $this->actingAs($teacher)
            ->withSession(['active_tenant_id' => $workspace->id])
            ->post(route('app.exams.store'), [
                'title' => 'Biology Quick Quiz',
                'question_count' => 30,
                'choice_count' => 4,
            ]);

        $exam = Examination::where('tenant_id', $workspace->id)->first();
        $this->assertNotNull($exam);
        $this->assertNotNull($exam->ulid);
        $this->assertEquals('Biology Quick Quiz', $exam->title);
        $this->assertEquals(30, $exam->question_count);
        $this->assertEquals(4, $exam->choice_count);
        $this->assertEquals('draft', $exam->status);
        $this->assertCount(30, $exam->questions);

        $response->assertRedirect(route('app.exams.answer-key', $exam));
    }

    public function test_examination_can_be_created_with_optional_academic_associations(): void
    {
        $teacher = $this->createTeacher('Teacher Org', 'orgteach@test.com');
        $workspace = $teacher->personalTenant();

        $subject = Subject::create([
            'tenant_id' => $workspace->id,
            'name' => 'Physics 101',
            'code' => 'PHYS101',
        ]);

        $class = SchoolClass::create([
            'tenant_id' => $workspace->id,
            'name' => 'Grade 10 Einstein',
            'code' => 'G10-EIN',
        ]);

        $period = AcademicPeriod::create([
            'tenant_id' => $workspace->id,
            'name' => 'First Quarter',
            'code' => 'Q1',
            'start_date' => now()->toDateString(),
            'end_date' => now()->addMonths(3)->toDateString(),
        ]);

        $response = $this->actingAs($teacher)
            ->withSession(['active_tenant_id' => $workspace->id])
            ->post(route('app.exams.store'), [
                'title' => 'Quarter 1 Physics Exam',
                'description' => 'Calculator allowed for sections 1-3.',
                'question_count' => 50,
                'choice_count' => 5,
                'points_per_question' => 2,
                'passing_score' => 70,
                'passing_percentage' => 70,
                'subject_id' => $subject->id,
                'class_id' => $class->id,
                'academic_period_id' => $period->id,
                'exam_date' => now()->toDateString(),
            ]);

        $exam = Examination::where('tenant_id', $workspace->id)->where('title', 'Quarter 1 Physics Exam')->first();
        $this->assertNotNull($exam);
        $this->assertEquals($subject->id, $exam->subject_id);
        $this->assertEquals($class->id, $exam->class_id);
        $this->assertEquals($period->id, $exam->academic_period_id);
        $this->assertEquals(100.0, $exam->total_score);
        $this->assertEquals(5, $exam->choice_count);

        $response->assertRedirect(route('app.exams.answer-key', $exam));
    }

    public function test_examination_can_be_duplicated(): void
    {
        $teacher = $this->createTeacher('Teacher Dup', 'dup@test.com');
        $workspace = $teacher->personalTenant();

        $exam = Examination::create([
            'tenant_id' => $workspace->id,
            'title' => 'Original Chemistry Exam',
            'question_count' => 20,
            'choice_count' => 4,
            'points_per_question' => 1,
            'total_score' => 20,
            'status' => 'ready',
            'created_by' => $teacher->id,
        ]);

        $exam->questions()->where('question_number', 1)->update(['correct_answer' => 'A']);
        $exam->questions()->where('question_number', 2)->update(['correct_answer' => 'B']);

        $response = $this->actingAs($teacher)
            ->withSession(['active_tenant_id' => $workspace->id])
            ->post(route('app.exams.duplicate', $exam->id));

        $response->assertRedirect();

        $duplicates = Examination::where('tenant_id', $workspace->id)
            ->where('title', 'Copy of Original Chemistry Exam')
            ->get();

        $this->assertCount(1, $duplicates);
        $duplicate = $duplicates->first();

        $this->assertNotEquals($exam->id, $duplicate->id);
        $this->assertNotEquals($exam->ulid, $duplicate->ulid);
        $this->assertEquals('draft', $duplicate->status);
        $this->assertCount(20, $duplicate->questions);
        $this->assertEquals('A', $duplicate->questions()->where('question_number', 1)->value('correct_answer'));
        $this->assertEquals('B', $duplicate->questions()->where('question_number', 2)->value('correct_answer'));
    }

    public function test_examination_can_be_archived_and_restored(): void
    {
        $teacher = $this->createTeacher('Teacher Arc', 'arc@test.com');
        $workspace = $teacher->personalTenant();

        $exam = Examination::create([
            'tenant_id' => $workspace->id,
            'title' => 'History Quiz',
            'question_count' => 10,
            'choice_count' => 4,
            'points_per_question' => 1,
            'total_score' => 10,
            'status' => 'draft',
            'created_by' => $teacher->id,
        ]);

        $this->assertEquals('draft', $exam->status);

        $response = $this->actingAs($teacher)
            ->withSession(['active_tenant_id' => $workspace->id])
            ->post(route('app.exams.archive', $exam->id));

        $response->assertRedirect();
        $this->assertEquals('archived', $exam->fresh()->status);

        $this->actingAs($teacher)
            ->withSession(['active_tenant_id' => $workspace->id])
            ->post(route('app.exams.archive', $exam->id));

        $this->assertEquals('draft', $exam->fresh()->status);
    }

    public function test_examination_can_be_marked_ready_even_without_complete_answer_key(): void
    {
        $teacher = $this->createTeacher('Teacher Val', 'val@test.com');
        $workspace = $teacher->personalTenant();

        $exam = Examination::create([
            'tenant_id' => $workspace->id,
            'title' => 'Math Test',
            'question_count' => 5,
            'choice_count' => 4,
            'points_per_question' => 1,
            'total_score' => 5,
            'status' => 'draft',
            'created_by' => $teacher->id,
        ]);

        $response = $this->actingAs($teacher)
            ->withSession(['active_tenant_id' => $workspace->id])
            ->post(route('app.exams.status', $exam->id), [
                'status' => 'ready',
            ]);

        $response->assertSessionHas('success');
        $this->assertEquals('ready', $exam->fresh()->status);

        $exam2 = Examination::create([
            'tenant_id' => $workspace->id,
            'title' => 'English Test',
            'question_count' => 10,
            'choice_count' => 4,
            'points_per_question' => 1,
            'total_score' => 10,
            'status' => 'draft',
            'created_by' => $teacher->id,
        ]);

        $keyResponse = $this->actingAs($teacher)
            ->withSession(['active_tenant_id' => $workspace->id])
            ->put(route('app.exams.answer-key.update', $exam2->ulid), [
                'mark_as_ready' => true,
            ]);

        $keyResponse->assertSessionHas('success');
        $this->assertEquals('ready', $exam2->fresh()->status);
    }

    public function test_tenant_isolation_prevents_unauthorized_access(): void
    {
        $teacherA = $this->createTeacher('Teacher Alpha', 'alpha@test.com');
        $workspaceA = $teacherA->personalTenant();

        $teacherB = $this->createTeacher('Teacher Beta', 'beta@test.com');
        $workspaceB = $teacherB->personalTenant();

        $examA = Examination::create([
            'tenant_id' => $workspaceA->id,
            'title' => 'Alpha Private Exam',
            'question_count' => 10,
            'choice_count' => 4,
            'points_per_question' => 1,
            'total_score' => 10,
            'status' => 'draft',
            'created_by' => $teacherA->id,
        ]);

        $response = $this->actingAs($teacherB)
            ->withSession(['active_tenant_id' => $workspaceB->id])
            ->get(route('app.exams.show', $examA->id));

        $this->assertTrue(in_array($response->status(), [403, 404]));

        $editResponse = $this->actingAs($teacherB)
            ->withSession(['active_tenant_id' => $workspaceB->id])
            ->get(route('app.exams.edit', $examA->id));

        $this->assertTrue(in_array($editResponse->status(), [403, 404]));

        $dupResponse = $this->actingAs($teacherB)
            ->withSession(['active_tenant_id' => $workspaceB->id])
            ->post(route('app.exams.duplicate', $examA->id));

        $this->assertTrue(in_array($dupResponse->status(), [403, 404]));
    }

    protected function createTeacher(string $name, string $email)
    {
        $parts = explode(' ', $name, 2);
        $first = $parts[0];
        $last = $parts[1] ?? 'Teacher';

        $action = app(RegisterUserAction::class);
        $user = $action->execute([
            'first_name' => $first,
            'last_name' => $last,
            'email' => $email,
            'password' => 'Password123!',
        ]);
        $user->markEmailAsVerified();

        return $user;
    }
}
