import * as THREE from 'three';

export class Catapult {
    constructor(scene, position) {
        this.scene = scene;
        this.position = position;
        this.aimAngleH = Math.PI / 2; // Horizontal angle (yaw) - pointing straight forward (+X direction)
        this.aimAngleV = Math.PI / 4; // Vertical angle (pitch), default 45 degrees
        
        this.base = null;
        this.arm = null;
        this.bucket = null;
        
        this.minVerticalAngle = 0.1; // Minimum ~6 degrees above horizontal (realistic catapult limit)
        this.maxVerticalAngle = Math.PI / 2 - 0.01; // Nearly straight up (~89 degrees)
        
        this.create();
    }
    
    create() {
        const group = new THREE.Group();
        
        // Base platform
        const baseGeometry = new THREE.CylinderGeometry(1.5, 2, 0.5, 8);
        const baseMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x654321,
            roughness: 0.9
        });
        this.base = new THREE.Mesh(baseGeometry, baseMaterial);
        this.base.castShadow = true;
        this.base.receiveShadow = true;
        group.add(this.base);
        
        // Support pillars
        const pillarGeometry = new THREE.CylinderGeometry(0.15, 0.15, 2, 8);
        const pillarMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        
        const pillar1 = new THREE.Mesh(pillarGeometry, pillarMaterial);
        pillar1.position.set(-0.5, 1, 0);
        pillar1.castShadow = true;
        group.add(pillar1);
        
        const pillar2 = new THREE.Mesh(pillarGeometry, pillarMaterial);
        pillar2.position.set(0.5, 1, 0);
        pillar2.castShadow = true;
        group.add(pillar2);
        
        // Catapult arm (will rotate)
        const armGroup = new THREE.Group();
        armGroup.position.set(0, 1.8, 0);
        
        const armGeometry = new THREE.BoxGeometry(0.3, 3, 0.3);
        this.arm = new THREE.Mesh(armGeometry, pillarMaterial);
        this.arm.position.set(0, 0, 0);
        this.arm.castShadow = true;
        armGroup.add(this.arm);
        
        // Bucket at the end of arm
        const bucketGeometry = new THREE.SphereGeometry(0.4, 8, 8);
        const bucketMaterial = new THREE.MeshStandardMaterial({ color: 0x4a4a4a });
        this.bucket = new THREE.Mesh(bucketGeometry, bucketMaterial);
        this.bucket.position.set(0, 1.5, 0);
        this.bucket.castShadow = true;
        armGroup.add(this.bucket);
        
        group.add(armGroup);
        this.armGroup = armGroup;
        
        // Position the entire catapult
        group.position.copy(this.position);
        this.group = group;
        this.scene.add(group);
    }
    
    setAim(horizontalAngle, verticalAngle) {
        this.aimAngleH = horizontalAngle;
        this.aimAngleV = Math.max(
            this.minVerticalAngle, 
            Math.min(this.maxVerticalAngle, verticalAngle)
        );
        
        this.updateVisual();
    }
    
    updateVisual() {
        // Rotate the entire catapult horizontally (around Y axis)
        this.group.rotation.y = this.aimAngleH;
        
        // Tilt the arm vertically (around X axis for pitch)
        // Offset by PI/2 because the arm starts pointing up, and we want 0 degrees to be horizontal forward
        this.armGroup.rotation.x = this.aimAngleV - Math.PI / 2;
    }
    
    getProjectileStartPosition() {
        // Calculate world position of the bucket
        const bucketWorldPos = new THREE.Vector3();
        this.bucket.getWorldPosition(bucketWorldPos);
        return bucketWorldPos;
    }
    
    getProjectileVelocity(power) {
        // Calculate velocity direction based on aim angles
        const direction = new THREE.Vector3(
            Math.sin(this.aimAngleH) * Math.cos(this.aimAngleV),
            Math.sin(this.aimAngleV),
            Math.cos(this.aimAngleH) * Math.cos(this.aimAngleV)
        );
        
        direction.normalize();
        direction.multiplyScalar(power);
        
        return direction;
    }
}

