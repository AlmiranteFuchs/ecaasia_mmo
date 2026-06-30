import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Inventory } from "./Inventory";
import { ClassTypesName } from "../Character/Class";

export enum ItemType {
    CONSUMABLE = "consumable",  // Potions, food, scrolls
    EQUIPPABLE = "equippable",  // Weapons, armor, accessories
    INERT = "inert",            // Quest items, keys, materials
}

@Entity()
export class Item {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar' })
    name: string;

    @Column({ type: 'text' })
    description: string;

    @Column({ type: 'varchar' })
    type: ItemType;

    // Stack size (1 for unique items, higher for consumables/materials)
    @Column({ type: 'int', default: 1 })
    maxStackSize: number;

    // Value in gold
    @Column({ type: 'int', default: 0 })
    value: number;

    // Equip requirements (null if not equippable)
    @Column({ type: 'int', nullable: true })
    levelReq: number;

    @Column({ type: 'int', nullable: true })
    xpReq: number;

    @Column({ type: 'varchar', nullable: true })
    classReq: ClassTypesName;

    // Equipment slot (if equippable)
    @Column({ type: 'varchar', nullable: true })
    equipSlot: EquipSlot;

    // Stats bonuses (if equippable)
    @Column({ type: 'int', default: 0 })
    bonusStrength: number;

    @Column({ type: 'int', default: 0 })
    bonusIntelligence: number;

    @Column({ type: 'int', default: 0 })
    bonusDexterity: number;

    @Column({ type: 'int', default: 0 })
    bonusCharisma: number;

    @Column({ type: 'int', default: 0 })
    bonusSpirit: number;

    @Column({ type: 'int', default: 0 })
    bonusLuck: number;

    @Column({ type: 'int', default: 0 })
    bonusTalent: number;

    @Column({ type: 'int', default: 0 })
    bonusMaxHealth: number;

    @Column({ type: 'int', default: 0 })
    bonusMaxEnergy: number;

    @Column({ type: 'int', default: 0 })
    bonusMaxMana: number;

    @Column({ type: 'int', default: 0 })
    bonusMaxSpirit: number;

    // Consumable effects (if consumable)
    @Column({ type: 'int', default: 0 })
    healAmount: number;

    @Column({ type: 'int', default: 0 })
    manaRestore: number;

    @Column({ type: 'int', default: 0 })
    energyRestore: number;

    // Inventory instances of this item
    @OneToMany(() => Inventory, inventory => inventory.item)
    inventoryItems: Inventory[];

    // Check if character can equip this item
    canEquip(characterLevel: number, characterXp: number, characterClass: ClassTypesName): boolean {
        if (this.type !== ItemType.EQUIPPABLE) return false;
        if (this.levelReq && characterLevel < this.levelReq) return false;
        if (this.xpReq && characterXp < this.xpReq) return false;
        if (this.classReq && characterClass !== this.classReq) return false;
        return true;
    }
}

export enum EquipSlot {
    WEAPON = "weapon",
    ARMOR = "armor",
    HELMET = "helmet",
    GLOVES = "gloves",
    BOOTS = "boots",
    RING = "ring",
    AMULET = "amulet",
    ACCESSORY = "accessory",
}
