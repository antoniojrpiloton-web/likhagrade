<?php

namespace Tests\Feature\Academic;

use App\Actions\Auth\RegisterUserAction;
use App\Models\Examination;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AnswerKeyTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_teacher_can_access_answer_key_editor(): void
    {
        $teacher = $this->createTeacher('Key Teacher', 'key@test.com');
        $workspace = $teacher->personalTenant();

        $exam = Examination::create([
            'tenant_id' => $workspace->id,
            'title' => 'English Vocabulary Test',
            'question_count' => 10,
            'choice_count' => 4,
            'points_per_question' => 1,
            'total_score' => 10,
            'status' => 'draft',
            'created_by' => $teacher->id,
        ]);

        $response = $this->actingAs($teacher)
            ->withSession(['active_tenant_id' => $workspace->id])
            ->get(route('app.exams.answer-key', $exam->id));

        $response->assertOk();
    }

    public function test_teacher_can_save_draft_answer_keys_with_custom_points(): void
    {
        $teacher = $this->createTeacher('Key Teacher 2', 'key2@test.com');
        $workspace = $teacher->personalTenant();

        $exam = Examination::create([
            'tenant_id' => $workspace->id,
            'title' => 'Calculus Quiz',
            'question_count' => 3,
            'choice_count' => 4,
            'points_per_question' => 1,
            'total_score' => 3,
            'status' => 'draft',
            'created_by' => $teacher->id,
        ]);

        $response = $this->actingAs($teacher)
            ->withSession(['active_tenant_id' => $workspace->id])
            ->put(route('app.exams.answer-key.update', $exam->id), [
                'answers' => [
                    ['question_number' => 1, 'correct_answer' => 'A', 'points' => 2],
                    ['question_number' => 2, 'correct_answer' => 'C', 'points' => 3],
                    ['question_number' => 3, 'correct_answer' => null, 'points' => 1],
                ],
            ]);

        $response->assertRedirect();

        $q1 = $exam->questions()->where('question_number', 1)->first();
        $q2 = $exam->questions()->where('question_number', 2)->first();
        $q3 = $exam->questions()->where('question_number', 3)->first();

        $this->assertEquals('A', $q1->correct_answer);
        $this->assertEquals(2.0, $q1->points);
        $this->assertEquals('C', $q2->correct_answer);
        $this->assertEquals(3.0, $q2->points);
        $this->assertNull($q3->correct_answer);

        $this->assertEquals(6.0, $exam->fresh()->total_score);
    }

    public function test_bulk_answer_entry_with_continuous_string(): void
    {
        $teacher = $this->createTeacher('Bulk Teacher', 'bulk@test.com');
        $workspace = $teacher->personalTenant();

        $exam = Examination::create([
            'tenant_id' => $workspace->id,
            'title' => 'Social Science Quiz',
            'question_count' => 5,
            'choice_count' => 4,
            'points_per_question' => 1,
            'total_score' => 5,
            'status' => 'draft',
            'created_by' => $teacher->id,
        ]);

        $response = $this->actingAs($teacher)
            ->withSession(['active_tenant_id' => $workspace->id])
            ->put(route('app.exams.answer-key.update', $exam->id), [
                'bulk_string' => 'ABDCA',
            ]);

        $response->assertRedirect();

        $this->assertEquals('A', $exam->questions()->where('question_number', 1)->value('correct_answer'));
        $this->assertEquals('B', $exam->questions()->where('question_number', 2)->value('correct_answer'));
        $this->assertEquals('D', $exam->questions()->where('question_number', 3)->value('correct_answer'));
        $this->assertEquals('C', $exam->questions()->where('question_number', 4)->value('correct_answer'));
        $this->assertEquals('A', $exam->questions()->where('question_number', 5)->value('correct_answer'));
    }

    public function test_bulk_answer_entry_with_key_value_string(): void
    {
        $teacher = $this->createTeacher('KV Teacher', 'kv@test.com');
        $workspace = $teacher->personalTenant();

        $exam = Examination::create([
            'tenant_id' => $workspace->id,
            'title' => 'Literature Quiz',
            'question_count' => 5,
            'choice_count' => 4,
            'points_per_question' => 1,
            'total_score' => 5,
            'status' => 'draft',
            'created_by' => $teacher->id,
        ]);

        $response = $this->actingAs($teacher)
            ->withSession(['active_tenant_id' => $workspace->id])
            ->put(route('app.exams.answer-key.update', $exam->id), [
                'bulk_string' => '1:B, 2:C, 3:A, 4:D, 5:B',
            ]);

        $response->assertRedirect();

        $this->assertEquals('B', $exam->questions()->where('question_number', 1)->value('correct_answer'));
        $this->assertEquals('C', $exam->questions()->where('question_number', 2)->value('correct_answer'));
        $this->assertEquals('A', $exam->questions()->where('question_number', 3)->value('correct_answer'));
        $this->assertEquals('D', $exam->questions()->where('question_number', 4)->value('correct_answer'));
        $this->assertEquals('B', $exam->questions()->where('question_number', 5)->value('correct_answer'));
    }

    public function test_publishing_answer_key_validates_completeness_and_marks_ready(): void
    {
        $teacher = $this->createTeacher('Publish Teacher', 'publish@test.com');
        $workspace = $teacher->personalTenant();

        $exam = Examination::create([
            'tenant_id' => $workspace->id,
            'title' => 'General Science',
            'question_count' => 3,
            'choice_count' => 4,
            'points_per_question' => 1,
            'total_score' => 3,
            'status' => 'draft',
            'created_by' => $teacher->id,
        ]);

        $response = $this->actingAs($teacher)
            ->withSession(['active_tenant_id' => $workspace->id])
            ->put(route('app.exams.answer-key.update', $exam->id), [
                'answers' => [
                    ['question_number' => 1, 'correct_answer' => 'A'],
                    ['question_number' => 2, 'correct_answer' => 'B'],
                    ['question_number' => 3, 'correct_answer' => 'C'],
                ],
                'mark_as_ready' => true,
            ]);

        $response->assertRedirect();
        $this->assertEquals('ready', $exam->fresh()->status);
    }

    public function test_publishing_answer_key_fails_if_any_question_is_unanswered(): void
    {
        $teacher = $this->createTeacher('Incomplete Teacher', 'inc@test.com');
        $workspace = $teacher->personalTenant();

        $exam = Examination::create([
            'tenant_id' => $workspace->id,
            'title' => 'Incomplete Exam',
            'question_count' => 3,
            'choice_count' => 4,
            'points_per_question' => 1,
            'total_score' => 3,
            'status' => 'draft',
            'created_by' => $teacher->id,
        ]);

        $response = $this->actingAs($teacher)
            ->withSession(['active_tenant_id' => $workspace->id])
            ->put(route('app.exams.answer-key.update', $exam->id), [
                'answers' => [
                    ['question_number' => 1, 'correct_answer' => 'A'],
                    ['question_number' => 2, 'correct_answer' => 'B'],
                ],
                'mark_as_ready' => true,
            ]);

        $response->assertSessionHas('error');
        $this->assertEquals('draft', $exam->fresh()->status);
    }

    public function test_mobile_api_answer_key_and_readiness_endpoints(): void
    {
        $teacher = $this->createTeacher('API Teacher', 'api@test.com');
        $workspace = $teacher->personalTenant();

        $exam = Examination::create([
            'tenant_id' => $workspace->id,
            'title' => 'API Exam Test',
            'question_count' => 4,
            'choice_count' => 4,
            'points_per_question' => 1,
            'total_score' => 4,
            'status' => 'draft',
            'created_by' => $teacher->id,
        ]);

        $exam->questions()->where('question_number', 1)->update(['correct_answer' => 'A']);
        $exam->questions()->where('question_number', 2)->update(['correct_answer' => 'B']);
        $exam->questions()->where('question_number', 3)->update(['correct_answer' => 'C']);
        $exam->questions()->where('question_number', 4)->update(['correct_answer' => 'D']);
        $exam->update(['status' => 'ready']);

        $loginRes = $this->postJson(route('api.auth.login'), [
            'email' => $teacher->email,
            'password' => 'Password123!',
            'device_name' => 'Test Device',
        ]);
        $token = $loginRes->json('token');

        $listResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->withHeader('X-Tenant-ID', (string) $workspace->id)
            ->getJson('/api/v1/exams');

        $listResponse->assertOk()
            ->assertJsonPath('data.0.ulid', $exam->ulid);

        $detailResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->withHeader('X-Tenant-ID', (string) $workspace->id)
            ->getJson("/api/v1/exams/{$exam->ulid}");

        $detailResponse->assertOk()
            ->assertJsonPath('data.title', 'API Exam Test');

        $keyResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->withHeader('X-Tenant-ID', (string) $workspace->id)
            ->getJson("/api/v1/exams/{$exam->ulid}/answer-key");

        $keyResponse->assertOk()
            ->assertJsonPath('data.is_complete', true)
            ->assertJsonPath('data.questions.0.correct_answer', 'A');

        $readinessResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->withHeader('X-Tenant-ID', (string) $workspace->id)
            ->getJson("/api/v1/exams/{$exam->ulid}/readiness");

        $readinessResponse->assertOk()
            ->assertJsonPath('data.ready_for_scanning', true);
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
