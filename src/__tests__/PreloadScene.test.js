import PreloadScene from '../js/scenes/PreloadScene';

// Mock Phaser
const mockScene = {
  add: {
    graphics: jest.fn(() => ({
      fillStyle: jest.fn().mockReturnThis(),
      fillRect: jest.fn().mockReturnThis(),
      clear: jest.fn().mockReturnThis(),
      destroy: jest.fn().mockReturnThis(),
    })),
    image: jest.fn(() => ({
      setOrigin: jest.fn().mockReturnThis(),
      setDisplaySize: jest.fn().mockReturnThis(),
    })),
    text: jest.fn(() => ({
      setOrigin: jest.fn().mockReturnThis(),
      destroy: jest.fn().mockReturnThis(),
    })),
    container: jest.fn(),
  },
  load: {
    image: jest.fn(),
    audio: jest.fn(),
    json: jest.fn(),
    on: jest.fn((event, callback) => {
      if (event === 'progress') {
        // Simulate progress event
        callback(0.5);
      } else if (event === 'complete') {
        // Simulate complete event
        callback();
      }
      return mockScene.load;
    }),
    once: jest.fn(),
    start: jest.fn(),
  },
  scene: {
    start: jest.fn(),
  },
  cameras: {
    main: {
      width: 800,
      height: 600,
    },
  },
  sound: {
    once: jest.fn(),
  },
};

describe('PreloadScene', () => {
  let preloadScene;

  beforeEach(() => {
    // Create fresh instance for each test
    preloadScene = new PreloadScene();
    Object.assign(preloadScene, mockScene);
    
    // Clear all mock calls
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should set the correct scene key', () => {
      expect(preloadScene.scene.key).toBe('PreloadScene');
    });
  });

  describe('preload', () => {
    it('should create loading bar and load assets', () => {
      // Spy on the methods
      const createLoadingBarSpy = jest.spyOn(preloadScene, 'createLoadingBar');
      const loadGameAssetsSpy = jest.spyOn(preloadScene, 'loadGameAssets');
      
      preloadScene.preload();
      
      expect(createLoadingBarSpy).toHaveBeenCalled();
      expect(loadGameAssetsSpy).toHaveBeenCalled();
    });
  });

  describe('createLoadingBar', () => {
    it('should create loading UI elements', () => {
      preloadScene.createLoadingBar();
      
      // Check if graphics were created
      expect(preloadScene.add.graphics).toHaveBeenCalledTimes(2);
      
      // Check if loading text was created
      expect(preloadScene.add.text).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        'Loading...',
        expect.any(Object)
      );
      
      // Check if background image was added
      expect(preloadScene.add.image).toHaveBeenCalledWith(
        0, 0, 'loading-background'
      );
    });

    it('should set up progress event handler', () => {
      preloadScene.createLoadingBar();
      
      // Check if progress event handler was registered
      expect(preloadScene.load.on).toHaveBeenCalledWith(
        'progress',
        expect.any(Function)
      );
    });

    it('should set up complete event handler', () => {
      preloadScene.createLoadingBar();
      
      // Check if complete event handler was registered
      expect(preloadScene.load.on).toHaveBeenCalledWith(
        'complete',
        expect.any(Function)
      );
    });
  });

  describe('loadGameAssets', () => {
    it('should load all required game assets', () => {
      preloadScene.loadGameAssets();
      
      // Check if images are loaded
      expect(preloadScene.load.image).toHaveBeenCalledWith(
        'player-avatar',
        expect.stringContaining('images/face1.jpg')
      );
      expect(preloadScene.load.image).toHaveBeenCalledWith(
        'background',
        expect.stringContaining('images/splash_image.jpg')
      );
      
      // Check if audio is loaded
      expect(preloadScene.load.audio).toHaveBeenCalledWith(
        'tick',
        expect.any(Array)
      );
      
      // Check if JSON data is loaded
      expect(preloadScene.load.json).toHaveBeenCalledWith(
        'enemies',
        expect.stringContaining('data/enemies.json')
      );
    });

    it('should set up error handlers', () => {
      preloadScene.loadGameAssets();
      
      // Check if error handlers were registered
      expect(preloadScene.load.on).toHaveBeenCalledWith(
        'loaderror',
        expect.any(Function)
      );
      expect(preloadScene.sound.once).toHaveBeenCalledWith(
        'loaderror',
        expect.any(Function)
      );
    });
  });

  describe('create', () => {
    it('should transition to HomeBaseScene', () => {
      preloadScene.create();
      
      // Check if scene transition was triggered
      expect(preloadScene.scene.start).toHaveBeenCalledWith('HomeBaseScene');
    });
  });
});
