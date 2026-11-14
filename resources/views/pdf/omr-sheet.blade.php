<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>OMR Answer Sheet</title>
    <style>
        @page {
            margin: 0;
            padding: 0;
            size: {{ $paperSize === 'Letter' ? 'letter' : 'a4' }} portrait;
        }

        * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            background: #ffffff;
            color: #000000;
        }

        .sheet-page {
            position: relative;
            width: {{ $pageWidthMm }}mm;
            height: {{ $pageHeightMm }}mm;
            page-break-after: always;
            overflow: hidden;
            background: #ffffff;
        }

        .sheet-page:last-child {
            page-break-after: avoid;
        }

        .fiducial-marker {
            position: absolute;
            width: 7mm;
            height: 7mm;
            background-color: #000000;
        }

        .marker-tl {
            top: 12mm;
            left: 12mm;
        }

        .marker-tr {
            top: 12mm;
            right: 12mm;
        }

        .marker-bl {
            bottom: 12mm;
            left: 12mm;
        }

        .marker-br {
            bottom: 12mm;
            right: 12mm;
        }

        .header-container {
            position: absolute;
            top: 14mm;
            left: 22mm;
            right: 22mm;
            height: 47mm;
        }

        .header-top {
            width: 100%;
            height: 22mm;
        }

        .header-title-box {
            float: left;
            width: {{ $pageWidthMm - 76 }}mm;
        }

        .institution-name {
            font-size: 8pt;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            color: #333333;
            margin-bottom: 1mm;
        }

        .exam-title {
            font-size: 13pt;
            font-weight: 900;
            line-height: 1.15;
            color: #000000;
            text-transform: uppercase;
        }

        .exam-meta {
            font-size: 7.5pt;
            color: #444444;
            margin-top: 1mm;
        }

        .header-qr-box {
            float: right;
            width: 22mm;
            text-align: right;
        }

        .header-qr-img {
            width: 20mm;
            height: 20mm;
        }

        .header-middle {
            clear: both;
            width: 100%;
            height: 24mm;
            margin-top: 1mm;
            border-top: 1.2px solid #000000;
            border-bottom: 1.2px solid #000000;
            padding-top: 1.5mm;
        }

        .student-fields {
            float: left;
            width: {{ $pageWidthMm - 98 }}mm;
        }

        .field-row {
            margin-bottom: 1.8mm;
            height: 5mm;
            line-height: 5mm;
        }

        .field-label {
            display: inline-block;
            font-size: 7.5pt;
            font-weight: 700;
            text-transform: uppercase;
            width: 22mm;
        }

        .field-line {
            display: inline-block;
            border-bottom: 1px solid #000000;
            height: 4mm;
            font-size: 8pt;
            font-weight: 700;
            padding-left: 1.5mm;
        }

        .instructions-box {
            float: right;
            width: 50mm;
            border: 1px solid #000000;
            border-radius: 1.5mm;
            padding: 1.5mm 2mm;
            background: #fafafa;
        }

        .instructions-title {
            font-size: 6.5pt;
            font-weight: 800;
            text-transform: uppercase;
            text-align: center;
            margin-bottom: 1mm;
        }

        .instructions-text {
            font-size: 5.8pt;
            line-height: 1.25;
            color: #222222;
        }

        .instructions-examples {
            margin-top: 1mm;
            text-align: center;
            font-size: 6pt;
        }

        .sample-bubble-good {
            display: inline-block;
            width: 3.2mm;
            height: 3.2mm;
            border-radius: 50%;
            background: #000000;
            vertical-align: middle;
            margin: 0 1mm;
        }

        .sample-bubble-bad {
            display: inline-block;
            width: 3.2mm;
            height: 3.2mm;
            border-radius: 50%;
            border: 0.8px solid #000000;
            line-height: 3.2mm;
            font-size: 5pt;
            text-align: center;
            vertical-align: middle;
            margin: 0 1mm;
        }

        .grid-container {
            position: absolute;
            top: 64mm;
            left: 14mm;
            right: 14mm;
            bottom: 22mm;
        }

        .column-box {
            position: absolute;
            top: 0;
            bottom: 0;
            border-right: 0.5px dashed #cccccc;
        }

        .column-box:last-child {
            border-right: none;
        }

        .question-row {
            position: absolute;
            left: 0;
            right: 0;
            height: 5.6mm;
            line-height: 5.6mm;
        }

        .q-number {
            position: absolute;
            left: 1mm;
            width: 8mm;
            font-size: 7.5pt;
            font-weight: 800;
            font-family: "Courier New", Courier, monospace;
            text-align: right;
            top: 0;
            line-height: 5.6mm;
        }

        .bubbles-group {
            position: absolute;
            left: 11mm;
            top: 0;
            line-height: 5.6mm;
        }

        .bubble {
            position: absolute;
            width: 4.2mm;
            height: 4.2mm;
            border-radius: 50%;
            border: 1px solid #000000;
            text-align: center;
            font-size: 6pt;
            font-weight: 800;
            line-height: 4.0mm;
            background: #ffffff;
            color: #000000;
        }

        .footer-note {
            position: absolute;
            bottom: 13mm;
            left: 22mm;
            right: 22mm;
            text-align: center;
            font-size: 6.5pt;
            color: #555555;
            letter-spacing: 0.3px;
        }
    </style>
</head>
<body>
    @foreach ($sheetsData as $sheet)
        @foreach ($layoutSpec['pages'] as $page)
            <div class="sheet-page">
                <div class="fiducial-marker marker-tl"></div>
                <div class="fiducial-marker marker-tr"></div>
                <div class="fiducial-marker marker-bl"></div>
                <div class="fiducial-marker marker-br"></div>

                <div class="header-container">
                    <div class="header-top">
                        <div class="header-title-box">
                            <div class="institution-name">
                                {{ $sheet['institution_name'] ?? 'LikhaGrade Examination System' }}
                            </div>
                            <div class="exam-title">
                                {{ $exam->title }}
                            </div>
                            <div class="exam-meta">
                                @if(!empty($exam->subject))
                                    <strong>Subject:</strong> {{ $exam->subject->name }} ({{ $exam->subject->code }}) &bull;
                                @endif
                                @if(!empty($exam->schoolClass))
                                    <strong>Class:</strong> {{ $exam->schoolClass->name }} &bull;
                                @endif
                                <strong>Exam ID:</strong> {{ $exam->ulid }}
                            </div>
                        </div>

                        <div class="header-qr-box">
                            <img class="header-qr-img" src="{{ $sheet['qr_data_uri'] }}" alt="QR Code" />
                        </div>
                    </div>

                    <div class="header-middle">
                        <div class="student-fields">
                            <div class="field-row">
                                <span class="field-label">Student Name:</span>
                                <span class="field-line" style="width: {{ $pageWidthMm - 124 }}mm;">
                                    {{ $sheet['student_name'] ?? '' }}
                                </span>
                            </div>
                            <div class="field-row">
                                <span class="field-label">Student ID:</span>
                                <span class="field-line" style="width: 38mm;">
                                    {{ $sheet['student_id_number'] ?? '' }}
                                </span>
                                <span class="field-label" style="width: 14mm; margin-left: 4mm;">Section:</span>
                                <span class="field-line" style="width: 28mm;">
                                    {{ $sheet['section_name'] ?? '' }}
                                </span>
                                <span class="field-label" style="width: 12mm; margin-left: 4mm;">Date:</span>
                                <span class="field-line" style="width: 25mm;">
                                    {{ $exam->exam_date ? $exam->exam_date->format('Y-m-d') : '' }}
                                </span>
                            </div>
                        </div>

                        <div class="instructions-box">
                            <div class="instructions-title">Marking Guide</div>
                            <div class="instructions-text">
                                Use dark pencil or black pen. Completely shade bubbles. Do not fold or smudge sheet.
                            </div>
                            <div class="instructions-examples">
                                Correct: <span class="sample-bubble-good"></span> &bull;
                                Incorrect: <span class="sample-bubble-bad">&times;</span>
                                <span class="sample-bubble-bad">&check;</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="grid-container">
                    @foreach ($page['columns'] as $col)
                        <div
                            class="column-box"
                            style="
                                left: {{ $col['left_x_mm'] - 14.0 }}mm;
                                width: {{ $col['width_mm'] }}mm;
                            "
                        >
                            @foreach ($col['questions'] as $q)
                                @php
                                    $topOffsetMm = ($q['center_y_mm'] - $page['grid']['top_y_mm']) - 2.8;
                                @endphp
                                <div class="question-row" style="top: {{ $topOffsetMm }}mm;">
                                    <span class="q-number">
                                        {{ sprintf('%02d', $q['question_number']) }}
                                    </span>
                                    @foreach ($q['bubbles'] as $choice => $b)
                                        @php
                                            $bubbleLeftMm = $b['center_x_mm'] - $col['left_x_mm'] - 12.0;
                                        @endphp
                                        <span
                                            class="bubble"
                                            style="left: {{ $bubbleLeftMm }}mm; top: 0.7mm;"
                                        >{{ $choice }}</span>
                                    @endforeach
                                </div>
                            @endforeach
                        </div>
                    @endforeach
                </div>

                <div class="footer-note">
                    Sheet Ref: {{ $sheet['sheet_ulid'] }} &bull; LikhaGrade OMR {{ $layoutSpec['template_version'] }} &bull; Machine-scannable format. Keep clean and uncreased.
                </div>
            </div>
        @endforeach
    @endforeach
</body>
</html>

