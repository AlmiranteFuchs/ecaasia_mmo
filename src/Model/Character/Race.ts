export class Race {
    protected _race: RaceTypesName;

    constructor(race: RaceTypesName, strength: number, intelligence: number, dexterity: number, charisma: number, spirit: number, luck: number, talent: number) {
        this._race = race;
        this._strength = strength;
        this._intelligence = intelligence;
        this._dexterity = dexterity;
        this._charisma = charisma;
        this._spirit = spirit;
        this._luck = luck;
        this._talent = talent;

    }

    // Default race attributes
    // [ Primary Attributes Bônus ]
    protected _strength: number;           // Default 
    protected _intelligence: number;       // Problem Solvinhg, skill checks etc
    protected _dexterity: number;          // Default
    // [ Secondary Attributes Bônus ]
    protected _charisma: number;           // Default + charm etc
    protected _spirit: number;             // Stubborness ( in a good way ), resistance etc
    protected _luck: number;               // Default
    protected _talent: number;             // Ease to learn, xp boost etc

}

export enum RaceTypesName {
    "Humano",       //Default
    "Elfo",         //Default
    "Goblin",       //Default
    "Mekanomata",   //Mecânico
    "Dragonata",    //Default
    "Transformata", //Shapeshifter
    "Vieralinha",   //Biopunk
    "Assombronata"  //Demon/Shadow
}