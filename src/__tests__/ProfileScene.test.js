import ProfileScene from '../js/scenes/ProfileScene';

// Mock Phaser
const mockScene = {
  add: {
    text: jest.fn(() => ({
      setOrigin: jest.fn().mockReturnThis(),
      setInteractive: jest.fn().mockReturnThis(),
      on: jest.fn().mockReturnThis(),
    })),
    rectangle: jest.fn(() => ({
      setOrigin: jest.fn().mockReturnThis(),
      setInteractive: jest.fn().mockReturnThis(),
      setScale: jest.fn().mockReturnThis(),
      on: jest.fn().mockReturnThis(),
    })),
    image: jest.fn(() => ({
      setDisplaySize: jest.fn().mockReturnThis(),
      setOrigin: jest.fn().mockReturnThis(),
    })),
    circle: jest.fn(() => ({
      setInteractive: jest.fn().mockReturnThis(),
      setScale: jest.fn().mockReturnThis(),
      on: jest.fn().mockReturnThis(),
    })),
    container: jest.fn(),
  },
  cameras: {
    main: {
      width: 800,
      height: 600,
    },
  },
  scene: {
    start: jest.fn(),
  },
  registry: {
    get: jest.fn(),
    set: jest.fn(),
  },
  sound: {
    play: jest.fn(),
  },
  tweens: {
    add: jest.fn(),
  },
};

describe('ProfileScene', () => {
  let profileScene;
  let mockPlayerData;

  beforeEach(() => {
    // Create fresh instance and mock data for each test
    profileScene = new ProfileScene();
    Object.assign(profileScene, mockScene);

    mockPlayerData = {
      name: 'TestPlayer',
      level: 5,
      hp: 100,
      maxHp: 100,
      gold: 1000,
      exp: 450,
      expToLevel: 1000,
      availablePoints: 3,
      attributes: {
        strength: 5,
        dexterity: 4,
        intelligence: 3,
        vitality: 6
      },
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
    };
  });

  describe('init', () => {
    it('should initialize with provided player data', () => {
      profileScene.init({ playerData: mockPlayerData });
      expect(profileScene.playerData).toEqual(mockPlayerData);
      expect(profileScene.tempPlayerData).toEqual(mockPlayerData);
      expect(profileScene.tempPlayerData).not.toBe(mockPlayerData); // Should be a deep copy
    });

    it('should fall back to registry data if no player data provided', () => {
      profileScene.registry.get.mockReturnValue(mockPlayerData);
      profileScene.init({});
      expect(profileScene.playerData).toEqual(mockPlayerData);
    });
  });

  describe('attribute management', () => {
    beforeEach(() => {
      profileScene.init({ playerData: mockPlayerData });
    });

    it('should increment attribute when points are available', () => {
      // Simulate clicking the strength + button
      const event = { type: 'pointerdown' };
      profileScene.tempPlayerData.availablePoints = 1;
      const initialStrength = profileScene.tempPlayerData.attributes.strength;
      
      // Find and trigger the strength + button's pointerdown event
      const calls = profileScene.add.circle.mock.results;
      const strengthPlusBtn = calls[calls.length - 1].value;
      strengthPlusBtn.emit('pointerdown', event);

      expect(profileScene.tempPlayerData.attributes.strength).toBe(initialStrength + 1);
      expect(profileScene.tempPlayerData.availablePoints).toBe(0);
    });

    it('should not increment attribute when no points available', () => {
      profileScene.tempPlayerData.availablePoints = 0;
      const initialStrength = profileScene.tempPlayerData.attributes.strength;
      
      const calls = profileScene.add.circle.mock.results;
      const strengthPlusBtn = calls[calls.length - 1].value;
      strengthPlusBtn.emit('pointerdown');

      expect(profileScene.tempPlayerData.attributes.strength).toBe(initialStrength);
      expect(profileScene.tempPlayerData.availablePoints).toBe(0);
    });
  });

  describe('save functionality', () => {
    beforeEach(() => {
      profileScene.init({ playerData: mockPlayerData });
    });

    it('should save changes to registry and return to home', () => {
      // Modify some attributes
      profileScene.tempPlayerData.attributes.strength += 1;
      profileScene.tempPlayerData.availablePoints -= 1;

      // Trigger save (simulate clicking save button)
      const calls = profileScene.add.rectangle.mock.results;
      const saveBtn = calls[calls.length - 1].value;
      saveBtn.emit('pointerdown');

      // Check if registry was updated with new values
      expect(profileScene.registry.set).toHaveBeenCalledWith('playerData', expect.objectContaining({
        attributes: expect.objectContaining({
          strength: mockPlayerData.attributes.strength + 1
        })
      }));
    });
  });

  describe('navigation', () => {
    beforeEach(() => {
      profileScene.init({ playerData: mockPlayerData });
    });

    it('should return to home scene when back button clicked', () => {
      // Find and trigger the back button's pointerdown event
      const calls = profileScene.add.rectangle.mock.results;
      const backBtn = calls[calls.length - 2].value; // Back button is created before save button
      backBtn.emit('pointerdown');

      expect(profileScene.scene.start).toHaveBeenCalledWith('HomeBaseScene', {
        playerData: expect.any(Object)
      });
    });
  });
});
