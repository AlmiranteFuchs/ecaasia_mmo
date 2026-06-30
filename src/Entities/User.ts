import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Character } from "./Character/Character";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({type: 'varchar'})
  username: string;

  @Column({type: 'varchar'})
  phonenumber: number;

  @Column({type: 'varchar', nullable: true})
  email: string | null;

  @Column({type: 'varchar'})
  password: string;

  @OneToMany(() => Character, character => character.user)
    characters: Character[];
  
}
