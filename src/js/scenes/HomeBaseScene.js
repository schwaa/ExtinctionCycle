import Phaser from 'phaser';

export default class HomeBaseScene extends Phaser.Scene {
  constructor() {
    super('HomeBaseScene');
    this.lanternLight = null;
    this.heartbeatTween = null;
    this.assetsLoaded = false;
  }

  init(data) {
    console.log('HomeBaseScene: init called');
    // Get player data from previous scene or registry
    this.player = this.registry.get('player') || {
      name: 'GROX',
      level: 1,
      hp: 100,
      maxHp: 100,
      experience: 0,
      nextLevelExp: 100,
      coins: 0,
      food: 5
    };
    
    // Update player with combat results if available
    if (data.combatResult) {
      this.combatResult = data.combatResult;
      if (this.combatResult.victory) {
        this.player.experience += this.combatResult.rewards?.exp || 2;
        this.player.coins += this.combatResult.rewards?.coins || 5;
      } else {
        this.player.experience = Math.max(0, this.player.experience - 1);
      }
      
      // Save updated player data to registry
      this.registry.set('player', this.player);
    }
    
    console.log('HomeBaseScene: player loaded', this.player);
  }

  preload() {
    // Create loading text
    const loadingText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      'Loading...',
      { fontSize: '32px', fill: '#fff' }
    ).setOrigin(0.5);
    
    // Show loading progress
    this.load.on('progress', (value) => {
      loadingText.setText(`Loading: ${Math.floor(value * 100)}%`);
    });
    
    this.load.on('complete', () => {
      loadingText.destroy();
      this.assetsLoaded = true;
    });

    // Load JSON data
    this.load.json('missions', 'assets/data/missions.json');
    this.load.json('enemies', 'assets/data/enemies.json');
    
    // Load essential assets first - use your actual asset paths
    this.load.image('safehouse_bg', 'assets/images/safehouse_bg.png');
    this.load.image('player-avatar', 'assets/characters/player.png');
    
    // Only try to load audio if not already in cache
    if (!this.cache.audio.exists('zombie_ambient')) {
      this.load.audio('zombie_ambient', 'assets/sounds/horror-ambient-loop.mp3');
    }
    
    // Load UI elements - use placeholder images if you don't have these yet
    this.load.image('glow_particle', 'assets/effects/glow.png');
    this.load.image('blood_splatter', 'assets/effects/blood.png');
    this.load.image('parchment', 'assets/ui/parchment.png');
    this.load.image('backpack_icon', 'assets/ui/backpack.png');
    this.load.image('crafting_icon', 'assets/ui/crafting.png');
    this.load.image('allies_icon', 'assets/ui/allies.png');
    this.load.image('map_icon', 'assets/ui/map.png');
    this.load.image('bite_scar', 'assets/effects/bite_scar.png');
    this.load.image('combat_button', 'assets/ui/button.png');
  }

  create() {
    console.log('HomeBaseScene: create started');
    
    // Get JSON data
    const missionsData = this.cache.json.get('missions');
    const enemiesData = this.cache.json.get('enemies');
    const { width, height } = this.cameras.main;
    
    // Create a simple background if assets aren't loaded yet
    if (!this.assetsLoaded) {
      this.add.rectangle(0, 0, width, height, 0x000000).setOrigin(0);
      this.add.text(width/2, height/2, 'Error loading assets.\nPlease check console.', 
        { fontSize: '24px', fill: '#ff0000', align: 'center' }).setOrigin(0.5);
      return;
    }
    
    // Create background - use a simple image if tileSprite causes issues
    this.background = this.add.image(0, 0, 'safehouse_bg')
      .setOrigin(0, 0)
      .setDisplaySize(width, height);
    
    // Try-catch for audio to prevent crashes
    try {
      if (this.sound.get('zombie_ambient')) {
        this.zombieAmbient = this.sound.get('zombie_ambient');
      } else {
        this.zombieAmbient = this.sound.add('zombie_ambient', {
          volume: 0.3,
          loop: true
        });
      }
      // Only play if not already playing
      if (!this.zombieAmbient.isPlaying) {
        this.zombieAmbient.play();
      }
    } catch (error) {
      console.error('Error with audio:', error);
    }
    
    // Create UI components - simplified for initial implementation
    this.createTopBar();
    this.createResourcesPanel();
    this.createSimpleMissionBoard(); // Simplified version
    
    // Add fullscreen button
    this.createFullscreenButton();
    
    // Add bottom navigation
    this.createBottomNav();
  }

  createBottomNav() {
    const { width, height } = this.cameras.main;
    
    // Create bottom nav bar background
    this.add.rectangle(0, height - 60, width, 60, 0x000000, 0.8)
        .setOrigin(0, 0);
    
    // Calculate positions for 4 evenly spaced icons
    const spacing = width / 4;
    
    // Profile Icon/Button
    const profileBtn = this.add.rectangle(spacing * 0.5, height - 30, 50, 50, 0x990000)
        .setInteractive();
    this.add.text(spacing * 0.5, height - 30, 'Profile', {
        fontSize: '14px',
        fill: '#ffffff'
    }).setOrigin(0.5);
    
    // Map Icon/Button
    const mapBtn = this.add.rectangle(spacing * 1.5, height - 30, 50, 50, 0x990000)
        .setInteractive();
    this.add.text(spacing * 1.5, height - 30, 'Map', {
        fontSize: '14px',
        fill: '#ffffff'
    }).setOrigin(0.5);
    
    // Backpack Icon/Button
    const backpackBtn = this.add.rectangle(spacing * 2.5, height - 30, 50, 50, 0x990000)
        .setInteractive();
    this.add.text(spacing * 2.5, height - 30, 'Items', {
        fontSize: '14px',
        fill: '#ffffff'
    }).setOrigin(0.5);
    
    // Crafting Icon/Button
    const craftBtn = this.add.rectangle(spacing * 3.5, height - 30, 50, 50, 0x990000)
        .setInteractive();
    this.add.text(spacing * 3.5, height - 30, 'Craft', {
        fontSize: '14px',
        fill: '#ffffff'
    }).setOrigin(0.5);

    // Move START COMBAT up closer to mission board
    const combatBtn = this.add.rectangle(width/2, height - 200, 300, 80, 0xcc0000)
        .setInteractive();
    this.add.text(width/2, height - 200, 'START COMBAT', {
        fontSize: '28px',
        fill: '#ffffff'
    }).setOrigin(0.5);

    // Add button interactions
    profileBtn.on('pointerdown', () => {
        this.scene.start('ProfileScene');
    });

    mapBtn.on('pointerdown', () => {
        // Will implement map scene later
        console.log('Map button clicked');
    });

    backpackBtn.on('pointerdown', () => {
        // Will implement inventory scene later
        console.log('Inventory button clicked');
    });

    craftBtn.on('pointerdown', () => {
        // Will implement crafting scene later
        console.log('Craft button clicked');
    });

    // Add hover effects for all buttons
    [profileBtn, mapBtn, backpackBtn, craftBtn, combatBtn].forEach(btn => {
        btn.on('pointerover', () => {
            btn.setFillStyle(0xcc0000);
        });

        btn.on('pointerout', () => {
            btn.setFillStyle(btn === combatBtn ? 0xcc0000 : 0x990000);
        });
    });

    // Combat button interaction
    combatBtn.on('pointerdown', () => {
        const missionsData = this.cache.json.get('missions');
        const currentMission = missionsData.mainMissions[0]; // For now, using first mission
        
        // Initialize mission progress if not exists
        const missionProgress = {
            missionId: currentMission.id,
            currentBattleIndex: 0,
            totalBattles: currentMission.battles.length
        };
        
        this.registry.set('missionProgress', missionProgress);
        this.registry.set('player', this.player);
        
        const currentBattle = currentMission.battles[0];
        
        // Start combat scene with battle and sequence data
        this.scene.start('CombatScene', { 
            missionData: {
                level: currentBattle.level,
                battleId: currentBattle.id,
                description: currentBattle.description,
                sequence: `Battle 1 of ${currentMission.battles.length}`
            }
        });
    });
  }
  
  update() {
    // Simple update for now
  }

  createTopBar() {
    const { width } = this.cameras.main;
    
    // Create simple panel background
    this.add.rectangle(width/2, 50, width - 20, 80, 0x000000, 0.6);
    
    // Player avatar - simplified
    const avatar = this.add.image(50, 50, 'player-avatar')
      .setDisplaySize(70, 70);
    
    // Player name
    this.add.text(90, 30, this.player.name, {
      fontSize: '28px',
      fill: '#ff9900',
      stroke: '#000000',
      strokeThickness: 4
    });
    
    // HP Bar - simplified
    const hpBarBg = this.add.rectangle(width - 150, 40, 200, 25, 0x222222);
    const hpBarFill = this.add.rectangle(width - 250, 40, 200 * (this.player.hp / this.player.maxHp), 25, 0xcc0000)
      .setOrigin(0, 0.5);
    
    // HP Text
    this.add.text(width - 150, 40, `HP: ${this.player.hp}/${this.player.maxHp}`, {
      fontSize: '16px',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5, 0.5);
    
    // Level text
    this.add.text(90, 60, `Level ${this.player.level}`, {
      fontSize: '18px',
      fill: '#aaaaaa'
    });

    // Profile Button
    const profileBtn = this.add.rectangle(width - 120, 80, 120, 40, 0x990000)
      .setStrokeStyle(2, 0x000000)
      .setInteractive();

    this.add.text(width - 100, 80, 'PROFILE', {
      fontSize: '18px',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    // Hover effect
    profileBtn.on('pointerover', () => {
      profileBtn.setFillStyle(0xcc0000);
    });

    profileBtn.on('pointerout', () => {
      profileBtn.setFillStyle(0x990000);
    });

    profileBtn.on('pointerdown', () => {
      this.scene.start('ProfileScene');
    });
  }

  createResourcesPanel() {
    const { width } = this.cameras.main;
    
    // Simple resources panel
    const panel = this.add.rectangle(80, 180, 150, 150, 0x000000, 0.6);
    
    // Resource texts
    this.add.text(20, 130, `Coins: ${this.player.coins || 0}`, {
      fontSize: '20px',
      fill: '#ffff00'
    });

    this.add.text(20, 160, `Food: ${this.player.food || 0}`, {
      fontSize: '20px',
      fill: '#ffffff'
    });

    this.add.text(20, 190, `EXP: ${this.player.experience}/${this.player.nextLevelExp}`, {
      fontSize: '20px',
      fill: '#3498db'
    });
  }

  createSimpleMissionBoard() {
    const { width, height } = this.cameras.main;
    const missionsData = this.cache.json.get('missions');
    
    // Get first available main mission (for now)
    const currentMission = missionsData.mainMissions[0];
    
    // Mission board background
    this.add.rectangle(width/2, height/2 - 50, 400, 250, 0x333333, 0.8);
    
    let missionTitle = "CURRENT MISSION";
    let rewardText = `REWARD: ${currentMission.rewards.item}`;
    
    // Update title and rewards if mission was just completed
    if (this.combatResult && this.combatResult.missionComplete) {
      missionTitle = "MISSION COMPLETE";
      const rewards = this.combatResult.rewards;
      rewardText = `REWARDS EARNED:\n${rewards.exp} EXP\n${rewards.coins} Coins`;
      if (rewards.item) {
        rewardText += `\n${rewards.item}`;
      }
    }
    
    // Mission title
    this.add.text(width/2, height/2 - 130, missionTitle, {
      fontSize: '24px',
      fill: '#ffffff'
    }).setOrigin(0.5);
    
    // Mission name
    this.add.text(width/2, height/2 - 90, currentMission.title, {
      fontSize: '28px',
      fill: this.combatResult?.missionComplete ? '#2ecc71' : '#ff0000'
    }).setOrigin(0.5);
    
    // Mission description
    this.add.text(width/2, height/2 - 40, currentMission.description, {
      fontSize: '18px',
      fill: '#ffffff',
      align: 'center',
      wordWrap: { width: 350 }  // Wrap text within mission board
    }).setOrigin(0.5);
    
    // Reward text
    this.add.text(width/2, height/2 + 30, rewardText, {
      fontSize: '20px',
      fill: '#ffff00',
      align: 'center'
    }).setOrigin(0.5);
  }

  createFullscreenButton() {
    const { width } = this.cameras.main;
    
    // Create fullscreen button
    const fullscreenBtn = this.add.rectangle(width - 40, 40, 60, 60, 0x000000, 0.6)
      .setInteractive();
    
    // Fullscreen text
    this.add.text(width - 40, 40, '⛶', {
      fontSize: '24px',
      fill: '#ffffff'
    }).setOrigin(0.5);
    
    // Button interaction
    fullscreenBtn.on('pointerdown', () => {
      this.toggleFullscreen();
    });
  }

  toggleFullscreen() {
    if (!this.scale.isFullscreen) {
      this.scale.startFullscreen();
    } else {
      this.scale.stopFullscreen();
    }
  }
}
