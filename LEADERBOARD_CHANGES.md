# Leaderboard System - Option C Implementation

## Summary

Implemented a **Total Score System** where each player has ONE entry that tracks their best score for each of the 10 levels, with a total score that is the sum of all their level bests.

## How It Works

### Scoring System
- **One entry per nickname** (unique constraint)
- Tracks best score for each level (1-10)
- **Total Score** = Sum of all level best scores
- Automatically updates when you beat a previous level score

### Example Flow
```
Player "SAM" Journey:
1. Completes Level 1: Score 150
   → Total: 150 (1/10 levels)

2. Completes Level 2: Score 200
   → Total: 350 (2/10 levels)

3. Replays Level 1: Score 180 (improved!)
   → Total: 380 (2/10 levels)
   → Level 1 updated from 150 → 180

4. Replays Level 1: Score 140 (worse)
   → Total: 380 (unchanged)
   → Score not updated (previous was better)
```

## Changes Made

### 1. Database Schema (`prisma/schema.prisma`)
```prisma
- nickname (unique)
- totalScore (Float)
- level1Score through level10Score (nullable)
- levelsCompleted (Int)
- Indexed by totalScore for fast ranking
```

### 2. API Server (`api/server.js`)

**POST /api/leaderboard**
- Checks if player exists
- Updates only if new score > existing level score
- Recalculates total score automatically
- Returns: `{ success, entry, improved, newPlayer }`

**GET /api/leaderboard?level={level}**
- Default: Returns all players sorted by totalScore
- With level param: Filters players who completed that level, sorted by that level's score
- Shows both total score AND level-specific score

**GET /api/leaderboard/top**
- Returns top players by total score
- Shows: nickname, totalScore, levelsCompleted

**GET /api/leaderboard/player/:nickname**
- Returns complete entry for a specific player
- Shows all level scores and total

### 3. Frontend Changes

**Leaderboard UI (`src/Game.js`)**
- Updated table columns:
  - Rank | Name | Completed | Total Score | Level Score
- "Completed" shows X/10 levels
- "Level Score" shows score for filtered level (or "-" if viewing all)
- Smart feedback on submission:
  - "Welcome to the leaderboard!" (new player)
  - "New best score!" (improved)
  - "Not better than previous" (no improvement)

**Service Layer (`src/utils/LeaderboardService.js`)**
- Passes through `improved` and `newPlayer` flags
- Handles `filterLevel` for proper display

### 4. UI Display

**All Levels View:**
```
Rank | Name | Completed | Total Score | Level Score
  1  | ABC  |   10/10   |    1250.5   |      -
  2  | DEF  |    8/10   |    1100.0   |      -
  3  | GHI  |    5/10   |     750.0   |      -
```

**Level 3 Filter:**
```
Rank | Name | Completed | Total Score | Level Score
  1  | ABC  |   10/10   |    1250.5   |   180.0
  2  | GHI  |    5/10   |     750.0   |   175.5
  3  | DEF  |    8/10   |    1100.0   |   165.0
```

## Benefits

✅ **One identity per player** - No duplicate nicknames  
✅ **Encourages replay** - Beat your own scores to improve total  
✅ **Tracks progression** - See how many levels completed  
✅ **Fair competition** - Everyone competes on total game mastery  
✅ **Level leaderboards** - Can still see who's best at specific levels  
✅ **Clear goal** - Complete all 10 levels with best scores  

## Migration Notes

**For existing databases:**
```bash
# 1. Generate new Prisma client
npm run prisma:generate

# 2. Create migration
npm run prisma:migrate

# 3. This will DROP the old table and create new one
# WARNING: All existing leaderboard data will be lost!
```

**For production:**
- Consider backing up existing data first
- Could write a migration script to convert old entries to new format
- Or start fresh (recommended for beta/testing)

## API Compatibility

**Breaking Changes:**
- POST /api/leaderboard: Now requires unique nickname
- GET /api/leaderboard: Returns different data structure
- Removed: targets, obstacles, shots from response (tracked locally)
- Changed: /api/leaderboard/nickname → /api/leaderboard/player

**Backward Incompatible:**
- Old clients will receive errors
- Need to update all clients to new API version

