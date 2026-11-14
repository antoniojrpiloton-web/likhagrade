<?php

namespace Tests\Feature\Academic;

use App\Actions\Auth\RegisterUserAction;
use App\Models\ClassEnrollment;
use App\Models\Examination;
use App\Models\OmrAnswerSheet;
use App\Models\OmrSheetBatch;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Services\Omr\OmrLayoutEngine;
use App\Services\Omr\QrCodeGenerator;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OmrAnswerSheetTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_teacher_can_view_answer_sheet_generator_page(): void
    {
        $teacher = $this->createTeacher('Sheet Teacher', 'sheetteach@test.com');
        $workspace = $teacher->personalTenant();

        $exam = Examination::create([
            'tenant_id' => $workspace->id,
            'title' => 'Biology Midterm Exam',
            'question_count' => 50,
            'choice_count' => 4,
            'points_per_question' => 1,
            'total_score' => 50,
            'status' => 'draft',
            'created_by' => $teacher->id,
        ]);

        $response = $this->actingAs($teacher)
            ->withSession(['active_tenant_id' => $workspace->id])
            ->get(route('app.exams.answer-sheets', $exam->id));

        $response->assertOk();
    }

    public function test_layout_engine_generates_accurate_single_page_specification(): void
    {
        $exam = new Examination([
            'question_count' => 50,
            'choice_count' => 4,
        ]);

        $engine = new OmrLayoutEngine;
        $specA4 = $engine->generateSpecification($exam, OmrLayoutEngine::PAPER_A4);

        $this->assertEquals(OmrLayoutEngine::VERSION, $specA4['template_version']);
        $this->assertEquals(OmrLayoutEngine::PAPER_A4, $specA4['paper_size']);
        $this->assertEquals(210.0, $specA4['page_width_mm']);
        $this->assertEquals(297.0, $specA4['page_height_mm']);
        $this->assertEquals(1, $specA4['total_pages']);

        $page = $specA4['pages'][0];
        $this->assertCount(4, $page['fiducials']);
        $this->assertArrayHasKey('top_left', $page['fiducials']);
        $this->assertArrayHasKey('top_right', $page['fiducials']);
        $this->assertArrayHasKey('bottom_left', $page['fiducials']);
        $this->assertArrayHasKey('bottom_right', $page['fiducials']);

        $this->assertEquals(5, $page['columns_count']);
        $this->assertCount(50 * 4, $page['bubbles_map']);

        $firstBubble = $page['bubbles_map']['1_A'];
        $this->assertNotNull($firstBubble);
        $this->assertEquals('A', $firstBubble['choice']);
        $this->assertGreaterThan(0, $firstBubble['center_x_mm']);
        $this->assertGreaterThan(0, $firstBubble['center_y_mm']);
        $this->assertGreaterThan(0, $firstBubble['norm_x']);
        $this->assertLessThan(1, $firstBubble['norm_x']);

        $specLetter = $engine->generateSpecification($exam, OmrLayoutEngine::PAPER_LETTER);
        $this->assertEquals(OmrLayoutEngine::PAPER_LETTER, $specLetter['paper_size']);
        $this->assertEquals(215.9, $specLetter['page_width_mm']);
        $this->assertEquals(279.4, $specLetter['page_height_mm']);

        $spec2Up = $engine->generateSpecification($exam, OmrLayoutEngine::PAPER_A4_2UP);
        $this->assertEquals(OmrLayoutEngine::PAPER_A4_2UP, $spec2Up['paper_size']);
        $this->assertTrue($spec2Up['is_2up']);
        $this->assertEquals(297.0, $spec2Up['page_width_mm']);
        $this->assertEquals(210.0, $spec2Up['page_height_mm']);
    }

    public function test_layout_engine_fits_all_questions_on_single_page(): void
    {
        $exam = new Examination([
            'question_count' => 120,
            'choice_count' => 4,
        ]);

        $engine = new OmrLayoutEngine;
        $spec = $engine->generateSpecification($exam, OmrLayoutEngine::PAPER_A4);

        $this->assertEquals(1, $spec['total_pages']);
        $this->assertCount(1, $spec['pages']);
        $this->assertEquals(1, $spec['pages'][0]['page_number']);
        $this->assertEquals(120, $spec['question_count']);
    }

    public function test_qr_code_generator_produces_valid_svg_and_data_uri(): void
    {
        $payload = 'LKG1:01JTESTSHEETULID0000000000:01JTESTEXAMULID0000000000:1:1';
        $svg = QrCodeGenerator::generateSvg($payload, 150);

        $this->assertStringContainsString('<svg', $svg);
        $this->assertStringContainsString('</svg>', $svg);
        $this->assertStringContainsString('shape-rendering="crispEdges"', $svg);

        $dataUri = QrCodeGenerator::generateDataUri($payload, 150);
        $this->assertStringStartsWith('data:image/svg+xml;base64,', $dataUri);
    }

    public function test_generic_answer_sheet_generation_and_pdf_download(): void
    {
        $teacher = $this->createTeacher('Generic Teacher', 'generic@test.com');
        $workspace = $teacher->personalTenant();

        $exam = Examination::create([
            'tenant_id' => $workspace->id,
            'title' => 'Grade 9 Science Quiz',
            'question_count' => 30,
            'choice_count' => 4,
            'points_per_question' => 1,
            'total_score' => 30,
            'status' => 'draft',
            'created_by' => $teacher->id,
        ]);

        $response = $this->actingAs($teacher)
            ->withSession(['active_tenant_id' => $workspace->id])
            ->post(route('app.exams.answer-sheets.generate', $exam->id), [
                'mode' => 'generic',
                'paper_size' => 'A4',
                'quantity' => 5,
            ]);

        $response->assertOk();
        $this->assertEquals('application/pdf', $response->headers->get('Content-Type'));

        $this->assertDatabaseHas('omr_sheet_batches', [
            'tenant_id' => $workspace->id,
            'examination_id' => $exam->id,
            'mode' => 'generic',
            'quantity' => 5,
            'paper_size' => 'A4',
        ]);

        $sheets = OmrAnswerSheet::where('tenant_id', $workspace->id)
            ->where('examination_id', $exam->id)
            ->get();

        $this->assertCount(5, $sheets);
        foreach ($sheets as $sheet) {
            $this->assertNotNull($sheet->sheet_ulid);
            $this->assertStringStartsWith('LKG1:', $sheet->qr_payload);
            $this->assertEquals('generic', $sheet->mode);
            $this->assertNull($sheet->student_id);
            $this->assertEquals('generated', $sheet->status);
        }
    }

    public function test_omr_answer_sheets_can_generate_batch_of_30_sheets_without_memory_exhaustion(): void
    {
        $teacher = $this->createTeacher('Teacher 30 Sheets', 'teacher30@test.com');
        $workspace = $teacher->personalTenant();

        $exam = Examination::create([
            'tenant_id' => $workspace->id,
            'title' => 'Biology 30-Sheet Quiz',
            'question_count' => 30,
            'choice_count' => 4,
            'points_per_question' => 1,
            'total_score' => 30,
            'status' => 'draft',
            'created_by' => $teacher->id,
        ]);

        $response = $this->actingAs($teacher)
            ->withSession(['active_tenant_id' => $workspace->id])
            ->get(route('app.exams.answer-sheets.generate', [
                'exam' => $exam,
                'mode' => 'generic',
                'paper_size' => 'A4',
                'quantity' => 30,
                'format' => 'pdf',
            ]));

        $response->assertOk();
        $this->assertEquals('application/pdf', $response->headers->get('Content-Type'));
        $this->assertNotEmpty($response->getContent());
    }

    public function test_student_assigned_answer_sheet_generation(): void
    {
        $teacher = $this->createTeacher('Assigned Teacher', 'assigned@test.com');
        $workspace = $teacher->personalTenant();

        $class = SchoolClass::create([
            'tenant_id' => $workspace->id,
            'name' => 'Section Rizal',
            'code' => 'SEC-RIZAL',
        ]);

        $student1 = Student::create([
            'tenant_id' => $workspace->id,
            'student_id' => 'STU-001',
            'first_name' => 'Jose',
            'last_name' => 'Rizal',
        ]);

        $student2 = Student::create([
            'tenant_id' => $workspace->id,
            'student_id' => 'STU-002',
            'first_name' => 'Andres',
            'last_name' => 'Bonifacio',
        ]);

        ClassEnrollment::create([
            'tenant_id' => $workspace->id,
            'class_id' => $class->id,
            'student_id' => $student1->id,
            'status' => 'active',
            'enrolled_at' => now(),
        ]);

        ClassEnrollment::create([
            'tenant_id' => $workspace->id,
            'class_id' => $class->id,
            'student_id' => $student2->id,
            'status' => 'active',
            'enrolled_at' => now(),
        ]);

        $exam = Examination::create([
            'tenant_id' => $workspace->id,
            'title' => 'History Assessment',
            'class_id' => $class->id,
            'question_count' => 20,
            'choice_count' => 4,
            'points_per_question' => 1,
            'total_score' => 20,
            'status' => 'draft',
            'created_by' => $teacher->id,
        ]);

        $response = $this->actingAs($teacher)
            ->withSession(['active_tenant_id' => $workspace->id])
            ->post(route('app.exams.answer-sheets.generate', $exam->id), [
                'mode' => 'student_assigned',
                'class_id' => $class->id,
                'paper_size' => 'A4',
            ]);

        $response->assertOk();
        $this->assertEquals('application/pdf', $response->headers->get('Content-Type'));

        $this->assertDatabaseHas('omr_sheet_batches', [
            'tenant_id' => $workspace->id,
            'examination_id' => $exam->id,
            'mode' => 'student_assigned',
            'quantity' => 2,
        ]);

        $this->assertDatabaseHas('omr_answer_sheets', [
            'tenant_id' => $workspace->id,
            'examination_id' => $exam->id,
            'student_id' => $student1->id,
            'mode' => 'student_assigned',
        ]);

        $this->assertDatabaseHas('omr_answer_sheets', [
            'tenant_id' => $workspace->id,
            'examination_id' => $exam->id,
            'student_id' => $student2->id,
            'mode' => 'student_assigned',
        ]);
    }

    public function test_batch_download_re_downloads_existing_sheets_pdf(): void
    {
        $teacher = $this->createTeacher('Batch DL Teacher', 'batchdl@test.com');
        $workspace = $teacher->personalTenant();

        $exam = Examination::create([
            'tenant_id' => $workspace->id,
            'title' => 'English Grammar Test',
            'question_count' => 25,
            'choice_count' => 4,
            'points_per_question' => 1,
            'total_score' => 25,
            'status' => 'draft',
            'created_by' => $teacher->id,
        ]);

        $batch = OmrSheetBatch::create([
            'tenant_id' => $workspace->id,
            'examination_id' => $exam->id,
            'mode' => 'generic',
            'paper_size' => 'A4',
            'quantity' => 2,
            'created_by' => $teacher->id,
        ]);

        OmrAnswerSheet::create([
            'tenant_id' => $workspace->id,
            'examination_id' => $exam->id,
            'batch_id' => $batch->id,
            'mode' => 'generic',
            'paper_size' => 'A4',
            'page_number' => 1,
            'total_pages' => 1,
            'status' => 'generated',
        ]);

        $response = $this->actingAs($teacher)
            ->withSession(['active_tenant_id' => $workspace->id])
            ->get(route('app.exams.answer-sheets.download-batch', [$exam->id, $batch->id]));

        $response->assertOk();
        $this->assertEquals('application/pdf', $response->headers->get('Content-Type'));
    }

    public function test_tenant_isolation_prevents_unauthorized_sheet_generation(): void
    {
        $teacherA = $this->createTeacher('Teacher A Sheets', 'teacherasheets@test.com');
        $workspaceA = $teacherA->personalTenant();

        $teacherB = $this->createTeacher('Teacher B Sheets', 'teacherbsheets@test.com');
        $workspaceB = $teacherB->personalTenant();

        $examA = Examination::create([
            'tenant_id' => $workspaceA->id,
            'title' => 'Private Exam A',
            'question_count' => 20,
            'choice_count' => 4,
            'points_per_question' => 1,
            'total_score' => 20,
            'status' => 'draft',
            'created_by' => $teacherA->id,
        ]);

        $response = $this->actingAs($teacherB)
            ->withSession(['active_tenant_id' => $workspaceB->id])
            ->get(route('app.exams.answer-sheets', $examA->id));

        $this->assertTrue(in_array($response->status(), [403, 404]));

        $genResponse = $this->actingAs($teacherB)
            ->withSession(['active_tenant_id' => $workspaceB->id])
            ->post(route('app.exams.answer-sheets.generate', $examA->id), [
                'mode' => 'generic',
                'paper_size' => 'A4',
                'quantity' => 1,
            ]);

        $this->assertTrue(in_array($genResponse->status(), [403, 404]));
    }

    public function test_mobile_api_sheet_template_and_verify_endpoints(): void
    {
        $teacher = $this->createTeacher('Mobile Sheet Teacher', 'mobilesheet@test.com');
        $workspace = $teacher->personalTenant();

        $exam = Examination::create([
            'tenant_id' => $workspace->id,
            'title' => 'Mobile Camera Test',
            'question_count' => 30,
            'choice_count' => 4,
            'points_per_question' => 1,
            'total_score' => 30,
            'status' => 'ready',
            'created_by' => $teacher->id,
        ]);

        $sheet = OmrAnswerSheet::create([
            'tenant_id' => $workspace->id,
            'examination_id' => $exam->id,
            'mode' => 'generic',
            'paper_size' => 'A4',
            'page_number' => 1,
            'total_pages' => 1,
            'status' => 'generated',
        ]);

        $loginRes = $this->postJson(route('api.auth.login'), [
            'email' => $teacher->email,
            'password' => 'Password123!',
            'device_name' => 'Scanner iPhone 15 Pro',
        ]);
        $token = $loginRes->json('token');

        $templateResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->withHeader('X-Tenant-ID', (string) $workspace->id)
            ->getJson("/api/v1/exams/{$exam->ulid}/sheet-template");

        $templateResponse->assertOk()
            ->assertJsonPath('data.template_version', OmrLayoutEngine::VERSION)
            ->assertJsonPath('data.question_count', 30);

        $verifyResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->withHeader('X-Tenant-ID', (string) $workspace->id)
            ->getJson("/api/v1/sheets/{$sheet->sheet_ulid}/verify");

        $verifyResponse->assertOk()
            ->assertJsonPath('data.sheet_ulid', $sheet->sheet_ulid)
            ->assertJsonPath('data.examination.ulid', $exam->ulid)
            ->assertJsonPath('data.status', 'generated');
    }

    public function test_omr_answer_sheets_can_be_generated_and_downloaded_as_png(): void
    {
        $teacher = $this->createTeacher('PNG Teacher', 'pngteach@test.com');
        $workspace = $teacher->personalTenant();

        $exam = Examination::create([
            'tenant_id' => $workspace->id,
            'title' => 'PNG Output Quiz',
            'question_count' => 30,
            'choice_count' => 4,
            'points_per_question' => 1,
            'total_score' => 30,
            'status' => 'draft',
            'created_by' => $teacher->id,
        ]);

        $response = $this->actingAs($teacher)
            ->withSession(['active_tenant_id' => $workspace->id])
            ->post(route('app.exams.answer-sheets.generate', $exam), [
                'mode' => 'generic',
                'quantity' => 1,
                'paper_size' => 'A4',
                'format' => 'png',
            ]);

        $response->assertOk();
        $this->assertEquals('image/png', $response->headers->get('Content-Type'));
        $this->assertNotEmpty($response->getContent());
    }

    public function test_omr_answer_sheets_can_generate_2up_landscape_sheets(): void
    {
        $teacher = $this->createTeacher('Teacher 2Up', 'teacher2up@test.com');
        $workspace = $teacher->personalTenant();

        $exam = Examination::create([
            'tenant_id' => $workspace->id,
            'title' => '2-Up Landscape Quiz',
            'question_count' => 50,
            'choice_count' => 4,
            'points_per_question' => 1,
            'total_score' => 50,
            'status' => 'draft',
            'created_by' => $teacher->id,
        ]);

        $response = $this->actingAs($teacher)
            ->withSession(['active_tenant_id' => $workspace->id])
            ->get(route('app.exams.answer-sheets.generate', [
                'exam' => $exam,
                'mode' => 'generic',
                'paper_size' => 'A4_2Up',
                'quantity' => 10,
                'format' => 'pdf',
            ]));

        $response->assertOk();
        $this->assertEquals('application/pdf', $response->headers->get('Content-Type'));
        $this->assertNotEmpty($response->getContent());
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
