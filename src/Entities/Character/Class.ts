import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Character } from "./Character";

export enum ClassTypesName {
    "Circense", // Trickester, acrobat, jokester
    "Bruxo",    // Witch, sorcerer, wizard, warlock, cleric
    "Salteador",// Thief, rogue, assassin, burglar, bandit
    "Infectomante", // Virulista, Caixeiro
}

@Entity()
export class CClass {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "varchar"})
    cclass: ClassTypesName;

    @Column({ type: 'int'})
    strength: number;

    @Column({ type: 'int'})
    intelligence: number;

    @Column({ type: 'int'})
    dexterity: number;

    @Column({ type: 'int'})
    charisma: number;

    @Column({ type: 'int'})
    spirit: number;

    @Column({ type: 'int'})
    luck: number;

    @Column({ type: 'int'})
    talent: number;

    @OneToMany(() => Character, character => character.cclass)
    characters: Character[];

    constructor(cclass: ClassTypesName, strength: number, intelligence: number, dexterity: number, charisma: number, spirit: number, luck: number, talent: number) {
        this.cclass = cclass;
        this.strength = strength;
        this.intelligence = intelligence;
        this.dexterity = dexterity;
        this.charisma = charisma;
        this.spirit = spirit;
        this.luck = luck;
        this.talent = talent;
    }
}

