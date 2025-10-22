import * as THREE from 'three';
import { Target } from './objects/Target.js';
import { Building } from './objects/Building.js';
import { MedievalAssets } from './objects/MedievalAssets.js';
import { SeededRandom } from './utils/SeededRandom.js';

export class Level {
    constructor(scene, physicsWorld, levelNumber = 1) {
        this.scene = scene;
        this.physicsWorld = physicsWorld;
        this.levelNumber = levelNumber;
        this.targets = [];
        this.buildings = [];
        
        // Create seeded random generator based on level number
        this.random = new SeededRandom(levelNumber * 12345);
        this.medievalAssets = new MedievalAssets(scene, physicsWorld, this.random);
        
        // Set up collision handling for building damage
        this.setupCollisionHandling();
    }
    
    setupCollisionHandling() {
        // Register callback for projectile-building collisions
        this.physicsWorld.registerCollisionCallback((projectileBody, objectBody, impactForce) => {
            // Find which building was hit
            const hitBuilding = this.buildings.find(building => building.body === objectBody);
            
            if (hitBuilding && !hitBuilding.isDestroyed) {
                // Apply damage to the building
                hitBuilding.takeDamage(impactForce);
            }
        });
    }
    
    load() {
        // Clear existing level
        this.clear();
        
        // Load level based on level number
        switch(this.levelNumber) {
            case 1:
                this.createLevel1();
                break;
            case 2:
                this.createLevel2();
                break;
            case 3:
                this.createLevel3();
                break;
            default:
                this.createRandomLevel();
        }
        
        // Spawn medieval scenery assets around the edges
        this.spawnBattlefieldScenery();
        
        return this.targets.length;
    }
    
    createLevel1() {
        // Simple introductory level - just a few targets on platforms
        const baseX = 20;
        
        // Ground platform
        this.addBuilding(baseX, 0.15, 0, 'platform');
        
        // Stack of boxes with targets
        this.addBuilding(baseX - 1, 1, 0, 'wall');
        this.addBuilding(baseX + 1, 1, 0, 'wall');
        this.addBuilding(baseX, 2, 0, 'platform');
        
        // Targets on top
        this.addTarget(baseX, 2.8, 0, 'basic');
        this.addTarget(baseX - 0.8, 2.8, 0, 'loot');
    }
    
    createLevel2() {
        // Medium difficulty - tower structure
        const baseX = 25;
        
        // Base
        this.addBuilding(baseX, 0.5, 0, 'platform');
        
        // Tower supports
        this.addBuilding(baseX - 1.5, 1.5, -1.5, 'wall');
        this.addBuilding(baseX + 1.5, 1.5, -1.5, 'wall');
        this.addBuilding(baseX - 1.5, 1.5, 1.5, 'wall');
        this.addBuilding(baseX + 1.5, 1.5, 1.5, 'wall');
        
        // Middle platform
        this.addBuilding(baseX, 2.8, 0, 'platform');
        
        // Targets and soldiers
        this.addTarget(baseX, 3.5, 0, 'soldier');
        this.addTarget(baseX - 1, 3.5, 0, 'basic');
        this.addTarget(baseX + 1, 3.5, 0, 'basic');
        
        // Top platform
        this.addBuilding(baseX - 1, 4.5, 0, 'wall');
        this.addBuilding(baseX + 1, 4.5, 0, 'wall');
        this.addBuilding(baseX, 5.5, 0, 'platform');
        
        // Top target
        this.addTarget(baseX, 6.2, 0, 'loot');
    }
    
    createLevel3() {
        // Hard level - castle with multiple soldiers
        const baseX = 30;
        
        // Castle structure
        this.addBuilding(baseX, 2, 0, 'castle');
        
        // Outer walls
        this.addBuilding(baseX - 4, 1, 0, 'wall');
        this.addBuilding(baseX + 4, 1, 0, 'wall');
        this.addBuilding(baseX, 1, -4, 'wall');
        this.addBuilding(baseX, 1, 4, 'wall');
        
        // Corner towers
        this.addBuilding(baseX - 3, 2, -3, 'tower');
        this.addBuilding(baseX + 3, 2, -3, 'tower');
        this.addBuilding(baseX - 3, 2, 3, 'tower');
        this.addBuilding(baseX + 3, 2, 3, 'tower');
        
        // Soldiers and targets
        this.addTarget(baseX, 4.5, 0, 'upgraded-soldier');
        this.addTarget(baseX - 2, 0.8, -2, 'soldier');
        this.addTarget(baseX + 2, 0.8, -2, 'soldier');
        this.addTarget(baseX - 2, 0.8, 2, 'basic');
        this.addTarget(baseX + 2, 0.8, 2, 'basic');
        this.addTarget(baseX, 0.5, 0, 'loot');
    }
    
    createRandomLevel() {
        // Procedurally generated level (using seeded random for consistency)
        const baseX = 20 + (this.levelNumber * 5);
        const complexity = Math.min(this.levelNumber, 5);
        
        // Base platform
        this.addBuilding(baseX, 0.15, 0, 'platform');
        
        // Random structures
        for (let i = 0; i < complexity; i++) {
            const angle = (i / complexity) * Math.PI * 2;
            const radius = 3;
            const x = baseX + Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            
            this.addBuilding(x, 1, z, this.random.next() > 0.5 ? 'wall' : 'tower');
            this.addTarget(x, 2.5, z, this.getRandomTargetType());
        }
        
        // Central target
        this.addBuilding(baseX, 2, 0, 'platform');
        this.addTarget(baseX, 3, 0, 'upgraded-soldier');
    }
    
    getRandomTargetType() {
        const types = ['basic', 'soldier', 'upgraded-soldier', 'loot'];
        return this.random.pick(types);
    }
    
    spawnBattlefieldScenery() {
        // CASTLE COURTYARD SETUP - Full enclosure at map edges
        const mapEdge = 72; // Distance to map edge (ground is 150x150, so 75 is edge)
        const wallHeight = 12; // Tall castle walls
        const wallLength = 12; // Length of each wall segment
        const gateWidth = 20; // Castle gate width
        
        // BUILD CASTLE WALLS AROUND THE PERIMETER - COMPLETE ENCLOSURE
        
        // North wall (behind targets - with main gate at the very edge)
        const northWallTotal = mapEdge * 2; // Total length needed
        const northWallSegments = Math.ceil((northWallTotal - gateWidth) / wallLength / 2);
        
        // Gate in center AT GROUND LEVEL
        this.medievalAssets.createCastleGate(
            new THREE.Vector3(0, 0, mapEdge),
            gateWidth, 18
        );
        
        // Left side walls (west of gate) - TIGHTLY CONNECTED
        for (let i = 1; i <= northWallSegments; i++) {
            const offset = -(gateWidth / 2) - (i - 0.5) * wallLength - 0.5; // Closer connection
            if (Math.abs(offset) < mapEdge - 3) { // Don't overlap corners
                this.medievalAssets.createStoneWall(
                    new THREE.Vector3(offset, 0, mapEdge),
                    wallLength, wallHeight, 0
                );
            }
        }
        
        // Right side walls (east of gate) - TIGHTLY CONNECTED
        for (let i = 1; i <= northWallSegments; i++) {
            const offset = (gateWidth / 2) + (i - 0.5) * wallLength + 0.5; // Closer connection
            if (Math.abs(offset) < mapEdge - 3) { // Don't overlap corners
                this.medievalAssets.createStoneWall(
                    new THREE.Vector3(offset, 0, mapEdge),
                    wallLength, wallHeight, 0
                );
            }
        }
        
        // South wall (behind catapult at map edge) - COMPLETE, NO GAPS
        const southWallSegments = Math.ceil(northWallTotal / wallLength);
        for (let i = 0; i < southWallSegments; i++) {
            const offset = -mapEdge + (i + 0.5) * wallLength - 0.5;
            if (offset < mapEdge - 3) {
                this.medievalAssets.createStoneWall(
                    new THREE.Vector3(offset, 0, -mapEdge),
                    wallLength, wallHeight, 0
                );
            }
        }
        
        // East wall (right side at map edge) - COMPLETE, NO GAPS
        const sideWallSegments = Math.ceil(northWallTotal / wallLength);
        for (let i = 0; i < sideWallSegments; i++) {
            const offset = -mapEdge + (i + 0.5) * wallLength - 0.5;
            if (offset < mapEdge - 3 && offset > -mapEdge + 3) {
                this.medievalAssets.createStoneWall(
                    new THREE.Vector3(mapEdge, 0, offset),
                    wallLength, wallHeight, Math.PI / 2
                );
            }
        }
        
        // West wall (left side at map edge) - COMPLETE, NO GAPS
        for (let i = 0; i < sideWallSegments; i++) {
            const offset = -mapEdge + (i + 0.5) * wallLength - 0.5;
            if (offset < mapEdge - 3 && offset > -mapEdge + 3) {
                this.medievalAssets.createStoneWall(
                    new THREE.Vector3(-mapEdge, 0, offset),
                    wallLength, wallHeight, Math.PI / 2
                );
            }
        }
        
        // Corner towers at map edges
        const cornerTowerHeight = 16;
        const cornerTowerRadius = 3.5;
        this.medievalAssets.createTower(
            new THREE.Vector3(mapEdge, 0, mapEdge),
            cornerTowerHeight, cornerTowerRadius
        );
        this.medievalAssets.createTower(
            new THREE.Vector3(-mapEdge, 0, mapEdge),
            cornerTowerHeight, cornerTowerRadius
        );
        this.medievalAssets.createTower(
            new THREE.Vector3(mapEdge, 0, -mapEdge),
            cornerTowerHeight, cornerTowerRadius
        );
        this.medievalAssets.createTower(
            new THREE.Vector3(-mapEdge, 0, -mapEdge),
            cornerTowerHeight, cornerTowerRadius
        );
        
        // SMART PLACEMENT SYSTEM - Zone-based distribution
        // Define zones along the walls for different object types
        const wallInset = 10; // Distance from wall edge
        const spacing = 15; // Spacing between objects
        
        // Zone 1: Training Area (North side, along gate)
        const trainingPositions = [
            { x: -50, z: 60 },
            { x: -35, z: 60 },
            { x: 35, z: 60 },
            { x: 50, z: 60 }
        ];
        
        trainingPositions.forEach(pos => {
            this.medievalAssets.createTrainingDummy(new THREE.Vector3(pos.x, 0, pos.z), 2.5);
        });
        
        // Zone 2: Weapon Storage (Corners)
        const weaponRackPositions = [
            { x: -65, z: 60 },
            { x: 65, z: 60 },
            { x: -65, z: -60 },
            { x: 65, z: -60 },
            { x: -55, z: 50 },
            { x: 55, z: 50 },
            { x: -55, z: -50 },
            { x: 55, z: -50 }
        ];
        
        weaponRackPositions.forEach(pos => {
            this.medievalAssets.createWeaponRack(new THREE.Vector3(pos.x, 0, pos.z), 6);
        });
        
        // Zone 3: Supply Storage (Barrel clusters)
        const barrelClusters = [
            { x: -62, z: 62 },
            { x: 62, z: 62 },
            { x: -62, z: -62 },
            { x: 62, z: -62 },
            { x: -60, z: 40 },
            { x: 60, z: 40 },
            { x: -60, z: -40 },
            { x: 60, z: -40 }
        ];
        
        barrelClusters.forEach(pos => {
            this.createBarrelStack(new THREE.Vector3(pos.x, 0, pos.z));
        });
        
        // Zone 4: Hay Storage (distributed along walls)
        const hayPositions = [
            { x: -45, z: 62 },
            { x: 45, z: 62 },
            { x: -62, z: 30 },
            { x: 62, z: 30 },
            { x: -62, z: -30 },
            { x: 62, z: -30 },
            { x: -45, z: -62 },
            { x: 45, z: -62 }
        ];
        
        hayPositions.forEach(pos => {
            this.medievalAssets.createHayBales(new THREE.Vector3(pos.x, 0, pos.z), 3);
        });
        
        // Zone 5: Banners (distributed evenly along all walls)
        const bannerColors = [0xDC143C, 0x4169E1, 0xFFD700, 0x32CD32, 0xFF6347];
        const bannerPositions = [
            { x: -mapEdge + wallInset, z: 0 },
            { x: -mapEdge + wallInset, z: 30 },
            { x: -mapEdge + wallInset, z: -30 },
            { x: mapEdge - wallInset, z: 0 },
            { x: mapEdge - wallInset, z: 30 },
            { x: mapEdge - wallInset, z: -30 },
            { x: 0, z: -mapEdge + wallInset },
            { x: -30, z: -mapEdge + wallInset },
            { x: 30, z: -mapEdge + wallInset },
            { x: -mapEdge + wallInset, z: mapEdge - wallInset },
            { x: mapEdge - wallInset, z: mapEdge - wallInset },
            { x: -30, z: mapEdge - wallInset },
            { x: 30, z: mapEdge - wallInset }
        ];
        
        bannerPositions.forEach((pos, i) => {
            this.medievalAssets.createBanner(
                new THREE.Vector3(pos.x, 0, pos.z), 
                5, 
                bannerColors[i % bannerColors.length]
            );
        });
        
        // Zone 6: Camp Area (tents and bonfires)
        const campPositions = [
            { x: -58, z: 58 },
            { x: 58, z: -58 },
            { x: -58, z: -58 },
            { x: 58, z: 58 },
            { x: -50, z: -50 },
            { x: 50, z: 50 }
        ];
        
        campPositions.forEach(pos => {
            this.medievalAssets.createTent(new THREE.Vector3(pos.x, 0, pos.z), 3);
        });
        
        // Bonfires near camps
        const bonfirePositions = [
            { x: -55, z: -55 },
            { x: 55, z: 55 },
            { x: -50, z: 45 },
            { x: 50, z: -45 },
            { x: -40, z: -60 },
            { x: 40, z: 60 }
        ];
        
        bonfirePositions.forEach(pos => {
            this.medievalAssets.createBonfire(new THREE.Vector3(pos.x, 0, pos.z), 1.5);
        });
        
        // Zone 7: Water Sources (wells and pond)
        const wellPositions = [
            { x: -35, z: 45 },
            { x: 35, z: -45 }
        ];
        
        wellPositions.forEach(pos => {
            this.medievalAssets.createWell(new THREE.Vector3(pos.x, 0, pos.z), 2.5);
        });
        
        // Pond in peaceful corner
        this.medievalAssets.createPond(new THREE.Vector3(-35, 0, -35), 5);
        
        // Zone 8: Additional towers for variety (mid-wall positions)
        const midWallTowers = [
            { x: 0, z: -mapEdge + 5 },
            { x: -40, z: mapEdge - 5 },
            { x: 40, z: mapEdge - 5 }
        ];
        
        midWallTowers.forEach(pos => {
            this.medievalAssets.createTower(
                new THREE.Vector3(pos.x, 0, pos.z), 
                14, 
                3
            );
        });
        
        // Zone 9: Fences for corralled areas
        const fencePositions = [
            { x: -25, z: 50, length: 8, height: 2, rotation: 0 },
            { x: 25, z: 50, length: 8, height: 2, rotation: 0 },
            { x: -25, z: -50, length: 8, height: 2, rotation: 0 },
            { x: 25, z: -50, length: 8, height: 2, rotation: 0 }
        ];
        
        fencePositions.forEach(fence => {
            this.medievalAssets.createFence(
                new THREE.Vector3(fence.x, 0, fence.z), 
                fence.length, 
                fence.height, 
                fence.rotation
            );
        });
        
        // Zone 10: Watchtowers (between corners and mid-wall)
        const watchtowerPositions = [
            { x: -mapEdge + 8, z: 40 },
            { x: -mapEdge + 8, z: -40 },
            { x: mapEdge - 8, z: 40 },
            { x: mapEdge - 8, z: -40 }
        ];
        
        watchtowerPositions.forEach(pos => {
            this.medievalAssets.createWatchtower(new THREE.Vector3(pos.x, 0, pos.z), 8);
        });
        
        console.log(`🏰 Spawned castle courtyard with ${this.medievalAssets.assets.length} assets (doubled with smart placement)`);
    }
    
    createBarrelStack(centerPosition) {
        // Create a stack of barrels (courtyard storage)
        // Bottom layer - 3 barrels
        this.medievalAssets.createBarrel(
            new THREE.Vector3(centerPosition.x - 1, 0, centerPosition.z),
            0.8, 1.5
        );
        this.medievalAssets.createBarrel(
            new THREE.Vector3(centerPosition.x + 1, 0, centerPosition.z),
            0.8, 1.5
        );
        this.medievalAssets.createBarrel(
            new THREE.Vector3(centerPosition.x, 0, centerPosition.z + 1),
            0.8, 1.5
        );
        
        // Additional scattered barrels
        this.medievalAssets.createBarrel(
            new THREE.Vector3(centerPosition.x + 2, 0, centerPosition.z - 1),
            0.8, 1.5
        );
        this.medievalAssets.createBarrel(
            new THREE.Vector3(centerPosition.x - 2, 0, centerPosition.z + 1),
            0.8, 1.5
        );
    }
    
    addBuilding(x, y, z, type) {
        const building = new Building(
            this.scene,
            this.physicsWorld,
            new THREE.Vector3(x, y, z),
            type
        );
        this.buildings.push(building);
        return building;
    }
    
    addTarget(x, y, z, type) {
        const target = new Target(
            this.scene,
            this.physicsWorld,
            new THREE.Vector3(x, y, z),
            type
        );
        this.targets.push(target);
        return target;
    }
    
    update(deltaTime) {
        // Update all targets
        this.targets.forEach(target => target.update(deltaTime));
        
        // Update all buildings
        this.buildings.forEach(building => building.update(deltaTime));
        
        // Update medieval assets (for animations like bonfires)
        this.medievalAssets.update(deltaTime);
        
        // Remove destroyed targets
        this.targets = this.targets.filter(target => !target.isDestroyed);
        
        // Remove destroyed buildings
        this.buildings = this.buildings.filter(building => !building.isDestroyed);
    }
    
    getRemainingTargets() {
        return this.targets.length;
    }
    
    checkCollisions(projectile) {
        let totalScore = 0;
        
        // Check collisions with targets
        this.targets.forEach(target => {
            if (target.isDestroyed) return;
            
            const distance = projectile.body.position.distanceTo(target.body.position);
            if (distance < 1.5) {
                const destroyed = target.takeDamage(50);
                if (destroyed) {
                    totalScore += target.score;
                }
            }
        });
        
        return totalScore;
    }
    
    clear() {
        // Remove all targets
        this.targets.forEach(target => {
            if (!target.isDestroyed) {
                target.destroy();
            }
        });
        this.targets = [];
        
        // Remove all buildings
        this.buildings.forEach(building => {
            if (!building.isDestroyed) {
                building.destroy();
            }
        });
        this.buildings = [];
        
        // Clear medieval assets
        this.medievalAssets.clear();
        
        // Clear collision callbacks to prevent memory leaks
        this.physicsWorld.clearCollisionCallbacks();
        
        // Re-register our collision handler after clearing
        this.setupCollisionHandling();
    }
}

