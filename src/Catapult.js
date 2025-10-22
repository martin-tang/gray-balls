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
        this.loadedBall = null; // The ball sitting in the catapult
        
        this.minVerticalAngle = 0.1; // Minimum ~6 degrees above horizontal (realistic catapult limit)
        this.maxVerticalAngle = Math.PI / 2 - 0.01; // Nearly straight up (~89 degrees)
        
        this.create();
    }
    
    create() {
        const group = new THREE.Group();
        
        // Material definitions
        const woodMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x654321,
            roughness: 0.9,
            flatShading: true
        });
        const darkWoodMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x4A2511,
            roughness: 0.95,
            flatShading: true
        });
        const metalMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x5A5A5A,
            roughness: 0.4,
            metalness: 0.7,
            flatShading: true
        });
        const ropeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8B7355,
            roughness: 0.95
        });
        
        // Base platform - larger and more detailed
        const baseGeo = new THREE.BoxGeometry(3, 0.4, 2.5);
        this.base = new THREE.Mesh(baseGeo, woodMaterial);
        this.base.position.y = 0.2;
        this.base.castShadow = true;
        this.base.receiveShadow = true;
        group.add(this.base);
        
        // Wooden planks on base
        for (let i = 0; i < 5; i++) {
            const plankGeo = new THREE.BoxGeometry(0.5, 0.08, 2.5);
            const plank = new THREE.Mesh(plankGeo, darkWoodMaterial);
            plank.position.set(-1.25 + i * 0.65, 0.44, 0);
            plank.castShadow = true;
            group.add(plank);
        }
        
        // Wheels (4 wheels for stability)
        const wheelPositions = [
            [-1.2, 0, -1.1],
            [1.2, 0, -1.1],
            [-1.2, 0, 1.1],
            [1.2, 0, 1.1]
        ];
        
        wheelPositions.forEach(([x, y, z]) => {
            const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.2, 12);
            const wheel = new THREE.Mesh(wheelGeo, darkWoodMaterial);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(x, y + 0.4, z);
            wheel.castShadow = true;
            group.add(wheel);
            
            // Wheel hub
            const hubGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.25, 8);
            const hub = new THREE.Mesh(hubGeo, metalMaterial);
            hub.rotation.z = Math.PI / 2;
            hub.position.set(x, y + 0.4, z);
            hub.castShadow = true;
            group.add(hub);
            
            // Wheel spokes
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                const spokeGeo = new THREE.BoxGeometry(0.08, 0.35, 0.08);
                const spoke = new THREE.Mesh(spokeGeo, darkWoodMaterial);
                spoke.position.set(x, y + 0.4 + Math.sin(angle) * 0.15, z + Math.cos(angle) * 0.15);
                spoke.rotation.x = angle;
                group.add(spoke);
            }
        });
        
        // A-frame support structure (both sides)
        const framePositions = [
            { x: -0.8, z: 0, angle: 0 },
            { x: 0.8, z: 0, angle: 0 }
        ];
        
        framePositions.forEach(({x, z, angle}) => {
            // Vertical supports (A-frame)
            const supportGeo = new THREE.BoxGeometry(0.2, 3.5, 0.2);
            
            // Left leg of A-frame
            const leftSupport = new THREE.Mesh(supportGeo, woodMaterial);
            leftSupport.position.set(x - 0.4, 1.75, z);
            leftSupport.rotation.z = 0.15;
            leftSupport.castShadow = true;
            group.add(leftSupport);
            
            // Right leg of A-frame
            const rightSupport = new THREE.Mesh(supportGeo, woodMaterial);
            rightSupport.position.set(x + 0.4, 1.75, z);
            rightSupport.rotation.z = -0.15;
            rightSupport.castShadow = true;
            group.add(rightSupport);
            
            // Cross brace
            const braceGeo = new THREE.BoxGeometry(0.15, 1.2, 0.15);
            const brace = new THREE.Mesh(braceGeo, darkWoodMaterial);
            brace.position.set(x, 2, z);
            brace.rotation.z = Math.PI / 2;
            brace.castShadow = true;
            group.add(brace);
            
            // Metal reinforcement
            const reinforceGeo = new THREE.BoxGeometry(1, 0.15, 0.15);
            const reinforce = new THREE.Mesh(reinforceGeo, metalMaterial);
            reinforce.position.set(x, 3.2, z);
            reinforce.castShadow = true;
            group.add(reinforce);
        });
        
        // Connecting beams between A-frames
        const connectGeo1 = new THREE.BoxGeometry(0.15, 0.15, 1.8);
        const topBeam = new THREE.Mesh(connectGeo1, woodMaterial);
        topBeam.position.set(0, 3.2, 0);
        topBeam.castShadow = true;
        group.add(topBeam);
        
        const midBeam = new THREE.Mesh(connectGeo1, darkWoodMaterial);
        midBeam.position.set(0, 2, 0);
        midBeam.castShadow = true;
        group.add(midBeam);
        
        // Catapult arm group (will rotate)
        const armGroup = new THREE.Group();
        armGroup.position.set(0, 2.2, 0);
        
        // Main throwing arm - longer and more detailed
        const mainArmGeo = new THREE.BoxGeometry(0.25, 4, 0.25);
        this.arm = new THREE.Mesh(mainArmGeo, woodMaterial);
        this.arm.position.set(0, 0.5, 0);
        this.arm.castShadow = true;
        armGroup.add(this.arm);
        
        // Counterweight at back of arm
        const counterweightGeo = new THREE.BoxGeometry(0.6, 0.8, 0.6);
        const counterweight = new THREE.Mesh(counterweightGeo, metalMaterial);
        counterweight.position.set(0, -1.5, 0);
        counterweight.castShadow = true;
        armGroup.add(counterweight);
        
        // Metal bands on arm for reinforcement
        for (let i = 0; i < 3; i++) {
            const bandGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.1, 8);
            const band = new THREE.Mesh(bandGeo, metalMaterial);
            band.position.set(0, -1 + i * 1.5, 0);
            band.rotation.x = Math.PI / 2;
            armGroup.add(band);
        }
        
        // Bucket/Sling at the end of arm - more detailed
        const bucketFrameGeo = new THREE.CylinderGeometry(0.5, 0.4, 0.6, 8, 1, true);
        const bucketFrame = new THREE.Mesh(bucketFrameGeo, darkWoodMaterial);
        bucketFrame.position.set(0, 2.5, 0);
        bucketFrame.castShadow = true;
        armGroup.add(bucketFrame);
        
        // Bucket bottom
        const bucketBottomGeo = new THREE.CircleGeometry(0.4, 8);
        const bucketBottom = new THREE.Mesh(bucketBottomGeo, darkWoodMaterial);
        bucketBottom.rotation.x = Math.PI / 2;
        bucketBottom.position.set(0, 2.2, 0);
        armGroup.add(bucketBottom);
        
        // Metal rim on bucket
        const rimGeo = new THREE.TorusGeometry(0.45, 0.05, 8, 12);
        const rim = new THREE.Mesh(rimGeo, metalMaterial);
        rim.rotation.x = Math.PI / 2;
        rim.position.set(0, 2.8, 0);
        armGroup.add(rim);
        
        this.bucket = bucketFrame; // Reference for projectile position
        
        // Create the loaded stone ball in the bucket
        this.createLoadedBall(armGroup);
        
        // Ropes connecting to arm
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const ropeGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.8, 6);
            const rope = new THREE.Mesh(ropeGeo, ropeMaterial);
            rope.position.set(
                Math.cos(angle) * 0.35,
                2.1,
                Math.sin(angle) * 0.35
            );
            rope.rotation.x = Math.PI / 4;
            rope.rotation.y = angle;
            armGroup.add(rope);
        }
        
        // Pivot axle through arm
        const axleGeo = new THREE.CylinderGeometry(0.12, 0.12, 2, 12);
        const axle = new THREE.Mesh(axleGeo, metalMaterial);
        axle.rotation.z = Math.PI / 2;
        axle.position.set(0, 0, 0);
        axle.castShadow = true;
        armGroup.add(axle);
        
        group.add(armGroup);
        this.armGroup = armGroup;
        
        // Tension ropes
        const tensionRopes = [
            { from: [-0.8, 3.2, 0.9], to: [-0.8, 0.5, -1.1] },
            { from: [0.8, 3.2, 0.9], to: [0.8, 0.5, -1.1] },
            { from: [-0.8, 3.2, -0.9], to: [-0.8, 0.5, 1.1] },
            { from: [0.8, 3.2, -0.9], to: [0.8, 0.5, 1.1] }
        ];
        
        tensionRopes.forEach(({from, to}) => {
            const length = Math.sqrt(
                Math.pow(to[0] - from[0], 2) +
                Math.pow(to[1] - from[1], 2) +
                Math.pow(to[2] - from[2], 2)
            );
            const ropeGeo = new THREE.CylinderGeometry(0.04, 0.04, length, 6);
            const rope = new THREE.Mesh(ropeGeo, ropeMaterial);
            
            rope.position.set(
                (from[0] + to[0]) / 2,
                (from[1] + to[1]) / 2,
                (from[2] + to[2]) / 2
            );
            
            const direction = new THREE.Vector3(
                to[0] - from[0],
                to[1] - from[1],
                to[2] - from[2]
            );
            const axis = new THREE.Vector3(0, 1, 0);
            rope.quaternion.setFromUnitVectors(axis, direction.normalize());
            
            group.add(rope);
        });
        
        // Position the entire catapult
        group.position.copy(this.position);
        this.group = group;
        this.scene.add(group);
        
        // Apply initial aim angles to visual
        this.updateVisual();
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
    
    createLoadedBall(armGroup) {
        // Create stone ball texture (same as projectile)
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
        
        // Add some darker spots
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
        
        // Add scratches
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
        
        const ballGeo = new THREE.SphereGeometry(0.4, 32, 32);
        const ballMat = new THREE.MeshStandardMaterial({
            map: texture,
            color: 0xFFFFFF,
            roughness: 0.95,
            metalness: 0.1,
            bumpMap: texture,
            bumpScale: 0.02
        });
        
        this.loadedBall = new THREE.Mesh(ballGeo, ballMat);
        this.loadedBall.position.set(0, 2.5, 0); // Position in bucket
        this.loadedBall.castShadow = true;
        armGroup.add(this.loadedBall);
    }
    
    hideBall() {
        if (this.loadedBall) {
            this.loadedBall.visible = false;
        }
    }
    
    showBall() {
        if (this.loadedBall) {
            this.loadedBall.visible = true;
        }
    }
}

