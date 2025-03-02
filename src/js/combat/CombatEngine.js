import { CONFIG, COLOR_SKILLS } from './config.js';
import { Player } from '../Player.js';

export class CombatEngine {
  constructor(player, enemy, grid, uiManager) {
    this.player = player;
    this.enemy = enemy;
    this.grid = grid;
    this.uiManager = uiManager;
    this.isPlayerTurn = true;
    this.combatActive = true;
    this.timer = null;
    this.turnDuration = CONFIG.COMBAT.TURN_TIME || 15;
    this.activeBuffs = {
      ice_shield: {
        active: false,
        turnsLeft: 0,
        originalDefense: null
      }
    };
    
    // Initialize player power for each color if not already set
    ['red', 'blue', 'green', 'yellow', 'purple'].forEach(color => {
      if (this.player.skills[color] === undefined) {
        this.player.skills[color] = 0;
      }
    });
    
    // Set up grid match handler (only active during player turn)
    this.grid.onMatch((color, size) => {
      if (this.isPlayerTurn && this.combatActive) {
        this.handleMatch(color, size);
      }
    });

    // Connect skill buttons to combat engine
    Object.entries(CONFIG.SKILLS).forEach(([color, skillConfig]) => {
      const button = this.uiManager.addSkillButton({
        id: skillConfig.id,
        name: skillConfig.name,
        color: color,
        powerRequired: skillConfig.powerRequired,
        getCurrentPower: () => this.player.skills[color] || 0
      }, async (skill) => {
        if (this.combatActive) {
          await this.playerUseSkill(color);
        }
      });
    });

    // Initialize UI with current stats
    this.uiManager.updatePlayerStats(this.player);
    this.uiManager.updateEnemyStats(this.enemy);
  }

  startCombat() {
    this.combatActive = true;
    this.uiManager.showNotification('Battle Start!', 'info');
    // Update both player and enemy stats at combat start
    this.uiManager.updatePlayerStats(this.player);
    this.uiManager.updateEnemyStats(this.enemy);
    this.startPlayerTurn();
  }

  startPlayerTurn() {
    if (!this.combatActive) return;
    this.isPlayerTurn = true;
    this.uiManager.updateTurnIndicator('Your Turn');
    this.grid.enable();
    this.startTimer(this.turnDuration);
  }

  startTimer(seconds) {
    if (!this.combatActive) return;
    let remaining = seconds;
    this.uiManager.updateTimer(remaining);
    this.timer = setInterval(() => {
      remaining--;
      this.uiManager.updateTimer(remaining);
      if (remaining <= 0) {
        clearInterval(this.timer);
        this.endPlayerTurn();
      }
    }, 1000);
  }

  handleMatch(color, size) {
    if (!this.combatActive) return;
    let powerGained = 0;
    if (size === 3) {
      powerGained = 1;
    } else if (size === 4) {
      powerGained = 5;
    } else if (size >= 5) {
      powerGained = 15;
    }
    // Ensure current power is a number and accumulate power of the matched color
    this.player.skills[color] = (Number(this.player.skills[color]) || 0) + powerGained;
    // Convert color to skill ID and update the UI
    const skillId = COLOR_SKILLS[color];
    this.uiManager.updateSkillPower(skillId, this.player.skills[color]);
  }
  
  // Called when the player uses a skill for a given color.
  async playerUseSkill(color) {
    if (!this.combatActive) return;
    const skillConfig = CONFIG.SKILLS[color];
    if (!skillConfig) {
      this.uiManager.showNotification(`No skill configured for ${color}`, 'warning');
      return;
    }
    const requiredPower = skillConfig.powerRequired;
    if (this.player.skills[color] >= requiredPower) {
      // Consume power for that color
      this.player.skills[color] = 0;
      const skillId = COLOR_SKILLS[color];
      this.uiManager.updateSkillPower(skillId, 0);
      // Lock grid to prevent further matches during skill execution
      this.grid.disable();
      
      // Execute skill effect based on color
      switch (color) {
        case 'red': // Fire Strike
          const fireDamage = skillConfig.baseDamage;
          await this.enemy.takeDamage(fireDamage);
          this.uiManager.showDamageNumber(fireDamage, 'enemyHealth', 'damage');
          break;
        case 'green': // Nature's Healing
          const healAmount = skillConfig.healAmount;
          const oldHp = this.player.hp;
          this.player.hp = Math.min(this.player.hp + healAmount, this.player.maxHp);
          const actualHeal = this.player.hp - oldHp;
          this.uiManager.showDamageNumber(actualHeal, 'playerHealth', 'heal');
          break;
        case 'yellow': // Thunder Bolt
          const thunderDamage = skillConfig.baseDamage;
          await this.enemy.takeDamage(thunderDamage);
          this.uiManager.showDamageNumber(thunderDamage, 'enemyHealth', 'damage');
          break;
        case 'purple': // Dark Curse
          // Implement enemy attack reduction
          this.enemy.baseAttack *= skillConfig.attackReduction;
          this.uiManager.showNotification('Enemy attack reduced!', 'info');
          break;
        case 'blue': // Ice Shield
          // Store original defense if not already buffed
          if (!this.activeBuffs.ice_shield.active) {
            this.activeBuffs.ice_shield.originalDefense = this.player.baseDefense;
            this.player.baseDefense *= skillConfig.defenseBonus;
            this.activeBuffs.ice_shield.active = true;
            this.activeBuffs.ice_shield.turnsLeft = 3;
            this.uiManager.showNotification('Defense increased for 3 turns!', 'info');
          } else {
            // Refresh duration if already active
            this.activeBuffs.ice_shield.turnsLeft = 3;
            this.uiManager.showNotification('Ice Shield duration refreshed!', 'info');
          }
          break;
      }

      // Update UI after skill effect
      this.uiManager.updatePlayerStats(this.player);
      this.uiManager.updateEnemyStats(this.enemy);
      this.uiManager.showNotification(`${skillConfig.name} used!`, 'info');
      
      // End the player's turn immediately after skill use
      clearInterval(this.timer);
      this.endPlayerTurn();
    } else {
      this.uiManager.showNotification(`Not enough power for ${skillConfig.name}`, 'warning');
    }
  }
  
  endPlayerTurn() {
    if (!this.combatActive) return;
    this.grid.disable();
    this.isPlayerTurn = false;
    this.uiManager.updateTurnIndicator("Enemy's Turn");
    // Transition to enemy turn after a longer delay for better readability
    setTimeout(() => {
      if (this.combatActive) {
        this.enemyTurn();
      }
    }, 1500);
  }

  enemyTurn() {
    if (!this.combatActive) return;
    // Update buff durations before enemy turn
    this.updateBuffDurations();
    // Ensure grid remains locked during enemy turn
    this.grid.disable();
    const baseDamage = (CONFIG.COMBAT.ENEMY_DAMAGE || 15) * (this.enemy.getAttack() / 10);
    // Calculate damage reduction based on defense
    const damageReduction = this.player.baseDefense / (this.player.baseDefense + 100);
    const reducedDamage = Math.floor(baseDamage * (1 - damageReduction));
    this.player.hp -= reducedDamage;
    
    // Show both raw and reduced damage in notification if there was reduction
    if (reducedDamage < baseDamage) {
      this.uiManager.showNotification(`Enemy attacked for ${reducedDamage} damage (reduced from ${baseDamage})`, 'info');
    } else {
      this.uiManager.showNotification(`Enemy attacked for ${reducedDamage} damage`, 'info');
    }
    this.uiManager.updatePlayerStats(this.player);
    
    // Check if the player has been defeated
    if (this.player.hp <= 0) {
      this.endCombat(false);
    } else if (this.enemy.hp <= 0) {
      // In case enemy was defeated by a previously used skill
      this.endCombat(true);
    } else {
      // After enemy turn, return control to the player
      setTimeout(() => {
        if (this.combatActive) {
          this.startPlayerTurn();
        }
      }, 1000);
    }
  }

  updateBuffDurations() {
    // Update ice shield duration
    if (this.activeBuffs.ice_shield.active) {
      this.activeBuffs.ice_shield.turnsLeft--;
      
      // Remove buff if duration expired
      if (this.activeBuffs.ice_shield.turnsLeft <= 0) {
        this.player.baseDefense = this.activeBuffs.ice_shield.originalDefense;
        this.activeBuffs.ice_shield.active = false;
        this.activeBuffs.ice_shield.originalDefense = null;
        this.uiManager.showNotification('Ice Shield wore off!', 'info');
      }
    }
  }

  endCombat(playerWon) {
    this.combatActive = false;
    clearInterval(this.timer);
    this.grid.disable();
    
    // Reset any active buffs
    if (this.activeBuffs.ice_shield.active) {
      this.player.baseDefense = this.activeBuffs.ice_shield.originalDefense;
      this.activeBuffs.ice_shield.active = false;
      this.activeBuffs.ice_shield.originalDefense = null;
    }
    
    if (playerWon) {
      // Calculate and award experience (2 times enemy level)
      const expGained = this.enemy.level * 2;
      this.player.gainExperience(expGained);
      Player.save(this.player); // Save state after experience gain
      
      const results = {
        exp: expGained,
        items: []  // Can be expanded later to include item drops
      };
      this.uiManager.showVictoryScreen(results);
    } else {
      // Lose 1 experience point on defeat
      const expLost = this.player.loseExperience(1);
      Player.save(this.player); // Save state after experience loss
      
      this.uiManager.showDefeatScreen();
    }
  }
}
