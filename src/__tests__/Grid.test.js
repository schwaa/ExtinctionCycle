/* eslint-env jest */
import { Grid } from '../js/combat/Grid.js';
import { CONFIG } from '../js/combat/config.js';

describe('Grid', () => {
  let grid;
  const mockConfig = {
    GRID: {
      SIZE: 3,
      COLORS: ['red', 'blue', 'green'],
      COLOR_CLASSES: {
        red: 'bg-red-500',
        blue: 'bg-blue-500',
        green: 'bg-green-500'
      }
    }
  };

  beforeEach(() => {
    // Set up minimal CONFIG
    Object.assign(CONFIG, mockConfig);

    // Set up DOM environment
    document.body.innerHTML = '<div id="grid"></div>';

    // Create grid instance
    grid = new Grid();
  });

  describe('constructor', () => {
    test('initializes grid with correct size', () => {
      expect(grid.size).toBe(CONFIG.GRID.SIZE);
      expect(grid.cells.length).toBe(CONFIG.GRID.SIZE * CONFIG.GRID.SIZE);
    });

    test('sets up grid element with correct styles', () => {
      const gridElement = document.getElementById('grid');
      expect(gridElement.style.gridTemplateColumns).toBe(`repeat(${CONFIG.GRID.SIZE}, minmax(0, 1fr))`);
      expect(gridElement.className).toContain('grid');
      expect(gridElement.className).toContain('gap-2');
    });

    test('creates orbs with correct attributes', () => {
      grid.cells.forEach(orb => {
        expect(orb.className).toMatch(/orb.*rounded-full.*cursor-move/);
        expect(CONFIG.GRID.COLORS).toContain(orb.dataset.color);
        expect(orb.draggable).toBe(true);
      });
    });
  });

  describe('findMatchGroups', () => {
    test('finds horizontal matches', () => {
      // Manually set up a horizontal match
      grid.cells[0].dataset.color = 'red';
      grid.cells[1].dataset.color = 'red';
      grid.cells[2].dataset.color = 'red';

      const matches = grid.findMatchGroups();
      expect(matches).toHaveLength(1);
      expect(matches[0]).toEqual({
        indices: [0, 1, 2],
        color: 'red',
        size: 3
      });
    });

    test('finds vertical matches', () => {
      // Manually set up a vertical match
      grid.cells[0].dataset.color = 'blue';
      grid.cells[3].dataset.color = 'blue';
      grid.cells[6].dataset.color = 'blue';

      const matches = grid.findMatchGroups();
      expect(matches).toHaveLength(1);
      expect(matches[0]).toEqual({
        indices: [0, 3, 6],
        color: 'blue',
        size: 3
      });
    });

    test('finds multiple matches simultaneously', () => {
      // Set up both horizontal and vertical matches
      grid.cells[0].dataset.color = 'red';
      grid.cells[1].dataset.color = 'red';
      grid.cells[2].dataset.color = 'red';
      grid.cells[0].dataset.color = 'blue';
      grid.cells[3].dataset.color = 'blue';
      grid.cells[6].dataset.color = 'blue';

      const matches = grid.findMatchGroups();
      expect(matches.length).toBeGreaterThan(1);
    });
  });

  describe('drag and drop functionality', () => {
    let dragStartEvent, dragEnterEvent, dragOverEvent, dropEvent, dragEndEvent;

    beforeEach(() => {
      dragStartEvent = new Event('dragstart');
      dragEnterEvent = new Event('dragenter');
      dragOverEvent = new Event('dragover');
      dropEvent = new Event('drop');
      dragEndEvent = new Event('dragend');

      // Mock dataTransfer
      dragStartEvent.dataTransfer = {
        setData: jest.fn(),
        effectAllowed: null
      };
      dragOverEvent.dataTransfer = { dropEffect: null };
      dropEvent.dataTransfer = {};
    });

    test('handleDragStart sets up drag state correctly', () => {
      const orb = grid.cells[0];
      
      Object.defineProperty(dragStartEvent, 'target', { value: orb });
      orb.dispatchEvent(dragStartEvent);

      expect(grid.draggedOrb).toBe(orb);
      expect(orb.classList.contains('opacity-50')).toBe(true);
    });

    test('handleDragEnter adds highlight to target', () => {
      const targetOrb = grid.cells[1];
      Object.defineProperty(dragEnterEvent, 'target', { value: targetOrb });
      
      targetOrb.dispatchEvent(dragEnterEvent);
      expect(targetOrb.classList.contains('ring-2')).toBe(true);
    });

    test('isAdjacent correctly identifies neighboring cells', () => {
      // Test horizontal adjacency
      expect(grid.isAdjacent(0, 1)).toBe(true);  // Same row, adjacent columns
      expect(grid.isAdjacent(0, 2)).toBe(false); // Same row, not adjacent
      
      // Test vertical adjacency
      expect(grid.isAdjacent(0, 3)).toBe(true);  // Same column, adjacent rows
      expect(grid.isAdjacent(0, 6)).toBe(false); // Same column, not adjacent
      
      // Test diagonal
      expect(grid.isAdjacent(0, 4)).toBe(false); // Diagonal cells are not adjacent
    });
  });

  describe('match processing', () => {
    test('processMatches calls onMatchCallback for each match', () => {
      const mockCallback = jest.fn();
      grid.onMatch(mockCallback);

      // Set up a match
      grid.cells[0].dataset.color = 'red';
      grid.cells[1].dataset.color = 'red';
      grid.cells[2].dataset.color = 'red';

      grid.processMatches();
      expect(mockCallback).toHaveBeenCalledWith('red', 3);
    });

    test('adds match animation class temporarily', () => {
      jest.useFakeTimers();

      // Set up a match
      grid.cells[0].dataset.color = 'red';
      grid.cells[1].dataset.color = 'red';
      grid.cells[2].dataset.color = 'red';

      grid.processMatches();
      
      expect(grid.cells[0].classList.contains('matched')).toBe(true);
      expect(grid.cells[1].classList.contains('matched')).toBe(true);
      expect(grid.cells[2].classList.contains('matched')).toBe(true);

      jest.advanceTimersByTime(300);

      expect(grid.cells[0].classList.contains('matched')).toBe(false);
      expect(grid.cells[1].classList.contains('matched')).toBe(false);
      expect(grid.cells[2].classList.contains('matched')).toBe(false);

      jest.useRealTimers();
    });
  });

  describe('grid state management', () => {
    test('enable makes grid interactive', () => {
      grid.disable();
      grid.enable();

      grid.cells.forEach(cell => {
        expect(cell.draggable).toBe(true);
        expect(cell.classList.contains('cursor-not-allowed')).toBe(false);
        expect(cell.classList.contains('opacity-50')).toBe(false);
        expect(cell.classList.contains('cursor-move')).toBe(true);
      });
      expect(grid.isLocked).toBe(false);
    });

    test('disable makes grid non-interactive', () => {
      grid.disable();

      grid.cells.forEach(cell => {
        expect(cell.draggable).toBe(false);
        expect(cell.classList.contains('cursor-not-allowed')).toBe(true);
        expect(cell.classList.contains('opacity-50')).toBe(true);
        expect(cell.classList.contains('cursor-move')).toBe(false);
      });
      expect(grid.isLocked).toBe(true);
    });
  });

  describe('swapOrbs', () => {
    test('swaps color and class between two orbs', () => {
      const orb1 = grid.cells[0];
      const orb2 = grid.cells[1];
      
      orb1.dataset.color = 'red';
      orb1.className = CONFIG.GRID.COLOR_CLASSES.red;
      orb2.dataset.color = 'blue';
      orb2.className = CONFIG.GRID.COLOR_CLASSES.blue;
      
      grid.swapOrbs(orb1, orb2);
      
      expect(orb1.dataset.color).toBe('blue');
      expect(orb1.className).toBe(CONFIG.GRID.COLOR_CLASSES.blue);
      expect(orb2.dataset.color).toBe('red');
      expect(orb2.className).toBe(CONFIG.GRID.COLOR_CLASSES.red);
    });
  });

  describe('callbacks', () => {
    test('onMatch registers match callback', () => {
      const callback = jest.fn();
      grid.onMatch(callback);
      expect(grid.onMatchCallback).toBe(callback);
    });

    test('onSwap registers swap callback', () => {
      const callback = jest.fn();
      grid.onSwap(callback);
      expect(grid.swapCallback).toBe(callback);
    });
  });
});
