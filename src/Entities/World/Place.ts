import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne } from "typeorm";
import { Character } from "../Character/Character";

// This represents a place where a player can go to and interact with.
// Places can be nested: Region -> Place -> Subplace -> ...
// Example: Desert (region) -> City -> Church -> Church Basement

@Entity()
export class Place {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar' })
    name: string;

    @Column({ type: 'varchar' })
    description: string;

    @Column({ type: 'varchar' })
    type: PlaceTypes;

    // Is this a top-level region? (e.g., Desert, Forest, Mountain)
    @Column({ type: 'boolean', default: false })
    isRegion: boolean;

    // Depth level: 0 = region, 1 = place, 2 = subplace, etc.
    @Column({ type: 'int', default: 0 })
    depth: number;

    // Grid coordinates - where this place sits on the world grid (mainly for regions)
    @Column({ type: 'int', nullable: true })
    grid_x: number;

    @Column({ type: 'int', nullable: true })
    grid_y: number;

    // Size of the place (for places spanning multiple grid cells)
    @Column({ type: 'int', default: 1 })
    width: number;

    @Column({ type: 'int', default: 1 })
    height: number;

    // Position within parent place (local coordinates)
    @Column({ type: 'int', default: 0 })
    pos_x: number;

    @Column({ type: 'int', default: 0 })
    pos_y: number;

    // Parent place (null for top-level regions)
    @ManyToOne(() => Place, place => place.children, { nullable: true })
    parent: Place | null;

    // Child places (sublocations within this place)
    @OneToMany(() => Place, place => place.parent)
    children: Place[];

    // Characters currently in this place
    @OneToMany(() => Character, character => character.currentPlace)
    characters: Character[];

    // Get the region this place belongs to (traverses up the hierarchy)
    getRegion(): Place {
        if (this.isRegion || !this.parent) return this;
        return this.parent.getRegion();
    }

    // Get visible places (children) a player can travel to from here
    getAccessiblePlaces(): Place[] {
        return this.children || [];
    }

    // Calculate distance between two positions
    static calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }

    // Get distance from a position to this place's position
    distanceFrom(x: number, y: number): number {
        return Place.calculateDistance(x, y, this.pos_x, this.pos_y);
    }

    // Get distance between this place and another place (must be siblings)
    distanceToPlace(other: Place): number {
        return Place.calculateDistance(this.pos_x, this.pos_y, other.pos_x, other.pos_y);
    }
}

export enum PlaceTypes {
    "Cidade",
    "Floresta",
    "Montanha",
    "Praia",
    "Deserto",
    "Masmorra",
    "Caverna",
    "Castelo",
    "Templo",
    "Ruínas",
    "Pântano",
    "Lago",
    "Rio",
    "Mina",
}

export type Position = {
    x: number;
    y: number;
};

// In-memory world grid - loaded from DB on startup
export class WorldGrid {
    private grid: Map<string, Place> = new Map();

    // Load all places from DB and build the grid
    loadPlaces(places: Place[]): void {
        this.grid.clear();
        for (const place of places) {
            // Register all cells this place occupies
            for (let dx = 0; dx < place.width; dx++) {
                for (let dy = 0; dy < place.height; dy++) {
                    const key = this.key(place.grid_x + dx, place.grid_y + dy);
                    this.grid.set(key, place);
                }
            }
        }
    }

    getPlaceAt(x: number, y: number): Place | undefined {
        return this.grid.get(this.key(x, y));
    }

    isValidMove(fromX: number, fromY: number, toX: number, toY: number): boolean {
        // Check if destination has a place and is adjacent
        const dx = Math.abs(toX - fromX);
        const dy = Math.abs(toY - fromY);
        const isAdjacent = (dx <= 1 && dy <= 1) && (dx + dy > 0);
        return isAdjacent && this.grid.has(this.key(toX, toY));
    }

    private key(x: number, y: number): string {
        return `${x},${y}`;
    }
}