import Phaser from 'phaser';
import CombatScene from '../js/scenes/CombatScene';
import { Player } from '../js/Player';
import { Enemy } from '../js/combat/Enemy';
import { Grid } from '../js/combat/Grid';
import { UIManager } from '../js/combat/UIManager';
import { CONFIG } from '../js/combat/config';

// Mock Phaser
jest.mock('phaser', () => {
  return {
    Scene: class {
      constructor() {
        this.sys = {
          settings: { key: 'CombatScene' }
        };
        this.registry = {
          get: jest.fn(),
          set: jest.fn()
        };
        this.scene = {
          start: jest.fn(),
          pause: jest.fn(),
          resume: jest.fn()
        };
        this.cameras = {
          main: {
            width: 800,
            height: 600
          }
        };
        this.children = {
          getByName: jest.fn()
        };
      }
      add = {
        rectangle: jest.fn().mockReturnValue({
          setOrigin: jest.fn().mockReturnThis(),
          setName: jest.fn().mockReturnThis(),
          setStrokeStyle: jest.fn().mockReturnThis(),
          setInteractive: jest.fn().mockReturnThis(),
          on: jest.fn().mockReturnThis(),
          setScale: jest.fn().mockReturnThis()
        }),
        circle: jest.fn().mockReturnValue({
          setStrokeStyle: jest.fn().mockReturnThis()
        }),
        image: jest.fn().mockReturnValue({
          setDisplaySize: jest.fn().mockReturnThis()
        }),
        text: jest.fn().mockReturnValue({
          setOrigin: jest.fn().mockReturnThis(),
          setName: jest.fn().mockReturnThis(),
          setText: jest.fn().mockReturnThis()
        })
      };
    }
  };
});

// Mock Grid
jest.mock('../js/combat/Grid', () => {
  return {
    Grid: jest.fn().mockImplementation(() => {
      return {
        onMatch: jest.fn(),
        enable: jest.fn(),
        disable: jest.fn()
      };
    })
  };
});

// Mock UIManager
jest.mock('../js/combat/UIManager', () => {
  return {
    UIManager: jest.fn().mockImplementation(() => {
      return {
        addSkillButton: jest.fn(),
        updatePlayerStats: jest.fn(),
        updateEnemyStats: jest.fn(),
        updateTurnIndicator: jest.fn(),
        updateTimer: jest.fn(),
        showNotification: jest.fn(),
        updateSkillPower: jest.fn(),
        showDamageNumber: jest.fn(),
        showVictoryScreen: jest.fn(),
        showDefeatScreen: jest.fn()
      };
    })
  };
});

// Mock Player
jest.mock('../js/Player', () => {
  return {
    Player: jest.fn().mockImplementation(() => {
      return {
        maxHp: 100,
        hp: 100,
        baseAttack: 10,
        baseDefense: 5,
        level: 1,
        skills: {},
        getAttack: jest.fn().mockReturnValue(10),
        getDefense: jest.fn().mockReturnValue(5),
        takeDamage: jest.fn(),
        gainExperience: jest.fn(),
        loseExperience: jest.fn()
      };
    }),
    save: jest.fn()
  };
});

// Mock Enemy
jest.mock('../js/combat/Enemy', () => {
  return {
    Enemy: jest.fn().mockImplementation(() => {
      return {
        name: 'Toxic Zombie',
        maxHp: 50,
        hp: 50,
        baseAttack: 8,
        baseDefense: 3,
        level: 1,
        getAttack: jest.fn().mockReturnValue(8),
        getDefense: jest.fn().mockReturnValue(3),
        takeDamage: jest.fn()
      };
    })
  };
});

// Mock document methods
document.createElement = jest.fn().mockImplementation(() => {
  return {
    id: '',
    style: {},
    classList: {
      add: jest.fn(),
      remove: jest.fn()
    },
    appendChild: jest.fn()
  };
});
document.body.appendChild = jest.fn();
document.getElementById = jest.fn().mockReturnValue({
  remove: jest.fn()
});
document.querySelectorAll = jest.fn().mockReturnValue([]);

// Mock setTimeout
global.setTimeout = jest.fn((callback) => callback());
global.clearInterval = jest.fn();
global.setInterval = jest.fn().mockReturnValue(123);

describe('CombatScene', () => {
  let combatScene;
  
  beforeEach(() => {
    jest.clearAllMocks();
    combatScene = new CombatScene();
  });
  
  test('should initialize correctly', () => {
    expect(combatScene).toBeDefined();
    expect(combatScene.player).toBeNull();
    expect(combatScene.enemy).toBeNull();
    expect(combatScene.grid).toBeNull();
    expect(combatScene.uiManager).toBeNull();
    expect(combatScene.isPlayerTurn).toBe(true);
    expect(combatScene.turnTimer).toBeNull();
    expect(combatScene.turnDuration).toBe(CONFIG.COMBAT.TURN_TIME || 15);
    expect(combatScene.combatActive).toBe(false);
  });
  
  test('init should create player and enemy', () => {
    const data = {
      playerData: {
        maxHp: 120,
        hp: 100,
        attributes: {
          strength: 12,
          vitality: 8
        },
        level: 2
      },
      missionData: {
        level: 2
      }
    };
    
    combatScene.init(data);
    
    expect(Player).toHaveBeenCalled();
    expect(Enemy).toHaveBeenCalled();
    expect(combatScene.player).toBeDefined();
    expect(combatScene.enemy).toBeDefined();
  });
  
  test('create should set up the scene', () => {
    // Setup
    combatScene.player = new Player();
    combatScene.enemy = new Enemy();
    
    // Execute
    combatScene.create();
    
    // Verify
    expect(combatScene.add.rectangle).toHaveBeenCalled();
    expect(Grid).toHaveBeenCalled();
    expect(UIManager).toHaveBeenCalled();
    expect(combatScene.grid).toBeDefined();
    expect(combatScene.uiManager).toBeDefined();
    expect(combatScene.grid.onMatch).toHaveBeenCalled();
    expect(combatScene.uiManager.updatePlayerStats).toHaveBeenCalled();
    expect(combatScene.uiManager.updateEnemyStats).toHaveBeenCalled();
  });
  
  test('startCombat should initialize combat', () => {
    // Setup
    combatScene.player = new Player();
    combatScene.enemy = new Enemy();
    combatScene.grid = new Grid();
    combatScene.uiManager = new UIManager();
    combatScene.startPlayerTurn = jest.fn();
    
    // Execute
    combatScene.startCombat();
    
    // Verify
    expect(combatScene.combatActive).toBe(true);
    expect(combatScene.uiManager.showNotification).toHaveBeenCalledWith('Battle Start!', 'info');
    expect(combatScene.uiManager.updatePlayerStats).toHaveBeenCalledWith(combatScene.player);
    expect(combatScene.uiManager.updateEnemyStats).toHaveBeenCalledWith(combatScene.enemy);
    expect(combatScene.startPlayerTurn).toHaveBeenCalled();
  });
  
  test('startPlayerTurn should set up player turn', () => {
    // Setup
    combatScene.combatActive = true;
    combatScene.grid = new Grid();
    combatScene.uiManager = new UIManager();
    combatScene.startTimer = jest.fn();
    
    // Execute
    combatScene.startPlayerTurn();
    
    // Verify
    expect(combatScene.isPlayerTurn).toBe(true);
    expect(combatScene.uiManager.updateTurnIndicator).toHaveBeenCalledWith('Your Turn');
    expect(combatScene.grid.enable).toHaveBeenCalled();
    expect(combatScene.startTimer).toHaveBeenCalledWith(combatScene.turnDuration);
  });
  
  test('handleMatch should accumulate power correctly', () => {
    // Setup
    combatScene.combatActive = true;
    combatScene.player = new Player();
    combatScene.player.skills = { red: 0 };
    combatScene.uiManager = new UIManager();
    
    // Execute - Match 3
    combatScene.handleMatch('red', 3);
    
    // Verify
    expect(combatScene.player.skills.red).toBe(1);
    expect(combatScene.uiManager.updateSkillPower).toHaveBeenCalledWith(CONFIG.SKILLS.red.id, 1);
    
    // Execute - Match 4
    combatScene.handleMatch('red', 4);
    
    // Verify
    expect(combatScene.player.skills.red).toBe(6); // 1 + 5
    expect(combatScene.uiManager.updateSkillPower).toHaveBeenCalledWith(CONFIG.SKILLS.red.id, 6);
    
    // Execute - Match 5
    combatScene.handleMatch('red', 5);
    
    // Verify
    expect(combatScene.player.skills.red).toBe(21); // 6 + 15
    expect(combatScene.uiManager.updateSkillPower).toHaveBeenCalledWith(CONFIG.SKILLS.red.id, 21);
  });
  
  test('playerUseSkill should execute skill effect', async () => {
    // Setup
    combatScene.combatActive = true;
    combatScene.player = new Player();
    combatScene.player.skills = { red: 20 }; // Enough power for Fire Strike
    combatScene.enemy = new Enemy();
    combatScene.grid = new Grid();
    combatScene.uiManager = new UIManager();
    combatScene.endPlayerTurn = jest.fn();
    
    // Execute
    await combatScene.playerUseSkill('red');
    
    // Verify
    expect(combatScene.player.skills.red).toBe(0); // Power consumed
    expect(combatScene.grid.disable).toHaveBeenCalled();
    expect(combatScene.enemy.takeDamage).toHaveBeenCalledWith(CONFIG.SKILLS.red.baseDamage);
    expect(combatScene.uiManager.showDamageNumber).toHaveBeenCalled();
    expect(combatScene.uiManager.updatePlayerStats).toHaveBeenCalled();
    expect(combatScene.uiManager.updateEnemyStats).toHaveBeenCalled();
    expect(combatScene.endPlayerTurn).toHaveBeenCalled();
  });
  
  test('endPlayerTurn should transition to enemy turn', () => {
    // Setup
    combatScene.combatActive = true;
    combatScene.grid = new Grid();
    combatScene.uiManager = new UIManager();
    combatScene.enemyTurn = jest.fn();
    
    // Execute
    combatScene.endPlayerTurn();
    
    // Verify
    expect(combatScene.grid.disable).toHaveBeenCalled();
    expect(combatScene.isPlayerTurn).toBe(false);
    expect(combatScene.uiManager.updateTurnIndicator).toHaveBeenCalledWith("Enemy's Turn");
    expect(combatScene.enemyTurn).toHaveBeenCalled();
  });
  
  test('enemyTurn should deal damage to player', () => {
    // Setup
    combatScene.combatActive = true;
    combatScene.player = new Player();
    combatScene.enemy = new Enemy();
    combatScene.grid = new Grid();
    combatScene.uiManager = new UIManager();
    combatScene.startPlayerTurn = jest.fn();
    combatScene.updateBuffDurations = jest.fn();
    
    // Execute
    combatScene.enemyTurn();
    
    // Verify
    expect(combatScene.updateBuffDurations).toHaveBeenCalled();
    expect(combatScene.grid.disable).toHaveBeenCalled();
    expect(combatScene.player.hp).toBeLessThan(100); // Player took damage
    expect(combatScene.uiManager.updatePlayerStats).toHaveBeenCalled();
    expect(combatScene.startPlayerTurn).toHaveBeenCalled();
  });
  
  test('endCombat should handle victory', () => {
    // Setup
    combatScene.player = new Player();
    combatScene.enemy = new Enemy();
    combatScene.grid = new Grid();
    combatScene.uiManager = new UIManager();
    combatScene.turnTimer = 123;
    
    // Execute
    combatScene.endCombat(true);
    
    // Verify
    expect(combatScene.combatActive).toBe(false);
    expect(global.clearInterval).toHaveBeenCalledWith(123);
    expect(combatScene.grid.disable).toHaveBeenCalled();
    expect(combatScene.player.gainExperience).toHaveBeenCalled();
    expect(Player.save).toHaveBeenCalledWith(combatScene.player);
    expect(combatScene.uiManager.showVictoryScreen).toHaveBeenCalled();
  });
  
  test('endCombat should handle defeat', () => {
    // Setup
    combatScene.player = new Player();
    combatScene.enemy = new Enemy();
    combatScene.grid = new Grid();
    combatScene.uiManager = new UIManager();
    combatScene.turnTimer = 123;
    
    // Execute
    combatScene.endCombat(false);
    
    // Verify
    expect(combatScene.combatActive).toBe(false);
    expect(global.clearInterval).toHaveBeenCalledWith(123);
    expect(combatScene.grid.disable).toHaveBeenCalled();
    expect(combatScene.player.loseExperience).toHaveBeenCalled();
    expect(Player.save).toHaveBeenCalledWith(combatScene.player);
    expect(combatScene.uiManager.showDefeatScreen).toHaveBeenCalled();
  });
  
  test('cleanupCombat should remove DOM elements', () => {
    // Setup
    combatScene.turnTimer = 123;
    
    // Execute
    combatScene.cleanupCombat();
    
    // Verify
    expect(global.clearInterval).toHaveBeenCalledWith(123);
    expect(document.getElementById).toHaveBeenCalledWith('grid');
    expect(document.querySelectorAll).toHaveBeenCalledWith('.notification');
    expect(document.querySelectorAll).toHaveBeenCalledWith('.fixed.inset-0');
  });
});
