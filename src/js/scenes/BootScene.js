import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
    console.log('BootScene: Constructor called');
  }

  init() {
    console.log('BootScene: init called');
  }

  preload() {
    console.log('BootScene: preload started');
    
    try {
      // Load minimal assets needed for loading screen
      this.load.image('loading-background', 'assets/images/splash_image.jpg');
      
      // Add error handler for loading failures
      this.load.on('loaderror', (fileObj) => {
        console.error('Error loading asset:', fileObj.src);
      });

      // Add complete handler
      this.load.on('complete', () => {
        console.log('BootScene: Initial asset loaded successfully');
      });
    } catch (error) {
      console.error('Error in BootScene preload:', error);
    }
  }

  create() {
    console.log('BootScene: create started');
    
    try {
      // Initialize any game-wide systems
      this.initializeGameSystems();
      
      console.log('BootScene: Game systems initialized');
      console.log('BootScene: Transitioning to PreloadScene');
      
      // Go to preload scene
      this.scene.start('PreloadScene');
    } catch (error) {
      console.error('Error in BootScene create:', error);
    }
  }

  initializeGameSystems() {
    // Initialize empty player data in registry if not exists
    if (!this.registry.get('playerData')) {
      this.registry.set('playerData', {
        name: 'Player',
        level: 1,
        hp: 100,
        maxHp: 100,
        gold: 0,
        exp: 0,
        expToLevel: 100,
        attributes: {
          strength: 5,
          dexterity: 3,
          intelligence: 4,
          vitality: 6
        },
        availablePoints: 3,
        skills: [
          { id: 'melee_strike', name: 'Melee Strike', type: 'Attack', color: 'red', level: 'Basic' }
        ],
        equippedSkills: {
          red: 'melee_strike',
          blue: null,
          green: null,
          yellow: null,
          purple: null
        }
      });
    }

    // Set up any additional game-wide configurations
    this.registry.set('gameConfig', {
      version: '1.0.0',
      debugMode: false,
      soundEnabled: true
    });
  }
}
