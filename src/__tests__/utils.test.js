/* eslint-env jest */
import { utils } from '../js/combat/utils.js';

describe('utils', () => {
  describe('randomInt', () => {
    test('returns number within range', () => {
      const min = 1;
      const max = 10;
      for (let i = 0; i < 100; i++) {
        const result = utils.randomInt(min, max);
        expect(result).toBeGreaterThanOrEqual(min);
        expect(result).toBeLessThanOrEqual(max);
        expect(Number.isInteger(result)).toBe(true);
      }
    });
  });

  describe('sleep', () => {
    test('waits for specified time', async () => {
      const start = Date.now();
      await utils.sleep(100);
      const duration = Date.now() - start;
      expect(duration).toBeGreaterThanOrEqual(95); // Allow small time variance
    });
  });

  describe('deepClone', () => {
    test('creates deep copy of object', () => {
      const original = {
        a: 1,
        b: { c: 2, d: [3, 4] },
        e: [{ f: 5 }]
      };
      const copy = utils.deepClone(original);
      
      expect(copy).toEqual(original);
      expect(copy).not.toBe(original);
      expect(copy.b).not.toBe(original.b);
      expect(copy.e).not.toBe(original.e);
      expect(copy.e[0]).not.toBe(original.e[0]);
    });
  });

  describe('formatNumber', () => {
    test('formats numbers with commas', () => {
      expect(utils.formatNumber(1000)).toBe('1,000');
      expect(utils.formatNumber(1000000)).toBe('1,000,000');
      expect(utils.formatNumber(123456789)).toBe('123,456,789');
      expect(utils.formatNumber(100)).toBe('100');
    });
  });

  describe('getTextColorClass', () => {
    test('returns white text for dark colors', () => {
      expect(utils.getTextColorClass('red')).toBe('text-white');
      expect(utils.getTextColorClass('blue')).toBe('text-white');
      expect(utils.getTextColorClass('purple')).toBe('text-white');
    });

    test('returns black text for other colors', () => {
      expect(utils.getTextColorClass('yellow')).toBe('text-black');
      expect(utils.getTextColorClass('green')).toBe('text-black');
    });
  });

  describe('formatPercentage', () => {
    test('formats values as percentage strings', () => {
      expect(utils.formatPercentage(50)).toBe('50%');
      expect(utils.formatPercentage(33.33)).toBe('33%');
      expect(utils.formatPercentage(100)).toBe('100%');
      expect(utils.formatPercentage(0)).toBe('0%');
    });
  });
});
