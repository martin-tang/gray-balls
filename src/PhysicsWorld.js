import * as CANNON from 'cannon-es';

export class PhysicsWorld {
    constructor() {
        this.world = new CANNON.World({
            gravity: new CANNON.Vec3(0, -9.82, 0)
        });
        
        // Improve physics performance
        this.world.broadphase = new CANNON.NaiveBroadphase();
        this.world.solver.iterations = 10;
        
        // Materials and contact properties
        this.groundMaterial = new CANNON.Material('ground');
        this.objectMaterial = new CANNON.Material('object');
        this.projectileMaterial = new CANNON.Material('projectile');
        
        // Define contact behavior
        const groundObjectContact = new CANNON.ContactMaterial(
            this.groundMaterial,
            this.objectMaterial,
            { friction: 0.4, restitution: 0.3 }
        );
        
        const projectileObjectContact = new CANNON.ContactMaterial(
            this.projectileMaterial,
            this.objectMaterial,
            { friction: 0.3, restitution: 0.6 }
        );
        
        this.world.addContactMaterial(groundObjectContact);
        this.world.addContactMaterial(projectileObjectContact);
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

