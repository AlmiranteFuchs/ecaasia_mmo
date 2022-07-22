export class Race {
    protected _race: RaceTypesName;                 //Race Tyoe

    constructor(race:RaceTypesName) {
        this._race = race;
    }


    //TODO: Implement race atributes
}

export enum RaceTypesName  {
    "Humano",       //Default
    "Elfo",         //Default
    "Goblin",       //Default
    "Mekanomata",   //Mecânico
    "Dragonata",    //Default
    "Transformata", //Shapeshifter
    "Vieralinha",   //Biopunk

}