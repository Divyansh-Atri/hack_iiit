#!/bin/bash
# Quick fix for Python 3.13 compatibility - recreates venv with system-site-packages

echo "Fixing Python 3.13 compatibility..."
echo ""

# Check if system scipy is available
if ! python3 -c "import scipy" 2>/dev/null; then
    echo "ERROR: System scipy not found. Please install:"
    echo "  sudo dnf install python3-scipy"
    exit 1
fi

SCIPY_VERSION=$(python3 -c "import scipy; print(scipy.__version__)" 2>/dev/null)
echo "System scipy found: $SCIPY_VERSION"
echo ""

# Remove old venv
if [ -d "venv" ]; then
    echo "Removing old virtual environment..."
    rm -rf venv
fi

# Create new venv with system-site-packages
echo "Creating new virtual environment with system-site-packages..."
python3 -m venv --system-site-packages venv

# Activate and verify
source venv/bin/activate
echo "Virtual environment created and activated"
echo ""

# Verify scipy is accessible
if python3 -c "import scipy" 2>/dev/null; then
    echo "✓ scipy is accessible in venv: $(python3 -c 'import scipy; print(scipy.__version__)')"
else
    echo "✗ scipy not accessible in venv"
    exit 1
fi

echo ""
echo "Now run: ./install_and_run.sh"
echo "The script will install all packages except scipy (using system scipy)"
