<?php

namespace App\Services\Omr;

use App\Models\Examination;

class OmrLayoutEngine
{
    public const VERSION = 'v1.0';

    public const PAPER_A4 = 'A4';

    public const PAPER_LETTER = 'Letter';

    public const PAPER_A4_2UP = 'A4_2Up';

    public const PAPER_LETTER_2UP = 'Letter_2Up';

    public const PAGE_SPECS = [
        self::PAPER_A4 => [
            'width_mm' => 210.0,
            'height_mm' => 297.0,
            'width_pt' => 595.28,
            'height_pt' => 841.89,
            'is_2up' => false,
        ],
        self::PAPER_LETTER => [
            'width_mm' => 215.9,
            'height_mm' => 279.4,
            'width_pt' => 612.00,
            'height_pt' => 792.00,
            'is_2up' => false,
        ],
        self::PAPER_A4_2UP => [
            'width_mm' => 297.0,
            'height_mm' => 210.0,
            'width_pt' => 841.89,
            'height_pt' => 595.28,
            'is_2up' => true,
        ],
        self::PAPER_LETTER_2UP => [
            'width_mm' => 279.4,
            'height_mm' => 215.9,
            'width_pt' => 792.00,
            'height_pt' => 612.00,
            'is_2up' => true,
        ],
    ];

    public function generateSpecification(Examination $exam, string $paperSize = self::PAPER_A4): array
    {
        $validSizes = [self::PAPER_A4, self::PAPER_LETTER, self::PAPER_A4_2UP, self::PAPER_LETTER_2UP];
        $paperSize = in_array($paperSize, $validSizes, true) ? $paperSize : self::PAPER_A4;
        $pageSpec = self::PAGE_SPECS[$paperSize];

        $pageWidth = $pageSpec['width_mm'];
        $pageHeight = $pageSpec['height_mm'];
        $is2Up = $pageSpec['is_2up'];

        $questionCount = max(1, (int) $exam->question_count);
        $choiceCount = max(2, min(5, (int) $exam->choice_count));

        $pages = [
            $this->layoutSinglePage(
                $exam,
                $paperSize,
                $pageWidth,
                $pageHeight,
                1,
                $questionCount,
                1,
                1,
                $is2Up
            ),
        ];

        return [
            'template_version' => self::VERSION,
            'paper_size' => $paperSize,
            'page_width_mm' => $pageWidth,
            'page_height_mm' => $pageHeight,
            'is_2up' => $is2Up,
            'question_count' => $questionCount,
            'choice_count' => $choiceCount,
            'total_pages' => 1,
            'pages' => $pages,
        ];
    }

    protected function layoutSinglePage(
        Examination $exam,
        string $paperSize,
        float $pageWidth,
        float $pageHeight,
        int $startQuestion,
        int $endQuestion,
        int $pageNum,
        int $totalPages,
        bool $is2Up = false
    ): array {
        if ($is2Up) {
            return $this->layout2UpPage($exam, $paperSize, $pageWidth, $pageHeight, $startQuestion, $endQuestion, $pageNum, $totalPages);
        }

        return $this->layout1UpPortraitPage($exam, $paperSize, $pageWidth, $pageHeight, $startQuestion, $endQuestion, $pageNum, $totalPages);
    }

    protected function layout1UpPortraitPage(
        Examination $exam,
        string $paperSize,
        float $pageWidth,
        float $pageHeight,
        int $startQuestion,
        int $endQuestion,
        int $pageNum,
        int $totalPages
    ): array {
        $markerSize = 8.5;
        $margin = 6.0;

        $fiducials = [
            'top_left' => [
                'x_mm' => $margin,
                'y_mm' => $margin,
                'size_mm' => $markerSize,
                'norm_x' => round($margin / $pageWidth, 5),
                'norm_y' => round($margin / $pageHeight, 5),
            ],
            'top_right' => [
                'x_mm' => round($pageWidth - $margin - $markerSize, 2),
                'y_mm' => $margin,
                'size_mm' => $markerSize,
                'norm_x' => round(($pageWidth - $margin - $markerSize) / $pageWidth, 5),
                'norm_y' => round($margin / $pageHeight, 5),
            ],
            'bottom_left' => [
                'x_mm' => $margin,
                'y_mm' => round($pageHeight - $margin - $markerSize, 2),
                'size_mm' => $markerSize,
                'norm_x' => round($margin / $pageWidth, 5),
                'norm_y' => round(($pageHeight - $margin - $markerSize) / $pageHeight, 5),
            ],
            'bottom_right' => [
                'x_mm' => round($pageWidth - $margin - $markerSize, 2),
                'y_mm' => round($pageHeight - $margin - $markerSize, 2),
                'size_mm' => $markerSize,
                'norm_x' => round(($pageWidth - $margin - $markerSize) / $pageWidth, 5),
                'norm_y' => round(($pageHeight - $margin - $markerSize) / $pageHeight, 5),
            ],
        ];

        $codeBoxW = 54.0;
        $codeBoxH = 28.0;
        $codeBoxX = round($pageWidth - $margin - $markerSize - $codeBoxW - 3.5, 2);
        $codeBoxY = round($margin + 1.5, 2);

        $qrCodeRegion = [
            'x_mm' => $codeBoxX,
            'y_mm' => $codeBoxY,
            'size_mm' => 20.0,
            'norm_x' => round($codeBoxX / $pageWidth, 5),
            'norm_y' => round($codeBoxY / $pageHeight, 5),
        ];

        $qCount = $endQuestion - $startQuestion + 1;
        $choiceCount = max(2, min(5, (int) $exam->choice_count));

        if ($qCount >= 100) {
            $columnsCount = 4;
            $questionsPerColumn = 25;
        } elseif ($qCount > 40) {
            $questionsPerColumn = 25;
            $columnsCount = min(4, max(1, (int) ceil($qCount / 25)));
        } else {
            $questionsPerColumn = 10;
            $columnsCount = min(4, max(1, (int) ceil($qCount / 10)));
        }

        $gridTopY = 51.0;
        $gridBottomY = 272.0;
        $gridHeight = $gridBottomY - $gridTopY;

        $contentLeft = 16.0;
        $contentRight = $pageWidth - 16.0;
        $contentWidth = $contentRight - $contentLeft;

        $columnWidth = round($contentWidth / $columnsCount, 2);
        $rowsCount = max($questionsPerColumn, 1);
        $rowHeight = min(8.8, round($gridHeight / $rowsCount, 2));

        if ($columnsCount >= 5) {
            $bubbleRadius = 2.0;
            $bubbleSpacingX = 4.8;
            $numOffset = 7.5;
        } elseif ($columnsCount === 4) {
            $bubbleRadius = 2.2;
            $bubbleSpacingX = 5.4;
            $numOffset = 9.0;
        } elseif ($columnsCount === 3) {
            $bubbleRadius = 2.4;
            $bubbleSpacingX = 6.2;
            $numOffset = 10.5;
        } elseif ($columnsCount === 2) {
            $bubbleRadius = 2.6;
            $bubbleSpacingX = 7.0;
            $numOffset = 12.0;
        } else {
            $bubbleRadius = 2.8;
            $bubbleSpacingX = 8.0;
            $numOffset = 14.0;
        }

        $bubbleDiameter = $bubbleRadius * 2;
        $alphabet = ['A', 'B', 'C', 'D', 'E'];
        $choices = array_slice($alphabet, 0, $choiceCount);

        $columns = [];
        $bubblesMap = [];

        for ($colIdx = 0; $colIdx < $columnsCount; $colIdx++) {
            $colStartQ = $startQuestion + ($colIdx * $questionsPerColumn);
            $colEndQ = min($endQuestion, $colStartQ + $questionsPerColumn - 1);

            if ($colStartQ > $endQuestion) {
                break;
            }

            $colLeftX = $contentLeft + ($colIdx * $columnWidth);
            $bubbleStartX = round($colLeftX + $numOffset, 2);
            $numberX = round($bubbleStartX - $bubbleRadius - 2.5, 2);

            $choiceHeaders = [];
            foreach ($choices as $cIdx => $choiceChar) {
                $choiceHeaders[] = [
                    'choice' => $choiceChar,
                    'center_x_mm' => round($bubbleStartX + ($cIdx * $bubbleSpacingX), 2),
                    'center_y_mm' => round($gridTopY - 3.5, 2),
                ];
            }

            $colQuestions = [];

            for ($qNum = $colStartQ; $qNum <= $colEndQ; $qNum++) {
                $rowIndex = $qNum - $colStartQ;
                $rowCenterY = round($gridTopY + ($rowIndex * $rowHeight) + ($rowHeight / 2), 2);

                $qBubbles = [];
                foreach ($choices as $cIdx => $choiceChar) {
                    $centerX = round($bubbleStartX + ($cIdx * $bubbleSpacingX), 2);
                    $centerY = $rowCenterY;

                    $bubbleData = [
                        'question_number' => $qNum,
                        'choice' => $choiceChar,
                        'center_x_mm' => $centerX,
                        'center_y_mm' => $centerY,
                        'radius_mm' => $bubbleRadius,
                        'norm_x' => round($centerX / $pageWidth, 5),
                        'norm_y' => round($centerY / $pageHeight, 5),
                    ];

                    $qBubbles[$choiceChar] = $bubbleData;
                    $bubblesMap["{$qNum}_{$choiceChar}"] = $bubbleData;
                }

                $colQuestions[] = [
                    'question_number' => $qNum,
                    'number_x_mm' => $numberX,
                    'center_y_mm' => $rowCenterY,
                    'bubbles' => $qBubbles,
                ];
            }

            $columns[] = [
                'column_index' => $colIdx,
                'left_x_mm' => $colLeftX,
                'width_mm' => $columnWidth,
                'start_question' => $colStartQ,
                'end_question' => $colEndQ,
                'choice_headers' => $choiceHeaders,
                'questions' => $colQuestions,
            ];
        }

        return [
            'page_number' => $pageNum,
            'total_pages' => $totalPages,
            'start_question' => $startQuestion,
            'end_question' => $endQuestion,
            'question_count' => $qCount,
            'choice_count' => $choiceCount,
            'columns_count' => $columnsCount,
            'fiducials' => $fiducials,
            'qr_code' => $qrCodeRegion,
            'grid' => [
                'top_y_mm' => $gridTopY,
                'bottom_y_mm' => $gridBottomY,
                'height_mm' => $gridHeight,
                'row_height_mm' => $rowHeight,
                'bubble_diameter_mm' => $bubbleDiameter,
                'bubble_spacing_x_mm' => $bubbleSpacingX,
            ],
            'columns' => $columns,
            'bubbles_map' => $bubblesMap,
        ];
    }

    protected function layout2UpPage(
        Examination $exam,
        string $paperSize,
        float $pageWidth,
        float $pageHeight,
        int $startQuestion,
        int $endQuestion,
        int $pageNum,
        int $totalPages
    ): array {
        $halfW = round($pageWidth / 2, 2);
        $halfH = $pageHeight;
        $markerSize = 8.0;
        $margin = 5.0;

        $fiducials = [
            'top_left' => [
                'x_mm' => $margin,
                'y_mm' => $margin,
                'size_mm' => $markerSize,
                'norm_x' => round($margin / $pageWidth, 5),
                'norm_y' => round($margin / $pageHeight, 5),
            ],
            'top_right' => [
                'x_mm' => round($pageWidth - $margin - $markerSize, 2),
                'y_mm' => $margin,
                'size_mm' => $markerSize,
                'norm_x' => round(($pageWidth - $margin - $markerSize) / $pageWidth, 5),
                'norm_y' => round($margin / $pageHeight, 5),
            ],
            'bottom_left' => [
                'x_mm' => $margin,
                'y_mm' => round($pageHeight - $margin - $markerSize, 2),
                'size_mm' => $markerSize,
                'norm_x' => round($margin / $pageWidth, 5),
                'norm_y' => round(($pageHeight - $margin - $markerSize) / $pageHeight, 5),
            ],
            'bottom_right' => [
                'x_mm' => round($pageWidth - $margin - $markerSize, 2),
                'y_mm' => round($pageHeight - $margin - $markerSize, 2),
                'size_mm' => $markerSize,
                'norm_x' => round(($pageWidth - $margin - $markerSize) / $pageWidth, 5),
                'norm_y' => round(($pageHeight - $margin - $markerSize) / $pageHeight, 5),
            ],
        ];

        $codeBoxW = 46.0;
        $codeBoxH = 27.0;
        $codeBoxX = round($halfW - $margin - $markerSize - $codeBoxW - 3.5, 2);
        $codeBoxY = round($margin + 2.0, 2);

        $qrCodeRegion = [
            'x_mm' => $codeBoxX,
            'y_mm' => $codeBoxY,
            'size_mm' => 16.0,
            'norm_x' => round($codeBoxX / $pageWidth, 5),
            'norm_y' => round($codeBoxY / $pageHeight, 5),
        ];

        $qCount = $endQuestion - $startQuestion + 1;
        $choiceCount = max(2, min(5, (int) $exam->choice_count));

        if ($qCount >= 100) {
            $columnsCount = 4;
            $questionsPerColumn = 25;
        } elseif ($qCount > 50) {
            $columnsCount = 4;
            $questionsPerColumn = (int) ceil($qCount / 4);
        } else {
            $questionsPerColumn = 10;
            $columnsCount = max(1, (int) ceil($qCount / $questionsPerColumn));
        }

        $gridTopY = 45.0;
        $gridBottomY = 194.0;
        $gridHeight = $gridBottomY - $gridTopY;

        $contentLeft = 14.0;
        $contentRight = $halfW - 14.0;
        $contentWidth = $contentRight - $contentLeft;

        $columnWidth = round($contentWidth / $columnsCount, 2);
        $rowsCount = max($questionsPerColumn, 1);
        $rowHeight = min(6.2, round($gridHeight / $rowsCount, 2));

        if ($columnsCount >= 5) {
            $bubbleRadius = 1.8;
            $bubbleSpacingX = 4.2;
            $numOffset = 6.5;
        } elseif ($columnsCount === 4) {
            $bubbleRadius = 1.9;
            $bubbleSpacingX = 4.6;
            $numOffset = 8.0;
        } elseif ($columnsCount === 3) {
            $bubbleRadius = 2.1;
            $bubbleSpacingX = 5.2;
            $numOffset = 9.0;
        } elseif ($columnsCount === 2) {
            $bubbleRadius = 2.3;
            $bubbleSpacingX = 5.8;
            $numOffset = 10.0;
        } else {
            $bubbleRadius = 2.4;
            $bubbleSpacingX = 6.2;
            $numOffset = 11.0;
        }

        $bubbleDiameter = $bubbleRadius * 2;
        $alphabet = ['A', 'B', 'C', 'D', 'E'];
        $choices = array_slice($alphabet, 0, $choiceCount);

        $columns = [];
        $bubblesMap = [];

        for ($colIdx = 0; $colIdx < $columnsCount; $colIdx++) {
            $colStartQ = $startQuestion + ($colIdx * $questionsPerColumn);
            $colEndQ = min($endQuestion, $colStartQ + $questionsPerColumn - 1);

            if ($colStartQ > $endQuestion) {
                break;
            }

            $colLeftX = $contentLeft + ($colIdx * $columnWidth);
            $bubbleStartX = round($colLeftX + $numOffset, 2);
            $numberX = round($bubbleStartX - $bubbleRadius - 2.0, 2);

            $choiceHeaders = [];
            foreach ($choices as $cIdx => $choiceChar) {
                $choiceHeaders[] = [
                    'choice' => $choiceChar,
                    'center_x_mm' => round($bubbleStartX + ($cIdx * $bubbleSpacingX), 2),
                    'center_y_mm' => round($gridTopY - 2.5, 2),
                ];
            }

            $colQuestions = [];

            for ($qNum = $colStartQ; $qNum <= $colEndQ; $qNum++) {
                $rowIndex = $qNum - $colStartQ;
                $rowCenterY = round($gridTopY + ($rowIndex * $rowHeight) + ($rowHeight / 2), 2);

                $qBubbles = [];
                foreach ($choices as $cIdx => $choiceChar) {
                    $centerX = round($bubbleStartX + ($cIdx * $bubbleSpacingX), 2);
                    $centerY = $rowCenterY;

                    $bubbleData = [
                        'question_number' => $qNum,
                        'choice' => $choiceChar,
                        'center_x_mm' => $centerX,
                        'center_y_mm' => $centerY,
                        'radius_mm' => $bubbleRadius,
                        'norm_x' => round($centerX / $halfW, 5),
                        'norm_y' => round($centerY / $halfH, 5),
                    ];

                    $qBubbles[$choiceChar] = $bubbleData;
                    $bubblesMap["{$qNum}_{$choiceChar}"] = $bubbleData;
                }

                $colQuestions[] = [
                    'question_number' => $qNum,
                    'number_x_mm' => $numberX,
                    'center_y_mm' => $rowCenterY,
                    'bubbles' => $qBubbles,
                ];
            }

            $columns[] = [
                'column_index' => $colIdx,
                'left_x_mm' => $colLeftX,
                'width_mm' => $columnWidth,
                'start_question' => $colStartQ,
                'end_question' => $colEndQ,
                'choice_headers' => $choiceHeaders,
                'questions' => $colQuestions,
            ];
        }

        return [
            'page_number' => $pageNum,
            'total_pages' => $totalPages,
            'start_question' => $startQuestion,
            'end_question' => $endQuestion,
            'question_count' => $qCount,
            'choice_count' => $choiceCount,
            'columns_count' => $columnsCount,
            'fiducials' => $fiducials,
            'qr_code' => $qrCodeRegion,
            'grid' => [
                'top_y_mm' => $gridTopY,
                'bottom_y_mm' => $gridBottomY,
                'height_mm' => $gridHeight,
                'row_height_mm' => $rowHeight,
                'bubble_diameter_mm' => $bubbleDiameter,
                'bubble_spacing_x_mm' => $bubbleSpacingX,
            ],
            'columns' => $columns,
            'bubbles_map' => $bubblesMap,
        ];
    }
}
