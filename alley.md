# alley.social

## Elevator Pitch
"A social app that lets you step away from someone — temporarily, intentionally, irreversibly."

---

## Origin
Started as a personal observation — blocking someone on Instagram, then wanting to undo it a few hours later but feeling the awkwardness of immediately re-following. The question: *what if there was a middle ground between muting and hard-blocking?*

Muting is lying to yourself. You mute someone and five minutes later you're going to their profile manually. A temporary block is a commitment device — it removes the option entirely, for a defined window. Then it lifts automatically. No awkward unblock, no permanent decision made in a bad moment.

Our brains are like monkeys. The option being there means we'll use it. Removing it is the point.

---

## What It Does
alley.social lets you temporarily block someone for a set duration — hours, days, or weeks. The block is locked in for the full duration. No early exit. No override. When the timer expires, the block lifts automatically and the connection resumes on its own.

This is the only feature in social media that requires you to commit to your own decision.

---

## The Problem
Platforms are incentivized to maximize engagement, so they'll never prioritize a feature that reduces it. Temporary blocking reduces interaction by design. That's exactly why no major platform has built it — and exactly why it needs to exist.

**Why not mute?** Muting is passive. You can still check their profile, their stories, their DMs. A temporary block removes access entirely — for you and for them — for a fixed window.

**Why not restrict?** Restrict is one-directional theater. Their posts still appear in your feed. They can still DM you. Restrict manages their visibility to others, not your access to each other. It leaves the door cracked. A cracked door means you'll walk through it.

**Why not a hard block?** Hard blocks are permanent decisions made in bad moments. The awkwardness of immediately unblocking — and what that communicates — stops people from moving on. alley removes that friction by making the distance temporary and automatic from the start.

---

## Domain
**alley.social** — chosen from the DeveloperWeek NY Hackathon 2026 name.com Domain Roulette challenge.

The metaphor: an alley is a side street. A detour. Somewhere you step into briefly, then come back out. That's exactly what this feature is — a temporary detour from a relationship, not an exit.

The wordmark reads as **a//ey** — the two l's form the walls of the alley itself. The gap between them is the path.

---

## Hackathon
**DeveloperWeek New York Hackathon 2026**
- Dates: May 25 – June 10 online; June 9–10 in-person + awards
- Venue: TWA Hotel, JFK, Queens, NYC
- Deadline: June 10, 2026 @ 10:00am EDT
- Prize pool: $8,500 cash
- Participants: 490

**Target challenge: name.com Domain Roulette**
- 1st place: $2,500 cash
- 2nd place: $1,000 cash
- Domain does not need to be purchased or registered — name.com has already registered them. The challenge is purely about building a product inspired by the domain.
- Multiple teams can build around the same domain. Exclusivity is not guaranteed.

**Judging criteria:**
1. Creative interpretation of the domain
2. Technical execution
3. Product polish and experience
4. Strength of concept and originality
5. How deeply the final project connects back to the domain

**Estimated scores (if executed properly):**
- Creative interpretation: 88/100
- Technical execution: 72/100
- Product polish and experience: 90/100 ← biggest edge as a design engineer
- Strength of concept and originality: 85/100
- Domain connection: 82/100
- **Overall: ~83/100**

---

## Tech Stack

### Framework
- **Next.js 14** — App Router, TypeScript, server + client components
- **React 18**

### Styling
- **Tailwind CSS 3** — utility-first, mobile-first
- **Geist Sans + Geist Mono** — Vercel's typeface via the `geist` npm package. Sans for all UI text. Mono exclusively for countdown timers and numeric displays.

### Backend / Auth / Database
- **Supabase**
  - **PostgreSQL** — primary database
  - **Supabase Auth** — email/password; OAuth-ready
  - **Row Level Security (RLS)** — all visibility logic enforced at the DB layer, not in application code
  - **`@supabase/ssr`** — server-side session handling for Next.js App Router (replaces the deprecated `@supabase/auth-helpers-nextjs`)
  - **`feed_posts` view** — handles block filtering, mutual exclusion, and the deactivation illusion (posts created during a block window are permanently hidden for B) entirely in SQL
  - **`lift_expired_blocks()` function** — auto-lifts expired blocks; intended to run on a pg_cron schedule or Supabase Edge Function cron trigger

### Key Libraries
- **`lucide-react`** — icons (consistent stroke-width: 1.75 default, 2.5 active)
- **`date-fns`** — date formatting for lift dates and relative timestamps
- **`clsx` + `tailwind-merge`** — merged into a single `cn()` utility in `lib/utils.ts`

### Deployment
- **Vercel** — zero-config for Next.js; env vars set in project dashboard

### Dev Tooling
- TypeScript 5 (strict mode)
- ESLint with Next.js config
- PostCSS + Autoprefixer

---

## MVP Scope
The temporary block is the product. Everything else is scaffolding.

**Minimum needed to demo:**
- Auth (email or Google OAuth)
- Follow/friend system (bare minimum — need "connections" for blocking to make sense)
- A feed (text-only posts)
- The temporary block feature — duration picker, mutual circle option, locked timer, auto-lift on expiry

**Timeline:** 2–3 days of focused work for a demonstrable build. Aim to have it fully functional before arriving at TWA Hotel on June 9.

---

## Product Logic — Finalized Decisions

### The Block
- A sets a block against B for a chosen duration
- The timer is **final**. No early cancellation. No override. A chose the duration; A lives with it.
- When the timer expires, the block lifts automatically. No action needed from either side.
- A cap on cumulative block duration (e.g. 30 days total) prevents the temp block from becoming a de facto permanent block by inertia. After the cap, A is prompted to make a permanent decision.

### What B Experiences
- B sees A's account as **"This account is currently unavailable."** — identical to a standard deactivation screen.
- B receives **no notification** of any kind. No indication a block exists. No timer. No message.
- B cannot DM A, view A's posts, or interact with A's account in any way during the block — consistent with how any deactivated account behaves.
- B's existing follow relationship with A is preserved silently. When the block lifts, everything resumes as it was.

### Mutual Circle Option
- When setting a block, A is optionally shown: *"Would you also like to pause with anyone from their circle?"*
- A can select none, some, or all mutual connections. Selected mutuals also see A's account as deactivated, for the same duration.
- All secondary blocks expire at the same time as the primary block. One timer governs everything.
- This is optional, not mandatory. Keeps it surgical.

### Feed Behavior
- During a block: B does not see A's posts. A does not see B's posts.
- On lift: B's feed does **not** retroactively surface posts A made during the block window. Posts created between `block_created_at` and `expires_at` are filtered out for B permanently. The feed resumes from the moment the block lifted — not from when A was "away." This preserves the deactivation illusion.

### Notifications
- No notifications are sent between A and B during the block. Consistent with deactivated account behavior on every major platform.
- On lift: A may optionally receive a quiet in-app notification that the break has ended. B receives nothing.

### Search
- Deactivated accounts do not surface in search or autocomplete. A does not appear in B's search results during the block. Standard platform behavior — no additional engineering needed.

### The Unavoidable Hole
- If B creates a secondary account C and uses it to look up A's profile, the illusion breaks. This is unsolvable and is the same limitation every hard-block on every platform has. It is not worth engineering around.

---

## Branding
- **Wordmark:** alley (Inter Display, semibold, -3% letter tracking, white on black)
- **Logo concept:** The natural gap between the two l's reads as the alley — no additional treatment needed. The typeface does the work.
- **Full domain version:** alley.social — use only where URL context is needed (Devpost, demo header). The short wordmark is the primary mark.
- **Color:** White on black. Yellow was explored as an accent (road marking metaphor) but the clean white-on-black wordmark won.

---

## Pitch Talking Points

**Why not mute?**
Muting is passive. You can still manually check their profile, their stories. A temporary block removes access entirely — for both of you — for a fixed window. You can't check even if you want to.

**Why won't Instagram just build this?**
Platforms are incentivized to maximize engagement. Temporary blocks reduce it by design. They'll never prioritize it.

**Isn't this just for emotionally weak people?**
Yes. And that's fine. The alternative is rage-blocking at 2am and hating yourself by 9am, or white-knuckling through a heated moment and saying something you can't take back. This is preemptive damage control — you're putting a fixable problem on hold instead of permanently cutting the wire. That takes more self-awareness than either extreme, not less.

**Why can't I cancel it early?**
Because that's the whole point. The commitment device only works if you can't undo it on a whim. When you set the timer, you're making a decision at your most deliberate. Letting you cancel it hands the controls back to your worst impulse. The block protects you from yourself as much as it protects you from them.

**The human case:**
You had a fight. You needed space. You didn't want to make a permanent decision. With alley, you set a timer, disappear cleanly, and come back when it expires — no awkward re-follow, no explanation owed, no damage done to a fixable situation.

---

## What's Next (Post-Hackathon)
- Case study write-up for portfolio
- Potential to develop as a standalone side project with real users
- The feature concept could be pitched to platforms as a product design intervention — but build first, pitch later

---

## Notes
- Name.com Domain Roulette does not exclusively assign domains — multiple teams can build around alley.social. The edge is execution and design quality, not domain exclusivity.
- In-person attendance at TWA Hotel on June 9–10 may influence judging for sponsor prizes — confirm via Devpost discussions.
- Commute from Jersey City to TWA Hotel (JFK) is ~1–1.5 hours via PATH + AirTrain. Factor into June 9 morning.
