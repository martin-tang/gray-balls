# Leaderboard Setup Guide

## Prerequisites

- PostgreSQL database (local or cloud-hosted)
- Node.js installed

## Setup Steps

### 1. Create `.env` File

Create a `.env` file in the root directory with your database connection:

```env
# Your PostgreSQL connection string
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"

# API Server Port (optional, defaults to 3001)
PORT=3001

# Frontend API URL (for local development)
VITE_API_URL=http://localhost:3001
```

**For Production/Deployment:**
```env
VITE_API_URL=https://your-api-domain.com
```

### 2. Generate Prisma Client

```bash
npx prisma generate
```

This generates the Prisma Client in `node_modules/@prisma/client`.

### 3. Push Schema to Database

```bash
npx prisma db push
```

This will create the `LeaderboardEntry` table in your database without creating migrations (suitable for development).

### 4. Start the API Server

```bash
npm run api
```

The API will start on `http://localhost:3001`

### 5. Start the Game (in another terminal)

```bash
npm run dev
```

Or run both at once:

```bash
npm run dev:all
```

## API Endpoints

- `POST /api/leaderboard` - Submit a score
- `GET /api/leaderboard?level={level}&limit={limit}` - Get leaderboard entries
- `GET /api/leaderboard/top?limit={limit}` - Get top scores across all levels
- `GET /api/leaderboard/nickname/{nickname}` - Get entries for a specific player

## Profanity Filter

The system includes a built-in profanity filter that blocks inappropriate 3-letter combinations including:
- ASS, NIG, FAG, FUK, SEX, and many others
- The list can be customized in `api/server.js`

## How It Works

The leaderboard uses a **Total Score System (Option C)**:
- **One entry per player** (unique nickname)
- Tracks **best score for each level** (1-10)
- **Total score** = sum of all level best scores
- Updates automatically when you beat a level score

### Example:
```
Player "ABC" completes:
- Level 1: Score 150 (first time)
- Level 2: Score 200 (first time)
- Level 1: Score 180 (improved!)

Result: Total Score = 180 + 200 = 380
(Level 1 updated from 150 to 180)
```

## Database Schema

```prisma
model LeaderboardEntry {
  id          String   @id @default(cuid())
  nickname    String   @unique
  totalScore  Float    @default(0)
  
  // Best scores for each level
  level1Score  Float?
  level2Score  Float?
  level3Score  Float?
  level4Score  Float?
  level5Score  Float?
  level6Score  Float?
  level7Score  Float?
  level8Score  Float?
  level9Score  Float?
  level10Score Float?
  
  levelsCompleted Int @default(0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([totalScore])
  @@index([nickname])
}
```

## Deployment Tips

1. **Database**: Use a managed PostgreSQL service:
   - [Supabase](https://supabase.com) (Free tier available)
   - [Neon](https://neon.tech) (Free tier available)
   - [Railway](https://railway.app)
   - [PlanetScale](https://planetscale.com)

2. **API Server**: Deploy to:
   - [Vercel](https://vercel.com) (Serverless)
   - [Railway](https://railway.app)
   - [Render](https://render.com)
   - [Fly.io](https://fly.io)

3. **Frontend**: Deploy to:
   - [Vercel](https://vercel.com)
   - [Netlify](https://netlify.com)
   - [GitHub Pages](https://pages.github.com)

4. **Environment Variables**: Set `VITE_API_URL` to your deployed API URL

## Troubleshooting

### Cannot connect to database
- Check your `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Check firewall/network settings

### CORS errors
- Ensure API server is running
- Check `VITE_API_URL` matches your API server URL
- CORS is configured in `api/server.js`

### Profanity filter too strict
- Edit the `BANNED_WORDS` array in `api/server.js`
- Restart the API server after changes

## Managing the Database

View and edit data using Prisma Studio:

```bash
npm run prisma:studio
```

Opens a web interface at `http://localhost:5555`

