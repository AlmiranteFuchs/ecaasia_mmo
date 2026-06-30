import { AppDataSource } from "../data-source";
import { TravelService } from "../Services/TravelService";
import { CombatService } from "../Services/CombatService";
import { CharacterService } from "../Services/CharacterService";

// Game scheduler - runs periodic tasks like travel completion, combat rounds, regeneration

export class GameScheduler {
    private travelService: TravelService;
    private combatService: CombatService;
    private characterService: CharacterService;

    private intervalId: NodeJS.Timeout | null = null;
    private isRunning = false;

    // Tick intervals (in milliseconds)
    private readonly TRAVEL_CHECK_INTERVAL = 5000; // Check travel every 5s
    private readonly COMBAT_TICK_INTERVAL = 2000; // Combat rounds every 2s
    private readonly REGEN_TICK_INTERVAL = 10000; // Regen every 10s

    constructor() {
        this.travelService = new TravelService();
        this.combatService = new CombatService();
        this.characterService = new CharacterService();
    }

    // Start the scheduler
    start(): void {
        if (this.isRunning) {
            console.log("GameScheduler already running");
            return;
        }

        this.isRunning = true;
        console.log("GameScheduler started");

        // Travel completion check
        this.intervalId = setInterval(async () => {
            await this.checkTravelCompletions();
        }, this.TRAVEL_CHECK_INTERVAL);

        // Combat rounds
        setInterval(async () => {
            await this.processCombatRounds();
        }, this.COMBAT_TICK_INTERVAL);

        // Regeneration
        setInterval(async () => {
            await this.processRegeneration();
        }, this.REGEN_TICK_INTERVAL);
    }

    // Stop the scheduler
    stop(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isRunning = false;
        console.log("GameScheduler stopped");
    }

    // Check for completed travels and trigger arrival
    private async checkTravelCompletions(): Promise<void> {
        try {
            const completedTravels = await this.travelService.getCompletedTravels();

            for (const travel of completedTravels) {
                await this.travelService.completeTravel(
                    travel.id,
                    travel.platform as any,
                    travel.platformId
                );
            }
        } catch (error) {
            console.error("Error checking travel completions:", error);
        }
    }

    // Process combat rounds for active combats
    private async processCombatRounds(): Promise<void> {
        try {
            await this.combatService.processCombatRound();
        } catch (error) {
            console.error("Error processing combat rounds:", error);
        }
    }

    // Process HP/Mana/Energy regeneration for all characters
    private async processRegeneration(): Promise<void> {
        try {
            await this.characterService.regenerateAllCharacters();
        } catch (error) {
            console.error("Error processing regeneration:", error);
        }
    }
}
