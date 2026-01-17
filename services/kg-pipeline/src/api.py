"""FastAPI REST API for Singapore Math Knowledge Graph.

Provides endpoints for:
- Querying the knowledge graph with natural language
- Health checks and status
- Future: uploading PDFs for processing
"""

from contextlib import asynccontextmanager
from typing import Optional

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .config import get_settings
from .graph import KnowledgeGraphBuilder, get_graph_builder


# --- Request/Response Models ---


class QueryRequest(BaseModel):
    """Request model for RAG queries."""

    question: str = Field(
        ...,
        min_length=3,
        max_length=1000,
        description="Natural language question about Singapore Math",
        json_schema_extra={"example": "What strategies can I use to solve ratio problems?"},
    )
    include_sources: bool = Field(
        default=True,
        description="Whether to include source documents in the response",
    )


class QueryResponse(BaseModel):
    """Response model for RAG queries."""

    answer: str = Field(..., description="The generated answer")
    sources: list[str] = Field(
        default_factory=list,
        description="Source documents used to generate the answer",
    )
    strategies: list[str] = Field(
        default_factory=list,
        description="Relevant problem-solving strategies mentioned",
    )
    confidence: Optional[float] = Field(
        default=None,
        ge=0.0,
        le=1.0,
        description="Confidence score of the answer (0-1)",
    )


class HealthResponse(BaseModel):
    """Response model for health check."""

    status: str
    services: dict[str, bool]
    version: str


class StatusResponse(BaseModel):
    """Response model for detailed status."""

    inbox_files: int
    archive_files: int
    error_files: int
    api_configured: dict[str, bool]


# --- App Setup ---


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup: Initialize graph builder (validates config)
    try:
        settings = get_settings()
        app.state.settings = settings
        yield
    finally:
        # Shutdown: Close connections
        pass


app = FastAPI(
    title="Singapore Math Knowledge Graph API",
    description="""
API for querying a knowledge graph built from Singapore Math curriculum materials.

## Features
- **RAG Query**: Ask natural language questions about Singapore Math concepts and strategies
- **CPA Approach**: Answers leverage the Concrete-Pictorial-Abstract teaching method
- **Strategy Recommendations**: Get problem-solving strategies like Bar Models, Number Bonds, etc.

## Usage
1. Process PDFs using the CLI: `poetry run process-inbox`
2. Query the graph using `POST /rag/query`
    """,
    version="0.1.0",
    lifespan=lifespan,
)

# Configure CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js dev server
        "http://localhost:3001",
        "https://*.amplifyapp.com",  # AWS Amplify deployed frontend
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


# --- Endpoints ---


@app.get("/health", response_model=HealthResponse, tags=["System"])
async def health_check() -> HealthResponse:
    """Check API health and service connectivity."""
    settings = get_settings()
    api_status = settings.validate_api_keys()

    return HealthResponse(
        status="healthy",
        services={
            "openai": api_status["openai"],
            "neo4j": api_status["neo4j"],
            "mathpix": api_status["mathpix"],
        },
        version="0.1.0",
    )


@app.get("/status", response_model=StatusResponse, tags=["System"])
async def get_status() -> StatusResponse:
    """Get detailed pipeline status."""
    settings = get_settings()

    # Count files
    inbox_count = len(list(settings.inbox_path.glob("*.pdf")))
    archive_count = len(list(settings.archive_path.glob("*.pdf")))
    error_count = len(list(settings.error_path.glob("*.pdf")))

    return StatusResponse(
        inbox_files=inbox_count,
        archive_files=archive_count,
        error_files=error_count,
        api_configured=settings.validate_api_keys(),
    )


@app.post("/rag/query", response_model=QueryResponse, tags=["RAG"])
async def query_knowledge_graph(request: QueryRequest) -> QueryResponse:
    """Query the Singapore Math knowledge graph.

    Uses Graph RAG to:
    1. Find relevant nodes in the knowledge graph
    2. Retrieve associated concepts, strategies, and problems
    3. Generate a contextual answer using LLM

    **Example questions:**
    - "What is the bar model method?"
    - "How do I solve ratio problems in Primary 5?"
    - "What are the prerequisites for learning fractions?"
    - "Explain the CPA approach for teaching multiplication"
    """
    settings = get_settings()

    # Validate OpenAI is configured
    if not settings.openai_api_key:
        raise HTTPException(
            status_code=503,
            detail="OpenAI API key not configured. Please set OPENAI_API_KEY.",
        )

    try:
        builder = get_graph_builder()
        result = await builder.query(request.question)

        return QueryResponse(
            answer=result["answer"],
            sources=result.get("sources", []) if request.include_sources else [],
            strategies=result.get("strategies", []),
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Query failed: {str(e)}",
        )


@app.get("/concepts", tags=["Graph"])
async def list_concepts():
    """List all concepts in the knowledge graph.

    Returns a summary of mathematical concepts extracted from curriculum materials.
    """
    # TODO: Implement direct Neo4j query for concepts
    return {
        "message": "Not implemented yet. Use /rag/query to explore concepts.",
        "example_query": "What mathematical concepts are covered in Primary 5?",
    }


@app.get("/strategies", tags=["Graph"])
async def list_strategies():
    """List all problem-solving strategies in the knowledge graph.

    Returns Singapore Math strategies like Bar Models, Number Bonds, etc.
    """
    # TODO: Implement direct Neo4j query for strategies
    return {
        "message": "Not implemented yet. Use /rag/query to explore strategies.",
        "example_query": "What strategies can I use to solve word problems?",
    }


# --- Server Runner ---


def run_server() -> None:
    """Run the API server."""
    settings = get_settings()
    uvicorn.run(
        "src.api:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=True,
    )


if __name__ == "__main__":
    run_server()
