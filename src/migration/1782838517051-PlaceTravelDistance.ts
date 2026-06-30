import { MigrationInterface, QueryRunner } from "typeorm";

export class PlaceTravelDistance1782838517051 implements MigrationInterface {
    name = 'PlaceTravelDistance1782838517051'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "temporary_place" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "description" varchar NOT NULL, "type" varchar NOT NULL, "grid_x" integer, "grid_y" integer, "width" integer NOT NULL DEFAULT (1), "height" integer NOT NULL DEFAULT (1), "isRegion" boolean NOT NULL DEFAULT (0), "depth" integer NOT NULL DEFAULT (0), "parentId" integer, "travelDistance" integer NOT NULL DEFAULT (10), "baseTravelTime" integer NOT NULL DEFAULT (60), CONSTRAINT "FK_96048d4d34bf33f8064161ba37e" FOREIGN KEY ("parentId") REFERENCES "place" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_place"("id", "name", "description", "type", "grid_x", "grid_y", "width", "height", "isRegion", "depth", "parentId") SELECT "id", "name", "description", "type", "grid_x", "grid_y", "width", "height", "isRegion", "depth", "parentId" FROM "place"`);
        await queryRunner.query(`DROP TABLE "place"`);
        await queryRunner.query(`ALTER TABLE "temporary_place" RENAME TO "place"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "place" RENAME TO "temporary_place"`);
        await queryRunner.query(`CREATE TABLE "place" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "description" varchar NOT NULL, "type" varchar NOT NULL, "grid_x" integer, "grid_y" integer, "width" integer NOT NULL DEFAULT (1), "height" integer NOT NULL DEFAULT (1), "isRegion" boolean NOT NULL DEFAULT (0), "depth" integer NOT NULL DEFAULT (0), "parentId" integer, CONSTRAINT "FK_96048d4d34bf33f8064161ba37e" FOREIGN KEY ("parentId") REFERENCES "place" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "place"("id", "name", "description", "type", "grid_x", "grid_y", "width", "height", "isRegion", "depth", "parentId") SELECT "id", "name", "description", "type", "grid_x", "grid_y", "width", "height", "isRegion", "depth", "parentId" FROM "temporary_place"`);
        await queryRunner.query(`DROP TABLE "temporary_place"`);
    }

}
