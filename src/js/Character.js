export class Character {
    constructor(config) {
        this.maxHp = config.maxHp;
        this.hp = config.hp !== undefined ? config.hp : this.maxHp;
        this.baseAttack = config.baseAttack;
        this.baseDefense = config.baseDefense;
        this.level = config.level || 1;
        this.statusEffects = [];
        this.isAnimating = false;
    }

    /**
     * Get current attack value including status effects
     */
    getAttack() {
        let attack = this.baseAttack;
        this.statusEffects.forEach(effect => {
            if (effect.type === 'attack') {
                attack *= effect.multiplier;
            }
        });
        return Math.floor(attack);
    }

    /**
     * Get current defense value including status effects
     */
    getDefense() {
        let defense = this.baseDefense;
        this.statusEffects.forEach(effect => {
            if (effect.type === 'defense') {
                defense *= effect.multiplier;
            }
        });
        return Math.floor(defense);
    }

    /**
     * Take damage with animation and state handling
     */
    async takeDamage(amount) {
        try {
            // Calculate actual damage after defense
            const defense = this.getDefense();
            const actualDamage = Math.max(1, Math.floor(amount * (100 / (100 + defense))));
            
            // Apply damage
            this.hp = Math.max(0, this.hp - actualDamage);
            
            // Set defending state before hit
            await this.startAnimation('defending');
            
            // Show hit animation
            await this.startAnimation('hit');
            
            // Update health state
            const healthPercentage = (this.hp / this.maxHp) * 100;
            const spriteElement = document.getElementById(this.constructor.name.toLowerCase());
            
            if (spriteElement) {
                if (this.isDead()) {
                    spriteElement.dataset.state = 'defeated';
                } else if (healthPercentage <= 25) {
                    spriteElement.dataset.state = 'critical';
                } else if (healthPercentage <= 50) {
                    spriteElement.dataset.state = 'low';
                } else {
                    // Return to default state
                    this.clearState();
                }
            }
            
            return actualDamage; // Return the numeric value after animations complete
        } catch (error) {
            console.error('Error in takeDamage:', error);
            return Math.floor(amount); // Return a fallback value if animations fail
        }
    }

    /**
     * Heal character
     */
    heal(amount) {
        const oldHp = this.hp;
        this.hp = Math.min(this.maxHp, this.hp + amount);
        return this.hp - oldHp;
    }

    /**
     * Check if character is dead
     */
    isDead() {
        return this.hp <= 0;
    }

    /**
     * Add a status effect
     */
    addStatusEffect(effect) {
        this.statusEffects.push({
            ...effect,
            duration: effect.duration || 1
        });
    }

    /**
     * Update status effects
     */
    updateStatusEffects() {
        // Decrease duration and remove expired effects
        this.statusEffects = this.statusEffects
            .map(effect => ({
                ...effect,
                duration: effect.duration - 1
            }))
            .filter(effect => effect.duration > 0);
    }

    /**
     * Start character animation and update state
     */
    async startAnimation(type) {
        if (this.isAnimating) return;
        
        this.isAnimating = true;
        const spriteElement = document.getElementById(this.constructor.name.toLowerCase());
        
        if (spriteElement) {
            // Set state for visual effects
            spriteElement.dataset.state = type;
            
            // Add animation class if it's a one-time animation
            if (['hit', 'attacking'].includes(type)) {
                spriteElement.classList.add(type);
            }

            // Update health state
            const healthPercentage = (this.hp / this.maxHp) * 100;
            if (healthPercentage <= 25) {
                spriteElement.dataset.health = 'critical';
            } else if (healthPercentage <= 50) {
                spriteElement.dataset.health = 'low';
            } else {
                delete spriteElement.dataset.health;
            }

            // Wait for animation to complete
            await new Promise(resolve => {
                const animationEndHandler = () => {
                    // Remove animation class but keep state
                    if (['hit', 'attacking'].includes(type)) {
                        spriteElement.classList.remove(type);
                    }
                    spriteElement.removeEventListener('animationend', animationEndHandler);
                    this.isAnimating = false;
                    resolve();
                };
                
                if (['hit', 'attacking'].includes(type)) {
                    spriteElement.addEventListener('animationend', animationEndHandler);
                } else {
                    // For state changes without animation, resolve immediately
                    setTimeout(resolve, 50);
                }
            });
        } else {
            this.isAnimating = false;
        }
    }

    /**
     * Update character state without animation
     */
    setState(state) {
        const spriteElement = document.getElementById(this.constructor.name.toLowerCase());
        if (spriteElement) {
            spriteElement.dataset.state = state;
        }
    }

    /**
     * Clear character state
     */
    clearState() {
        const spriteElement = document.getElementById(this.constructor.name.toLowerCase());
        if (spriteElement) {
            delete spriteElement.dataset.state;
        }
    }

    /**
     * Check if character is currently animating
     */
    isInAnimation() {
        return this.isAnimating;
    }
}
