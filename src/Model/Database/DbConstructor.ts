// Responsible to create the database and tables

import { Character } from "../Character/Character";
import placeholder_db from "../../placeholder_db.json";


export abstract class json_db {


    // Creates a character in the database
    public static create_character(char: Character): void {
        // Updates the json with the new character
        console.log("asdasd");
        ((placeholder_db.characters)as any).push(char);

    }

    // Updates a character in the database
    public static update_character(char: Character): void {

    }

    // Deletes a character in the database
    public static delete_character(char: Character): void { }

    // Gets a character in the database
    public static get_character(char: Character): void {

    }

    // Gets all characters in the database
    public static get_all_characters(): void {

    }




}