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

$exam75 = new Examination([
    'title' => 'Summative TEst',
    'question_count' => 75,
    'choice_count' => 5,
]);
$exam75->ulid = '01M7DE04PCVEH1FYSKWGYCAH00';

$sheetData = [
    'institution_name' => 'ANTONIO JR PILOTON WORKSPACE',
    'sheet_ulid' => '01M7DE04PCVEH1FYSKWGYCAH00',
];

$png75 = $pngGenerator->generateSinglePng($exam75, $sheetData, OmrLayoutEngine::PAPER_A4);
file_put_contents('scratch/test_1up_75.png', $png75);

echo "1Up 75 items generated!\n";
