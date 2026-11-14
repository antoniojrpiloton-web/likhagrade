<?php

namespace App\Services\Omr;

class QrCodeGenerator
{
    protected const PAD0 = 0xEC;

    protected const PAD1 = 0x11;

    protected static array $versionCapacity = [
        1 => ['total' => 26, 'data' => 19, 'ec' => 7, 'blocks' => 1],
        2 => ['total' => 44, 'data' => 34, 'ec' => 10, 'blocks' => 1],
        3 => ['total' => 70, 'data' => 55, 'ec' => 15, 'blocks' => 1],
        4 => ['total' => 100, 'data' => 80, 'ec' => 20, 'blocks' => 1],
    ];

    public static function generateSvg(string $text, int $size = 120): string
    {
        $matrix = static::createMatrix($text);
        $count = count($matrix);

        $rects = [];
        for ($r = 0; $r < $count; $r++) {
            for ($c = 0; $c < $count; $c++) {
                if ($matrix[$r][$c]) {
                    $rects[] = "<rect x=\"{$c}\" y=\"{$r}\" width=\"1\" height=\"1\" fill=\"#000\"/>";
                }
            }
        }

        $rectContent = implode('', $rects);

        return "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 {$count} {$count}\" width=\"{$size}\" height=\"{$size}\" shape-rendering=\"crispEdges\"><rect width=\"100%\" height=\"100%\" fill=\"#fff\"/>{$rectContent}</svg>";
    }

    public static function generateDataUri(string $text, int $size = 120): string
    {
        $svg = static::generateSvg($text, $size);

        return 'data:image/svg+xml;base64,'.base64_encode($svg);
    }

    public static function getMatrix(string $text): array
    {
        return static::createMatrix($text);
    }

    protected static function createMatrix(string $text): array
    {
        $len = strlen($text);
        $version = 1;
        foreach (static::$versionCapacity as $v => $cap) {
            if ($len + 3 <= $cap['data']) {
                $version = $v;
                break;
            }
            $version = $v;
        }

        $size = 17 + 4 * $version;
        $matrix = array_fill(0, $size, array_fill(0, $size, null));
        $reserved = array_fill(0, $size, array_fill(0, $size, false));

        static::applyFinderPattern($matrix, $reserved, 0, 0);
        static::applyFinderPattern($matrix, $reserved, $size - 7, 0);
        static::applyFinderPattern($matrix, $reserved, 0, $size - 7);

        for ($i = 8; $i < $size - 8; $i++) {
            $val = ($i % 2 === 0);
            if (! $reserved[6][$i]) {
                $matrix[6][$i] = $val;
                $reserved[6][$i] = true;
            }
            if (! $reserved[$i][6]) {
                $matrix[$i][6] = $val;
                $reserved[$i][6] = true;
            }
        }

        if ($version >= 2) {
            $alignPos = $size - 7;
            static::applyAlignmentPattern($matrix, $reserved, $alignPos, $alignPos);
        }

        $matrix[4 * $version + 9][8] = true;
        $reserved[4 * $version + 9][8] = true;

        for ($i = 0; $i < 9; $i++) {
            $reserved[8][$i] = true;
            $reserved[$i][8] = true;
            $reserved[8][$size - 1 - $i] = true;
            $reserved[$size - 1 - $i][8] = true;
        }

        $dataBits = static::encodeDataBits($text, $version);
        static::placeDataBits($matrix, $reserved, $dataBits);

        static::applyFormatInfo($matrix, 0);

        for ($r = 0; $r < $size; $r++) {
            for ($c = 0; $c < $size; $c++) {
                if ($matrix[$r][$c] === null) {
                    $matrix[$r][$c] = false;
                }
            }
        }

        return $matrix;
    }

    protected static function applyFinderPattern(array &$matrix, array &$reserved, int $startX, int $startY): void
    {
        for ($y = -1; $y <= 7; $y++) {
            for ($x = -1; $x <= 7; $x++) {
                $r = $startY + $y;
                $c = $startX + $x;
                if ($r >= 0 && $r < count($matrix) && $c >= 0 && $c < count($matrix)) {
                    $reserved[$r][$c] = true;
                    if ($x >= 0 && $x <= 6 && $y >= 0 && $y <= 6) {
                        $isBlack = ($x === 0 || $x === 6 || $y === 0 || $y === 6 || ($x >= 2 && $x <= 4 && $y >= 2 && $y <= 4));
                        $matrix[$r][$c] = $isBlack;
                    } else {
                        $matrix[$r][$c] = false;
                    }
                }
            }
        }
    }

    protected static function applyAlignmentPattern(array &$matrix, array &$reserved, int $centerX, int $centerY): void
    {
        for ($y = -2; $y <= 2; $y++) {
            for ($x = -2; $x <= 2; $x++) {
                $r = $centerY + $y;
                $c = $centerX + $x;
                $reserved[$r][$c] = true;
                $matrix[$r][$c] = (abs($x) === 2 || abs($y) === 2 || ($x === 0 && $y === 0));
            }
        }
    }

    protected static function encodeDataBits(string $text, int $version): array
    {
        $bits = [];
        $appendBits = function (int $val, int $len) use (&$bits) {
            for ($i = $len - 1; $i >= 0; $i--) {
                $bits[] = (($val >> $i) & 1) === 1;
            }
        };

        $appendBits(0b0100, 4);

        $len = strlen($text);
        $countBits = ($version <= 9) ? 8 : 16;
        $appendBits($len, $countBits);

        for ($i = 0; $i < $len; $i++) {
            $appendBits(ord($text[$i]), 8);
        }

        $cap = static::$versionCapacity[$version];
        $totalDataBits = $cap['data'] * 8;

        $terminatorLen = min(4, $totalDataBits - count($bits));
        for ($i = 0; $i < $terminatorLen; $i++) {
            $bits[] = false;
        }

        while (count($bits) % 8 !== 0) {
            $bits[] = false;
        }

        $padBytes = [static::PAD0, static::PAD1];
        $p = 0;
        while (count($bits) < $totalDataBits) {
            $appendBits($padBytes[$p % 2], 8);
            $p++;
        }

        $dataBytes = [];
        for ($i = 0; $i < count($bits); $i += 8) {
            $byte = 0;
            for ($b = 0; $b < 8; $b++) {
                if ($bits[$i + $b]) {
                    $byte |= (1 << (7 - $b));
                }
            }
            $dataBytes[] = $byte;
        }

        $ecBytes = static::calculateErrorCorrection($dataBytes, $cap['ec']);

        $finalBits = [];
        $appendBytesToBits = function (array $bytes) use (&$finalBits) {
            foreach ($bytes as $b) {
                for ($i = 7; $i >= 0; $i--) {
                    $finalBits[] = (($b >> $i) & 1) === 1;
                }
            }
        };

        $appendBytesToBits($dataBytes);
        $appendBytesToBits($ecBytes);

        return $finalBits;
    }

    protected static function calculateErrorCorrection(array $data, int $ecCount): array
    {
        $generator = static::rsGeneratorPoly($ecCount);
        $poly = $data;

        for ($i = 0; $i < $ecCount; $i++) {
            $poly[] = 0;
        }

        for ($i = 0; $i < count($data); $i++) {
            $lead = $poly[$i];
            if ($lead !== 0) {
                $leadLog = static::$gfLog[$lead];
                for ($j = 0; $j < count($generator); $j++) {
                    $poly[$i + $j] ^= static::$gfExp[($generator[$j] + $leadLog) % 255];
                }
            }
        }

        return array_slice($poly, count($data));
    }

    protected static array $gfExp = [];

    protected static array $gfLog = [];

    protected static bool $gfInit = false;

    protected static function initGf(): void
    {
        if (static::$gfInit) {
            return;
        }
        static::$gfExp = array_fill(0, 512, 0);
        static::$gfLog = array_fill(0, 256, 0);
        $x = 1;
        for ($i = 0; $i < 255; $i++) {
            static::$gfExp[$i] = $x;
            static::$gfLog[$x] = $i;
            $x <<= 1;
            if ($x >= 256) {
                $x ^= 0x11D;
            }
        }
        for ($i = 255; $i < 512; $i++) {
            static::$gfExp[$i] = static::$gfExp[$i - 255];
        }
        static::$gfInit = true;
    }

    protected static function rsGeneratorPoly(int $degree): array
    {
        static::initGf();
        $poly = [0];
        for ($i = 0; $i < $degree; $i++) {
            $next = [];
            $factor = $i;
            $next[0] = ($poly[0] + $factor) % 255;
            for ($j = 1; $j < count($poly); $j++) {
                $c1 = static::$gfExp[($poly[$j] + $factor) % 255];
                $c2 = static::$gfExp[$poly[$j - 1]];
                $next[$j] = static::$gfLog[$c1 ^ $c2];
            }
            $next[] = $poly[count($poly) - 1];
            $poly = $next;
        }

        return $poly;
    }

    protected static function placeDataBits(array &$matrix, array $reserved, array $bits): void
    {
        $size = count($matrix);
        $bitIdx = 0;
        $totalBits = count($bits);
        $upwards = true;

        for ($col = $size - 1; $col > 0; $col -= 2) {
            if ($col === 6) {
                $col--;
            }
            $rows = $upwards ? range($size - 1, 0, -1) : range(0, $size - 1);
            foreach ($rows as $row) {
                foreach ([$col, $col - 1] as $c) {
                    if (! $reserved[$row][$c]) {
                        $val = ($bitIdx < $totalBits) ? $bits[$bitIdx++] : false;
                        if ((($row + $c) % 2) === 0) {
                            $val = ! $val;
                        }
                        $matrix[$row][$c] = $val;
                    }
                }
            }
            $upwards = ! $upwards;
        }
    }

    protected static function applyFormatInfo(array &$matrix, int $mask): void
    {
        $size = count($matrix);
        $formatData = (1 << 3) | $mask;
        $rem = $formatData << 10;
        $poly = 0x537;
        for ($i = 4; $i >= 0; $i--) {
            if ($rem & (1 << ($i + 10))) {
                $rem ^= ($poly << $i);
            }
        }
        $full = (($formatData << 10) | $rem) ^ 0x5412;

        $bits = [];
        for ($i = 14; $i >= 0; $i--) {
            $bits[] = (($full >> $i) & 1) === 1;
        }

        $matrix[8][0] = $bits[0];
        $matrix[8][1] = $bits[1];
        $matrix[8][2] = $bits[2];
        $matrix[8][3] = $bits[3];
        $matrix[8][4] = $bits[4];
        $matrix[8][5] = $bits[5];
        $matrix[8][7] = $bits[6];
        $matrix[8][8] = $bits[7];
        $matrix[7][8] = $bits[8];
        $matrix[5][8] = $bits[9];
        $matrix[4][8] = $bits[10];
        $matrix[3][8] = $bits[11];
        $matrix[2][8] = $bits[12];
        $matrix[1][8] = $bits[13];
        $matrix[0][8] = $bits[14];

        for ($i = 0; $i < 7; $i++) {
            $matrix[$size - 1 - $i][8] = $bits[$i];
        }
        for ($i = 7; $i < 15; $i++) {
            $matrix[8][$size - 15 + $i] = $bits[$i];
        }
    }
}
