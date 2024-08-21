import "reflect-metadata"; // This should be at the top of your main file
import { DataSource } from "typeorm";
import { User } from "./Entities/User";
import { Character } from "./Entities/Character/Character";
import { Race } from "./Entities/Character/Race";
import { CClass } from "./Entities/Character/Class";

export const AppDataSource = new DataSource({
    type: "sqlite",
    database: "database.sqlite",
    entities: [User, Character, Race, CClass],
    migrations: ["src/migration/**/*.ts"],
});

AppDataSource.initialize().then(() => {
    console.log("Data Source has been initialized!");
}).catch((error) => {
    console.error("Error during Data Source initialization:", error);
});
