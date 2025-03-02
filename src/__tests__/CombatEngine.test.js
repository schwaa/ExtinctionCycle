import { CombatEngine } from '../js/combat/CombatEngine';
import { CONFIG } from '../js/combat/config';

describe('CombatEngine', () => {
  let combatEngine;
  let mockPlayer;
  let mockEnemy;
  let mockGrid;
  let mockUiManager;
  let matchCallback;

  beforeEach(() => {
    // Mock player
    mockPlayer = {
      hp: 100,
      maxHp: 100,
      baseDefense: 10,
      skills: {},
      gainExperience: jest.fn(),
      loseExperience: jest.fn()
    };

    // Mock enemy
    mockEnemy = {
      hp: 100,
      level: 1,
      baseAttack: 10,
      getAttack: jest.fn().mockReturnValue(10),
      takeDamage: jest.fn()
    };

    // Mock grid with callback capture
    mockGrid = {
      enable: jest.fn(),
      disable: jest.fn(),
      onMatch: jest.fn((callback) => {
        matchCallback = callback;
      })
    };

    // Mock UI manager
    mockUiManager = {
      showNotification: jest.fn(),
      updateTurnIndicator: jest.fn(),
      updateTimer: jest.fn(),
      updatePlayerStats: jest.fn(),
      updateEnemyStats: jest.fn(),
      showDamageNumber: jest.fn(),
      updateSkillPower: jest.fn(),
      addSkillButton: jest.fn(),
      showVictoryScreen: jest.fn(),
      showDefeatScreen: jest.fn()
    };

    combatEngine = new CombatEngine(mockPlayer, mockEnemy, mockGrid, mockUiManager);
  });

  test('should preserve player HP when combat starts', () => {
    // Set player HP to less than max
    mockPlayer.hp = 76;
    mockPlayer.maxHp = 100;
    
    // Start combat
    combatEngine.startCombat();
    
    // Verify HP wasn't reset to max
    expect(mockPlayer.hp).toBe(76);
    
    // Verify UI was updated with correct HP
    expect(mockUiManager.updatePlayerStats).toHaveBeenCalledWith(
      expect.objectContaining({
        hp: 76,
        maxHp: 100
      })
    );
  });

  test('grid matches should not process after combat ends', () => {
    // Start combat and verify initial state
    combatEngine.startCombat();
    expect(combatEngine.isPlayerTurn).toBe(true);
    expect(combatEngine.combatActive).toBe(true);

    // End combat
    combatEngine.endCombat(false);
    expect(combatEngine.combatActive).toBe(false);

    // Attempt to process a match after combat ends
    matchCallback('red', 3);
    expect(mockPlayer.skills.red).toBeUndefined();
  });

  test('enemy turn should not continue after player defeat', () => {
    combatEngine.startCombat();
    
    // Set player HP to a value that will result in defeat
    mockPlayer.hp = 10;
    
    // Trigger enemy turn that will defeat player
    jest.useFakeTimers();
    combatEngine.enemyTurn();
    
    // Verify combat ended
    expect(combatEngine.combatActive).toBe(false);
    expect(mockUiManager.showDefeatScreen).toHaveBeenCalled();
    
    // Attempt to start another enemy turn
    combatEngine.enemyTurn();
    
    // Verify no further damage was done
    expect(mockUiManager.showDamageNumber).toHaveBeenCalledTimes(1);
  });

  test('turns transition with proper delays', () => {
    jest.useFakeTimers();
    
    combatEngine.startCombat();
    expect(mockUiManager.updateTurnIndicator).toHaveBeenLastCalledWith('Your Turn');
    
    // End player turn
    combatEngine.endPlayerTurn();
    expect(mockUiManager.updateTurnIndicator).toHaveBeenLastCalledWith("Enemy's Turn");
    
    // Verify enemy turn hasn't started yet
    expect(mockEnemy.getAttack).not.toHaveBeenCalled();
    
    // Fast forward 1500ms
    jest.advanceTimersByTime(1500);
    
    // Now enemy turn should have started
    expect(mockEnemy.getAttack).toHaveBeenCalled();
  });

  test('should properly clear timer on combat end', () => {
    jest.useFakeTimers();
    
    // Start combat which starts the turn timer
    combatEngine.startCombat();
    
    // End combat
    combatEngine.endCombat(false);
    
    // Try to advance timer
    jest.advanceTimersByTime(1000);
    
    // Verify no more timer updates occurred
    expect(mockUiManager.updateTimer).toHaveBeenCalledTimes(1); // Initial call only
  });

  test('skill use should properly end turn and prevent further actions', async () => {
    // Setup mock skill config
    CONFIG.SKILLS = {
      red: {
        id: 'fire_strike',
        baseDamage: 20,
        powerRequired: 10
      }
    };
    
    // Give player enough power to use skill
    mockPlayer.skills.red = 10;
    
    // Start combat
    combatEngine.startCombat();
    
    // Use skill
    await combatEngine.playerUseSkill('red');
    
    // Verify turn ended
    expect(combatEngine.isPlayerTurn).toBe(false);
    
    // Try to process a match
    matchCallback('red', 3);
    
    // Verify no power was gained from match
    expect(mockPlayer.skills.red).toBe(0);
  });
});
