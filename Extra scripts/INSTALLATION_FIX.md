# Installation Fix: Build Dependencies

## Issue

The installation script was failing because `scipy` requires a Fortran compiler (gfortran) to build from source. The error message indicated:

```
ERROR: Unknown compiler(s): [['gfortran'], ...]
```

## Solution

The installation script has been updated to automatically check for and install required build dependencies before attempting to install Python packages.

## What Changed

The script now includes a `check_system_dependencies()` function that:

1. Checks for required build tools:
   - `gcc` (C compiler)
   - `g++` or `gcc-c++` (C++ compiler)
   - `gfortran` or `gcc-gfortran` (Fortran compiler for scipy)
   - `python3-devel` or `python3-dev` (Python development headers)

2. Automatically detects the package manager:
   - Fedora/RHEL: Uses `dnf` or `yum`
   - Debian/Ubuntu: Uses `apt-get`

3. Installs missing dependencies with appropriate package names for each distribution

## Running the Fixed Script

Simply run the installation script again:

```bash
./install_and_run.sh
```

The script will:
1. Check for build dependencies
2. Prompt for sudo password if dependencies are missing
3. Install required packages
4. Continue with Python package installation

## Manual Installation (If Needed)

If you prefer to install dependencies manually:

**Fedora/RHEL:**
```bash
sudo dnf install gcc gcc-c++ gcc-gfortran python3-devel
```

**Debian/Ubuntu:**
```bash
sudo apt-get install gcc g++ gfortran python3-dev
```

Then run the installation script:
```bash
./install_and_run.sh
```

## Verification

After installation, verify build tools are available:

```bash
gcc --version
g++ --version
gfortran --version
```

All should show version information if correctly installed.
