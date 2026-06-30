import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { Character } from "../Entities/Character/Character";
import { Place } from "../Entities/World/Place";

// Centralized service for character state management

export class CharacterService {
    private characterRepo: Repository<Character>;
    private placeRepo: Repository<Place>;

    constructor() {
        this.characterRepo = AppDataSource.getRepository(Character);
        this.placeRepo = AppDataSource.getRepository(Place);
    }

    // Update character's local position within current place
    async updatePosition(character: Character, x: number, y: number): Promise<Character> {
        character.local_x = x;
        character.local_y = y;
        return this.characterRepo.save(character);
    }

    // Move character to a new place (sets position to place's pos)
    async moveToPlace(character: Character, place: Place): Promise<Character> {
        character.currentPlace = place;
        character.local_x = place.pos_x;
        character.local_y = place.pos_y;
        return this.characterRepo.save(character);
    }

    // Update position and place together (for travel completion)
    async arriveAtPlace(character: Character, place: Place): Promise<Character> {
        character.currentPlace = place;
        character.local_x = place.pos_x;
        character.local_y = place.pos_y;
        return this.characterRepo.save(character);
    }

    // Update position only (for travel cancel, knockback, etc.)
    async setPosition(character: Character, x: number, y: number): Promise<Character> {
        character.local_x = x;
        character.local_y = y;
        return this.characterRepo.save(character);
    }

    // Get character with relations loaded
    async getCharacterWithPlace(characterId: number): Promise<Character | null> {
        return this.characterRepo.findOne({
            where: { id: characterId },
            relations: ['currentPlace', 'currentPlace.children', 'currentPlace.parent', 'race', 'cclass'],
        });
    }

    // Get character's current place with full relations
    async getCurrentPlace(character: Character): Promise<Place | null> {
        if (!character.currentPlace?.id) return null;

        return this.placeRepo.findOne({
            where: { id: character.currentPlace.id },
            relations: ['children', 'parent', 'parent.children'],
        });
    }

    // Check if character can access a place (is it a child, sibling, or parent?)
    async canAccessPlace(character: Character, targetPlace: Place): Promise<boolean> {
        const currentPlace = await this.getCurrentPlace(character);
        if (!currentPlace) return false;

        // Can access children
        if (currentPlace.children?.some(c => c.id === targetPlace.id)) {
            return true;
        }

        // Can access parent
        if (currentPlace.parent?.id === targetPlace.id) {
            return true;
        }

        // Can access siblings
        if (currentPlace.parent?.children?.some(c => c.id === targetPlace.id && c.id !== currentPlace.id)) {
            return true;
        }

        return false;
    }

    // Calculate distance from character to a place
    getDistanceToPlace(character: Character, place: Place): number {
        return Place.calculateDistance(
            character.local_x, character.local_y,
            place.pos_x, place.pos_y
        );
    }

    // Regenerate HP/Mana/Energy for all characters
    async regenerateAllCharacters(): Promise<void> {
        const characters = await this.characterRepo.find();
        
        for (const char of characters) {
            let updated = false;

            // Regen HP (5% per tick)
            if (char.curr_health < char.max_health) {
                const regen = Math.floor(char.max_health * 0.05);
                char.curr_health = Math.min(char.max_health, char.curr_health + regen);
                updated = true;
            }

            // Regen Mana (10% per tick)
            if (char.curr_mana < char.max_mana) {
                const regen = Math.floor(char.max_mana * 0.10);
                char.curr_mana = Math.min(char.max_mana, char.curr_mana + regen);
                updated = true;
            }

            // Regen Energy (15% per tick)
            if (char.curr_energy < char.max_energy) {
                const regen = Math.floor(char.max_energy * 0.15);
                char.curr_energy = Math.min(char.max_energy, char.curr_energy + regen);
                updated = true;
            }

            if (updated) {
                await this.characterRepo.save(char);
            }
        }
    }
}
