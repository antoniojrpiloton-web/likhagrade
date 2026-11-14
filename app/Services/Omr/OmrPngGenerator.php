<?php

namespace App\Services\Omr;

use App\Models\Examination;
use ZipArchive;

class OmrPngGenerator
{
    protected float $dpi = 200.0;

    public function __construct(
        protected OmrLayoutEngine $layoutEngine
    ) {}

    public function generateSinglePng(Examination $exam, array $sheetData, string $paperSize = 'A4'): string
    {
        $image = $this->renderGdResource($exam, $sheetData, $paperSize);

        ob_start();
        imagepng($image, null, 6);
        $rawPng = ob_get_clean();
        imagedestroy($image);

        return $rawPng;
    }

    public function renderPageToJpegFile(Examination $exam, array $sheetData, string $paperSize, string $filePath): void
    {
        $image = $this->renderGdResource($exam, $sheetData, $paperSize);
        imagejpeg($image, $filePath, 96);
        imagedestroy($image);
    }

    public function generateZip(Examination $exam, array $sheetsData, string $paperSize = 'A4'): string
    {
        $tempFile = tempnam(sys_get_temp_dir(), 'omr_png_');
        $zip = new ZipArchive;
        $zip->open($tempFile, ZipArchive::CREATE | ZipArchive::OVERWRITE);

        $spec = $this->layoutEngine->generateSpecification($exam, $paperSize);
        $is2Up = ! empty($spec['is_2up']);

        if ($is2Up) {
            $totalPairs = (int) ceil(count($sheetsData) / 2);
            for ($p = 0; $p < $totalPairs; $p++) {
                $leftSheet = $sheetsData[$p * 2];
                $rightSheet = $sheetsData[($p * 2) + 1] ?? $leftSheet;
                $pageData = ['left' => $leftSheet, 'right' => $rightSheet];
                $pngContent = $this->generateSinglePng($exam, $pageData, $paperSize);
                $pageIndex = sprintf('%03d', $p + 1);
                $entryName = "sheet-{$exam->ulid}-page-{$pageIndex}.png";
                $zip->addFromString($entryName, $pngContent);
            }
        } else {
            foreach ($sheetsData as $index => $sheet) {
                $pngContent = $this->generateSinglePng($exam, $sheet, $paperSize);
                $studentSuffix = ! empty($sheet['student_id']) ? "-{$sheet['student_id']}" : sprintf('-%03d', $index + 1);
                $entryName = "sheet-{$exam->ulid}{$studentSuffix}.png";
                $zip->addFromString($entryName, $pngContent);
            }
        }

        $zip->close();
        $zipData = file_get_contents($tempFile);
        @unlink($tempFile);

        return $zipData;
    }

    public function renderGdResource(Examination $exam, array $sheetData, string $paperSize = 'A4'): \GdImage
    {
        $spec = $this->layoutEngine->generateSpecification($exam, $paperSize);
        $is2Up = ! empty($spec['is_2up']);

        if ($is2Up) {
            return $this->render2UpLandscape($exam, $sheetData, $spec);
        }

        return $this->render1UpPortrait($exam, $sheetData, $spec);
    }

    protected function render2UpLandscape(Examination $exam, array $sheetData, array $spec): \GdImage
    {
        $scale = $this->dpi / 25.4;
        $pageWidthMm = $spec['page_width_mm'];
        $pageHeightMm = $spec['page_height_mm'];
        $widthPx = (int) round($pageWidthMm * $scale);
        $heightPx = (int) round($pageHeightMm * $scale);

        $image = imagecreatetruecolor($widthPx, $heightPx);
        imageantialias($image, true);

        $white = imagecolorallocate($image, 255, 255, 255);
        $black = imagecolorallocate($image, 5, 5, 5);
        $darkGray = imagecolorallocate($image, 45, 45, 45);
        $midGray = imagecolorallocate($image, 110, 110, 110);
        $cutLineColor = imagecolorallocate($image, 180, 180, 180);

        imagefilledrectangle($image, 0, 0, $widthPx, $heightPx, $white);

        $fontRegular = base_path('vendor/dompdf/dompdf/lib/fonts/DejaVuSans.ttf');
        $fontBold = base_path('vendor/dompdf/dompdf/lib/fonts/DejaVuSans-Bold.ttf');
        $hasTtf = file_exists($fontRegular) && file_exists($fontBold);

        $midX = (int) round(($pageWidthMm / 2) * $scale);
        $dashLen = (int) round(2.0 * $scale);
        $gapLen = (int) round(2.0 * $scale);

        for ($y = (int) round(5.0 * $scale); $y < $heightPx - (int) round(5.0 * $scale); $y += ($dashLen + $gapLen)) {
            imageline($image, $midX, $y, $midX, min($y + $dashLen, $heightPx - (int) round(5.0 * $scale)), $cutLineColor);
        }

        $leftSheet = $sheetData['left'] ?? $sheetData;
        $rightSheet = $sheetData['right'] ?? $sheetData;

        $halfW = round($pageWidthMm / 2, 2);

        $this->renderReferenceSheetHalf(
            $image,
            $exam,
            $leftSheet,
            0.0,
            $halfW,
            $pageHeightMm,
            $spec['pages'][0],
            $scale,
            $hasTtf,
            $fontRegular,
            $fontBold,
            $black,
            $darkGray,
            $midGray,
            $white,
            true
        );

        $this->renderReferenceSheetHalf(
            $image,
            $exam,
            $rightSheet,
            $halfW,
            $halfW,
            $pageHeightMm,
            $spec['pages'][0],
            $scale,
            $hasTtf,
            $fontRegular,
            $fontBold,
            $black,
            $darkGray,
            $midGray,
            $white,
            true
        );

        return $image;
    }

    protected function render1UpPortrait(Examination $exam, array $sheetData, array $spec): \GdImage
    {
        $scale = $this->dpi / 25.4;
        $pageWidthMm = $spec['page_width_mm'];
        $pageHeightMm = $spec['page_height_mm'];
        $widthPx = (int) round($pageWidthMm * $scale);
        $heightPx = (int) round($pageHeightMm * $scale);

        $image = imagecreatetruecolor($widthPx, $heightPx);
        imageantialias($image, true);

        $white = imagecolorallocate($image, 255, 255, 255);
        $black = imagecolorallocate($image, 5, 5, 5);
        $darkGray = imagecolorallocate($image, 45, 45, 45);
        $midGray = imagecolorallocate($image, 110, 110, 110);

        imagefilledrectangle($image, 0, 0, $widthPx, $heightPx, $white);

        $fontRegular = base_path('vendor/dompdf/dompdf/lib/fonts/DejaVuSans.ttf');
        $fontBold = base_path('vendor/dompdf/dompdf/lib/fonts/DejaVuSans-Bold.ttf');
        $hasTtf = file_exists($fontRegular) && file_exists($fontBold);

        $this->renderReferenceSheetHalf(
            $image,
            $exam,
            $sheetData,
            0.0,
            $pageWidthMm,
            $pageHeightMm,
            $spec['pages'][0],
            $scale,
            $hasTtf,
            $fontRegular,
            $fontBold,
            $black,
            $darkGray,
            $midGray,
            $white,
            false
        );

        return $image;
    }

    protected function renderReferenceSheetHalf(
        \GdImage $image,
        Examination $exam,
        array $sheetData,
        float $offXMm,
        float $sheetWidthMm,
        float $sheetHeightMm,
        array $pageSpec,
        float $scale,
        bool $hasTtf,
        string $fontRegular,
        string $fontBold,
        int $black,
        int $darkGray,
        int $midGray,
        int $white,
        bool $is2Up
    ): void {
        $sqSizePx = (int) round(($is2Up ? 8.0 : 8.5) * $scale);
        $marginPx = (int) round(($is2Up ? 5.0 : 6.0) * $scale);
        $offXPx = (int) round($offXMm * $scale);
        $sheetWPx = (int) round($sheetWidthMm * $scale);
        $sheetHPx = (int) round($sheetHeightMm * $scale);

        $corners = [
            [$offXPx + $marginPx, $marginPx],
            [$offXPx + $sheetWPx - $marginPx - $sqSizePx, $marginPx],
            [$offXPx + $marginPx, $sheetHPx - $marginPx - $sqSizePx],
            [$offXPx + $sheetWPx - $marginPx - $sqSizePx, $sheetHPx - $marginPx - $sqSizePx],
        ];

        foreach ($corners as $c) {
            imagefilledrectangle($image, $c[0], $c[1], $c[0] + $sqSizePx, $c[1] + $sqSizePx, $black);
        }

        $headerLeft = $offXPx + (int) round(($is2Up ? 16.0 : 18.0) * $scale);

        $instName = strtoupper($sheetData['institution_name'] ?? 'PILOTON WORKSPACE');
        $examTitle = $exam->title ?: 'Midterm Exam';
        $subjectName = $exam->subject?->name ?? 'General';
        $className = $exam->schoolClass?->name ?? 'BSIT';
        $examDate = $exam->exam_date ? $exam->exam_date->format('Y-m-d') : date('Y-m-d');
        $metaText = "{$subjectName} • {$className} • Date: {$examDate}";

        $studentName = $sheetData['student_name'] ?? '';
        $studentId = $sheetData['student_id'] ?? $sheetData['student_id_number'] ?? '';

        if ($hasTtf) {
            $instSize = 12.0;
            $titleSize = $is2Up ? 22.0 : 22.5;
            $subSize = $is2Up ? 16.0 : 15.5;
            $metaSize = 12.0;

            imagettftext($image, $instSize, 0, $headerLeft, (int) round(($is2Up ? 11.0 : 13.0) * $scale), $black, $fontBold, $instName);
            imagettftext($image, $titleSize, 0, $headerLeft, (int) round(($is2Up ? 17.5 : 20.5) * $scale), $black, $fontBold, 'ANSWER SHEET');
            imagettftext($image, $subSize, 0, $headerLeft, (int) round(($is2Up ? 22.5 : 26.0) * $scale), $black, $fontBold, $examTitle);
            imagettftext($image, $metaSize, 0, $headerLeft, (int) round(($is2Up ? 26.5 : 30.5) * $scale), $darkGray, $fontRegular, $metaText);

            if ($studentName) {
                imagettftext($image, 12.0, 0, $headerLeft, (int) round(($is2Up ? 31.5 : 34.5) * $scale), $black, $fontBold, $studentName);
                imagettftext($image, 12.0, 0, $headerLeft, (int) round(($is2Up ? 36.0 : 39.5) * $scale), $black, $fontRegular, "ID: {$studentId}");
            } else {
                imagettftext($image, 12.0, 0, $headerLeft, (int) round(($is2Up ? 31.5 : 34.5) * $scale), $black, $fontBold, 'NAME: __________________________________________________');
                imagettftext($image, 12.0, 0, $headerLeft, (int) round(($is2Up ? 36.0 : 39.5) * $scale), $black, $fontBold, 'ID: ___________________  SECTION: __________________  DATE: ________________');
            }
        } else {
            imagestring($image, 4, $headerLeft, (int) round(10.0 * $scale), $instName, $black);
            imagestring($image, 5, $headerLeft, (int) round(16.0 * $scale), 'ANSWER SHEET', $black);
            imagestring($image, 4, $headerLeft, (int) round(23.0 * $scale), $examTitle, $black);
        }

        $codeBoxW = (int) round(($is2Up ? 46.0 : 54.0) * $scale);
        $codeBoxH = (int) round(($is2Up ? 27.0 : 28.0) * $scale);
        $codeBoxX = $offXPx + $sheetWPx - $marginPx - $sqSizePx - $codeBoxW - (int) round(3.5 * $scale);
        $codeBoxY = (int) round(($is2Up ? 7.0 : 8.5) * $scale);

        imagerectangle($image, $codeBoxX, $codeBoxY, $codeBoxX + $codeBoxW, $codeBoxY + $codeBoxH, $black);

        $sheetUlid = $sheetData['sheet_ulid'] ?? $exam->ulid;
        $sheetNumericCode = substr(preg_replace('/[^0-9]/', '', (string) crc32($sheetUlid)).'707067', 0, 6);

        if ($hasTtf) {
            $codeLabel = "SHEET CODE {$sheetNumericCode} - do not shade";
            imagettftext($image, 12.0, 0, $codeBoxX + 6, $codeBoxY - 5, $black, $fontBold, $codeLabel);
        }

        $digits = str_split($sheetNumericCode);
        $colsCount = 10;
        $rowsCount = 6;
        $gridPadX = (int) round(2.5 * $scale);
        $gridPadY = (int) round(1.8 * $scale);
        $availW = $codeBoxW - ($gridPadX * 2);
        $availH = $codeBoxH - ($gridPadY * 2);
        $stepX = $availW / $colsCount;
        $stepY = $availH / ($rowsCount + 1);

        for ($d = 0; $d < 10; $d++) {
            $dx = $codeBoxX + $gridPadX + ($d * $stepX) + ($stepX / 2);
            if ($hasTtf) {
                imagettftext($image, 8.0, 0, (int) ($dx - 4), (int) ($codeBoxY + $gridPadY + 9), $black, $fontBold, (string) $d);
            }
        }

        for ($r = 0; $r < $rowsCount; $r++) {
            $activeVal = isset($digits[$r]) ? (int) $digits[$r] : -1;
            $ry = $codeBoxY + $gridPadY + (($r + 1.2) * $stepY) + 6;
            for ($d = 0; $d < 10; $d++) {
                $dx = $codeBoxX + $gridPadX + ($d * $stepX) + ($stepX / 2);
                $bRad = (int) round(($is2Up ? 1.3 : 1.4) * $scale);
                if ($d === $activeVal) {
                    imagefilledellipse($image, (int) $dx, (int) $ry, $bRad * 2, $bRad * 2, $black);
                } else {
                    imageellipse($image, (int) $dx, (int) $ry, $bRad * 2, $bRad * 2, $black);
                }
            }
        }

        $lineLeft = $offXPx + (int) round(($is2Up ? 14.0 : 16.0) * $scale);
        $lineRight = $offXPx + $sheetWPx - (int) round(($is2Up ? 14.0 : 16.0) * $scale);
        $lineY = (int) round(($is2Up ? 38.0 : 42.5) * $scale);
        imageline($image, $lineLeft, $lineY, $lineRight, $lineY, $black);

        $numCols = $pageSpec['columns_count'] ?? count($pageSpec['columns']);
        $chFontSize = 12.0;
        $qFontSize = 12.0;
        $numGapPx = (int) round(($is2Up ? ($numCols >= 5 ? 1.8 : 2.2) : 2.5) * $scale);

        foreach ($pageSpec['columns'] as $col) {
            if (! empty($col['choice_headers'])) {
                foreach ($col['choice_headers'] as $ch) {
                    $chXPx = (int) round(($offXMm + $ch['center_x_mm']) * $scale);
                    $chYPx = (int) round($ch['center_y_mm'] * $scale);
                    $chText = $ch['choice'];

                    if ($hasTtf) {
                        $bbox = imagettfbbox($chFontSize, 0, $fontBold, $chText);
                        $tw = abs($bbox[2] - $bbox[0]);
                        imagettftext($image, $chFontSize, 0, (int) round($chXPx - ($tw / 2)), $chYPx, $black, $fontBold, $chText);
                    } else {
                        imagestring($image, 3, $chXPx - 4, $chYPx - 6, $chText, $black);
                    }
                }
            }

            foreach ($col['questions'] as $q) {
                $qNumStr = sprintf('%d.', $q['question_number']);
                $numYPx = (int) round($q['center_y_mm'] * $scale);

                $firstBubble = reset($q['bubbles']);
                $firstBubbleXPx = (int) round(($offXMm + $firstBubble['center_x_mm']) * $scale);
                $brPx = (int) round($firstBubble['radius_mm'] * $scale);
                $numRightXPx = $firstBubbleXPx - $brPx - $numGapPx;

                if ($hasTtf) {
                    $bbox = imagettfbbox($qFontSize, 0, $fontBold, $qNumStr);
                    $qw = abs($bbox[2] - $bbox[0]);
                    imagettftext($image, $qFontSize, 0, $numRightXPx - $qw, $numYPx + 3, $black, $fontBold, $qNumStr);
                } else {
                    imagestring($image, 2, $numRightXPx - 16, $numYPx - 5, $qNumStr, $black);
                }

                foreach ($q['bubbles'] as $b) {
                    $bxPx = (int) round(($offXMm + $b['center_x_mm']) * $scale);
                    $byPx = (int) round($b['center_y_mm'] * $scale);
                    $bubbleRadPx = (int) round($b['radius_mm'] * $scale);

                    imageellipse($image, $bxPx, $byPx, $bubbleRadPx * 2, $bubbleRadPx * 2, $black);
                }
            }
        }

        $botY = (int) round(($sheetHeightMm - ($is2Up ? 8.0 : 9.0)) * $scale);
        $botText = 'Shade ONE circle for each item, completely. Do not fold, stain or write on the black squares and the sheet code.';
        $botFontSize = 12.0;
        if ($hasTtf) {
            $bbox = imagettfbbox($botFontSize, 0, $fontRegular, $botText);
            $bw = abs($bbox[2] - $bbox[0]);
            $gridContentW = $lineRight - $lineLeft;
            $bx = (int) ($lineLeft + (($gridContentW - $bw) / 2));
            imagettftext($image, $botFontSize, 0, $bx, $botY, $black, $fontRegular, $botText);
        } else {
            imagestring($image, 2, $lineLeft + 20, $botY - 8, $botText, $darkGray);
        }
    }
}
