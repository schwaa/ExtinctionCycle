import { Character } from '../Character.js';
import { CONFIG } from './config.js';

export class Enemy extends Character {
    constructor(config) {
        super(config);
        this.name = config.name || 'Unknown Enemy';
        this.expValue = Math.floor(10 * Math.pow(1.2, this.level - 1));
        this.moveCooldown = false;
        this.pattern = this.generatePattern();
        this.isAttacking = false;
        
        console.log('=== Enemy Created ===');
        console.log('Initial stats:', {
            maxHp: this.maxHp,
            hp: this.hp,
            attack: this.getAttack(),
            defense: this.getDefense(),
            level: this.level
        });
    }

    /**
     * Override takeDamage to add enemy-specific animations and effects
     */
    async takeDamage(amount) {
        console.log('=== Enemy Taking Damage ===');
        console.log('Current HP:', this.hp);
        console.log('Incoming damage:', amount);
        
        // Add defending state before damage
        await this.setState('defending');
        
        // Calculate and apply damage
        const result = await super.takeDamage(amount);
        
        // Show hit effect
        const enemySprite = document.getElementById('enemy');
        if (enemySprite) {
            // Add hit animation
            enemySprite.classList.add('hit');
            
            // Update health state
            const healthPercentage = (this.hp / this.maxHp) * 100;
            if (this.isDead()) {
                enemySprite.dataset.state = 'defeated';
            } else if (healthPercentage <= 25) {
                enemySprite.dataset.state = 'critical';
            } else if (healthPercentage <= 50) {
                enemySprite.dataset.state = 'low';
            }

            // Wait for hit animation to complete
            await new Promise(resolve => {
                setTimeout(() => {
                    enemySprite.classList.remove('hit');
                    resolve();
                }, 500);
            });
        }
        
        console.log('Damage taken:', result);
        console.log('Remaining HP:', this.hp);
        console.log('Is dead:', this.isDead());
        
        // Clear defending state if not defeated
        if (!this.isDead()) {
            this.clearState();
        }
        
        return result;
    }

    /**
     * Generate enemy attack pattern
     */
    generatePattern() {
        return [
            { type: 'attack', damage: CONFIG.COMBAT.ENEMY_DAMAGE }
        ];
    }

    /**
     * Decide on next move
     */
    decideMove(gridState) {
        if (this.moveCooldown || this.isAttacking) return null;

        // Simple AI: Find first match possible
        const size = Math.sqrt(gridState.length);
        
        // Check horizontal swaps
        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size - 1; col++) {
                const index1 = row * size + col;
                const index2 = index1 + 1;
                
                // Try swap and check for matches
                const tempState = [...gridState];
                [tempState[index1], tempState[index2]] = [tempState[index2], tempState[index1]];
                
                if (this.checkForMatch(tempState, size)) {
                    this.moveCooldown = true;
                    setTimeout(() => this.moveCooldown = false, 1000);
                    return { from: index1, to: index2 };
                }
            }
        }
        
        // Check vertical swaps
        for (let col = 0; col < size; col++) {
            for (let row = 0; row < size - 1; row++) {
                const index1 = row * size + col;
                const index2 = index1 + size;
                
                const tempState = [...gridState];
                [tempState[index1], tempState[index2]] = [tempState[index2], tempState[index1]];
                
                if (this.checkForMatch(tempState, size)) {
                    this.moveCooldown = true;
                    setTimeout(() => this.moveCooldown = false, 1000);
                    return { from: index1, to: index2 };
                }
            }
        }
        
        return null;
    }

    /**
     * Check for matches in a grid state
     */
    checkForMatch(state, size) {
        // Check horizontal matches
        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size - 2; col++) {
                const index = row * size + col;
                if (state[index] === state[index + 1] && 
                    state[index] === state[index + 2]) {
                    return true;
                }
            }
        }
        
        // Check vertical matches
        for (let col = 0; col < size; col++) {
            for (let row = 0; row < size - 2; row++) {
                const index = row * size + col;
                if (state[index] === state[index + size] && 
                    state[index] === state[index + size * 2]) {
                    return true;
                }
            }
        }
        
        return false;
    }

    /**
     * Take action against player with animation sequence
     */
    async takeAction(target) {
        try {
            this.isAttacking = true;
            const action = this.pattern[Math.floor(Math.random() * this.pattern.length)];
            
            // Set ready state before attack
            await this.setState('ready');
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Start attack animation
            await this.startAnimation('attacking');

            let result;
            switch (action.type) {
                case 'attack':
                    const damage = action.damage * this.getAttack() / 10;
                    await target.takeDamage(damage);
                    result = `Enemy attacks for ${Math.floor(damage)} damage!`;
                    break;
                default:
                    result = 'Enemy does nothing';
            }

            // Set active state briefly after attack
            await this.setState('active');
            await new Promise(resolve => setTimeout(resolve, 200));

            return result;
        } finally {
            this.isAttacking = false;
            this.clearState();
        }
    }

    /**
     * Get current threat level
     */
    getThreatLevel() {
        return this.hp / this.maxHp * (this.getAttack() / 10);
    }
}
