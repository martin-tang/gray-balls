import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { PhysicsWorld } from './PhysicsWorld.js';
import { Catapult } from './Catapult.js';
import { TrajectoryPreview } from './TrajectoryPreview.js';
import { Level } from './Level.js';
import { Projectile } from './objects/Projectile.js';
import { ProceduralTextures } from './utils/ProceduralTextures.js';
import { SaveSystem } from './utils/SaveSystem.js';
import { LeaderboardService } from './utils/LeaderboardService.js';

// ==========================================
// 🎨 LEVEL CREATOR TOGGLE
// ==========================================
// Set to true to enable Level Creator mode
// Set to false for production/normal gameplay
const ENABLE_LEVEL_CREATOR = true;
// ==========================================

// Import LevelCreator only if enabled (comment out if disabled)
import { LevelCreator } from './LevelCreator.js';

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
        this.maxLevel = 10; // Total number of levels available
        this.currentLevel = 1;
        this.ammo = 10;
        this.startingAmmo = 10;
        this.score = 0;
        this.projectiles = [];
        this.activeProjectile = null;
        this.power = 15; // Adjustable power
        this.minPower = 5;
        this.maxPower = 35;
        this.powerChangeRate = 10; // How fast power changes per second
        
        // Scoring tracking
        this.targetsDestroyed = 0;
        this.obstaclesDestroyed = 0;
        this.shotsUsed = 0;
        
        // Save system
        this.saveSystem = new SaveSystem();
        
        // Leaderboard system
        this.leaderboardService = new LeaderboardService();
        
        // Level creator
        this.levelCreator = null;
        this.levelCreatorActive = false;
        
        // Reinitialization flag
        this.needsReinit = false;
        
        // Victory check prevention (to avoid checking victory during initialization)
        this.victoryCheckEnabled = false;
        this.victoryShown = false; // Prevent showing victory screen multiple times
        
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
        
        this.aimSpeed = 0.5; // radians per second (slower for more precise aiming)
        this.cameraMoveSpeed = 15; // units per second for camera panning
    }
    
    init() {
        // Check if a level was selected from the intro screen
        if (window.selectedStartLevel) {
            this.currentLevel = window.selectedStartLevel;
        }
        
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
        
        // Invisible boundary walls
        this.createBoundaryWalls();
        
        // Create catapult
        this.catapult = new Catapult(this.scene, new THREE.Vector3(-8, 0.25, 0));
        
        // Trajectory preview
        this.trajectory = new TrajectoryPreview(this.scene);
        
        // Load selected level
        this.level = new Level(this.scene, this.physicsWorld, this.currentLevel);
        this.loadLevel();
        
        // Setup controls
        this.setupControls();
        
        // Initialize level creator (only if enabled)
        if (ENABLE_LEVEL_CREATOR) {
            try {
                // LevelCreator must be imported above if enabled
                this.levelCreator = new LevelCreator(this);
                console.log('🎨 Level Creator enabled - Press Ctrl+L to open');
            } catch (e) {
                console.error('❌ Level Creator could not be initialized:', e);
                console.warn('⚠️ Make sure LevelCreator import is uncommented at the top of Game.js');
                this.levelCreator = null;
            }
        } else {
            this.levelCreator = null;
            console.log('🎮 Game mode - Level Creator disabled');
        }
        
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
        ground.name = 'ground';
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
        path.name = 'path';
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
            ferns.name = 'ferns';
            ferns.rotation.x = -Math.PI / 2;
            ferns.position.set(pos.x, 0.05, pos.z);
            this.scene.add(ferns);
        });
        
        // Physics ground (flat)
        this.physicsWorld.createGroundBody();
    }
    
    createBoundaryWalls() {
        // Create invisible walls around the perimeter to keep objects on stage
        const wallHeight = 50;  // Tall enough to catch flying objects
        const wallThickness = 1;
        const stageSize = 75;   // Half of ground size (150/2)
        
        // Create 4 walls (north, south, east, west)
        const walls = [
            // North wall (behind targets)
            { 
                position: new CANNON.Vec3(0, wallHeight/2, stageSize),
                size: new CANNON.Vec3(stageSize, wallHeight/2, wallThickness/2)
            },
            // South wall (behind catapult)
            { 
                position: new CANNON.Vec3(0, wallHeight/2, -stageSize),
                size: new CANNON.Vec3(stageSize, wallHeight/2, wallThickness/2)
            },
            // East wall (right side)
            { 
                position: new CANNON.Vec3(stageSize, wallHeight/2, 0),
                size: new CANNON.Vec3(wallThickness/2, wallHeight/2, stageSize)
            },
            // West wall (left side)
            { 
                position: new CANNON.Vec3(-stageSize, wallHeight/2, 0),
                size: new CANNON.Vec3(wallThickness/2, wallHeight/2, stageSize)
            }
        ];
        
        walls.forEach(wall => {
            const wallBody = new CANNON.Body({
                mass: 0,  // Static (immovable)
                shape: new CANNON.Box(wall.size),
                position: wall.position,
                material: this.physicsWorld.objectMaterial
            });
            this.physicsWorld.addBody(wallBody);
        });
        
        console.log('🧱 Invisible boundary walls created');
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
        skyDome.name = 'sky';
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
            cloud.name = 'cloud';
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
    
    getOrCreateDeviceId() {
        // Generate a unique device identifier based on browser fingerprint
        let deviceId = localStorage.getItem('castleCrasher_deviceId');
        
        if (!deviceId) {
            // Create a fingerprint from browser characteristics
            const nav = navigator;
            const screen = window.screen;
            const fingerprint = [
                nav.userAgent,
                nav.language,
                screen.colorDepth,
                screen.width + 'x' + screen.height,
                new Date().getTimezoneOffset(),
                !!window.sessionStorage,
                !!window.localStorage
            ].join('|');
            
            // Generate a hash-like ID from the fingerprint + random component
            deviceId = this.simpleHash(fingerprint) + '-' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('castleCrasher_deviceId', deviceId);
        }
        
        return deviceId;
    }
    
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(36);
    }
    
    cleanupOrphanedObjects() {
        // Get list of objects to keep (environment, lights, camera, catapult, trajectory)
        const keepList = new Set();
        
        // Keep lights and essential game objects
        this.scene.children.forEach(child => {
            if (child.isLight || 
                child === this.catapult?.group ||  // Fixed: catapult uses 'group' not 'mesh'
                child === this.trajectory?.line ||
                child.name === 'ground' ||
                child.name === 'path' ||
                child.name === 'ferns' ||
                child.name === 'sky' ||
                child.name === 'cloud') {
                keepList.add(child);
            }
        });
        
        // Remove objects not in keep list
        const toRemove = [];
        this.scene.children.forEach(child => {
            if (!keepList.has(child)) {
                toRemove.push(child);
            }
        });
        
        // Remove and dispose
        toRemove.forEach(obj => {
            if (obj.geometry) {
                obj.geometry.dispose();
            }
            if (obj.material) {
                if (Array.isArray(obj.material)) {
                    obj.material.forEach(mat => {
                        if (mat.map) mat.map.dispose();
                        mat.dispose();
                    });
                } else {
                    if (obj.material.map) obj.material.map.dispose();
                    obj.material.dispose();
                }
            }
            this.scene.remove(obj);
        });
        
        if (toRemove.length > 0) {
            console.log(`🗑️ Cleaned up ${toRemove.length} orphaned objects`);
        }
    }
    
    setupControls() {
        // Mouse movement for free camera rotation
        this.renderer.domElement.addEventListener('mousemove', (e) => {
            // Don't process camera movement if level creator is active
            if (this.levelCreatorActive) return;
            
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
            // Don't process if level creator is active
            if (this.levelCreatorActive) return;
            
            this.isPanning = true;
            this.mouseStart.x = this.mouse.x;
            this.mouseStart.y = this.mouse.y;
        });
        
        // Mouse up to stop panning
        this.renderer.domElement.addEventListener('mouseup', (e) => {
            // Don't process if level creator is active
            if (this.levelCreatorActive) return;
            
            this.isPanning = false;
        });
        
        // Mouse wheel for camera angle adjustment (alternative control)
        this.renderer.domElement.addEventListener('wheel', (e) => {
            // Don't process if level creator is active
            if (this.levelCreatorActive) return;
            
            e.preventDefault();
            if (!this.cameraFollowMode) {
                this.cameraAngle += e.deltaY * 0.001;
                this.cameraAngle = Math.max(this.minCameraAngle, Math.min(this.maxCameraAngle, this.cameraAngle));
                this.updateCameraLookDirection();
            }
        }, { passive: false });
        
        // Keyboard controls
        window.addEventListener('keydown', (e) => {
            // Don't process game controls if level creator is active
            if (this.levelCreatorActive) {
                // Still allow Ctrl+L to toggle creator
                if (e.code === 'KeyL' && e.ctrlKey) {
                    e.preventDefault();
                    if (this.levelCreator) {
                        this.levelCreator.toggle();
                    }
                }
                return;
            }
            
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
            
            // ESC to return to main menu
            if (e.code === 'Escape') {
                e.preventDefault();
                this.returnToMainMenu();
            }
            
            // Ctrl+L to toggle level creator
            if (e.code === 'KeyL' && e.ctrlKey) {
                e.preventDefault();
                if (this.levelCreator) {
                    this.levelCreator.toggle();
                }
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
        // Don't process if level creator is active
        if (this.levelCreatorActive) return;
        
        // Update catapult aim based on arrow key input
        let angleChanged = false;
        
        if (this.keys.arrowLeft) {
            this.catapult.aimAngleH += this.aimSpeed * deltaTime; // Fixed: was -=, now +=
            angleChanged = true;
        }
        if (this.keys.arrowRight) {
            this.catapult.aimAngleH -= this.aimSpeed * deltaTime; // Fixed: was +=, now -=
            angleChanged = true;
        }
        if (this.keys.arrowUp) {
            this.catapult.aimAngleV -= this.aimSpeed * deltaTime;
            angleChanged = true;
        }
        if (this.keys.arrowDown) {
            this.catapult.aimAngleV += this.aimSpeed * deltaTime;
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
        // Don't fire if level creator is active
        if (this.levelCreatorActive) return;
        
        if (this.ammo <= 0 || this.activeProjectile) return;
        
        // Track shot used
        this.shotsUsed++;
        
        // Hide the loaded ball in catapult
        this.catapult.hideBall();
        
        // Hide crosshair during flight
        const crosshair = document.getElementById('crosshair');
        if (crosshair) crosshair.style.display = 'none';
        
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
                
                // Show crosshair again
                const crosshair = document.getElementById('crosshair');
                if (crosshair) crosshair.style.display = 'block';
            }
        }, 5000);
    }
    
    loadLevel() {
        const targetCount = this.level.load();
        console.log(`📊 Loaded Level ${this.currentLevel} with ${targetCount} targets`);
        
        this.updateUI();
        
        // Reset victory flags
        this.victoryCheckEnabled = false;
        this.victoryShown = false;
        
        // Enable victory checking after a short delay
        setTimeout(() => {
            this.victoryCheckEnabled = true;
            console.log('✅ Victory checking enabled');
        }, 500);
    }
    
    resetLevel() {
        this.level.clear();
        this.projectiles.forEach(p => p.remove());
        this.projectiles = [];
        this.activeProjectile = null;
        this.ammo = this.startingAmmo;
        this.shotsUsed = 0;
        this.cameraFollowMode = false;
        this.loadCameraPreset(0); // Reset to first preset
        this.updateCameraLookDirection();
        this.loadLevel();
        
        // Show ball again
        this.catapult.showBall();
        
        // Show crosshair again
        const crosshair = document.getElementById('crosshair');
        if (crosshair) crosshair.style.display = 'block';
    }
    
    returnToMainMenu() {
        console.log('🏠 Returning to main menu - cleaning up game state...');
        console.log('📊 Before cleanup - Scene children:', this.scene.children.length, '| Physics bodies:', this.physicsWorld.getBodyCount());
        
        // Disable victory checking immediately
        this.victoryCheckEnabled = false;
        
        // Clean up current level
        if (this.level) {
            this.level.clear();
        }
        
        // Remove all projectiles
        this.projectiles.forEach(p => p.remove());
        this.projectiles = [];
        this.activeProjectile = null;
        
        console.log('📊 After cleanup - Scene children:', this.scene.children.length, '| Physics bodies:', this.physicsWorld.getBodyCount());
        
        // Force cleanup of any orphaned objects in the scene
        this.cleanupOrphanedObjects();
        
        console.log('📊 After orphan cleanup - Scene children:', this.scene.children.length, '| Physics bodies:', this.physicsWorld.getBodyCount());
        
        // Reset game state
        this.ammo = this.startingAmmo;
        this.shotsUsed = 0;
        this.cameraFollowMode = false;
        
        // Hide trajectory
        if (this.trajectory) {
            this.trajectory.hide();
        }
        
        // Hide crosshair
        const crosshair = document.getElementById('crosshair');
        if (crosshair) crosshair.style.display = 'none';
        
        // Hide game over screen if showing
        const gameOverScreen = document.getElementById('game-over');
        if (gameOverScreen) {
            gameOverScreen.style.display = 'none';
        }
        
        // Show loading screen
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = 'none';
        }
        
        // Show the intro screen
        const introScreen = document.getElementById('intro-screen');
        if (introScreen) {
            introScreen.classList.remove('hidden');
            
            // Reload completed levels in case new ones were completed
            const event = new Event('reload-completed-levels');
            window.dispatchEvent(event);
            
            console.log('✅ Main menu shown - game state cleaned up');
        }
        
        // Flag that we need to reinitialize on next game start
        this.needsReinit = true;
    }
    
    nextLevel() {
        this.currentLevel++;
        
        // Check if we've completed all levels
        if (this.currentLevel > this.maxLevel) {
            console.log('🎊 ALL LEVELS COMPLETED! 🎊');
            this.returnToMainMenu();
            return;
        }
        
        // Clear old level before creating new one
        this.level.clear();
        
        this.level = new Level(this.scene, this.physicsWorld, this.currentLevel);
        this.ammo = this.startingAmmo;
        this.shotsUsed = 0;
        this.loadLevel();
        
        // Show ball for new level
        this.catapult.showBall();
        
        // Show crosshair for new level
        const crosshair = document.getElementById('crosshair');
        if (crosshair) crosshair.style.display = 'block';
    }
    
    calculateFinalScore() {
        // New scoring formula: (targets destroyed + weighted obstacle score) / shots used
        const destroyedCounts = this.level.getDestroyedCounts();
        const targetsDestroyed = destroyedCounts.targets;
        const obstacleScore = destroyedCounts.obstacleScore || 0;
        
        // Prevent division by zero
        if (this.shotsUsed === 0) {
            return 0;
        }
        
        // Use weighted obstacle score instead of just count
        const finalScore = ((targetsDestroyed + obstacleScore) / this.shotsUsed) * 100;
        return Math.round(finalScore * 10) / 10; // Round to 1 decimal place
    }
    
    checkVictory() {
        // Don't check victory if we need reinit, during menu, or before level is initialized
        if (this.needsReinit || !this.victoryCheckEnabled || this.victoryShown) return;
        
        const remainingTargets = this.level.getRemainingTargets();
        
        if (remainingTargets === 0) {
            // Mark victory as shown to prevent duplicate popups
            this.victoryShown = true;
            const finalScore = this.calculateFinalScore();
            const destroyedCounts = this.level.getDestroyedCounts();
            
            console.log('🎉 Victory! Level Complete!');
            console.log(`Targets: ${destroyedCounts.targets}, Obstacles: ${destroyedCounts.obstacles}, Shots: ${this.shotsUsed}`);
            console.log(`Final Score: ${finalScore}`);
            
            // Save to local storage
            this.saveSystem.updateLevel(
                this.currentLevel,
                finalScore,
                destroyedCounts.targets,
                destroyedCounts.obstacles,
                this.shotsUsed
            );
            
            const levelData = this.saveSystem.getLevelData(this.currentLevel);
            const isNewHighScore = finalScore === levelData.highScore;
            
            // Show victory screen
            setTimeout(() => {
                const gameOverScreen = document.getElementById('game-over');
                const finalScoreEl = document.getElementById('final-score');
                const titleEl = gameOverScreen.querySelector('h1');
                
                // Special message for completing final level
                if (this.currentLevel === this.maxLevel) {
                    titleEl.textContent = isNewHighScore ? '🎊 GAME COMPLETED! NEW HIGH SCORE! 🎊' : '🎊 ALL LEVELS COMPLETED! 🎊';
                } else {
                    titleEl.textContent = isNewHighScore ? '🏆 NEW HIGH SCORE!' : 'Level Complete!';
                }
                finalScoreEl.innerHTML = `
                    <div style="margin: 15px 0;">
                        <div style="font-size: 32px; color: #FFD700; margin-bottom: 10px;">Score: ${finalScore}</div>
                        <div style="font-size: 16px; opacity: 0.9;">
                            Targets Destroyed: ${destroyedCounts.targets}<br>
                            Obstacles Destroyed: ${destroyedCounts.obstacles}<br>
                            Shots Used: ${this.shotsUsed} / ${this.startingAmmo}
                        </div>
                        ${levelData.highScore ? `<div style="margin-top: 15px; font-size: 14px; opacity: 0.7;">Previous High Score: ${levelData.highScore}</div>` : ''}
                    </div>
                `;
                
                gameOverScreen.style.display = 'block';
                
                // Setup buttons with proper event handlers - use requestAnimationFrame to ensure DOM is ready
                requestAnimationFrame(() => {
                    this.setupGameOverButtons(true);
                });
            }, 1000);
        } else if (this.ammo === 0 && !this.activeProjectile) {
            // Game over - no ammo and no active projectile
            // Mark as shown to prevent duplicate popups
            this.victoryShown = true;
            
            const finalScore = this.calculateFinalScore();
            const destroyedCounts = this.level.getDestroyedCounts();
            
            setTimeout(() => {
                const gameOverScreen = document.getElementById('game-over');
                const finalScoreEl = document.getElementById('final-score');
                const titleEl = gameOverScreen.querySelector('h1');
                
                titleEl.textContent = 'Out of Ammo!';
                finalScoreEl.innerHTML = `
                    <div style="margin: 15px 0;">
                        <div style="font-size: 24px; color: #FF6B6B; margin-bottom: 10px;">Score: ${finalScore}</div>
                        <div style="font-size: 16px; opacity: 0.9;">
                            Targets Remaining: ${remainingTargets}<br>
                            Targets Destroyed: ${destroyedCounts.targets}<br>
                            Obstacles Destroyed: ${destroyedCounts.obstacles}
                        </div>
                    </div>
                `;
                gameOverScreen.style.display = 'block';
                
                // Setup buttons - no next level since they failed
                requestAnimationFrame(() => {
                    this.setupGameOverButtons(false);
                });
            }, 1000);
        }
    }
    
    setupGameOverButtons(showNextLevel) {
        console.log('🎮 setupGameOverButtons called, showNextLevel:', showNextLevel);
        
        const gameOverScreen = document.getElementById('game-over');
        const nextLevelBtn = document.getElementById('next-level-btn');
        const retryLevelBtn = document.getElementById('retry-level-btn');
        const menuBtn = document.getElementById('menu-btn');
        
        console.log('Button elements found:', {
            gameOverScreen: !!gameOverScreen,
            nextLevelBtn: !!nextLevelBtn,
            retryLevelBtn: !!retryLevelBtn,
            menuBtn: !!menuBtn
        });
        
        if (!nextLevelBtn || !retryLevelBtn || !menuBtn) {
            console.error('❌ Game over buttons not found!');
            return;
        }
        
        // Show/hide next level button
        if (showNextLevel && this.currentLevel < this.maxLevel) {
            console.log('✅ Showing next level button');
            nextLevelBtn.style.display = 'inline-block';
        } else {
            console.log('❌ Hiding next level button');
            nextLevelBtn.style.display = 'none';
        }
        
        // Use onclick to ensure only one handler exists
        nextLevelBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('✅ Next level clicked!');
            gameOverScreen.style.display = 'none';
            this.nextLevel();
        };
        
        retryLevelBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('✅ Retry level clicked!');
            gameOverScreen.style.display = 'none';
            this.resetLevel();
        };
        
        menuBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('✅ Menu clicked!');
            gameOverScreen.style.display = 'none';
            this.returnToMainMenu();
        };
        
        console.log('✅ All button handlers attached successfully');
    }
    
    showNicknameEntry() {
        const nicknameEntry = document.getElementById('nickname-entry');
        const scoreDisplay = document.getElementById('nickname-score-display');
        const nicknameInput = document.getElementById('nickname-input');
        const nicknameError = document.getElementById('nickname-error');
        const submitBtn = document.getElementById('nickname-submit-btn');
        const cancelBtn = document.getElementById('nickname-cancel-btn');
        
        // Calculate total score from localStorage
        const totalStats = this.saveSystem.getTotalStats();
        const totalScore = totalStats.totalHighScore;
        const levelsCompleted = totalStats.levelsCompleted;
        
        scoreDisplay.textContent = `Total Score: ${totalScore.toFixed(1)} (${levelsCompleted}/10 levels)`;
        
        // Clear previous input
        nicknameInput.value = '';
        nicknameError.textContent = '';
        
        // Show screen
        nicknameEntry.style.display = 'block';
        nicknameInput.focus();
        
        // Handle input validation - uppercase and filter non-letters
        nicknameInput.oninput = () => {
            const current = nicknameInput.value;
            const filtered = current.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase();
            
            // Only update if changed to avoid cursor issues
            if (filtered !== current) {
                const cursorPos = nicknameInput.selectionStart;
                nicknameInput.value = filtered;
                // Restore cursor position
                nicknameInput.setSelectionRange(filtered.length, filtered.length);
            }
            
            if (nicknameError.textContent) {
                nicknameError.textContent = '';
            }
        };
        
        // Handle submit
        submitBtn.onclick = async () => {
            const nickname = nicknameInput.value.toUpperCase();
            const validation = this.leaderboardService.validateNickname(nickname);
            
            if (!validation.valid) {
                nicknameError.textContent = validation.error;
                return;
            }
            
            // Submit to leaderboard
            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting...';
            
            // Get total score from localStorage
            const totalStats = this.saveSystem.getTotalStats();
            
            // Get or create device ID
            const deviceId = this.getOrCreateDeviceId();
            
            const result = await this.leaderboardService.submitScore(
                nickname,
                totalStats.totalHighScore,
                totalStats.levelsCompleted,
                deviceId
            );
            
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit';
            
            if (result.success) {
                console.log('✅ Score submitted successfully!');
                
                // Handle worse score scenario
                if (result.worseScore) {
                    const confirmed = confirm(
                        `This device has a higher score (${result.existingScore.toFixed(1)}) under "${result.existingNickname}".\n\n` +
                        `Would you like to change that entry's nickname to "${nickname}"?`
                    );
                    
                    if (confirmed) {
                        // Update just the nickname
                        const updateResult = await this.leaderboardService.updateNickname(deviceId, nickname);
                        
                        if (updateResult.success) {
                            nicknameEntry.style.display = 'none';
                            alert(`✅ ${updateResult.message}`);
                            this.showLeaderboard();
                        } else {
                            nicknameError.textContent = updateResult.error || 'Failed to update nickname';
                        }
                    } else {
                        nicknameEntry.style.display = 'none';
                        alert('Keeping existing nickname.');
                    }
                    return;
                }
                
                nicknameEntry.style.display = 'none';
                
                // Show feedback message
                if (result.newPlayer) {
                    alert('🎉 Welcome to the leaderboard!');
                } else if (result.improved) {
                    alert('✨ New high score! Your leaderboard entry has been updated!');
                } else if (result.nicknameChanged) {
                    alert('✅ Nickname updated successfully!');
                } else {
                    alert('No changes made.');
                }
                
                this.showLeaderboard(); // Show full leaderboard sorted by total
            } else {
                nicknameError.textContent = result.error || 'Failed to submit score';
            }
        };
        
        // Handle cancel
        cancelBtn.onclick = () => {
            nicknameEntry.style.display = 'none';
        };
        
        // Handle Enter key
        nicknameInput.onkeydown = (e) => {
            if (e.key === 'Enter') {
                submitBtn.click();
            } else if (e.key === 'Escape') {
                cancelBtn.click();
            }
        };
    }
    
    async showLeaderboard() {
        const leaderboardScreen = document.getElementById('leaderboard-screen');
        const tbody = document.getElementById('leaderboard-tbody');
        const closeBtn = document.getElementById('leaderboard-close-btn');
        const submitScoreBtn = document.getElementById('leaderboard-submit-score-btn');
        
        // Always show submit score button when leaderboard is opened
        if (submitScoreBtn) {
            submitScoreBtn.style.display = 'inline-block';
            submitScoreBtn.onclick = () => {
                leaderboardScreen.style.display = 'none';
                this.showNicknameEntry();
            };
        }
        
        // Show screen
        leaderboardScreen.style.display = 'block';
        
        // Load leaderboard data
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 40px;">Loading...</td></tr>';
        
        const result = await this.leaderboardService.getLeaderboard(50);
        
        if (result.success && result.entries.length > 0) {
            tbody.innerHTML = result.entries.map((entry, index) => `
                <tr>
                    <td style="padding: 10px;">${index + 1}</td>
                    <td style="padding: 10px; font-weight: bold; color: #FFD700;">${entry.nickname}</td>
                    <td style="padding: 10px;">${entry.levelsCompleted || 0}/10</td>
                    <td style="padding: 10px; text-align: right; font-weight: bold; color: #4CAF50;">${entry.totalScore.toFixed(1)}</td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 40px;">No entries yet. Be the first!</td></tr>';
        }
        
        // Close button
        closeBtn.onclick = () => {
            leaderboardScreen.style.display = 'none';
        };
    }
    
    updateUI() {
        const destroyedCounts = this.level.getDestroyedCounts();
        const currentScore = this.calculateFinalScore();
        
        document.getElementById('targets').textContent = this.level.getRemainingTargets();
        document.getElementById('ammo').textContent = this.ammo;
        document.getElementById('score').textContent = currentScore.toFixed(1);
        document.getElementById('level').textContent = this.currentLevel;
        document.getElementById('power').textContent = Math.round(this.power);
        
        // Show high score if available
        const highScore = this.saveSystem.getHighScore(this.currentLevel);
        const highScoreEl = document.getElementById('high-score');
        if (highScoreEl && highScore > 0) {
            highScoreEl.textContent = highScore.toFixed(1);
            highScoreEl.parentElement.style.display = 'block';
        } else if (highScoreEl) {
            highScoreEl.parentElement.style.display = 'none';
        }
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

