import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOutbox1782838915570 implements MigrationInterface {
    name = 'AddOutbox1782838915570'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "outbox_message" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "platformId" varchar NOT NULL, "platform" varchar NOT NULL, "messageType" varchar NOT NULL, "content" text NOT NULL, "metadata" text, "status" varchar NOT NULL DEFAULT ('pending'), "retryCount" integer NOT NULL DEFAULT (0), "maxRetries" integer NOT NULL DEFAULT (3), "lastAttempt" datetime, "errorMessage" varchar, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "sentAt" datetime, "priority" integer NOT NULL DEFAULT (10))`);
        await queryRunner.query(`CREATE INDEX "IDX_8bbef33374146c2a83ae7d3703" ON "outbox_message" ("platformId") `);
        await queryRunner.query(`CREATE INDEX "IDX_2b7077b71347613fa48fadd916" ON "outbox_message" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_a6cecd1574a133ac03abcfdeb7" ON "outbox_message" ("priority") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_a6cecd1574a133ac03abcfdeb7"`);
        await queryRunner.query(`DROP INDEX "IDX_2b7077b71347613fa48fadd916"`);
        await queryRunner.query(`DROP INDEX "IDX_8bbef33374146c2a83ae7d3703"`);
        await queryRunner.query(`DROP TABLE "outbox_message"`);
    }

}
