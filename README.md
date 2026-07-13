# doodle.io (skribbl.io-style drawing game)

A real-time drawing & guessing web app that follows skribbl.io's rules and flow: rooms with a
shareable code, host-configurable settings, turn-based drawing with word choices, live stroke
broadcasting, timed rounds, hints, close-guess detection, scoring, and a final leaderboard.
Players sign in with just a nickname, and a player who disconnects unexpectedly (dropped
network, closed tab, killed browser) keeps their seat and score and resumes exactly where they
left off when they reconnect. Installable as a PWA (Add to Home Screen) on phones.

Artwork, the word list, and scoring constants are original — not copied from skribbl.io's
proprietary assets/word bank. The exact internal scoring formula skribbl.io uses isn't public,
so `server/src/game/scoring.ts` is a faithful equivalent (fast/early guesses score more, the
drawer earns points as people guess), not a byte-for-byte reverse engineering.

## Structure

- `server/` — Node.js + TypeScript + Express + Socket.IO + Postgres. Owns all game rules,
  authoritative state, and persistence (so score/seat survive reconnects and even server
  restarts). In production it also serves the built web app (see Deployment below), so the
  whole thing is one service with one URL.
- `web/` — React + TypeScript + Vite PWA client.

## 1. Server setup

```bash
cd server
cp .env.example .env    # then fill in DATABASE_URL and JWT_SECRET
npm install
npm run db:migrate      # creates tables in your Postgres database
npm run dev             # starts on :4000
```

You need a real Postgres database. The easiest options are a free tier on
[Neon](https://neon.tech) or [Supabase](https://supabase.com) — grab the connection string they
give you and put it in `DATABASE_URL`. Without it, the server still boots (health check works)
but anything account/room related will fail.

## 2. Web app setup

```bash
cd web
cp .env.example .env     # VITE_API_URL=http://localhost:4000 for local dev
npm install
npm run dev               # starts on :5173 (or the next free port)
```

## How resume-after-disconnect works

- The server never deletes a player's seat or score on an unexpected socket disconnect — it just
  flags them `isConnected: false` and (if it was their turn) skips to the next drawer.
- The web app remembers the last room code it was in (`localStorage`) and automatically re-emits
  `room:join` every time the socket (re)connects — on network flap, tab refresh, or the browser
  being closed and reopened.
- Because the server matches reconnects by the authenticated user id (not the socket id), the
  returning player is merged back into their existing seat with their accumulated score intact,
  not treated as a new player.
- Scores are also persisted to Postgres on every round/game end, so a server restart doesn't lose
  standings either.

## What's implemented vs. simplified

Implemented: room creation/join by code, host-configurable settings (players, draw time,
rounds, word count, hints, game mode, custom words, private/public), turn rotation, word choice
with auto-pick timeout, live stroke streaming, color palette, brush sizes, eraser, true
flood-fill bucket (bounded by drawn lines, undoable, replayed on reconnect), undo/clear, hint
letter reveals, correct/close-guess detection (with spoiler-safe chat routing for the drawer
and players who've already guessed), scoring, round/game-end scoreboards, play again, avatar
customization, vote-kick, nickname (guest) auth, disconnect-and-resume, and basic abuse
protection (server-side input validation and rate limiting on auth, chat, and room churn).

Simplified vs. a literal skribbl.io clone: the word list is an original ~750-word bank
(comparable in size and category breadth to skribbl's default list) rather than skribbl's
actual compiled list; there's no localization (English only); and profanity filtering isn't
implemented.

## Deployment (Render)

This deploys as **one** Render web service: it builds the web app, then starts the server, which
serves the built frontend itself alongside the API/WebSocket — one URL, no CORS to manage.

1. **Push this repo to GitHub** (create an empty repo on github.com first, then):
   ```bash
   git remote add origin <your-repo-url>
   git branch -M main
   git push -u origin main
   ```
2. **Create the service on [Render](https://render.com)**: New → Blueprint → connect the GitHub
   repo. Render will read `render.yaml` at the repo root and pre-fill the build/start commands.
   (No Blueprint support on your plan? New → Web Service instead, same repo, and set the build
   command to `cd web && npm install && npm run build && cd ../server && npm install && npm run build`
   and the start command to `cd server && npm start`.)
3. **Fill in the environment variables** Render prompts for (marked `sync: false` in
   `render.yaml` so they're never committed to git):
   - `DATABASE_URL` — your Neon/Supabase connection string (the same one from local dev works,
     or create a fresh database for production).
   - `JWT_SECRET` — generate a new one: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
4. **Run migrations against the production database** once, from your machine:
   ```bash
   cd server
   DATABASE_URL="<production-connection-string>" npm run db:migrate
   ```

The free Render tier spins the service down after inactivity and takes a few seconds to wake up
on the next request — fine for sharing with friends, not for production traffic.
