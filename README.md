# Medieval Catapult Siege 🏰

A 3D browser-based medieval catapult game built with Three.js and Cannon.js physics engine.

## Game Description

Launch projectiles from your catapult to destroy medieval targets including target boards, soldiers, upgraded soldiers, and loot chests. Navigate through increasingly difficult levels featuring castles, towers, walls, and strategic arrangements of enemies.

## Features

- **3D Graphics**: Rendered with Three.js
- **Realistic Physics**: Powered by Cannon.js physics engine
- **Trajectory Preview**: See where your projectile will go before firing
- **Multiple Target Types**:
  - 🎯 Target Boards (100 points)
  - ⚔️ Soldiers (200 points)
  - 🛡️ Upgraded Soldiers (300 points)
  - 💰 Loot Chests (150 points)
- **Dynamic Levels**: Progress through hand-crafted and procedurally generated levels
- **Camera Follow**: Automatic camera tracking of your projectile
- **Medieval Structures**: Destroy walls, towers, and castles

## Controls

### Catapult Aiming
- **Arrow Keys**: Aim the catapult
  - ⬆️ **Up Arrow**: Increase vertical angle
  - ⬇️ **Down Arrow**: Decrease vertical angle (minimum ~6° above horizontal)
  - ⬅️ **Left Arrow**: Rotate catapult left (full 360° rotation)
  - ➡️ **Right Arrow**: Rotate catapult right (full 360° rotation)
- **Realistic Range**: Fires from low angle (~6° for close targets) to nearly vertical (~89° for high arcs)
- **Physics-Based**: Like a real catapult, cannot fire below horizontal

### Power Control
- **[ Key (Hold)**: Smoothly decrease power (minimum: 5)
- **] Key (Hold)**: Smoothly increase power (maximum: 35)
- **Power Display**: Shows current power in the UI (default: 15)
- **Smooth Adjustment**: Hold keys for continuous change at 10 units/second
- Trajectory line updates in real-time to show the new range

### Firing
- **SPACE**: Fire projectile at current power level
  - Instant fire - no charging needed
  - Adjust power before firing with [ ] keys

### Camera Controls
- **Z Key**: Cycle through 3 camera presets
  - **Behind Catapult** (default): Classic view from behind
  - **Right Side View**: View from the right side of the battlefield
  - **Left Side View**: Opposite angle from the left side
- **WASD**: Move camera freely across the map (from current preset)
  - **W**: Move forward
  - **S**: Move backward
  - **A**: Move left
  - **D**: Move right
- **Q/E**: Vertical camera movement
  - **Q**: Move camera down
  - **E**: Move camera up
- **Mouse Drag**: Free look - rotate camera view from current position
- **Mouse Scroll**: Adjust camera vertical angle
- **R Key**: Reset current level (camera returns to first preset)

## Installation & Running

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to:
```
http://localhost:5173
```

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Game Tips

1. **Complete Freedom**: The catapult can rotate 360° and fire from low angles to nearly vertical - hit targets anywhere!
2. **Close Targets**: Use low power + low angle (~6°) to hit targets near the catapult
3. **High Arcs**: Aim almost straight up for extreme lobbing shots over obstacles
4. **Realistic Physics**: The catapult won't fire below horizontal - just like a real medieval siege weapon!
5. **Optimal Range**: A 45-degree angle typically provides maximum range
6. **Watch the Trajectory**: The yellow trajectory line is always visible - use it to plan your shot
7. **Multiple Camera Angles**: Press Z to cycle through 3 camera presets for different perspectives
8. **Free Camera**: Use WASD to move around the map and scout target positions from any preset
9. **Strategic Views**: Use Side Views to see the battlefield from different angles and judge distances
10. **Target Weak Points**: Hit structures at their base to cause maximum destruction
11. **Conserve Ammo**: You have limited shots per level
12. **Chain Reactions**: Knock down structures to hit multiple targets
13. **Scout First**: Fly the camera around with Q/E to find the best vantage point before firing

## Level Progression

- **Level 1**: Simple tutorial - basic targets on platforms
- **Level 2**: Medium difficulty - tower structures with soldiers
- **Level 3**: Castle siege - fortified structures with upgraded soldiers
- **Level 4+**: Procedurally generated challenges

## Technical Details

### Dependencies
- `three` (^0.170.0) - 3D graphics rendering
- `cannon-es` (^0.20.0) - Physics simulation
- `vite` (^5.0.0) - Build tool and dev server

### Project Structure
```
game-001/
├── index.html              # Main HTML file with UI
├── package.json           # Project dependencies
├── src/
│   ├── main.js           # Entry point
│   ├── Game.js           # Main game loop and logic
│   ├── Catapult.js       # Catapult controls and aiming
│   ├── TrajectoryPreview.js  # Trajectory visualization
│   ├── PhysicsWorld.js   # Physics world wrapper
│   ├── Level.js          # Level management and generation
│   └── objects/
│       ├── Projectile.js # Projectile physics and rendering
│       ├── Target.js     # Target objects (soldiers, chests)
│       └── Building.js   # Buildings (walls, towers, castles)
```

## Physics

The game uses realistic projectile motion physics:
- Gravity: 9.82 m/s²
- Trajectory calculation: `y = x*tan(θ) - (g*x²)/(2*v²*cos²(θ))`
- Collision detection and response
- Material friction and restitution properties

## Future Enhancements

Potential features to add:
- [ ] Sound effects and background music
- [ ] Particle effects for explosions
- [ ] Different projectile types (fire, explosive, ice)
- [ ] Power-ups and special abilities
- [ ] Multiplayer support
- [ ] Mobile touch controls
- [ ] Level editor
- [ ] Leaderboards and achievements

## Browser Compatibility

Works best on modern browsers with WebGL support:
- Chrome/Edge (recommended)
- Firefox
- Safari 14+

## Performance Tips

If you experience lag:
1. Close other browser tabs
2. Disable browser extensions
3. Lower your screen resolution
4. Use Chrome for best performance

## License

MIT License - Feel free to use and modify!

## Credits

Built with:
- [Three.js](https://threejs.org/) - 3D graphics library
- [Cannon.js](https://github.com/pmndrs/cannon-es) - Physics engine
- [Vite](https://vitejs.dev/) - Build tool

---

Enjoy laying siege to medieval castles! 🏰💥

