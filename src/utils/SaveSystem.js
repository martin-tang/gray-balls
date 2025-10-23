/**
 * SaveSystem - Handles local storage for level completion and high scores
 */

export class SaveSystem {
    constructor() {
        this.storageKey = 'castleCrasher_saveData';
        this.data = this.load();
    }
    
    // Load save data from localStorage
    load() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.warn('Failed to load save data:', e);
        }
        
        // Default save data structure
        return {
            levels: {},
            totalScore: 0,
            levelsCompleted: 0
        };
    }
    
    // Save data to localStorage
    save() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.data));
        } catch (e) {
            console.error('Failed to save data:', e);
        }
    }
    
    // Update level completion with new score
    updateLevel(levelNumber, score, targetsDestroyed, obstaclesDestroyed, shotsUsed) {
        if (!this.data.levels[levelNumber]) {
            this.data.levels[levelNumber] = {
                completed: false,
                highScore: 0,
                bestTargets: 0,
                bestObstacles: 0,
                bestShots: Infinity,
                attempts: 0
            };
        }
        
        const levelData = this.data.levels[levelNumber];
        levelData.attempts++;
        
        // Check if this is a new high score
        if (score > levelData.highScore) {
            levelData.highScore = score;
            levelData.bestTargets = targetsDestroyed;
            levelData.bestObstacles = obstaclesDestroyed;
            levelData.bestShots = shotsUsed;
        }
        
        // Mark as completed
        if (!levelData.completed) {
            levelData.completed = true;
            this.data.levelsCompleted++;
        }
        
        this.save();
    }
    
    // Get level data
    getLevelData(levelNumber) {
        return this.data.levels[levelNumber] || null;
    }
    
    // Check if level is completed
    isLevelCompleted(levelNumber) {
        return this.data.levels[levelNumber]?.completed || false;
    }
    
    // Get high score for a level
    getHighScore(levelNumber) {
        return this.data.levels[levelNumber]?.highScore || 0;
    }
    
    // Get all completed levels
    getCompletedLevels() {
        return Object.keys(this.data.levels)
            .filter(level => this.data.levels[level].completed)
            .map(level => parseInt(level));
    }
    
    // Get total stats
    getTotalStats() {
        return {
            levelsCompleted: this.data.levelsCompleted,
            totalHighScore: Object.values(this.data.levels)
                .reduce((sum, level) => sum + (level.highScore || 0), 0)
        };
    }
    
    // Reset all save data
    reset() {
        this.data = {
            levels: {},
            totalScore: 0,
            levelsCompleted: 0
        };
        this.save();
    }
}

