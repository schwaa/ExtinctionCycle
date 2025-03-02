import { CONFIG, COLOR_SKILLS } from './config.js';

export class SkillManager {
    constructor() {
        this.skills = new Map();
        this.initializeSkills();
    }

    /**
     * Initialize skills based on config
     */
    initializeSkills() {
        // Fire Strike (Red)
        this.registerSkill({
            id: 'fire_strike',
            name: CONFIG.SKILLS.red.name,
            description: CONFIG.SKILLS.red.description,
            color: 'red',
            powerRequired: CONFIG.SKILLS.red.powerRequired,
            targeting: 'enemy',
            effect: async (caster, target) => {
                console.log('=== Fire Strike Effect ===');
                const baseDamage = Number(CONFIG.SKILLS.red.baseDamage);
                const attackValue = Number(caster.getAttack());
                console.log('Raw base damage:', CONFIG.SKILLS.red.baseDamage);
                console.log('Converted base damage:', baseDamage);
                console.log('Raw attack value:', caster.getAttack());
                console.log('Converted attack value:', attackValue);
                
                const damage = baseDamage * attackValue;
                console.log('Calculated damage:', damage);
                
                console.log('Target HP before:', target.hp);
                const actualDamage = await target.takeDamage(damage);
                console.log('Actual damage dealt:', actualDamage);
                console.log('Target HP after:', target.hp);
                
                return {
                    success: true,
                    message: `${CONFIG.SKILLS.red.name} dealt ${actualDamage} damage`,
                    damage: actualDamage
                };
            }
        });

        // Ice Shield (Blue)
        this.registerSkill({
            id: 'ice_shield',
            name: CONFIG.SKILLS.blue.name,
            description: CONFIG.SKILLS.blue.description,
            color: 'blue',
            powerRequired: CONFIG.SKILLS.blue.powerRequired,
            targeting: 'self',
            effect: (caster) => {
                caster.addStatusEffect({
                    type: 'defense',
                    multiplier: CONFIG.SKILLS.blue.defenseBonus,
                    duration: 3
                });
                return {
                    success: true,
                    message: `Defense increased by ${(CONFIG.SKILLS.blue.defenseBonus - 1) * 100}%`
                };
            }
        });

        // Nature's Healing (Green)
        this.registerSkill({
            id: 'natures_healing',
            name: CONFIG.SKILLS.green.name,
            description: CONFIG.SKILLS.green.description,
            color: 'green',
            powerRequired: CONFIG.SKILLS.green.powerRequired,
            targeting: 'self',
            effect: (caster) => {
                const healAmount = CONFIG.SKILLS.green.healAmount;
                const actualHeal = caster.heal(healAmount);
                return {
                    success: true,
                    message: `Healed for ${actualHeal} HP`
                };
            }
        });

        // Thunder Bolt (Yellow)
        this.registerSkill({
            id: 'thunder_bolt',
            name: CONFIG.SKILLS.yellow.name,
            description: CONFIG.SKILLS.yellow.description,
            color: 'yellow',
            powerRequired: CONFIG.SKILLS.yellow.powerRequired,
            targeting: 'enemy',
            effect: async (caster, target) => {
                const damage = CONFIG.SKILLS.yellow.baseDamage * caster.getAttack() / 10;
                const actualDamage = await target.takeDamage(damage);
                return {
                    success: true,
                    message: `${CONFIG.SKILLS.yellow.name} dealt ${actualDamage} damage`,
                    damage: actualDamage
                };
            }
        });

        // Dark Curse (Purple)
        this.registerSkill({
            id: 'dark_curse',
            name: CONFIG.SKILLS.purple.name,
            description: CONFIG.SKILLS.purple.description,
            color: 'purple',
            powerRequired: CONFIG.SKILLS.purple.powerRequired,
            targeting: 'enemy',
            effect: (caster, target) => {
                target.addStatusEffect({
                    type: 'attack',
                    multiplier: CONFIG.SKILLS.purple.attackReduction,
                    duration: 3
                });
                return {
                    success: true,
                    message: `Enemy attack reduced by ${(1 - CONFIG.SKILLS.purple.attackReduction) * 100}%`
                };
            }
        });
    }

    /**
     * Register a new skill
     * @param {Object} skill 
     */
    registerSkill(skill) {
        if (!skill.id || !skill.name || !skill.effect || !skill.color) {
            throw new Error('Invalid skill definition');
        }
        this.skills.set(skill.id, skill);
    }

    /**
     * Get a skill by ID
     * @param {string} skillId 
     * @returns {Object|undefined}
     */
    getSkill(skillId) {
        return this.skills.get(skillId);
    }

    /**
     * Get skill by color
     * @param {string} color 
     * @returns {Object|undefined}
     */
    getSkillByColor(color) {
        return this.getSkill(COLOR_SKILLS[color]);
    }

    /**
     * Use a skill
     * @param {string} skillId 
     * @param {Character} caster 
     * @param {Character} target 
     * @returns {Object}
     */
    async useSkill(skillId, caster, target) {
        console.log('=== Skill Execution Start ===');
        console.log('Using skill:', skillId);
        console.log('Caster stats:', {
            hp: caster.hp,
            attack: caster.getAttack(),
            defense: caster.getDefense()
        });
        console.log('Target stats:', {
            hp: target.hp,
            attack: target.getAttack(),
            defense: target.getDefense()
        });
        
        const skill = this.getSkill(skillId);
        if (!skill) {
            console.log('Error: Skill not found:', skillId);
            return {
                success: false,
                message: 'Skill not found'
            };
        }

        console.log('Found skill:', {
            id: skill.id,
            name: skill.name,
            targeting: skill.targeting,
            powerRequired: skill.powerRequired
        });

        // Check targeting
        if (skill.targeting === 'self' && caster !== target) {
            console.log('Error: Invalid targeting - self-targeting skill used on different target');
            return {
                success: false,
                message: 'Invalid target'
            };
        }

        try {
            console.log('Executing skill effect...');
            const result = await skill.effect(caster, target);
            console.log('Skill effect completed');
            console.log('Result:', result);
            console.log('Target stats after skill:', {
                hp: target.hp,
                attack: target.getAttack(),
                defense: target.getDefense()
            });
            console.log('=== Skill Execution End ===');
            return result;
        } catch (error) {
            console.error('Error executing skill:', error);
            return {
                success: false,
                message: 'Skill failed to execute'
            };
        }
    }

    /**
     * Get all skills
     * @returns {Array}
     */
    getAllSkills() {
        return Array.from(this.skills.values());
    }
}
