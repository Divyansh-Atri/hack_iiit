"""
Configuration for automatic recording and processing
"""

import os
from typing import Optional

class Config:
    """Configuration for automatic recording and processing"""
    
    # Auto-recording settings
    AUTO_RECORDING_ENABLED = os.getenv("AUTO_RECORDING_ENABLED", "true").lower() == "true"
    DEFAULT_CLASS_ID = os.getenv("DEFAULT_CLASS_ID", None)
    if DEFAULT_CLASS_ID:
        print(f"DEBUG: DEFAULT_CLASS_ID='{DEFAULT_CLASS_ID}' repr={repr(DEFAULT_CLASS_ID)}")
    BACKEND_API_URL = os.getenv("BACKEND_API_URL", "http://localhost:3001")
    
    # Processing settings
    PROCESS_INTERVAL_MINUTES = int(os.getenv("PROCESS_INTERVAL_MINUTES", "10"))  # Process every 10 minutes
    ENABLE_REAL_TIME_PROCESSING = os.getenv("ENABLE_REAL_TIME_PROCESSING", "false").lower() == "true"
    
    @classmethod
    def get_class_id(cls) -> Optional[str]:
        """Get default class ID for auto-recording"""
        return cls.DEFAULT_CLASS_ID
