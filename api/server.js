import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Profanity filter - banned words (EXACT MATCH ONLY)
// This list blocks specific 3-letter combinations that could be offensive
// Common nicknames like NIP, MAR, DAN, JOE, etc. are NOT blocked
const BANNED_WORDS = [
    'ASS', 'ASH', 'ARS', 'SEX', 'DIK', 'DIE', 'KKK', 'NIG', 'FAG', 
    'FUK', 'FUC', 'FKC', 'GAY', 'GEY', 'FCK', 'SHT', 'POO', 'PEE',
    'WTF', 'DMN', 'HEL', 'CNT', 'COK', 'COC', 'DIX', 'VAG', 'TIT',
    'NUT', 'NAZ', 'JEW', 'ISIS', 'KYS', 'DIE', 'KIL', 'CUK', 'CUN', 
    'CUM', 'LSD', 'HRN', 'NOG', 'FKU'
    
];

// Check if nickname contains banned words or patterns
function isNicknameValid(nickname) {
    // Must be exactly 3 characters
    if (nickname.length !== 3) {
        console.log(`❌ Nickname validation failed: length is ${nickname.length}, expected 3`);
        return false;
    }
    
    // Must be alpha only
    if (!/^[A-Z]{3}$/.test(nickname)) {
        console.log(`❌ Nickname validation failed: "${nickname}" doesn't match ^[A-Z]{3}$`);
        return false;
    }
    
    // Check against banned words (exact match only)
    if (BANNED_WORDS.includes(nickname)) {
        console.log(`❌ Nickname validation failed: "${nickname}" is in banned list`);
        return false;
    }
    
    console.log(`✅ Nickname "${nickname}" passed validation`);
    return true;
}

// GET /api/leaderboard/validate/:nickname - Test nickname validation
app.get('/api/leaderboard/validate/:nickname', (req, res) => {
    const nickname = req.params.nickname.toUpperCase();
    const isValid = isNicknameValid(nickname);
    
    res.json({
        nickname: nickname,
        valid: isValid,
        reason: isValid ? 'Valid nickname' : 'Invalid nickname',
        inBannedList: BANNED_WORDS.includes(nickname),
        length: nickname.length,
        matchesPattern: /^[A-Z]{3}$/.test(nickname)
    });
});

// POST /api/leaderboard - Submit a total score (calculated from localStorage)
app.post('/api/leaderboard', async (req, res) => {
    try {
        const { nickname, totalScore, levelsCompleted, deviceId } = req.body;
        
        // Validate nickname
        const upperNickname = nickname?.toUpperCase();
        if (!isNicknameValid(upperNickname)) {
            // Provide more specific error message
            let errorMsg = 'Invalid nickname. ';
            if (!upperNickname || upperNickname.length !== 3) {
                errorMsg += 'Must be exactly 3 letters.';
            } else if (!/^[A-Z]{3}$/.test(upperNickname)) {
                errorMsg += 'Only letters A-Z allowed (no numbers or symbols).';
            } else if (BANNED_WORDS.includes(upperNickname)) {
                errorMsg += 'This combination is not allowed.';
            } else {
                errorMsg += 'Please try a different combination.';
            }
            
            return res.status(400).json({ error: errorMsg });
        }
        
        // Validate deviceId
        if (!deviceId || typeof deviceId !== 'string') {
            return res.status(400).json({ error: 'Invalid device ID' });
        }
        
        // Validate totalScore
        if (typeof totalScore !== 'number' || totalScore < 0) {
            return res.status(400).json({ error: 'Invalid total score' });
        }
        
        // Validate levelsCompleted
        if (typeof levelsCompleted !== 'number' || levelsCompleted < 0 || levelsCompleted > 10) {
            return res.status(400).json({ error: 'Invalid levels completed count' });
        }
        
        // Check if device already has an entry
        const existingByDevice = await prisma.leaderboardEntry.findUnique({
            where: { deviceId }
        });
        
        let entry;
        let improved = false;
        let newPlayer = false;
        
        if (existingByDevice) {
            // Device already submitted - handle different scenarios
            if (totalScore > existingByDevice.totalScore) {
                // Better score - update everything
                entry = await prisma.leaderboardEntry.update({
                    where: { deviceId },
                    data: {
                        nickname: upperNickname,
                        totalScore,
                        levelsCompleted
                    }
                });
                improved = true;
            } else if (totalScore === existingByDevice.totalScore) {
                // Same score - just update nickname if different
                if (upperNickname !== existingByDevice.nickname) {
                    // Check if new nickname is taken by another device
                    const nicknameConflict = await prisma.leaderboardEntry.findUnique({
                        where: { nickname: upperNickname }
                    });
                    
                    if (nicknameConflict && nicknameConflict.deviceId !== deviceId) {
                        return res.status(400).json({ 
                            error: 'Nickname already taken by another player.' 
                        });
                    }
                    
                    entry = await prisma.leaderboardEntry.update({
                        where: { deviceId },
                        data: { nickname: upperNickname }
                    });
                    
                    return res.json({ 
                        success: true, 
                        entry, 
                        improved: false,
                        nicknameChanged: true,
                        message: 'Nickname updated successfully!'
                    });
                } else {
                    // Same score, same nickname - no change needed
                    return res.json({ 
                        success: true, 
                        entry: existingByDevice, 
                        improved: false,
                        message: 'No changes made.'
                    });
                }
            } else {
                // Worse score - return existing info and let frontend handle it
                return res.json({ 
                    success: true, 
                    entry: existingByDevice,
                    improved: false,
                    worseScore: true,
                    existingNickname: existingByDevice.nickname,
                    existingScore: existingByDevice.totalScore,
                    message: `This device has a higher score (${existingByDevice.totalScore.toFixed(1)}) under "${existingByDevice.nickname}".`
                });
            }
        } else {
            // Check if nickname is already taken by another device
            const existingByNickname = await prisma.leaderboardEntry.findUnique({
                where: { nickname: upperNickname }
            });
            
            if (existingByNickname) {
                return res.status(400).json({ 
                    error: 'Nickname already taken. Please choose a different one.' 
                });
            }
            
            // New device - create entry
            entry = await prisma.leaderboardEntry.create({
                data: {
                    nickname: upperNickname,
                    deviceId,
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

// PATCH /api/leaderboard/nickname - Update nickname only (for existing device)
app.patch('/api/leaderboard/nickname', async (req, res) => {
    try {
        const { deviceId, newNickname } = req.body;
        
        // Validate inputs
        if (!deviceId || typeof deviceId !== 'string') {
            return res.status(400).json({ error: 'Invalid device ID' });
        }
        
        const upperNickname = newNickname?.toUpperCase();
        if (!isNicknameValid(upperNickname)) {
            // Provide more specific error message
            let errorMsg = 'Invalid nickname. ';
            if (!upperNickname || upperNickname.length !== 3) {
                errorMsg += 'Must be exactly 3 letters.';
            } else if (!/^[A-Z]{3}$/.test(upperNickname)) {
                errorMsg += 'Only letters A-Z allowed (no numbers or symbols).';
            } else if (BANNED_WORDS.includes(upperNickname)) {
                errorMsg += 'This combination is not allowed.';
            } else {
                errorMsg += 'Please try a different combination.';
            }
            
            return res.status(400).json({ error: errorMsg });
        }
        
        // Check if device exists
        const existingByDevice = await prisma.leaderboardEntry.findUnique({
            where: { deviceId }
        });
        
        if (!existingByDevice) {
            return res.status(404).json({ error: 'Device entry not found' });
        }
        
        // Check if new nickname is taken by another device
        const nicknameConflict = await prisma.leaderboardEntry.findUnique({
            where: { nickname: upperNickname }
        });
        
        if (nicknameConflict && nicknameConflict.deviceId !== deviceId) {
            return res.status(400).json({ 
                error: 'Nickname already taken by another player.' 
            });
        }
        
        // Update nickname only
        const entry = await prisma.leaderboardEntry.update({
            where: { deviceId },
            data: { nickname: upperNickname }
        });
        
        res.json({ 
            success: true, 
            entry,
            message: `Nickname updated to "${upperNickname}" for existing score!`
        });
    } catch (error) {
        console.error('Error updating nickname:', error);
        res.status(500).json({ error: 'Failed to update nickname' });
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

