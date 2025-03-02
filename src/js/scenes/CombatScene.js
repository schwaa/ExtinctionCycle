import Phaser from 'phaser';
import { CONFIG } from '../combat/config.js';
import { Grid } from '../combat/Grid.js';
import { PhaserUIManager } from '../combat/PhaserUIManager.js';
import { Enemy } from '../combat/Enemy.js';
import { Player } from '../Player.js';

export default class CombatScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CombatScene' });
    
    // Core game state
    this.player = null;
    this.enemy = null;
    this.grid = null;
    this.uiManager = null;

    // Combat state
    this.isPlayerTurn = true;
    this.turnTimer = null;
    this.turnDuration = CONFIG.COMBAT.TURN_TIME;
    this.combatActive = false;
    this.animationsInProgress = 0;

    // Buff tracking
    this.activeBuffs = {
      ice_shield: {
        active: false,
        turnsLeft: 0,
        originalDefense: null
      }
    };
    
    // Grid configuration
    this.orbSize = 64;
    this.spacing = 4;
    this.gameArray = [];
    this.selectedOrb = null;
    this.canPick = true;
    
    // Sound effects
    this.sounds = {
      match: null,
      swap: null,
      skill: null,
      tick: null
    };
  }

  init(data) {
    try {
        console.log('CombatScene: init called', data);
        
        // Get player from registry
        this.player = this.registry.get('player');
        const missionData = data.missionData;
        
        // Initialize skills
        this.player.skills = {};
        CONFIG.GRID.COLORS.forEach(color => {
            this.player.skills[color] = 0;
        });
        
        // Get enemies data and filter by level
        const enemiesData = this.cache.json.get('enemies');
        const levelEnemies = enemiesData.enemies.filter(  // Access the 'enemies' array
            enemy => enemy.level === missionData.level
        );
        
        if (levelEnemies.length === 0) {
            throw new Error(`No enemies found for level ${missionData.level}`);
        }
        
        // Randomly select an enemy
        const selectedEnemy = levelEnemies[Math.floor(Math.random() * levelEnemies.length)];
        
        // Create enemy instance
        this.enemy = new Enemy({
            name: selectedEnemy.name,
            maxHp: selectedEnemy.maxHp * missionData.level,
            baseAttack: selectedEnemy.baseAttack * missionData.level,
            baseDefense: selectedEnemy.baseDefense,
            level: missionData.level
        });

        // Rest of your init code...

    } catch (error) {
        console.error('Error in init:', error);
        this.scene.start('HomeBaseScene', { error: error.message });
    }
}

  async create() {
    await this.createCombatUI();
    this.createGrid();
    this.setupInputHandlers();
    
    this.startCombat();
  }

  async createCombatUI() {
    // Initialize UI manager
    this.uiManager = new PhaserUIManager(this);
    await this.uiManager.initialize();
    
    // Add skill buttons
    Object.entries(CONFIG.SKILLS).forEach(([color, skillConfig]) => {
      this.uiManager.addSkillButton({
        id: skillConfig.id,
        name: skillConfig.name,
        color: color,
        powerRequired: skillConfig.powerRequired
      }, async (skill) => {
        if (!this.combatActive || !this.isPlayerTurn) {
          this.uiManager.showNotification("Can't use skills now", 'warning');
          return;
        }
  
        if (this.player.skills[color] < skill.powerRequired) {
          this.uiManager.showNotification('Not enough power!', 'warning');
          return;
        }
  
        try {
          await this.playerUseSkill(color);
          if (this.sounds.skill) {
            this.sounds.skill.play({ volume: 0.5 });
          }
        } catch (error) {
          console.error('Error using skill:', error);
          this.uiManager.showNotification('Failed to use skill', 'error');
        }
      });
    });
  
    // Update initial skill power display
    Object.entries(CONFIG.SKILLS).forEach(([color, skillConfig]) => {
      this.uiManager.updateSkillPower(skillConfig, this.player.skills[color] || 0);
    });
    
    // Update initial stats
    this.uiManager.updatePlayerStats(this.player);
    this.uiManager.updateEnemyStats(this.enemy);
  }

  createGrid() {
    const gridSize = CONFIG.GRID.SIZE;
    const { width, height } = this.cameras.main;
    
    const offsetX = width / 2 - (gridSize * (this.orbSize + this.spacing)) / 2;
    const offsetY = height * 0.25;
    
    // Create grid background
    this.add.rectangle(
      offsetX - this.spacing,
      offsetY - this.spacing,
      gridSize * (this.orbSize + this.spacing) + this.spacing * 2,
      gridSize * (this.orbSize + this.spacing) + this.spacing * 2,
      0x1a1a2e
    ).setOrigin(0, 0);
  
    // Initialize grid
    for (let row = 0; row < gridSize; row++) {
      this.gameArray[row] = [];
      for (let col = 0; col < gridSize; col++) {
        const x = offsetX + col * (this.orbSize + this.spacing);
        const y = offsetY + row * (this.orbSize + this.spacing);
        
        const color = this.getRandomColor();
        // Create orb as a filled circle until we have proper sprites
        const orb = this.add.circle(x, y, this.orbSize/2, this.getOrbColor(color))
          .setStrokeStyle(2, 0xffffff)
          .setInteractive()
          .setData({
            row,
            col,
            color,
            removing: false
          });
          
        this.gameArray[row][col] = orb;
      }
    }
  
    // Remove initial matches
    while (this.findMatches().length > 0) {
      this.removeInitialMatches();
    }
  }

  setupInputHandlers() {
    this.input.on('gameobjectdown', (pointer, orb) => {
      if (!this.canPick || !this.isPlayerTurn) return;
      this.selectedOrb = orb;
      orb.setScale(1.1);
    });

    this.input.on('pointermove', (pointer) => {
      if (!this.selectedOrb) return;

      const row = this.selectedOrb.getData('row');
      const col = this.selectedOrb.getData('col');

      const dx = pointer.x - this.selectedOrb.x;
      const dy = pointer.y - this.selectedOrb.y;

      if (Math.abs(dx) > this.orbSize / 3 || Math.abs(dy) > this.orbSize / 3) {
        let newRow = row;
        let newCol = col;

        if (Math.abs(dx) > Math.abs(dy)) {
          newCol += dx > 0 ? 1 : -1;
        } else {
          newRow += dy > 0 ? 1 : -1;
        }

        if (this.isValidPosition(newRow, newCol)) {
          this.canPick = false;
          this.swapOrbs(row, col, newRow, newCol);
        }

        this.selectedOrb.setScale(1);
        this.selectedOrb = null;
      }
    });

    this.input.on('gameobjectup', () => {
      if (this.selectedOrb) {
        this.selectedOrb.setScale(1);
        this.selectedOrb = null;
      }
    });
  }

  async swapOrbs(row1, col1, row2, col2) {
    const orb1 = this.gameArray[row1][col1];
    const orb2 = this.gameArray[row2][col2];

    this.gameArray[row1][col1] = orb2;
    this.gameArray[row2][col2] = orb1;

    orb1.setData('row', row2).setData('col', col2);
    orb2.setData('row', row1).setData('col', col1);

    // Play swap sound
    if (this.sounds.swap) {
      this.sounds.swap.play({ volume: 0.3 });
    }

    // Animate the swap with faster, snappier movement
    await Promise.all([
      this.tweenOrb(orb1, this.getOrbX(col2), this.getOrbY(row2), 150, 'Cubic.easeOut'),
      this.tweenOrb(orb2, this.getOrbX(col1), this.getOrbY(row1), 150, 'Cubic.easeOut')
    ]);

    // Check for matches
    const matches = this.findMatches();
    if (matches.length > 0) {
      await this.processMatches(matches);
    } else {
      // Swap back if no matches with same animation speed
      this.gameArray[row1][col1] = orb1;
      this.gameArray[row2][col2] = orb2;

      orb1.setData('row', row1).setData('col', col1);
      orb2.setData('row', row2).setData('col', col2);

      if (this.sounds.swap) {
        this.sounds.swap.play({ volume: 0.3 });
      }

      await Promise.all([
        this.tweenOrb(orb1, this.getOrbX(col1), this.getOrbY(row1), 150, 'Cubic.easeOut'),
        this.tweenOrb(orb2, this.getOrbX(col2), this.getOrbY(row2), 150, 'Cubic.easeOut')
      ]);
    }

    this.canPick = true;
  }

  findMatches() {
    const matches = [];
    const gridSize = CONFIG.GRID.SIZE;
    const matched = new Set();

    // Helper to add match if valid
    const addMatchIfValid = (startRow, startCol, count, isHorizontal) => {
      if (count >= 3) {
        const matchOrbs = [];
        for (let i = 0; i < count; i++) {
          const orb = isHorizontal 
            ? this.gameArray[startRow][startCol + i]
            : this.gameArray[startRow + i][startCol];
          matchOrbs.push(orb);
          matched.add(orb);
        }
        matches.push({
          orbs: matchOrbs,
          color: matchOrbs[0].getData('color'),
          size: count
        });
      }
    };

    // Check horizontal matches
    for (let row = 0; row < gridSize; row++) {
      let count = 1;
      let currentColor = null;
      let startCol = 0;

      for (let col = 0; col < gridSize; col++) {
        const orb = this.gameArray[row][col];
        const color = orb.getData('color');

        if (color === currentColor) {
          count++;
        } else {
          addMatchIfValid(row, startCol, count, true);
          count = 1;
          currentColor = color;
          startCol = col;
        }
      }
      addMatchIfValid(row, startCol, count, true);
    }

    // Check vertical matches
    for (let col = 0; col < gridSize; col++) {
      let count = 1;
      let currentColor = null;
      let startRow = 0;

      for (let row = 0; row < gridSize; row++) {
        const orb = this.gameArray[row][col];
        const color = orb.getData('color');

        if (color === currentColor) {
          count++;
        } else {
          addMatchIfValid(startRow, col, count, false);
          count = 1;
          currentColor = color;
          startRow = row;
        }
      }
      addMatchIfValid(startRow, col, count, false);
    }

    return matches;
  }

  async processMatches(matches) {
    this.animationsInProgress++;

    try {
      // Notify about matches and play sound
      matches.forEach(match => {
        this.handleMatch(match.color, match.size);
        if (this.sounds.match) {
          this.sounds.match.play({ volume: 0.3 });
        }
      });

      // Mark orbs for removal and animate
      matches.forEach(match => {
        match.orbs.forEach(orb => {
          orb.setData('removing', true);
        });
      });

      // Animate matched orbs with a flash and scale effect
      await Promise.all(matches.map(match =>
        Promise.all(match.orbs.map(orb =>
          new Promise(resolve => {
            // Flash effect
            this.tweens.add({
              targets: orb,
              alpha: 0.8,
              scale: 1.2,
              duration: 100,
              yoyo: true,
              repeat: 1,
              onComplete: () => {
                // Disappear effect
                this.tweens.add({
                  targets: orb,
                  alpha: 0,
                  scale: 0.3,
                  duration: 200,
                  ease: 'Back.easeIn',
                  onComplete: resolve
                });
              }
            });
          })
        ))
      ));

      // Slight pause before dropping
      await new Promise(resolve => this.time.delayedCall(100, resolve));
      
      // Remove orbs and drop remaining ones
      await this.removeMarkedOrbs();
      
      // Slight pause before checking new matches
      await new Promise(resolve => this.time.delayedCall(50, resolve));

      // Check for new matches
      const newMatches = this.findMatches();
      if (newMatches.length > 0) {
        await this.processMatches(newMatches);
      }
    } finally {
      this.animationsInProgress--;
      if (this.animationsInProgress === 0) {
        this.canPick = true;
      }
    }
  }

  async removeMarkedOrbs() {
    const gridSize = CONFIG.GRID.SIZE;
    const columns = new Array(gridSize).fill(null).map(() => []);
    const drops = [];

    // First pass: Remove matched orbs and count gaps
    for (let col = 0; col < gridSize; col++) {
      let gapCount = 0;

      // Process from bottom to top
      for (let row = gridSize - 1; row >= 0; row--) {
        const orb = this.gameArray[row][col];
        if (orb.getData('removing')) {
          gapCount++;
          orb.destroy();
          this.gameArray[row][col] = null;
        } else if (gapCount > 0) {
          // Store orb and its destination for animation
          const newRow = row + gapCount;
          drops.push({
            orb,
            fromRow: row,
            toRow: newRow,
            col: col
          });
          // Update grid array immediately
          this.gameArray[newRow][col] = orb;
          this.gameArray[row][col] = null;
          orb.setData('row', newRow);
        }
      }

      // Create new orbs above the grid
      for (let i = 0; i < gapCount; i++) {
        const row = i;
        const x = this.getOrbX(col);
        const y = this.getOrbY(-i - 2); // Start higher above the grid
        const color = this.getRandomColor();

        const newOrb = this.add.circle(x, y, this.orbSize/2, this.getOrbColor(color))
          .setStrokeStyle(2, 0xffffff)
          .setInteractive()
          .setData({
            color,
            row,
            col,
            removing: false
          });

        drops.push({
          orb: newOrb,
          fromRow: -i - 2,
          toRow: row,
          col: col,
          isNew: true
        });
        this.gameArray[row][col] = newOrb;
      }
    }

    // Animate all drops with staggered timing
    const dropPromises = drops.map(({ orb, toRow, isNew = false }, index) => {
      const delay = isNew ? 100 : Math.min(50 * Math.floor(index / gridSize), 150);
      const duration = isNew ? 750 : 500;
      
      return new Promise(resolve => {
        this.tweens.add({
          targets: orb,
          y: this.getOrbY(toRow),
          duration: duration,
          ease: 'Bounce.easeOut',
          delay: delay,
          onComplete: resolve
        });
      });
    });

    await Promise.all(dropPromises);
  }

  removeInitialMatches() {
    const matches = this.findMatches();
    matches.forEach(match => {
      match.orbs.forEach(orb => {
        const row = orb.getData('row');
        const col = orb.getData('col');
        const color = this.getRandomColor();
        orb.setFillStyle(this.getOrbColor(color));
        orb.setData('color', color);
      });
    });
  }

  async tweenOrb(orb, x, y, duration = 500, ease = 'Bounce.easeOut') {
    return new Promise(resolve => {
      this.tweens.add({
        targets: orb,
        x: x,
        y: y,
        duration: duration,
        ease: ease,
        onComplete: resolve
      });
    });
  }

  isValidPosition(row, col) {
    return row >= 0 && row < CONFIG.GRID.SIZE && 
           col >= 0 && col < CONFIG.GRID.SIZE;
  }

  getRandomColor() {
    const colors = CONFIG.GRID.COLORS;
    return colors[Math.floor(Math.random() * colors.length)];
  }

  getOrbColor(color) {
    const colorMap = {
      red: 0xff0000,
      blue: 0x0000ff,
      green: 0x00ff00,
      yellow: 0xffff00,
      purple: 0x800080
    };
    return colorMap[color] || 0xffffff;
  }

  getOrbX(col) {
    const { width } = this.cameras.main;
    const gridSize = CONFIG.GRID.SIZE;
    const offsetX = width / 2 - (gridSize * (this.orbSize + this.spacing)) / 2;
    return offsetX + col * (this.orbSize + this.spacing);
  }

  getOrbY(row) {
    return this.cameras.main.height * 0.25 + row * (this.orbSize + this.spacing);
  }

  handleMatch(color, size) {
    // Update player's power for the matched color
    if (this.isPlayerTurn && this.combatActive) {
      let powerGained = 0;
      if (size === 3) powerGained = CONFIG.MATCH_POWER.THREE;
      else if (size === 4) powerGained = CONFIG.MATCH_POWER.FOUR;
      else if (size >= 5) powerGained = CONFIG.MATCH_POWER.FIVE;

      this.player.skills[color] = (this.player.skills[color] || 0) + powerGained;
      this.uiManager.updateSkillPower(CONFIG.SKILLS[color], this.player.skills[color]);
    }
  }

  async playerUseSkill(color) {
    if (!this.combatActive || !this.isPlayerTurn) return;
    
    // Stop the turn timer since we're using a skill
    if (this.turnTimer) {
      this.turnTimer.remove();
      this.turnTimer = null;
    }
    
    const skillConfig = CONFIG.SKILLS[color];
    if (!skillConfig) {
      this.uiManager.showNotification(`No skill configured for ${color}`, 'warning');
      return;
    }

    if (this.player.skills[color] < skillConfig.powerRequired) {
      this.uiManager.showNotification(`Not enough power for ${skillConfig.name}`, 'warning');
      return;
    }

    // Consume power
    this.player.skills[color] = 0;
    this.uiManager.updateSkillPower(skillConfig, 0);

    // Play skill sound
    if (this.sounds.skill) {
      this.sounds.skill.play({ volume: 0.5 });
    }

    // Execute skill effect
    switch (color) {
      case 'red': // Melee Strike
        const fireDamage = skillConfig.baseDamage;
        this.enemy.hp = Math.max(0, this.enemy.hp - fireDamage);
        this.uiManager.showDamageNumber(fireDamage, 'enemyHealth', 'damage');
        break;

      case 'blue': // Ice Blast
        if (!this.activeBuffs.ice_shield.active) {
          this.activeBuffs.ice_shield.originalDefense = this.player.baseDefense;
          this.player.baseDefense *= skillConfig.defenseBonus;
          this.activeBuffs.ice_shield.active = true;
          this.activeBuffs.ice_shield.turnsLeft = skillConfig.duration;
          this.uiManager.showNotification('Defense increased!', 'info');
        } else {
          this.activeBuffs.ice_shield.turnsLeft = skillConfig.duration;
          this.uiManager.showNotification('Ice Shield refreshed!', 'info');
        }
        break;

      case 'green': // Heal
        const healAmount = skillConfig.healAmount;
        const oldHp = this.player.hp;
        this.player.hp = Math.min(this.player.hp + healAmount, this.player.maxHp);
        const actualHeal = this.player.hp - oldHp;
        this.uiManager.showDamageNumber(actualHeal, 'playerHealth', 'heal');
        break;

      case 'yellow': // Lightning
        const thunderDamage = skillConfig.baseDamage;
        this.enemy.hp = Math.max(0, this.enemy.hp - thunderDamage);
        this.uiManager.showDamageNumber(thunderDamage, 'enemyHealth', 'damage');
        break;

      case 'purple': // Dark Magic
        this.enemy.baseAttack *= skillConfig.attackReduction;
        this.uiManager.showNotification('Enemy attack reduced!', 'info');
        break;
    }

    // Update stats display
    this.uiManager.updatePlayerStats(this.player);
    this.uiManager.updateEnemyStats(this.enemy);

    // Check victory conditions
    if (this.enemy.hp <= 0) {
      this.endCombat(true);
    }

    // End turn after using skill
    this.endPlayerTurn();
  }

  startCombat() {
    this.combatActive = true;
    this.uiManager.showNotification('Battle Start!', 'info');
    this.startPlayerTurn();
  }

  startPlayerTurn() {
    this.isPlayerTurn = true;
    this.canPick = true;
    this.uiManager.updateTurnIndicator('Player Turn');
    
    // Start turn timer
    let timeLeft = this.turnDuration;
    this.turnTimer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        timeLeft--;
        // Play tick sound when time is running low (last 5 seconds)
        if (timeLeft <= 5 && this.sounds.tick) {
          this.sounds.tick.play({ volume: 0.5 });
        }
        this.uiManager.updateTurnIndicator(`Player Turn (${timeLeft}s)`);
        if (timeLeft <= 0) {
          this.endPlayerTurn();
        }
      },
      repeat: this.turnDuration - 1
    });
  }

  endPlayerTurn() {
    if (this.turnTimer) {
      this.turnTimer.remove();
      this.turnTimer = null;
    }
    
    this.isPlayerTurn = false;
    this.canPick = false;
    this.uiManager.updateTurnIndicator("Enemy's Turn");
    
    this.time.delayedCall(1500, () => {
      if (this.combatActive) {
        this.enemyTurn();
      }
    });
  }

  enemyTurn() {
    // Update buff durations
    this.updateBuffDurations();
    
    // Calculate and apply enemy damage
    const baseDamage = CONFIG.COMBAT.ENEMY_DAMAGE * (this.enemy.baseAttack / 10);
    const damageReduction = this.player.baseDefense / (this.player.baseDefense + 100);
    const reducedDamage = Math.floor(baseDamage * (1 - damageReduction));
    
    this.player.hp = Math.max(0, this.player.hp - reducedDamage);
    this.uiManager.updatePlayerStats(this.player);
    this.uiManager.showDamageNumber(reducedDamage, 'playerHealth', 'damage');

    // Show damage notification
    const message = damageReduction > 0 
      ? `Enemy attacked for ${reducedDamage} damage (reduced from ${baseDamage})`
      : `Enemy attacked for ${reducedDamage} damage`;
    this.uiManager.showNotification(message, 'info');

    // Check defeat condition
    if (this.player.hp <= 0) {
      this.endCombat(false);
    } else {
      this.time.delayedCall(1500, () => {
        if (this.combatActive) {
          this.startPlayerTurn();
        }
      });
    }
  }

  endCombat(playerWon) {
    this.combatActive = false;
    this.canPick = false;

    // Reset buffs
    if (this.activeBuffs.ice_shield.active) {
      this.player.baseDefense = this.activeBuffs.ice_shield.originalDefense;
      this.activeBuffs.ice_shield.active = false;
      this.activeBuffs.ice_shield.originalDefense = null;
    }

    const missionProgress = this.registry.get('missionProgress');
    const missionsData = this.cache.json.get('missions');
    const currentMission = missionsData.mainMissions[0];
    
    if (playerWon) {
      const isLastBattle = missionProgress.currentBattleIndex + 1 >= missionProgress.totalBattles;
      const nextBattle = !isLastBattle ? currentMission.battles[missionProgress.currentBattleIndex + 1] : null;

      // Show sequence progress and set up the next transition
      this.uiManager.showVictoryScreen({ 
        battleSequence: `Battle ${missionProgress.currentBattleIndex + 1} of ${missionProgress.totalBattles} Complete!`,
        exp: isLastBattle ? currentMission.rewards.exp : 0, // Only give rewards after final battle
        items: []
      }, () => {
        // This callback is called when the Continue button is pressed
        if (!isLastBattle) {
          // Update progress and continue to next battle
          missionProgress.currentBattleIndex++;
          this.registry.set('missionProgress', missionProgress);
          
          this.scene.start('CombatScene', {
            missionData: {
              level: nextBattle.level,
              battleId: nextBattle.id,
              description: nextBattle.description,
              sequence: `Battle ${missionProgress.currentBattleIndex + 1} of ${missionProgress.totalBattles}`
            }
          });
        } else {
          // Mission complete - give final rewards
          this.player.gainExperience(currentMission.rewards.exp);
          
          // Return to base with mission completion
          this.scene.start('HomeBaseScene', {
            combatResult: {
              victory: true,
              missionComplete: true,
              rewards: currentMission.rewards
            }
          });
        }
      });
    } else {
      // Handle defeat
      const expLost = this.player.loseExperience(1);
      this.uiManager.showDefeatScreen(() => {
        // Return to base when Continue is pressed
        this.scene.start('HomeBaseScene', {
          combatResult: {
            victory: false
          }
        });
      });
    }
  }

  updateBuffDurations() {
    if (this.activeBuffs.ice_shield.active) {
      this.activeBuffs.ice_shield.turnsLeft--;
      
      if (this.activeBuffs.ice_shield.turnsLeft <= 0) {
        this.player.baseDefense = this.activeBuffs.ice_shield.originalDefense;
        this.activeBuffs.ice_shield.active = false;
        this.activeBuffs.ice_shield.originalDefense = null;
        this.uiManager.showNotification('Ice Shield wore off!', 'info');
        this.uiManager.updatePlayerStats(this.player);
      }
    }
  }
}
