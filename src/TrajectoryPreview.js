import * as THREE from 'three';

export class TrajectoryPreview {
    constructor(scene) {
        this.scene = scene;
        this.points = [];
        this.line = null;
        this.numPoints = 120; // Increased from 50 for longer trajectory
        this.createLine();
    }
    
    createLine() {
        const geometry = new THREE.BufferGeometry();
        const material = new THREE.LineBasicMaterial({
            color: 0xffff00,
            linewidth: 2,   
            transparent: true,
            opacity: 1
        });
        
        // Initialize with empty points
        const positions = new Float32Array(this.numPoints * 3);
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        this.line = new THREE.Line(geometry, material);
        this.scene.add(this.line);
        this.hide();
    }
    
    update(startPos, velocity, gravity = 9.82) {
        const positions = this.line.geometry.attributes.position.array;
        const timeStep = 0.08; // Increased from 0.05 for longer trajectory reach
        let hitGround = false;
        let validPoints = 0;
        
        for (let i = 0; i < this.numPoints; i++) {
            const t = i * timeStep;
            
            // Projectile motion equations
            const x = startPos.x + velocity.x * t;
            const y = startPos.y + velocity.y * t - 0.5 * gravity * t * t;
            const z = startPos.z + velocity.z * t;
            
            // Stop if trajectory hits ground
            if (y < 0.1) {
                hitGround = true;
                positions[i * 3] = x;
                positions[i * 3 + 1] = 0.1;
                positions[i * 3 + 2] = z;
                validPoints = i + 1;
                break;
            }
            
            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;
            validPoints = i + 1;
        }
        
        // Hide remaining points by setting them to the last valid position
        if (hitGround) {
            for (let i = validPoints; i < this.numPoints; i++) {
                positions[i * 3] = positions[(validPoints - 1) * 3];
                positions[i * 3 + 1] = positions[(validPoints - 1) * 3 + 1];
                positions[i * 3 + 2] = positions[(validPoints - 1) * 3 + 2];
            }
        }
        
        this.line.geometry.attributes.position.needsUpdate = true;
    }
    
    show() {
        this.line.visible = true;
    }
    
    hide() {
        this.line.visible = false;
    }
}

