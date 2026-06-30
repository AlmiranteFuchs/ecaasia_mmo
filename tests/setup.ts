import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "../src/Entities/User";
import { Character } from "../src/Entities/Character/Character";
import { Race } from "../src/Entities/Character/Race";
import { CClass } from "../src/Entities/Character/Class";
import { Place } from "../src/Entities/World/Place";
import { OutboxMessage } from "../src/Outbox/OutboxMessage";
import { TravelState } from "../src/Entities/Character/TravelState";
import { Item } from "../src/Entities/Item/Item";
import { Inventory } from "../src/Entities/Item/Inventory";
import { CombatState } from "../src/Entities/Combat/CombatState";

// Test database - in-memory SQLite
export const TestDataSource = new DataSource({
    type: "sqlite",
    database: ":memory:",
    entities: [User, Character, Race, CClass, Place, OutboxMessage, TravelState, Item, Inventory, CombatState],
    synchronize: true, // Auto-create tables for tests
    logging: false,
});

// Initialize before all tests
beforeAll(async () => {
    await TestDataSource.initialize();
});

// Clean up after all tests
afterAll(async () => {
    if (TestDataSource.isInitialized) {
        await TestDataSource.destroy();
    }
});

// Clear tables between tests (in correct order for FK constraints)
afterEach(async () => {
    // Disable FK checks, clear all, re-enable
    await TestDataSource.query('PRAGMA foreign_keys = OFF');
    const entities = TestDataSource.entityMetadatas;
    for (const entity of entities) {
        await TestDataSource.query(`DELETE FROM "${entity.tableName}"`);
    }
    await TestDataSource.query('PRAGMA foreign_keys = ON');
});
