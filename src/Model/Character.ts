import { Race } from "./Race";
import _ from "lodash";

export interface char_AppearanceI {
  face: string;
  torso: string;
  arms: string;
  feet: string;
  other: string;
}

export const char_default_Appearance: char_AppearanceI = {
  face: "Uma máscara de pano oculta sua face",
  torso: "Uma longa vestimenta de trapos",
  arms: "Longas mangas escondem seus braços",
  feet: "Sua vestimenta cobre seus pés",
  other: "",
};

abstract class Character {
    constructor(name: string, race: Race, appearance: char_AppearanceI) {
        this._name = name;
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
        this._strength = 0, this._intelligence = 0, this._dexterity = 0;
        this._charisma = 0, this._spirit = 0, this._luck = 0, this._talent = 0

        //TODO: SET ALL --> by level || DB 

    }

    protected _name: string;
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


    protected get strength(): number {
        return this._strength;
    }
    protected set strength(value: number) {
        this._strength = value;
    }
    protected get intelligence(): number {
        return this._intelligence;
    }
    protected set intelligence(value: number) {
        this._intelligence = value;
    }
    protected get dexterity(): number {
        return this._dexterity;
    }
    protected set dexterity(value: number) {
        this._dexterity = value;
    }
    protected get charisma(): number {
        return this._charisma;
    }
    protected set charisma(value: number) {
        this._charisma = value;
    }
    protected get spirit(): number {
        return this._spirit;
    }
    protected set spirit(value: number) {
        this._spirit = value;
    }
    protected get luck(): number {
        return this._luck;
    }
    protected set luck(value: number) {
        this._luck = value;
    }



    protected get max_health(): number {
        return this._max_health;
    }
    protected set max_health(value: number) {
        this._max_health = value;
    }

    protected get max_energy(): number {
        return this._max_energy;
    }
    protected set max_energy(value: number) {
        this._max_energy = value;
    }

    protected get max_mana(): number {
        return this._max_mana;
    }
    protected set max_mana(value: number) {
        this._max_mana = value;
    }

    protected get max_spirit(): number {
        return this._max_spirit;
    }
    protected set max_spirit(value: number) {
        this._max_spirit = value;
    }

    protected get level(): number {
        return this._level;
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

function char_Create_Appearance(_char_app: char_AppearanceI){
  for (var k in _char_app) {
    _char_app[k as keyof char_AppearanceI] = _char_app[
      k as keyof char_AppearanceI
    ]
      ? _char_app[k as keyof char_AppearanceI]
      : char_default_Appearance[k as keyof char_AppearanceI];
  }
  return _char_app;
}