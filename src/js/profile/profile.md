# Extinction Cycle: Skill & Abilities System Design

## Core Functionality of the Player Profile Functions

### Skill Acquisition System
- Players start with only basic "Melee Strike" skill (red color)
- New skills are discovered/learned through gameplay (finding items, completing missions, etc.)
- Skills are collected in the player's "Skill Collection" and can be equipped in color-specific slots

### Color-Based Skill System
- Five distinct mana colors: Red, Blue, Green, Yellow, Purple
- Each skill belongs to exactly one color
- Players must equip one skill per color in dedicated slots
- Similar skill types (e.g., melee attacks) can exist in different color variants

### Skill Collection & Equipment
- "Skill Collection" serves as an inventory of all discovered skills
- "Equipped Skills" section shows the five currently active skills (one per color)
- Players can swap skills of the same color in and out based on strategic needs
- Empty color slots indicate the need to discover skills of that color

## User Interaction

### Skill Management
- Click on a color slot to see available skills of that color
- Select a skill from collection to equip it in the corresponding slot
- "Manage Skills" option provides a full-screen view of all skills and slots
- Skills may have level requirements or attribute prerequisites

### Skill Integration with Match-3
- Matching tiles of specific colors charges skills of the corresponding color
- For example, matching red tiles charges the equipped red skill
- This creates strategic decisions about which skills to equip based on their effects and colors

### Passive Skill System
- Single passive skill slot that provides ongoing benefits
- Initially empty until the player discovers their first passive ability
- Passive skills don't require matching tiles to activate
- Can be swapped when new passives are discovered

### Visual Representation
- Skills visually coded by their color (border color, indicator)
- Empty slots clearly show which color they correspond to
- Skill collection shows all acquired skills with their type and color
- Recently acquired skills highlighted for the player

## Skill Categories

### Offensive Skills
- Direct damage skills (strikes, blasts, etc.)
- Area effect attacks
- Status effect attacks (poison, burn, etc.)

### Defensive Skills
- Shields and barriers
- Healing abilities
- Status cleansing

### Utility Skills
- Board manipulation (swap tiles, change colors)
- Buff abilities (increase damage, defense)
- Resource generation

## Skill Discovery Methods

### Combat Rewards
- Defeating special enemies
- Completing boss battles
- Survival challenges

### Exploration
- Finding skill scrolls/books
- Discovering ancient artifacts
- Unlocking sealed containers

### Crafting/Combining
- Combining basic skills to create advanced ones
- Using special resources with existing skills
- Skill evolution through repeated use

## Implementation Considerations

### Balance
- Each color should have skills of varying types (offensive, defensive, utility)
- Higher rarity skills should be powerful but not game-breaking
- Consider mana cost vs. effect for each skill

### Progression
- Early game: Focus on filling empty color slots with basic skills
- Mid game: Replace basic skills with more powerful alternatives
- Late game: Strategic selection from a wide variety of options per color

### UI/UX
- Clear visual distinction between colors
- Easy-to-understand skill assignment process
- Satisfying feedback when acquiring new skills

### Player Attributes
- The player can change their name
- The player can spend skill points from this page