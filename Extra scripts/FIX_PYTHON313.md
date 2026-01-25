# Fix for Python 3.13 Compatibility

## Issue

scipy 1.12.0 is incompatible with Python 3.13 due to NumPy 2.x API changes. The build fails with:
```
scipy/linalg/_decomp_update.pyx:1251:34: cimported module has no attribute 'NPY_F_CONTIGUOUS'
```

## Solution

The installation script has been updated to:

1. **Detect Python 3.13** and system scipy package
2. **Create venv with --system-site-packages** to access system scipy
3. **Skip scipy in requirements.txt** when using system scipy

## Quick Fix

Since you already have `python3-scipy` installed, simply:

1. **Delete the existing venv** (it was created without system-site-packages):
   ```bash
   rm -rf venv
   ```

2. **Run the installation script again**:
   ```bash
   ./install_and_run.sh
   ```

The script will:
- Detect Python 3.13
- Detect system scipy (1.16.3)
- Create venv with `--system-site-packages`
- Install all packages except scipy (using system scipy)

## Manual Alternative

If you prefer to fix manually:

```bash
# Remove old venv
rm -rf venv

# Create new venv with system-site-packages
python3 -m venv --system-site-packages venv

# Activate
source venv/bin/activate

# Install packages (scipy will be available from system)
pip install -r requirements.txt
```

But note: requirements.txt no longer includes scipy, so you'll need to install everything manually or let the script handle it.

## Verification

After installation, verify scipy is accessible:

```bash
source venv/bin/activate
python3 -c "import scipy; print('scipy version:', scipy.__version__)"
```

Should show: `scipy version: 1.16.3` (or similar)
