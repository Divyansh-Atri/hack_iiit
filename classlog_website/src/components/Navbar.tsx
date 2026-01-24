"use client";

import { Search, Menu, GraduationCap } from "lucide-react";

interface NavbarProps {
  onSearch: (query: string) => void;
  fontSize: number;
  setFontSize: (size: number) => void;
  toggleSidebar: () => void;
  onHome?: () => void;
}

export default function Navbar({ onSearch, fontSize, setFontSize, toggleSidebar, onHome }: NavbarProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-[#0a0a0c] border-b border-white/10 z-50 flex items-center px-4 md:px-6 justify-between">
      <div className="flex items-center gap-2 md:gap-4">
        <button 
          onClick={toggleSidebar}
          className="p-2 hover:bg-[#EA2264]/10 rounded-md text-[#a0a0b0] hover:text-[#EA2264] transition-colors"
        >
          <span className="sr-only">Toggle Sidebar</span>
          <Menu size={20} />
        </button>
        <button 
          onClick={onHome}
          className="flex items-center gap-3 group hover:opacity-90 transition-opacity"
        >
          <div className="p-1.5 bg-[#EA2264] rounded text-white flex items-center justify-center shadow-[0_0_10px_rgba(234,34,100,0.3)]">
            <GraduationCap size={20} />
          </div>
          <h1 className="text-lg md:text-xl font-bold text-white tracking-tight">iiit-classlog</h1>
        </button>
      </div>

      <div className="flex-1 max-w-2xl mx-6 md:mx-12 relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a0a0b0]">
          <Search size={18} />
        </div>
        <input
          type="text"
          placeholder="Search courses, classes, speakers, or topics"
          className="w-full bg-[#15151a] border border-white/10 rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-1 focus:ring-[#EA2264] text-sm text-white placeholder:text-[#a0a0b0] transition-all"
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-4 md:gap-6 text-white">
        <div className="flex items-center gap-2 border border-white/10 rounded-lg px-2 py-1 bg-[#15151a]">
          <button 
            onClick={() => setFontSize(Math.max(12, fontSize - 2))}
            className="hover:bg-[#EA2264]/20 px-2 py-0.5 rounded text-xs font-bold transition-colors text-[#a0a0b0] hover:text-[#EA2264]"
            title="Decrease font size"
          >
            A-
          </button>
          <div className="w-[1px] h-3 bg-white/10"></div>
          <span className="text-xs font-bold text-[#EA2264] min-w-[28px] text-center">{fontSize}px</span>
          <div className="w-[1px] h-3 bg-white/10"></div>
          <button 
            onClick={() => setFontSize(Math.min(24, fontSize + 2))}
            className="hover:bg-[#EA2264]/20 px-2 py-0.5 rounded text-xs font-bold transition-colors text-[#a0a0b0] hover:text-[#EA2264]"
            title="Increase font size"
          >
            A+
          </button>
        </div>
      </div>
    </nav>
  );
}
