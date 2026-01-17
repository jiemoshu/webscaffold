"""Singapore Math Ontology Models.

Defines the domain model for the CPA (Concrete-Pictorial-Abstract) approach
used in Singapore Math curriculum.

Entities:
- Concept: Mathematical concepts (e.g., "Ratio", "Fraction", "Place Value")
- Strategy: Problem-solving strategies (e.g., "Bar Model", "Number Bonds")
- Problem: Math problems extracted from curriculum materials
- GradeLevel: Grade level classification (Primary 1-6)

Relations:
- Concept -[PREREQUISITE]-> Concept
- Problem -[SOLVED_BY]-> Strategy
- Strategy -[VISUALIZED_AS]-> ImageURL
- Concept -[TAUGHT_AT]-> GradeLevel
- Problem -[TESTS]-> Concept
"""

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class CPAStage(str, Enum):
    """The three stages of the CPA approach."""

    CONCRETE = "concrete"  # Physical manipulatives
    PICTORIAL = "pictorial"  # Visual representations (bar models, diagrams)
    ABSTRACT = "abstract"  # Symbolic/numerical


class GradeLevel(str, Enum):
    """Singapore Primary School grade levels."""

    P1 = "Primary 1"
    P2 = "Primary 2"
    P3 = "Primary 3"
    P4 = "Primary 4"
    P5 = "Primary 5"
    P6 = "Primary 6"


class DifficultyLevel(str, Enum):
    """Problem difficulty classification."""

    BASIC = "basic"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    CHALLENGING = "challenging"  # PSLE-level problems


class Concept(BaseModel):
    """A mathematical concept in the Singapore Math curriculum.

    Examples: Ratio, Fraction, Percentage, Algebra, Place Value
    """

    id: str = Field(..., description="Unique identifier for the concept")
    name: str = Field(..., description="Name of the concept (e.g., 'Ratio')")
    description: str = Field(..., description="Detailed explanation of the concept")
    grade_levels: list[GradeLevel] = Field(
        default_factory=list, description="Grade levels where this concept is taught"
    )
    cpa_stage: CPAStage = Field(
        default=CPAStage.ABSTRACT, description="Primary CPA stage for introducing this concept"
    )
    keywords: list[str] = Field(
        default_factory=list, description="Keywords associated with this concept"
    )
    prerequisites: list[str] = Field(
        default_factory=list, description="IDs of prerequisite concepts"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "id": "ratio-001",
                "name": "Ratio",
                "description": "A ratio shows the relative sizes of two or more values.",
                "grade_levels": ["Primary 5", "Primary 6"],
                "cpa_stage": "pictorial",
                "keywords": ["ratio", "proportion", "comparison"],
                "prerequisites": ["fraction-001", "multiplication-001"],
            }
        }


class Strategy(BaseModel):
    """A problem-solving strategy used in Singapore Math.

    The Singapore Math approach emphasizes visual and structured strategies
    like bar models (also known as tape diagrams or model method).
    """

    id: str = Field(..., description="Unique identifier for the strategy")
    name: str = Field(..., description="Name of the strategy (e.g., 'Bar Model')")
    description: str = Field(..., description="How to apply this strategy")
    cpa_stage: CPAStage = Field(..., description="Which CPA stage this strategy belongs to")
    applicable_concepts: list[str] = Field(
        default_factory=list, description="Concept IDs this strategy applies to"
    )
    visualization_url: Optional[str] = Field(
        default=None, description="URL to a visual example of this strategy"
    )
    steps: list[str] = Field(
        default_factory=list, description="Step-by-step instructions for applying the strategy"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "id": "bar-model-001",
                "name": "Bar Model (Part-Whole)",
                "description": "Draw rectangular bars to represent quantities and their relationships.",
                "cpa_stage": "pictorial",
                "applicable_concepts": ["fraction-001", "ratio-001", "percentage-001"],
                "steps": [
                    "Identify what the whole represents",
                    "Draw a bar to represent the whole",
                    "Divide the bar into parts based on the problem",
                    "Label each part with known values",
                    "Use the model to find unknown values",
                ],
            }
        }


class Problem(BaseModel):
    """A math problem extracted from curriculum materials."""

    id: str = Field(..., description="Unique identifier for the problem")
    source_file: str = Field(..., description="Original PDF/document source")
    question_text: str = Field(..., description="The problem statement")
    question_latex: Optional[str] = Field(
        default=None, description="LaTeX representation of mathematical expressions"
    )
    solution_text: Optional[str] = Field(default=None, description="Solution explanation")
    solution_latex: Optional[str] = Field(
        default=None, description="LaTeX representation of solution"
    )
    grade_level: GradeLevel = Field(..., description="Target grade level")
    difficulty: DifficultyLevel = Field(
        default=DifficultyLevel.BASIC, description="Difficulty classification"
    )
    concepts_tested: list[str] = Field(
        default_factory=list, description="Concept IDs this problem tests"
    )
    strategies_applicable: list[str] = Field(
        default_factory=list, description="Strategy IDs that can solve this problem"
    )
    image_urls: list[str] = Field(
        default_factory=list, description="URLs to diagrams/figures in the problem"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "id": "prob-ratio-001",
                "source_file": "P5_Ratio_Workbook.pdf",
                "question_text": "The ratio of boys to girls in a class is 3:5. If there are 24 students, how many boys are there?",
                "question_latex": r"\text{Boys}:\text{Girls} = 3:5",
                "grade_level": "Primary 5",
                "difficulty": "basic",
                "concepts_tested": ["ratio-001"],
                "strategies_applicable": ["bar-model-001"],
            }
        }


# --- Graph Relationship Models ---


class ConceptPrerequisite(BaseModel):
    """Relationship: A concept requires another concept as prerequisite."""

    source_concept_id: str
    target_concept_id: str
    strength: float = Field(
        default=1.0, ge=0.0, le=1.0, description="How strongly required (0-1)"
    )


class ProblemSolvedBy(BaseModel):
    """Relationship: A problem can be solved by a strategy."""

    problem_id: str
    strategy_id: str
    effectiveness: float = Field(
        default=1.0, ge=0.0, le=1.0, description="How effective this strategy is (0-1)"
    )


class ConceptTestedBy(BaseModel):
    """Relationship: A problem tests a concept."""

    problem_id: str
    concept_id: str
    coverage: float = Field(
        default=1.0, ge=0.0, le=1.0, description="How thoroughly the concept is tested (0-1)"
    )


# --- Extraction Output Models ---


class ExtractedEntities(BaseModel):
    """Container for all entities extracted from a document."""

    concepts: list[Concept] = Field(default_factory=list)
    strategies: list[Strategy] = Field(default_factory=list)
    problems: list[Problem] = Field(default_factory=list)


class ExtractionResult(BaseModel):
    """Result of processing a single document."""

    source_file: str
    success: bool
    entities: Optional[ExtractedEntities] = None
    error_message: Optional[str] = None
    processing_time_seconds: float = 0.0
