import HomeBaseScene from '../js/scenes/HomeBaseScene';

// Mock Phaser
const mockScene = {
  add: {
    image: jest.fn(() => ({
      setOrigin: jest.fn().mockReturnThis(),
      setDisplaySize: jest.fn().mockReturnThis(),
    })),
    text: jest.fn(() => ({
      setOrigin: jest.fn().mockReturnThis(),
    })),
    rectangle: jest.fn(() => ({
      setInteractive: jest.fn().mockReturnThis(),
      setOrigin: jest.fn().mockReturnThis(),
      setScale: jest.fn().mockReturnThis(),
      on: jest.fn().mockReturnThis(),
    })),
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
  sound: {
    play: jest.fn(),
    get: jest.fn(),
  },
};

// Mock player data
const mockPlayerData = {
  name: 'TestPlayer',
  level: 5,
  hp: 100,
  maxHp: 100,
  gold: 1000,
  exp: 450,
  expToLevel: 1000,
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

describe('HomeBaseScene', () => {
  let homeBaseScene;

  beforeEach(() => {
    // Create fresh instance for each test
    homeBaseScene = new HomeBaseScene();
    Object.assign(homeBaseScene, mockScene);
    
    // Clear all mock calls
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should set the correct scene key', () => {
      expect(homeBaseScene.scene.key).toBe('HomeBaseScene');
    });
  });

  describe('init', () => {
    it('should initialize with provided player data', () => {
      homeBaseScene.init({ playerData: mockPlayerData });
      expect(homeBaseScene.playerData).toEqual(mockPlayerData);
    });

    it('should fall back to registry data if no player data provided', () => {
      homeBaseScene.registry.get.mockReturnValue(mockPlayerData);
      homeBaseScene.init({});
      expect(homeBaseScene.playerData).toEqual(mockPlayerData);
    });

    it('should store combat result if provided', () => {
      const mockCombatResult = { victory: true, rewards: { gold: 100, exp: 50 } };
      homeBaseScene.init({ playerData: mockPlayerData, combatResult: mockCombatResult });
      expect(homeBaseScene.combatResult).toEqual(mockCombatResult);
    });
  });

  describe('create', () => {
    beforeEach(() => {
      homeBaseScene.playerData = mockPlayerData;
      
      // Spy on the methods
      jest.spyOn(homeBaseScene, 'createPlayerInfo');
      jest.spyOn(homeBaseScene, 'createMenuOptions');
      jest.spyOn(homeBaseScene, 'showCombatResults');
    });

    it('should create background, player info, and menu options', () => {
      homeBaseScene.create();
      
      // Check if background was created
      expect(homeBaseScene.add.image).toHaveBeenCalledWith(
        0, 0, 'background'
      );
      
      // Check if player info and menu options were created
      expect(homeBaseScene.createPlayerInfo).toHaveBeenCalled();
      expect(homeBaseScene.createMenuOptions).toHaveBeenCalled();
    });

    it('should show combat results if they exist', () => {
      homeBaseScene.combatResult = { victory: true, rewards: { gold: 100, exp: 50 } };
      homeBaseScene.create();
      
      expect(homeBaseScene.showCombatResults).toHaveBeenCalled();
    });

    it('should not show combat results if they do not exist', () => {
      homeBaseScene.combatResult = null;
      homeBaseScene.create();
      
      expect(homeBaseScene.showCombatResults).not.toHaveBeenCalled();
    });
  });

  describe('createPlayerInfo', () => {
    beforeEach(() => {
      homeBaseScene.playerData = mockPlayerData;
    });

    it('should display player avatar and name', () => {
      homeBaseScene.createPlayerInfo();
      
      // Check if avatar was created
      expect(homeBaseScene.add.image).toHaveBeenCalledWith(
        100, 100, 'player-avatar'
      );
      
      // Check if player name was displayed
      expect(homeBaseScene.add.text).toHaveBeenCalledWith(
        160, 80, mockPlayerData.name,
        expect.any(Object)
      );
    });

    it('should display player stats', () => {
      homeBaseScene.createPlayerInfo();
      
      // Check if HP was displayed
      expect(homeBaseScene.add.text).toHaveBeenCalledWith(
        expect.any(Number), 80, `HP: ${mockPlayerData.hp}/${mockPlayerData.maxHp}`,
        expect.any(Object)
      );
      
      // Check if Gold was displayed
      expect(homeBaseScene.add.text).toHaveBeenCalledWith(
        expect.any(Number), 110, `Gold: ${mockPlayerData.gold}`,
        expect.any(Object)
      );
      
      // Check if EXP was displayed
      expect(homeBaseScene.add.text).toHaveBeenCalledWith(
        expect.any(Number), 140, `EXP: ${mockPlayerData.exp}/${mockPlayerData.expToLevel}`,
        expect.any(Object)
      );
    });
  });

  describe('createMenuOptions', () => {
    beforeEach(() => {
      homeBaseScene.playerData = mockPlayerData;
    });

    it('should create combat and profile buttons', () => {
      homeBaseScene.createMenuOptions();
      
      // Check if combat button was created
      expect(homeBaseScene.add.rectangle).toHaveBeenCalledWith(
        expect.any(Number), 220, 300, 60, expect.any(Number)
      );
      
      // Check if profile button was created
      expect(homeBaseScene.add.rectangle).toHaveBeenCalledWith(
        expect.any(Number), 300, 300, 60, expect.any(Number)
      );
    });

    it('should set up button click handlers', () => {
      homeBaseScene.createMenuOptions();
      
      const buttons = homeBaseScene.add.rectangle.mock.results;
      const combatButton = buttons[0].value;
      const profileButton = buttons[1].value;
      
      // Trigger combat button click
      combatButton.emit('pointerdown');
      expect(homeBaseScene.scene.start).toHaveBeenCalledWith(
        'CombatScene',
        expect.objectContaining({
          playerData: mockPlayerData,
          missionData: expect.any(Object)
        })
      );
      
      // Trigger profile button click
      profileButton.emit('pointerdown');
      expect(homeBaseScene.scene.start).toHaveBeenCalledWith(
        'ProfileScene',
        expect.objectContaining({
          playerData: mockPlayerData
        })
      );
    });
  });

  describe('showCombatResults', () => {
    beforeEach(() => {
      homeBaseScene.playerData = mockPlayerData;
    });

    it('should display victory message and rewards', () => {
      homeBaseScene.combatResult = { 
        victory: true, 
        rewards: { gold: 100, exp: 50 } 
      };
      
      homeBaseScene.showCombatResults();
      
      // Check if victory text was displayed
      expect(homeBaseScene.add.text).toHaveBeenCalledWith(
        expect.any(Number), expect.any(Number), 'Victory!',
        expect.any(Object)
      );
      
      // Check if rewards were displayed
      expect(homeBaseScene.add.text).toHaveBeenCalledWith(
        expect.any(Number), expect.any(Number), 'Rewards:',
        expect.any(Object)
      );
      
      expect(homeBaseScene.add.text).toHaveBeenCalledWith(
        expect.any(Number), expect.any(Number), `Gold: 100\nEXP: 50`,
        expect.any(Object)
      );
    });

    it('should display defeat message', () => {
      homeBaseScene.combatResult = { 
        victory: false
      };
      
      homeBaseScene.showCombatResults();
      
      // Check if defeat text was displayed
      expect(homeBaseScene.add.text).toHaveBeenCalledWith(
        expect.any(Number), expect.any(Number), 'Defeat!',
        expect.any(Object)
      );
    });

    it('should clear combat result after showing', () => {
      homeBaseScene.combatResult = { 
        victory: true, 
        rewards: { gold: 100, exp: 50 } 
      };
      
      homeBaseScene.showCombatResults();
      
      expect(homeBaseScene.combatResult).toBeNull();
    });
  });
});
