import * as THREE from 'three';
import { PhysicsWorld } from './PhysicsWorld.js';
import { Catapult } from './Catapult.js';
import { TrajectoryPreview } from './TrajectoryPreview.js';
import { Level } from './Level.js';
import { Projectile } from './objects/Projectile.js';

export class Game {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.physicsWorld = null;
        this.catapult = null;
        this.trajectory = null;
        this.level = null;
        
        // Game state
        this.currentLevel = 1;
        this.ammo = 10;
        this.score = 0;
        this.projectiles = [];
        this.activeProjectile = null;
        this.power = 15; // Adjustable power
        this.minPower = 5;
        this.maxPower = 35;
        this.powerChangeRate = 10; // How fast power changes per second
        
        // Mouse tracking for camera panning
        this.isPanning = false;
        this.mouse = { x: 0, y: 0 };
        this.mouseStart = { x: 0, y: 0 };
        
        // Camera control - free look system
        this.cameraFollowMode = false;
        this.cameraPosition = new THREE.Vector3();
        this.cameraAngle = -0.1; // Camera pitch angle (vertical rotation) - slight downward
        this.cameraYaw = Math.PI / 2;   // Camera yaw angle (horizontal rotation) - looking forward (+X)
        this.minCameraAngle = -Math.PI / 3; // -60 degrees
        this.maxCameraAngle = Math.PI / 2.5; // ~72 degrees
        
        // Camera presets - cycle through with Z
        this.cameraPresets = [
            { 
                name: "Behind Catapult",
                position: new THREE.Vector3(-18, 8, 0),
                angle: -0.1,
                yaw: Math.PI / 2
            },
            { 
                name: "Right Side View",
                position: new THREE.Vector3(5, 10, 20),
                angle: -0.2,
                yaw: Math.PI
            },
            { 
                name: "Left Side View",
                position: new THREE.Vector3(5, 10, -20),
                angle: -0.2,
                yaw: 0
            }
        ];
        this.currentPresetIndex = 0;
        
        // Key states for controls
        this.keys = {
            arrowUp: false,
            arrowDown: false,
            arrowLeft: false,
            arrowRight: false,
            forward: false,
            backward: false,
            left: false,
            right: false,
            up: false,
            down: false,
            powerIncrease: false,
            powerDecrease: false
        };
        
        this.aimSpeed = 1.5; // radians per second
        this.cameraMoveSpeed = 15; // units per second for camera panning
    }
    
    init() {
        // Three.js setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue
        this.scene.fog = new THREE.Fog(0x87CEEB, 50, 200);
        
        // Camera - positioned behind catapult
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        // Initialize camera with first preset
        this.loadCameraPreset(0);
        this.updateCameraLookDirection();
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(this.renderer.domElement);
        
        // Physics World
        this.physicsWorld = new PhysicsWorld();
        
        // Lighting
        this.setupLighting();
        
        // Ground
        this.createGround();
        
        // Create catapult
        this.catapult = new Catapult(this.scene, new THREE.Vector3(-8, 0.25, 0));
        
        // Trajectory preview
        this.trajectory = new TrajectoryPreview(this.scene);
        
        // Load first level
        this.level = new Level(this.scene, this.physicsWorld, this.currentLevel);
        this.loadLevel();
        
        // Setup controls
        this.setupControls();
        
        // Window resize
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Update UI
        this.updateUI();
    }
    
    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        // Directional light (sun)
        const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
        sunLight.position.set(50, 50, 30);
        sunLight.castShadow = true;
        
        // Shadow camera setup
        sunLight.shadow.camera.left = -60;
        sunLight.shadow.camera.right = 60;
        sunLight.shadow.camera.top = 60;
        sunLight.shadow.camera.bottom = -60;
        sunLight.shadow.camera.near = 0.1;
        sunLight.shadow.camera.far = 200;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        
        this.scene.add(sunLight);
        
        // Hemisphere light for better outdoor feel
        const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x4a7c59, 0.4);
        this.scene.add(hemiLight);
    }
    
    createGround() {
        // Visual ground - medieval grass field
        const groundSize = 150;
        const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize, 50, 50);
        
        // Add some height variation for terrain
        const positionAttribute = groundGeometry.attributes.position;
        for (let i = 0; i < positionAttribute.count; i++) {
            const x = positionAttribute.getX(i);
            const y = positionAttribute.getY(i);
            const noise = Math.sin(x * 0.1) * Math.cos(y * 0.1) * 0.3;
            positionAttribute.setZ(i, noise);
        }
        groundGeometry.computeVertexNormals();
        
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x4a7c59,
            roughness: 0.9,
            metalness: 0.1
        });
        
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Physics ground (flat)
        this.physicsWorld.createGroundBody();
    }
    
    setupControls() {
        // Mouse movement for free camera rotation
        this.renderer.domElement.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
            
            if (this.isPanning && !this.cameraFollowMode) {
                const deltaX = (this.mouse.x - this.mouseStart.x) * 0.003;
                const deltaY = (this.mouse.y - this.mouseStart.y) * 0.003;
                
                // Rotate camera based on mouse movement
                this.cameraYaw -= deltaX;
                this.cameraAngle -= deltaY;
                
                // Clamp vertical angle to prevent flipping
                this.cameraAngle = Math.max(this.minCameraAngle, Math.min(this.maxCameraAngle, this.cameraAngle));
                
                this.updateCameraLookDirection();
                
                this.mouseStart.x = this.mouse.x;
                this.mouseStart.y = this.mouse.y;
            }
        });
        
        // Mouse down to start panning
        this.renderer.domElement.addEventListener('mousedown', (e) => {
            this.isPanning = true;
            this.mouseStart.x = this.mouse.x;
            this.mouseStart.y = this.mouse.y;
        });
        
        // Mouse up to stop panning
        this.renderer.domElement.addEventListener('mouseup', (e) => {
            this.isPanning = false;
        });
        
        // Mouse wheel for camera angle adjustment (alternative control)
        this.renderer.domElement.addEventListener('wheel', (e) => {
            e.preventDefault();
            if (!this.cameraFollowMode) {
                this.cameraAngle += e.deltaY * 0.001;
                this.cameraAngle = Math.max(this.minCameraAngle, Math.min(this.maxCameraAngle, this.cameraAngle));
                this.updateCameraLookDirection();
            }
        }, { passive: false });
        
        // Keyboard controls
        window.addEventListener('keydown', (e) => {
            // Arrow keys for aiming the catapult
            if (e.code === 'ArrowUp') {
                e.preventDefault();
                this.keys.arrowUp = true;
            }
            if (e.code === 'ArrowDown') {
                e.preventDefault();
                this.keys.arrowDown = true;
            }
            if (e.code === 'ArrowLeft') {
                e.preventDefault();
                this.keys.arrowLeft = true;
            }
            if (e.code === 'ArrowRight') {
                e.preventDefault();
                this.keys.arrowRight = true;
            }
            
            // WASD for camera movement
            if (e.code === 'KeyW') {
                this.keys.forward = true;
            }
            if (e.code === 'KeyS') {
                this.keys.backward = true;
            }
            if (e.code === 'KeyA') {
                this.keys.left = true;
            }
            if (e.code === 'KeyD') {
                this.keys.right = true;
            }
            
            // Q/E for vertical camera movement
            if (e.code === 'KeyQ') {
                this.keys.down = true;
            }
            if (e.code === 'KeyE') {
                this.keys.up = true;
            }
            
            // Space to fire
            if (e.code === 'Space' && this.ammo > 0 && !this.activeProjectile) {
                e.preventDefault();
                this.fire();
            }
            
            // Z to cycle camera presets
            if (e.code === 'KeyZ') {
                e.preventDefault();
                this.cycleCamera();
            }
            
            // R to reset level
            if (e.code === 'KeyR') {
                e.preventDefault();
                this.resetLevel();
            }
            
            // [ and ] to adjust power (smooth adjustment)
            if (e.code === 'BracketLeft') {
                e.preventDefault();
                this.keys.powerDecrease = true;
            }
            if (e.code === 'BracketRight') {
                e.preventDefault();
                this.keys.powerIncrease = true;
            }
        });
        
        window.addEventListener('keyup', (e) => {
            if (e.code === 'ArrowUp') this.keys.arrowUp = false;
            if (e.code === 'ArrowDown') this.keys.arrowDown = false;
            if (e.code === 'ArrowLeft') this.keys.arrowLeft = false;
            if (e.code === 'ArrowRight') this.keys.arrowRight = false;
            if (e.code === 'KeyW') this.keys.forward = false;
            if (e.code === 'KeyS') this.keys.backward = false;
            if (e.code === 'KeyA') this.keys.left = false;
            if (e.code === 'KeyD') this.keys.right = false;
            if (e.code === 'KeyQ') this.keys.down = false;
            if (e.code === 'KeyE') this.keys.up = false;
            if (e.code === 'BracketLeft') this.keys.powerDecrease = false;
            if (e.code === 'BracketRight') this.keys.powerIncrease = false;
        });
    }
    
    updateAimWithArrowKeys(deltaTime) {
        // Update catapult aim based on arrow key input
        let angleChanged = false;
        
        if (this.keys.arrowLeft) {
            this.catapult.aimAngleH -= this.aimSpeed * deltaTime;
            angleChanged = true;
        }
        if (this.keys.arrowRight) {
            this.catapult.aimAngleH += this.aimSpeed * deltaTime;
            angleChanged = true;
        }
        if (this.keys.arrowUp) {
            this.catapult.aimAngleV += this.aimSpeed * deltaTime;
            angleChanged = true;
        }
        if (this.keys.arrowDown) {
            this.catapult.aimAngleV -= this.aimSpeed * deltaTime;
            angleChanged = true;
        }
        
        if (angleChanged) {
            this.catapult.setAim(this.catapult.aimAngleH, this.catapult.aimAngleV);
        }
        
        // Always update and show trajectory when not firing
        if (!this.activeProjectile && !this.cameraFollowMode) {
            const startPos = this.catapult.getProjectileStartPosition();
            const velocity = this.catapult.getProjectileVelocity(this.power);
            this.trajectory.update(startPos, velocity);
            this.trajectory.show();
        }
    }
    
    updateCameraLookDirection() {
        // Calculate look direction based on yaw and pitch angles
        const lookDirection = new THREE.Vector3(
            Math.cos(this.cameraAngle) * Math.sin(this.cameraYaw),
            Math.sin(this.cameraAngle),
            Math.cos(this.cameraAngle) * Math.cos(this.cameraYaw)
        );
        
        const lookAt = new THREE.Vector3();
        lookAt.copy(this.cameraPosition).add(lookDirection);
        this.camera.lookAt(lookAt);
    }
    
    updateCameraPosition(deltaTime) {
        if (this.cameraFollowMode) return;
        
        // Calculate forward and right vectors based on camera yaw (ignore pitch for movement)
        const forward = new THREE.Vector3(
            Math.sin(this.cameraYaw),
            0,
            Math.cos(this.cameraYaw)
        );
        const right = new THREE.Vector3(
            -Math.cos(this.cameraYaw),
            0,
            Math.sin(this.cameraYaw)
        );
        
        const moveSpeed = this.cameraMoveSpeed * deltaTime;
        
        // WASD movement
        if (this.keys.forward) {
            this.cameraPosition.add(forward.multiplyScalar(moveSpeed));
        }
        if (this.keys.backward) {
            this.cameraPosition.add(forward.multiplyScalar(-moveSpeed));
        }
        if (this.keys.right) {
            this.cameraPosition.add(right.multiplyScalar(moveSpeed));
        }
        if (this.keys.left) {
            this.cameraPosition.add(right.multiplyScalar(-moveSpeed));
        }
        
        // Q/E for vertical movement
        if (this.keys.up) {
            this.cameraPosition.y += moveSpeed;
        }
        if (this.keys.down) {
            this.cameraPosition.y -= moveSpeed;
        }
        
        // Keep camera above ground
        this.cameraPosition.y = Math.max(0.5, this.cameraPosition.y);
        
        // Update actual camera position
        this.camera.position.copy(this.cameraPosition);
        this.updateCameraLookDirection();
    }
    
    loadCameraPreset(index) {
        const preset = this.cameraPresets[index];
        this.cameraPosition.copy(preset.position);
        this.camera.position.copy(preset.position);
        this.cameraAngle = preset.angle;
        this.cameraYaw = preset.yaw;
        this.currentPresetIndex = index;
        
        // Update UI with preset name
        const cameraPresetElement = document.getElementById('camera-preset');
        if (cameraPresetElement) {
            cameraPresetElement.textContent = preset.name;
        }
        console.log(`📷 Camera: ${preset.name}`);
    }
    
    cycleCamera() {
        this.cameraFollowMode = false;
        this.currentPresetIndex = (this.currentPresetIndex + 1) % this.cameraPresets.length;
        this.loadCameraPreset(this.currentPresetIndex);
        this.updateCameraLookDirection();
    }
    
    fire() {
        if (this.ammo <= 0 || this.activeProjectile) return;
        
        // Create and fire projectile at full power
        const startPos = this.catapult.getProjectileStartPosition();
        const velocity = this.catapult.getProjectileVelocity(this.power);
        
        const projectile = new Projectile(
            this.scene,
            this.physicsWorld,
            startPos,
            velocity
        );
        
        this.projectiles.push(projectile);
        this.activeProjectile = projectile;
        this.ammo--;
        
        // Hide trajectory during flight
        this.trajectory.hide();
        
        // Enable camera follow
        this.cameraFollowMode = true;
        
        // Update UI
        this.updateUI();
        
        console.log('🔥 Fired projectile! Velocity:', velocity);
        
        // Auto-reset after projectile settles
        setTimeout(() => {
            this.activeProjectile = null;
            this.cameraFollowMode = false;
            this.loadCameraPreset(this.currentPresetIndex);
            this.updateCameraLookDirection();
        }, 5000);
    }
    
    loadLevel() {
        const targetCount = this.level.load();
        console.log(`📊 Loaded Level ${this.currentLevel} with ${targetCount} targets`);
        
        this.updateUI();
    }
    
    resetLevel() {
        this.level.clear();
        this.projectiles.forEach(p => p.remove());
        this.projectiles = [];
        this.activeProjectile = null;
        this.ammo = 10;
        this.cameraFollowMode = false;
        this.loadCameraPreset(0); // Reset to first preset
        this.updateCameraLookDirection();
        this.loadLevel();
    }
    
    nextLevel() {
        this.currentLevel++;
        this.level = new Level(this.scene, this.physicsWorld, this.currentLevel);
        this.ammo = 10;
        this.loadLevel();
    }
    
    checkVictory() {
        const remainingTargets = this.level.getRemainingTargets();
        
        if (remainingTargets === 0) {
            console.log('🎉 Victory! Level Complete!');
            
            // Show victory screen
            setTimeout(() => {
                const gameOverScreen = document.getElementById('game-over');
                const finalScore = document.getElementById('final-score');
                finalScore.textContent = `Level ${this.currentLevel} Complete! Score: ${this.score}`;
                gameOverScreen.style.display = 'block';
                
                // Auto advance to next level after a delay
                setTimeout(() => {
                    gameOverScreen.style.display = 'none';
                    this.nextLevel();
                }, 3000);
            }, 1000);
        } else if (this.ammo === 0 && !this.activeProjectile) {
            // Game over - no ammo and no active projectile
            setTimeout(() => {
                const gameOverScreen = document.getElementById('game-over');
                const finalScore = document.getElementById('final-score');
                gameOverScreen.querySelector('h1').textContent = 'Out of Ammo!';
                finalScore.textContent = `Score: ${this.score} | Targets Remaining: ${remainingTargets}`;
                gameOverScreen.style.display = 'block';
            }, 1000);
        }
    }
    
    updateUI() {
        document.getElementById('targets').textContent = this.level.getRemainingTargets();
        document.getElementById('ammo').textContent = this.ammo;
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.currentLevel;
        document.getElementById('power').textContent = Math.round(this.power);
    }
    
    update(deltaTime) {
        // Step physics
        this.physicsWorld.step(deltaTime);
        
        // Update catapult aiming with arrow keys
        this.updateAimWithArrowKeys(deltaTime);
        
        // Update camera position (WASD/QE movement)
        this.updateCameraPosition(deltaTime);
        
        // Update power (smooth adjustment with [ ] keys)
        let powerChanged = false;
        if (this.keys.powerIncrease) {
            this.power = Math.min(this.maxPower, this.power + this.powerChangeRate * deltaTime);
            powerChanged = true;
        }
        if (this.keys.powerDecrease) {
            this.power = Math.max(this.minPower, this.power - this.powerChangeRate * deltaTime);
            powerChanged = true;
        }
        if (powerChanged) {
            this.updateUI();
        }
        
        // Update level (targets and buildings)
        this.level.update(deltaTime);
        
        // Update projectiles
        this.projectiles.forEach(projectile => {
            projectile.update(deltaTime);
            
            // Check collisions with targets
            if (projectile.isActive) {
                const scoreGained = this.level.checkCollisions(projectile);
                if (scoreGained > 0) {
                    this.score += scoreGained;
                    this.updateUI();
                }
            }
        });
        
        // Remove inactive projectiles
        this.projectiles = this.projectiles.filter(p => p.isActive);
        
        // Camera follow mode for projectile tracking
        if (this.cameraFollowMode && this.activeProjectile && this.activeProjectile.isActive) {
            // Follow active projectile
            const projectilePos = this.activeProjectile.body.position;
            this.cameraPosition.x = projectilePos.x - 10;
            this.cameraPosition.y = projectilePos.y + 8;
            this.cameraPosition.z = projectilePos.z + 10;
            this.camera.position.copy(this.cameraPosition);
            this.camera.lookAt(projectilePos.x, projectilePos.y, projectilePos.z);
        }
        
        // Check victory condition
        this.checkVictory();
    }
    
    start() {
        let lastTime = performance.now();
        
        const animate = () => {
            requestAnimationFrame(animate);
            
            const currentTime = performance.now();
            const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1); // Cap deltaTime
            lastTime = currentTime;
            
            this.update(deltaTime);
            this.renderer.render(this.scene, this.camera);
        };
        
        animate();
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

