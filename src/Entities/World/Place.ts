// This represents a place where a player can go to and interact with.

export class Place {
    constructor(public id: number, public name: string, public description: string,
        public type: PlaceTypes, public start_pos:Position, public ending_pos:Position) { }

    // Matrix of places
    public readonly _places: Place[][] | undefined;


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

export type Position = {
    x: number;
    y: number;
};