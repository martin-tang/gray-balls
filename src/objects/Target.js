import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class Target {
    constructor(scene, physicsWorld, position, type = 'basic') {
        this.scene = scene;
        this.physicsWorld = physicsWorld;
        this.position = position;
        this.type = type;
        this.mesh = null;
        this.body = null;
        this.isDestroyed = false;
        this.health = this.getHealthForType(type);
        this.maxHealth = this.health;
        this.score = this.getScoreForType(type);
        
        this.create();
    }
    
    getHealthForType(type) {
        const healthMap = {
            'basic': 50,
            'soldier': 100,
            'upgraded-soldier': 150,
            'loot': 30
        };
        return healthMap[type] || 50;
    }
    
    getScoreForType(type) {
        const scoreMap = {
            'basic': 100,
            'soldier': 200,
            'upgraded-soldier': 300,
            'loot': 150
        };
        return scoreMap[type] || 100;
    }
    
    create() {
        let geometry, material;
        const size = 0.8;
        
        switch(this.type) {
            case 'soldier':
                // Create a simple soldier shape (cylinder with sphere head)
                const group = new THREE.Group();
                
                const bodyGeo = new THREE.CylinderGeometry(0.3, 0.4, 1.2, 8);
                const bodyMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
                const body = new THREE.Mesh(bodyGeo, bodyMat);
                body.position.y = 0.6;
                body.castShadow = true;
                group.add(body);
                
                const headGeo = new THREE.SphereGeometry(0.25, 8, 8);
                const headMat = new THREE.MeshStandardMaterial({ color: 0xffdbac });
                const head = new THREE.Mesh(headGeo, headMat);
                head.position.y = 1.4;
                head.castShadow = true;
                group.add(head);
                
                this.mesh = group;
                
                geometry = new CANNON.Cylinder(0.3, 0.4, 1.2, 8);
                break;
                
            case 'upgraded-soldier':
                // Armored soldier (darker color)
                const ugroup = new THREE.Group();
                
                const ubodyGeo = new THREE.CylinderGeometry(0.35, 0.45, 1.3, 8);
                const ubodyMat = new THREE.MeshStandardMaterial({ 
                    color: 0x4a4a4a,
                    metalness: 0.6,
                    roughness: 0.4
                });
                const ubody = new THREE.Mesh(ubodyGeo, ubodyMat);
                ubody.position.y = 0.65;
                ubody.castShadow = true;
                ugroup.add(ubody);
                
                const uheadGeo = new THREE.SphereGeometry(0.25, 8, 8);
                const uheadMat = new THREE.MeshStandardMaterial({ color: 0x808080 });
                const uhead = new THREE.Mesh(uheadGeo, uheadMat);
                uhead.position.y = 1.5;
                uhead.castShadow = true;
                ugroup.add(uhead);
                
                this.mesh = ugroup;
                geometry = new CANNON.Cylinder(0.35, 0.45, 1.3, 8);
                break;
                
            case 'loot':
                // Golden chest
                const chestGeo = new THREE.BoxGeometry(size, size * 0.6, size * 0.7);
                const chestMat = new THREE.MeshStandardMaterial({ 
                    color: 0xFFD700,
                    metalness: 0.7,
                    roughness: 0.3
                });
                this.mesh = new THREE.Mesh(chestGeo, chestMat);
                this.mesh.castShadow = true;
                this.mesh.receiveShadow = true;
                
                geometry = new CANNON.Box(new CANNON.Vec3(size/2, size * 0.3, size * 0.35));
                break;
                
            default: // 'basic' target
                // Target board (circular target)
                const targetGeo = new THREE.CylinderGeometry(size, size, 0.2, 16);
                const targetMat = new THREE.MeshStandardMaterial({ 
                    color: 0xff0000,
                    roughness: 0.7
                });
                this.mesh = new THREE.Mesh(targetGeo, targetMat);
                this.mesh.castShadow = true;
                this.mesh.receiveShadow = true;
                
                // Add white circle for target appearance
                const ringGeo = new THREE.CylinderGeometry(size * 0.6, size * 0.6, 0.21, 16);
                const ringMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
                const ring = new THREE.Mesh(ringGeo, ringMat);
                this.mesh.add(ring);
                
                geometry = new CANNON.Cylinder(size, size, 0.2, 16);
                break;
        }
        
        this.mesh.position.copy(this.position);
        this.scene.add(this.mesh);
        
        // Physics body
        this.body = new CANNON.Body({
            mass: this.type === 'loot' ? 2 : 5,
            shape: geometry,
            position: new CANNON.Vec3(this.position.x, this.position.y, this.position.z),
            material: this.physicsWorld.objectMaterial,
            sleepSpeedLimit: 0.1, // Lower threshold for sleep
            sleepTimeLimit: 0.1,   // Sleep faster
            linearDamping: 0.01,   // Reduce bouncing
            angularDamping: 0.01   // Reduce rotation
        });
        
        // Freeze object immediately - no bouncing on spawn
        this.body.velocity.set(0, 0, 0);
        this.body.angularVelocity.set(0, 0, 0);
        this.body.sleep();
        
        this.physicsWorld.addBody(this.body);
    }
    
    update(deltaTime) {
        if (this.isDestroyed) return;
        
        // Sync visual with physics
        this.mesh.position.copy(this.body.position);
        this.mesh.quaternion.copy(this.body.quaternion);
        
        // Check if fallen off the world
        if (this.body.position.y < -5) {
            this.destroy();
        }
    }
    
    takeDamage(amount) {
        this.health -= amount;
        
        // Visual feedback - flash red
        if (this.health > 0) {
            this.flashDamage();
        } else {
            this.destroy();
        }
        
        return this.health <= 0;
    }
    
    flashDamage() {
        // Simple color flash effect
        const originalColor = this.mesh.material?.color?.getHex() || 0xffffff;
        if (this.mesh.material) {
            this.mesh.material.color.setHex(0xff0000);
            setTimeout(() => {
                if (this.mesh.material) {
                    this.mesh.material.color.setHex(originalColor);
                }
            }, 100);
        }
    }
    
    destroy() {
        if (this.isDestroyed) return false;
        
        this.isDestroyed = true;
        
        // Create destruction effect (simple particles)
        this.createDestructionEffect();
        
        // Properly dispose of Three.js resources to prevent memory leaks
        if (this.mesh) {
            if (this.mesh.geometry) {
                this.mesh.geometry.dispose();
            }
            if (this.mesh.material) {
                if (Array.isArray(this.mesh.material)) {
                    this.mesh.material.forEach(mat => mat.dispose());
                } else {
                    this.mesh.material.dispose();
                }
            }
            this.scene.remove(this.mesh);
        }
        
        if (this.body) {
            this.physicsWorld.removeBody(this.body);
        }
        
        return true;
    }
    
    createDestructionEffect() {
        // Create simple particle effect
        const particleCount = 10;
        const particles = new THREE.Group();
        
        for (let i = 0; i < particleCount; i++) {
            const particleGeo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
            const particleMat = new THREE.MeshStandardMaterial({ 
                color: this.type === 'loot' ? 0xFFD700 : 0x8B4513 
            });
            const particle = new THREE.Mesh(particleGeo, particleMat);
            
            particle.position.copy(this.mesh.position);
            particle.position.x += (Math.random() - 0.5) * 2;
            particle.position.y += (Math.random() - 0.5) * 2;
            particle.position.z += (Math.random() - 0.5) * 2;
            
            this.scene.add(particle);
            
            // Animate particle falling
            const velocity = {
                x: (Math.random() - 0.5) * 5,
                y: Math.random() * 5,
                z: (Math.random() - 0.5) * 5
            };
            
            const animate = () => {
                particle.position.x += velocity.x * 0.016;
                particle.position.y += velocity.y * 0.016;
                particle.position.z += velocity.z * 0.016;
                velocity.y -= 9.82 * 0.016;
                
                particle.rotation.x += 0.1;
                particle.rotation.y += 0.1;
                
                if (particle.position.y > -5) {
                    requestAnimationFrame(animate);
                } else {
                    this.scene.remove(particle);
                    particle.geometry.dispose();
                    particle.material.dispose();
                }
            };
            
            animate();
        }
    }
}

