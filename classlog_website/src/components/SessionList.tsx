"use client";

import { ClassSession, Course } from "@/lib/data";
import { ChevronRight, Clock, Calendar } from "lucide-react";

interface SessionListProps {
  sessions: ClassSession[];
  onSelectSession: (session: ClassSession) => void;
  selectedSessionId: string | null;
  courses: Course[];
  isSearching: boolean;
  currentCourse?: Course;
}

export default function SessionList({ sessions, onSelectSession, selectedSessionId, courses, isSearching, currentCourse }: SessionListProps) {
  return (
    <div className="flex-1 overflow-y-auto academic-scrollbar p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        {currentCourse && (
          <header className="mb-10">
            <h2 className="text-3xl font-bold text-white mb-2">{currentCourse.name}</h2>
            <p className="text-[#a0a0b0] text-sm">
              Instructor: <span className="text-white">{currentCourse.instructor}</span> • {currentCourse.semester}
            </p>
          </header>
        )}

          <h3 className="text-xs font-bold text-[#EA2264] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
            {isSearching ? "Search Results" : "Class Sessions"}
            <span className="h-[1px] flex-1 bg-white/10"></span>
          </h3>

          <div className="space-y-1">
            {sessions.length === 0 ? (
              <div className="panel-card p-10 text-center text-[#a0a0b0] italic border-white/5">
                No sessions found matching your criteria.
              </div>
            ) : (
              sessions.map((session) => {
                const course = courses.find(c => c.id === session.courseId);
                const isActive = selectedSessionId === session.id;
                
                return (
                  <button
                    key={session.id}
                    onClick={() => onSelectSession(session)}
                    className={`w-full text-left p-5 transition-all duration-200 group flex items-center justify-between border-b border-white/5 hover:bg-[#EA2264]/5 ${
                      isActive ? "bg-[#EA2264]/5 border-[#EA2264]/30" : ""
                    }`}
                  >
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-4 mb-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#EA2264] uppercase tracking-wider">
                          <Calendar size={14} />
                          {session.date}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-[#a0a0b0] font-medium uppercase tracking-tight">
                          <Clock size={14} className="text-[#a0a0b0]" />
                          {session.duration}
                        </div>
                        {isSearching && course && !currentCourse && (
                          <div className="text-[9px] px-2 py-0.5 bg-[#EA2264]/10 text-[#EA2264] border border-[#EA2264]/30 rounded font-bold uppercase tracking-tighter">
                            {course.name}
                          </div>
                        )}
                      </div>
                    <p className={`text-sm leading-relaxed transition-colors truncate ${
                      isActive ? "text-white" : "text-[#a0a0b0] group-hover:text-white"
                    }`}>
                      {session.summary}
                    </p>
                  </div>
                  <ChevronRight 
                    size={20}
                    className={`transition-all duration-300 ${
                      isActive 
                        ? "text-[#EA2264] translate-x-1 opacity-100" 
                        : "text-[#a0a0b0] group-hover:text-[#EA2264] group-hover:translate-x-1 opacity-40 group-hover:opacity-100"
                    }`} 
                  />
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
