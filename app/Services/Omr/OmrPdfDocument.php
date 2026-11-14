<?php

namespace App\Services\Omr;

use Symfony\Component\HttpFoundation\Response;

class OmrPdfDocument
{
    public function __construct(
        protected string $content,
        protected string $fileName = 'document.pdf'
    ) {}

    public function output(): string
    {
        return $this->content;
    }

    public function download(?string $fileName = null): Response
    {
        $name = $fileName ?? $this->fileName;

        return response($this->content, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "attachment; filename=\"{$name}\"",
            'Content-Length' => strlen($this->content),
        ]);
    }

    public function stream(?string $fileName = null): Response
    {
        $name = $fileName ?? $this->fileName;

        return response($this->content, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "inline; filename=\"{$name}\"",
            'Content-Length' => strlen($this->content),
        ]);
    }
}
