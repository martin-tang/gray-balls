import * as THREE from 'three';
import * as CANNON from 'cannon-es';

/**
 * Medieval Assets - Procedurally generated medieval props for the battlefield
 * All assets use cartoon styling with flat shading and bright colors
 */

export class MedievalAssets {
    constructor(scene, physicsWorld, random = null) {
        this.scene = scene;
        this.physicsWorld = physicsWorld;
        this.assets = [];
        // Use provided seeded random or fallback to Math.random
        this.random = random;
    }
    
    // Helper method to get random value (uses seeded random if available)
    getRandom() {
        return this.random ? this.random.next() : Math.random();
    }
    
    // Helper method to pick from array
    randomPick(array) {
        return this.random ? this.random.pick(array) : array[Math.floor(Math.random() * array.length)];
    }

    // Tower - Medieval stone tower with battlements
    createTower(position, height = 12, radius = 2.5) {
        const group = new THREE.Group();
        
        // Main tower body
        const segments = 8;
        const towerGeo = new THREE.CylinderGeometry(radius, radius * 1.2, height, segments);
        const towerMat = new THREE.MeshStandardMaterial({ 
            color: 0x8B8680,  // Stone gray
            flatShading: true,
            roughness: 0.9
        });
        const tower = new THREE.Mesh(towerGeo, towerMat);
        tower.position.y = height / 2 - 5; // Sink into ground
        tower.castShadow = true;
        tower.receiveShadow = true;
        group.add(tower);
        
        // Battlements on top
        const battHeight = 0.8;
        const battWidth = 0.4;
        const battCount = 8;
        for (let i = 0; i < battCount; i++) {
            const angle = (i / battCount) * Math.PI * 2;
            const battGeo = new THREE.BoxGeometry(battWidth, battHeight, battWidth);
            const battleMat = new THREE.MeshStandardMaterial({ 
                color: 0x9B9690,
                flatShading: true,
                roughness: 0.9
            });
            const battlement = new THREE.Mesh(battGeo, battleMat);
            battlement.position.set(
                Math.cos(angle) * (radius - 0.2),
                height + battHeight / 2 - 5,
                Math.sin(angle) * (radius - 0.2)
            );
            battlement.castShadow = true;
            group.add(battlement);
        }
        
        // Conical roof
        const roofGeo = new THREE.ConeGeometry(radius + 0.3, 1.5, segments);
        const roofMat = new THREE.MeshStandardMaterial({ 
            color: 0x8B4513,  // Brown wood
            flatShading: true,
            roughness: 0.8
        });
        const roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.y = height + battHeight + 0.75 - 5;
        roof.castShadow = true;
        group.add(roof);
        
        // Windows/arrow slits
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const windowGeo = new THREE.BoxGeometry(0.2, 0.8, 0.1);
            const windowMat = new THREE.MeshStandardMaterial({ 
                color: 0x2C2C2C,
                flatShading: true
            });
            const window = new THREE.Mesh(windowGeo, windowMat);
            window.position.set(
                Math.cos(angle) * (radius + 0.05),
                height * 0.6,
                Math.sin(angle) * (radius + 0.05)
            );
            window.rotation.y = -angle;
            group.add(window);
        }
        
        group.position.copy(position);
        this.scene.add(group);
        
        // Physics body - STATIC (immovable)
        const body = new CANNON.Body({
            mass: 0,
            type: CANNON.Body.STATIC,
            shape: new CANNON.Cylinder(radius, radius * 1.2, height, segments),
            position: new CANNON.Vec3(position.x, position.y + height / 2 - 5, position.z),
            material: this.physicsWorld.objectMaterial
        });
        this.physicsWorld.addBody(body);
        
        this.assets.push({ mesh: group, body, type: 'tower' });
        return group;
    }

    // Medieval Tent
    createTent(position, size = 3) {
        const group = new THREE.Group();
        
        // Tent body (pyramid shape)
        const tentGeo = new THREE.ConeGeometry(size, size * 1.2, 4);
        const colors = [0xDC143C, 0x4169E1, 0xFFD700, 0x228B22]; // Red, Blue, Gold, Green
        const color = this.randomPick(colors);  
        const tentMat = new THREE.MeshStandardMaterial({ 
            color: color,
            flatShading: true,
            roughness: 0.7
        });
        const tent = new THREE.Mesh(tentGeo, tentMat);
        tent.position.y = size * 0.6 - 2;
        tent.rotation.y = Math.PI / 4; // Rotate to make square
        tent.castShadow = true;
        tent.receiveShadow = true;
        group.add(tent);
        
        // Tent pole (sticking out top)
        const poleGeo = new THREE.CylinderGeometry(0.05, 0.05, size * 0.4, 6);
        const poleMat = new THREE.MeshStandardMaterial({ 
            color: 0x8B4513,
            flatShading: true
        });
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.y = size - 1  ;
        pole.castShadow = true;
        group.add(pole);
        
        // Small flag on top
        const flagGeo = new THREE.PlaneGeometry(0.4, 0.3);
        const flagMat = new THREE.MeshStandardMaterial({ 
            color: 0xFFFFFF,
            side: THREE.DoubleSide,
            flatShading: true
        });
        const flag = new THREE.Mesh(flagGeo, flagMat);
        flag.position.set(0.2, size - 0.5, 0);
        flag.rotation.y = Math.PI / 4;
        group.add(flag);
        
        // Tent entrance (dark triangle)
        // const entranceGeo = new THREE.PlaneGeometry(size * 0.5, size * 0.8);
        // const entranceMat = new THREE.MeshStandardMaterial({ 
        //     color: 0x1C1C1C,
        //     side: THREE.FrontSide,
        //     flatShading: true
        // });
        // const entrance = new THREE.Mesh(entranceGeo, entranceMat);
        // entrance.position.set(0, size * 0.4, size * 0.49);
        // group.add(entrance);
        
        // group.position.copy(position);
        this.scene.add(group);  
        
        // Physics body - STATIC (immovable)
        const body = new CANNON.Body({
            mass: 0,
            type: CANNON.Body.STATIC,
            shape: new CANNON.Box(new CANNON.Vec3(size * 0.5, size * 0.6, size * 0.5)),
            position: new CANNON.Vec3(position.x, position.y + size * 0.6, position.z),
            material: this.physicsWorld.objectMaterial
        });
        this.physicsWorld.addBody(body);
        
        this.assets.push({ mesh: group, body, type: 'tent' });
        return group;
    }


    // createCastleGate(position, width = 20, height = 18) {
    //     const group = new THREE.Group();
        
    //     // SINK OFFSET - All gate elements lowered to touch ground
    //     const sinkOffset = 5;
        
    //     // Left tower (sits on ground)
    //     const towerRadius = 3.5;
    //     const towerHeight = height;
    //     const leftTower = this.createGateTower(new THREE.Vector3(-width / 2 + towerRadius + 1, 0, 0), towerRadius, towerHeight);
    //     group.add(leftTower);
        
    //     // Right tower (sits on ground)
    //     const rightTower = this.createGateTower(new THREE.Vector3(width / 2 - towerRadius - 1, 0, 0), towerRadius, towerHeight);
    //     group.add(rightTower);
        
    //     // Main gate wall structure
    //     const wallWidth = width - (towerRadius * 2 + 2) * 2;
    //     const wallGeo = new THREE.BoxGeometry(wallWidth, height, 1.5);
    //     const wallMat = new THREE.MeshStandardMaterial({ 
    //         color: 0x9B9690,  // Slightly lighter stone color for better contrast
    //         flatShading: true,
    //         roughness: 0.9
    //     });
    //     const wall = new THREE.Mesh(wallGeo, wallMat);
    //     wall.position.set(0, height / 2 - 5, 0); // Sink deeply into ground
    //     wall.castShadow = true;
    //     wall.receiveShadow = true;
    //     group.add(wall);
        
    //     // Arch opening (carved look)
    //     const archWidth = 7;
    //     const archHeight = 10;
        
    //     // Stone arch frame
    //     const archThickness = 0.8;
    //     const archSegments = 12;
    //     for (let i = 0; i < archSegments; i++) {
    //         const angle = Math.PI - (i / (archSegments - 1)) * Math.PI;
    //         const x = Math.cos(angle) * (archWidth / 2);
    //         const y = Math.sin(angle) * (archHeight / 2) + archHeight / 2;
            
    //         const archStoneGeo = new THREE.BoxGeometry(0.8, 1, archThickness);
    //         const archStoneMat = new THREE.MeshStandardMaterial({ 
    //             color: 0x8B7D73,  // Darker stone for arch frame
    //             flatShading: true,
    //             roughness: 0.95
    //         });
    //         const archStone = new THREE.Mesh(archStoneGeo, archStoneMat);
    //         archStone.position.set(x, y + 0.5 - sinkOffset, 0.8);
    //         archStone.rotation.z = -angle + Math.PI / 2;
    //         archStone.castShadow = true;
    //         group.add(archStone);
    //     }
        
    //     // Vertical arch pillars
    //     const pillarGeo = new THREE.BoxGeometry(1, archHeight / 2, archThickness);
    //     const pillarMat = new THREE.MeshStandardMaterial({ 
    //         color: 0x8B7D73,  // Matching darker stone
    //         flatShading: true
    //     });
        
    //     const leftPillar = new THREE.Mesh(pillarGeo, pillarMat);
    //     leftPillar.position.set(-archWidth / 2, archHeight / 4 + 0.5 - sinkOffset, 0.8);
    //     leftPillar.castShadow = true;
    //     group.add(leftPillar);
        
    //     const rightPillar = new THREE.Mesh(pillarGeo, pillarMat);
    //     rightPillar.position.set(archWidth / 2, archHeight / 4 + 0.5 - sinkOffset, 0.8);
    //     rightPillar.castShadow = true;
    //     group.add(rightPillar);
        
    //     // Wooden gate doors (double doors) - IMPROVED with plank geometry
    //     const doorWidth = archWidth * 0.45;
    //     const doorHeight = archHeight * 0.8;
    //     const plankCount = 6;  // Number of planks per door
    //     const plankHeight = doorHeight / plankCount;
    //     const plankGap = 0.05;  // Small gap between planks
        
    //     for (let doorSide of ['left', 'right']) {
    //         const doorX = doorSide === 'left' ? -doorWidth / 2 - 0.2 : doorWidth / 2 + 0.2;
            
    //         for (let i = 0; i < plankCount; i++) {
    //             const plankGeo = new THREE.BoxGeometry(doorWidth, plankHeight - plankGap, 0.4);
    //             const plankMat = new THREE.MeshStandardMaterial({ 
    //                 color: 0x5D4037,  // Richer brown for aged wood
    //                 flatShading: true,
    //                 roughness: 0.9
    //             });
    //             const plank = new THREE.Mesh(plankGeo, plankMat);
    //             plank.position.set(
    //                 doorX,
    //                 (i * plankHeight) - (doorHeight / 2) + plankHeight / 2 + 0.5 - sinkOffset,
    //                 1.2
    //             );
    //             plank.castShadow = true;
    //             group.add(plank);
    //         }
    //     }
        
    //     // Metal bands on doors - IMPROVED
    //     for (let doorSide of ['left', 'right']) {
    //         const doorX = doorSide === 'left' ? -doorWidth / 2 - 0.2 : doorWidth / 2 + 0.2;
            
    //         for (let i = 0; i < 4; i++) {
    //             const bandGeo = new THREE.BoxGeometry(doorWidth * 0.9, 0.2, 0.15);
    //             const bandMat = new THREE.MeshStandardMaterial({ 
    //                 color: 0x424242,  // Darker gray for aged metal
    //                 flatShading: true,
    //                 metalness: 0.8,
    //                 roughness: 0.3
    //             });
    //             const band = new THREE.Mesh(bandGeo, bandMat);
    //             band.position.set(doorX, 1 + i * 2 - sinkOffset, 1.2 + 0.25);
    //             band.castShadow = true;
    //             group.add(band);
    //         }
    //     }
        
    //     // Door hinges
    //     const hingeGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.1, 8);
    //     const hingeMat = new THREE.MeshStandardMaterial({ 
    //         color: 0x616161,
    //         flatShading: true,
    //         metalness: 0.9,
    //         roughness: 0.2
    //     });
        
    //     for (let doorSide of ['left', 'right']) {
    //         const doorX = doorSide === 'left' ? -doorWidth / 2 - 0.2 : doorWidth / 2 + 0.2;
            
    //         for (let i = 0; i < 3; i++) {
    //             const hinge = new THREE.Mesh(hingeGeo, hingeMat);
    //             hinge.position.set(doorX + (doorSide === 'left' ? -0.2 : 0.2), 1 + i * 3 - sinkOffset, 1.2 - 0.2);
    //             hinge.castShadow = true;
    //             group.add(hinge);
    //         }
    //     }
        
    //     // Door handles
    //     const handleGeo = new THREE.TorusGeometry(0.2, 0.05, 8, 16);
    //     const handleMat = new THREE.MeshStandardMaterial({ 
    //         color: 0x616161,
    //         flatShading: true,
    //         metalness: 0.9,
    //         roughness: 0.2
    //     });
        
    //     for (let doorSide of ['left', 'right']) {
    //         const doorX = doorSide === 'left' ? -doorWidth / 2 - 0.2 : doorWidth / 2 + 0.2;
    //         const handle = new THREE.Mesh(handleGeo, handleMat);
    //         handle.rotation.z = Math.PI / 2;
    //         handle.position.set(doorX + (doorSide === 'left' ? -0.3 : 0.3), 4 - sinkOffset, 1.2 + 0.3);
    //         handle.castShadow = true;
    //         group.add(handle);
    //     }
        
    //     // Portcullis (iron gate) in front
    //     const portcullisHeight = archHeight * 0.85;
    //     const portcullisWidth = archWidth * 0.9;
        
    //     // Vertical bars
    //     for (let i = 0; i < 8; i++) {
    //         const barGeo = new THREE.BoxGeometry(0.15, portcullisHeight, 0.15);
    //         const barMat = new THREE.MeshStandardMaterial({ 
    //             color: 0x37474F,  // Darker iron color
    //             flatShading: true,
    //             metalness: 0.8,
    //             roughness: 0.4
    //         });
    //         const bar = new THREE.Mesh(barGeo, barMat);
    //         bar.position.set(
    //             -portcullisWidth / 2 + (i / 7) * portcullisWidth,
    //             portcullisHeight / 2 + 0.5 - sinkOffset,
    //             1.5
    //         );
    //         bar.castShadow = true;
    //         group.add(bar);
    //     }
        
    //     // Horizontal bars
    //     for (let i = 0; i < 5; i++) {
    //         const hBarGeo = new THREE.BoxGeometry(portcullisWidth, 0.15, 0.15);
    //         const hBarMat = new THREE.MeshStandardMaterial({ 
    //             color: 0x37474F,
    //             flatShading: true,
    //             metalness: 0.8
    //         });
    //         const hBar = new THREE.Mesh(hBarGeo, hBarMat);
    //         hBar.position.set(
    //             0,
    //             0.5 + (i / 4) * portcullisHeight - sinkOffset,
    //             1.5
    //         );
    //         group.add(hBar);
    //     }
        
    //     // Spiked bottom of portcullis
    //     for (let i = 0; i < 7; i++) {
    //         const spikeGeo = new THREE.ConeGeometry(0.15, 0.6, 4);
    //         const spikeMat = new THREE.MeshStandardMaterial({ 
    //             color: 0x37474F,
    //             flatShading: true,
    //             metalness: 0.8
    //         });
    //         const spike = new THREE.Mesh(spikeGeo, spikeMat);
    //         spike.position.set(
    //             -portcullisWidth / 2 + 0.5 + (i / 6) * (portcullisWidth - 1),
    //             0.2 - sinkOffset,
    //             1.5
    //         );
    //         spike.rotation.x = Math.PI;
    //         group.add(spike);
    //     }
        
    //     // Large banner above gate - IMPROVED with more detail
    //     const bannerGeo = new THREE.PlaneGeometry(4, 5);
    //     const bannerMat = new THREE.MeshStandardMaterial({ 
    //         color: 0xB71C1C,  // Deeper red for banner
    //         side: THREE.DoubleSide,
    //         flatShading: true,
    //         roughness: 0.8
    //     });
    //     const banner = new THREE.Mesh(bannerGeo, bannerMat);
    //     banner.position.set(0, height - 3 - sinkOffset, 1.2);
    //     group.add(banner);
        
    //     // Decorative battlements above gate
    //     for (let i = -2; i <= 2; i++) {
    //         const battGeo = new THREE.BoxGeometry(1.2, 1, 1.5);
    //         const battMat = new THREE.MeshStandardMaterial({ 
    //             color: 0x8B7D73,  // Matching stone
    //             flatShading: true
    //         });
    //         const batt = new THREE.Mesh(battGeo, battMat);
    //         batt.position.set(i * 2, height + 0.5 - sinkOffset, 0);
    //         batt.castShadow = true;
    //         group.add(batt);
    //     }
        
    //     group.position.copy(position);
    //     this.scene.add(group);
        
    //     // Physics body (heavy, doesn't move easily)
    //     const body = new CANNON.Body({
    //         mass: 1000,
    //         shape: new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, 0.75)),
    //         position: new CANNON.Vec3(position.x, position.y + height / 2 - 5, position.z),
    //         material: this.physicsWorld.objectMaterial
    //     });
    //     body.velocity.set(0, 0, 0);
    //     body.angularVelocity.set(0, 0, 0);
    //     body.sleep();
    //     this.physicsWorld.addBody(body);
        
    //     this.assets.push({ mesh: group, body, type: 'gate' });
    //     return group;
    // }
    // Castle Gate - Large imposing entrance with arch and portcullis
    createCastleGate(position, width = 20, height = 18) {
        const group = new THREE.Group();
        
        // Left tower (sits on ground)
        const towerRadius = 3.5;
        const towerHeight = height;
        const leftTower = this.createGateTower(new THREE.Vector3(-width / 2 + towerRadius + 1, 0, 0), towerRadius, towerHeight);
        group.add(leftTower);
        
        // Right tower (sits on ground)
        const rightTower = this.createGateTower(new THREE.Vector3(width / 2 - towerRadius - 1, 0, 0), towerRadius, towerHeight);
        group.add(rightTower);
        
        // Main gate wall structure
        const wallWidth = width - (towerRadius * 2 + 2) * 2;
        const wallGeo = new THREE.BoxGeometry(wallWidth, height, 1.5);
        const wallMat = new THREE.MeshStandardMaterial({ 
            color: 0x8B8680,
            flatShading: true,
            roughness: 0.9
        });
        const wall = new THREE.Mesh(wallGeo, wallMat);
        wall.position.set(0, height / 2 - 5, 0); // Sink deeply into ground
        wall.castShadow = true;
        wall.receiveShadow = true;
        group.add(wall);
        
        // SINK OFFSET - All gate elements lowered to touch ground
        const sinkOffset = 5;
        
        // Arch opening (carved look)
        const archWidth = 7;
        const archHeight = 10;
        
        // Stone arch frame
        const archThickness = 0.8;
        const archSegments = 12;
        for (let i = 0; i < archSegments; i++) {
            const angle = Math.PI - (i / (archSegments - 1)) * Math.PI;
            const x = Math.cos(angle) * (archWidth / 2);
            const y = Math.sin(angle) * (archHeight / 2) + archHeight / 2;
            
            const archStoneGeo = new THREE.BoxGeometry(0.8, 1, archThickness);
            const archStoneMat = new THREE.MeshStandardMaterial({ 
                color: 0x9B9690,
                flatShading: true,
                roughness: 0.95
            });
            const archStone = new THREE.Mesh(archStoneGeo, archStoneMat);
            archStone.position.set(x, y + 0.5 - sinkOffset, 0.8);
            archStone.rotation.z = -angle + Math.PI / 2;
            archStone.castShadow = true;
            group.add(archStone);
        }
        
        // Vertical arch pillars
        const pillarGeo = new THREE.BoxGeometry(1, archHeight / 2, archThickness);
        const pillarMat = new THREE.MeshStandardMaterial({ 
            color: 0x9B9690,
            flatShading: true
        });
        
        const leftPillar = new THREE.Mesh(pillarGeo, pillarMat);
        leftPillar.position.set(-archWidth / 2, archHeight / 4 + 0.5 - sinkOffset, 0.8);
        leftPillar.castShadow = true;
        group.add(leftPillar);
        
        const rightPillar = new THREE.Mesh(pillarGeo, pillarMat);
        rightPillar.position.set(archWidth / 2, archHeight / 4 + 0.5 - sinkOffset, 0.8);
        rightPillar.castShadow = true;
        group.add(rightPillar);
        
        // Wooden gate doors (double doors)
        const doorWidth = archWidth * 0.45;
        const doorHeight = archHeight * 0.8;
        const doorGeo = new THREE.BoxGeometry(doorWidth, doorHeight, 0.4);
        const doorMat = new THREE.MeshStandardMaterial({ 
            color: 0x4A2511,
            flatShading: true,
            roughness: 0.9
        });
        
        const leftDoor = new THREE.Mesh(doorGeo, doorMat);
        leftDoor.position.set(-doorWidth / 2 - 0.2, doorHeight / 2 + 0.5 - sinkOffset, 1.2);
        leftDoor.castShadow = true;
        group.add(leftDoor);
        
        const rightDoor = new THREE.Mesh(doorGeo, doorMat);
        rightDoor.position.set(doorWidth / 2 + 0.2, doorHeight / 2 + 0.5 - sinkOffset, 1.2);
        rightDoor.castShadow = true;
        group.add(rightDoor);
        
        // Metal bands on doors
        for (let door of [leftDoor, rightDoor]) {
            for (let i = 0; i < 4; i++) {
                const bandGeo = new THREE.BoxGeometry(doorWidth * 0.9, 0.2, 0.1);
                const bandMat = new THREE.MeshStandardMaterial({ 
                    color: 0x3A3A3A,
                    flatShading: true,
                    metalness: 0.6
                });
                const band = new THREE.Mesh(bandGeo, bandMat);
                band.position.set(door.position.x, 1 + i * 2 - sinkOffset, door.position.z + 0.25);
                group.add(band);
            }
        }
        
        // Portcullis (iron gate) in front
        const portcullisHeight = archHeight * 0.85;
        const portcullisWidth = archWidth * 0.9;
        
        // Vertical bars
        for (let i = 0; i < 8; i++) {
            const barGeo = new THREE.BoxGeometry(0.15, portcullisHeight, 0.15);
            const barMat = new THREE.MeshStandardMaterial({ 
                color: 0x2C2C2C,
                flatShading: true,
                metalness: 0.8,
                roughness: 0.4
            });
            const bar = new THREE.Mesh(barGeo, barMat);
            bar.position.set(
                -portcullisWidth / 2 + (i / 7) * portcullisWidth,
                portcullisHeight / 2 + 0.5 - sinkOffset,
                1.5
            );
            bar.castShadow = true;
            group.add(bar);
        }
        
        // Horizontal bars
        for (let i = 0; i < 5; i++) {
            const hBarGeo = new THREE.BoxGeometry(portcullisWidth, 0.15, 0.15);
            const hBarMat = new THREE.MeshStandardMaterial({ 
                color: 0x2C2C2C,
                flatShading: true,
                metalness: 0.8
            });
            const hBar = new THREE.Mesh(hBarGeo, hBarMat);
            hBar.position.set(
                0,
                0.5 + (i / 4) * portcullisHeight - sinkOffset,
                1.5
            );
            group.add(hBar);
        }
        
        // Spiked bottom of portcullis
        for (let i = 0; i < 7; i++) {
            const spikeGeo = new THREE.ConeGeometry(0.15, 0.6, 4);
            const spikeMat = new THREE.MeshStandardMaterial({ 
                color: 0x2C2C2C,
                flatShading: true,
                metalness: 0.8
            });
            const spike = new THREE.Mesh(spikeGeo, spikeMat);
            spike.position.set(
                -portcullisWidth / 2 + 0.5 + (i / 6) * (portcullisWidth - 1),
                0.2 - sinkOffset,
                1.5
            );
            spike.rotation.x = Math.PI;
            group.add(spike);
        }
        
        // Large banner above gate
        const bannerGeo = new THREE.PlaneGeometry(4, 5);
        const bannerMat = new THREE.MeshStandardMaterial({ 
            color: 0xDC143C,
            side: THREE.DoubleSide,
            flatShading: true
        });
        const banner = new THREE.Mesh(bannerGeo, bannerMat);
        banner.position.set(0, height - 3 - sinkOffset, 1.2);
        group.add(banner);
        
        // Decorative battlements above gate
        for (let i = -2; i <= 2; i++) {
            const battGeo = new THREE.BoxGeometry(1.2, 1, 1.5);
            const battMat = new THREE.MeshStandardMaterial({ 
                color: 0x9B9690,
                flatShading: true
            });
            const batt = new THREE.Mesh(battGeo, battMat);
            batt.position.set(i * 2, height + 0.5 - sinkOffset, 0);
            batt.castShadow = true;
            group.add(batt);
        }
        
        group.position.copy(position);
        this.scene.add(group);
        
        // Physics body - STATIC (immovable)
        const body = new CANNON.Body({
            mass: 0,
            type: CANNON.Body.STATIC,
            shape: new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, 0.75)),
            position: new CANNON.Vec3(position.x, position.y + height / 2 - 5, position.z),
            material: this.physicsWorld.objectMaterial
        });
        this.physicsWorld.addBody(body);
        
        this.assets.push({ mesh: group, body, type: 'gate' });
        return group;
    }

    // Helper for gate towers
    createGateTower(position, radius, height) {
        const group = new THREE.Group();
        
        const towerGeo = new THREE.CylinderGeometry(radius, radius * 1.15, height, 10);
        const towerMat = new THREE.MeshStandardMaterial({ 
            color: 0x8B8680,
            flatShading: true,
            roughness: 0.9
        });
        const tower = new THREE.Mesh(towerGeo, towerMat);
        tower.position.y = height / 2 - 5; // Sink into ground
        tower.castShadow = true;
        tower.receiveShadow = true;
        group.add(tower);
        
        // Battlements on top
        const battCount = 8;
        for (let i = 0; i < battCount; i += 2) {
            const angle = (i / battCount) * Math.PI * 2;
            const battGeo = new THREE.BoxGeometry(0.6, 0.8, 0.6);
            const battMat = new THREE.MeshStandardMaterial({ 
                color: 0x9B9690,
                flatShading: true
            });
            const batt = new THREE.Mesh(battGeo, battMat);
            batt.position.set(
                Math.cos(angle) * radius,
                height + 0.4 - 5,
                Math.sin(angle) * radius
            );
            batt.castShadow = true;
            group.add(batt);
        }
        
        // Conical roof
        const roofGeo = new THREE.ConeGeometry(radius + 0.5, 2.5, 10);
        const roofMat = new THREE.MeshStandardMaterial({ 
            color: 0x8B4513,
            flatShading: true
        });
        const roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.y = height + 0.8 + 1.25 - 5;
        roof.castShadow = true;
        group.add(roof);
        
        // Arrow slits
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const slitGeo = new THREE.BoxGeometry(0.15, 1.2, 0.1);
            const slitMat = new THREE.MeshStandardMaterial({ 
                color: 0x1C1C1C,
                flatShading: true
            });
            const slit = new THREE.Mesh(slitGeo, slitMat);
            slit.position.set(
                Math.cos(angle) * (radius + 0.1),
                height * 0.5,
                Math.sin(angle) * (radius + 0.1)
            );
            slit.rotation.y = -angle;
            group.add(slit);
        }
        
        // Position is set relative to parent, don't copy here
        group.position.copy(position);
        return group;
    }

    // Bonfire with animated flames
    createBonfire(position, size = 1.5) {
        const group = new THREE.Group();
        
        // Stone ring base
        const ringRadius = size * 0.8;
        const stoneCount = 8;
        for (let i = 0; i < stoneCount; i++) {
            const angle = (i / stoneCount) * Math.PI * 2;
            const stoneGeo = new THREE.BoxGeometry(0.3, 0.3, 0.4);
            const stoneMat = new THREE.MeshStandardMaterial({ 
                color: 0x696969,
                flatShading: true,
                roughness: 1.0
            });
            const stone = new THREE.Mesh(stoneGeo, stoneMat);
            stone.position.set(
                Math.cos(angle) * ringRadius,
                0.15,
                Math.sin(angle) * ringRadius
            );
            stone.rotation.y = angle;
            stone.castShadow = true;
            group.add(stone);
        }
        
        // Wood logs (crossed pattern)
        const logGeo = new THREE.CylinderGeometry(0.15, 0.15, size * 1.2, 6);
        const logMat = new THREE.MeshStandardMaterial({ 
            color: 0x4A2511,
            flatShading: true,
            roughness: 0.9
        });
        
        for (let i = 0; i < 4; i++) {
            const log = new THREE.Mesh(logGeo, logMat);
            log.position.y = 0.3;
            log.rotation.z = Math.PI / 2;
            log.rotation.y = (i / 4) * Math.PI;
            log.castShadow = true;
            group.add(log);
        }
        
        // Fire flames (bright emissive cones)
        const flameColors = [0xFF4500, 0xFF6347, 0xFFD700]; // Orange-red-yellow
        for (let i = 0; i < 3; i++) {
            const flameGeo = new THREE.ConeGeometry(0.3 - i * 0.08, 0.8 + i * 0.2, 4);
            const flameMat = new THREE.MeshStandardMaterial({ 
                color: flameColors[i],
                emissive: flameColors[i],
                emissiveIntensity: 0.8,
                flatShading: true,
                transparent: true,
                opacity: 0.9 - i * 0.2
            });
            const flame = new THREE.Mesh(flameGeo, flameMat);
            flame.position.y = 0.6 + i * 0.1;
            flame.rotation.y = (i / 3) * Math.PI;
            group.add(flame);
        }
        
        // Point light for glow
        const fireLight = new THREE.PointLight(0xFF6347, 2, 10);
        fireLight.position.y = 1;
        fireLight.castShadow = false;
        group.add(fireLight);
        
        group.position.copy(position);
        this.scene.add(group);
        
        // Small physics body - STATIC (immovable)
        const body = new CANNON.Body({
            mass: 0,
            type: CANNON.Body.STATIC,
            shape: new CANNON.Cylinder(ringRadius, ringRadius, 0.3, 8),
            position: new CANNON.Vec3(position.x, position.y, position.z),
            material: this.physicsWorld.objectMaterial
        });
        this.physicsWorld.addBody(body);
        
        this.assets.push({ mesh: group, body, type: 'bonfire', fireLight });
        return group;
    }

    // Weapon Rack with swords and axes
    createWeaponRack(position, weaponCount = 4) {
        const group = new THREE.Group();
        
        // Wooden frame - LARGER
        const frameGeo = new THREE.BoxGeometry(3.5, 0.15, 0.5);
        const frameMat = new THREE.MeshStandardMaterial({ 
            color: 0x8B4513,
            flatShading: true,
            roughness: 0.8
        });
        
        // Top bar
        const topBar = new THREE.Mesh(frameGeo, frameMat);
        topBar.position.y = 2.5;
        topBar.castShadow = true;
        group.add(topBar);
        
        // Bottom bar
        const bottomBar = new THREE.Mesh(frameGeo, frameMat);
        bottomBar.position.y = 0.5;
        bottomBar.castShadow = true;
        group.add(bottomBar);
        
        // Side posts
        const postGeo = new THREE.CylinderGeometry(0.15, 0.15, 2.5, 6);
        const leftPost = new THREE.Mesh(postGeo, frameMat);
        leftPost.position.set(-1.6, 1.5, 0);
        leftPost.castShadow = true;
        group.add(leftPost);
        
        const rightPost = new THREE.Mesh(postGeo, frameMat);
        rightPost.position.set(1.6, 1.5, 0);
        rightPost.castShadow = true;
        group.add(rightPost);
        
        // Weapons (alternating swords and axes) - LARGER
        for (let i = 0; i < weaponCount; i++) {
            const x = -1.2 + (i / (weaponCount - 1)) * 2.4;
            const isSword = i % 2 === 0;
            
            if (isSword) {
                // Sword
                const bladeGeo = new THREE.BoxGeometry(0.12, 1.8, 0.03);
                const bladeMat = new THREE.MeshStandardMaterial({ 
                    color: 0xC0C0C0,
                    flatShading: true,
                    metalness: 0.7,
                    roughness: 0.3
                });
                const blade = new THREE.Mesh(bladeGeo, bladeMat);
                blade.position.set(x, 1.5, 0.25);
                blade.castShadow = true;
                group.add(blade);
                
                // Hilt
                const hiltGeo = new THREE.BoxGeometry(0.5, 0.12, 0.06);
                const hiltMat = new THREE.MeshStandardMaterial({ 
                    color: 0x8B4513,
                    flatShading: true
                });
                const hilt = new THREE.Mesh(hiltGeo, hiltMat);
                hilt.position.set(x, 0.6, 0.25);
                group.add(hilt);
            } else {
                // Axe
                const handleGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.4, 6);
                const handleMat = new THREE.MeshStandardMaterial({ 
                    color: 0x654321,
                    flatShading: true
                });
                const handle = new THREE.Mesh(handleGeo, handleMat);
                handle.position.set(x, 1.5, 0.25);
                handle.castShadow = true;
                group.add(handle);
                
                // Axe head
                const axeGeo = new THREE.BoxGeometry(0.5, 0.5, 0.08);
                const axeMat = new THREE.MeshStandardMaterial({ 
                    color: 0x696969,
                    flatShading: true,
                    metalness: 0.6
                });
                const axeHead = new THREE.Mesh(axeGeo, axeMat);
                axeHead.position.set(x, 2.2, 0.25);
                axeHead.castShadow = true;
                group.add(axeHead);
            }
        }
        
        group.position.copy(position);
        this.scene.add(group);
        
        // Physics body - STATIC (immovable)
        const body = new CANNON.Body({
            mass: 0,
            type: CANNON.Body.STATIC,
            shape: new CANNON.Box(new CANNON.Vec3(1, 0.75, 0.15)),
            position: new CANNON.Vec3(position.x, position.y, position.z),
            material: this.physicsWorld.objectMaterial
        });
        this.physicsWorld.addBody(body);
        
        this.assets.push({ mesh: group, body, type: 'weaponRack' });
        return group;
    }

    // Wooden Barrel
    createBarrel(position, radius = 0.8, height = 1.5) {
        const group = new THREE.Group();
        
        // Barrel body
        const barrelGeo = new THREE.CylinderGeometry(radius, radius * 0.9, height, 8);
        const barrelMat = new THREE.MeshStandardMaterial({ 
            color: 0x8B6914,
            flatShading: true,
            roughness: 0.8
        });
        const barrel = new THREE.Mesh(barrelGeo, barrelMat);
        barrel.position.y = height - 1;
        barrel.castShadow = true;
        barrel.receiveShadow = true;
        group.add(barrel);
        
        // Metal rings
        const ringCount = 3;
        for (let i = 0; i < ringCount; i++) {
            const ringGeo = new THREE.TorusGeometry(radius + 0.02, 0.04, 6, 8);
            const ringMat = new THREE.MeshStandardMaterial({ 
                color: 0x4A4A4A,
                flatShading: true,
                metalness: 0.7
            });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.position.y = (height / (ringCount + 1)) * (i + 1);
            ring.rotation.x = Math.PI / 2;
            group.add(ring);
        }
        
        group.position.copy(position);
        this.scene.add(group);
        
        // Physics body - STATIC (immovable)
        const body = new CANNON.Body({
            mass: 0,
            type: CANNON.Body.STATIC,
            shape: new CANNON.Cylinder(radius, radius * 0.9, height, 8),
            position: new CANNON.Vec3(position.x, position.y, position.z),
            material: this.physicsWorld.objectMaterial
        });
        this.physicsWorld.addBody(body);
        
        this.assets.push({ mesh: group, body, type: 'barrel' });
        return group;
    }

    // Standing Banner/Flag
    createBanner(position, height = 5, color = 0xDC143C) {
        const group = new THREE.Group();
        
        // Pole
        const poleGeo = new THREE.CylinderGeometry(0.08, 0.08, height, 6);
        const poleMat = new THREE.MeshStandardMaterial({ 
            color: 0x4A2511,
            flatShading: true,
            roughness: 0.9
        });
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.y = height - 2.5;
        pole.castShadow = true;
        group.add(pole);
        
        // Base
        const baseGeo = new THREE.CylinderGeometry(0.3, 0.4, 0.3, 8);
        const baseMat = new THREE.MeshStandardMaterial({ 
            color: 0x696969,
            flatShading: true
        });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = 0.15;
        base.castShadow = true;
        group.add(base);
        
        // Flag cloth
        const flagGeo = new THREE.PlaneGeometry(1.5, 1);
        const flagMat = new THREE.MeshStandardMaterial({ 
            color: color,
            side: THREE.DoubleSide,
            flatShading: true,
            roughness: 0.7
        });
        const flag = new THREE.Mesh(flagGeo, flagMat);
        flag.position.set(0.75, height - 0.5, 0);
        group.add(flag);
        
        // Gold ornament on top
        const ornamentGeo = new THREE.SphereGeometry(0.15, 6, 6);
        const ornamentMat = new THREE.MeshStandardMaterial({ 
            color: 0xFFD700,
            flatShading: true,
            metalness: 0.8
        });
        const ornament = new THREE.Mesh(ornamentGeo, ornamentMat);
        ornament.position.y = height + 0.15;
        group.add(ornament);
        
        group.position.copy(position);
        this.scene.add(group);
        
        // Physics body - STATIC (immovable)
        const body = new CANNON.Body({
            mass: 0,
            type: CANNON.Body.STATIC,
            shape: new CANNON.Cylinder(0.08, 0.08, height, 6),
            position: new CANNON.Vec3(position.x, position.y, position.z),
            material: this.physicsWorld.objectMaterial
        });
        this.physicsWorld.addBody(body);
        
        this.assets.push({ mesh: group, body, type: 'banner' });
        return group;
    }

    // Wooden Fence Section
    createFence(position, length = 5, height = 2.5, rotation = 0) {
        const group = new THREE.Group();
        
        // Posts
        const postCount = Math.floor(length / 1.5) + 1;
        const postGeo = new THREE.BoxGeometry(0.15, height, 0.15);
        const postMat = new THREE.MeshStandardMaterial({ 
            color: 0x654321,
            flatShading: true,
            roughness: 0.9
        });
        
        for (let i = 0; i < postCount; i++) {
            const post = new THREE.Mesh(postGeo, postMat);
            post.position.set(-length / 2 + (length / (postCount - 1)) * i, height / 2, 0);
            post.castShadow = true;
            group.add(post);
        }
        
        // Horizontal planks
        const plankCount = 3;
        const plankGeo = new THREE.BoxGeometry(length, 0.15, 0.1);
        const plankMat = new THREE.MeshStandardMaterial({ 
            color: 0x8B7355,
            flatShading: true,
            roughness: 0.8
        });
        
        for (let i = 0; i < plankCount; i++) {
            const plank = new THREE.Mesh(plankGeo, plankMat);
            plank.position.set(0, (height / (plankCount + 1)) * (i + 1), 0.08);
            plank.castShadow = true;
            group.add(plank);
        }
        
        group.position.copy(position);
        group.rotation.y = rotation;
        this.scene.add(group);
        
        // Physics body - STATIC (immovable)
        const body = new CANNON.Body({
            mass: 0,
            type: CANNON.Body.STATIC,
            shape: new CANNON.Box(new CANNON.Vec3(length / 2, height / 2, 0.1)),
            position: new CANNON.Vec3(position.x, position.y, position.z),
            material: this.physicsWorld.objectMaterial
        });
        body.quaternion.setFromEuler(0, rotation, 0);
        this.physicsWorld.addBody(body);
        
        this.assets.push({ mesh: group, body, type: 'fence' });
        return group;
    }

    // Watchtower (tall wooden structure)
    createWatchtower(position, height = 10) {
        const group = new THREE.Group();
        
        // Four corner posts
        const postGeo = new THREE.BoxGeometry(0.3, height, 0.3);
        const postMat = new THREE.MeshStandardMaterial({ 
            color: 0x654321,
            flatShading: true,
            roughness: 0.9
        });
        
        const postPositions = [
            [-0.8, 0, -0.8],
            [0.8, 0, -0.8],
            [-0.8, 0, 0.8],
            [0.8, 0, 0.8]
        ];
        
        postPositions.forEach(([x, y, z]) => {
            const post = new THREE.Mesh(postGeo, postMat);
            post.position.set(x, height / 2, z);
            post.castShadow = true;
            group.add(post);
        });
        
        // Platform at top
        const platformGeo = new THREE.BoxGeometry(2.5, 0.2, 2.5);
        const platformMat = new THREE.MeshStandardMaterial({ 
            color: 0x8B6914,
            flatShading: true,
            roughness: 0.8
        });
        const platform = new THREE.Mesh(platformGeo, platformMat);
        platform.position.y = height;
        platform.castShadow = true;
        platform.receiveShadow = true;
        group.add(platform);
        
        // Railings
        const railingGeo = new THREE.BoxGeometry(2.5, 0.15, 0.15);
        const railingMat = new THREE.MeshStandardMaterial({ 
            color: 0x654321,
            flatShading: true
        });
        
        [-1.25, 1.25].forEach(z => {
            const railing = new THREE.Mesh(railingGeo, railingMat);
            railing.position.set(0, height + 0.5, z);
            railing.castShadow = true;
            group.add(railing);
        });
        
        const railingGeo2 = new THREE.BoxGeometry(0.15, 0.15, 2.5);
        [-1.25, 1.25].forEach(x => {
            const railing = new THREE.Mesh(railingGeo2, railingMat);
            railing.position.set(x, height + 0.5, 0);
            railing.castShadow = true;
            group.add(railing);
        });
        
        // Roof
        const roofGeo = new THREE.ConeGeometry(2, 1.5, 4);
        const roofMat = new THREE.MeshStandardMaterial({ 
            color: 0x8B4513,
            flatShading: true
        });
        const roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.y = height + 1.4;
        roof.rotation.y = Math.PI / 4;
        roof.castShadow = true;
        group.add(roof);
        
        group.position.copy(position);
        this.scene.add(group);
        
        // Physics body - STATIC (immovable)
        const body = new CANNON.Body({
            mass: 0,
            type: CANNON.Body.STATIC,
            shape: new CANNON.Box(new CANNON.Vec3(1, height / 2, 1)),
            position: new CANNON.Vec3(position.x, position.y, position.z),
            material: this.physicsWorld.objectMaterial
        });
        this.physicsWorld.addBody(body);
        
        this.assets.push({ mesh: group, body, type: 'watchtower' });
        return group;
    }

    // Stone Wall Section - Castle Courtyard Wall (4x taller)
    createStoneWall(position, length = 10, height = 12, rotation = 0) {
        const group = new THREE.Group();
        
        // Main wall body
        const wallGeo = new THREE.BoxGeometry(length, height, 0.8);
        const wallMat = new THREE.MeshStandardMaterial({ 
            color: 0x8B8680,
            flatShading: true,
            roughness: 1.0
        });
        const wall = new THREE.Mesh(wallGeo, wallMat);
        wall.position.y = height / 2 - 5; // Sink into ground
        wall.castShadow = true;
        wall.receiveShadow = true;
        group.add(wall);
        
        // Battlements on top
        const battCount = Math.floor(length / 0.8);
        const battGeo = new THREE.BoxGeometry(0.5, 0.5, 0.8);
        const battMat = new THREE.MeshStandardMaterial({ 
            color: 0x9B9690,
            flatShading: true
        });
        
        for (let i = 0; i < battCount; i += 2) {
            const batt = new THREE.Mesh(battGeo, battMat);
            batt.position.set(-length / 2 + (length / battCount) * i + 0.4, height + 0.25 - 5, 0);
            batt.castShadow = true;
            group.add(batt);
        }
        
        group.position.copy(position);
        group.rotation.y = rotation;
        this.scene.add(group);
        
        // Physics body - STATIC (immovable)
        const body = new CANNON.Body({
            mass: 0,
            type: CANNON.Body.STATIC,
            shape: new CANNON.Box(new CANNON.Vec3(length / 2, height / 2, 0.4)),
            position: new CANNON.Vec3(position.x, position.y + height / 2 - 5, position.z),
            material: this.physicsWorld.objectMaterial
        });
        body.quaternion.setFromEuler(0, rotation, 0);
        this.physicsWorld.addBody(body);
        
        this.assets.push({ mesh: group, body, type: 'stoneWall' });
        return group;
    }

    // Training Dummy - For archery/combat practice
    createTrainingDummy(position, height = 2.5) {
        const group = new THREE.Group();
        
        // Wooden post
        const postGeo = new THREE.CylinderGeometry(0.15, 0.2, height, 8);
        const postMat = new THREE.MeshStandardMaterial({ 
            color: 0x654321,
            flatShading: true,
            roughness: 0.9
        });
        const post = new THREE.Mesh(postGeo, postMat);
        post.position.y = height / 2;
        post.castShadow = true;
        group.add(post);
        
        // Straw body (cylinder)
        const bodyGeo = new THREE.CylinderGeometry(0.4, 0.5, 1.2, 8);
        const bodyMat = new THREE.MeshStandardMaterial({ 
            color: 0xDEB887,  // Wheat/straw color
            flatShading: true,
            roughness: 0.8
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = height - 0.6;
        body.castShadow = true;
        group.add(body);
        
        // Straw head (sphere)
        const headGeo = new THREE.SphereGeometry(0.3, 8, 6);
        const head = new THREE.Mesh(headGeo, bodyMat);
        head.position.y = height + 0.3;
        head.castShadow = true;
        group.add(head);
        
        // Arms (horizontal cylinders)
        const armGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.8, 6);
        const leftArm = new THREE.Mesh(armGeo, bodyMat);
        leftArm.position.set(-0.4, height - 0.3, 0);
        leftArm.rotation.z = Math.PI / 2;
        leftArm.castShadow = true;
        group.add(leftArm);
        
        const rightArm = new THREE.Mesh(armGeo, bodyMat);
        rightArm.position.set(0.4, height - 0.3, 0);
        rightArm.rotation.z = Math.PI / 2;
        rightArm.castShadow = true;
        group.add(rightArm);
        
        // Base platform
        const baseGeo = new THREE.CylinderGeometry(0.6, 0.7, 0.3, 8);
        const baseMat = new THREE.MeshStandardMaterial({ 
            color: 0x8B4513,
            flatShading: true
        });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = 0.15;
        base.castShadow = true;
        group.add(base);
        
        group.position.copy(position);
        this.scene.add(group);
        
        // Physics body - STATIC (immovable)
        const body_phys = new CANNON.Body({
            mass: 0,
            type: CANNON.Body.STATIC,
            shape: new CANNON.Cylinder(0.4, 0.5, height, 8),
            position: new CANNON.Vec3(position.x, position.y + height / 2, position.z),
            material: this.physicsWorld.objectMaterial
        });
        this.physicsWorld.addBody(body_phys);
        
        this.assets.push({ mesh: group, body: body_phys, type: 'trainingDummy' });
        return group;
    }

    // Well - Stone water well
    createWell(position, height = 2.5) {
        const group = new THREE.Group();
        
        // Stone cylinder base
        const baseGeo = new THREE.CylinderGeometry(1.2, 1.4, height, 12);
        const baseMat = new THREE.MeshStandardMaterial({ 
            color: 0x696969,
            flatShading: true,
            roughness: 1.0
        });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = height - 2.5;
        base.castShadow = true
        base.receiveShadow = true;
        group.add(base);
        
        // Interior (dark, water below)
        const interiorGeo = new THREE.CircleGeometry(1.1, 12);
        const interiorMat = new THREE.MeshStandardMaterial({ 
            color: 0x1C1C1C,
            side: THREE.FrontSide
        });
        const interior = new THREE.Mesh(interiorGeo, interiorMat);
        interior.rotation.x = -Math.PI / 2;
        interior.position.y = height ;
        group.add(interior);
        
        // Wooden posts for roof
        const postGeo = new THREE.CylinderGeometry(0.1, 0.1, 2.5, 6);
        const postMat = new THREE.MeshStandardMaterial({ 
            color: 0x654321,
            flatShading: true
        });
        
        const leftPost = new THREE.Mesh(postGeo, postMat);
        leftPost.position.set(-1, height , 0);
        leftPost.castShadow = true;
        group.add(leftPost);
        
        const rightPost = new THREE.Mesh(postGeo, postMat);
        rightPost.position.set(1, height , 0);
        rightPost.castShadow = true;
        group.add(rightPost);
        
        // Roof (peaked)
        const roofGeo = new THREE.ConeGeometry(1.5, 1.2, 4);
        const roofMat = new THREE.MeshStandardMaterial({ 
            color: 0x8B4513,
            flatShading: true
        });
        const roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.y = height + 1.5;
        roof.rotation.y = Math.PI / 4;
        roof.castShadow = true;
        group.add(roof);
        
        // Crossbeam
        const beamGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.2, 6);
        const beam = new THREE.Mesh(beamGeo, postMat);
        beam.position.set(0, height - 2.2, 0);
        beam.rotation.z = Math.PI / 2;
        beam.castShadow = true;
        group.add(beam);
        
        // Bucket (hanging)
        const bucketGeo = new THREE.CylinderGeometry(0.2, 0.15, 0.3, 8);
        const bucketMat = new THREE.MeshStandardMaterial({ 
            color: 0x8B6914,
            flatShading: true
        });
        const bucket = new THREE.Mesh(bucketGeo, bucketMat);
        bucket.position.set(0.3, height + 1.8, 0);
        bucket.castShadow = true;
        group.add(bucket);
        
        group.position.copy(position);
        this.scene.add(group);
        
        // Physics body - STATIC (immovable)
        const body = new CANNON.Body({
            mass: 0,
            type: CANNON.Body.STATIC,
            shape: new CANNON.Cylinder(1.2, 1.4, height, 12),
            position: new CANNON.Vec3(position.x, position.y + height / 2, position.z),
            material: this.physicsWorld.objectMaterial
        });
        this.physicsWorld.addBody(body);
        
        this.assets.push({ mesh: group, body, type: 'well' });
        return group;
    }

    // Hay Bales - Stacked hay for medieval farm look
    createHayBales(position, count = 3) {
        const group = new THREE.Group();
        
        const hayMat = new THREE.MeshStandardMaterial({ 
            color: 0xDEB887,  // Wheat/hay color
            flatShading: true,
            roughness: 0.9
        });
        
        // Create stacked hay bales
        const baleWidth = 1.2;
        const baleHeight = 0.8;
        const baleDepth = 0.8;
        
        for (let i = 0; i < count; i++) {
            const row = Math.floor(i / 2);
            const col = i % 2;
            
            const baleGeo = new THREE.BoxGeometry(baleWidth, baleHeight, baleDepth);
            const bale = new THREE.Mesh(baleGeo, hayMat);
            bale.position.set(
                col * (baleWidth + 0.1) - baleWidth / 2,
                row * baleHeight + baleHeight / 2,
                0
            );
            bale.rotation.y = (i % 3) * 0.1; // Slight rotation variation
            bale.castShadow = true;
            bale.receiveShadow = true;
            group.add(bale);
            
            // Rope binding (dark lines)
            for (let r = 0; r < 2; r++) {
                const ropeGeo = new THREE.BoxGeometry(baleWidth + 0.05, 0.05, 0.05);
                const ropeMat = new THREE.MeshStandardMaterial({ 
                    color: 0x4A2511,
                    flatShading: true
                });
                const rope = new THREE.Mesh(ropeGeo, ropeMat);
                rope.position.set(
                    bale.position.x,
                    bale.position.y + (r - 0.5) * baleHeight * 0.5,
                    baleDepth / 2 + 0.03
                );
                group.add(rope);
            }
        }
        
        group.position.copy(position);
        this.scene.add(group);
        
        // Physics body - STATIC (immovable)
        const body = new CANNON.Body({
            mass: 0,
            type: CANNON.Body.STATIC,
            shape: new CANNON.Box(new CANNON.Vec3(baleWidth, baleHeight * Math.ceil(count/2), baleDepth)),
            position: new CANNON.Vec3(position.x, position.y - 0.2, position.z),
            material: this.physicsWorld.objectMaterial
        });
        this.physicsWorld.addBody(body);
        
        this.assets.push({ mesh: group, body, type: 'hayBales' });
        return group;
    }

    // Pond - Decorative water feature
    createPond(position, radius = 4) {
        const group = new THREE.Group();
        
        // Water surface (flat circle)
        const waterGeo = new THREE.CircleGeometry(radius, 32);
        const waterMat = new THREE.MeshStandardMaterial({ 
            color: 0x4A90E2,  // Blue water
            flatShading: false,
            roughness: 0.1,
            metalness: 0.3,
            transparent: true,
            opacity: 0.8
        });
        const water = new THREE.Mesh(waterGeo, waterMat);
        water.rotation.x = -Math.PI / 2;
        water.position.y = 0.2; // Slightly below ground level
        water.receiveShadow = true;
        group.add(water);
        
        // Stone edge around pond
        const stoneCount = 24;
        for (let i = 0; i < stoneCount; i++) {
            const angle = (i / stoneCount) * Math.PI * 2;
            const stoneRadius = 0.2 + Math.random() * 0.2;
            const stoneGeo = new THREE.BoxGeometry(stoneRadius, stoneRadius * 0.5, stoneRadius);
            const stoneMat = new THREE.MeshStandardMaterial({ 
                color: 0x696969,
                flatShading: true,
                roughness: 1.0
            });
            const stone = new THREE.Mesh(stoneGeo, stoneMat);
            const distance = radius + stoneRadius / 2;
            stone.position.set(
                Math.cos(angle) * distance,
                0.25,
                Math.sin(angle) * distance
            );
            stone.rotation.y = Math.random() * Math.PI;
            stone.castShadow = true;
            group.add(stone);
        }
        
        // Lily pads (small green circles)
        for (let i = 0; i < 5; i++) {
            const lilyGeo = new THREE.CircleGeometry(0.3 + this.getRandom() * 0.2, 8);
            const lilyMat = new THREE.MeshStandardMaterial({ 
                color: 0x4A7C59,
                flatShading: true,
                side: THREE.DoubleSide
            });
            const lily = new THREE.Mesh(lilyGeo, lilyMat);
            const angle = this.getRandom() * Math.PI * 2;
            const distance = this.getRandom() * (radius - 0.5);
            lily.position.set(
                Math.cos(angle) * distance,
                0.25,
                Math.sin(angle) * distance
            );
            lily.rotation.x = -Math.PI / 2;
            group.add(lily);
        }
        
        group.position.copy(position);
        this.scene.add(group);
        
        // No physics body - decorative only
        this.assets.push({ mesh: group, body: null, type: 'pond' });
        return group;
    }

    // Update method for animated assets (like bonfire flames)
    update(deltaTime) {
        this.assets.forEach(asset => {
            if (!asset.body || !asset.mesh) return;
            
            // Sync physics with visuals
            asset.mesh.position.copy(asset.body.position);
            asset.mesh.quaternion.copy(asset.body.quaternion);
            
            // Animate bonfire flames
            if (asset.type === 'bonfire' && asset.mesh.children) {
                asset.mesh.children.forEach((child, index) => {
                    if (child.geometry && child.geometry.type === 'ConeGeometry') {
                        child.rotation.y += deltaTime * (0.5 + index * 0.2);
                        child.scale.y = 1 + Math.sin(Date.now() * 0.005 + index) * 0.1;
                    }
                });
                
                // Flicker the fire light
                if (asset.fireLight) {
                    asset.fireLight.intensity = 2 + Math.sin(Date.now() * 0.01) * 0.5;
                }
            }
            
            // Remove if fallen off world
            if (asset.body.position.y < -10) {
                this.removeAsset(asset);
            }
        });
    }

    removeAsset(asset) {
        if (asset.mesh) this.scene.remove(asset.mesh);
        if (asset.body) this.physicsWorld.removeBody(asset.body);
        const index = this.assets.indexOf(asset);
        if (index > -1) this.assets.splice(index, 1);
    }

    clear() {
        this.assets.forEach(asset => this.removeAsset(asset));
        this.assets = [];
    }
}

