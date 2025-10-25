# 🎨 Enabling the Level Creator

The Level Creator can be toggled on/off for development vs production.

## How to Enable/Disable

### Location
File: `src/Game.js` (top of file, around line 12-20)

### Step 1: Set the Toggle
```javascript
// Set to true to ENABLE Level Creator
const ENABLE_LEVEL_CREATOR = true;  // ✅ ENABLED

// Set to false to DISABLE Level Creator  
const ENABLE_LEVEL_CREATOR = false; // ❌ DISABLED (default)
```

### Step 2: Uncomment the Import (if enabling)
```javascript
// When ENABLED, uncomment this line:
import { LevelCreator } from './LevelCreator.js';

// When DISABLED, comment it out:
// import { LevelCreator } from './LevelCreator.js';
```

### Step 3: Uncomment the Initialization (if enabling)
In the `init()` method (around line 185):
```javascript
if (ENABLE_LEVEL_CREATOR) {
    try {
        // UNCOMMENT this line:
        this.levelCreator = new LevelCreator(this);
        
        console.log('🎨 Level Creator enabled - Press Ctrl+L to open');
    } catch (e) {
        console.error('❌ Level Creator could not be initialized:', e);
        this.levelCreator = null;
    }
}
```

## Quick Enable Guide

1. Open `src/Game.js`
2. Change line ~13: `const ENABLE_LEVEL_CREATOR = true;`
3. Uncomment line ~20: `import { LevelCreator } from './LevelCreator.js';`
4. Uncomment line ~186: `this.levelCreator = new LevelCreator(this);`
5. Save and reload

## Quick Disable Guide (for production)

1. Open `src/Game.js`
2. Change line ~13: `const ENABLE_LEVEL_CREATOR = false;`
3. Comment line ~20: `// import { LevelCreator } from './LevelCreator.js';`
4. Comment line ~186: `// this.levelCreator = new LevelCreator(this);`
5. Save and build

## Why Toggle?

### Production (DISABLED):
- ✅ Smaller bundle size (Level Creator code not included)
- ✅ Faster load times
- ✅ No accidental level editing
- ✅ Cleaner for players

### Development (ENABLED):
- ✅ Visual level editing
- ✅ Quick iteration
- ✅ No code required for level design
- ✅ Import/export existing levels

## Vercel Deployment

For deployment to Vercel, make sure:
```javascript
const ENABLE_LEVEL_CREATOR = false;  // IMPORTANT: Disable for production!
// import { LevelCreator } from './LevelCreator.js';  // IMPORTANT: Comment out!
```

This ensures the Level Creator code is not included in the production build.

## Status Messages

When you start the game, check the console:

**If ENABLED:**
```
🎨 Level Creator enabled - Press Ctrl+L to open
```

**If DISABLED:**
```
🎮 Game mode - Level Creator disabled
```

**If ERROR (enabled but import missing):**
```
⚠️ LevelCreator import is commented out. Uncomment the import to use.
```

