#!/bin/bash
# Setup script for kg-pipeline service
# Creates venv, installs poetry, and installs dependencies

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SERVICE_DIR="$PROJECT_ROOT/services/kg-pipeline"
VENV_DIR="$PROJECT_ROOT/.venv"  # Root level for easy access

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

info() { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# Find suitable Python version (3.10+)
find_python() {
    for py in python3.12 python3.11 python3.10 python3; do
        if command -v "$py" &> /dev/null; then
            version=$("$py" -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
            major=$(echo "$version" | cut -d. -f1)
            minor=$(echo "$version" | cut -d. -f2)
            if [ "$major" -eq 3 ] && [ "$minor" -ge 10 ] && [ "$minor" -lt 14 ]; then
                echo "$py"
                return 0
            fi
        fi
    done
    return 1
}

echo ""
echo "=========================================="
echo "  Singapore Math KG Pipeline Setup"
echo "=========================================="
echo ""

# Step 1: Find Python
info "Finding Python 3.10-3.13..."
PYTHON=$(find_python) || error "Python 3.10-3.13 not found. Please install it first:
  brew install python@3.12"

PYTHON_VERSION=$("$PYTHON" --version)
success "Found: $PYTHON_VERSION ($PYTHON)"

# Step 2: Create venv
if [ -d "$VENV_DIR" ]; then
    warn "Virtual environment already exists at $VENV_DIR"
    read -p "Recreate it? [y/N] " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        info "Removing old venv..."
        rm -rf "$VENV_DIR"
    else
        info "Keeping existing venv"
    fi
fi

if [ ! -d "$VENV_DIR" ]; then
    info "Creating virtual environment..."
    "$PYTHON" -m venv "$VENV_DIR"
    success "Created venv at $VENV_DIR"
fi

# Step 3: Activate and install pip/poetry
info "Activating venv and upgrading pip..."
source "$VENV_DIR/bin/activate"
pip install --upgrade pip -q

info "Installing poetry..."
pip install poetry -q
success "Poetry installed"

# Step 4: Install dependencies
info "Installing project dependencies..."
cd "$SERVICE_DIR"
poetry install

success "All dependencies installed!"

# Step 5: Create data directories
info "Creating data directories..."
mkdir -p "$SERVICE_DIR/data/inbox"
mkdir -p "$SERVICE_DIR/data/archive"
mkdir -p "$SERVICE_DIR/data/error"
success "Data directories ready"

# Step 6: Check .env
echo ""
if [ ! -f "$PROJECT_ROOT/.env" ]; then
    warn ".env file not found!"
    info "Creating from template..."
    cp "$PROJECT_ROOT/.env.example" "$PROJECT_ROOT/.env"
    warn "Please edit .env and add your OPENAI_API_KEY"
else
    success ".env file exists"
fi

# Print usage
echo ""
echo "=========================================="
echo -e "${GREEN}  Setup Complete!${NC}"
echo "=========================================="
echo ""
echo "Usage:"
echo ""
echo "  # Activate the virtual environment"
echo -e "  ${YELLOW}source .venv/bin/activate${NC}"
echo ""
echo "  # Or use make commands from project root:"
echo -e "  ${YELLOW}make kg-status${NC}      # Check pipeline status"
echo -e "  ${YELLOW}make kg-process${NC}     # Process PDFs in inbox"
echo -e "  ${YELLOW}make kg-query${NC}       # Query the knowledge graph"
echo ""
echo "  # Start Neo4j first:"
echo -e "  ${YELLOW}docker-compose up -d${NC}"
echo ""
echo "  # Add PDFs to process:"
echo -e "  ${YELLOW}cp your-file.pdf services/kg-pipeline/data/inbox/${NC}"
echo -e "  ${YELLOW}make kg-process${NC}"
echo ""
