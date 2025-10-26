import * as THREE from 'three';

export class LevelCreator {
    constructor(game) {
        this.game = game;
        this.isActive = false;
        this.placedObjects = [];
        this.selectedObjectIndex = null;
        this.currentType = 'building';
        this.currentBuildingType = 'wall';
        this.currentTargetType = 'basic';
        this.gridSize = 1;
        this.ghostObject = null;
        this.highlightMesh = null;
        this.baseX = 25;
        
        this.createUI();
        this.setupControls();
    }
    
    createUI() {
        // Main container
        const container = document.createElement('div');
        container.id = 'level-creator';
        container.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 20px;
            border-radius: 10px;
            font-family: monospace;
            font-size: 12px;
            max-width: 300px;
            max-height: 90vh;
            overflow-y: auto;
            z-index: 10000;
            display: none;
        `;
        
        container.innerHTML = `
            <h2 style="margin: 0 0 15px 0; color: #FFD700;">🎨 Level Creator</h2>
            
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px;">Object Type:</label>
                <select id="creator-object-type" style="width: 100%; padding: 5px; background: #333; color: white; border: 1px solid #555;">
                    <option value="building">Building</option>
                    <option value="target">Target</option>
                </select>
            </div>
            
            <div id="building-types" style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px;">Building Type:</label>
                <select id="creator-building-type" style="width: 100%; padding: 5px; background: #333; color: white; border: 1px solid #555;">
                    <option value="wall">Wall</option>
                    <option value="tower">Tower</option>
                    <option value="castle">Castle</option>
                    <option value="platform">Platform</option>
                    <option value="indestructible-wall">Indestructible Wall</option>
                    <option value="indestructible-tower">Indestructible Tower</option>
                    <option value="indestructible-platform">Indestructible Platform</option>
                    <option value="indestructible-pillar">Indestructible Pillar</option>
                    <option value="indestructible-block">Indestructible Block</option>
                </select>
            </div>
            
            <div id="target-types" style="margin-bottom: 15px; display: none;">
                <label style="display: block; margin-bottom: 5px;">Target Type:</label>
                <select id="creator-target-type" style="width: 100%; padding: 5px; background: #333; color: white; border: 1px solid #555;">
                    <option value="basic">Basic</option>
                    <option value="soldier">Soldier</option>
                    <option value="upgraded-soldier">Upgraded Soldier</option>
                    <option value="loot">Loot</option>
                    <option value="training-dummy">Training Dummy</option>
                </select>
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px;">Base X Position:</label>
                <input type="number" id="creator-base-x" value="25" step="5" style="width: 100%; padding: 5px; background: #333; color: white; border: 1px solid #555;">
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px;">Grid Snap:</label>
                <input type="number" id="creator-grid-size" value="1" step="0.5" min="0.1" style="width: 100%; padding: 5px; background: #333; color: white; border: 1px solid #555;">
            </div>
            
            <div style="margin-bottom: 15px; padding: 10px; background: #222; border-radius: 5px;">
                <strong>Controls:</strong><br>
                • Click list item to select<br>
                • Ctrl+Click ground to place<br>
                • Delete/Backspace to remove<br>
                • Arrow keys to move selected<br>
                • PageUp/Down for height<br>
                • Q/E rotate Y (yaw) 15°<br>
                • R/F rotate X (pitch) 15°<br>
                • T/G rotate Z (roll) 15°<br>
                • Shift for 45° rotation<br>
                • H to toggle grid<br>
                • Ctrl+C to clear all
            </div>
            
            <div style="margin-bottom: 10px;">
                <button id="creator-import" style="width: 100%; padding: 10px; background: #2196F3; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; margin-bottom: 5px;">
                    📥 Import Current Level
                </button>
                <button id="creator-export" style="width: 100%; padding: 10px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; margin-bottom: 5px;">
                    📋 Export Code
                </button>
                <button id="creator-clear" style="width: 100%; padding: 10px; background: #f44336; color: white; border: none; border-radius: 5px; cursor: pointer; margin-bottom: 5px;">
                    🗑️ Clear All
                </button>
                <button id="creator-close" style="width: 100%; padding: 10px; background: #555; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    ✖️ Close Creator
                </button>
            </div>
            
            <div id="creator-objects-list" style="margin-top: 15px; padding: 10px; background: #222; border-radius: 5px; max-height: 200px; overflow-y: auto;">
                <strong>Placed Objects (0):</strong>
                <div id="creator-objects-items" style="margin-top: 5px; font-size: 11px;"></div>
            </div>
        `;
        
        document.body.appendChild(container);
        this.ui = container;
        
        // Setup event listeners
        document.getElementById('creator-object-type').onchange = (e) => {
            this.currentType = e.target.value;
            document.getElementById('building-types').style.display = 
                this.currentType === 'building' ? 'block' : 'none';
            document.getElementById('target-types').style.display = 
                this.currentType === 'target' ? 'block' : 'none';
            this.updateGhostObject();
        };
        
        document.getElementById('creator-building-type').onchange = (e) => {
            this.currentBuildingType = e.target.value;
            this.updateGhostObject();
        };
        
        document.getElementById('creator-target-type').onchange = (e) => {
            this.currentTargetType = e.target.value;
            this.updateGhostObject();
        };
        
        document.getElementById('creator-base-x').onchange = (e) => {
            this.baseX = parseFloat(e.target.value);
        };
        
        document.getElementById('creator-grid-size').onchange = (e) => {
            this.gridSize = parseFloat(e.target.value);
        };
        
        document.getElementById('creator-import').onclick = () => this.importCurrentLevel();
        document.getElementById('creator-export').onclick = () => this.exportLevel();
        document.getElementById('creator-clear').onclick = () => this.clearAll();
        document.getElementById('creator-close').onclick = () => this.toggle();
    }
    
    setupControls() {
        // Mouse click to place
        this.clickHandler = (e) => {
            if (!this.isActive) return;
            
            // Get mouse position
            const mouse = new THREE.Vector2(
                (e.clientX / window.innerWidth) * 2 - 1,
                -(e.clientY / window.innerHeight) * 2 + 1
            );
            
            // Raycast to ground
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, this.game.camera);
            
            const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
            const intersectPoint = new THREE.Vector3();
            raycaster.ray.intersectPlane(groundPlane, intersectPoint);
            
            if (intersectPoint) {
                if (e.ctrlKey || e.metaKey) {
                    // Ctrl+Click to place object
                    this.placeObject(intersectPoint);
                }
                // Selection disabled - use dropdown list only
            }
        };
        
        // Keyboard controls
        this.keyHandler = (e) => {
            console.log('⌨️ Key pressed:', e.key, 'isActive:', this.isActive, 'selectedIndex:', this.selectedObjectIndex);
            
            if (!this.isActive) return;
            
            // Support multiple delete key variations (Delete, Backspace, Del)
            const isDeleteKey = e.key === 'Delete' || e.key === 'Backspace' || e.key === 'Del';
            if (isDeleteKey && this.selectedObjectIndex !== null) {
                e.preventDefault();
                e.stopPropagation();
                console.log('🗑️ Delete key pressed, selected index:', this.selectedObjectIndex);
                this.deleteSelected();
                return;
            }
            
            if (e.key === 'c' && e.ctrlKey) {
                e.preventDefault();
                e.stopPropagation();
                this.clearAll();
                return;
            }
            
            if (e.key === 'h' || e.key === 'H') {
                e.preventDefault();
                e.stopPropagation();
                // Toggle grid snap
                this.gridSize = this.gridSize === 0 ? 1 : 0;
                document.getElementById('creator-grid-size').value = this.gridSize;
                console.log('📐 Grid snap toggled:', this.gridSize);
                return;
            }
            
            if (this.selectedObjectIndex !== null) {
                const obj = this.placedObjects[this.selectedObjectIndex];
                if (!obj) return;
                
                const moveSpeed = this.gridSize || 0.5;
                let moved = false;
                let rotated = false;
                
                // Initialize rotations if not set
                if (obj.rotationX === undefined) obj.rotationX = 0;
                if (obj.rotationY === undefined) obj.rotationY = obj.rotation || 0;
                if (obj.rotationZ === undefined) obj.rotationZ = 0;
                
                // Rotation controls
                const rotationStep = e.shiftKey ? Math.PI / 4 : Math.PI / 12; // 45° or 15°
                
                // Y-axis rotation (yaw) - Q/E
                if (e.key === 'q' || e.key === 'Q') {
                    e.preventDefault();
                    obj.rotationY -= rotationStep;
                    rotated = true;
                }
                if (e.key === 'e' || e.key === 'E') {
                    e.preventDefault();
                    obj.rotationY += rotationStep;
                    rotated = true;
                }
                
                // X-axis rotation (pitch) - R/F
                if (e.key === 'r' || e.key === 'R') {
                    e.preventDefault();
                    obj.rotationX -= rotationStep;
                    rotated = true;
                }
                if (e.key === 'f' || e.key === 'F') {
                    e.preventDefault();
                    obj.rotationX += rotationStep;
                    rotated = true;
                }
                
                // Z-axis rotation (roll) - T/G
                if (e.key === 't' || e.key === 'T') {
                    e.preventDefault();
                    obj.rotationZ -= rotationStep;
                    rotated = true;
                }
                if (e.key === 'g' || e.key === 'G') {
                    e.preventDefault();
                    obj.rotationZ += rotationStep;
                    rotated = true;
                }
                
                // Keep backward compatibility
                obj.rotation = obj.rotationY;
                
                // Movement controls
                if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    obj.position.x -= moveSpeed;
                    moved = true;
                }
                if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    obj.position.x += moveSpeed;
                    moved = true;
                }
                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    obj.position.z += moveSpeed;
                    moved = true;
                }
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    obj.position.z -= moveSpeed;
                    moved = true;
                }
                if (e.key === 'PageUp') {
                    e.preventDefault();
                    obj.position.y += moveSpeed;
                    moved = true;
                }
                if (e.key === 'PageDown') {
                    e.preventDefault();
                    obj.position.y = Math.max(0, obj.position.y - moveSpeed);
                    moved = true;
                }
                
                if (moved || rotated) {
                    // Apply rotation to the game object
                    if (rotated && obj.originalObject && obj.originalObject.mesh) {
                        obj.originalObject.mesh.rotation.x = obj.rotationX;
                        obj.originalObject.mesh.rotation.y = obj.rotationY;
                        obj.originalObject.mesh.rotation.z = obj.rotationZ;
                        if (obj.originalObject.body) {
                            obj.originalObject.body.quaternion.setFromEuler(obj.rotationX, obj.rotationY, obj.rotationZ);
                        }
                    }
                    this.updateObjectsList();
                }
            }
        };
    }
    
    toggle() {
        this.isActive = !this.isActive;
        this.ui.style.display = this.isActive ? 'block' : 'none';
        
        if (this.isActive) {
            // Disable game controls
            this.disableGameControls();
            
            console.log('🎨 Level Creator activated');
            console.log('📝 Adding event listeners...');
            document.addEventListener('click', this.clickHandler);
            document.addEventListener('keydown', this.keyHandler);
            console.log('✅ Event listeners added');
            
            this.updateGhostObject();
            
            // Show import prompt if no objects placed
            if (this.placedObjects.length === 0) {
                setTimeout(() => {
                    if (confirm('Import current level objects to edit them?')) {
                        this.importCurrentLevel();
                    }
                }, 100);
            }
        } else {
            // Re-enable game controls
            this.enableGameControls();
            
            console.log('🎨 Level Creator deactivated');
            document.removeEventListener('click', this.clickHandler);
            document.removeEventListener('keydown', this.keyHandler);
            
            // Remove ghost object
            if (this.ghostObject) {
                this.game.scene.remove(this.ghostObject);
                this.ghostObject = null;
            }
            
            // Remove highlight
            if (this.highlightMesh) {
                this.game.scene.remove(this.highlightMesh);
                this.highlightMesh = null;
            }
        }
    }
    
    disableGameControls() {
        // Reset all game keys to prevent stuck keys
        Object.keys(this.game.keys).forEach(key => {
            this.game.keys[key] = false;
        });
        
        // Hide trajectory preview
        if (this.game.trajectory && this.game.trajectory.line) {
            this.game.trajectory.line.visible = false;
        }
        
        // Store that creator is active so game can check it
        this.game.levelCreatorActive = true;
        
        console.log('🎨 Level Creator active - game controls disabled');
    }
    
    enableGameControls() {
        // Show trajectory preview again
        if (this.game.trajectory && this.game.trajectory.line) {
            this.game.trajectory.line.visible = true;
        }
        
        // Mark creator as inactive
        this.game.levelCreatorActive = false;
        
        console.log('🎮 Level Creator closed - game controls enabled');
    }
    
    importCurrentLevel() {
        if (this.placedObjects.length > 0) {
            if (!confirm('Clear current objects and import level? This will replace your current work.')) {
                return;
            }
        }
        
        this.placedObjects = [];
        this.selectedObjectIndex = null;
        
        // Import buildings
        if (this.game.level && this.game.level.buildings) {
            this.game.level.buildings.forEach(building => {
                if (!building.isDestroyed) {
                    const rotX = building.mesh ? building.mesh.rotation.x : 0;
                    const rotY = building.mesh ? building.mesh.rotation.y : 0;
                    const rotZ = building.mesh ? building.mesh.rotation.z : 0;
                    const obj = {
                        type: 'building',
                        subType: building.buildingType,
                        position: {
                            x: parseFloat(building.position.x.toFixed(1)),
                            y: parseFloat(building.position.y.toFixed(1)),
                            z: parseFloat(building.position.z.toFixed(1))
                        },
                        rotation: rotY, // Legacy
                        rotationX: rotX,
                        rotationY: rotY,
                        rotationZ: rotZ,
                        imported: true,
                        originalObject: building
                    };
                    this.placedObjects.push(obj);
                }
            });
        }
        
        // Import targets
        if (this.game.level && this.game.level.targets) {
            this.game.level.targets.forEach(target => {
                if (!target.isDestroyed) {
                    const rotX = target.mesh ? target.mesh.rotation.x : 0;
                    const rotY = target.mesh ? target.mesh.rotation.y : 0;
                    const rotZ = target.mesh ? target.mesh.rotation.z : 0;
                    const obj = {
                        type: 'target',
                        subType: target.type,
                        position: {
                            x: parseFloat(target.position.x.toFixed(1)),
                            y: parseFloat(target.position.y.toFixed(1)),
                            z: parseFloat(target.position.z.toFixed(1))
                        },
                        rotation: rotY, // Legacy
                        rotationX: rotX,
                        rotationY: rotY,
                        rotationZ: rotZ,
                        imported: true,
                        originalObject: target
                    };
                    this.placedObjects.push(obj);
                }
            });
        }
        
        // Auto-detect baseX (find the most common X position rounded to nearest 5)
        if (this.placedObjects.length > 0) {
            const xValues = this.placedObjects.map(o => Math.round(o.position.x / 5) * 5);
            const xCounts = {};
            xValues.forEach(x => xCounts[x] = (xCounts[x] || 0) + 1);
            const mostCommonX = Object.keys(xCounts).reduce((a, b) => 
                xCounts[a] > xCounts[b] ? a : b
            );
            this.baseX = parseFloat(mostCommonX);
            document.getElementById('creator-base-x').value = this.baseX;
        }
        
        this.updateObjectsList();
        
        const count = this.placedObjects.length;
        alert(`✅ Imported ${count} objects from current level!\n\nYou can now:\n• Click list items to select\n• Arrow keys to move\n• PageUp/Down to change height\n• Delete to remove\n• Ctrl+Click ground to add new objects`);
    }
    
    updateGhostObject() {
        if (this.ghostObject) {
            this.game.scene.remove(this.ghostObject);
        }
        
        // Create semi-transparent ghost preview
        const geometry = this.currentType === 'building' 
            ? this.getBuildingGeometry(this.currentBuildingType)
            : new THREE.SphereGeometry(0.5, 8, 8);
            
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.3,
            wireframe: true
        });
        
        this.ghostObject = new THREE.Mesh(geometry, material);
        this.game.scene.add(this.ghostObject);
    }
    
    getBuildingGeometry(type) {
        switch(type) {
            case 'wall':
            case 'indestructible-wall':
                return new THREE.BoxGeometry(3, 2, 0.5);
            case 'tower':
            case 'indestructible-tower':
                return new THREE.CylinderGeometry(0.8, 1, 4, 8);
            case 'platform':
            case 'indestructible-platform':
                return new THREE.BoxGeometry(3, 0.3, 3);
            case 'castle':
                return new THREE.BoxGeometry(4, 3, 4);
            case 'indestructible-pillar':
                return new THREE.CylinderGeometry(0.5, 0.6, 6, 8);
            case 'indestructible-block':
                return new THREE.BoxGeometry(2, 2, 2);
            default:
                return new THREE.BoxGeometry(2, 2, 2);
        }
    }
    
    snapToGrid(value) {
        if (this.gridSize === 0) return value;
        return Math.round(value / this.gridSize) * this.gridSize;
    }
    
    placeObject(position) {
        const snappedPos = {
            x: this.snapToGrid(position.x),
            y: this.snapToGrid(position.y),
            z: this.snapToGrid(position.z)
        };
        
        // Actually create the object in the game
        let gameObject = null;
        
        if (this.currentType === 'building') {
            // Create building using Level's addBuilding method
            gameObject = this.game.level.addBuilding(
                snappedPos.x,
                snappedPos.y,
                snappedPos.z,
                this.currentBuildingType
            );
            // Apply default rotation
            if (gameObject && gameObject.mesh) {
                gameObject.mesh.rotation.y = 0;
                if (gameObject.body) {
                    gameObject.body.quaternion.setFromEuler(0, 0, 0);
                }
            }
        } else if (this.currentType === 'target') {
            // Create target using Level's addTarget method
            gameObject = this.game.level.addTarget(
                snappedPos.x,
                snappedPos.y,
                snappedPos.z,
                this.currentTargetType
            );
            // Apply default rotation
            if (gameObject && gameObject.mesh) {
                gameObject.mesh.rotation.y = 0;
            }
        }
        
        // Store the object data with reference to the game object
        const obj = {
            type: this.currentType,
            subType: this.currentType === 'building' ? this.currentBuildingType : this.currentTargetType,
            position: snappedPos,
            rotation: 0, // Legacy: same as rotationY
            rotationX: 0,
            rotationY: 0,
            rotationZ: 0,
            imported: false,
            originalObject: gameObject
        };
        
        this.placedObjects.push(obj);
        this.updateObjectsList();
        
        console.log(`✅ Placed ${obj.subType} at (${snappedPos.x}, ${snappedPos.y}, ${snappedPos.z})`);
    }
    
    selectObjectAt(position) {
        // Find closest object
        let closestIndex = null;
        let closestDist = Infinity;
        
        this.placedObjects.forEach((obj, index) => {
            const dist = Math.sqrt(
                Math.pow(obj.position.x - position.x, 2) +
                Math.pow(obj.position.z - position.z, 2)
            );
            if (dist < closestDist && dist < 2) {
                closestDist = dist;
                closestIndex = index;
            }
        });
        
        this.selectedObjectIndex = closestIndex;
        
        // If this is an imported object, sync its position from the game
        if (closestIndex !== null && this.placedObjects[closestIndex].originalObject) {
            const gameObj = this.placedObjects[closestIndex].originalObject;
            if (gameObj && gameObj.mesh && gameObj.mesh.position) {
                this.placedObjects[closestIndex].position = {
                    x: parseFloat(gameObj.mesh.position.x.toFixed(1)),
                    y: parseFloat(gameObj.mesh.position.y.toFixed(1)),
                    z: parseFloat(gameObj.mesh.position.z.toFixed(1))
                };
            }
        }
        
        this.updateObjectsList();
    }
    
    deleteSelected() {
        console.log('🗑️ deleteSelected called, selectedObjectIndex:', this.selectedObjectIndex);
        
        if (this.selectedObjectIndex === null) {
            console.log('❌ No object selected');
            return;
        }
        
        const obj = this.placedObjects[this.selectedObjectIndex];
        if (!obj) {
            console.log('❌ Object not found at index:', this.selectedObjectIndex);
            return;
        }
        
        console.log('🗑️ Deleting object:', obj.subType, 'at index:', this.selectedObjectIndex);
        
        // If it's an imported object, also destroy it in the game
        if (obj.originalObject) {
            try {
                if (obj.type === 'building') {
                    // Remove from level's buildings array
                    const index = this.game.level.buildings.indexOf(obj.originalObject);
                    if (index > -1) {
                        obj.originalObject.destroy();
                        this.game.level.buildings.splice(index, 1);
                        console.log('✅ Destroyed building from game');
                    }
                } else if (obj.type === 'target') {
                    // Remove from level's targets array
                    const index = this.game.level.targets.indexOf(obj.originalObject);
                    if (index > -1) {
                        obj.originalObject.destroy();
                        this.game.level.targets.splice(index, 1);
                        console.log('✅ Destroyed target from game');
                    }
                }
            } catch (e) {
                console.warn('Could not destroy original object:', e);
            }
        }
        
        this.placedObjects.splice(this.selectedObjectIndex, 1);
        this.selectedObjectIndex = null;
        
        // Remove highlight
        if (this.highlightMesh) {
            this.game.scene.remove(this.highlightMesh);
            this.highlightMesh = null;
        }
        
        this.updateObjectsList();
        
        console.log('✅ Object deleted, remaining objects:', this.placedObjects.length);
    }
    
    clearAll() {
        if (confirm('Clear all placed objects?')) {
            this.placedObjects = [];
            this.selectedObjectIndex = null;
            
            // Remove highlight
            if (this.highlightMesh) {
                this.game.scene.remove(this.highlightMesh);
                this.highlightMesh = null;
            }
            
            this.updateObjectsList();
        }
    }
    
    updateObjectsList() {
        const listEl = document.getElementById('creator-objects-items');
        listEl.innerHTML = this.placedObjects.map((obj, i) => {
            const selected = i === this.selectedObjectIndex ? '👉 ' : '';
            const icon = obj.type === 'building' ? '🏗️' : '🎯';
            const imported = obj.imported ? '📥 ' : '';
            const isSelected = i === this.selectedObjectIndex;
            
            // Build rotation string
            const rotX = obj.rotationX || 0;
            const rotY = obj.rotationY || obj.rotation || 0;
            const rotZ = obj.rotationZ || 0;
            const rotXDeg = Math.round((rotX * 180 / Math.PI) % 360);
            const rotYDeg = Math.round((rotY * 180 / Math.PI) % 360);
            const rotZDeg = Math.round((rotZ * 180 / Math.PI) % 360);
            
            let rotationStr = '';
            if (rotXDeg !== 0 || rotYDeg !== 0 || rotZDeg !== 0) {
                const parts = [];
                if (rotXDeg !== 0) parts.push(`X:${rotXDeg}°`);
                if (rotYDeg !== 0) parts.push(`Y:${rotYDeg}°`);
                if (rotZDeg !== 0) parts.push(`Z:${rotZDeg}°`);
                rotationStr = ` ↻${parts.join(' ')}`;
            }
            
            return `<div 
                data-index="${i}"
                style="
                    padding: 5px; 
                    margin: 2px 0;
                    cursor: pointer;
                    border-radius: 3px;
                    background: ${isSelected ? 'rgba(255, 215, 0, 0.2)' : 'transparent'};
                    color: ${isSelected ? '#FFD700' : '#fff'};
                    border-left: 3px solid ${isSelected ? '#FFD700' : 'transparent'};
                    transition: all 0.2s;
                "
                onmouseover="this.style.background='rgba(255,255,255,0.1)'"
                onmouseout="this.style.background='${isSelected ? 'rgba(255, 215, 0, 0.2)' : 'transparent'}'"
            >
                ${selected}${imported}${icon} ${obj.subType} @ (${obj.position.x.toFixed(1)}, ${obj.position.y.toFixed(1)}, ${obj.position.z.toFixed(1)})${rotationStr}
            </div>`;
        }).join('');
        
        document.querySelector('#creator-objects-list strong').textContent = 
            `Placed Objects (${this.placedObjects.length}):`;
        
        // Add click handlers to list items
        const items = listEl.querySelectorAll('[data-index]');
        items.forEach(item => {
            item.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const index = parseInt(item.getAttribute('data-index'));
                this.selectedObjectIndex = index;
                
                console.log(`🎯 Selected object ${index}: ${this.placedObjects[index].subType}`);
                
                // Update list to show selection
                items.forEach(i => {
                    const idx = parseInt(i.getAttribute('data-index'));
                    const isSelected = idx === index;
                    i.style.background = isSelected ? 'rgba(255, 215, 0, 0.2)' : 'transparent';
                    i.style.color = isSelected ? '#FFD700' : '#fff';
                    i.style.borderLeft = isSelected ? '3px solid #FFD700' : '3px solid transparent';
                });
                
                // Highlight the selected object in 3D scene
                this.highlightSelectedObject();
            };
        });
        
        // Sync positions of imported objects with live game objects
        this.syncImportedObjects();
    }
    
    highlightSelectedObject() {
        // Remove existing highlight
        if (this.highlightMesh) {
            this.game.scene.remove(this.highlightMesh);
            this.highlightMesh = null;
        }
        
        // If no selection, return
        if (this.selectedObjectIndex === null) return;
        
        const obj = this.placedObjects[this.selectedObjectIndex];
        if (!obj || !obj.originalObject || !obj.originalObject.mesh) return;
        
        const selectedMesh = obj.originalObject.mesh;
        
        // Create a highlight box/outline around the selected object
        const box = new THREE.Box3().setFromObject(selectedMesh);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        
        // Create a slightly larger wireframe box
        const padding = 0.2;
        const highlightGeometry = new THREE.BoxGeometry(
            size.x + padding,
            size.y + padding,
            size.z + padding
        );
        
        const highlightMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFD700, // Gold color
            wireframe: true,
            transparent: true,
            opacity: 0.8
        });
        
        this.highlightMesh = new THREE.Mesh(highlightGeometry, highlightMaterial);
        this.highlightMesh.position.copy(center);
        
        // Match rotation of the selected object
        this.highlightMesh.rotation.x = obj.rotationX || 0;
        this.highlightMesh.rotation.y = obj.rotationY || obj.rotation || 0;
        this.highlightMesh.rotation.z = obj.rotationZ || 0;
        
        // Add pulsing animation
        this.highlightMesh.userData.pulseTime = 0;
        
        this.game.scene.add(this.highlightMesh);
    }
    
    syncImportedObjects() {
        // Update positions in game for imported objects that were moved
        this.placedObjects.forEach(obj => {
            if (obj.originalObject && obj.originalObject.mesh && obj.originalObject.body) {
                const gameObj = obj.originalObject;
                
                // Check if position changed
                const currentPos = gameObj.mesh.position;
                if (Math.abs(currentPos.x - obj.position.x) > 0.01 ||
                    Math.abs(currentPos.y - obj.position.y) > 0.01 ||
                    Math.abs(currentPos.z - obj.position.z) > 0.01) {
                    
                    // Update mesh position
                    gameObj.mesh.position.set(obj.position.x, obj.position.y, obj.position.z);
                    
                    // Update physics body position
                    if (gameObj.body) {
                        gameObj.body.position.set(obj.position.x, obj.position.y, obj.position.z);
                        gameObj.body.velocity.set(0, 0, 0);
                        gameObj.body.angularVelocity.set(0, 0, 0);
                        gameObj.body.sleep();
                    }
                }
            }
        });
    }
    
    update(deltaTime) {
        // Animate highlight with pulsing effect
        if (this.highlightMesh) {
            this.highlightMesh.userData.pulseTime += deltaTime * 3; // Pulse speed
            const pulse = Math.sin(this.highlightMesh.userData.pulseTime) * 0.5 + 0.5; // 0 to 1
            this.highlightMesh.material.opacity = 0.5 + pulse * 0.4; // Pulse between 0.5 and 0.9
            
            // Update position and rotation if object was moved/rotated
            if (this.selectedObjectIndex !== null) {
                const obj = this.placedObjects[this.selectedObjectIndex];
                if (obj && obj.originalObject && obj.originalObject.mesh) {
                    const selectedMesh = obj.originalObject.mesh;
                    const box = new THREE.Box3().setFromObject(selectedMesh);
                    const center = box.getCenter(new THREE.Vector3());
                    this.highlightMesh.position.copy(center);
                    
                    // Update all rotation axes
                    this.highlightMesh.rotation.x = obj.rotationX || 0;
                    this.highlightMesh.rotation.y = obj.rotationY || obj.rotation || 0;
                    this.highlightMesh.rotation.z = obj.rotationZ || 0;
                }
            }
        }
    }
    
    exportLevel() {
        if (this.placedObjects.length === 0) {
            alert('No objects to export!');
            return;
        }
        
        let code = `    createLevelX() {\n`;
        code += `        // Generated by Level Creator\n`;
        code += `        const baseX = ${this.baseX};\n\n`;
        
        // Group by type
        const buildings = this.placedObjects.filter(o => o.type === 'building');
        const targets = this.placedObjects.filter(o => o.type === 'target');
        
        if (buildings.length > 0) {
            code += `        // Buildings\n`;
            buildings.forEach((obj, idx) => {
                const x = obj.position.x === this.baseX ? 'baseX' : 
                         obj.position.x > this.baseX ? `baseX + ${(obj.position.x - this.baseX).toFixed(1)}` :
                         `baseX - ${(this.baseX - obj.position.x).toFixed(1)}`;
                
                const rotX = obj.rotationX || 0;
                const rotY = obj.rotationY || obj.rotation || 0;
                const rotZ = obj.rotationZ || 0;
                const hasRotation = Math.abs(rotX) > 0.01 || Math.abs(rotY) > 0.01 || Math.abs(rotZ) > 0.01;
                
                if (hasRotation) {
                    code += `        const building${idx} = this.addBuilding(${x}, ${obj.position.y.toFixed(1)}, ${obj.position.z.toFixed(1)}, '${obj.subType}');\n`;
                    code += `        building${idx}.mesh.rotation.set(${rotX.toFixed(3)}, ${rotY.toFixed(3)}, ${rotZ.toFixed(3)});\n`;
                    code += `        if (building${idx}.body) building${idx}.body.quaternion.setFromEuler(${rotX.toFixed(3)}, ${rotY.toFixed(3)}, ${rotZ.toFixed(3)});\n`;
                } else {
                    code += `        this.addBuilding(${x}, ${obj.position.y.toFixed(1)}, ${obj.position.z.toFixed(1)}, '${obj.subType}');\n`;
                }
            });
            code += '\n';
        }
        
        if (targets.length > 0) {
            code += `        // Targets\n`;
            targets.forEach((obj, idx) => {
                const x = obj.position.x === this.baseX ? 'baseX' : 
                         obj.position.x > this.baseX ? `baseX + ${(obj.position.x - this.baseX).toFixed(1)}` :
                         `baseX - ${(this.baseX - obj.position.x).toFixed(1)}`;
                
                const rotX = obj.rotationX || 0;
                const rotY = obj.rotationY || obj.rotation || 0;
                const rotZ = obj.rotationZ || 0;
                const hasRotation = Math.abs(rotX) > 0.01 || Math.abs(rotY) > 0.01 || Math.abs(rotZ) > 0.01;
                
                if (hasRotation) {
                    code += `        const target${idx} = this.addTarget(${x}, ${obj.position.y.toFixed(1)}, ${obj.position.z.toFixed(1)}, '${obj.subType}');\n`;
                    code += `        target${idx}.mesh.rotation.set(${rotX.toFixed(3)}, ${rotY.toFixed(3)}, ${rotZ.toFixed(3)});\n`;
                } else {
                    code += `        this.addTarget(${x}, ${obj.position.y.toFixed(1)}, ${obj.position.z.toFixed(1)}, '${obj.subType}');\n`;
                }
            });
        }
        
        code += `    }\n`;
        
        // Copy to clipboard
        navigator.clipboard.writeText(code).then(() => {
            alert('✅ Level code copied to clipboard!\n\nPaste it into src/Level.js');
        }).catch(() => {
            // Fallback: show in prompt
            prompt('Copy this code:', code);
        });
        
        console.log('Exported Level Code:\n', code);
    }
}

