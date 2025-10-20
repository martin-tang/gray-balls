import { Game } from './Game.js';

// Wait for DOM to be ready
window.addEventListener('DOMContentLoaded', () => {
    const loading = document.getElementById('loading');
    
    try {
        // Initialize and start the game
        const game = new Game();
        game.init();
        
        // Hide loading screen
        loading.style.display = 'none';
        
        // Start game loop
        game.start();
        
        console.log('🎮 Medieval Catapult Siege - Game Started!');
    } catch (error) {
        console.error('Failed to start game:', error);
        loading.textContent = 'Failed to load game. Please refresh the page.';
        loading.style.color = '#ff0000';
    }
});

