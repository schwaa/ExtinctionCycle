import { Player } from '../js/Player.js';
import { CONFIG } from '../js/combat/config.js';

describe('Player', () => {
    let mockStorage;
    
    beforeEach(() => {
        // Mock localStorage
        mockStorage = {};
        global.localStorage = {
            getItem: jest.fn(key => mockStorage[key]),
            setItem: jest.fn((key, value) => { mockStorage[key] = value })
        };
    });

    test('should preserve HP when loading from save', () => {
        // Save a player with non-max HP
        const savedData = {
            level: 1,
            experience: 0,
            nextLevelExp: 100,
            maxHp: 100,
            hp: 76,  // Partial HP
            baseAttack: 10,
            baseDefense: 5,
            skills: {}
        };
        mockStorage['rpgMatchGameSave'] = JSON.stringify(savedData);
        
        // Load the player
        const player = Player.load();
        
        // Verify HP was preserved and not reset to max
        expect(player.hp).toBe(76);
        expect(player.maxHp).toBe(100);
    });

    test('should initialize with maxHP for new player', () => {
        // Clear any saved data
        mockStorage = {};
        
        // Create new player
        const player = new Player();
        
        // Verify HP starts at max for new player
        expect(player.hp).toBe(player.maxHp);
    });

    test('should save and load player state correctly', () => {
        // Create and modify a player
        const player = new Player();
        player.hp = 76;
        player.experience = 50;
        
        // Save the player
        Player.save(player);
        
        // Load into a new player instance
        const loadedPlayer = Player.load();
        
        // Verify all stats match
        expect(loadedPlayer.hp).toBe(76);
        expect(loadedPlayer.maxHp).toBe(player.maxHp);
        expect(loadedPlayer.experience).toBe(50);
    });

    describe('healToFull', () => {
        test('should heal to max HP and cost 1 EXP when conditions met', () => {
            const player = new Player();
            player.hp = 50;  // Set HP below max
            player.experience = 5;  // Ensure enough EXP
            
            const result = player.healToFull();
            
            expect(result).toBe(true);  // Healing succeeded
            expect(player.hp).toBe(player.maxHp);  // HP restored to max
            expect(player.experience).toBe(4);  // Cost 1 EXP
        });

        test('should not heal if already at max HP', () => {
            const player = new Player();
            player.experience = 5;
            const originalExp = player.experience;
            
            const result = player.healToFull();
            
            expect(result).toBe(false);  // Healing failed
            expect(player.hp).toBe(player.maxHp);  // HP unchanged
            expect(player.experience).toBe(originalExp);  // EXP unchanged
        });

        test('should not heal if not enough EXP', () => {
            const player = new Player();
            player.hp = 50;  // Set HP below max
            player.experience = 0;  // No EXP
            const originalHp = player.hp;
            
            const result = player.healToFull();
            
            expect(result).toBe(false);  // Healing failed
            expect(player.hp).toBe(originalHp);  // HP unchanged
            expect(player.experience).toBe(0);  // EXP unchanged
        });
    });
});
