import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, ManyToOne } from "typeorm";
import { Character } from "./Character";
import { Place } from "../World/Place";

// Tracks active travel for a character
// When traveling, position updates incrementally toward destination

@Entity()
export class TravelState {
    @PrimaryGeneratedColumn()
    id: number;

    @OneToOne(() => Character)
    @JoinColumn()
    character: Character;

    @ManyToOne(() => Place)
    destination: Place;

    // Travel start info
    @Column({ type: 'datetime' })
    startedAt: Date;

    @Column({ type: 'int' })
    startX: number;

    @Column({ type: 'int' })
    startY: number;

    // Expected arrival
    @Column({ type: 'datetime' })
    estimatedArrival: Date;

    // Total distance and speed for this journey
    @Column({ type: 'float' })
    totalDistance: number;

    @Column({ type: 'float' })
    speed: number; // units per second

    // Is this travel active?
    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    // Platform info for async notifications
    @Column({ type: 'varchar', nullable: true })
    platform: string;

    @Column({ type: 'varchar', nullable: true })
    platformId: string;

    // Calculate current position based on elapsed time
    getCurrentPosition(): { x: number; y: number } {
        if (!this.isActive) {
            return { x: this.startX, y: this.startY };
        }

        const now = new Date();
        const elapsed = (now.getTime() - this.startedAt.getTime()) / 1000; // seconds
        const distanceTraveled = elapsed * this.speed;
        const progress = Math.min(distanceTraveled / this.totalDistance, 1);

        // Linear interpolation toward destination
        const destX = this.destination.pos_x;
        const destY = this.destination.pos_y;

        return {
            x: Math.round(this.startX + (destX - this.startX) * progress),
            y: Math.round(this.startY + (destY - this.startY) * progress),
        };
    }

    // Check if travel is complete
    isComplete(): boolean {
        return new Date() >= this.estimatedArrival;
    }

    // Get remaining time in seconds
    getRemainingSeconds(): number {
        const now = new Date();
        const remaining = (this.estimatedArrival.getTime() - now.getTime()) / 1000;
        return Math.max(0, Math.round(remaining));
    }

    // Get progress as percentage
    getProgress(): number {
        const now = new Date();
        const total = this.estimatedArrival.getTime() - this.startedAt.getTime();
        const elapsed = now.getTime() - this.startedAt.getTime();
        return Math.min(100, Math.round((elapsed / total) * 100));
    }
}
