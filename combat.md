Combat system requirements:

1. Core Turn Structure:
- Player and Enemy alternate turns
- Player turn lasts 15 seconds
- Player can match gems during their turn
- Enemy performs one attack on their turn

2. Match-3 Power System:
- Match 3 gems = 1 power
- Match 4 gems = 5 power
- Match 5 gems = 15 power
- Power accumulates for each color (red, blue, green, yellow, purple)
- Power persists between turns until used
- Each skill requires specific power amount to use

3. Combat Flow:
- Player's Turn:
  * Can match gems to gain power
  * Can use skills if enough power
  * power shows as a percentage ready, and when ready is clickable.
  * Turn ends when timer expires or skill used
  * Grid locked after skill use until turn ends
- Enemy's Turn:
  * Deals set damage amount
  * Grid locked during enemy turn

4. Skills:
- Each color has associated skill
- Skills become usable when power threshold met
- Using skill consumes all power of that color
- Skills have different effects (damage, heal, defense, debuff, utility)

5. Victory/Defeat:
- Win when enemy HP is =< 0
- Lose when player HP is =< 0
- Show appropriate victory/defeat screen
- Return to base after combat ends
