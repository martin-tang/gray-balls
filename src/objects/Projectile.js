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
        // Visual - Stone cannonball with texture
        const radius = 0.4;
        const geometry = new THREE.SphereGeometry(radius, 32, 32);
        
        // Create stone texture for cannonball
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        // Base stone gray color
        ctx.fillStyle = '#4A4A4A';
        ctx.fillRect(0, 0, 256, 256);
        
        // Add stone texture variations
        for (let i = 0; i < 2000; i++) {
            const x = Math.random() * 256;
            const y = Math.random() * 256;
            const brightness = Math.random() * 40 - 20;
            const gray = 74 + brightness;
            ctx.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
            ctx.fillRect(x, y, 2, 2);
        }
        
        // Add some darker spots and cracks
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * 256;
            const y = Math.random() * 256;
            const size = 5 + Math.random() * 10;
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
            gradient.addColorStop(0, 'rgba(30, 30, 30, 0.5)');
            gradient.addColorStop(1, 'rgba(30, 30, 30, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Add scratches/cracks
        ctx.strokeStyle = 'rgba(20, 20, 20, 0.4)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 30; i++) {
            ctx.beginPath();
            const x = Math.random() * 256;
            const y = Math.random() * 256;
            ctx.moveTo(x, y);
            ctx.lineTo(x + (Math.random() - 0.5) * 30, y + (Math.random() - 0.5) * 30);
            ctx.stroke();
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        
        const material = new THREE.MeshStandardMaterial({ 
            map: texture,
            color: 0xFFFFFF,
            roughness: 0.95,
            metalness: 0.1,
            bumpMap: texture,
            bumpScale: 0.02
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
            linearDamping: 0.0,  // No air resistance - matches trajectory preview
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

