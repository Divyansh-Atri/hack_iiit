"use client";

import { Course } from "@/lib/data";
import { X, BookOpen, ChevronRight } from "lucide-react";

interface CourseSidebarProps {
  courses: Course[];
  selectedCourseId: string | null;
  onSelectCourse: (id: string | null) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function CourseSidebar({ courses, selectedCourseId, onSelectCourse, isOpen, onClose }: CourseSidebarProps) {
  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}
      
      <aside className={`fixed left-0 top-0 md:top-16 bottom-0 w-80 bg-[#0a0a0c] border-r border-white/10 overflow-y-auto z-50 transition-transform duration-300 academic-scrollbar ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-8 md:hidden">
              <h1 className="text-lg font-bold text-white tracking-tight">iiit-classlog</h1>
              <button onClick={onClose} className="p-2 text-[#a0a0b0]">
                <X size={20} />
              </button>
            </div>
            
              <div className="flex items-center justify-between mb-6 px-2">
                <h2 className="text-xs font-bold text-[#EA2264] uppercase tracking-widest">
                  Academic Courses
                </h2>
                <button 
                  onClick={() => onSelectCourse(null)}
                  className="text-[10px] font-bold text-[#a0a0b0] hover:text-[#EA2264] transition-colors uppercase tracking-tighter"
                >
                  Back to Catalog
                </button>
              </div>
              
              <div className="space-y-3">
                {courses.map((course) => (
                  <button 
                    key={course.id}
                    onClick={() => onSelectCourse(course.id)}
                    className={`w-full panel-card p-4 text-left group flex items-start gap-4 border-white/5 bg-[#15151a] ${
                      selectedCourseId === course.id ? "active ring-1 ring-[#EA2264]/30" : "hover:border-[#EA2264]/40"
                    }`}
                  >
                    <div className={`mt-1 transition-colors ${
                      selectedCourseId === course.id ? "text-[#EA2264]" : "text-[#a0a0b0] group-hover:text-[#EA2264]"
                    }`}>
                      <BookOpen size={20} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-sm font-bold mb-1 truncate transition-colors ${
                        selectedCourseId === course.id ? "text-white" : "text-[#e0e0e0] group-hover:text-white"
                      }`}>
                        {course.name}
                      </h3>
                      <div className="flex items-center gap-2 text-[10px] text-[#a0a0b0] font-bold uppercase tracking-tighter">
                        <span>{course.semester}</span>
                        <span className="w-1 h-1 bg-white/10 rounded-full"></span>
                        <span className="truncate">{course.instructor}</span>
                      </div>
                    </div>

                <ChevronRight 
                  size={16} 
                  className={`mt-1 transition-all ${
                    selectedCourseId === course.id 
                      ? "text-[#EA2264] opacity-100 translate-x-0" 
                      : "text-[#a0a0b0] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
                  }`} 
                />
              </button>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}
