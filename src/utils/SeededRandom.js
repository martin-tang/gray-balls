/**
 * Seeded Random Number Generator
 * Uses a simple Linear Congruential Generator (LCG) algorithm
 * This ensures deterministic random numbers based on a seed
 */
export class SeededRandom {
    constructor(seed = 1) {
        this.seed = seed % 2147483647;
        if (this.seed <= 0) this.seed += 2147483646;
        this.originalSeed = this.seed;
    }
    
    /**
     * Reset the random generator to its original seed
     */
    reset() {
        this.seed = this.originalSeed;
    }
    
    /**
     * Generate next random number between 0 and 1
     */
    next() {
        this.seed = (this.seed * 16807) % 2147483647;
        return (this.seed - 1) / 2147483646;
    }
    
    /**
     * Generate random integer between min (inclusive) and max (inclusive)
     */
    nextInt(min, max) {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }
    
    /**
     * Generate random float between min and max
     */
    nextFloat(min, max) {
        return this.next() * (max - min) + min;
    }
    
    /**
     * Pick random item from array
     */
    pick(array) {
        return array[Math.floor(this.next() * array.length)];
    }
}

