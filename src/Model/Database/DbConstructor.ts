// Responsible to create the database and tables

import { Character } from "../Character/Character";
import fs from "fs/promises";

export abstract class json_db {

    private static json: string = "src/placeholder_db.json";

    // Creates a character in the database
    public static async create_character(char: Character): Promise<boolean> {
        console.log("DB: Creating new character: ", char._name);

        // Read the file
        const data = await fs.readFile(this.json, "utf-8");

        const json = JSON.parse(data);

        // Check if the character already exists
        const exists = json.characters.find((c: Character) => c.id === char.id);

        if (exists) {
            console.log("DB: Character already exists");
            return false;
        }

        // Add the new character
        json.characters.push(char);

        // Write the file
        await fs.writeFile(this.json, JSON.stringify(json)).catch(err => {
            console.log("DB: Error writing file: ", err);
            return false;
        });

        console.log("DB: Character created successfully");
        return true;
    }

    // Updates a character in the database
    public static async update_character(char: Character): Promise<boolean> {
        console.log("DB: Updating character: ", char._name);

        // Read the file
        const data = await fs.readFile(this.json, "utf-8");

        const json = JSON.parse(data);

        // Check if the character already exists
        const exists = json.characters.find((c: Character) => c.id === char.id);

        if (!exists) {
            console.log("DB: Character doesn't exists");
            return false;
        }

        // Update the character
        json.characters = json.characters.map((c: Character) => {
            if (c.id === char.id) {
                return char;
            }
            return c;
        });

        // Write the file
        await fs.writeFile(this.json, JSON.stringify(json)).catch(err => {
            console.log("DB: Error writing file: ", err);
            return false;
        });


        console.log("DB: Character updated successfully");
        return false;
    }

    // Deletes a character in the database
    public static delete_character(char: Character): void {
        throw new Error("Method not implemented.");
    }

    // Gets a character in the database
    public static async get_character(char_id: number): Promise<Character | null> {
        console.log("DB: Getting character via id: ", char_id);

        // Read the file
        const data = await fs.readFile(this.json, "utf-8");

        const json = JSON.parse(data);

        // Check if the character already exists
        const exists = json.characters.find((c: Character) => c.id === char_id);

        if (!exists) {
            console.log("DB: Character doesn't exists");
            return null;
        }

        return exists;
    }

    // Gets all characters in the database
    public static get_all_characters(): void {
        throw new Error("Method not implemented.");
    }




}