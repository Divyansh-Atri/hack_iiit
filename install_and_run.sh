#!/bin/bash
# Complete installation and startup script for Classroom Transcript System
# Sets up: Backend API, STT Worker, and Minimal Frontend
# Portable - works from any location

set -e

# Get script directory (works even if script is symlinked or run from different location)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check Node.js
check_nodejs() {
    print_info "Checking Node.js..."
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2)
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d. -f1)
    
    if [ "$NODE_MAJOR" -lt 18 ]; then
        print_error "Node.js 18+ required. Found: $NODE_VERSION"
        exit 1
    fi
    
    print_success "Node.js $NODE_VERSION found"
}

# Check Python
check_python() {
    print_info "Checking Python..."
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 is not installed. Please install Python 3.11+"
        exit 1
    fi
    
    PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
    PYTHON_MAJOR=$(echo $PYTHON_VERSION | cut -d. -f1)
    PYTHON_MINOR=$(echo $PYTHON_VERSION | cut -d. -f2)
    
    if [ "$PYTHON_MAJOR" -lt 3 ] || ([ "$PYTHON_MAJOR" -eq 3 ] && [ "$PYTHON_MINOR" -lt 11 ]); then
        print_error "Python 3.11+ required. Found: $PYTHON_VERSION"
        exit 1
    fi
    
    print_success "Python $PYTHON_VERSION found"
}

# Setup Backend API
setup_backend_api() {
    print_info "Setting up Backend API..."
    cd "$SCRIPT_DIR/backend-api"
    
    # Install dependencies
    if [ ! -d "node_modules" ]; then
        print_info "Installing Node.js dependencies (this may take a minute)..."
        npm install
        print_success "Backend API dependencies installed"
    else
        print_info "Backend API dependencies already installed"
    fi
    
    # Setup .env file
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            print_info "Creating .env from .env.example..."
            cp .env.example .env
            print_warning "Please review and update backend-api/.env with your configuration"
        else
            print_error ".env.example not found in backend-api/"
            exit 1
        fi
    else
        print_info ".env file already exists"
    fi
    
    cd "$SCRIPT_DIR"
}

# Setup STT Worker
setup_stt_worker() {
    print_info "Setting up STT Worker..."
    cd "$SCRIPT_DIR/stt-worker"
    
    # Create virtual environment
    if [ ! -d "venv" ]; then
        print_info "Creating Python virtual environment..."
        python3 -m venv venv
        print_success "Virtual environment created"
    else
        print_info "Virtual environment already exists"
    fi
    
    # Activate and install dependencies
    source venv/bin/activate
    
    print_info "Installing Python dependencies (this may take several minutes)..."
    pip install --upgrade pip --quiet
    pip install -r requirements.txt

# Patch SpeechBrain library
if [ -f "../scripts/patch_speechbrain.py" ]; then
    echo "Applying patches to SpeechBrain..."
    python ../scripts/patch_speechbrain.py
fi
    
    print_success "STT Worker dependencies installed"
    
    # Setup .env file
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            print_info "Creating .env from .env.example..."
            cp .env.example .env
            print_warning "Please review and update stt-worker/.env with your configuration"
        else
            print_error ".env.example not found in stt-worker/"
            exit 1
        fi
    else
        print_info ".env file already exists"
    fi
    
    deactivate
    cd "$SCRIPT_DIR"
}

# Setup Minimal Frontend
setup_frontend() {
    print_info "Setting up Minimal Frontend..."
    cd "$SCRIPT_DIR/minimal-frontend"
    
    # Install dependencies
    if [ ! -d "node_modules" ]; then
        print_info "Installing Next.js dependencies (this may take a minute)..."
        npm install
        print_success "Frontend dependencies installed"
    else
        print_info "Frontend dependencies already installed"
    fi
    
    # Setup .env.local file
    if [ ! -f ".env.local" ]; then
        if [ -f ".env.example" ]; then
            print_info "Creating .env.local from .env.example..."
            cp .env.example .env.local
            # Update API URL to use relative path or localhost
            if ! grep -q "NEXT_PUBLIC_API_URL" .env.local; then
                echo "NEXT_PUBLIC_API_URL=http://localhost:3001" >> .env.local
            fi
            print_success ".env.local created"
        else
            print_warning ".env.example not found, creating basic .env.local..."
            echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > .env.local
        fi
    else
        print_info ".env.local file already exists"
    fi
    
    cd "$SCRIPT_DIR"
}

# Start Backend API
start_backend_api() {
    print_info "Starting Backend API..."
    cd "$SCRIPT_DIR/backend-api"
    
    # Kill existing process on port 3001
    if lsof -ti:3001 &> /dev/null; then
        print_warning "Port 3001 is in use, killing existing process..."
        lsof -ti:3001 | xargs kill -9 2>/dev/null || true
        sleep 1
    fi
    
    # Start backend in background
    npm run dev > ../backend-api.log 2>&1 &
    BACKEND_API_PID=$!
    echo $BACKEND_API_PID > ../backend-api.pid
    
    # Wait for server to start
    print_info "Waiting for Backend API to start..."
    for i in {1..30}; do
        if curl -s http://localhost:3001/health &>/dev/null; then
            print_success "Backend API started (PID: $BACKEND_API_PID)"
            print_info "  API: http://localhost:3001"
            return 0
        fi
        sleep 1
    done
    
    print_error "Backend API failed to start. Check backend-api.log for errors."
    return 1
}

# Start Frontend
start_frontend() {
    print_info "Starting Frontend..."
    cd "$SCRIPT_DIR/minimal-frontend"
    
    # Kill existing process on port 3000
    if lsof -ti:3000 &> /dev/null; then
        print_warning "Port 3000 is in use, killing existing process..."
        lsof -ti:3000 | xargs kill -9 2>/dev/null || true
        sleep 1
    fi
    
    # Start frontend in background
    npm run dev > ../frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > ../frontend.pid
    
    # Wait for server to start
    print_info "Waiting for Frontend to start..."
    for i in {1..60}; do
        if curl -s http://localhost:3000 &>/dev/null; then
            print_success "Frontend started (PID: $FRONTEND_PID)"
            print_info "  Frontend: http://localhost:3000"
            return 0
        fi
        sleep 1
    done
    
    print_warning "Frontend may still be starting. Check frontend.log for status."
    return 0
}

# Create stop script
create_stop_script() {
    cat > "$SCRIPT_DIR/stop_all.sh" << 'STOPEOF'
#!/bin/bash
# Stop all services

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Stopping all services..."

# Stop Backend API
if [ -f "$SCRIPT_DIR/backend-api.pid" ]; then
    PID=$(cat "$SCRIPT_DIR/backend-api.pid")
    if kill -0 $PID 2>/dev/null; then
        echo "Stopping Backend API (PID: $PID)..."
        kill $PID
        rm "$SCRIPT_DIR/backend-api.pid"
        echo "Backend API stopped"
    else
        rm "$SCRIPT_DIR/backend-api.pid"
    fi
fi

# Stop Frontend
if [ -f "$SCRIPT_DIR/frontend.pid" ]; then
    PID=$(cat "$SCRIPT_DIR/frontend.pid")
    if kill -0 $PID 2>/dev/null; then
        echo "Stopping Frontend (PID: $PID)..."
        kill $PID
        rm "$SCRIPT_DIR/frontend.pid"
        echo "Frontend stopped"
    else
        rm "$SCRIPT_DIR/frontend.pid"
    fi
fi

# Stop Auto-Processor
if [ -f "$SCRIPT_DIR/auto-processor.pid" ]; then
    PID=$(cat "$SCRIPT_DIR/auto-processor.pid")
    if kill -0 $PID 2>/dev/null; then
        echo "Stopping Auto-Processor (PID: $PID)..."
        kill $PID
        rm "$SCRIPT_DIR/auto-processor.pid"
        echo "Auto-Processor stopped"
    else
        rm "$SCRIPT_DIR/auto-processor.pid"
    fi
fi

# Kill by port as fallback
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

echo "All services stopped"
STOPEOF
    chmod +x "$SCRIPT_DIR/stop_all.sh"
    print_success "Created stop_all.sh script"
}

# Create helper scripts
create_helper_scripts() {
    print_info "Creating helper scripts..."
    
    # Update process_session.sh to use relative paths
    cat > "$SCRIPT_DIR/scripts/process_session.sh" << 'PROCESSEOF'
#!/bin/bash
# Helper script to process a session after audio upload

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SESSION_ID=$1

if [ -z "$SESSION_ID" ]; then
    echo "Usage: $0 <session_id>"
    echo ""
    echo "Example:"
    echo "  $0 abc123xyz"
    exit 1
fi

echo "Processing session: $SESSION_ID"
echo ""

# Navigate to STT worker directory
cd "$SCRIPT_DIR/stt-worker"

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
else
    echo "Error: Virtual environment not found. Run ./install_and_run.sh first."
    exit 1
fi

# Run processing
python process_audio.py "$SESSION_ID"

echo ""
echo "Processing complete!"
echo "Check the session at: http://localhost:3000/s/$SESSION_ID"
PROCESSEOF
    chmod +x "$SCRIPT_DIR/scripts/process_session.sh"
    
    # Update upload_audio.sh to use relative paths
    cat > "$SCRIPT_DIR/scripts/upload_audio.sh" << 'UPLOADEOF'
#!/bin/bash
# Helper script to upload audio to a session

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SESSION_ID=$1
AUDIO_FILE=$2

if [ -z "$SESSION_ID" ] || [ -z "$AUDIO_FILE" ]; then
    echo "Usage: $0 <session_id> <audio_file>"
    echo ""
    echo "Example:"
    echo "  $0 abc123xyz /path/to/audio.wav"
    exit 1
fi

if [ ! -f "$AUDIO_FILE" ]; then
    echo "Error: Audio file not found: $AUDIO_FILE"
    exit 1
fi

API_URL=${NEXT_PUBLIC_API_URL:-http://localhost:3001}

echo "Uploading audio to session: $SESSION_ID"
echo "File: $AUDIO_FILE"
echo ""

curl -X POST "$API_URL/api/upload/$SESSION_ID/audio" \
    -F "audio=@$AUDIO_FILE;type=audio/wav"

echo ""
echo "Upload complete!"
echo "Now run: $SCRIPT_DIR/scripts/process_session.sh $SESSION_ID"
UPLOADEOF
    chmod +x "$SCRIPT_DIR/scripts/upload_audio.sh"
    
    print_success "Helper scripts created"
}

# Start Auto-Processor (STT worker watcher)
start_auto_processor() {
    print_info "Starting automatic STT processor..."
    cd "$SCRIPT_DIR/stt-worker"
    
    if [ ! -d "venv" ]; then
        print_warning "STT worker venv not found. Run setup first."
        return
    fi
    
    source venv/bin/activate
    
    # Start auto-processor in background
    python auto_processor.py > ../auto-processor.log 2>&1 &
    AUTO_PROCESSOR_PID=$!
    echo $AUTO_PROCESSOR_PID > ../auto-processor.pid
    
    print_success "Auto-processor started (PID: $AUTO_PROCESSOR_PID)"
    print_info "  Watches for new sessions and processes them automatically"
    print_info "  Logs: tail -f $SCRIPT_DIR/auto-processor.log"
    
    cd "$SCRIPT_DIR"
}

# Print final instructions
print_final_instructions() {
    echo ""
    echo "=========================================="
    print_success "Installation and startup complete!"
    echo "=========================================="
    echo ""
    echo "Services running:"
    echo "  - Backend API: http://localhost:3001"
    echo "  - Frontend: http://localhost:3000"
    echo "  - Auto-Processor: Watching for new sessions (background)"
    echo ""
    echo "Logs:"
    echo "  - Backend API: tail -f $SCRIPT_DIR/backend-api.log"
    echo "  - Frontend: tail -f $SCRIPT_DIR/frontend.log"
    echo "  - Auto-Processor: tail -f $SCRIPT_DIR/auto-processor.log"
    echo ""
    echo "Next steps:"
    echo "1. Open http://localhost:3000 in your browser"
    echo "2. Go to Admin Dashboard to create classes and sessions"
    echo "3. Upload audio files and process them with STT worker"
    echo ""
    echo "Helper scripts:"
    echo "  - Stop all: ./stop_all.sh"
    echo "  - Upload audio: ./scripts/upload_audio.sh <session_id> <audio_file>"
    echo "  - Process session: ./scripts/process_session.sh <session_id>"
    echo ""
    echo "To stop all services: ./stop_all.sh"
    echo "Or press Ctrl+C (services will continue running in background)"
    echo ""
}

# Cleanup function
cleanup() {
    print_info "Cleaning up..."
    # Don't kill processes on Ctrl+C - let them run in background
    # User can use stop_all.sh to stop them
}

# Trap signals
trap cleanup EXIT INT TERM

# Main execution
main() {
    echo "=========================================="
    echo "Classroom Transcript System - Auto Setup"
    echo "=========================================="
    echo ""
    echo "Project directory: $SCRIPT_DIR"
    echo ""
    
    check_nodejs
    check_python
    
    setup_backend_api
    setup_stt_worker
    setup_frontend
    
    start_backend_api
    start_frontend
    start_auto_processor
    
    create_stop_script
    create_helper_scripts
    
    print_final_instructions
    
    # Keep script running (services run in background)
    print_info "Services are running in the background."
    print_info "Press Ctrl+C to exit (services will continue running)."
    print_info "Use ./stop_all.sh to stop all services."
    echo ""
    
    # Wait for user interrupt
    wait
}

# Run main
main
