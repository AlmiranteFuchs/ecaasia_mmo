// This represents interactables that can be found in a place, may be simple objects or complex events

export class Interactable {
    constructor(public id: number, public name: string, public description: string, public type: InteractableTypes) { }

    // [ Default functions ]
    

    // [ Abstract ] //
}

export enum InteractableTypes {
    "Chest", // Chest
    "Locked-Door", // Locked door
    "Unlocked-Door", // Unlocked door
    "NPC", // Non-player character
    "Monster", // Simple monster
    "Event", // Complex event
    "Object", // Simple static object or obstacle
    "Trap", // Damage, status effect, etc
    "Quest", // Quest giver
    "Shop", // Shop
    "Portal", // Teleport to another place
    "Entrance", // Local entrance
    "Exit", // Local exit
}