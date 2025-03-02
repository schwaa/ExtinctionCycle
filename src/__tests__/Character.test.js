/* eslint-env jest */
import { Character } from '../js/Character.js';

describe('Character', () => {
  let character;
  const mockConfig = {
    maxHp: 100,
    baseAttack: 10,
    baseDefense: 5,
    level: 1
  };

  beforeEach(() => {
    character = new Character(mockConfig);
    // Reset the DOM for each test
    document.body.innerHTML = `
      <div id="character"></div>
    `;
  });

  describe('constructor', () => {
    test('initializes with correct stats', () => {
      expect(character.maxHp).toBe(100);
      expect(character.hp).toBe(100);
      expect(character.baseAttack).toBe(10);
      expect(character.baseDefense).toBe(5);
      expect(character.level).toBe(1);
      expect(character.statusEffects).toEqual([]);
      expect(character.isAnimating).toBe(false);
    });
  });

  describe('getAttack', () => {
    test('returns base attack with no status effects', () => {
      expect(character.getAttack()).toBe(10);
    });

    test('applies attack status effects correctly', () => {
      character.addStatusEffect({ type: 'attack', multiplier: 1.5 });
      expect(character.getAttack()).toBe(15); // 10 * 1.5

      character.addStatusEffect({ type: 'attack', multiplier: 1.2 });
      expect(character.getAttack()).toBe(18); // 10 * 1.5 * 1.2
    });
  });

  describe('getDefense', () => {
    test('returns base defense with no status effects', () => {
      expect(character.getDefense()).toBe(5);
    });

    test('applies defense status effects correctly', () => {
      character.addStatusEffect({ type: 'defense', multiplier: 1.5 });
      expect(character.getDefense()).toBe(7); // 5 * 1.5, floor to 7

      character.addStatusEffect({ type: 'defense', multiplier: 1.2 });
      expect(character.getDefense()).toBe(9); // 5 * 1.5 * 1.2, floor to 9
    });
  });

  describe('takeDamage', () => {
    test('reduces hp by damage amount after defense calculation', async () => {
      // With 5 defense, damage reduction should be: amount * (100 / (100 + 5))
      const damage = 20;
      const expectedDamage = Math.floor(damage * (100 / 105));
      const startingHp = character.hp;
      
      await character.takeDamage(damage);
      expect(character.hp).toBe(startingHp - expectedDamage);
    });

    test('cannot reduce hp below 0', async () => {
      await character.takeDamage(1000);
      expect(character.hp).toBe(0);
    });

    test('updates sprite state based on health percentage', async () => {
      const characterSprite = document.getElementById('character');
      
      // Take damage to reduce to 40% health
      await character.takeDamage(60);
      expect(characterSprite.dataset.state).toBe('low');
      
      // Take more damage to reduce to 20% health
      await character.takeDamage(20);
      expect(characterSprite.dataset.state).toBe('critical');
      
      // Take fatal damage
      await character.takeDamage(100);
      expect(characterSprite.dataset.state).toBe('defeated');
    });
  });

  describe('heal', () => {
    test('increases hp by heal amount', () => {
      character.hp = 50;
      const healAmount = 30;
      const amountHealed = character.heal(healAmount);
      expect(character.hp).toBe(80);
      expect(amountHealed).toBe(30);
    });

    test('cannot heal above maxHp', () => {
      character.hp = 90;
      const healAmount = 20;
      const amountHealed = character.heal(healAmount);
      expect(character.hp).toBe(100);
      expect(amountHealed).toBe(10);
    });
  });

  describe('isDead', () => {
    test('returns true when hp is 0', () => {
      character.hp = 0;
      expect(character.isDead()).toBe(true);
    });

    test('returns false when hp is above 0', () => {
      character.hp = 1;
      expect(character.isDead()).toBe(false);
    });
  });

  describe('status effects', () => {
    test('addStatusEffect adds effect with duration', () => {
      character.addStatusEffect({ type: 'attack', multiplier: 1.5, duration: 2 });
      expect(character.statusEffects).toHaveLength(1);
      expect(character.statusEffects[0]).toEqual({
        type: 'attack',
        multiplier: 1.5,
        duration: 2
      });
    });

    test('updateStatusEffects decreases duration and removes expired effects', () => {
      character.addStatusEffect({ type: 'attack', multiplier: 1.5, duration: 2 });
      character.addStatusEffect({ type: 'defense', multiplier: 1.2, duration: 1 });
      
      character.updateStatusEffects();
      expect(character.statusEffects).toHaveLength(2);
      expect(character.statusEffects[0].duration).toBe(1);
      expect(character.statusEffects[1].duration).toBe(0);
      
      character.updateStatusEffects();
      expect(character.statusEffects).toHaveLength(0);
    });
  });

  describe('animation states', () => {
    test('startAnimation sets isAnimating flag', async () => {
      const animationPromise = character.startAnimation('hit');
      expect(character.isAnimating).toBe(true);
      await animationPromise;
      expect(character.isAnimating).toBe(false);
    });

    test('setState updates sprite state', () => {
      const characterSprite = document.getElementById('character');
      character.setState('defending');
      expect(characterSprite.dataset.state).toBe('defending');
    });

    test('clearState removes sprite state', () => {
      const characterSprite = document.getElementById('character');
      character.setState('defending');
      character.clearState();
      expect(characterSprite.dataset.state).toBeUndefined();
    });

    test('isInAnimation returns animation state', () => {
      expect(character.isInAnimation()).toBe(false);
      character.isAnimating = true;
      expect(character.isInAnimation()).toBe(true);
    });
  });
});
