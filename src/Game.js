import * as THREE from 'three';
import { PhysicsWorld } from './PhysicsWorld.js';
import { Catapult } from './Catapult.js';
import { TrajectoryPreview } from './TrajectoryPreview.js';
import { Level } from './Level.js';
import { Projectile } from './objects/Projectile.js';
import { ProceduralTextures } from './utils/ProceduralTextures.js';

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
                position: new THREE.Vector3(-14.94, 7.01, 7.88),
                angle: -0.35,
                yaw: 2
            },
            { 
                name: "Right Side View",
                position: new THREE.Vector3(0.6, 8.93, 13.05),
                angle: -0.58,
                yaw: 2.93
            },
            { 
                name: "Left Side View",
                position: new THREE.Vector3(-2.12, 10, -12.61),
                angle: -0.51,
                yaw: 0.19
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
        this.scene.background = new THREE.Color(0x6BB6FF); // Cartoon bright blue
        this.scene.fog = new THREE.Fog(0xB8E6FF, 80, 250); // Light airy fog
        
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
        
        // Cartoon sky and clouds
        this.createCartoonSky();
        this.createCartoonClouds();
        
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
        // Brighter ambient light for cartoon style
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambientLight);
        
        // Softer directional light (sun)
        const sunLight = new THREE.DirectionalLight(0xFFF4CC, 0.6); // Warm yellow
        sunLight.position.set(50, 80, 30); // Higher in sky
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
        
        // Hemisphere light for cartoon outdoor feel
        const hemiLight = new THREE.HemisphereLight(0xB8E6FF, 0x7BC850, 0.5); // Sky blue to grass green
        this.scene.add(hemiLight);
    }
    
    createGround() {
        // Visual ground - medieval grass field with textures
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
        
        // Create layered ground with textures
        const grassTexture = ProceduralTextures.createGrassTexture();
        const groundMaterial = new THREE.MeshStandardMaterial({
            map: grassTexture,
            color: 0xFFFFFF, // White to show true texture colors
            roughness: 0.9,
            metalness: 0.1,
            flatShading: false  // Smoother for textures
        });
        
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Add stone path near catapult area
        const pathGeometry = new THREE.PlaneGeometry(40, 60);
        const stoneTexture = ProceduralTextures.createStonePathTexture();
        const pathMaterial = new THREE.MeshStandardMaterial({
            map: stoneTexture,
            roughness: 0.95,
            metalness: 0.05
        });
        const path = new THREE.Mesh(pathGeometry, pathMaterial);
        path.rotation.x = -Math.PI / 2;
        path.position.set(5, 0.02, 0); // Slightly above ground to avoid z-fighting
        path.receiveShadow = true;
        this.scene.add(path);
        
        // Add fern/foliage overlay patches around the edges
        const fernTexture = ProceduralTextures.createFernTexture();
        const fernPositions = [
            { x: -50, z: 40 },
            { x: 50, z: 40 },
            { x: -50, z: -40 },
            { x: 50, z: -40 },
            { x: -60, z: 0 },
            { x: 60, z: 0 }
        ];
        
        fernPositions.forEach(pos => {
            const fernGeometry = new THREE.PlaneGeometry(15, 15);
            const fernMaterial = new THREE.MeshStandardMaterial({
                map: fernTexture,
                transparent: true,
                opacity: 0.7,
                side: THREE.DoubleSide,
                alphaTest: 0.1
            });
            const ferns = new THREE.Mesh(fernGeometry, fernMaterial);
            ferns.rotation.x = -Math.PI / 2;
            ferns.position.set(pos.x, 0.05, pos.z);
            this.scene.add(ferns);
        });
        
        // Physics ground (flat)
        this.physicsWorld.createGroundBody();
    }
    
    createCartoonSky() {
        // Create cartoon sky dome
        const skyGeometry = new THREE.SphereGeometry(400, 32, 15);
        skyGeometry.scale(-1, 1, 1); // Flip inside out
        
        // Cartoon sky shader
        const vertexShader = `
            varying vec3 vWorldPosition;
            void main() {
                vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                vWorldPosition = worldPosition.xyz;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;
        
        const fragmentShader = `
            varying vec3 vWorldPosition;
            
            void main() {
                float h = normalize(vWorldPosition).y;
                
                // Cartoon sky colors (bright and flat)
                vec3 skyBlue = vec3(0.4, 0.7, 1.0);      // Bright blue
                vec3 horizonBlue = vec3(0.7, 0.85, 1.0); // Light blue at horizon
                
                // Simple gradient with smooth transition (cartoon style)
                float gradient = smoothstep(0.0, 0.5, h);
                vec3 skyColor = mix(horizonBlue, skyBlue, gradient);
                
                gl_FragColor = vec4(skyColor, 1.0);
            }
        `;
        
        const skyMaterial = new THREE.ShaderMaterial({
            uniforms: {},
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            side: THREE.BackSide,
            depthWrite: false
        });
        
        const skyDome = new THREE.Mesh(skyGeometry, skyMaterial);
        this.scene.add(skyDome);
    }
    
    createCartoonClouds() {
        // Create simple cartoon cloud texture
        const cloudCanvas = document.createElement('canvas');
        cloudCanvas.width = 256;
        cloudCanvas.height = 128;
        const ctx = cloudCanvas.getContext('2d');
        
        // Draw simple cartoon cloud (three overlapping circles)
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(64, 80, 40, 0, Math.PI * 2);
        ctx.arc(110, 80, 50, 0, Math.PI * 2);
        ctx.arc(150, 80, 40, 0, Math.PI * 2);
        ctx.fill();
        
        const cloudTexture = new THREE.CanvasTexture(cloudCanvas);
        const cloudMaterial = new THREE.SpriteMaterial({ 
            map: cloudTexture,
            transparent: true,
            opacity: 0.9
        });
        
        // Add multiple clouds around the scene
        for (let i = 0; i < 15; i++) {
            const cloud = new THREE.Sprite(cloudMaterial);
            const angle = Math.random() * Math.PI * 2;
            const distance = 250 + Math.random() * 100;
            const height = 80 + Math.random() * 60;
            
            cloud.position.set(
                Math.cos(angle) * distance,
                height,
                Math.sin(angle) * distance
            );
            cloud.scale.set(60 + Math.random() * 30, 30 + Math.random() * 15, 1);
            this.scene.add(cloud);
        }
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
            
            // P to print current camera position (for debugging)
            if (e.code === 'KeyP') {
                e.preventDefault();
                console.log('📍 Current Camera Position:');
                console.log(`  position: new THREE.Vector3(${this.cameraPosition.x.toFixed(2)}, ${this.cameraPosition.y.toFixed(2)}, ${this.cameraPosition.z.toFixed(2)}),`);
                console.log(`  angle: ${this.cameraAngle.toFixed(2)},`);
                console.log(`  yaw: ${this.cameraYaw.toFixed(2)}`);
                console.log(`\nDegrees: pitch=${(this.cameraAngle * 180 / Math.PI).toFixed(1)}°, yaw=${(this.cameraYaw * 180 / Math.PI).toFixed(1)}°`);
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
        
        // Hide the loaded ball in catapult
        this.catapult.hideBall();
        
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
            
            // Show ball again if we have ammo left
            if (this.ammo > 0) {
                this.catapult.showBall();
            }
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
        
        // Show ball again
        this.catapult.showBall();
    }
    
    nextLevel() {
        this.currentLevel++;
        this.level = new Level(this.scene, this.physicsWorld, this.currentLevel);
        this.ammo = 10;
        this.loadLevel();
        
        // Show ball for new level
        this.catapult.showBall();
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

