import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Character } from "./Character";

export enum RaceTypesName {
    Humano = "Humano",
    Elfo = "Elfo",
    Goblin = "Goblin",
    Mekanomata = "Mekanomata",
    Transformata = "Transformata",
    Vieralinha = "Vieralinha",
    Assombronata = "Assombronata",
}

@Entity()
export class Race {
    @PrimaryGeneratedColumn()
    id: number; // Add a primary key

    @Column({ type: "varchar" })
    race: RaceTypesName;

    @Column({ type: 'int' })
    strength: number;

    @Column({ type: 'int' })
    intelligence: number;

    @Column({ type: 'int' })
    dexterity: number;

    @Column({ type: 'int' })
    charisma: number;

    @Column({ type: 'int' })
    spirit: number;

    @Column({ type: 'int' })
    luck: number;

    @Column({ type: 'int' })
    talent: number;

    @OneToMany(() => Character, character => character.race)
    characters: Character[];
}
