# Squadrank

**Collaborative study groups with live leaderboards and goal tracking.**

Squadrank lets students form private groups, set shared learning goals, and compete on a real-time leaderboard — built for ed-tech platforms that want to drive engagement through accountability and friendly competition.

---

## What it does

- **Study Groups** — Create private groups with a single creator and multiple members. Each creator can own one group at a time; members can belong to many.
- **Group Goals** — Every group has one active goal at a time: solve N questions, finish a chapter, hit a daily streak. Goals can be deadline-based (fixed end date) or recurring (daily / weekly / monthly with automatic period resets).
- **Activity Tracking** — Members log solved questions with time spent. The system validates subject match, time window, and dedup rules — but stores every attempt regardless, so no user data is ever thrown away.
- **Live Leaderboard** — Per-group, per-active-goal leaderboard with dense ranking, multi-filter support (metric, time window, subject), pagination, and always-visible current-user rank. Response times kept under 500ms via Redis caching.
- **Goal Progress** — Real-time collective progress powered by an atomic counter cache — no heavy aggregation on every read.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js + TypeScript |
| Framework | Express.js |
| Database | MongoDB (Mongoose) |
| Cache | Redis via Upstash |
| Auth | Google OAuth 2.0 + JWT |
| Deployment | Vercel (API) + Upstash (Redis) |
| Logging | Winston |

---

## Architecture Highlights

**Counter Cache Pattern for Progress**
Rather than running a full aggregation on `GroupMemberActivity` on every `/progress` request, `GroupGoal.questionsSolved` is incremented atomically on each valid activity insert. Progress reads become O(1). The counter is protected against overcounting via a conditional update: `{ $inc }` only fires when `progress < targetCount`.

**Lazy Period Reset for Recurring Goals**
Recurring goals have no stored deadline. The current active window is computed dynamically from `startDate + frequency` on every request using integer period arithmetic. Progress resets without a cron job — the first activity submitted after a period boundary triggers a lazy `$set: { questionsSolved: 0, lastResetAt: windowStart }`. The old period's activities remain in the database; they simply fall outside the computed window.

**Store-All Activity Model**
Every activity a user submits is persisted regardless of whether it counts toward the goal. Validation failures (wrong subject, outside time window, duplicate, invalid status) are recorded on the document via `countedTowardsGoal: false` and `notCountedReason`. This preserves the full activity history for analytics, gives users informative feedback without 4xx errors, and makes future goal types retroactively queryable.

**Dense Rank Leaderboard via `$setWindowFields`**
MongoDB 5+ `$denseRank` inside `$setWindowFields` handles tied ranks natively in the aggregation pipeline. Rank is always computed on the primary metric; display sort (by name, percentage, time spent) is applied separately at the end of the pipeline, so rank correctness is decoupled from sort order.

**Redis Cache Invalidation**
Every leaderboard cache key (unique per filter combination) is registered in a Redis SET keyed by `leaderboard:keys:{goalId}`. When a new activity is recorded, the entire set is wiped in one pass — no pattern scanning needed. TTL on each key is set to the lesser of 5 minutes or the time remaining in the current goal period, so the cache auto-expires at period boundaries.

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/auth/login` | Get Google OAuth redirect URL |
| `GET` | `/api/auth/google/callback` | OAuth callback — returns JWT |
| `POST` | `/api/groups` | Create a study group |
| `POST` | `/api/groups/:groupId/member` | Add a member (creator only) |
| `POST` | `/api/groups/:groupId/goal` | Set active group goal (creator only) |
| `POST` | `/api/groups/:groupId/activity` | Log a question attempt |
| `GET` | `/api/groups/:groupId/progress` | Get collective goal progress |
| `GET` | `/api/groups/:groupId/leaderboard` | Get leaderboard with filters |

**Leaderboard query params:**

```
metric      = questionsSolved | timeSpent | percentage   (default: questionsSolved)
timeWindow  = all | day | week | month                   (default: all)
subject     = <subjectId>,<subjectId>                    (multi-subject goals only)
sortBy      = questionsSolved | timeSpent | percentage | userName
sort        = asc | desc                                 (default: desc)
offset      = 0                                          (pagination)
limit       = 10                                         (max 50)
```

---

## Running Locally

**Prerequisites:** Node.js 18+, MongoDB, a Google OAuth app

**1. Clone and install**

```bash
git clone https://github.com/jaygajera17/squadrank.git
cd squadrank
npm install
```

**2. Configure environment**

```bash
cp .env.example .env
```

Fill in `.env`:

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/squadrank
JWT_SECRET=your_secret_here
CLIENT_ID=your_google_client_id
CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback

# Optional — leave blank to run without caching
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

> Redis is optional for local development. The server gracefully degrades — all endpoints work without it, caching is simply skipped.

**3. Seed the database**

```bash
npm run seed
```

This imports subjects, questions, sample groups, goals, and 5,000 activity records for leaderboard performance testing.

**4. Start the dev server**

```bash
npm run dev
```

Server starts at `http://localhost:5000`.

---

## Deployment

**Live API:** `https://squadrank.vercel.app`

Deployed on Vercel with CI/CD connected to the main branch. Redis hosted on Upstash free tier.

> Both are on free-tier infrastructure — cold starts and cache latency are expected. For a production setup, swap Vercel Serverless for a persistent Node.js instance (Railway, Render, or EC2) to avoid cold starts on the MongoDB connection.

**Deploy your own:**

```bash
npm run build          # compiles TypeScript to dist/
```

Set the same environment variables in your host's dashboard and point the start command to `node dist/server.js`.

---

## Assumptions

**Creator is auto-added as a member.** When a group is created, the creator is pushed into the `members` array automatically. All downstream authorization checks (activity submission, leaderboard access) use a single `members.includes(userId)` guard with no special-casing for the creator.

**Multi-subject goals via `subjectIds` array.** `GroupGoal.subjectIds` is an array of `ObjectId` references to the `Subject` collection. Subject matching on activity submission is a set membership check against this array — not a string comparison against the goal title. This supports goals like "Solve 100 Math or Physics Questions" cleanly, and filters on the leaderboard apply only when the goal has more than one subject.

**Activities are stored, not rejected.** Invalid contributions (wrong subject, outside time window, duplicate, attempted-only status) are persisted to `GroupMemberActivity` with `countedTowardsGoal: false` and a `notCountedReason` code. The response returns `counted: false` with a human-readable reason rather than a 4xx error. Only `countedTowardsGoal: true` records are used in leaderboard and progress aggregations.

**No cron job for recurring goal resets.** Period boundaries are computed mathematically at query time from `startDate + frequency`. The `questionsSolved` counter resets lazily — the first activity submitted in a new period triggers the reset. No scheduled job is required.

---

## Future Considerations

**Member removal and activity rollback.** If kick-member or leave-group is implemented, a decision is needed on whether to roll back that member's counted contributions from `GroupGoal.questionsSolved`. The current counter-cache pattern would require a `$inc: -N` correction or a full recompute from `GroupMemberActivity`.

**Goal editing and leaderboard invalidation.** The spec supports editing deadline and frequency. Changing either should flush all leaderboard cache keys for that goal (already handled by `invalidateGoalCache`) and potentially recompute `questionsSolved` if the new window excludes previously counted activities.

**Persistence layer for Redis.** The current Upstash setup uses REST-based access. For sub-100ms leaderboard targets at scale, a persistent Redis connection (Upstash with connection pooling or a self-hosted instance) would reduce per-request overhead significantly.