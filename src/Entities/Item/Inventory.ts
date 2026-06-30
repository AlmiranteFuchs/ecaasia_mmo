import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Character } from "../Character/Character";
import { Item } from "./Item";

// Inventory entity - links a character to an item instance
// Each inventory entry represents an item in a specific slot

@Entity()
export class Inventory {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Character)
    @JoinColumn()
    character: Character;

    @ManyToOne(() => Item)
    @JoinColumn()
    item: Item;

    // Slot position (1-100)
    @Column({ type: 'int' })
    slot: number;

    // Quantity (for stackable items)
    @Column({ type: 'int', default: 1 })
    quantity: number;

    // Is this item currently equipped?
    @Column({ type: 'boolean', default: false })
    isEquipped: boolean;

    // Timestamp when item was acquired
    @Column({ type: 'datetime', nullable: true })
    acquiredAt: Date;

    // Durability (for equipment)
    @Column({ type: 'int', nullable: true })
    durability: number;

    @Column({ type: 'int', nullable: true })
    maxDurability: number;
}
