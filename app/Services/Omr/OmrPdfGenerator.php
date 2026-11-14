<?php

namespace App\Services\Omr;

use App\Models\Examination;
use Dompdf\Cpdf;

class OmrPdfGenerator
{
    public function __construct(
        protected OmrLayoutEngine $layoutEngine,
        protected OmrPngGenerator $pngGenerator
    ) {}

    public function generatePdf(Examination $exam, array $sheetsData, string $paperSize = OmrLayoutEngine::PAPER_A4): OmrPdfDocument
    {
        $validSizes = [
            OmrLayoutEngine::PAPER_A4,
            OmrLayoutEngine::PAPER_LETTER,
            OmrLayoutEngine::PAPER_A4_2UP,
            OmrLayoutEngine::PAPER_LETTER_2UP,
        ];
        $paperSize = in_array($paperSize, $validSizes, true) ? $paperSize : OmrLayoutEngine::PAPER_A4;
        $pageSpec = OmrLayoutEngine::PAGE_SPECS[$paperSize];

        $pageWidthPt = $pageSpec['width_pt'];
        $pageHeightPt = $pageSpec['height_pt'];
        $is2Up = ! empty($pageSpec['is_2up']);

        $cpdf = new Cpdf([0, 0, $pageWidthPt, $pageHeightPt]);

        if ($is2Up) {
            $totalPairs = (int) ceil(count($sheetsData) / 2);
            $cachedMasterJpegPath = null;

            for ($p = 0; $p < $totalPairs; $p++) {
                if ($p > 0) {
                    $cpdf->newPage();
                }

                $leftSheet = $sheetsData[$p * 2];
                $rightSheet = $sheetsData[($p * 2) + 1] ?? $leftSheet;
                $isGeneric = empty($leftSheet['student_name']) && empty($leftSheet['student_id'])
                    && empty($rightSheet['student_name']) && empty($rightSheet['student_id']);

                if ($isGeneric) {
                    if (! $cachedMasterJpegPath) {
                        $cachedMasterJpegPath = sys_get_temp_dir().DIRECTORY_SEPARATOR.'omr_master_2up_'.uniqid().'.jpg';
                        $this->pngGenerator->renderPageToJpegFile($exam, ['left' => $leftSheet, 'right' => $rightSheet], $paperSize, $cachedMasterJpegPath);
                    }

                    $cpdf->addJpegFromFile($cachedMasterJpegPath, 0, 0, $pageWidthPt, $pageHeightPt);
                } else {
                    $tempPath = sys_get_temp_dir().DIRECTORY_SEPARATOR.'omr_sheet_2up_'.uniqid().'.jpg';
                    $this->pngGenerator->renderPageToJpegFile($exam, ['left' => $leftSheet, 'right' => $rightSheet], $paperSize, $tempPath);
                    $cpdf->addJpegFromFile($tempPath, 0, 0, $pageWidthPt, $pageHeightPt);
                    @unlink($tempPath);
                }
            }

            if ($cachedMasterJpegPath && file_exists($cachedMasterJpegPath)) {
                @unlink($cachedMasterJpegPath);
            }
        } else {
            $cachedMasterJpegPath = null;

            foreach ($sheetsData as $index => $sheet) {
                if ($index > 0) {
                    $cpdf->newPage();
                }

                $isGeneric = empty($sheet['student_name']) && empty($sheet['student_id']);

                if ($isGeneric) {
                    if (! $cachedMasterJpegPath) {
                        $cachedMasterJpegPath = sys_get_temp_dir().DIRECTORY_SEPARATOR.'omr_master_'.uniqid().'.jpg';
                        $this->pngGenerator->renderPageToJpegFile($exam, $sheet, $paperSize, $cachedMasterJpegPath);
                    }

                    $cpdf->addJpegFromFile($cachedMasterJpegPath, 0, 0, $pageWidthPt, $pageHeightPt);
                } else {
                    $tempPath = sys_get_temp_dir().DIRECTORY_SEPARATOR.'omr_sheet_'.uniqid().'.jpg';
                    $this->pngGenerator->renderPageToJpegFile($exam, $sheet, $paperSize, $tempPath);
                    $cpdf->addJpegFromFile($tempPath, 0, 0, $pageWidthPt, $pageHeightPt);
                    @unlink($tempPath);
                }
            }

            if ($cachedMasterJpegPath && file_exists($cachedMasterJpegPath)) {
                @unlink($cachedMasterJpegPath);
            }
        }

        $pdfContent = $cpdf->output();

        return new OmrPdfDocument($pdfContent, "exam-{$exam->ulid}-sheets.pdf");
    }
}
