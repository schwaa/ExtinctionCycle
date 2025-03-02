/* eslint-env jest */
import { Enemy } from '../js/combat/Enemy.js';
import { CONFIG } from '../js/combat/config.js';

describe('Enemy', () => {
  let enemy;
  const mockConfig = {
    maxHp: 50,
    baseAttack: 10,
    baseDefense: 3,
    level: 2,
    name: 'Test Enemy'
  };

  beforeEach(() => {
    CONFIG.COMBAT = CONFIG.COMBAT || {
      ENEMY_DAMAGE: 15
    };

    // Set up DOM elements needed for animations
    document.body.innerHTML = `
      <div id="enemy"></div>
    `;

    enemy = new Enemy(mockConfig);
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('constructor', () => {
    test('initializes with correct stats and name', () => {
      expect(enemy.maxHp).toBe(50);
      expect(enemy.hp).toBe(50);
      expect(enemy.baseAttack).toBe(10);
      expect(enemy.baseDefense).toBe(3);
      expect(enemy.level).toBe(2);
      expect(enemy.name).toBe('Test Enemy');
      expect(enemy.moveCooldown).toBe(false);
      expect(enemy.isAttacking).toBe(false);
    });

    test('calculates correct experience value based on level', () => {
      const expectedExp = Math.floor(10 * Math.pow(1.2, enemy.level - 1));
      expect(enemy.expValue).toBe(expectedExp);
    });

    test('generates default attack pattern', () => {
      expect(enemy.pattern).toEqual([
        { type: 'attack', damage: CONFIG.COMBAT.ENEMY_DAMAGE }
      ]);
    });
  });

  describe('takeDamage', () => {
    test('applies damage and updates sprite states', async () => {
      const enemySprite = document.getElementById('enemy');
      const startingHp = enemy.hp;
      const damage = 20;

      await enemy.takeDamage(damage);

      // Verify sprite state changes
      expect(enemySprite.classList.contains('hit')).toBe(false); // Animation should be complete
      
      const remainingHealthPercent = (enemy.hp / enemy.maxHp) * 100;
      if (remainingHealthPercent <= 25) {
        expect(enemySprite.dataset.state).toBe('critical');
      } else if (remainingHealthPercent <= 50) {
        expect(enemySprite.dataset.state).toBe('low');
      }

      expect(enemy.hp).toBeLessThan(startingHp);
    });
  });

  describe('decideMove', () => {
    test('returns null when on cooldown', () => {
      enemy.moveCooldown = true;
      const gridState = Array(9).fill('red'); // 3x3 grid
      expect(enemy.decideMove(gridState)).toBeNull();
    });

    test('returns null when attacking', () => {
      enemy.isAttacking = true;
      const gridState = Array(9).fill('red');
      expect(enemy.decideMove(gridState)).toBeNull();
    });

    test('finds horizontal match opportunity', () => {
      // Create a 3x3 grid where swapping would create a horizontal match
      const gridState = [
        'red', 'red', 'blue',
        'green', 'red', 'yellow',
        'purple', 'blue', 'green'
      ];

      const move = enemy.decideMove(gridState);
      expect(move).toEqual({ from: 2, to: 1 }); // Swap blue with second red to make match
    });

    test('finds vertical match opportunity', () => {
      // Create a 3x3 grid where swapping would create a vertical match
      const gridState = [
        'red', 'green', 'blue',
        'red', 'yellow', 'purple',
        'green', 'red', 'yellow'
      ];

      const move = enemy.decideMove(gridState);
      expect(move).toEqual({ from: 6, to: 3 }); // Swap green with second red to make match
    });

    test('sets cooldown after finding move', () => {
      const gridState = [
        'red', 'red', 'blue',
        'green', 'red', 'yellow',
        'purple', 'blue', 'green'
      ];

      enemy.decideMove(gridState);
      expect(enemy.moveCooldown).toBe(true);

      // Fast-forward timer
      jest.advanceTimersByTime(1000);
      expect(enemy.moveCooldown).toBe(false);
    });
  });

  describe('takeAction', () => {
    test('executes attack pattern with animations', async () => {
      const target = {
        takeDamage: jest.fn().mockResolvedValue(10)
      };

      const action = enemy.pattern[0];
      const expectedDamage = action.damage * enemy.getAttack() / 10;

      expect(enemy.isAttacking).toBe(false);
      const resultPromise = enemy.takeAction(target);
      expect(enemy.isAttacking).toBe(true);

      // Let animations play out
      jest.runAllTimers();
      const result = await resultPromise;

      expect(target.takeDamage).toHaveBeenCalledWith(expectedDamage);
      expect(result).toMatch(/Enemy attacks for \d+ damage!/);
      expect(enemy.isAttacking).toBe(false);
    });
  });

  describe('checkForMatch', () => {
    test('detects horizontal matches', () => {
      const state = [
        'red', 'red', 'red',
        'blue', 'green', 'yellow',
        'purple', 'blue', 'green'
      ];
      expect(enemy.checkForMatch(state, 3)).toBe(true);
    });

    test('detects vertical matches', () => {
      const state = [
        'red', 'blue', 'green',
        'red', 'green', 'yellow',
        'red', 'blue', 'purple'
      ];
      expect(enemy.checkForMatch(state, 3)).toBe(true);
    });

    test('returns false when no matches exist', () => {
      const state = [
        'red', 'blue', 'green',
        'blue', 'green', 'red',
        'green', 'red', 'blue'
      ];
      expect(enemy.checkForMatch(state, 3)).toBe(false);
    });
  });

  describe('getThreatLevel', () => {
    test('calculates threat level based on HP and attack', () => {
      enemy.hp = enemy.maxHp / 2; // 50% health
      const expectedThreat = (enemy.hp / enemy.maxHp) * (enemy.getAttack() / 10);
      expect(enemy.getThreatLevel()).toBe(expectedThreat);
    });
  });
});
