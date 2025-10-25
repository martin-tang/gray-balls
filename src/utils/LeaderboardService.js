export class LeaderboardService {
    constructor() {
        this.apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    }

    async submitScore(nickname, totalScore, levelsCompleted, deviceId) {
        try {
            const response = await fetch(`${this.apiUrl}/api/leaderboard`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    nickname,
                    totalScore,
                    levelsCompleted,
                    deviceId
                })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to submit score');
            }

            return { 
                success: true, 
                entry: data.entry,
                improved: data.improved,
                newPlayer: data.newPlayer
            };
        } catch (error) {
            console.error('Error submitting score:', error);
            return { success: false, error: error.message };
        }
    }

    async getLeaderboard(limit = 100) {
        try {
            const params = new URLSearchParams();
            if (limit) params.append('limit', limit);

            const response = await fetch(`${this.apiUrl}/api/leaderboard?${params}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch leaderboard');
            }

            return { 
                success: true, 
                entries: data.entries
            };
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            return { success: false, error: error.message, entries: [] };
        }
    }

    async getTopScores(limit = 10) {
        try {
            const response = await fetch(`${this.apiUrl}/api/leaderboard/top?limit=${limit}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch top scores');
            }

            return { success: true, entries: data.entries };
        } catch (error) {
            console.error('Error fetching top scores:', error);
            return { success: false, error: error.message, entries: [] };
        }
    }

    async getNicknameScores(nickname) {
        try {
            const response = await fetch(`${this.apiUrl}/api/leaderboard/nickname/${nickname}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch nickname scores');
            }

            return { success: true, entries: data.entries };
        } catch (error) {
            console.error('Error fetching nickname scores:', error);
            return { success: false, error: error.message, entries: [] };
        }
    }

    async updateNickname(deviceId, newNickname) {
        try {
            const response = await fetch(`${this.apiUrl}/api/leaderboard/nickname`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    deviceId,
                    newNickname
                })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to update nickname');
            }

            return { 
                success: true, 
                entry: data.entry,
                message: data.message
            };
        } catch (error) {
            console.error('Error updating nickname:', error);
            return { success: false, error: error.message };
        }
    }

    validateNickname(nickname) {
        // Must be exactly 3 characters
        if (!nickname || nickname.length !== 3) {
            return { valid: false, error: 'Must be exactly 3 letters' };
        }

        // Must be alpha only
        if (!/^[A-Za-z]{3}$/.test(nickname)) {
            return { valid: false, error: 'Only letters A-Z allowed' };
        }

        return { valid: true };
    }
}

