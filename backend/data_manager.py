"""
Data management for students and embeddings
"""

import os
import json
import numpy as np
from datetime import datetime
from typing import Dict, Optional
import uuid

class DataManager:
    def __init__(self, data_dir="data"):
        self.data_dir = data_dir
        self.students_file = os.path.join(data_dir, "students.json")
        self.embeddings_dir = os.path.join(data_dir, "embeddings")
        self.logs_dir = os.path.join(data_dir, "logs")
        
        # Create directories
        os.makedirs(self.embeddings_dir, exist_ok=True)
        os.makedirs(self.logs_dir, exist_ok=True)
        
        # Load students
        self.students = self.load_students()
    
    def load_students(self) -> Dict:
        """Load students from JSON file"""
        if os.path.exists(self.students_file):
            try:
                with open(self.students_file, 'r') as f:
                    return json.load(f)
            except Exception as e:
                print(f"[DataManager] Error loading students: {e}")
                return {}
        return {}
    
    def save_students(self):
        """Save students to JSON file"""
        try:
            with open(self.students_file, 'w') as f:
                json.dump(self.students, f, indent=2)
        except Exception as e:
            print(f"[DataManager] Error saving students: {e}")
            raise
    
    def add_student(self, name: str, roll: Optional[str] = None) -> str:
        """
        Add a new student
        
        Returns:
            student_id
        """
        student_id = str(uuid.uuid4())
        self.students[student_id] = {
            "name": name,
            "roll": roll or "",
            "created_at": datetime.utcnow().isoformat() + "Z"
        }
        self.save_students()
        return student_id
    
    def update_student(self, student_id: str, name: Optional[str] = None, roll: Optional[str] = None):
        """Update student information"""
        if student_id not in self.students:
            raise ValueError(f"Student {student_id} not found")
        
        if name:
            self.students[student_id]["name"] = name
        if roll is not None:
            self.students[student_id]["roll"] = roll
        
        self.save_students()
    
    def delete_student(self, student_id: str):
        """Delete student and their embedding"""
        if student_id in self.students:
            del self.students[student_id]
            self.save_students()
        
        # Delete embedding file
        embedding_path = os.path.join(self.embeddings_dir, f"{student_id}.npy")
        if os.path.exists(embedding_path):
            os.remove(embedding_path)
    
    def save_embedding(self, student_id: str, embedding: np.ndarray):
        """Save embedding for a student"""
        if student_id not in self.students:
            raise ValueError(f"Student {student_id} not found")
        
        embedding_path = os.path.join(self.embeddings_dir, f"{student_id}.npy")
        np.save(embedding_path, embedding.astype(np.float32))
    
    def load_embedding(self, student_id: str) -> Optional[np.ndarray]:
        """Load embedding for a student"""
        embedding_path = os.path.join(self.embeddings_dir, f"{student_id}.npy")
        if os.path.exists(embedding_path):
            return np.load(embedding_path)
        return None
    
    def get_student(self, student_id: str) -> Optional[Dict]:
        """Get student information"""
        return self.students.get(student_id)
    
    def list_students(self) -> list:
        """List all students with their enrollment status"""
        result = []
        for student_id, student_data in self.students.items():
            has_embedding = os.path.exists(
                os.path.join(self.embeddings_dir, f"{student_id}.npy")
            )
            result.append({
                "id": student_id,
                "name": student_data["name"],
                "roll": student_data.get("roll", ""),
                "created_at": student_data.get("created_at", ""),
                "enrolled": has_embedding
            })
        return result
