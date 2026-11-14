<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use App\Models\ClassEnrollment;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Services\AuditService;
use App\Services\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Facades\Excel;

class StudentImportController extends Controller
{
    public function __construct(
        protected TenantContext $tenantContext,
        protected AuditService $auditService
    ) {}

    public function preview(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt,xlsx,xls', 'max:5120'],
        ]);

        $file = $request->file('file');
        $extension = strtolower($file->getClientOriginalExtension());
        $rows = [];

        if (in_array($extension, ['xlsx', 'xls'], true)) {
            $data = Excel::toArray([], $file);
            if (! empty($data) && ! empty($data[0])) {
                $sheet = $data[0];
                $headers = array_map(fn ($h) => strtolower(trim((string) $h)), array_shift($sheet));

                foreach ($sheet as $rawRow) {
                    if (empty(array_filter($rawRow))) {
                        continue;
                    }
                    $rowAssoc = [];
                    foreach ($headers as $index => $header) {
                        $cleanHeader = preg_replace('/[^a-z0-9_]/', '', str_replace([' ', '-'], '_', $header));
                        $rowAssoc[$cleanHeader] = isset($rawRow[$index]) ? trim((string) $rawRow[$index]) : '';
                    }
                    $rows[] = $rowAssoc;
                }
            }
        } else {
            $handle = fopen($file->getRealPath(), 'r');
            if ($handle !== false) {
                $headers = fgetcsv($handle);
                if ($headers) {
                    $headers = array_map(function ($h) {
                        $clean = strtolower(trim((string) $h));

                        return preg_replace('/[^a-z0-9_]/', '', str_replace([' ', '-'], '_', $clean));
                    }, $headers);

                    while (($rawRow = fgetcsv($handle)) !== false) {
                        if (empty(array_filter($rawRow))) {
                            continue;
                        }
                        $rowAssoc = [];
                        foreach ($headers as $index => $header) {
                            $rowAssoc[$header] = isset($rawRow[$index]) ? trim((string) $rawRow[$index]) : '';
                        }
                        $rows[] = $rowAssoc;
                    }
                }
                fclose($handle);
            }
        }

        $tenantId = $this->tenantContext->id();
        $existingStudentIds = Student::where('tenant_id', $tenantId)
            ->pluck('student_id')
            ->map(fn ($id) => strtolower($id))
            ->flip()
            ->all();

        $previewRows = [];
        $seenInBatch = [];

        foreach ($rows as $index => $row) {
            $studentId = $row['student_id'] ?? $row['id'] ?? $row['id_number'] ?? $row['student_number'] ?? '';
            $firstName = $row['first_name'] ?? $row['firstname'] ?? $row['given_name'] ?? '';
            $lastName = $row['last_name'] ?? $row['lastname'] ?? $row['surname'] ?? '';
            $middleName = $row['middle_name'] ?? $row['middlename'] ?? '';
            $email = $row['email'] ?? $row['email_address'] ?? '';
            $gender = $row['gender'] ?? $row['sex'] ?? '';
            $contact = $row['contact_number'] ?? $row['phone'] ?? $row['mobile'] ?? '';

            $status = 'valid';
            $error = null;

            if (empty($firstName) || empty($lastName)) {
                $status = 'error';
                $error = 'Missing required first name or last name.';
            } else {
                if (empty($studentId)) {
                    $studentId = Student::generateUniqueStudentId($tenantId);
                }
                $normalizedId = strtolower($studentId);
                if (isset($seenInBatch[$normalizedId])) {
                    $status = 'duplicate_in_file';
                    $error = 'Duplicate student ID within the file.';
                } elseif (isset($existingStudentIds[$normalizedId])) {
                    $status = 'already_exists';
                    $error = 'Student ID already registered in this workspace.';
                } else {
                    $seenInBatch[$normalizedId] = true;
                }
            }

            $previewRows[] = [
                'row_number' => $index + 1,
                'student_id' => $studentId,
                'first_name' => $firstName,
                'last_name' => $lastName,
                'middle_name' => $middleName,
                'email' => $email,
                'gender' => $gender,
                'contact_number' => $contact,
                'status' => $status,
                'error' => $error,
            ];
        }

        return response()->json([
            'total_rows' => count($previewRows),
            'valid_count' => count(array_filter($previewRows, fn ($r) => $r['status'] === 'valid')),
            'rows' => $previewRows,
        ]);
    }

    public function confirm(Request $request): RedirectResponse
    {
        $tenantId = $this->tenantContext->id();

        $validated = $request->validate([
            'rows' => ['required', 'array', 'min:1'],
            'rows.*.student_id' => ['nullable', 'string', 'max:60'],
            'rows.*.first_name' => ['required', 'string', 'max:100'],
            'rows.*.last_name' => ['required', 'string', 'max:100'],
            'rows.*.middle_name' => ['nullable', 'string', 'max:100'],
            'rows.*.email' => ['nullable', 'string', 'max:150'],
            'rows.*.gender' => ['nullable', 'string', 'max:30'],
            'rows.*.contact_number' => ['nullable', 'string', 'max:50'],
            'class_id' => ['nullable', 'exists:classes,id'],
        ]);

        $class = null;
        if (! empty($validated['class_id'])) {
            $class = SchoolClass::where('tenant_id', $tenantId)->find($validated['class_id']);
        }

        $importedCount = 0;

        DB::transaction(function () use ($validated, $tenantId, $class, &$importedCount) {
            foreach ($validated['rows'] as $rowData) {
                $studentId = ! empty($rowData['student_id'])
                    ? trim($rowData['student_id'])
                    : Student::generateUniqueStudentId($tenantId);

                $exists = Student::where('tenant_id', $tenantId)
                    ->where('student_id', $studentId)
                    ->exists();

                if ($exists) {
                    continue;
                }

                $student = Student::create([
                    'tenant_id' => $tenantId,
                    'student_id' => $studentId,
                    'first_name' => $rowData['first_name'],
                    'last_name' => $rowData['last_name'],
                    'middle_name' => $rowData['middle_name'] ?? null,
                    'email' => $rowData['email'] ?? null,
                    'gender' => $rowData['gender'] ?? null,
                    'contact_number' => $rowData['contact_number'] ?? null,
                    'is_archived' => false,
                ]);

                if ($class) {
                    ClassEnrollment::create([
                        'tenant_id' => $tenantId,
                        'class_id' => $class->id,
                        'student_id' => $student->id,
                        'enrolled_at' => now(),
                        'status' => 'enrolled',
                    ]);
                }

                $importedCount++;
            }
        });

        $this->auditService->log(
            'student.imported',
            "Imported {$importedCount} students via spreadsheet".($class ? " into class {$class->name}" : '')
        );

        return back()->with('success', "{$importedCount} students successfully imported.");
    }
}
