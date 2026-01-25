#!/bin/bash
# Setup script for Teams Speaker Recognition

set -e

echo "=========================================="
echo "Teams Speaker Recognition Setup"
echo "=========================================="
echo ""

# Check Python version
echo "Checking Python version..."
python_version=$(python3 --version 2>&1 | awk '{print $2}')
echo "Found Python: $python_version"

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Create data directories
echo "Creating data directories..."
mkdir -p backend/data/embeddings
mkdir -p backend/data/logs

# Check for PipeWire/PulseAudio
echo ""
echo "Checking audio system..."
if command -v pactl &> /dev/null; then
    echo "✓ PulseAudio/PipeWire tools found"
else
    echo "⚠ Warning: pactl not found. Install pulseaudio-utils or pipewire-pulse"
fi

# Check for pavucontrol
if command -v pavucontrol &> /dev/null; then
    echo "✓ pavucontrol found"
else
    echo "⚠ Warning: pavucontrol not found. Install it for easier audio routing:"
    echo "  sudo dnf install pavucontrol  # Fedora"
    echo "  sudo apt install pavucontrol  # Debian/Ubuntu"
fi

echo ""
echo "=========================================="
echo "Setup complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Activate virtual environment: source venv/bin/activate"
echo "2. Create virtual sink: pactl load-module module-null-sink sink_name=teams_speaker_capture"
echo "3. Start backend: cd backend && python main.py"
echo "4. Load extension in Brave/Chrome"
echo "5. Open enrollment UI: http://127.0.0.1:8000"
echo ""
echo "See README.md for detailed instructions."
