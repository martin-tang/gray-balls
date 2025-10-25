import { Game } from './Game.js';
import { Level } from './Level.js';

// Store game instance globally for reinitialization
let gameInstance = null;

// Wait for DOM to be ready
window.addEventListener('DOMContentLoaded', () => {
    const loading = document.getElementById('loading');
    const introScreen = document.getElementById('intro-screen');
    
    // Wait for intro screen to be dismissed before initializing game
    const initGame = () => {
        try {
            loading.textContent = 'Initializing game...';
            loading.style.display = 'block';
            
            // If game already exists and needs reinit, reload the level
            if (gameInstance && gameInstance.needsReinit) {
                console.log('🔄 Reinitializing game for new level...');
                
                // Get the selected level
                if (window.selectedStartLevel) {
                    gameInstance.currentLevel = window.selectedStartLevel;
                }
                
                // Clear old level first to remove all assets
                if (gameInstance.level) {
                    gameInstance.level.clear();
                }
                
                // Reload the level
                gameInstance.level = new Level(
                    gameInstance.scene, 
                    gameInstance.physicsWorld, 
                    gameInstance.currentLevel
                );
                gameInstance.loadLevel();
                
                // Reset camera to default preset
                gameInstance.loadCameraPreset(0);
                gameInstance.updateCameraLookDirection();
                
                // Show ball for new level
                if (gameInstance.catapult) {
                    gameInstance.catapult.showBall();
                } else {
                    console.error('❌ Catapult not found after reinit!');
                }
                
                // Show crosshair
                const crosshair = document.getElementById('crosshair');
                if (crosshair) crosshair.style.display = 'block';
                
                // Clear the reinit flag
                gameInstance.needsReinit = false;
                
                console.log('✅ Game reinitialized for level', gameInstance.currentLevel);
            } else if (!gameInstance) {
                // First time initialization
                console.log('🎮 First time game initialization...');
                gameInstance = new Game();
                gameInstance.init();
                gameInstance.start();
                
                // Expose game instance globally for leaderboard access
                window.gameInstance = gameInstance;
                
                console.log('🎮 Castle Crasher - Game Started!');
            }
            
            // Hide loading screen
            loading.style.display = 'none';
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

