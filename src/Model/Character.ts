import { Race } from "./Race";
import _ from "lodash";

export abstract class Character {
    constructor(name: string, title: string, race: Race, appearance: string) {
        this._name = name;
        this._title = title;
        this._race = race;
        this._appearance = char_Create_Appearance(appearance);
        this._max_health = 0;
        this._curr_health = 0;
        this._max_energy = 0;
        this._curr_energy = 0;
        this._max_mana = 0;
        this._curr_mana = 0;
        this._max_spirit = 0;
        this._curr_spirit = 0;
        this._level = 0;
        this._curr_xp = 0;
        this._xp = 0;
        this._strength = 0, this._intelligence = 0, this._dexterity = 0;
        this._charisma = 0, this._spirit = 0, this._luck = 0, this._talent = 0

        //TODO: SET ALL --> by level || DB 

    }

    protected _name: string;
    protected _title: string;
    protected _race: Race;
    protected _appearance: char_AppearanceI;
    //Class

    // [ Stats ] //
    protected _max_health: number;
    protected _curr_health: number;

    protected _max_energy: number;
    protected _curr_energy: number;

    protected _max_mana: number;
    protected _curr_mana: number;

    protected _max_spirit: number;
    protected _curr_spirit: number;

    protected _level: number;
    protected _curr_xp: number;
    private _xp: number;


    // [ Attributes  ]
    // [ Primary Attributes ]
    private _strength: number;           // Default 
    private _intelligence: number;       // Problem Solvinhg, skill checks etc
    private _dexterity: number;          // Default
    // [ Secondary Attributes ]
    private _charisma: number;           // Default + charm etc
    private _spirit: number;             // Stubborness ( in a good way ), resistance etc
    private _luck: number;               // Default
    private _talent: number;             // Ease to learn, xp boost etc


    protected get intelligence(): number { return this._intelligence; }
    protected set intelligence(value: number) { this._intelligence = Math.min(Math.max(value, 0), 200); }

    protected get dexterity(): number { return this._dexterity; }
    protected set dexterity(value: number) { this._dexterity = Math.min(Math.max(value, 0), 200); }

    protected get strength(): number { return this._strength; }
    protected set strength(value: number) { this._strength = Math.min(Math.max(value, 0), 200); }

    protected get charisma(): number { return this._charisma; }
    protected set charisma(value: number) { this._charisma = Math.min(Math.max(value, 0), 200); }

    protected get spirit(): number { return this._spirit; }
    protected set spirit(value: number) { this._spirit = Math.min(Math.max(value, 0), 200); }

    protected get luck(): number { return this._luck; }
    protected set luck(value: number) { this._luck = Math.min(Math.max(value, 0), 200); }

    protected get talent(): number { return this._talent; }
    protected set talent(value: number) { this._talent = Math.min(Math.max(value, 0), 10); }


    protected get max_health(): number { return this._max_health; }
    protected set max_health(value: number) { this._max_health = Math.min(Math.max(value, 1), 90000); }

    protected get max_energy(): number { return this._max_energy; }
    protected set max_energy(value: number) { this._max_energy = Math.min(Math.max(value, 0), 90000); }

    protected get max_mana(): number { return this._max_mana; }
    protected set max_mana(value: number) { this._max_mana = Math.min(Math.max(value, 0), 90000); }

    protected get max_spirit(): number { return this._max_spirit; }
    protected set max_spirit(value: number) { this._max_spirit = Math.min(Math.max(value, 0), 90000); }

    protected get level(): number { return this._level; }
    protected set level(value: number) { this._level = Math.min(Math.max(value, 0), 100); }

    protected get xp(): number { return this._xp; }
    protected set xp(value: number) {
        //The amount of XP for leveling up
        let level_xp_amount = Math.round((4 * (this._level ^ 3)) / 5);
        let local_xp_amount = this._xp + value;

        if (local_xp_amount >= level_xp_amount) {

            this._xp = level_xp_amount - local_xp_amount;
            this._level++;
            return;
        }
        this._xp += value;
    }
    protected set level(value: number) {
        this._level = value;
    }
    protected get talent(): number {
        return this._talent;
    }
    protected set talent(value: number) {
        this._talent = value;
    }


}