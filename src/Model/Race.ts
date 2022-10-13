export abstract class Race {
    protected _race: RaceTypesName;

    constructor(race: RaceTypesName) {
        this._race = race;
    }

    // Default race attributes
    // [ Primary Attributes Bônus ]
    protected abstract _strength: number;           // Default 
    protected abstract _intelligence: number;       // Problem Solvinhg, skill checks etc
    protected abstract _dexterity: number;          // Default
    // [ Secondary Attributes Bônus ]
    protected abstract _charisma: number;           // Default + charm etc
    protected abstract _spirit: number;             // Stubborness ( in a good way ), resistance etc
    protected abstract _luck: number;               // Default
    protected abstract _talent: number;             // Ease to learn, xp boost etc

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