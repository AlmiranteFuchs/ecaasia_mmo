import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { Character } from "../Entities/Character/Character";
import { Place } from "../Entities/World/Place";
import { TravelState } from "../Entities/Character/TravelState";
import { OutboxService } from "../Outbox/OutboxService";
import { MessageType } from "../Outbox/OutboxMessage";
import { Platform } from "../Adapters/BaseAdapter";
import { CharacterService } from "./CharacterService";

export interface TravelResult {
    success: boolean;
    message: string;
    travelTime?: number; // seconds
}

export class TravelService {
    private placeRepo: Repository<Place>;
    private travelRepo: Repository<TravelState>;
    private outboxService: OutboxService;
    private characterService: CharacterService;

    // Base speed: units per second (can be modified by mounts, skills, etc.)
    private readonly BASE_SPEED = 1;

    constructor() {
        this.placeRepo = AppDataSource.getRepository(Place);
        this.travelRepo = AppDataSource.getRepository(TravelState);
        this.outboxService = new OutboxService();
        this.characterService = new CharacterService();
    }

    // Start travel to a destination
    async startTravel(character: Character, destinationName: string, platform: Platform, platformId: string): Promise<TravelResult> {
        // Check if already traveling
        const existingTravel = await this.getActiveTravel(character);
        if (existingTravel) {
            return {
                success: false,
                message: `⏳ You're already traveling to **${existingTravel.destination.name}**.\n` +
                    `⏱️ ${existingTravel.getRemainingSeconds()}s remaining.\n\n` +
                    `Use /cancel to stop.`,
            };
        }

        // Find destination - must be a sibling or child of current place
        const destination = await this.findAccessibleDestination(character, destinationName);
        if (!destination) {
            const accessible = await this.getAccessiblePlaceNames(character);
            return {
                success: false,
                message: `❌ You don't see any place called "${destinationName}" from here.\n\n` +
                    `📍 Available places:\n${accessible.map(n => `• ${n}`).join('\n')}`,
            };
        }

        // Calculate distance and travel time
        const distance = Place.calculateDistance(
            character.local_x, character.local_y,
            destination.pos_x, destination.pos_y
        );
        const speed = this.getCharacterSpeed(character);
        const travelTime = Math.round(distance / speed);

        // Create travel state
        const travel = new TravelState();
        travel.character = character;
        travel.destination = destination;
        travel.startedAt = new Date();
        travel.startX = character.local_x;
        travel.startY = character.local_y;
        travel.totalDistance = distance;
        travel.speed = speed;
        travel.estimatedArrival = new Date(Date.now() + travelTime * 1000);
        travel.isActive = true;
        travel.platform = platform;
        travel.platformId = platformId;

        await this.travelRepo.save(travel);

        // Schedule arrival check
        this.scheduleArrivalCheck(travel.id, travelTime, platform, platformId);

        return {
            success: true,
            message: `🚶 You begin traveling to **${destination.name}**...\n` +
                `⏱️ Arrival in ~${this.formatTime(travelTime)}`,
            travelTime,
        };
    }

    // Cancel active travel - updates position to current progress
    async cancelTravel(character: Character): Promise<TravelResult> {
        const travel = await this.getActiveTravel(character);
        if (!travel) {
            return {
                success: false,
                message: `❌ You're not traveling anywhere.`,
            };
        }

        // Get current position (partial progress)
        const currentPos = travel.getCurrentPosition();

        // Update character position
        await this.characterService.setPosition(character, currentPos.x, currentPos.y);

        // Deactivate travel
        travel.isActive = false;
        await this.travelRepo.save(travel);

        const progress = travel.getProgress();

        return {
            success: true,
            message: `🛑 Travel canceled.\n` +
                `📍 You stopped ${progress}% of the way to **${travel.destination.name}**.\n` +
                `Position: (${currentPos.x}, ${currentPos.y})`,
        };
    }

    // Complete travel - called when arrival time is reached
    async completeTravel(travelId: number, platform: Platform, platformId: string): Promise<void> {
        const travel = await this.travelRepo.findOne({
            where: { id: travelId },
            relations: ['character', 'destination', 'destination.children'],
        });

        if (!travel || !travel.isActive) return;

        const character = travel.character;
        const destination = travel.destination;

        // Update character position and current place
        await this.characterService.arriveAtPlace(character, destination);

        // Deactivate travel
        travel.isActive = false;
        await this.travelRepo.save(travel);

        // Build arrival message
        let message = `📍 You have arrived at **${destination.name}**\n\n`;
        message += `_${destination.description}_\n\n`;

        // Show subplaces if any
        const subplaces = destination.children || [];
        if (subplaces.length > 0) {
            message += `🚪 Places here:\n`;
            for (const sub of subplaces) {
                const dist = Place.calculateDistance(character.local_x, character.local_y, sub.pos_x, sub.pos_y);
                const time = Math.round(dist / this.getCharacterSpeed(character));
                message += `• **${sub.name}** (~${this.formatTime(time)})\n`;
            }
        }

        // Queue the arrival message
        await this.outboxService.queueMessage(
            platformId,
            platform,
            MessageType.TRAVEL,
            message,
            { priority: 5 } // High priority
        );
    }

    // Get active travel for a character
    async getActiveTravel(character: Character): Promise<TravelState | null> {
        return this.travelRepo.findOne({
            where: { character: { id: character.id }, isActive: true },
            relations: ['destination'],
        });
    }

    // Get all completed travels for scheduler processing
    async getCompletedTravels(): Promise<TravelState[]> {
        return this.travelRepo
            .createQueryBuilder("travel")
            .where("travel.isActive = :isActive", { isActive: true })
            .andWhere("travel.estimatedArrival <= :now", { now: new Date() })
            .getMany();
    }

    // Find a destination that's accessible from current location
    private async findAccessibleDestination(character: Character, name: string): Promise<Place | null> {
        const currentPlace = await this.placeRepo.findOne({
            where: { id: character.currentPlace?.id },
            relations: ['children', 'parent', 'parent.children'],
        });

        if (!currentPlace) return null;

        const searchName = name.toLowerCase();

        // Can travel to children of current place
        for (const child of currentPlace.children || []) {
            if (child.name.toLowerCase().includes(searchName)) {
                return child;
            }
        }

        // Can travel to siblings (other children of parent)
        if (currentPlace.parent) {
            for (const sibling of currentPlace.parent.children || []) {
                if (sibling.id !== currentPlace.id && sibling.name.toLowerCase().includes(searchName)) {
                    return sibling;
                }
            }
        }

        // Can travel back to parent
        if (currentPlace.parent && currentPlace.parent.name.toLowerCase().includes(searchName)) {
            return currentPlace.parent;
        }

        return null;
    }

    // Get names of accessible places
    private async getAccessiblePlaceNames(character: Character): Promise<string[]> {
        const currentPlace = await this.placeRepo.findOne({
            where: { id: character.currentPlace?.id },
            relations: ['children', 'parent', 'parent.children'],
        });

        if (!currentPlace) return [];

        const names: string[] = [];

        // Children
        for (const child of currentPlace.children || []) {
            names.push(child.name);
        }

        // Siblings
        if (currentPlace.parent) {
            for (const sibling of currentPlace.parent.children || []) {
                if (sibling.id !== currentPlace.id) {
                    names.push(sibling.name);
                }
            }
            // Parent
            names.push(`${currentPlace.parent.name} (back)`);
        }

        return names;
    }

    // Get character's travel speed (can be modified by mounts, buffs, etc.)
    private getCharacterSpeed(character: Character): number {
        // TODO: Add mount/buff modifiers
        return this.BASE_SPEED;
    }

    // Schedule arrival check
    private scheduleArrivalCheck(travelId: number, delaySeconds: number, platform: Platform, platformId: string): void {
        setTimeout(async () => {
            await this.completeTravel(travelId, platform, platformId);
        }, delaySeconds * 1000);
    }

    // Format seconds to human readable
    private formatTime(seconds: number): string {
        if (seconds < 60) return `${seconds}s`;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
    }
}
