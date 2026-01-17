# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Singapore Math platform with a Knowledge Graph Pipeline. Monorepo structure with:
- **web/**: Next.js 14 frontend with AWS Amplify integration
- **services/kg-pipeline/**: Python service for PDF ingestion and Neo4j knowledge graph (CPA approach)
- **amplify/**: AWS Lambda + API Gateway + DynamoDB backend

## Common Commands

All commands via `make`:

```bash
make help          # Show all available commands
```

### Setup
```bash
make setup         # Full setup: Neo4j + KG Pipeline
make kg-dev        # Setup KG Pipeline (Python venv + deps)
make web-dev       # Setup Web + run dev server
```

### Infrastructure
```bash
make neo4j-up      # Start Neo4j (ports 17474/17687)
make neo4j-down    # Stop Neo4j
```

### KG Pipeline
```bash
make kg-status     # Check pipeline status
make kg-process    # Process PDFs in inbox
make kg-query Q="什么是 bar model?"  # Query knowledge graph
make kg-api        # Start FastAPI server (:18000)
make kg-lint       # Lint code
make kg-format     # Format code
```

### Web
```bash
make web-dev       # Run Next.js dev server (:3000)
make web-build     # Production build
make web-lint      # Lint TypeScript
```

### Amplify (AWS)
```bash
amplify push       # Deploy backend
amplify status     # Check deployment
```

## Quick Start

```bash
# 1. Setup everything
make setup                    # Creates venv, installs deps, starts Neo4j

# 2. Configure API key
vim .env                      # Set OPENAI_API_KEY=sk-...

# 3. Process PDFs
cp your-file.pdf services/kg-pipeline/data/inbox/
make kg-process

# 4. Query
make kg-query Q="什么是 bar model?"
```

### Verify Services
- Neo4j Browser: http://localhost:17474 (neo4j / singapore_math_2024)
- KG API: http://localhost:18000/docs (after `make kg-api`)

## Configuration

Single `.env` file at project root for all services:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | Yes | - | For LLM & embeddings |
| `NEO4J_URI` | No | `bolt://localhost:17687` | Neo4j connection |
| `NEO4J_PASSWORD` | No | `singapore_math_2024` | Neo4j password |
| `API_PORT` | No | `18000` | FastAPI port |
| `MATHPIX_APP_ID/KEY` | No | - | Optional, for better math OCR |

**Ports**: Using non-default ports to avoid conflicts (Neo4j: 17474/17687, API: 18000).

## Architecture

### Knowledge Graph Pipeline (services/kg-pipeline/)

PDF processing pipeline using the Singapore Math CPA (Concrete-Pictorial-Abstract) approach:

1. **Drop & Run workflow**: Place PDFs in `data/inbox/`, run `process-inbox`, files move to `data/archive/` (success) or `data/error/` (failure)

2. **Ontology (src/models.py)**:
   - Entities: `Concept`, `Strategy`, `Problem`, `GradeLevel`
   - CPA stages: concrete, pictorial, abstract
   - Relations: `PREREQUISITE`, `SOLVED_BY`, `APPLIES_TO`, `TAUGHT_AT`

3. **Processing flow**:
   - `parser.py`: Mathpix OCR (with pypdf fallback) for PDF-to-text
   - `graph.py`: LlamaIndex + Neo4j for entity extraction and graph building
   - `cli.py`: Typer CLI orchestration
   - `api.py`: FastAPI endpoints (`/health`, `/status`, `/rag/query`)

4. **Config**: Reads from root `.env` file (pydantic-settings)

### Web Frontend (web/)

Next.js 14 app directory structure with AWS Amplify client for API calls:
- Uses `aws-amplify` v6 for REST API integration
- Connects to Lambda backend via API Gateway

### Lambda Backend (amplify/)

AWS Lambda with DynamoDB for user management:
- REST endpoints: GET/POST `/users`, GET/DELETE `/users/{id}`
- Uses AWS SDK DocumentClient for DynamoDB operations
- Table name from environment variable `STORAGE_USERSTABLE_NAME`
