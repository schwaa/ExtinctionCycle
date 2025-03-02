export const COLOR_SKILLS = {
  red: 'fire_strike',
  blue: 'ice_shield',
  green: 'heal',
  yellow: 'thunder',
  purple: 'curse'
};

export const CONFIG = {
  GRID: {
    SIZE: 7,
    COLORS: ['red', 'blue', 'green', 'yellow', 'purple']
  },
  
  MATCH_POWER: {
    THREE: 25,
    FOUR: 50,
    FIVE: 100
  },
  
  SKILLS: {
    red: {
      id: 'fire_strike',
      name: 'Fire Strike',
      powerRequired: 100,
      baseDamage: 50,
      description: 'Deals fire damage to enemy'
    },
    blue: {
      id: 'ice_shield',
      name: 'Ice Shield',
      powerRequired: 75,
      defenseBonus: 1.5,
      duration: 3,
      description: 'Increases defense for 3 turns'
    },
    green: {
      id: 'heal',
      name: 'Nature\'s Healing',
      powerRequired: 50,
      healAmount: 30,
      description: 'Restores HP'
    },
    yellow: {
      id: 'thunder',
      name: 'Thunder Bolt',
      powerRequired: 75,
      baseDamage: 40,
      description: 'Deals lightning damage'
    },
    purple: {
      id: 'curse',
      name: 'Dark Curse',
      powerRequired: 100,
      attackReduction: 0.7,
      description: 'Reduces enemy attack'
    }
  },

  CHARACTERS: {
    PLAYER: {
      maxHp: 100,
      baseAttack: 10,
      baseDefense: 5
    },
    ENEMY: {
      maxHp: 80,
      baseAttack: 8,
      baseDefense: 3
    }
  },

  COMBAT: {
    TURN_TIME: 15,
    ENEMY_DAMAGE: 10,
    MATCH_DELAY: 150
  }
};
