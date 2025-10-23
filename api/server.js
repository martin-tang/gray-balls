import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Profanity filter - banned words
const BANNED_WORDS = [
    'ASS', 'ASH', 'ARS', 'SEX', 'DIK', 'DIE', 'KKK', 'NIG', 'FAG', 
    'FUK', 'FUC', 'FKC', 'GAY', 'GEY', 'FCK', 'SHT', 'POO', 'PEE',
    'WTF', 'DMN', 'HEL', 'CNT', 'COK', 'COC', 'DIX', 'VAG', 'TIT',
    'NUT', 'NAZ', 'JEW', 'ISIS', 'KYS', 'DIE', 'KIL', 'CUK', 'CUN', 
    'CUM', 'LSD', 'HRN', 'NOG'
    
];

// Check if nickname contains banned words or patterns
function isNicknameValid(nickname) {
    // Must be exactly 3 characters
    if (nickname.length !== 3) return false;
    
    // Must be alpha only
    if (!/^[A-Z]{3}$/.test(nickname)) return false;
    
    // Check against banned words
    if (BANNED_WORDS.includes(nickname)) return false;
    
    return true;
}

// POST /api/leaderboard - Submit a total score (calculated from localStorage)
app.post('/api/leaderboard', async (req, res) => {
    try {
        const { nickname, totalScore, levelsCompleted } = req.body;
        
        // Validate nickname
        const upperNickname = nickname?.toUpperCase();
        if (!isNicknameValid(upperNickname)) {
            return res.status(400).json({ 
                error: 'Invalid nickname. Must be 3 letters (A-Z) and not contain inappropriate words.' 
            });
        }
        
        // Validate totalScore
        if (typeof totalScore !== 'number' || totalScore < 0) {
            return res.status(400).json({ error: 'Invalid total score' });
        }
        
        // Validate levelsCompleted
        if (typeof levelsCompleted !== 'number' || levelsCompleted < 0 || levelsCompleted > 10) {
            return res.status(400).json({ error: 'Invalid levels completed count' });
        }
        
        // Check if player already exists
        const existingEntry = await prisma.leaderboardEntry.findUnique({
            where: { nickname: upperNickname }
        });
        
        let entry;
        let improved = false;
        let newPlayer = false;
        
        if (existingEntry) {
            // Player exists - update if this is a better total score
            if (totalScore > existingEntry.totalScore) {
                entry = await prisma.leaderboardEntry.update({
                    where: { nickname: upperNickname },
                    data: {
                        totalScore,
                        levelsCompleted
                    }
                });
                improved = true;
            } else {
                // Score not better than existing
                entry = existingEntry;
            }
        } else {
            // New player - create entry
            entry = await prisma.leaderboardEntry.create({
                data: {
                    nickname: upperNickname,
                    totalScore,
                    levelsCompleted
                }
            });
            improved = true;
            newPlayer = true;
        }
        
        res.json({ success: true, entry, improved, newPlayer });
    } catch (error) {
        console.error('Error submitting score:', error);
        res.status(500).json({ error: 'Failed to submit score' });
    }
});

// GET /api/leaderboard - Get leaderboard sorted by total score
app.get('/api/leaderboard', async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 100;
        
        const entries = await prisma.leaderboardEntry.findMany({
            orderBy: {
                totalScore: 'desc'
            },
            take: limit
        });
        
        // Return all entries sorted by total score
        const formattedEntries = entries.map(entry => ({
            nickname: entry.nickname,
            totalScore: entry.totalScore,
            levelsCompleted: entry.levelsCompleted,
            createdAt: entry.createdAt
        }));
        
        res.json({ entries: formattedEntries });
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

// GET /api/leaderboard/top - Get top scores
app.get('/api/leaderboard/top', async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 10;
        
        const entries = await prisma.leaderboardEntry.findMany({
            orderBy: {
                totalScore: 'desc'
            },
            take: limit,
            select: {
                nickname: true,
                totalScore: true,
                levelsCompleted: true,
                createdAt: true
            }
        });
        
        res.json({ entries });
    } catch (error) {
        console.error('Error fetching top scores:', error);
        res.status(500).json({ error: 'Failed to fetch top scores' });
    }
});

// GET /api/leaderboard/player/:nickname - Get entry for a specific player
app.get('/api/leaderboard/player/:nickname', async (req, res) => {
    try {
        const nickname = req.params.nickname.toUpperCase();
        
        const entry = await prisma.leaderboardEntry.findUnique({
            where: { nickname }
        });
        
        if (!entry) {
            return res.status(404).json({ error: 'Player not found' });
        }
        
        res.json({ entry });
    } catch (error) {
        console.error('Error fetching player entry:', error);
        res.status(500).json({ error: 'Failed to fetch player' });
    }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`🚀 Leaderboard API running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit(0);
});

