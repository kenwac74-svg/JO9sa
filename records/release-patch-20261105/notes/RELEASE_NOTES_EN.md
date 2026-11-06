# 2.4.1 Additional Patch — November 5, 2026

This is an **overwrite patch for the existing Korean edition of Jack o' Nine Tails 2.4.1**. It adjusts action points and the sale economy on Hard, updates character and outfit images, and improves some Korean text and management screens. It requires 2.4.1 and does not contain the complete standalone game. These English notes describe the Korean-edition patch; they do not indicate a new English translation of the game.

## Main updates

### Hard difficulty and the sale economy

- These changes follow **difficulty in the in-game settings**, separately from the difficulty selected during character creation. Base action points on Easy and Normal are unchanged.
- On Hard, base maximum action points for slaves, assistants and private-room occupants are **0, 1, 2, 3, 4 and 5** at endurance levels 0–5. Easy and Normal retain **0, 2, 3, 4, 5 and 5**. The same rule applies when creating or acquiring characters, displaying their AP and restoring it each day. Injuries, half points and existing bonuses are handled separately. The protagonist's AP is unchanged, and switching back to Normal does not immediately refill spent AP.
- On Hard, the **added portion** of designated trait-related sale premiums is halved. For example, Versatile's +25% becomes +12.5%. This does not halve the base price or the entire final payment.
- The forced **6,000/8,000 payment caps** on ordinary sales have been removed. Existing buyer budgets still apply.
- A sales tax applies on Hard only. The result screen shows the gross amount, tax and net payment together. Easy and Normal have no new sales tax.

| Gross sale amount | Tax rate | Example net payment |
| ---: | ---: | ---: |
| Up to 5,999 | 0% | 5,999 → 5,999 |
| 6,000–9,999 | 5% | 6,000 → 5,700 / 9,999 → 9,500 |
| 10,000 or more | 10% | 10,000 → 9,000 |

The rate applies to the **whole gross amount**, rather than only the amount above a threshold. Fractional tax is rounded down. Crossing a threshold can therefore reduce the net payment. New consignment sales add the net amount for each transaction to the balance due; money already owed in an older save is not taxed retroactively or a second time.

### Characters and images

- Reframed and resized full-body images for multiple characters, with corresponding maid outfits adjusted to match. Some portraits and equipment-display images have also been updated.
- Replaced **Felicity's (2572)** default full-body image and matched the head height and character size of her maid, domina and secretary outfits to the new default. Both existing default-image paths are retained.
- Connected image lookup across the older outfit fields and the newer registration format. If a state-specific picture is missing, the game looks for a valid image of the same outfit and can fall back to the default full-body image. This does not unlock outfits that have no registration.
- Separated **Isabella's (2571)** current appearance from the older appearance used by ordinary character **2323**. Shared paths in older saves are also resolved by character identity.
- Connected **Luminous's** clothed recruitment-event image and corrected purchase-menu entries that displayed Tsuki's name.
- Separated the **long brown-haired 2071**, the existing **short light-blue-haired 2324**, and the **short blonde 2340**, with matching full-body images and portraits. 2340 registers the existing blonde appearance as a separate character definition; it is not a newly drawn artwork set.
- Included ordinary character definitions **2339 and 2340**, added since the 2.4.1 release, and updated their random-generation and image connections. Image paths needed by older saves are preserved.

### Korean text and management screens

- Revised some character origins, family, occupation and relationship descriptions, along with name spellings, in Korean. Selected original-language passages stored in older saves are also replaced with Korean when displayed. This is a partial translation update.
- Arranged food, ingredients, potions and furniture/supplies storage in **four columns**, with inventory totals.
- Revised the alchemy room's character placement, **two-column** ingredients and potions displays, and assigned-worker proficiency information.
- Made selected character, medicine and material names consistent across menus, descriptions and older-save displays.
- Improved family and regional reputation controls in the faction-influence cheat menu, together with reputation and residency information.

## Fixes and clearer information

- Repaired selected unique-character full-body, portrait and maid-outfit connections.
- Corrected a trait-key typo for Wilhelmine.
- Matched the S+ promotion notice to the actual requirement of **25**, and clarified the armor requirements for the character entering the colosseum.
- Revised Chaotic Essence's candidate and protected lists. It checks situational candidates when no negative candidate is available; it does not remove every negative trait indiscriminately.
- Corrected a size-condition check involving a specific trait and a missing alignment accumulation connection.

## Installation and existing saves

1. **Close the game.**
2. **Merge the archive's game folder into the existing game folder beside your game executable**, allowing file replacement. Do not delete the entire existing game folder.
3. Read the included **INSTALL_EN.txt**. Confirm that the new named replacement JSON files are present in the same folder, then manually remove only the **25 obsolete JSON filenames** (`1448.json` and `3003.json`–`3026.json`) from the specified location. The replacements retain the same character IDs; do not remove the new named JSON files. If you customized an obsolete JSON file, keep a copy outside the game folder before removing it.
4. Start the game with your existing executable and load your save.

No installer or installation/game-launch script is included. Saves are not automatically deleted or converted with a separate tool. Testing does not cover every existing save or all long-term play routes. When reporting a problem, include the menu, preceding action and relevant save information.

## Other notes

These notes cover **changes since 2.4.1**, rather than repeating the complete 2.3-to-2.4 update history. Changes to separate modding tools are not counted as new game content in this patch.

Korean-edition revision and this patch: **SAnk**. Thanks to Old Huntsman, Graylor's FastQSP, the previous developers, Korean-edition teams and resource contributors. The existing in-game credits provide the detailed acknowledgments.

## Verification scope

The final QSP passed nine required checks in the native engine. Visual checks in the actual game executable, including screens loaded from existing saves, have not been performed.
