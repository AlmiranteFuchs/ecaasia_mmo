import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Race } from "./Race";
import { CClass } from "./Class";
import { User } from "../User";

@Entity()
export class Character {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({type: 'varchar'})
    name: string;

    @Column({type: 'varchar'})
    title: string;

    @Column({type: 'varchar'})
    appearance: string;

    @Column({type: 'int'})
    position_x: number;

    @Column({type: 'int'})
    position_y: number;

    // [ Stats ] //
    @Column({ type: 'int' })
    max_health: number;

    @Column({ type: 'int' })
    curr_health: number;

    @Column({ type: 'int' })
    max_energy: number;

    @Column({ type: 'int' })
    curr_energy: number;

    @Column({ type: 'int' })
    max_mana: number;

    @Column({ type: 'int' })
    curr_mana: number;

    @Column({ type: 'int' })
    max_spirit: number;

    @Column({ type: 'int' })
    curr_spirit: number;

    @Column({ type: 'int' })
    level: number;

    @Column({ type: 'int' })
    curr_xp: number;

    @Column({ type: 'int' })
    private xp: number;

    // [ Attributes ]
    @Column({ type: 'int' })
    private strength: number;

    @Column({ type: 'int' })
    private intelligence: number;

    @Column({ type: 'int' })
    private dexterity: number;

    @Column({ type: 'int' })
    private charisma: number;

    @Column({ type: 'int' })
    private spirit: number;

    @Column({ type: 'int' })
    private luck: number;

    @Column({ type: 'int' })
    private talent: number;


    @ManyToOne(() => Race)
    race: Race;

    @ManyToOne(() => CClass)
    cclass: CClass;

    @ManyToOne(() => User, user => user.characters)
    user: User;


    // [ Getters and Setters ] //

    get intelligenceValue(): number { return this.intelligence; }
    set intelligenceValue(value: number) { this.intelligence = Math.min(Math.max(value, 0), 200); }

    get dexterityValue(): number { return this.dexterity; }
    set dexterityValue(value: number) { this.dexterity = Math.min(Math.max(value, 0), 200); }

    get strengthValue(): number { return this.strength; }
    set strengthValue(value: number) { this.strength = Math.min(Math.max(value, 0), 200); }

    get charismaValue(): number { return this.charisma; }
    set charismaValue(value: number) { this.charisma = Math.min(Math.max(value, 0), 200); }

    get spiritValue(): number { return this.spirit; }
    set spiritValue(value: number) { this.spirit = Math.min(Math.max(value, 0), 200); }

    get luckValue(): number { return this.luck; }
    set luckValue(value: number) { this.luck = Math.min(Math.max(value, 0), 200); }

    get talentValue(): number { return this.talent; }
    set talentValue(value: number) { this.talent = Math.min(Math.max(value, 0), 10); }

    get maxHealthValue(): number { return this.max_health; }
    set maxHealthValue(value: number) { this.max_health = Math.min(Math.max(value, 1), 90000); }

    get maxEnergyValue(): number { return this.max_energy; }
    set maxEnergyValue(value: number) { this.max_energy = Math.min(Math.max(value, 0), 90000); }

    get maxManaValue(): number { return this.max_mana; }
    set maxManaValue(value: number) { this.max_mana = Math.min(Math.max(value, 0), 90000); }

    get maxSpiritValue(): number { return this.max_spirit; }
    set maxSpiritValue(value: number) { this.max_spirit = Math.min(Math.max(value, 0), 90000); }

    get levelValue(): number { return this.level; }
    set levelValue(value: number) { this.level = Math.min(Math.max(value, 0), 100); }

    get xpValue(): number { return this.xp; }
    set xpValue(value: number) {
        let level_xp_amount = Math.round((4 * Math.pow(this.level, 3)) / 5);
        let local_xp_amount = this.xp + value;

        if (local_xp_amount >= level_xp_amount) {
            this.xp = local_xp_amount - level_xp_amount;
            this.level++;
        } else {
            this.xp += value;
        }
    }
}
