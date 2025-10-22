import { Game } from './Game.js';

// Wait for DOM to be ready
window.addEventListener('DOMContentLoaded', () => {
    const loading = document.getElementById('loading');
    const introScreen = document.getElementById('intro-screen');
    
    // Wait for intro screen to be dismissed before initializing game
    const initGame = () => {
        try {
            loading.textContent = 'Initializing game...';
            
            // Initialize and start the game
            const game = new Game();
            game.init();
            
            // Hide loading screen
            loading.style.display = 'none';
            
            // Start game loop
            game.start();
            
            console.log('🎮 Castle Crasher - Game Started!');
        } catch (error) {
            console.error('Failed to start game:', error);
            loading.textContent = 'Failed to load game. Please refresh the page.';
            loading.style.color = '#ff0000';
        }
    };
    
    // Watch for intro screen to be hidden
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.target.classList.contains('hidden')) {
                initGame();
                observer.disconnect();
            }
        });
    });
    
    // Initially hide loading screen until user dismisses intro
    loading.style.display = 'none';
    
    // Start observing intro screen
    observer.observe(introScreen, {
        attributes: true,
        attributeFilter: ['class']
    });
});

