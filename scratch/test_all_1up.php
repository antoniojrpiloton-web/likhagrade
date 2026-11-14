<?php
require 'vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Examination;
use App\Services\Omr\OmrLayoutEngine;
use App\Services\Omr\OmrPngGenerator;

$layoutEngine = new OmrLayoutEngine();
$pngGenerator = new OmrPngGenerator($layoutEngine);

$sheetData = [
    'institution_name' => 'ANTONIO JR PILOTON WORKSPACE',
    'sheet_ulid' => '01M7DE04PCVEH1FYSKWGYCAH00',
];

$exam50 = new Examination(['title' => 'Biology Exam', 'question_count' => 50, 'choice_count' => 4]);
$exam50->ulid = '01M7DE04PCVEH1FYSKWGYCAH50';
file_put_contents('scratch/test_1up_50.png', $pngGenerator->generateSinglePng($exam50, $sheetData, OmrLayoutEngine::PAPER_A4));

$exam100 = new Examination(['title' => 'Final Exam', 'question_count' => 100, 'choice_count' => 5]);
$exam100->ulid = '01M7DE04PCVEH1FYSKWGYCA100';
file_put_contents('scratch/test_1up_100.png', $pngGenerator->generateSinglePng($exam100, $sheetData, OmrLayoutEngine::PAPER_A4));

$exam20 = new Examination(['title' => 'Short Quiz', 'question_count' => 20, 'choice_count' => 4]);
$exam20->ulid = '01M7DE04PCVEH1FYSKWGYCAH20';
file_put_contents('scratch/test_1up_20.png', $pngGenerator->generateSinglePng($exam20, $sheetData, OmrLayoutEngine::PAPER_A4));

echo "Generated 50, 100, 20!\n";
