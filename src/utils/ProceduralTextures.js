import * as THREE from 'three';

/**
 * Procedural texture generator for medieval battlefield
 */
export class ProceduralTextures {
    
    /**
     * Create a stone path texture
     */
    static createStonePathTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        
        // Base dirt/gravel background
        ctx.fillStyle = '#8B7D6B';
        ctx.fillRect(0, 0, 512, 512);
        
        // Add noise texture
        for (let i = 0; i < 5000; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            const brightness = Math.random() * 60 - 30;
            ctx.fillStyle = `rgb(${139 + brightness}, ${125 + brightness}, ${107 + brightness})`;
            ctx.fillRect(x, y, 1, 1);
        }
        
        // Draw irregular stone slabs
        const stoneCount = 12;
        for (let i = 0; i < stoneCount; i++) {
            const x = (Math.random() * 400) + 50;
            const y = (Math.random() * 400) + 50;
            const size = 40 + Math.random() * 60;
            
            // Stone base color - gray variations
            const grayValue = 100 + Math.random() * 60;
            ctx.fillStyle = `rgb(${grayValue}, ${grayValue}, ${grayValue + 10})`;
            
            // Draw irregular polygon for stone
            ctx.beginPath();
            const sides = 5 + Math.floor(Math.random() * 3);
            for (let j = 0; j < sides; j++) {
                const angle = (j / sides) * Math.PI * 2 + Math.random() * 0.3;
                const radius = size * (0.8 + Math.random() * 0.4);
                const px = x + Math.cos(angle) * radius;
                const py = y + Math.sin(angle) * radius;
                if (j === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
            
            // Stone cracks/details
            ctx.strokeStyle = `rgba(50, 50, 50, 0.4)`;
            ctx.lineWidth = 1;
            ctx.stroke();
            
            // Add some texture to stones
            for (let k = 0; k < 20; k++) {
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * size * 0.8;
                const px = x + Math.cos(angle) * radius;
                const py = y + Math.sin(angle) * radius;
                ctx.fillStyle = `rgba(80, 80, 80, ${Math.random() * 0.3})`;
                ctx.fillRect(px, py, 2, 2);
            }
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(8, 8);
        
        return texture;
    }
    
    /**
     * Create a grass texture with variation
     */
    static createGrassTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        // Multiple shades of green for grass
        const grassColors = [
            '#7BC850',
            '#6BB040',
            '#8BC860',
            '#70B845'
        ];
        
        // Base grass color
        ctx.fillStyle = grassColors[0];
        ctx.fillRect(0, 0, 256, 256);
        
        // Add grass blade patterns
        for (let i = 0; i < 1000; i++) {
            const x = Math.random() * 256;
            const y = Math.random() * 256;
            const color = grassColors[Math.floor(Math.random() * grassColors.length)];
            
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + (Math.random() - 0.5) * 3, y - 3 - Math.random() * 5);
            ctx.stroke();
        }
        
        // Add darker patches
        for (let i = 0; i < 30; i++) {
            const x = Math.random() * 256;
            const y = Math.random() * 256;
            const radius = 5 + Math.random() * 15;
            
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
            gradient.addColorStop(0, 'rgba(80, 140, 50, 0.3)');
            gradient.addColorStop(1, 'rgba(80, 140, 50, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(15, 15);
        
        return texture;
    }
    
    /**
     * Create a fern/foliage texture overlay
     */
    static createFernTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        
        // Transparent background
        ctx.clearRect(0, 0, 512, 512);
        
        // Draw scattered ferns
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            
            // Fern colors - various greens
            const greenValue = 100 + Math.random() * 80;
            ctx.fillStyle = `rgba(${greenValue * 0.6}, ${greenValue}, ${greenValue * 0.5}, 0.4)`;
            
            // Draw simple fern shape
            const fernHeight = 20 + Math.random() * 30;
            const fernWidth = fernHeight * 0.6;
            
            // Central stem
            ctx.fillRect(x, y, 1, fernHeight);
            
            // Leaves branching out
            const leafCount = 5 + Math.floor(Math.random() * 5);
            for (let j = 0; j < leafCount; j++) {
                const leafY = y + (j / leafCount) * fernHeight;
                const leafSize = (1 - j / leafCount) * fernWidth;
                
                ctx.beginPath();
                // Left leaf
                ctx.moveTo(x, leafY);
                ctx.lineTo(x - leafSize, leafY - leafSize * 0.3);
                ctx.lineTo(x, leafY + 2);
                ctx.fill();
                
                // Right leaf
                ctx.beginPath();
                ctx.moveTo(x, leafY);
                ctx.lineTo(x + leafSize, leafY - leafSize * 0.3);
                ctx.lineTo(x, leafY + 2);
                ctx.fill();
            }
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(6, 6);
        texture.transparent = true;
        
        return texture;
    }
}

