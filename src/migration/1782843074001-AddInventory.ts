import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInventory1782843074001 implements MigrationInterface {
    name = 'AddInventory1782843074001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "item" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "description" text NOT NULL, "type" varchar NOT NULL, "maxStackSize" integer NOT NULL DEFAULT (1), "value" integer NOT NULL DEFAULT (0), "levelReq" integer, "xpReq" integer, "classReq" varchar, "equipSlot" varchar, "bonusStrength" integer NOT NULL DEFAULT (0), "bonusIntelligence" integer NOT NULL DEFAULT (0), "bonusDexterity" integer NOT NULL DEFAULT (0), "bonusCharisma" integer NOT NULL DEFAULT (0), "bonusSpirit" integer NOT NULL DEFAULT (0), "bonusLuck" integer NOT NULL DEFAULT (0), "bonusTalent" integer NOT NULL DEFAULT (0), "bonusMaxHealth" integer NOT NULL DEFAULT (0), "bonusMaxEnergy" integer NOT NULL DEFAULT (0), "bonusMaxMana" integer NOT NULL DEFAULT (0), "bonusMaxSpirit" integer NOT NULL DEFAULT (0), "healAmount" integer NOT NULL DEFAULT (0), "manaRestore" integer NOT NULL DEFAULT (0), "energyRestore" integer NOT NULL DEFAULT (0))`);
        await queryRunner.query(`CREATE TABLE "inventory" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "slot" integer NOT NULL, "quantity" integer NOT NULL DEFAULT (1), "isEquipped" boolean NOT NULL DEFAULT (0), "acquiredAt" datetime, "durability" integer, "maxDurability" integer, "characterId" integer, "itemId" integer)`);
        await queryRunner.query(`CREATE TABLE "temporary_inventory" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "slot" integer NOT NULL, "quantity" integer NOT NULL DEFAULT (1), "isEquipped" boolean NOT NULL DEFAULT (0), "acquiredAt" datetime, "durability" integer, "maxDurability" integer, "characterId" integer, "itemId" integer, CONSTRAINT "FK_d17886753b1e97f07b62af39aab" FOREIGN KEY ("characterId") REFERENCES "character" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_6227c61eff466680f9bb9933305" FOREIGN KEY ("itemId") REFERENCES "item" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_inventory"("id", "slot", "quantity", "isEquipped", "acquiredAt", "durability", "maxDurability", "characterId", "itemId") SELECT "id", "slot", "quantity", "isEquipped", "acquiredAt", "durability", "maxDurability", "characterId", "itemId" FROM "inventory"`);
        await queryRunner.query(`DROP TABLE "inventory"`);
        await queryRunner.query(`ALTER TABLE "temporary_inventory" RENAME TO "inventory"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inventory" RENAME TO "temporary_inventory"`);
        await queryRunner.query(`CREATE TABLE "inventory" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "slot" integer NOT NULL, "quantity" integer NOT NULL DEFAULT (1), "isEquipped" boolean NOT NULL DEFAULT (0), "acquiredAt" datetime, "durability" integer, "maxDurability" integer, "characterId" integer, "itemId" integer)`);
        await queryRunner.query(`INSERT INTO "inventory"("id", "slot", "quantity", "isEquipped", "acquiredAt", "durability", "maxDurability", "characterId", "itemId") SELECT "id", "slot", "quantity", "isEquipped", "acquiredAt", "durability", "maxDurability", "characterId", "itemId" FROM "temporary_inventory"`);
        await queryRunner.query(`DROP TABLE "temporary_inventory"`);
        await queryRunner.query(`DROP TABLE "inventory"`);
        await queryRunner.query(`DROP TABLE "item"`);
    }

}
