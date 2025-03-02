import Phaser from 'phaser';

export default class ProfileScene extends Phaser.Scene {
  constructor() {
    super('ProfileScene');
    console.log('ProfileScene: Constructor called');
  }

  init(data) {
    console.log('ProfileScene: init called');
    // Always get the latest data from registry
    this.playerData = this.registry.get('player');
    this.tempPlayerData = JSON.parse(JSON.stringify(this.playerData));
    console.log('ProfileScene: playerData loaded', this.playerData);
}

  create() {
    console.log('ProfileScene: create started');
    // Create dark background
    this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x0f1218)
      .setOrigin(0, 0);
            
    // Create sections
    this.createPlayerHeader();
    this.createAttributesSection();
    this.createSkillsSection();
    this.createNavigation();

    // Create toast container for notifications
    this.toastContainer = this.add.container(0, 0);
  }

  createPlayerHeader() {
    const { width } = this.cameras.main;
    
    // Avatar
    const avatar = this.add.image(100, 100, 'player-avatar')
      .setDisplaySize(80, 80);
    
    // Player name
    this.add.text(160, 80, this.tempPlayerData.name, {
      fontSize: '24px',
      fill: '#ffffff'
    });
    
    // Level
    this.add.text(160, 110, `Level: ${this.tempPlayerData.level}`, {
      fontSize: '18px',
      fill: '#aaaaaa'
    });
    
    // Stats
    this.add.text(width - 20, 80, `Gold: ${this.tempPlayerData.gold}`, {
      fontSize: '18px',
      fill: '#f1c40f',
      align: 'right'
    }).setOrigin(1, 0);
    
    this.add.text(width - 20, 110, `HP: ${this.tempPlayerData.hp}/${this.tempPlayerData.maxHp}`, {
      fontSize: '18px',
      fill: '#2ecc71',
      align: 'right'
    }).setOrigin(1, 0);
    
    this.add.text(width - 20, 140, `EXP: ${this.tempPlayerData.experience}/${this.tempPlayerData.nextLevelExp}`, {
      fontSize: '18px',
      fill: '#3498db',
      align: 'right'
    }).setOrigin(1, 0);
  }

  createAttributesSection() {
    // Section title
    this.add.text(20, 180, 'Character Attributes', {
      fontSize: '20px',
      fill: '#ffffff'
    });
    
    // Available points
    const pointsText = this.add.text(20, 210, `Available Points: ${this.tempPlayerData.availablePoints}`, {
      fontSize: '16px',
      fill: '#f1c40f'
    });
    
    // Create attribute displays
    const attributes = [
      { name: 'Strength', key: 'strength', x: 250, column: 0 },
      { name: 'Dexterity', key: 'dexterity', x: 250, column: 1 },
      { name: 'Intelligence', key: 'intelligence', x: 330, column: 0 },
      { name: 'Vitality', key: 'vitality', x: 330, column: 1 }
    ];

    attributes.forEach(attr => {
      this.createAttributeDisplay(attr.name, attr.key, attr.x, attr.column, pointsText);
    });
  }

  createAttributeDisplay(name, key, baseY, column, pointsText) {
    const x = 20 + column * (this.cameras.main.width / 2 - 40);
    const y = baseY;
    
    // Background
    this.add.rectangle(x, y, this.cameras.main.width / 2 - 60, 50, 0x2a3040)
      .setOrigin(0, 0);
    
    // Attribute name
    this.add.text(x + 10, y + 15, name, {
      fontSize: '16px',
      fill: '#ffffff'
    });
    
    // Minus button
    const minusBtn = this.add.circle(x + (this.cameras.main.width / 2 - 100), y + 25, 15, 0x3a4050)
      .setInteractive();
    
    this.add.text(x + (this.cameras.main.width / 2 - 100), y + 25, '-', {
      fontSize: '16px',
      fill: '#ffffff'
    }).setOrigin(0.5);
    
    // Value
    const valueText = this.add.text(x + (this.cameras.main.width / 2 - 70), y + 25, 
      this.tempPlayerData.attributes[key].toString(), {
        fontSize: '16px',
        fill: '#ffffff'
      }).setOrigin(0.5);
    
    // Plus button
    const plusBtn = this.add.circle(x + (this.cameras.main.width / 2 - 40), y + 25, 15, 0x3a4050)
      .setInteractive();
    
    this.add.text(x + (this.cameras.main.width / 2 - 40), y + 25, '+', {
      fontSize: '16px',
      fill: '#ffffff'
    }).setOrigin(0.5);
    
    // Button functionality
    plusBtn.on('pointerdown', () => {
      if (this.tempPlayerData.availablePoints > 0) {
        this.tempPlayerData.attributes[key]++;
        this.tempPlayerData.availablePoints--;
        valueText.setText(this.tempPlayerData.attributes[key].toString());
        pointsText.setText(`Available Points: ${this.tempPlayerData.availablePoints}`);
        // Check if sound exists before playing
        if (this.sound.get('tick')) {
          this.sound.play('tick', { volume: 0.3 });
        }
      }
    });
    
    minusBtn.on('pointerdown', () => {
      if (this.tempPlayerData.attributes[key] > 1) {
        this.tempPlayerData.attributes[key]--;
        this.tempPlayerData.availablePoints++;
        valueText.setText(this.tempPlayerData.attributes[key].toString());
        pointsText.setText(`Available Points: ${this.tempPlayerData.availablePoints}`);
        // Check if sound exists before playing
        if (this.sound.get('tick')) {
          this.sound.play('tick', { volume: 0.3 });
        }
      }
    });

    // Add hover effects
    [plusBtn, minusBtn].forEach(btn => {
      btn.on('pointerover', () => btn.setScale(1.1));
      btn.on('pointerout', () => btn.setScale(1));
    });
  }

  createSkillsSection() {
    // Skills section title
    this.add.text(20, 420, 'Equipped Skills', {
      fontSize: '20px',
      fill: '#ffffff'
    });

    const colors = ['red', 'blue', 'green', 'yellow', 'purple'];
    const startY = 460;

    colors.forEach((color, index) => {
      const y = startY + index * 60;
      
      // Skill slot background
      this.add.rectangle(20, y, this.cameras.main.width - 40, 50, 0x2a3040)
        .setOrigin(0, 0);
      
      // Color indicator
      this.add.circle(40, y + 25, 10, this.getColorHex(color));
      
      // Skill name
      const skillId = this.tempPlayerData.equippedSkills[color];
      const skillName = skillId ? 
        this.tempPlayerData.skills.find(s => s.id === skillId)?.name :
        'No skill equipped';
      
      this.add.text(60, y + 15, skillName, {
        fontSize: '16px',
        fill: '#ffffff'
      });
    });
  }

  createNavigation() {
    const { width, height } = this.cameras.main;
    
    // Back button
    const backButton = this.add.rectangle(100, height - 50, 160, 40, 0x3a4050)
      .setInteractive();
    
    this.add.text(100, height - 50, 'Back to Home', {
      fontSize: '18px',
      fill: '#ffffff'
    }).setOrigin(0.5);
    
    // Save button
    const saveButton = this.add.rectangle(width - 100, height - 50, 160, 40, 0xe74c3c)
      .setInteractive();
    
    this.add.text(width - 100, height - 50, 'Save Changes', {
      fontSize: '18px',
      fill: '#ffffff'
    }).setOrigin(0.5);
    
    backButton.on('pointerdown', () => {
      this.scene.start('HomeBaseScene', { playerData: this.playerData });
    });
    
    saveButton.on('pointerdown', () => {
      // Update player data
      Object.assign(this.playerData, this.tempPlayerData);
      // Save to registry
      this.registry.set('playerData', this.playerData);
      // Show confirmation
      this.showToast('Changes saved!');
    });

    // Add hover effects
    [backButton, saveButton].forEach(btn => {
      btn.on('pointerover', () => {
        btn.setScale(1.05);
        // Check if sound exists before playing
        if (this.sound.get('tick')) {
          this.sound.play('tick', { volume: 0.5 });
        } else {
          console.warn('Sound "tick" not loaded');
        }
      });
      btn.on('pointerout', () => btn.setScale(1));
    });
  }

  showToast(message) {
    const { width, height } = this.cameras.main;
    
    const toast = this.add.text(width/2, height - 100, message, {
      fontSize: '18px',
      padding: { x: 20, y: 10 },
      backgroundColor: '#2ecc71',
      fill: '#ffffff'
    }).setOrigin(0.5);
    
    this.tweens.add({
      targets: toast,
      alpha: 0,
      y: toast.y - 50,
      duration: 2000,
      ease: 'Power2',
      onComplete: () => toast.destroy()
    });
  }

  getColorHex(color) {
    const colors = {
      red: 0xe74c3c,
      blue: 0x3498db,
      green: 0x2ecc71,
      yellow: 0xf1c40f,
      purple: 0x9b59b6
    };
    return colors[color] || 0xffffff;
  }
}
