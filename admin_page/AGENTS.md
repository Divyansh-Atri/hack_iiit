## Project Summary
A dark-themed, restricted admin interface for managing an academic archive platform. It allows authorized administrators to manage courses, register class sessions, and generate secure access codes for controlled content ingestion (transcripts/summaries).

## Tech Stack
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Supabase (Auth & Database)
- Lucide React (Icons)

## Architecture
- `src/app/iiit-admin-secret`: Admin-only restricted routes.
- `src/components/admin`: Specialized admin UI components and modals.
- `src/lib/supabase.ts`: Supabase client configuration.
- Two-panel layout: Persistent course navigation (left) and contextual management (right).

## User Preferences
- Theme: Dark-themed, serious, restrained.
- Palette: Sunset (#0D1164, #640D5F, #EA2264, #F78D60).
- Functional focus: Ingestion management and verification, not content authoring.

## Project Guidelines
- Admin routes must be non-discoverable.
- Explicit confirmation steps for actions.
- Keyboard-navigable forms.
- No decorative visuals or gradients.
- Used/Expired codes must be visually distinct.

## Common Patterns
- Monospaced font for access keys.
- Uppercase labels for administrative feel.
- Sparse but intentional use of accent colors for status and actions.
