export class PhaserUIManager {
  constructor(scene) {
    this.scene = scene;
    this.notifications = [];
    this.skillButtons = new Map();
  }

  async initialize() {
    console.log("NEW PhaserUIManager initialize called - v4");
    const { width, height } = this.scene.cameras.main;
    
    // Create full-width dark header background with blue-purple tint
    this.headerBackground = this.scene.add.rectangle(
      width/2, 80, // Positioned in the middle vertically
      width, 160, // Full width, taller to contain all elements
      0x1a1a2e, 0.9 // Dark blue-purple color
    ).setOrigin(0.5, 0.5)
     .setStrokeStyle(1, 0x3a3a5e); // Add subtle border
    
    // Create turn indicator in the center
    this.createTurnIndicator(width/2);
    
    // Create enemy info on the left side
    this.createEnemyHeader(100, 80, 'Toxic Zombie', 'enemy-avatar', 80, 80, 8, 3);
    
    // Create player info on the right side
    this.createPlayerHeader(width - 100, 80, 'Player', 'player-avatar', 100, 100, 5, 6);
    
    // Create skills footer
    this.createSkillsFooter();
    
    // Create notification container
    this.notificationContainer = this.scene.add.container(
      width / 2,
      height - 150
    );
  }

  createEnemyHeader(x, y, name, avatarTexture, hp, maxHp, atk, def) {
    const { width } = this.scene.cameras.main;
    
    // Add name text next to the avatar
    const nameText = this.scene.add.text(100, 60, name, {
      fontSize: '20px',
      fontFamily: 'Arial',
      fontWeight: 'bold',
      fill: '#ffffff'
    }).setOrigin(0, 0.5);
    
    // Make avatar circular
    let avatar;
    try {
      // Create a circular mask for the avatar
      const mask = this.scene.make.graphics({});
      mask.fillCircle(60, 60, 35);
      
      avatar = this.scene.add.image(60, 60, avatarTexture)
        .setDisplaySize(70, 70);
      
      // Apply the mask to make the image circular
      avatar.setMask(mask.createGeometryMask());
    } catch (err) {
      // Fallback if texture not available
      avatar = this.scene.add.circle(60, 60, 35, 0xe74c3c);
    }
    
    // Health bar background - positioned to the right of avatar
    const healthBarX = 30; // Moved further left
    const healthBarY = 120;
    const healthBarWidth = 150;
    const healthBarHeight = 15;
    
    const healthBg = this.scene.add.rectangle(
      healthBarX, healthBarY, 
      healthBarWidth, healthBarHeight, 
      0x333333
    ).setOrigin(0, 0.5);
    
    // Health bar fill
    const healthFillWidth = (hp / maxHp) * healthBarWidth;
    const healthFill = this.scene.add.rectangle(
      healthBarX, healthBarY, 
      healthFillWidth, healthBarHeight, 
      0xe74c3c
    ).setOrigin(0, 0.5)
      .setName('enemyHealth');
    
    // HP text - below the health bar
    const hpText = this.scene.add.text(
      healthBarX, healthBarY + 25, 
      'HP:', {
        fontSize: '14px',
        fontFamily: 'Arial',
        fill: '#ffffff', // White color for "HP:" text
        fontWeight: 'bold'
      }
    ).setOrigin(0, 0.5)
      .setName('enemyHPText');

    // HP values with red color
    const hpValues = this.scene.add.text(
      healthBarX + 30, healthBarY + 25, 
      `${hp}/${maxHp}`, {
        fontSize: '14px',
        fontFamily: 'Arial',
        fill: '#ff6666', // Red color for values
        fontWeight: 'bold'
      }
    ).setOrigin(0, 0.5)
      .setName('enemyHPValues');
    
    // ATK stat - positioned to the right of HP
    const atkIcon = this.scene.add.text(
      healthBarX + 130, healthBarY + 25, 
      '⚔️', { 
        fontSize: '16px'
      }
    ).setOrigin(0, 0.5);
    
    const atkText = this.scene.add.text(
      healthBarX + 150, healthBarY + 25, 
      `ATK: ${atk}`, {
        fontSize: '14px',
        fontFamily: 'Arial',
        fill: '#ffffff',
        fontWeight: 'bold'
      }
    ).setOrigin(0, 0.5)
      .setName('enemyATK');
    
    // DEF stat - positioned to the right of ATK
    const defIcon = this.scene.add.text(
      healthBarX + 200, healthBarY + 25, 
      '🛡️', { 
        fontSize: '16px'
      }
    ).setOrigin(0, 0.5);
    
    const defText = this.scene.add.text(
      healthBarX + 220, healthBarY + 25, 
      `DEF: ${def}`, {
        fontSize: '14px',
        fontFamily: 'Arial',
        fill: '#ffffff',
        fontWeight: 'bold'
      }
    ).setOrigin(0, 0.5)
      .setName('enemyDEF');
  }

  createPlayerHeader(x, y, name, avatarTexture, hp, maxHp, atk, def) {
    const { width } = this.scene.cameras.main;
    
    // Add name text next to the avatar
    const nameText = this.scene.add.text(width - 100, 60, name, {
      fontSize: '20px',
      fontFamily: 'Arial',
      fontWeight: 'bold',
      fill: '#ffffff'
    }).setOrigin(1, 0.5);
    
    // Make avatar circular
    let avatar;
    try {
      // Create a circular mask for the avatar
      const mask = this.scene.make.graphics({});
      mask.fillCircle(width - 60, 60, 35);
      
      avatar = this.scene.add.image(width - 60, 60, avatarTexture)
        .setDisplaySize(70, 70);
      
      // Apply the mask to make the image circular
      avatar.setMask(mask.createGeometryMask());
    } catch (err) {
      // Fallback if texture not available
      avatar = this.scene.add.circle(width - 60, 60, 35, 0x2ecc71);
    }
    
    // Health bar background - right justified
    const healthBarX = width - 180; // 30px from right edge
    const statsX = width - 290; // Original position for stats
    const healthBarY = 120;
    const healthBarWidth = 150;
    const healthBarHeight = 15;
    
    const healthBg = this.scene.add.rectangle(
      healthBarX, healthBarY, 
      healthBarWidth, healthBarHeight, 
      0x333333
    ).setOrigin(0, 0.5);
    
    // Health bar fill
    const healthFillWidth = (hp / maxHp) * healthBarWidth;
    const healthFill = this.scene.add.rectangle(
      healthBarX, healthBarY, 
      healthFillWidth, healthBarHeight, 
      0x2ecc71
    ).setOrigin(0, 0.5)
      .setName('playerHealth');
    
    // HP text - below the health bar at original position
    const hpText = this.scene.add.text(
      statsX, healthBarY + 25,
      'HP:', {
        fontSize: '14px',
        fontFamily: 'Arial',
        fill: '#ffffff', // White color for "HP:" text
        fontWeight: 'bold'
      }
    ).setOrigin(0, 0.5)
      .setName('playerHPText');

    // HP values with green color
    const hpValues = this.scene.add.text(
      statsX + 30, healthBarY + 25,
      `${hp}/${maxHp}`, {
        fontSize: '14px',
        fontFamily: 'Arial',
        fill: '#66ff66', // Green color for values
        fontWeight: 'bold'
      }
    ).setOrigin(0, 0.5)
      .setName('playerHPValues');
    
    // ATK stat - positioned to the right of HP
    const atkIcon = this.scene.add.text(
      statsX + 130, healthBarY + 25,
      '⚔️', { 
        fontSize: '16px'
      }
    ).setOrigin(0, 0.5);
    
    const atkText = this.scene.add.text(
      statsX + 150, healthBarY + 25,
      `ATK: ${atk}`, {
        fontSize: '14px',
        fontFamily: 'Arial',
        fill: '#ffffff',
        fontWeight: 'bold'
      }
    ).setOrigin(0, 0.5)
      .setName('playerATK');
    
    // DEF stat - positioned to the right of ATK
    const defIcon = this.scene.add.text(
      statsX + 200, healthBarY + 25,
      '🛡️', { 
        fontSize: '16px'
      }
    ).setOrigin(0, 0.5);
    
    const defText = this.scene.add.text(
      statsX + 220, healthBarY + 25,
      `DEF: ${def}`, {
        fontSize: '14px',
        fontFamily: 'Arial',
        fill: '#ffffff',
        fontWeight: 'bold'
      }
    ).setOrigin(0, 0.5)
      .setName('playerDEF');
  }

  createTurnIndicator(x) {
    // Add the "Player Turn" text
    const turnText = this.scene.add.text(
      x,
      30,
      'Player Turn',
      {
        fontFamily: 'Arial',
        fontSize: '24px',
        color: '#FFD700', // Gold color
        align: 'center'
      }
    ).setOrigin(0.5)
     .setName('turnIndicator');
    
    // Add the turn number
    const turnNumber = this.scene.add.text(
      x,
      60,
      '9',
      {
        fontFamily: 'Arial',
        fontSize: '36px',
        color: '#FFD700', // Gold color
        align: 'center',
        fontWeight: 'bold'
      }
    ).setOrigin(0.5)
     .setName('turnTimer');
  }

  createSkillsFooter() {
    console.log("Creating skills footer");
    const { width, height } = this.scene.cameras.main;
    
    // Position the footer closer to the bottom of the taller canvas
    const footerY = height - 80; // Position it 80px from the bottom
    console.log(`Footer position: y=${footerY}`);
    
    // Footer background
    const footerBg = this.scene.add.rectangle(
      width/2, footerY,
      width, 100,
      0x0f1218, 0.95
    ).setOrigin(0.5, 0.5);
    
    this.skillContainer = this.scene.add.container(
      width/2, footerY
    );
    
    this.skillContainer.add(footerBg);
    console.log("Skills footer created");
  }

  addSkillButton(config, onClick) {
    console.log("Adding skill button for:", config.name);
    const buttonWidth = 100;
    const buttonHeight = 80;
    const spacing = 20;
    const totalButtons = this.skillButtons.size;
    
    // Calculate position - center the buttons
    const totalWidth = 5 * (buttonWidth + spacing) - spacing;
    const startX = -totalWidth / 2 + buttonWidth / 2;
    const x = startX + (totalButtons * (buttonWidth + spacing));
    const y = 0;
    
    // Create button container
    const container = this.scene.add.container(x, y);
    
    // Button background
    const buttonBg = this.scene.add.rectangle(
      0, 0, 
      buttonWidth, buttonHeight, 
      0x1a2030
    ).setStrokeStyle(2, 0x3a4050)
      .setInteractive();
    
    // Bottom color stripe based on skill color
    const colorStripe = this.scene.add.rectangle(
      0, buttonHeight/2 - 3,
      buttonWidth, 6,
      this.getColorForSkill(config.color)
    ).setOrigin(0.5, 0.5);
    
    // Skill icon
    const icon = this.scene.add.text(0, -15, this.getSkillIcon(config.color), {
      fontSize: '28px'
    }).setOrigin(0.5);
    
    // Skill name
    const nameText = this.scene.add.text(0, 15, this.getSkillName(config.color), {
      fontSize: '14px',
      fontFamily: 'Arial',
      fill: '#ffffff'
    }).setOrigin(0.5);
    
    // Power meter background - make it darker and more visible
    const powerBarBg = this.scene.add.rectangle(0, 35, buttonWidth - 20, 8, 0x222222)
      .setOrigin(0.5, 0.5)
      .setStrokeStyle(1, 0x000000);
    
    // Power bar fill with color matching the skill
    const powerBar = this.scene.add.rectangle(
      -(buttonWidth - 20)/2, 35, 
      0, 8, 
      this.getColorForSkill(config.color)
    ).setOrigin(0, 0.5);

    // Add interaction handlers
    buttonBg
      .on('pointerover', () => buttonBg.setFillStyle(0x2a3040))
      .on('pointerout', () => buttonBg.setFillStyle(0x1a2030))
      .on('pointerdown', () => buttonBg.setFillStyle(0x101520))
      .on('pointerup', () => {
        buttonBg.setFillStyle(0x1a2030);
        onClick(config);
      });
    
    // Add all elements to container
    container.add([buttonBg, colorStripe, icon, nameText, powerBarBg, powerBar]);
    
    // Store button components for later updates
    const button = {
      container,
      bg: buttonBg,
      powerBarBg,
      powerBar,
      nameText,
      config
    };
    
    this.skillButtons.set(config.id, button);
    this.skillContainer.add(container);
    
    return button;
  }

  getSkillIcon(color) {
    const icons = {
      red: '🗡️',
      blue: '❄️',
      green: '🌿',
      yellow: '⚡',
      purple: '🔮'
    };
    return icons[color] || '❓';
  }

  getSkillName(color) {
    const names = {
      red: 'Melee Strike',
      blue: 'Ice Blast',
      green: 'Heal',
      yellow: 'Lightning',
      purple: 'Dark Magic'
    };
    return names[color] || 'Unknown';
  }

  getColorForSkill(color) {
    const colorMap = {
      red: 0xff3333,     // Brighter red
      blue: 0x3399ff,    // Brighter blue
      green: 0x33ff33,   // Brighter green
      yellow: 0xffff33,  // Brighter yellow
      purple: 0xcc33ff   // Brighter purple
    };
    return colorMap[color] || 0xffffff;
  }

  updatePlayerStats(player) {
    const healthBar = this.scene.children.getByName('playerHealth');
    const hpText = this.scene.children.getByName('playerHPText');
    const atkText = this.scene.children.getByName('playerATK');
    const defText = this.scene.children.getByName('playerDEF');
    
    if (healthBar) {
      const healthPercent = player.hp / player.maxHp;
      const healthBarWidth = 150; // Match creation width
      healthBar.width = healthBarWidth * healthPercent;
    }
    
    const hpValues = this.scene.children.getByName('playerHPValues');
    if (hpValues) {
      hpValues.setText(`${player.hp}/${player.maxHp}`);
    }
    
    if (atkText) {
      atkText.setText(`ATK: ${player.baseAttack}`);
    }
    
    if (defText) {
      defText.setText(`DEF: ${player.baseDefense}`);
    }
  }

  updateEnemyStats(enemy) {
    const healthBar = this.scene.children.getByName('enemyHealth');
    const hpText = this.scene.children.getByName('enemyHPText');
    const atkText = this.scene.children.getByName('enemyATK');
    const defText = this.scene.children.getByName('enemyDEF');
    
    if (healthBar) {
      const healthPercent = enemy.hp / enemy.maxHp;
      const healthBarWidth = 150; // Match creation width
      healthBar.width = healthBarWidth * healthPercent;
    }
    
    const hpValues = this.scene.children.getByName('enemyHPValues');
    if (hpValues) {
      hpValues.setText(`${enemy.hp}/${enemy.maxHp}`);
    }
    
    if (atkText) {
      atkText.setText(`ATK: ${enemy.baseAttack}`);
    }
    
    if (defText) {
      defText.setText(`DEF: ${enemy.baseDefense}`);
    }
  }

  updateSkillPower(skillConfig, power) {
    const button = this.skillButtons.get(skillConfig.id);
    if (button) {
      const fillPercent = Math.min(power / skillConfig.powerRequired, 1);
      const maxWidth = button.powerBarBg.width;
      button.powerBar.width = maxWidth * fillPercent;
      
      // Enhanced visual feedback when fully charged
      if (fillPercent >= 1 && !button.isGlowing) {
        button.isGlowing = true;
        
        // Reduced glow parameters for all skills
        const glowIntensity = 0.15;  // Reduced from 0.3
        const glowDistance = 4;      // Reduced from 8
        
        // Add a controlled glow effect to the button
        button.bg.postFX.addGlow(
          this.getColorForSkill(button.config.color), 
          glowDistance,          // Reduced distance
          0,                     // Offset
          false,                 // Outer glow
          glowIntensity,         // Reduced strength
          16                     // Quality
        );
        
        // Add a pulsing animation
        this.scene.tweens.add({
          targets: button.bg,
          alpha: 0.9,            // Less extreme alpha change
          yoyo: true,
          repeat: -1,
          duration: 500
        });
        
        // Make the power bar glow with the same reduced parameters
        button.powerBar.postFX.addGlow(
          this.getColorForSkill(button.config.color), 
          glowDistance, 
          0, 
          false, 
          glowIntensity, 
          16
        );
      } else if (fillPercent < 1 && button.isGlowing) {
        button.isGlowing = false;
        this.scene.tweens.killTweensOf(button.bg);
        button.bg.alpha = 1;
        button.bg.postFX.clear();
        button.powerBar.postFX.clear();
      }
    }
  }

  updateTurnIndicator(text) {
    const turnText = this.scene.children.getByName('turnIndicator');
    const turnTimer = this.scene.children.getByName('turnTimer');
    
    if (turnText) {
      // For text like "Player Turn (7s)" extract just "Player Turn"
      const baseText = text.replace(/\s*\(\d+s\)$/, '');
      turnText.setText(baseText);
      
      // Extract timer value if present in the format "Player Turn (7s)"
      const timerMatch = text.match(/\((\d+)s\)/);
      if (timerMatch && turnTimer) {
        turnTimer.setText(timerMatch[1]);
      }
    }
  }

  showNotification(message, type = 'info', duration = 2000) {
    const text = this.scene.add.text(0, 0, message, {
      fontSize: '20px',
      fill: this.getNotificationColor(type),
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    this.notificationContainer.add(text);

    // Animate notification
    text.setAlpha(0);
    this.scene.tweens.add({
      targets: text,
      alpha: 1,
      y: -30,
      duration: 500,
      ease: 'Power2',
      onComplete: () => {
        this.scene.time.delayedCall(duration, () => {
          this.scene.tweens.add({
            targets: text,
            alpha: 0,
            y: -60,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
              text.destroy();
            }
          });
        });
      }
    });
  }

  getNotificationColor(type) {
    switch (type) {
      case 'error': return '#ff4444';
      case 'warning': return '#ffaa44';
      case 'success': return '#44ff44';
      default: return '#ffffff';
    }
  }

  showDamageNumber(amount, targetName, type = 'damage') {
    const target = this.scene.children.getByName(targetName);
    if (!target) return;

    const color = type === 'damage' ? '#ff4444' : '#44ff44';
    const prefix = type === 'damage' ? '-' : '+';
    const text = this.scene.add.text(target.x, target.y, `${prefix}${amount}`, {
      fontSize: '24px',
      fill: color,
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    this.scene.tweens.add({
      targets: text,
      y: text.y - 50,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => text.destroy()
    });
  }

  showVictoryScreen(results, onContinue) {
    const { width, height } = this.scene.cameras.main;
    
    // Create overlay
    const overlay = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.7)
      .setOrigin(0, 0);

    // Create victory container
    const container = this.scene.add.container(width / 2, height / 2);

    // Create victory background - make it taller to fit sequence info
    const victoryBg = this.scene.add.rectangle(0, 0, 400, 350, 0x1a2030)
      .setOrigin(0.5)
      .setStrokeStyle(4, 0xf1c40f);

    // Create victory text
    const victoryText = this.scene.add.text(0, -130, 'VICTORY!', {
      fontSize: '48px',
      fill: '#f1c40f',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);

    // Show battle sequence if provided
    if (results.battleSequence) {
      const sequenceText = this.scene.add.text(0, -60, results.battleSequence, {
        fontSize: '24px',
        fill: '#3498db',
        stroke: '#000000',
        strokeThickness: 3
      }).setOrigin(0.5);
      container.add(sequenceText);
    }

    // Create exp text - adjusted position
    const expText = this.scene.add.text(0, 0, `Experience gained: ${results.exp}`, {
      fontSize: '24px',
      fill: '#ffffff'
    }).setOrigin(0.5);

    // Create items text if any - adjusted position
    let itemsText;
    if (results.items && results.items.length > 0) {
      itemsText = this.scene.add.text(0, 40, `Items found: ${results.items.length}`, {
        fontSize: '24px',
        fill: '#ffffff'
      }).setOrigin(0.5);
    } else {
      itemsText = this.scene.add.text(0, 40, 'No items found', {
        fontSize: '24px',
        fill: '#aaaaaa'
      }).setOrigin(0.5);
    }

    // Create continue button
    const buttonBg = this.scene.add.rectangle(0, 80, 200, 50, 0x3498db)
      .setOrigin(0.5)
      .setInteractive();
    
    const buttonText = this.scene.add.text(0, 80, 'Continue', {
      fontSize: '24px',
      fill: '#ffffff'
    }).setOrigin(0.5);

    buttonBg.on('pointerover', () => buttonBg.setFillStyle(0x2980b9));
    buttonBg.on('pointerout', () => buttonBg.setFillStyle(0x3498db));
    buttonBg.on('pointerdown', () => buttonBg.setFillStyle(0x1c6ea4));
    buttonBg.on('pointerup', () => {
      if (onContinue) {
        onContinue();
      }
    });

    // Add all elements to container
    container.add([victoryBg, victoryText, expText, itemsText, buttonBg, buttonText]);

    // Animate container
    this.scene.tweens.add({
      targets: container,
      scale: { from: 0, to: 1 },
      duration: 500,
      ease: 'Back'
    });
  }

  showDefeatScreen(onContinue) {
    const { width, height } = this.scene.cameras.main;
    
    // Create overlay
    const overlay = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.7)
      .setOrigin(0, 0);

    // Create defeat container
    const container = this.scene.add.container(width / 2, height / 2);

    // Create defeat background
    const defeatBg = this.scene.add.rectangle(0, 0, 400, 300, 0x1a2030)
      .setOrigin(0.5)
      .setStrokeStyle(4, 0xe74c3c);

    // Create defeat text
    const defeatText = this.scene.add.text(0, -100, 'DEFEAT', {
      fontSize: '48px',
      fill: '#e74c3c',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);

    // Create message text
    const messageText = this.scene.add.text(0, -20, 'You were defeated in battle!', {
      fontSize: '24px',
      fill: '#ffffff'
    }).setOrigin(0.5);

    // Create exp loss text
    const expLossText = this.scene.add.text(0, 20, 'Experience Lost: 1', {
      fontSize: '24px',
      fill: '#e74c3c'
    }).setOrigin(0.5);

    // Create continue button
    const buttonBg = this.scene.add.rectangle(0, 80, 200, 50, 0x3498db)
      .setOrigin(0.5)
      .setInteractive();
    
    const buttonText = this.scene.add.text(0, 80, 'Continue', {
      fontSize: '24px',
      fill: '#ffffff'
    }).setOrigin(0.5);

    buttonBg.on('pointerover', () => buttonBg.setFillStyle(0x2980b9));
    buttonBg.on('pointerout', () => buttonBg.setFillStyle(0x3498db));
    buttonBg.on('pointerdown', () => buttonBg.setFillStyle(0x1c6ea4));
    buttonBg.on('pointerup', () => {
      if (onContinue) {
        onContinue();
      }
    });

    // Add all elements to container
    container.add([defeatBg, defeatText, messageText, expLossText, buttonBg, buttonText]);

    // Animate container
    this.scene.tweens.add({
      targets: container,
      scale: { from: 0, to: 1 },
      duration: 500,
      ease: 'Back'
    });
  }
}
