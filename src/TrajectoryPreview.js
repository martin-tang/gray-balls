import * as THREE from 'three';

export class TrajectoryPreview {
    constructor(scene) {
        this.scene = scene;
        this.points = [];
        this.line = null;
        this.numPoints = 120; // Increased from 50 for longer trajectory
        this.tubeRadius = 0.075; // Tube radius for visibility
        this.createLine();
    }
    
    createLine() {
        // Create a thick tube material - bright yellow with emissive glow
        const material = new THREE.MeshStandardMaterial({
            color: 0xffff00,
            emissive: 0xffff00,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.8,
            roughness: 0.3,
            metalness: 0.1
        });
        
        // Create initial curve with dummy points
        const dummyPoints = [];
        for (let i = 0; i < this.numPoints; i++) {
            dummyPoints.push(new THREE.Vector3(0, 0, 0));
        }
        const curve = new THREE.CatmullRomCurve3(dummyPoints);
        
        // Create tube geometry from curve
        const geometry = new THREE.TubeGeometry(curve, this.numPoints - 1, this.tubeRadius, 8, false);
        
        this.line = new THREE.Mesh(geometry, material);
        this.line.castShadow = false; // Don't cast shadows for performance
        this.scene.add(this.line);
        this.hide();
    }
    
    update(startPos, velocity, gravity = 9.82) {
        const points = [];
        const timeStep = 0.08; // Increased from 0.05 for longer trajectory reach
        let hitGround = false;
        let validPoints = 0;
        
        // Calculate trajectory points
        for (let i = 0; i < this.numPoints; i++) {
            const t = i * timeStep;
            
            // Projectile motion equations
            const x = startPos.x + velocity.x * t;
            const y = startPos.y + velocity.y * t - 0.5 * gravity * t * t;
            const z = startPos.z + velocity.z * t;
            
            // Stop if trajectory hits ground
            if (y < 0.1) {
                hitGround = true;
                points.push(new THREE.Vector3(x, 0.1, z));
                validPoints = i + 1;
                break;
            }
            
            points.push(new THREE.Vector3(x, y, z));
            validPoints = i + 1;
        }
        
        // Fill remaining points with last position if hit ground early
        if (hitGround && points.length > 0) {
            const lastPoint = points[points.length - 1];
            while (points.length < this.numPoints) {
                points.push(lastPoint.clone());
            }
        }
        
        // Ensure we have enough points for the curve (minimum 2)
        if (points.length < 2) {
            points.push(startPos.clone());
            points.push(startPos.clone());
        }
        
        // Create new curve from calculated points
        const curve = new THREE.CatmullRomCurve3(points);
        
        // Recreate tube geometry with new curve
        const newGeometry = new THREE.TubeGeometry(curve, Math.max(validPoints - 1, 1), this.tubeRadius, 8, false);
        
        // Dispose old geometry and replace
        this.line.geometry.dispose();
        this.line.geometry = newGeometry;
    }
    
    show() {
        this.line.visible = true;
    }
    
    hide() {
        this.line.visible = false;
    }
}


