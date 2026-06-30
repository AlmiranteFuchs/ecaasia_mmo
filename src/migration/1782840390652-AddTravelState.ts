import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTravelState1782840390652 implements MigrationInterface {
    name = 'AddTravelState1782840390652'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "travel_state" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "startedAt" datetime NOT NULL, "startX" integer NOT NULL, "startY" integer NOT NULL, "estimatedArrival" datetime NOT NULL, "totalDistance" float NOT NULL, "speed" float NOT NULL, "isActive" boolean NOT NULL DEFAULT (1), "characterId" integer, "destinationId" integer, CONSTRAINT "REL_77461934730bcd54c4cc3a911f" UNIQUE ("characterId"))`);
        await queryRunner.query(`CREATE TABLE "temporary_travel_state" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "startedAt" datetime NOT NULL, "startX" integer NOT NULL, "startY" integer NOT NULL, "estimatedArrival" datetime NOT NULL, "totalDistance" float NOT NULL, "speed" float NOT NULL, "isActive" boolean NOT NULL DEFAULT (1), "characterId" integer, "destinationId" integer, CONSTRAINT "REL_77461934730bcd54c4cc3a911f" UNIQUE ("characterId"), CONSTRAINT "FK_77461934730bcd54c4cc3a911fc" FOREIGN KEY ("characterId") REFERENCES "character" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_7c0d40ff8c391c0b1b08ce986a3" FOREIGN KEY ("destinationId") REFERENCES "place" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_travel_state"("id", "startedAt", "startX", "startY", "estimatedArrival", "totalDistance", "speed", "isActive", "characterId", "destinationId") SELECT "id", "startedAt", "startX", "startY", "estimatedArrival", "totalDistance", "speed", "isActive", "characterId", "destinationId" FROM "travel_state"`);
        await queryRunner.query(`DROP TABLE "travel_state"`);
        await queryRunner.query(`ALTER TABLE "temporary_travel_state" RENAME TO "travel_state"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "travel_state" RENAME TO "temporary_travel_state"`);
        await queryRunner.query(`CREATE TABLE "travel_state" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "startedAt" datetime NOT NULL, "startX" integer NOT NULL, "startY" integer NOT NULL, "estimatedArrival" datetime NOT NULL, "totalDistance" float NOT NULL, "speed" float NOT NULL, "isActive" boolean NOT NULL DEFAULT (1), "characterId" integer, "destinationId" integer, CONSTRAINT "REL_77461934730bcd54c4cc3a911f" UNIQUE ("characterId"))`);
        await queryRunner.query(`INSERT INTO "travel_state"("id", "startedAt", "startX", "startY", "estimatedArrival", "totalDistance", "speed", "isActive", "characterId", "destinationId") SELECT "id", "startedAt", "startX", "startY", "estimatedArrival", "totalDistance", "speed", "isActive", "characterId", "destinationId" FROM "temporary_travel_state"`);
        await queryRunner.query(`DROP TABLE "temporary_travel_state"`);
        await queryRunner.query(`DROP TABLE "travel_state"`);
    }

}
