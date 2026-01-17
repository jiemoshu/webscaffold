"""Knowledge Graph Builder using LlamaIndex.

Builds a Neo4j property graph from parsed math education documents.
Uses LlamaIndex's PropertyGraphIndex for:
- Automatic entity extraction
- Relationship inference
- Graph-based RAG queries
"""

from typing import Optional

from llama_index.core import Document, PropertyGraphIndex, Settings
from llama_index.core.indices.property_graph import SchemaLLMPathExtractor
from llama_index.core.node_parser import SentenceSplitter
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.graph_stores.neo4j import Neo4jPropertyGraphStore
from llama_index.llms.openai import OpenAI

from .config import get_settings
from .models import (
    CPAStage,
    Concept,
    DifficultyLevel,
    ExtractedEntities,
    GradeLevel,
    Problem,
    Strategy,
)
from .parser import ParsedDocument


# Define the Singapore Math schema for entity extraction
SINGAPORE_MATH_ENTITIES = [
    "Concept",  # Mathematical concepts (Ratio, Fraction, etc.)
    "Strategy",  # Problem-solving methods (Bar Model, Number Bonds, etc.)
    "Problem",  # Math problems/exercises
    "GradeLevel",  # P1-P6
    "Topic",  # Curriculum topics
]

SINGAPORE_MATH_RELATIONS = [
    "PREREQUISITE",  # Concept -> Concept
    "SOLVED_BY",  # Problem -> Strategy
    "TESTS",  # Problem -> Concept
    "TAUGHT_AT",  # Concept -> GradeLevel
    "PART_OF",  # Concept -> Topic
    "APPLIES_TO",  # Strategy -> Concept
    "VISUALIZED_AS",  # Strategy -> Visual representation
]

EXTRACTION_PROMPT = """
You are an expert in Singapore Math curriculum and the CPA (Concrete-Pictorial-Abstract) approach.

Given the following text from a math education document, extract:
1. Mathematical Concepts (e.g., Ratio, Fraction, Place Value, Algebra)
2. Problem-Solving Strategies (e.g., Bar Model, Number Bonds, Guess and Check)
3. Math Problems (word problems, exercises)
4. Grade Level indicators (Primary 1-6)

For each entity, identify its relationships:
- Which concepts are prerequisites for others?
- Which strategies can solve which problems?
- Which grade levels teach which concepts?

Focus on the Singapore Math approach:
- Bar Models (also called tape diagrams or model method)
- Part-whole relationships
- Comparison models
- Number bonds
- Place value concepts

Text to analyze:
{text}
"""


class KnowledgeGraphBuilder:
    """Builds and queries a Singapore Math knowledge graph using LlamaIndex."""

    def __init__(self):
        self.settings = get_settings()
        self._graph_store: Optional[Neo4jPropertyGraphStore] = None
        self._index: Optional[PropertyGraphIndex] = None
        self._setup_llm()

    def _setup_llm(self) -> None:
        """Configure LlamaIndex with OpenAI."""
        if not self.settings.openai_api_key:
            raise ValueError("OPENAI_API_KEY is required")

        Settings.llm = OpenAI(
            model=self.settings.openai_model,
            api_key=self.settings.openai_api_key,
            temperature=0.1,  # Low temperature for consistent extraction
        )
        Settings.embed_model = OpenAIEmbedding(
            model=self.settings.openai_embedding_model,
            api_key=self.settings.openai_api_key,
        )
        Settings.node_parser = SentenceSplitter(
            chunk_size=1024,
            chunk_overlap=128,
        )

    @property
    def graph_store(self) -> Neo4jPropertyGraphStore:
        """Get or create Neo4j graph store connection."""
        if self._graph_store is None:
            self._graph_store = Neo4jPropertyGraphStore(
                url=self.settings.neo4j_uri,
                username=self.settings.neo4j_username,
                password=self.settings.neo4j_password,
                database=self.settings.neo4j_database,
            )
        return self._graph_store

    def _create_extractor(self) -> SchemaLLMPathExtractor:
        """Create the schema-based LLM extractor for Singapore Math entities."""
        return SchemaLLMPathExtractor(
            llm=Settings.llm,
            possible_entities=SINGAPORE_MATH_ENTITIES,
            possible_relations=SINGAPORE_MATH_RELATIONS,
            strict=False,  # Allow extraction of entities not in schema
            num_workers=2,
        )

    async def add_document(self, parsed_doc: ParsedDocument) -> ExtractedEntities:
        """Add a parsed document to the knowledge graph.

        Args:
            parsed_doc: A document parsed by MathpixParser

        Returns:
            ExtractedEntities containing all entities found in the document
        """
        # Create LlamaIndex Document
        doc = Document(
            text=parsed_doc.markdown_content,
            metadata={
                "source_file": str(parsed_doc.source_path.name),
                "page_count": parsed_doc.page_count,
                "used_mathpix": parsed_doc.used_mathpix,
                "latex_block_count": len(parsed_doc.latex_blocks),
            },
        )

        # Build or update the property graph index
        extractor = self._create_extractor()

        if self._index is None:
            # Create new index
            self._index = PropertyGraphIndex.from_documents(
                documents=[doc],
                kg_extractors=[extractor],
                property_graph_store=self.graph_store,
                embed_model=Settings.embed_model,
                show_progress=True,
            )
        else:
            # Insert into existing index
            self._index.insert(doc)

        # Extract and return structured entities
        return self._extract_entities_from_graph(parsed_doc)

    def _extract_entities_from_graph(self, parsed_doc: ParsedDocument) -> ExtractedEntities:
        """Query the graph to extract structured entities from the latest document.

        This converts the raw graph nodes back into our Pydantic models.
        """
        # For MVP, we create placeholder entities based on what was indexed
        # In production, you would query the graph store directly
        concepts = []
        strategies = []
        problems = []

        # Check if we have LaTeX blocks (indicates math content)
        if parsed_doc.latex_blocks:
            # Create a placeholder concept for the document
            concepts.append(
                Concept(
                    id=f"concept-{parsed_doc.source_path.stem}",
                    name=f"Content from {parsed_doc.source_path.name}",
                    description="Auto-extracted mathematical content",
                    grade_levels=[GradeLevel.P5],  # Default, would be extracted in production
                    cpa_stage=CPAStage.ABSTRACT,
                    keywords=[],
                )
            )

            # If bar model keywords found, add strategy
            content_lower = parsed_doc.markdown_content.lower()
            if "bar model" in content_lower or "model method" in content_lower:
                strategies.append(
                    Strategy(
                        id=f"strategy-bar-model-{parsed_doc.source_path.stem}",
                        name="Bar Model",
                        description="Visual representation using rectangular bars",
                        cpa_stage=CPAStage.PICTORIAL,
                        applicable_concepts=[concepts[0].id] if concepts else [],
                    )
                )

        return ExtractedEntities(
            concepts=concepts,
            strategies=strategies,
            problems=problems,
        )

    async def query(self, question: str) -> dict:
        """Query the knowledge graph using natural language.

        Args:
            question: A natural language question about Singapore Math

        Returns:
            Dictionary with answer and cited sources
        """
        if self._index is None:
            # Try to load existing index
            try:
                self._index = PropertyGraphIndex.from_existing(
                    property_graph_store=self.graph_store,
                    embed_model=Settings.embed_model,
                )
            except Exception:
                return {
                    "answer": "No documents have been indexed yet. Please process some PDFs first.",
                    "sources": [],
                    "strategies": [],
                }

        # Create query engine
        query_engine = self._index.as_query_engine(
            include_text=True,
            similarity_top_k=5,
        )

        # Execute query
        response = query_engine.query(question)

        # Extract source information
        sources = []
        strategies = []

        if response.source_nodes:
            for node in response.source_nodes:
                metadata = node.node.metadata
                if metadata.get("source_file"):
                    sources.append(metadata["source_file"])

        return {
            "answer": str(response),
            "sources": list(set(sources)),
            "strategies": strategies,
        }

    def close(self) -> None:
        """Close graph store connection."""
        if self._graph_store:
            self._graph_store.close()
            self._graph_store = None


# Singleton instance for reuse
_builder_instance: Optional[KnowledgeGraphBuilder] = None


def get_graph_builder() -> KnowledgeGraphBuilder:
    """Get or create the knowledge graph builder instance."""
    global _builder_instance
    if _builder_instance is None:
        _builder_instance = KnowledgeGraphBuilder()
    return _builder_instance
