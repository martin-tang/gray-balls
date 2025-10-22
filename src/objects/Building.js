import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class Building {
    constructor(scene, physicsWorld, position, buildingType = 'wall') {
        this.scene = scene;
        this.physicsWorld = physicsWorld;
        this.position = position;
        this.buildingType = buildingType;
        this.mesh = null;
        this.body = null;
        this.isDestroyed = false;
        
        // Material and hit points system
        this.material = this.getMaterialType(buildingType);
        this.maxHitPoints = this.getMaxHitPoints();
        this.hitPoints = this.maxHitPoints;
        this.damageThreshold = 20; // Minimum force required to damage
        
        this.create();
    }
    
    getMaterialType(buildingType) {
        // Determine if building is wood or stone
        switch(buildingType) {
            case 'platform':
                return 'wood';
            case 'tower':
            case 'wall':
            case 'castle':
                return 'stone';
            default:
                return 'wood';
        }
    }
    
    getMaxHitPoints() {
        // Set hit points based on material and building type
        const baseHP = {
            'wood': 100,
            'stone': 300
        };
        
        const typeMultiplier = {
            'platform': 0.8,
            'wall': 1.0,
            'tower': 1.5,
            'castle': 3.0
        };
        
        const base = baseHP[this.material] || 100;
        const multiplier = typeMultiplier[this.buildingType] || 1.0;
        
        return base * multiplier;
    }
    
    create() {
        let geometry, material, physicsShape;
        
        switch(this.buildingType) {
            case 'wall':
                geometry = new THREE.BoxGeometry(3, 2, 0.5);
                material = new THREE.MeshStandardMaterial({ 
                    color: 0x808080,
                    roughness: 0.9
                });
                physicsShape = new CANNON.Box(new CANNON.Vec3(1.5, 1, 0.25));
                break;
                
            case 'tower':
                geometry = new THREE.CylinderGeometry(0.8, 1, 4, 8);
                material = new THREE.MeshStandardMaterial({ 
                    color: 0x654321,
                    roughness: 0.8
                });
                physicsShape = new CANNON.Cylinder(0.8, 1, 4, 8);
                break;
                
            case 'castle':
                // Create a compound castle structure
                const group = new THREE.Group();
                
                // Main body
                const mainGeo = new THREE.BoxGeometry(4, 3, 4);
                const mainMat = new THREE.MeshStandardMaterial({ color: 0x696969 });
                const main = new THREE.Mesh(mainGeo, mainMat);
                main.position.y = 1.5;
                main.castShadow = true;
                main.receiveShadow = true;
                group.add(main);
                
                // Battlements
                for (let i = -1; i <= 1; i++) {
                    for (let j = -1; j <= 1; j++) {
                        if (Math.abs(i) + Math.abs(j) < 2) continue;
                        const battlement = new THREE.Mesh(
                            new THREE.BoxGeometry(0.6, 0.8, 0.6),
                            mainMat
                        );
                        battlement.position.set(i * 1.7, 3.4, j * 1.7);
                        battlement.castShadow = true;
                        group.add(battlement);
                    }
                }
                
                this.mesh = group;
                this.mesh.position.copy(this.position);
                this.scene.add(this.mesh);
                
                this.body = new CANNON.Body({
                    mass: 50,
                    shape: new CANNON.Box(new CANNON.Vec3(2, 1.5, 2)),
                    position: new CANNON.Vec3(this.position.x, this.position.y + 1.5, this.position.z),
                    material: this.physicsWorld.objectMaterial
                });
                
                // Prevent bouncing on spawn
                this.body.velocity.set(0, 0, 0);
                this.body.angularVelocity.set(0, 0, 0);
                this.body.sleep();
                
                this.physicsWorld.addBody(this.body);
                return;
                
            case 'platform':
                geometry = new THREE.BoxGeometry(3, 0.3, 3);
                material = new THREE.MeshStandardMaterial({ 
                    color: 0x8B4513,
                    roughness: 0.8
                });
                physicsShape = new CANNON.Box(new CANNON.Vec3(1.5, 0.15, 1.5));
                break;
                
            default:
                geometry = new THREE.BoxGeometry(2, 2, 2);
                material = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
                physicsShape = new CANNON.Box(new CANNON.Vec3(1, 1, 1));
        }
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.scene.add(this.mesh);
        
        // Physics body
        const mass = this.buildingType === 'platform' || this.buildingType === 'wall' ? 10 : 20;
        this.body = new CANNON.Body({
            mass: mass,
            shape: physicsShape,
            position: new CANNON.Vec3(this.position.x, this.position.y, this.position.z),
            material: this.physicsWorld.objectMaterial
        });
        
        // Prevent bouncing on spawn
        this.body.velocity.set(0, 0, 0);
        this.body.angularVelocity.set(0, 0, 0);
        this.body.sleep();
        
        this.physicsWorld.addBody(this.body);
    }
    
    takeDamage(impactForce) {
        // Calculate damage based on impact force
        if (impactForce < this.damageThreshold) {
            return false; // No damage if below threshold
        }
        
        // Calculate damage: force above threshold translates to damage
        const damage = (impactForce - this.damageThreshold) * 2;
        this.hitPoints -= damage;
        
        console.log(`💥 ${this.buildingType} (${this.material}) hit! Force: ${impactForce.toFixed(1)}, Damage: ${damage.toFixed(1)}, HP: ${this.hitPoints.toFixed(1)}/${this.maxHitPoints}`);
        
        // Visual feedback - change color based on damage
        this.updateDamageVisuals();
        
        // Check if destroyed
        if (this.hitPoints <= 0) {
            this.destroy();
            return true;
        }
        
        return false;
    }
    
    updateDamageVisuals() {
        if (this.isDestroyed) return;
        
        // Calculate health percentage
        const healthPercent = this.hitPoints / this.maxHitPoints;
        
        // Get material(s) and update color based on damage
        const updateMaterialColor = (material) => {
            // Store original color if not already stored
            if (!material.userData.originalColor) {
                material.userData.originalColor = material.color.clone();
            }
            
            // Interpolate towards darker/reddish color as damage increases
            const originalColor = material.userData.originalColor;
            const damageColor = new THREE.Color(0.6, 0.2, 0.1); // Dark reddish-brown for damage
            
            material.color.lerpColors(damageColor, originalColor, healthPercent);
        };
        
        // Handle both single mesh and group (castle)
        if (this.mesh.type === 'Group') {
            this.mesh.traverse((child) => {
                if (child.isMesh && child.material) {
                    updateMaterialColor(child.material);
                }
            });
        } else if (this.mesh.material) {
            updateMaterialColor(this.mesh.material);
        }
    }
    
    update(deltaTime) {
        if (this.isDestroyed) return;
        
        // Sync visual with physics
        this.mesh.position.copy(this.body.position);
        this.mesh.quaternion.copy(this.body.quaternion);
        
        // Remove if fallen off the world
        if (this.body.position.y < -5) {
            this.destroy();
        }
    }
    
    destroy() {
        if (this.isDestroyed) return;
        
        console.log(`💀 ${this.buildingType} (${this.material}) destroyed!`);
        
        this.isDestroyed = true;
        this.scene.remove(this.mesh);
        this.physicsWorld.removeBody(this.body);
    }
}

