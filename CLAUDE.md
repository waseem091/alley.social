# alley.social — Claude Code Instructions

## What this is
A Next.js 14 social app built for the DeveloperWeek NY Hackathon 2026.
Core feature: temporary blocking with a locked timer. Everything else is scaffolding.
Read alley-social.md for full product context before making any decisions.

## Rules — never break these
- Do not create files that are not explicitly requested
- Do not refactor files you were not asked to touch
- Do not add dependencies without asking first
- Do not add comments unless the logic is genuinely non-obvious
- Do not create abstraction layers, hooks, or utilities speculatively
- One task per response. If a task requires touching more than 2 files, stop and ask.

## Stack
- Next.js 14, App Router, TypeScript strict mode
- Supabase (direct client calls — no API route layer)
- Tailwind CSS 3, Geist Sans + Geist Mono
- lucide-react, date-fns, clsx + tailwind-merge

## Design constraints
- Black background (#0a0a0a), white text. No grays except #888 (dim) and #444 (muted)
- Border radius: 12px small, 16px cards/buttons, 30px full pills
- Countdown timers: font-mono only, never font-sans
- "Step away" not "Block". "Alley/Alleys" not "Block/Blocks" in UI copy.
- No animations beyond what's in globals.css already

## File structure is locked
Do not add files outside the existing structure without explicit instruction.

## Product decisions — locked
- Block timer is final. No early cancellation. No override.
- When a block expires, the user must re-enter their password before
  reconnecting. This is a consent gate — not a login, not a new session.
  It confirms the reconnection is deliberate. Modeled on GitHub's repo
  deletion pattern. The password is the signature.
- "Step away again" is always offered as an alternative to reconnecting.
- Reconnect = password verified → navigate to /[username]
- Step away again = navigate to /block/[username]