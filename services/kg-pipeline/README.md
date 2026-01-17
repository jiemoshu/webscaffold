# Singapore Math Knowledge Graph Pipeline

A Python service for ingesting Singapore Math curriculum PDFs and building a Neo4j knowledge graph using the CPA (Concrete-Pictorial-Abstract) approach.

## Features

- **PDF Processing**: Convert math education PDFs to structured data using Mathpix OCR
- **Entity Extraction**: Automatically extract concepts, strategies, and problems
- **Knowledge Graph**: Build a Neo4j property graph with LlamaIndex
- **Graph RAG**: Query the graph with natural language questions
- **CLI**: Simple "Drop & Run" workflow for processing files

## Quick Start

### 1. Install Dependencies

```bash
poetry install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your API keys
```

### 3. Process PDFs

```bash
# Drop PDFs into data/inbox/
cp your-math-workbook.pdf data/inbox/

# Process all files
poetry run process-inbox
```

### 4. Query the Graph

```bash
# Via CLI
poetry run process-inbox query "What is the bar model method?"

# Via API
poetry run serve-api
# Then POST to http://localhost:8000/rag/query
```

## CLI Commands

```bash
# Process all PDFs in inbox
poetry run process-inbox process

# Preview without processing
poetry run process-inbox process --dry-run

# Check pipeline status
poetry run process-inbox status

# Query the knowledge graph
poetry run process-inbox query "How do I solve ratio problems?"
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/status` | GET | Pipeline status |
| `/rag/query` | POST | Query knowledge graph |

## Directory Structure

```
kg-pipeline/
├── data/
│   ├── inbox/      # Drop PDFs here for processing
│   ├── archive/    # Successfully processed files
│   └── error/      # Failed files with logs
├── src/
│   ├── models.py   # Pydantic ontology (CPA approach)
│   ├── parser.py   # Mathpix PDF parser
│   ├── graph.py    # LlamaIndex graph builder
│   ├── cli.py      # Typer CLI
│   └── api.py      # FastAPI endpoints
└── pyproject.toml
```

## Ontology

The knowledge graph models Singapore Math's CPA approach:

### Entities
- **Concept**: Mathematical concepts (Ratio, Fraction, Place Value)
- **Strategy**: Problem-solving methods (Bar Model, Number Bonds)
- **Problem**: Math exercises and word problems
- **GradeLevel**: Primary 1-6

### Relations
- `(:Concept)-[:PREREQUISITE]->(:Concept)`
- `(:Problem)-[:SOLVED_BY]->(:Strategy)`
- `(:Strategy)-[:APPLIES_TO]->(:Concept)`
- `(:Concept)-[:TAUGHT_AT]->(:GradeLevel)`

## Development

```bash
# Run tests
poetry run pytest

# Format code
poetry run black src/
poetry run ruff check src/ --fix

# Type check
poetry run mypy src/
```
