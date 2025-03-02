import BootScene from '../js/scenes/BootScene';

// Mock Phaser
const mockScene = {
  add: {
    image: jest.fn(() => ({
      setOrigin: jest.fn().mockReturnThis(),
      setDisplaySize: jest.fn().mockReturnThis(),
    })),
  },
  load: {
    image: jest.fn(),
    on: jest.fn(),
  },
  scene: {
    start: jest.fn(),
  },
  registry: {
    get: jest.fn(),
    set: jest.fn(),
  },
  cameras: {
    main: {
      width: 800,
      height: 600,
    },
  },
};

describe('BootScene', () => {
  let bootScene;

  beforeEach(() => {
    // Create fresh instance for each test
    bootScene = new BootScene();
    Object.assign(bootScene, mockScene);
    
    // Clear all mock calls
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should set the correct scene key', () => {
      expect(bootScene.scene.key).toBe('BootScene');
    });
  });

  describe('preload', () => {
    it('should load the loading background image', () => {
      bootScene.preload();
      expect(bootScene.load.image).toHaveBeenCalledWith(
        'loading-background',
        'assets/images/splash_image.jpg'
      );
    });
  });

  describe('create', () => {
    it('should initialize game systems', () => {
      // Spy on the initializeGameSystems method
      const spy = jest.spyOn(bootScene, 'initializeGameSystems');
      
      bootScene.create();
      
      expect(spy).toHaveBeenCalled();
    });

    it('should transition to PreloadScene', () => {
      bootScene.create();
      expect(bootScene.scene.start).toHaveBeenCalledWith('PreloadScene');
    });
  });

  describe('initializeGameSystems', () => {
    it('should initialize player data if not exists', () => {
      // Mock registry.get to return null (player data doesn't exist)
      bootScene.registry.get.mockReturnValue(null);
      
      bootScene.initializeGameSystems();
      
      // Check if registry.set was called with player data
      expect(bootScene.registry.set).toHaveBeenCalledWith(
        'playerData',
        expect.objectContaining({
          name: 'Player',
          level: 1,
          hp: 100,
          maxHp: 100,
          attributes: expect.any(Object),
          skills: expect.any(Array),
        })
      );
    });

    it('should not initialize player data if it already exists', () => {
      // Mock registry.get to return existing player data
      bootScene.registry.get.mockReturnValue({
        name: 'Existing Player',
        level: 5,
      });
      
      bootScene.initializeGameSystems();
      
      // Check if registry.set was not called with 'playerData'
      expect(bootScene.registry.set).not.toHaveBeenCalledWith(
        'playerData',
        expect.anything()
      );
    });

    it('should set up game configuration', () => {
      bootScene.initializeGameSystems();
      
      // Check if registry.set was called with gameConfig
      expect(bootScene.registry.set).toHaveBeenCalledWith(
        'gameConfig',
        expect.objectContaining({
          version: expect.any(String),
          debugMode: expect.any(Boolean),
          soundEnabled: expect.any(Boolean),
        })
      );
    });
  });
});
