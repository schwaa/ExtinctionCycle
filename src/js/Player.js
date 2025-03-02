import { Character } from './Character.js';
import { CONFIG, COLOR_SKILLS } from './combat/config.js';

export class Player extends Character {
    constructor(config = CONFIG.CHARACTERS.PLAYER) {
        super(config);
        
        // Initialize basic stats
        this.level = 1;
        this.experience = 0;
        this.nextLevelExp = this.calculateNextLevelExp();
        this.coins = 0;
        this.food = 0;
        
        // Initialize skills fresh for combat
        this.skills = {};
        CONFIG.GRID.COLORS.forEach(color => {
            this.skills[color] = { power: 0 };
        });
    }

    // Remove resetTurnState's complexity - just handle the turn
    resetTurnState(preserveSkills = false) {
        this.isAttacking = false;
        
        if (!preserveSkills) {
            CONFIG.GRID.COLORS.forEach(color => {
                if (this.skills[color]) {
                    this.skills[color].power = 0;
                }
            });
        }
    }

    /**
     * Add power to a skill
     */
    addSkillPower(color, matchSize) {
        if (!this.skills[color]) {
            this.skills[color] = { power: 0 };
        }
        
        const powerGained = CONFIG.MATCH_POWER[
            matchSize === 3 ? 'THREE' :
            matchSize === 4 ? 'FOUR' :
            'FIVE'
        ];
    
        this.skills[color].power += powerGained;
        return this.skills[color].power;
    }

    /**
     * Get current power for a skill
     */
    getSkillPower(color) {
        return this.skills[color]?.power || 0;
    }

    /**
     * Reset power for a skill
     */
    resetSkillPower(color) {
        if (this.skills[color]) {
            this.skills[color].power = 0;
        }
    }

    /**
     * Override takeDamage to handle player-specific logic
     */
    takeDamage(amount) {
        return super.takeDamage(amount);
    }

    /**
     * Gain experience points
     */
    gainExperience(amount) {
        this.experience += amount;
        while (this.experience >= this.nextLevelExp) {
            this.levelUp();
        }
        return amount; // Return amount gained for UI display
    }

    /**
     * Lose experience points (minimum 0)
     */
    loseExperience(amount = 1) {
        this.experience = Math.max(0, this.experience - amount);
        return amount; // Return amount lost for UI display
    }

    /**
     * Level up the player
     */
    levelUp() {
        this.level++;
        this.experience -= this.nextLevelExp;
        this.nextLevelExp = this.calculateNextLevelExp();
        
        // Increase stats
        this.maxHp = Math.floor(this.maxHp * 1.1);
        this.hp = this.maxHp;
        this.baseAttack = Math.floor(this.baseAttack * 1.1);
        this.baseDefense = Math.floor(this.baseDefense * 1.1);
    }

    /**
     * Calculate experience needed for next level
     */
    calculateNextLevelExp() {
        return Math.floor(100 * Math.pow(1.5, this.level - 1));
    }

    /**
     * Get experience progress as percentage
     */
    getExpProgress() {
        return (this.experience / this.nextLevelExp) * 100;
    }

    /**
     * Heal to full HP at the cost of 1 EXP
     * @returns {boolean} True if healing was successful
     */
    healToFull() {
        if (this.experience < 1 || this.hp >= this.maxHp) {
            return false;
        }
        
        this.hp = this.maxHp;
        this.loseExperience(1);
        return true;
    }

    static save(player) {
        try {
            const playerData = {
                level: player.level,
                experience: player.experience,
                nextLevelExp: player.nextLevelExp,
                maxHp: player.maxHp,
                hp: player.hp,
                baseAttack: player.baseAttack,
                baseDefense: player.baseDefense,
                skills: player.skills,
                coins: player.coins,
                food: player.food
            };
            localStorage.setItem('rpgMatchGameSave', JSON.stringify(playerData));
        } catch (error) {
            console.error('Failed to save player data:', error);
        }
    }
    
    static load() {
        try {
            const savedData = localStorage.getItem('rpgMatchGameSave');
            
            if (savedData) {
                const data = JSON.parse(savedData);
                // Create player with saved data to ensure correct HP initialization
                const player = new Player({
                    ...CONFIG.CHARACTERS.PLAYER,
                    maxHp: data.maxHp,
                    hp: data.hp,
                    baseAttack: data.baseAttack,
                    baseDefense: data.baseDefense,
                    level: data.level
                });
                player.experience = data.experience;
                player.nextLevelExp = data.nextLevelExp;
                player.skills = data.skills;
                player.coins = data.coins || 0;
                player.food = data.food || 0;
                return player;
            }
            return new Player();
        } catch (error) {
            console.error('Failed to load player data:', error);
            return new Player();
        }
    }
}
