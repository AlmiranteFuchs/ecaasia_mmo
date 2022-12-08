//Circo class, trickster etc

export class CClass {

    constructor(cclass: ClassTypesName, strength: number, intelligence: number, dexterity: number, charisma: number, spirit: number, luck: number, talent: number) {
        this._cclass = cclass;
        this._strength = strength;
        this._intelligence = intelligence;
        this._dexterity = dexterity;
        this._charisma = charisma;
        this._spirit = spirit;
        this._luck = luck;
        this._talent = talent;

    }

    // Default class attributes
    // [ Primary Attributes Bônus ]
    protected _strength: number;           // Default 
    protected _intelligence: number;       // Problem Solvinhg, skill checks etc
    protected _dexterity: number;          // Default
    // [ Secondary Attributes Bônus ]
    protected _charisma: number;           // Default + charm etc
    protected _spirit: number;             // Stubborness ( in a good way ), resistance etc
    protected _luck: number;               // Default
    protected _talent: number;             // Ease to learn, xp boost etc

    protected _cclass: ClassTypesName;



}

export enum ClassTypesName {
    "Circense", // Trickester, acrobat, jokester
    "Bruxo",    // Witch, sorcerer, wizard, warlock, cleric
    "Salteador",// Thief, rogue, assassin, burglar, bandit
    "Trovador", // Bard, minstrel, musician, poet, singer
    "Pirata", // Pirate, buccaneer, corsair, marauder, raider
    "Pútrido", // Zombie, ghoul, ghoul, ghoul, ghoul
    "Vândalo", // Barbarian, berserker, brute, savage, warrior
}