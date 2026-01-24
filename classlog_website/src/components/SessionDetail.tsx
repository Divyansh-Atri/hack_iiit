"use client";

import { ClassSession } from "@/lib/data";
import { ArrowLeft, MessageSquare, ListChecks, HelpCircle, FileText, ChevronRight } from "lucide-react";

interface SessionDetailProps {
  session: ClassSession;
  onBack: () => void;
  fontSize: number;
}

export default function SessionDetail({ session, onBack, fontSize }: SessionDetailProps) {
  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0a0c]" style={{ fontSize: `${fontSize}px` }}>
      {/* Header */}
      <header className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#0a0a0c]/80 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-6">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-[#a0a0b0] hover:text-[#EA2264] transition-all group"
          >
            <div className="p-1 rounded bg-white/5 group-hover:bg-[#EA2264]/10 transition-colors">
              <ArrowLeft size={18} />
            </div>
            <span className="text-sm font-bold uppercase tracking-wider hidden sm:inline">Back</span>
          </button>
          
          <div className="h-6 w-[1px] bg-white/10 hidden sm:block"></div>
          
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">{session.date}</h2>
            <div className="flex items-center gap-3 mt-0.5 text-[10px] font-bold text-[#EA2264] uppercase tracking-widest">
              <span>{session.duration}</span>
              <span className="w-1 h-1 bg-white/10 rounded-full"></span>
              <span className="text-[#a0a0b0] lowercase font-medium normal-case tracking-normal truncate max-w-[200px] md:max-w-md">
                {session.summary}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 rounded bg-white/5 border border-white/10 text-[10px] font-bold text-white uppercase tracking-wider hover:bg-[#EA2264]/10 hover:border-[#EA2264]/30 transition-colors">
            Export PDF
          </button>
        </div>
      </header>

      {/* Main Content - Two Panel Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* Left Panel - Transcript */}
        <section className="flex-1 overflow-y-auto academic-scrollbar border-r border-white/10 bg-[#0a0a0c]">
          <div className="max-w-3xl mx-auto p-6 md:p-8 lg:p-12">
            <div className="flex items-center gap-3 mb-10 pb-4 border-b border-white/5">
              <div className="p-2 bg-[#EA2264] rounded text-white shadow-[0_0_10px_rgba(234,34,100,0.3)]">
                <MessageSquare size={18} />
              </div>
              <h3 className="text-xs font-bold text-[#EA2264] uppercase tracking-[0.2em]">Full Transcript</h3>
            </div>
            
            <div className="space-y-10">
              {session.transcript.length > 0 ? (
                session.transcript.map((entry, idx) => (
                  <div key={idx} className="group relative">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 bg-[#EA2264] rounded-full"></div>
                        <span className="font-bold text-[#EA2264] text-sm uppercase tracking-wider">
                          {entry.speaker}
                        </span>
                      </div>
                      <button className="text-[10px] font-mono text-[#a0a0b0] hover:text-[#EA2264] px-2 py-0.5 bg-white/5 rounded transition-all">
                        [{entry.timestamp}]
                      </button>
                    </div>
                    <div className="pl-4.5 border-l border-white/5 group-hover:border-[#EA2264]/30 transition-colors">
                      <p className="text-[#e0e0e0] leading-relaxed font-normal opacity-90 group-hover:opacity-100 transition-opacity">
                        {entry.text}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="panel-card p-12 text-center">
                  <p className="text-[#a0a0b0] italic font-medium border-white/5">No transcript data archived for this session.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Right Panel - Summary & Insights */}
        <section className="w-full md:w-[350px] lg:w-[450px] overflow-y-auto academic-scrollbar bg-[#0a0a0c] border-l border-white/10">
          <div className="p-6 md:p-8 space-y-10">
            
            {/* Detailed Summary Card */}
            <div className="panel-card p-6 bg-[#15151a] border-white/5">
              <div className="flex items-center gap-3 mb-6">
                <FileText size={18} className="text-[#EA2264]" />
                <h3 className="text-xs font-bold text-white uppercase tracking-widest">Detailed Summary</h3>
              </div>
              <p className="text-sm text-[#a0a0b0] leading-relaxed mb-6">
                {session.fullSummary}
              </p>
              
              <div className="space-y-4">
                <div className="text-[10px] font-bold text-[#EA2264] uppercase tracking-widest border-b border-white/5 pb-2">
                  Key Takeaways
                </div>
                <ul className="space-y-3">
                  {session.keyPoints.map((point, idx) => (
                    <li key={idx} className="flex gap-3 text-xs text-white/90 leading-snug group">
                      <ChevronRight size={14} className="text-[#EA2264] mt-0.5 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Questions & Answers */}
            {session.questions.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 px-2">
                  <HelpCircle size={18} className="text-[#EA2264]" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-widest">Critical Questions</h3>
                </div>
                
                <div className="space-y-4">
                  {session.questions.map((q, idx) => (
                    <div key={idx} className="panel-card p-5 bg-[#15151a] group border-white/5 hover:border-[#EA2264]/30 transition-all">
                      <p className="font-bold text-white text-xs mb-3 leading-tight group-hover:text-[#EA2264] transition-colors">
                        {q.question}
                      </p>
                      <div className="flex gap-3">
                        <div className="w-[2px] bg-[#EA2264]/30 group-hover:bg-[#EA2264] transition-colors shrink-0"></div>
                        <p className="text-xs text-[#a0a0b0] italic leading-relaxed">
                          {q.answer}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Meta Info */}
            <div className="pt-8 mt-8 border-t border-white/10 flex flex-col gap-4">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                <span className="text-[#a0a0b0]">Archive ID</span>
                <span className="text-white">{session.id.toUpperCase()}</span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                <span className="text-[#a0a0b0]">Last Reviewed</span>
                <span className="text-white">JAN 24, 2026</span>
              </div>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
}
