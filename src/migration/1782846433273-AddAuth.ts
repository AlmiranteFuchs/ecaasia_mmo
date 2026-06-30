import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAuth1782846433273 implements MigrationInterface {
    name = 'AddAuth1782846433273'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "temporary_user" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "username" varchar NOT NULL, "phonenumber" varchar NOT NULL, "email" varchar NOT NULL, "password" varchar NOT NULL)`);
        await queryRunner.query(`INSERT INTO "temporary_user"("id", "username", "phonenumber", "email", "password") SELECT "id", "username", "phonenumber", "email", "password" FROM "user"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`ALTER TABLE "temporary_user" RENAME TO "user"`);
        await queryRunner.query(`CREATE TABLE "platform_link" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "platform" varchar NOT NULL, "platformId" varchar NOT NULL, "linkedAt" datetime, "isActive" boolean NOT NULL DEFAULT (1), "userId" integer)`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_71a6afb4df5a0053a2d52a5da0" ON "platform_link" ("platform", "platformId") `);
        await queryRunner.query(`CREATE TABLE "temporary_user" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "username" varchar NOT NULL, "phonenumber" varchar NOT NULL, "email" varchar, "password" varchar NOT NULL)`);
        await queryRunner.query(`INSERT INTO "temporary_user"("id", "username", "phonenumber", "email", "password") SELECT "id", "username", "phonenumber", "email", "password" FROM "user"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`ALTER TABLE "temporary_user" RENAME TO "user"`);
        await queryRunner.query(`DROP INDEX "IDX_71a6afb4df5a0053a2d52a5da0"`);
        await queryRunner.query(`CREATE TABLE "temporary_platform_link" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "platform" varchar NOT NULL, "platformId" varchar NOT NULL, "linkedAt" datetime, "isActive" boolean NOT NULL DEFAULT (1), "userId" integer, CONSTRAINT "FK_f18ca3f2eb7b77be8c00f6f1474" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_platform_link"("id", "platform", "platformId", "linkedAt", "isActive", "userId") SELECT "id", "platform", "platformId", "linkedAt", "isActive", "userId" FROM "platform_link"`);
        await queryRunner.query(`DROP TABLE "platform_link"`);
        await queryRunner.query(`ALTER TABLE "temporary_platform_link" RENAME TO "platform_link"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_71a6afb4df5a0053a2d52a5da0" ON "platform_link" ("platform", "platformId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_71a6afb4df5a0053a2d52a5da0"`);
        await queryRunner.query(`ALTER TABLE "platform_link" RENAME TO "temporary_platform_link"`);
        await queryRunner.query(`CREATE TABLE "platform_link" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "platform" varchar NOT NULL, "platformId" varchar NOT NULL, "linkedAt" datetime, "isActive" boolean NOT NULL DEFAULT (1), "userId" integer)`);
        await queryRunner.query(`INSERT INTO "platform_link"("id", "platform", "platformId", "linkedAt", "isActive", "userId") SELECT "id", "platform", "platformId", "linkedAt", "isActive", "userId" FROM "temporary_platform_link"`);
        await queryRunner.query(`DROP TABLE "temporary_platform_link"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_71a6afb4df5a0053a2d52a5da0" ON "platform_link" ("platform", "platformId") `);
        await queryRunner.query(`ALTER TABLE "user" RENAME TO "temporary_user"`);
        await queryRunner.query(`CREATE TABLE "user" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "username" varchar NOT NULL, "phonenumber" varchar NOT NULL, "email" varchar NOT NULL, "password" varchar NOT NULL)`);
        await queryRunner.query(`INSERT INTO "user"("id", "username", "phonenumber", "email", "password") SELECT "id", "username", "phonenumber", "email", "password" FROM "temporary_user"`);
        await queryRunner.query(`DROP TABLE "temporary_user"`);
        await queryRunner.query(`DROP INDEX "IDX_71a6afb4df5a0053a2d52a5da0"`);
        await queryRunner.query(`DROP TABLE "platform_link"`);
        await queryRunner.query(`ALTER TABLE "user" RENAME TO "temporary_user"`);
        await queryRunner.query(`CREATE TABLE "user" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "username" varchar NOT NULL, "phonenumber" varchar NOT NULL, "email" varchar NOT NULL, "password" varchar NOT NULL)`);
        await queryRunner.query(`INSERT INTO "user"("id", "username", "phonenumber", "email", "password") SELECT "id", "username", "phonenumber", "email", "password" FROM "temporary_user"`);
        await queryRunner.query(`DROP TABLE "temporary_user"`);
    }

}
