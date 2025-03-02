import Phaser from 'phaser';
import { CONFIG } from './js/combat/config.js';
import { Player } from './js/Player.js';
import BootScene from './js/scenes/BootScene';
import PreloadScene from './js/scenes/PreloadScene';
import HomeBaseScene from './js/scenes/HomeBaseScene';
import ProfileScene from './js/scenes/ProfileScene';
import CombatScene from './js/scenes/CombatScene';
import './style.css';

// Debug mode configuration
const DEBUG = {
  enabled: false,
    
  // Add power to skill
  addPower: (color, amount) => {
    if (window.game) {
      const scene = window.game.scene.getScene('CombatScene');
      if (scene && scene.combatEngine && scene.combatEngine.player) {
        const currentPower = scene.combatEngine.player.getSkillPower(color);
        const newPower = scene.combatEngine.player.addSkillPower(color, amount);
        scene.combatEngine.uiManager.updateSkillPower(CONFIG.SKILLS[color], newPower);
        console.log(`Power added to ${color}: ${newPower - currentPower}`);
      }
    }
  },

  // Reset all skill powers
  resetPowers: () => {
    if (window.game) {
      const scene = window.game.scene.getScene('CombatScene');
      if (scene && scene.combatEngine && scene.combatEngine.player) {
        CONFIG.GRID.COLORS.forEach(color => {
          scene.combatEngine.player.resetSkillPower(color);
          scene.combatEngine.uiManager.updateSkillPower(CONFIG.SKILLS[color], 0);
        });
        console.log('All powers reset');
      }
    }
  },

  // Fill all skill powers to max
  maxPowers: () => {
    if (window.game) {
      const scene = window.game.scene.getScene('CombatScene');
      if (scene && scene.combatEngine && scene.combatEngine.player) {
        CONFIG.GRID.COLORS.forEach(color => {
          const maxPower = CONFIG.SKILLS[color].powerRequired;
          scene.combatEngine.player.skillPower[color] = maxPower;
          scene.combatEngine.uiManager.updateSkillPower(CONFIG.SKILLS[color], maxPower);
        });
        console.log('All powers maxed');
      }
    }
  }
};

// Game configuration
// Asset base URL for Vite
const assetUrl = '';

// Game configuration
const config = {
  type: Phaser.AUTO,
  width: 600,
  height: 800,
  parent: 'game-container',
  backgroundColor: '#0f1218',
  scene: [
    BootScene,
    PreloadScene,
    HomeBaseScene,
    ProfileScene,
    CombatScene
  ],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  loader: {
    baseURL: assetUrl,
    crossOrigin: 'anonymous'
  },
  dom: {
    createContainer: true
  }
};

// Log game status
console.log('Game configuration:', {
  scenes: config.scene.map(scene => scene.name),
  assetUrl,
  publicPath: import.meta.env.BASE_URL
});

// Game event handlers
const handleSceneCreation = (scene) => {
  console.log(`Scene created: ${scene.scene.key}`);
};

const handleSceneStart = (scene) => {
  console.log(`Scene started: ${scene.scene.key}`);
};

const handleSceneError = (scene, error) => {
  console.error(`Scene error in ${scene.scene.key}:`, error);
};

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
  try {
    // Add scene event handlers
    config.callbacks = {
      preBoot: (game) => {
        game.events.on('ready', () => {
          console.log('Game is ready');
        });
      }
    };

    // Create game instance
    window.game = new Phaser.Game(config);

    // Create player instance and store in registry
    const player = new Player();
    window.game.registry.set('player', player);

    // Load saved data if it exists
    const savedData = localStorage.getItem('savedPlayerData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        Object.assign(player, parsedData); // Update player with saved values
      } catch (e) {
        console.error('Error loading saved player data', e);
      }
    }

    // Save player data when game exits
    window.addEventListener('beforeunload', () => {
      const currentPlayer = window.game.registry.get('player');
      localStorage.setItem('savedPlayerData', JSON.stringify(currentPlayer));
    });

    // Add global scene event listeners
    window.game.events.on('createscene', handleSceneCreation);
    window.game.events.on('startscene', handleSceneStart);
    window.game.events.on('sceneerror', handleSceneError);

    // Handle visibility change for pausing
    document.addEventListener('visibilitychange', () => {
      const currentScene = window.game.scene.getScenes(true)[0];
      if (document.hidden) {
        if (currentScene && !currentScene.scene.isPaused()) {
          currentScene.scene.pause();
        }
      } else {
        if (currentScene && currentScene.scene.isPaused()) {
          currentScene.scene.resume();
        }
      }
    });

    console.log('Game initialized with scenes:', config.scene.map(s => s.name));
  } catch (error) {
    console.error('Failed to initialize game:', error);
    console.error('Stack trace:', error.stack);
    const errorMessage = document.createElement('div');
    errorMessage.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center text-white p-4';
    errorMessage.innerHTML = `
      <div class="bg-red-800 p-6 rounded-lg max-w-lg">
        <h2 class="text-xl font-bold mb-4">Error</h2>
        <p class="mb-4">Failed to initialize game: ${error.message}</p>
        <button onclick="location.reload()" class="px-4 py-2 bg-red-600 hover:bg-red-700 rounded">
          Reload Page
        </button>
      </div>
    `;
    document.body.appendChild(errorMessage);
  }
});

// Export debug configuration
window.DEBUG = DEBUG;
