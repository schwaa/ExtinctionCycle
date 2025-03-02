/* eslint-env jest */
import { UIManager } from '../js/combat/UIManager.js';
import { CONFIG } from '../js/combat/config.js';
import { utils } from '../js/combat/utils.js';

// Set up a dummy DOM environment
document.body.innerHTML = `
  <div id="playerHealth"></div>
  <div id="playerLevel"></div>
  <div id="enemyHealth"></div>
  <div id="enemyLevel"></div>
  <div id="turnIndicator"></div>
  <div id="timer"></div>
  <div id="skillsBar"></div>
`;

// Provide dummy configurations for skills and grid
CONFIG.SKILLS = {
  red: { id: 'skill_red', name: 'Fireball', powerRequired: 10 },
  blue: { id: 'skill_blue', name: 'Ice Blast', powerRequired: 15 }
};

CONFIG.GRID = {
  COLOR_CLASSES: {
    red: 'bg-red-500',
    blue: 'bg-blue-500'
  }
};

// Stub getTextColorClass for testing purposes
utils.getTextColorClass = (color) => {
  return `text-${color}-700`;
};

describe('UIManager', () => {
  let uiManager;
  beforeEach(() => {
    // Reset the DOM for every test
    document.body.innerHTML = `
      <div id="playerHealth"></div>
      <div id="playerLevel"></div>
      <div id="enemyHealth"></div>
      <div id="enemyLevel"></div>
      <div id="turnIndicator"></div>
      <div id="timer"></div>
      <div id="skillsBar"></div>
    `;
    uiManager = new UIManager();
  });

  test('loads skill buttons based on CONFIG.SKILLS', () => {
    const buttons = document.querySelectorAll('#skillsBar button');
    expect(buttons.length).toBe(Object.keys(CONFIG.SKILLS).length);
  });

  test('updateSkillPower updates button state correctly', () => {
    const skillId = CONFIG.SKILLS.red.id; // 'skill_red'
    // Initially update with power below requirement
    uiManager.updateSkillPower(skillId, 5);
    let button = document.querySelector(`[data-skill-id="${skillId}"]`);
    expect(button.dataset.actualPower).toBe('5');
    expect(button.disabled).toBe(true);
    expect(button.classList.contains('ready')).toBe(false);

    // Now update with power meeting requirement
    uiManager.updateSkillPower(skillId, 10);
    button = document.querySelector(`[data-skill-id="${skillId}"]`);
    expect(button.dataset.actualPower).toBe('10');
    expect(button.disabled).toBe(false);
    expect(button.classList.contains('ready')).toBe(true);
  });

  test('adds sparkle effect when skill becomes ready', () => {
    const skillId = CONFIG.SKILLS.blue.id; // 'skill_blue'
    uiManager.updateSkillPower(skillId, 15);
    const button = document.querySelector(`[data-skill-id="${skillId}"]`);
    // After becoming ready, the button should have been updated with "ready" and a sparkle element added.
    const sparkle = button.querySelector('.match-sparkle');
    expect(button.dataset.wasReady).toBe('true');
    expect(sparkle).not.toBeNull();
  });
});
