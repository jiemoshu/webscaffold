"""Mathpix PDF Parser for Singapore Math content.

Handles conversion of math education PDFs to structured Markdown + LaTeX.
Uses Mathpix API for accurate OCR of mathematical expressions.
Falls back to pypdf for basic text extraction when Mathpix is unavailable.
"""

import asyncio
import base64
import time
from pathlib import Path
from typing import Optional

import httpx
from pypdf import PdfReader

from .config import get_settings


class ParsedDocument:
    """Container for parsed document content."""

    def __init__(
        self,
        source_path: Path,
        markdown_content: str,
        latex_blocks: list[str],
        image_urls: list[str],
        page_count: int,
        processing_time: float,
        used_mathpix: bool,
    ):
        self.source_path = source_path
        self.markdown_content = markdown_content
        self.latex_blocks = latex_blocks
        self.image_urls = image_urls
        self.page_count = page_count
        self.processing_time = processing_time
        self.used_mathpix = used_mathpix

    def __repr__(self) -> str:
        return (
            f"ParsedDocument(source={self.source_path.name}, "
            f"pages={self.page_count}, latex_blocks={len(self.latex_blocks)})"
        )


class MathpixParser:
    """Parser for math education PDFs using Mathpix API.

    Mathpix excels at:
    - Mathematical expression recognition (LaTeX output)
    - Handwritten math OCR
    - Table and diagram extraction
    - Multi-language support (including Chinese)
    """

    def __init__(self):
        self.settings = get_settings()
        self._client: Optional[httpx.AsyncClient] = None

    @property
    def is_configured(self) -> bool:
        """Check if Mathpix API credentials are configured."""
        return bool(self.settings.mathpix_app_id and self.settings.mathpix_app_key)

    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client."""
        if self._client is None:
            self._client = httpx.AsyncClient(
                timeout=httpx.Timeout(self.settings.mathpix_timeout_seconds),
                headers={
                    "app_id": self.settings.mathpix_app_id,
                    "app_key": self.settings.mathpix_app_key,
                },
            )
        return self._client

    async def close(self) -> None:
        """Close HTTP client."""
        if self._client:
            await self._client.aclose()
            self._client = None

    async def parse_pdf(self, pdf_path: Path) -> ParsedDocument:
        """Parse a PDF file using Mathpix API.

        Args:
            pdf_path: Path to the PDF file

        Returns:
            ParsedDocument with extracted content

        Raises:
            FileNotFoundError: If PDF doesn't exist
            ValueError: If Mathpix API fails and fallback also fails
        """
        if not pdf_path.exists():
            raise FileNotFoundError(f"PDF not found: {pdf_path}")

        start_time = time.time()

        if self.is_configured:
            try:
                result = await self._parse_with_mathpix(pdf_path)
                result.processing_time = time.time() - start_time
                return result
            except Exception as e:
                # Log error and fall back to basic parsing
                print(f"Mathpix API failed: {e}. Falling back to basic PDF parsing.")

        # Fallback to basic PDF parsing
        result = await self._parse_with_pypdf(pdf_path)
        result.processing_time = time.time() - start_time
        return result

    async def _parse_with_mathpix(self, pdf_path: Path) -> ParsedDocument:
        """Parse PDF using Mathpix API.

        Uses the PDF processing endpoint which handles:
        - Multi-page PDFs
        - Math expressions to LaTeX
        - Tables to Markdown
        - Diagrams extraction
        """
        client = await self._get_client()

        # Read and encode PDF
        pdf_bytes = pdf_path.read_bytes()
        pdf_base64 = base64.b64encode(pdf_bytes).decode("utf-8")

        # Submit PDF for processing
        response = await client.post(
            f"{self.settings.mathpix_api_url}/pdf",
            json={
                "src": f"data:application/pdf;base64,{pdf_base64}",
                "conversion_formats": {"md": True},
                "math_inline_delimiters": ["$", "$"],
                "math_display_delimiters": ["$$", "$$"],
                "rm_spaces": True,
                "enable_tables_fallback": True,
            },
        )
        response.raise_for_status()
        result = response.json()

        # Get the PDF ID for polling
        pdf_id = result.get("pdf_id")
        if not pdf_id:
            raise ValueError("Mathpix did not return a pdf_id")

        # Poll for completion
        markdown_content = await self._poll_for_result(client, pdf_id)

        # Extract LaTeX blocks from markdown
        latex_blocks = self._extract_latex_blocks(markdown_content)

        # Count pages using pypdf
        reader = PdfReader(pdf_path)
        page_count = len(reader.pages)

        return ParsedDocument(
            source_path=pdf_path,
            markdown_content=markdown_content,
            latex_blocks=latex_blocks,
            image_urls=[],  # Mathpix returns images inline
            page_count=page_count,
            processing_time=0.0,  # Will be set by caller
            used_mathpix=True,
        )

    async def _poll_for_result(
        self, client: httpx.AsyncClient, pdf_id: str, max_attempts: int = 60
    ) -> str:
        """Poll Mathpix API for PDF processing completion."""
        for attempt in range(max_attempts):
            response = await client.get(f"{self.settings.mathpix_api_url}/pdf/{pdf_id}")
            response.raise_for_status()
            result = response.json()

            status = result.get("status")
            if status == "completed":
                # Get the markdown output
                md_response = await client.get(
                    f"{self.settings.mathpix_api_url}/pdf/{pdf_id}.md"
                )
                md_response.raise_for_status()
                return md_response.text
            elif status == "error":
                raise ValueError(f"Mathpix processing error: {result.get('error')}")

            # Wait before next poll
            await asyncio.sleep(2)

        raise TimeoutError("Mathpix processing timed out")

    async def _parse_with_pypdf(self, pdf_path: Path) -> ParsedDocument:
        """Fallback: Parse PDF using pypdf for basic text extraction.

        Note: This won't preserve mathematical expressions as LaTeX.
        """
        reader = PdfReader(pdf_path)
        text_content = []

        for page_num, page in enumerate(reader.pages, 1):
            page_text = page.extract_text() or ""
            text_content.append(f"## Page {page_num}\n\n{page_text}")

        markdown_content = "\n\n".join(text_content)

        return ParsedDocument(
            source_path=pdf_path,
            markdown_content=markdown_content,
            latex_blocks=[],  # pypdf doesn't extract LaTeX
            image_urls=[],
            page_count=len(reader.pages),
            processing_time=0.0,
            used_mathpix=False,
        )

    @staticmethod
    def _extract_latex_blocks(markdown: str) -> list[str]:
        """Extract LaTeX blocks from markdown content.

        Finds both inline ($...$) and display ($$...$$) math.
        """
        import re

        latex_blocks = []

        # Display math ($$...$$)
        display_pattern = r"\$\$(.*?)\$\$"
        for match in re.finditer(display_pattern, markdown, re.DOTALL):
            latex_blocks.append(match.group(1).strip())

        # Inline math ($...$) - but not $$
        inline_pattern = r"(?<!\$)\$(?!\$)(.*?)\$(?!\$)"
        for match in re.finditer(inline_pattern, markdown):
            latex_blocks.append(match.group(1).strip())

        return latex_blocks


# Convenience function for CLI usage
async def parse_file(pdf_path: Path) -> ParsedDocument:
    """Parse a single PDF file."""
    parser = MathpixParser()
    try:
        return await parser.parse_pdf(pdf_path)
    finally:
        await parser.close()
