"""Singapore Math Knowledge Graph CLI.

A "Drop & Run" CLI tool for processing math education PDFs
and building a Neo4j knowledge graph.

Usage:
    poetry run process-inbox           # Process all PDFs in inbox
    poetry run process-inbox --dry-run # Preview what would be processed
    poetry run python -m src.cli       # Alternative invocation
"""

import asyncio
import shutil
import traceback
from datetime import datetime
from pathlib import Path
from typing import Optional

import typer
from rich.console import Console
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, TextColumn, TimeElapsedColumn
from rich.table import Table

from .config import get_settings
from .graph import get_graph_builder
from .models import ExtractionResult
from .parser import MathpixParser

# Initialize CLI app and console
app = typer.Typer(
    name="kg-pipeline",
    help="Singapore Math Knowledge Graph Pipeline - Process PDFs and build knowledge graphs",
    add_completion=False,
)
console = Console()


def _ensure_directories() -> None:
    """Ensure data directories exist."""
    settings = get_settings()
    settings.inbox_path.mkdir(parents=True, exist_ok=True)
    settings.archive_path.mkdir(parents=True, exist_ok=True)
    settings.error_path.mkdir(parents=True, exist_ok=True)


def _get_pdf_files() -> list[Path]:
    """Get all PDF files in the inbox directory."""
    settings = get_settings()
    return list(settings.inbox_path.glob("*.pdf"))


def _move_to_archive(pdf_path: Path) -> Path:
    """Move successfully processed file to archive with timestamp."""
    settings = get_settings()
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    archive_name = f"{timestamp}_{pdf_path.name}"
    archive_path = settings.archive_path / archive_name
    shutil.move(str(pdf_path), str(archive_path))
    return archive_path


def _move_to_error(pdf_path: Path, error_msg: str) -> Path:
    """Move failed file to error directory and log error."""
    settings = get_settings()
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    error_name = f"{timestamp}_{pdf_path.name}"
    error_dest = settings.error_path / error_name
    shutil.move(str(pdf_path), str(error_dest))

    # Append to error log
    log_path = settings.error_path / "logs.txt"
    with open(log_path, "a") as f:
        f.write(f"\n{'='*60}\n")
        f.write(f"File: {pdf_path.name}\n")
        f.write(f"Time: {datetime.now().isoformat()}\n")
        f.write(f"Error: {error_msg}\n")

    return error_dest


async def _process_single_file(
    pdf_path: Path,
    parser: MathpixParser,
    progress: Progress,
    task_id: int,
) -> ExtractionResult:
    """Process a single PDF file through the pipeline."""
    import time

    start_time = time.time()

    try:
        # Step 1: Parse with Mathpix
        progress.update(task_id, description=f"[cyan]Parsing {pdf_path.name} with Mathpix...")
        parsed_doc = await parser.parse_pdf(pdf_path)

        # Step 2: Extract entities via LLM
        progress.update(task_id, description=f"[cyan]Extracting entities via LLM...")
        builder = get_graph_builder()
        entities = await builder.add_document(parsed_doc)

        processing_time = time.time() - start_time

        return ExtractionResult(
            source_file=str(pdf_path.name),
            success=True,
            entities=entities,
            processing_time_seconds=processing_time,
        )

    except Exception as e:
        processing_time = time.time() - start_time
        return ExtractionResult(
            source_file=str(pdf_path.name),
            success=False,
            error_message=f"{type(e).__name__}: {str(e)}\n{traceback.format_exc()}",
            processing_time_seconds=processing_time,
        )


async def _process_inbox_async(dry_run: bool = False) -> tuple[int, int]:
    """Process all PDFs in inbox asynchronously."""
    _ensure_directories()
    pdf_files = _get_pdf_files()

    if not pdf_files:
        console.print("[yellow]No PDF files found in inbox.[/yellow]")
        return 0, 0

    if dry_run:
        console.print(Panel(f"[cyan]Would process {len(pdf_files)} file(s):[/cyan]"))
        for pdf in pdf_files:
            console.print(f"  - {pdf.name}")
        return len(pdf_files), 0

    # Check configuration
    settings = get_settings()
    api_status = settings.validate_api_keys()

    if not api_status["openai"]:
        console.print("[red]Error: OPENAI_API_KEY not configured[/red]")
        return 0, len(pdf_files)

    # Display configuration status
    status_table = Table(title="Configuration Status", show_header=False)
    status_table.add_column("Service")
    status_table.add_column("Status")
    status_table.add_row("OpenAI", "[green]Configured[/green]" if api_status["openai"] else "[red]Missing[/red]")
    status_table.add_row("Neo4j", "[green]Configured[/green]" if api_status["neo4j"] else "[yellow]Local/Missing[/yellow]")
    status_table.add_row("Mathpix", "[green]Configured[/green]" if api_status["mathpix"] else "[yellow]Fallback mode[/yellow]")
    console.print(status_table)
    console.print()

    success_count = 0
    error_count = 0

    parser = MathpixParser()

    try:
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            TimeElapsedColumn(),
            console=console,
        ) as progress:
            for pdf_path in pdf_files:
                task_id = progress.add_task(f"Processing {pdf_path.name}...", total=None)

                result = await _process_single_file(pdf_path, parser, progress, task_id)

                progress.remove_task(task_id)

                if result.success:
                    archive_path = _move_to_archive(pdf_path)
                    console.print(f"[green]✓[/green] {pdf_path.name} → archive/")
                    if result.entities:
                        console.print(
                            f"  [dim]Extracted: {len(result.entities.concepts)} concepts, "
                            f"{len(result.entities.strategies)} strategies, "
                            f"{len(result.entities.problems)} problems[/dim]"
                        )
                    success_count += 1
                else:
                    _move_to_error(pdf_path, result.error_message or "Unknown error")
                    console.print(f"[red]✗[/red] {pdf_path.name} → error/")
                    console.print(f"  [dim red]{result.error_message[:100]}...[/dim red]")
                    error_count += 1

    finally:
        await parser.close()

    return success_count, error_count


@app.command("process")
def process_inbox(
    dry_run: bool = typer.Option(
        False, "--dry-run", "-n", help="Preview files without processing"
    ),
    verbose: bool = typer.Option(
        False, "--verbose", "-v", help="Show detailed output"
    ),
) -> None:
    """Process all PDF files in the inbox directory.

    Scans data/inbox/ for PDF files and:
    1. Parses them using Mathpix (or pypdf fallback)
    2. Extracts Singapore Math entities (concepts, strategies, problems)
    3. Builds/updates the Neo4j knowledge graph
    4. Moves processed files to archive/ or error/
    """
    console.print(Panel.fit(
        "[bold blue]Singapore Math Knowledge Graph Pipeline[/bold blue]\n"
        "[dim]Processing inbox for math education PDFs[/dim]",
        border_style="blue",
    ))

    success, errors = asyncio.run(_process_inbox_async(dry_run))

    console.print()
    if not dry_run:
        console.print(Panel(
            f"[green]Success: {success}[/green] | [red]Errors: {errors}[/red]",
            title="Summary",
            border_style="green" if errors == 0 else "yellow",
        ))


@app.command("status")
def show_status() -> None:
    """Show the current status of the pipeline and directories."""
    settings = get_settings()
    _ensure_directories()

    # Count files in each directory
    inbox_count = len(list(settings.inbox_path.glob("*.pdf")))
    archive_count = len(list(settings.archive_path.glob("*.pdf")))
    error_count = len(list(settings.error_path.glob("*.pdf")))

    # Configuration status
    api_status = settings.validate_api_keys()

    console.print(Panel.fit(
        "[bold]Singapore Math KG Pipeline Status[/bold]",
        border_style="blue",
    ))

    # Directory status
    dir_table = Table(title="Directories", show_header=True)
    dir_table.add_column("Location", style="cyan")
    dir_table.add_column("PDFs", justify="right")
    dir_table.add_column("Path")
    dir_table.add_row("Inbox", str(inbox_count), str(settings.inbox_path))
    dir_table.add_row("Archive", str(archive_count), str(settings.archive_path))
    dir_table.add_row("Error", str(error_count), str(settings.error_path))
    console.print(dir_table)

    console.print()

    # API status
    api_table = Table(title="API Configuration", show_header=True)
    api_table.add_column("Service")
    api_table.add_column("Status")
    api_table.add_row(
        "OpenAI",
        "[green]✓ Configured[/green]" if api_status["openai"] else "[red]✗ Missing OPENAI_API_KEY[/red]"
    )
    api_table.add_row(
        "Neo4j",
        "[green]✓ Configured[/green]" if api_status["neo4j"] else "[yellow]⚠ Using defaults[/yellow]"
    )
    api_table.add_row(
        "Mathpix",
        "[green]✓ Configured[/green]" if api_status["mathpix"] else "[yellow]⚠ Will use pypdf fallback[/yellow]"
    )
    console.print(api_table)

    if inbox_count > 0:
        console.print(f"\n[cyan]Run 'poetry run process-inbox process' to process {inbox_count} file(s)[/cyan]")


@app.command("query")
def query_graph(
    question: str = typer.Argument(..., help="Question to ask the knowledge graph"),
) -> None:
    """Query the knowledge graph with a natural language question."""
    console.print(Panel(f"[cyan]Query:[/cyan] {question}", border_style="cyan"))

    async def _query():
        builder = get_graph_builder()
        return await builder.query(question)

    result = asyncio.run(_query())

    console.print(Panel(
        f"[green]Answer:[/green]\n{result['answer']}",
        border_style="green",
    ))

    if result.get("sources"):
        console.print(f"\n[dim]Sources: {', '.join(result['sources'])}[/dim]")


# Default command when running as module
@app.callback(invoke_without_command=True)
def main(ctx: typer.Context) -> None:
    """Singapore Math Knowledge Graph Pipeline CLI."""
    if ctx.invoked_subcommand is None:
        # Default to process command
        process_inbox(dry_run=False, verbose=False)


if __name__ == "__main__":
    app()
