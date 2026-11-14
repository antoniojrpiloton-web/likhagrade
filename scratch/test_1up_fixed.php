<?php
require 'vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Examination;
use App\Services\Omr\OmrLayoutEngine;

$exam75 = new Examination([
    'title' => 'Summative TEst',
    'question_count' => 75,
    'choice_count' => 5,
]);
$exam75->ulid = '01M7DE04PCVEH1FYSKWGYCAH00';

$scale = 200.0 / 25.4;
$pageWidthMm = 210.0;
$pageHeightMm = 297.0;
$widthPx = (int) round($pageWidthMm * $scale);
$heightPx = (int) round($pageHeightMm * $scale);

$image = imagecreatetruecolor($widthPx, $heightPx);
imageantialias($image, true);

$white = imagecolorallocate($image, 255, 255, 255);
$black = imagecolorallocate($image, 5, 5, 5);
$darkGray = imagecolorallocate($image, 45, 45, 45);

imagefilledrectangle($image, 0, 0, $widthPx, $heightPx, $white);

$fontRegular = 'vendor/dompdf/dompdf/lib/fonts/DejaVuSans.ttf';
$fontBold = 'vendor/dompdf/dompdf/lib/fonts/DejaVuSans-Bold.ttf';

$sqSize = (int) round(8.5 * $scale);
$margin = (int) round(6.0 * $scale);

$corners = [
    [$margin, $margin],
    [$widthPx - $margin - $sqSize, $margin],
    [$margin, $heightPx - $margin - $sqSize],
    [$widthPx - $margin - $sqSize, $heightPx - $margin - $sqSize],
];
foreach ($corners as $c) {
    imagefilledrectangle($image, $c[0], $c[1], $c[0] + $sqSize, $c[1] + $sqSize, $black);
}

$headerLeft = (int) round(18.0 * $scale);

imagettftext($image, 12.0, 0, $headerLeft, (int) round(12.0 * $scale), $black, $fontBold, 'ANTONIO JR PILOTON WORKSPACE');
imagettftext($image, 22.0, 0, $headerLeft, (int) round(19.0 * $scale), $black, $fontBold, 'ANSWER SHEET');
imagettftext($image, 15.0, 0, $headerLeft, (int) round(24.5 * $scale), $black, $fontBold, 'Summative TEst');
imagettftext($image, 12.0, 0, $headerLeft, (int) round(29.0 * $scale), $darkGray, $fontRegular, 'General • BSIT • Date: 2026-11-14');

imagettftext($image, 12.0, 0, $headerLeft, (int) round(34.5 * $scale), $black, $fontBold, 'NAME: __________________________________________________');
imagettftext($image, 12.0, 0, $headerLeft, (int) round(39.5 * $scale), $black, $fontBold, 'ID: ___________________  SECTION: __________________  DATE: ________________');

$codeBoxW = (int) round(54.0 * $scale);
$codeBoxH = (int) round(28.0 * $scale);
$codeBoxX = $widthPx - $margin - $sqSize - $codeBoxW - (int) round(3.5 * $scale);
$codeBoxY = (int) round(7.5 * $scale);

imagerectangle($image, $codeBoxX, $codeBoxY, $codeBoxX + $codeBoxW, $codeBoxY + $codeBoxH, $black);

$sheetNumericCode = '287936';
$codeLabel = "SHEET CODE {$sheetNumericCode} - do not shade";
imagettftext($image, 12.0, 0, $codeBoxX + 6, $codeBoxY - 5, $black, $fontBold, $codeLabel);

$digits = str_split($sheetNumericCode);
$stepX = ($codeBoxW - ((int) round(5.0 * $scale))) / 10;
$stepY = ($codeBoxH - ((int) round(3.6 * $scale))) / 7;

for ($d = 0; $d < 10; $d++) {
    $dx = $codeBoxX + (int) round(2.5 * $scale) + ($d * $stepX) + ($stepX / 2);
    imagettftext($image, 8.0, 0, (int) ($dx - 4), (int) ($codeBoxY + 11), $black, $fontBold, (string) $d);
}

for ($r = 0; $r < 6; $r++) {
    $activeVal = isset($digits[$r]) ? (int) $digits[$r] : -1;
    $ry = $codeBoxY + (int) round(2.0 * $scale) + (($r + 1.2) * $stepY) + 6;
    for ($d = 0; $d < 10; $d++) {
        $dx = $codeBoxX + (int) round(2.5 * $scale) + ($d * $stepX) + ($stepX / 2);
        $bRad = (int) round(1.4 * $scale);
        if ($d === $activeVal) {
            imagefilledellipse($image, (int) $dx, (int) $ry, $bRad * 2, $bRad * 2, $black);
        } else {
            imageellipse($image, (int) $dx, (int) $ry, $bRad * 2, $bRad * 2, $black);
        }
    }
}

$lineLeft = (int) round(16.0 * $scale);
$lineRight = $widthPx - (int) round(16.0 * $scale);
$lineY = (int) round(42.5 * $scale);
imageline($image, $lineLeft, $lineY, $lineRight, $lineY, $black);

$qCount = 75;
$questionsPerColumn = 25;
$columnsCount = (int) ceil($qCount / $questionsPerColumn);
$choices = ['A', 'B', 'C', 'D', 'E'];

$contentLeft = 16.0;
$contentWidth = 210.0 - 32.0;
$columnWidth = $contentWidth / $columnsCount;

$gridTop = 50.0;
$gridBottom = 272.0;
$rowHeight = ($gridBottom - $gridTop) / 25;

$numOffset = 10.5;
$bubbleSpacingX = 6.2;
$bubbleRadius = 2.4;

for ($c = 0; $c < $columnsCount; $c++) {
    $startQ = ($c * $questionsPerColumn) + 1;
    $endQ = min($qCount, $startQ + $questionsPerColumn - 1);
    
    $colLeftX = $contentLeft + ($c * $columnWidth);
    $bubbleStartX = $colLeftX + $numOffset;
    
    $chY = (int) round(47.5 * $scale);
    foreach ($choices as $ci => $ch) {
        $chX = (int) round(($bubbleStartX + ($ci * $bubbleSpacingX)) * $scale);
        $bbox = imagettfbbox(12.0, 0, $fontBold, $ch);
        $tw = abs($bbox[2] - $bbox[0]);
        imagettftext($image, 12.0, 0, (int) round($chX - ($tw / 2)), $chY, $black, $fontBold, $ch);
    }
    
    for ($qNum = $startQ; $qNum <= $endQ; $qNum++) {
        $r = $qNum - $startQ;
        $rowY = $gridTop + ($r * $rowHeight) + ($rowHeight / 2);
        $rowYPx = (int) round($rowY * $scale);
        
        $qStr = sprintf('%d.', $qNum);
        $bbox = imagettfbbox(12.0, 0, $fontBold, $qStr);
        $qw = abs($bbox[2] - $bbox[0]);
        $firstBubbleXPx = (int) round($bubbleStartX * $scale);
        $numRightXPx = $firstBubbleXPx - (int) round($bubbleRadius * $scale) - (int) round(2.5 * $scale);
        imagettftext($image, 12.0, 0, $numRightXPx - $qw, $rowYPx + 4, $black, $fontBold, $qStr);
        
        foreach ($choices as $ci => $ch) {
            $bxPx = (int) round(($bubbleStartX + ($ci * $bubbleSpacingX)) * $scale);
            $bRadPx = (int) round($bubbleRadius * $scale);
            imageellipse($image, $bxPx, $rowYPx, $bRadPx * 2, $bRadPx * 2, $black);
        }
    }
}

$botY = (int) round(288.0 * $scale);
$botText = 'Shade ONE circle for each item, completely. Do not fold, stain or write on the black squares and the sheet code.';
$bbox = imagettfbbox(12.0, 0, $fontRegular, $botText);
$bw = abs($bbox[2] - $bbox[0]);
$bx = (int) ($lineLeft + ((($lineRight - $lineLeft) - $bw) / 2));
imagettftext($image, 12.0, 0, $bx, $botY, $black, $fontRegular, $botText);

imagepng($image, 'scratch/test_1up_fixed.png', 6);
imagedestroy($image);
echo "1Up fixed preview generated!\n";
