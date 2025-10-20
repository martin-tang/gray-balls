import * as THREE from 'three';
import { Target } from './objects/Target.js';
import { Building } from './objects/Building.js';

export class Level {
    constructor(scene, physicsWorld, levelNumber = 1) {
        this.scene = scene;
        this.physicsWorld = physicsWorld;
        this.levelNumber = levelNumber;
        this.targets = [];
        this.buildings = [];
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
        // Procedurally generated level
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
            
            this.addBuilding(x, 1, z, Math.random() > 0.5 ? 'wall' : 'tower');
            this.addTarget(x, 2.5, z, this.getRandomTargetType());
        }
        
        // Central target
        this.addBuilding(baseX, 2, 0, 'platform');
        this.addTarget(baseX, 3, 0, 'upgraded-soldier');
    }
    
    getRandomTargetType() {
        const types = ['basic', 'soldier', 'upgraded-soldier', 'loot'];
        return types[Math.floor(Math.random() * types.length)];
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
        
        // Remove destroyed targets
        this.targets = this.targets.filter(target => !target.isDestroyed);
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
    }
}

