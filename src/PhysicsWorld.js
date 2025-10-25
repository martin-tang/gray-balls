import * as CANNON from 'cannon-es';

export class PhysicsWorld {
    constructor() {
        this.world = new CANNON.World({
            gravity: new CANNON.Vec3(0, -9.82, 0)
        });
        
        // Enable sleeping for better performance and stability
        this.world.allowSleep = true;
        
        // Improve physics performance
        this.world.broadphase = new CANNON.NaiveBroadphase();
        this.world.solver.iterations = 10;
        
        // Materials and contact properties
        this.groundMaterial = new CANNON.Material('ground');
        this.objectMaterial = new CANNON.Material('object');
        this.projectileMaterial = new CANNON.Material('projectile');
        
        // Define contact behavior (restitution = 0 to prevent bouncing on spawn)
        const groundObjectContact = new CANNON.ContactMaterial(
            this.groundMaterial,
            this.objectMaterial,
            { 
                friction: 0.4, 
                restitution: 0.01,  // Minimal bounce (was 0.3)
                contactEquationStiffness: 1e8,
                contactEquationRelaxation: 3
            }
        );
        
        const projectileObjectContact = new CANNON.ContactMaterial(
            this.projectileMaterial,
            this.objectMaterial,
            { 
                friction: 0.3, 
                restitution: 0.6,  // Some bounce for impact realism
                contactEquationStiffness: 1e7,
                contactEquationRelaxation: 3
            }
        );
        
        this.world.addContactMaterial(groundObjectContact);
        this.world.addContactMaterial(projectileObjectContact);
        
        // Store collision callbacks
        this.collisionCallbacks = [];
        
        // Set up collision event listeners
        this.setupCollisionListeners();
    }
    
    setupCollisionListeners() {
        // Listen for collision events
        this.world.addEventListener('beginContact', (event) => {
            const bodyA = event.bodyA;
            const bodyB = event.bodyB;
            
            // Check if one is a projectile and the other is an object
            const isProjectileCollision = 
                (bodyA.material === this.projectileMaterial && bodyB.material === this.objectMaterial) ||
                (bodyB.material === this.projectileMaterial && bodyA.material === this.objectMaterial);
            
            if (isProjectileCollision) {
                // Determine which is projectile and which is object
                const projectileBody = bodyA.material === this.projectileMaterial ? bodyA : bodyB;
                const objectBody = bodyA.material === this.projectileMaterial ? bodyB : bodyA;
                
                // Calculate impact force
                const impactForce = this.calculateImpactForce(projectileBody, objectBody);
                
                // Notify all registered callbacks
                this.collisionCallbacks.forEach(callback => {
                    callback(projectileBody, objectBody, impactForce);
                });
            }
        });
    }
    
    calculateImpactForce(projectileBody, objectBody) {
        // Get relative velocity at impact
        const relativeVelocity = new CANNON.Vec3();
        projectileBody.velocity.vsub(objectBody.velocity, relativeVelocity);
        
        // Calculate impact speed (magnitude of relative velocity)
        const impactSpeed = relativeVelocity.length();
        
        // Calculate impact force using impulse approximation
        // F = m * v (simplified, assumes collision happens over very short time)
        // Using projectile's mass and relative velocity for force calculation
        const projectileMass = projectileBody.mass;
        const impactForce = projectileMass * impactSpeed;
        
        return impactForce;
    }
    
    registerCollisionCallback(callback) {
        this.collisionCallbacks.push(callback);
    }
    
    clearCollisionCallbacks() {
        this.collisionCallbacks = [];
    }
    
    step(deltaTime) {
        this.world.step(1/60, deltaTime, 3);
    }
    
    addBody(body) {
        this.world.addBody(body);
    }
    
    removeBody(body) {
        this.world.removeBody(body);
    }
    
    getBodyCount() {
        return this.world.bodies.length;
    }
    
    sleepAllBodies() {
        // Force all bodies to sleep (useful after level load)
        this.world.bodies.forEach(body => {
            if (body.mass > 0 && body.type === CANNON.Body.DYNAMIC) {
                body.velocity.set(0, 0, 0);
                body.angularVelocity.set(0, 0, 0);
                body.sleep();
            }
        });
    }
    
    createGroundBody() {
        const groundShape = new CANNON.Plane();
        const groundBody = new CANNON.Body({ 
            mass: 0,
            shape: groundShape,
            material: this.groundMaterial
        });
        groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
        this.addBody(groundBody);
        return groundBody;
    }
}

