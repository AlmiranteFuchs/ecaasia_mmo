import { Character } from "./Model/Character/Character";
import { Race, RaceTypesName } from "./Model/Character/Race";
import { CClass, ClassTypesName } from "./Model/Character/Class";

import { json_db } from "./Model/Database/DbConstructor";

const race = new Race(RaceTypesName.Assombronata, 0, 0, 0, 0, 0, 0, 0);
const classs = new CClass(ClassTypesName.Bruxo, 0, 0, 0, 0, 0, 0, 0);

const char = new Character("Teste", "Knight", race, classs, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,"Gordo");

json_db.create_character(char);
