import Phaser from 'phaser';

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    console.log('PreloadScene: preload started');
    
    // Create loading bar
    this.createLoadingBar();
    
    // Load all game assets
    this.loadGameAssets();

    // Log initial load events
    this.load.on('start', () => {
      console.log('PreloadScene: Asset loading started');
    });
  }

  createLoadingBar() {
    console.log('PreloadScene: creating loading bar');
    // Create loading bar UI
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width/2 - 160, height/2 - 25, 320, 50);
    
    // Create a simple background
    this.add.rectangle(0, 0, width, height, 0x000000)
      .setOrigin(0, 0);
    
    const loadingText = this.add.text(width/2, height/2 - 50, 'Loading...', {
      font: '20px monospace',
      fill: '#ffffff'
    });
    loadingText.setOrigin(0.5, 0.5);
    
    // Register loading events
    this.load.on('progress', (value) => {
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(width/2 - 150, height/2 - 15, 300 * value, 30);
    });
    
    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });
  }

  loadGameAssets() {
    try {
      // Add loading error handler
      this.load.on('loaderror', (fileObj) => {
        console.error('Error loading asset:', fileObj.src);
      });

      // Load images
      this.load.image('player-avatar', 'assets/images/face1.jpg');
      this.load.image('enemy-avatar', 'assets/images/face2.jpg');
      this.load.image('background', 'assets/images/splash_image.jpg');
      
      this.load.image('particle', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAD1JREFUeNpiYGBgmAnEDP///wdjJgYcgAmI5wMxCy6FLEDMhE8BExYFTMgK8CmAKWDAYwKG7YxIJgAEGAB3KQW08r5GgQAAAABJRU5ErkJggg==');

      // Load audio with HTML5 audio element
      this.load.audio('tick', ['assets/sounds/tick.mp3']);
      
      // Add specific error handler for audio
      this.sound.once('loaderror', (sound, err) => {
        console.error('Error loading sound:', sound, err);
      });

      // Load JSON data
      this.load.json('enemies', 'assets/data/enemies.json');

      // Add complete handler to log successful loading
      this.load.on('complete', () => {
        console.log('PreloadScene: All assets loaded successfully');
      });

      console.log('PreloadScene: Started loading assets');
    } catch (error) {
      console.error('Error in PreloadScene loadGameAssets:', error);
    }
  }

  create() {
    console.log('PreloadScene: create started');
    // Initialize any additional game data here if needed
    
    console.log('PreloadScene: transitioning to HomeBaseScene');
    // Go to home scene when loading is complete
    this.scene.start('HomeBaseScene');
  }
}
