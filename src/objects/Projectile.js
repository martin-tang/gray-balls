import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class Projectile {
    constructor(scene, physicsWorld, startPosition, velocity) {
        this.scene = scene;
        this.physicsWorld = physicsWorld;
        this.mesh = null;
        this.body = null;
        this.isActive = true;
        this.lifetime = 0;
        this.maxLifetime = 10; // Remove after 10 seconds
        
        this.create(startPosition, velocity);
    }
    
    create(startPosition, velocity) {
        // Visual
        const radius = 0.4;
        const geometry = new THREE.SphereGeometry(radius, 16, 16);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x2a2a2a,
            roughness: 0.8,
            metalness: 0.2
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.position.copy(startPosition);
        this.scene.add(this.mesh);
        
        // Physics
        const shape = new CANNON.Sphere(radius);
        this.body = new CANNON.Body({
            mass: 10,
            shape: shape,
            position: new CANNON.Vec3(startPosition.x, startPosition.y, startPosition.z),
            material: this.physicsWorld.projectileMaterial,
            linearDamping: 0.01,
            angularDamping: 0.01
        });
        
        this.body.velocity.set(velocity.x, velocity.y, velocity.z);
        this.physicsWorld.addBody(this.body);
        
        // Add some spin for realism
        this.body.angularVelocity.set(
            Math.random() - 0.5,
            Math.random() - 0.5,
            Math.random() - 0.5
        );
    }
    
    update(deltaTime) {
        if (!this.isActive) return;
        
        // Sync visual with physics
        this.mesh.position.copy(this.body.position);
        this.mesh.quaternion.copy(this.body.quaternion);
        
        // Update lifetime
        this.lifetime += deltaTime;
        
        // Remove if too old or fell too far
        if (this.lifetime > this.maxLifetime || this.body.position.y < -10) {
            this.remove();
        }
    }
    
    remove() {
        if (!this.isActive) return;
        
        this.isActive = false;
        this.scene.remove(this.mesh);
        this.physicsWorld.removeBody(this.body);
        
        // Clean up geometry and material
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
    }
}

