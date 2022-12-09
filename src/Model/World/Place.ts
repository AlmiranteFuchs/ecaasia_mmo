// This represents a place where a player can go to and interact with.

export abstract class Place {
    constructor(public id: number, public name: string, public description: string, public type: PlaceTypes, public place: Place) { }

    // Matrix of places
    public readonly abstract _places: Place[][];

}

export enum PlaceTypes {
    "Cidade",
    "Floresta",
    "Montanha",
    "Praia",
    "Deserto",
    "Masmorra",
    "Caverna",
    "Castelo",
    "Templo",
    "Ruínas",
    "Pântano",
    "Lago",
    "Rio",
    "Mina",
}

export interface Position {
    x: number;
    y: number;
}