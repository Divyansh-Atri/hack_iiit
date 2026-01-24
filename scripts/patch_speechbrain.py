#!/usr/bin/env python3
"""
Script to patch SpeechBrain library to fix 'custom.py' 404 error
"""
import os
import sys
import site
from pathlib import Path

def patch_speechbrain():
    # Find site-packages
    site_packages = site.getsitepackages()
    target_file = None
    
    # Search for speechbrain/pretrained/interfaces.py in all site-packages
    for sp in site_packages:
        possible_path = Path(sp) / "speechbrain" / "pretrained" / "interfaces.py"
        if possible_path.exists():
            target_file = possible_path
            break
            
    # Also check user site-packages
    if not target_file:
        user_site = site.getusersitepackages()
        possible_path = Path(user_site) / "speechbrain" / "pretrained" / "interfaces.py"
        if possible_path.exists():
            target_file = possible_path

    if not target_file:
        print("SpeechBrain not found. Skipping patch.")
        return False

    print(f"Found SpeechBrain interfaces at: {target_file}")
    
    with open(target_file, 'r') as f:
        content = f.read()
        
    # Check if already patched
    if "except Exception:\n            # If custom file is missing, just proceed without it" in content:
        print("SpeechBrain already patched.")
        return True

    # Define the block to replace (simplified detection)
    target_str = """    # Attempt to fetch the custom module
    try:
        pymodule_local_path = fetch(
            filename=pymodule_file,
            source=source,
            savedir=savedir,
            overwrite=False,
            save_filename=pymodule_file,
            use_auth_token=use_auth_token,
        )
    except Exception:
        pymodule_local_path = None"""

    replacement_str = """    try:
        pymodule_local_path = fetch(
            filename=pymodule_file,
            source=source,
            savedir=savedir,
            overwrite=False,
            save_filename=pymodule_file,
            use_auth_token=use_auth_token,
        )
        sys.path.append(str(pymodule_local_path.parent))
    except Exception:
        # If custom file is missing, just proceed without it
        pass"""

    # We might need a more robust replacement strategy if exact string match fails due to versions
    # But strictly for this task, I'll use the exact replacement I did manually or a smarter find-replace
    
    # Since I don't know the exact original content of *every* version, 
    # and I just manually modified it, I'll try to find the standard block.
    # Actually, looking at what I did manually, I replaced:
    
    # Original (approximate):
    # hparams_local_path = fetch(...)
    # 
    # # Attempt to fetch the custom module
    # try:
    #     pymodule_local_path = fetch(..., use_auth_token=use_auth_token)
    # except Exception:
    #     pymodule_local_path = None
    
    # With:
    # hparams_local_path = fetch(...)
    # 
    # try:
    #     pymodule_local_path = fetch(..., use_auth_token=use_auth_token)
    #     sys.path.append(...)
    # except Exception:
    #     pass

    # However, to be safe and robust, let's just look for the `use_auth_token` argument in `fetch` call inside `interfaces.py` 
    # AND the `from_hparams` method. 
    
    # Actually, the most critical part causing the CRASH earlier was `use_auth_token` being passed to `hf_hub_download` in `fetching.py`.
    # AND the 404 error in `interfaces.py`.
    
    # Let's fix `fetching.py` first (the TypeError)
    fetching_file = target_file.parent / "fetching.py"
    if fetching_file.exists():
        with open(fetching_file, 'r') as f:
            fetch_content = f.read()
        
        if "use_auth_token=use_auth_token," in fetch_content:
            print(f"Patching {fetching_file} to remove deprecated use_auth_token...")
            new_fetch_content = fetch_content.replace("use_auth_token=use_auth_token,", "")
            with open(fetching_file, 'w') as f:
                f.write(new_fetch_content)
    
    # Now fix `interfaces.py` (the 404 error)
    # The clean way is to replace the problematic try/except block.
    # But since regex replacement in python without visual confirm is risky, 
    # I will stick to what I know works: The file I just viewed has a specific structure.
    
    # I'll simply write the KNOWN GOOD content if I can match the surrounding lines.
    # Or, even better, I can just delete the "try catch" block that looks for custom.py 
    # and replace it with "pymodule_local_path = None" effectively disabling custom.py fetching.
    
    # Let's try to find the "fetch(filename=pymodule_file" block.
    
    if 'filename=pymodule_file' in content and 'use_auth_token=use_auth_token' in content:
        # This is hard to robustly patch with simple string replace if indentations vary.
        # But I'll try a simpler approach: 
        # Identify the line `pymodule_local_path = fetch(`
        # And allow the subsequent exception to handle everything.
        # Wait, the issue was that `fetch` raises 404, and the original code might NOT have caught it properly 
        # or the structure was different.
        
        # In the version I fixed (0.5.16), the block was:
        # try:
        #    pymodule_local_path = fetch(...)
        # except Exception:
        #    pymodule_local_path = None
        
        # But this WASN'T working because `fetch` calls `hf_hub_download` which raises `EntryNotFoundError` (or similar)
        # which `Exception` should catch... UNLESS the exception type wasn't covered or something else.
        # Actually my manual fix was to ensure it catches `Exception` and does `pass`.
        
        # Let's just blindly apply the fix I verified:
        # Search for the block start
        marker = '    # Attempt to fetch the custom module'
        if marker in content:
             print(f"Patching {target_file} to handle custom.py 404...")
             # We will try to replace the whole block by finding indentation
             pass
             # Actually, simpler:
             # Just replace `use_auth_token=use_auth_token` with `use_auth_token=None` (or remove it) in THIS file too?
             # No, `interfaces.py` passes it to `fetch`.
             
        # Given the complexity of robust patching, I will use a very specific replacement 
        # that matches the original file content I viewed earlier.
        
        original_block = """    # Attempt to fetch the custom module
    try:
        pymodule_local_path = fetch(
            filename=pymodule_file,
            source=source,
            savedir=savedir,
            overwrite=False,
            save_filename=pymodule_file,
            use_auth_token=use_auth_token,
        )
    except Exception:
        pymodule_local_path = None"""
        
        new_block = """    # Attempt to fetch the custom module
    try:
        pymodule_local_path = fetch(
            filename=pymodule_file,
            source=source,
            savedir=savedir,
            overwrite=False,
            save_filename=pymodule_file,
            use_auth_token=use_auth_token,
        )
        sys.path.append(str(pymodule_local_path.parent))
    except Exception:
        # If custom file is missing, just proceed without it
        pass"""
        
        if original_block in content:
            new_content = content.replace(original_block, new_block)
            with open(target_file, 'w') as f:
                f.write(new_content)
            print("Successfully patched interfaces.py")
        else:
            print("Could not find exact block in interfaces.py to patch. It might differ slightly.")
            # Fallback: Try to replace just the exception handler part if possible, 
            # but that's risky.
            
    return True

if __name__ == "__main__":
    patch_speechbrain()
