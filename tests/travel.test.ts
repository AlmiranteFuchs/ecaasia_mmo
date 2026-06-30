import { TestDataSource } from "./setup";
import { seedTestData } from "./fixtures/seedData";
import { Character } from "../src/Entities/Character/Character";
import { Place } from "../src/Entities/World/Place";
import { TravelState } from "../src/Entities/Character/TravelState";

describe("Travel System", () => {
    let character: Character;
    let places: Record<string, Place>;

    beforeEach(async () => {
        const data = await seedTestData(TestDataSource);
        character = data.character;
        places = data.places;
    });

    describe("Distance Calculation", () => {
        it("should calculate distance between two points", () => {
            const dist = Place.calculateDistance(0, 0, 3, 4);
            expect(dist).toBe(5); // 3-4-5 triangle
        });

        it("should calculate distance from character to place", () => {
            // Character at (50, 50), church at (10, 10)
            const dist = places.church.distanceFrom(character.local_x, character.local_y);
            // sqrt((50-10)^2 + (50-10)^2) = sqrt(3200) ≈ 56.57
            expect(dist).toBeCloseTo(56.57, 1);
        });

        it("should calculate distance between sibling places", () => {
            // Church at (10, 10), market at (30, 20)
            const dist = places.church.distanceToPlace(places.market);
            // sqrt((30-10)^2 + (20-10)^2) = sqrt(500) ≈ 22.36
            expect(dist).toBeCloseTo(22.36, 1);
        });
    });

    describe("Place Hierarchy", () => {
        it("should have correct parent-child relationships", async () => {
            const cityWithChildren = await TestDataSource.getRepository(Place).findOne({
                where: { id: places.city.id },
                relations: ["children", "parent"],
            });

            expect(cityWithChildren?.parent?.id).toBe(places.desert.id);
            expect(cityWithChildren?.children?.length).toBe(2); // church + market
        });

        it("should get region from nested place", async () => {
            const basement = await TestDataSource.getRepository(Place).findOne({
                where: { id: places.basement.id },
                relations: ["parent", "parent.parent", "parent.parent.parent"],
            });

            // basement -> church -> city -> desert
            expect(basement?.parent?.id).toBe(places.church.id);
            expect(basement?.parent?.parent?.id).toBe(places.city.id);
            expect(basement?.parent?.parent?.parent?.id).toBe(places.desert.id);
        });

        it("should identify regions correctly", () => {
            expect(places.desert.isRegion).toBe(true);
            expect(places.city.isRegion).toBe(false);
            expect(places.church.isRegion).toBe(false);
        });

        it("should have correct depth levels", () => {
            expect(places.desert.depth).toBe(0);
            expect(places.city.depth).toBe(1);
            expect(places.church.depth).toBe(2);
            expect(places.basement.depth).toBe(3);
        });
    });

    describe("Travel State", () => {
        it("should calculate current position during travel", () => {
            const travel = new TravelState();
            travel.startX = 0;
            travel.startY = 0;
            travel.totalDistance = 100;
            travel.speed = 1;
            travel.startedAt = new Date(Date.now() - 50000); // 50 seconds ago
            travel.estimatedArrival = new Date(Date.now() + 50000); // 50 seconds from now
            travel.isActive = true;
            travel.destination = places.church;

            const pos = travel.getCurrentPosition();
            
            // Should be halfway (50% progress)
            expect(pos.x).toBeCloseTo(5, 0); // 50% of 10
            expect(pos.y).toBeCloseTo(5, 0); // 50% of 10
        });

        it("should report correct progress percentage", () => {
            const travel = new TravelState();
            travel.startedAt = new Date(Date.now() - 30000); // 30 seconds ago
            travel.estimatedArrival = new Date(Date.now() + 70000); // 70 seconds from now
            travel.isActive = true;

            const progress = travel.getProgress();
            expect(progress).toBe(30); // 30%
        });

        it("should report remaining time", () => {
            const travel = new TravelState();
            travel.estimatedArrival = new Date(Date.now() + 45000); // 45 seconds from now
            travel.isActive = true;

            const remaining = travel.getRemainingSeconds();
            expect(remaining).toBeCloseTo(45, 0);
        });

        it("should detect completed travel", () => {
            const completedTravel = new TravelState();
            completedTravel.estimatedArrival = new Date(Date.now() - 1000); // 1 second ago
            completedTravel.isActive = true;

            expect(completedTravel.isComplete()).toBe(true);

            const ongoingTravel = new TravelState();
            ongoingTravel.estimatedArrival = new Date(Date.now() + 10000);
            ongoingTravel.isActive = true;

            expect(ongoingTravel.isComplete()).toBe(false);
        });
    });

    describe("Character Position", () => {
        it("should start at correct position", () => {
            expect(character.local_x).toBe(50);
            expect(character.local_y).toBe(50);
        });

        it("should be in the city", async () => {
            const charWithPlace = await TestDataSource.getRepository(Character).findOne({
                where: { id: character.id },
                relations: ["currentPlace"],
            });

            expect(charWithPlace?.currentPlace?.id).toBe(places.city.id);
        });
    });
});
