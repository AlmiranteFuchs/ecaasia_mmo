import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Character } from "../Character/Character";

export enum CombatStatus {
    ACTIVE = "active",
    VICTORY = "victory",
    DEFEAT = "defeat",
    FLED = "fled",
}

@Entity()
export class CombatState {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Character)
    @JoinColumn()
    character: Character;

    // Enemy info (for now, stored as JSON - later can be separate entity)
    @Column({ type: 'varchar' })
    enemyName: string;

    @Column({ type: 'int' })
    enemyMaxHealth: number;

    @Column({ type: 'int' })
    enemyCurrHealth: number;

    @Column({ type: 'int' })
    enemyAttack: number;

    @Column({ type: 'int' })
    enemyDefense: number;

    @Column({ type: 'int' })
    enemyXpReward: number;

    @Column({ type: 'int', nullable: true })
    enemyGoldReward: number;

    // Combat state
    @Column({ type: 'varchar', default: CombatStatus.ACTIVE })
    status: CombatStatus;

    @Column({ type: 'datetime' })
    startedAt: Date;

    @Column({ type: 'datetime' })
    lastActionAt: Date;

    @Column({ type: 'int' })
    round: number;

    // Combat log (JSON array of combat events)
    @Column({ type: 'text', nullable: true })
    combatLog: string;

    // Platform info for async notifications
    @Column({ type: 'varchar', nullable: true })
    platform: string;

    @Column({ type: 'varchar', nullable: true })
    platformId: string;

    // Add combat event to log
    addLogEvent(event: string): void {
        const log = this.combatLog ? JSON.parse(this.combatLog) : [];
        log.push({
            round: this.round,
            event,
            timestamp: new Date().toISOString(),
        });
        this.combatLog = JSON.stringify(log);
    }

    // Get combat log as readable string
    getCombatLog(limit: number = 10): string {
        if (!this.combatLog) return "";
        const log = JSON.parse(this.combatLog);
        const recent = log.slice(-limit);
        return recent.map((e: any) => `[R${e.round}] ${e.event}`).join("\n");
    }

    // Check if combat is active
    isActive(): boolean {
        return this.status === CombatStatus.ACTIVE;
    }

    // Check if enemy is dead
    isEnemyDead(): boolean {
        return this.enemyCurrHealth <= 0;
    }

    // Check if player is dead (would need character relation)
    async isPlayerDead(): Promise<boolean> {
        // This would check character.curr_health <= 0
        // For now, return false
        return false;
    }
}
