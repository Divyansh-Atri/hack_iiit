## Project Summary
iiit-classlog is a responsive academic web platform designed for storing and reviewing past courses and class sessions. It serves as a static archive for students and faculty to access transcripts, summaries, and key discussion points from previous sessions. The platform focuses on accessibility, readability, and a distraction-free academic environment.

## Tech Stack
- Framework: Next.js (React.js)
- Styling: Tailwind CSS
- Icons: Lucide React
- Language: TypeScript

## Architecture
- `src/app/page.tsx`: Main entry point managing application state (course selection, session detail view, search, and font size).
- `src/components/`: Modular UI components:
  - `Navbar`: Top navigation with global search and font size controls.
  - `CourseSidebar`: Persistent left panel for course selection.
  - `SessionList`: Searchable list of class sessions for the selected course or global results.
  - `SessionDetail`: Two-column view displaying session transcripts and auto-generated summaries.
- `src/lib/data.ts`: Centralized types and mock data for courses and sessions.

## User Preferences
- Theme: Strict, simplified dark theme (near-black background).
- Color Scheme:
  - Background: near-black / very dark gray
  - Primary text: white / light gray
  - Secondary text: muted gray
  - Single Accent: #EA2264 (Headings, selections, active states)
  - Warning/System: #F78D60 (Errors/warnings only)
- Typography: Focus on legibility with adjustable font sizes (12px to 24px).

## Project Guidelines
- No user/account-related UI (Login, Profile, Settings, Gear icons).
- No gradients or multi-color accents.
- Minimize visual noise and animations.
- Preserve hierarchy in search results (Course → Class → Detail).
- Read-only academic archive; no individual user state.

## Common Patterns
- State Management: React `useState` and `useMemo` for filtering and selection.
- Responsive Design: Sidebar toggle for mobile devices, grid-based layouts for desktop reading.
