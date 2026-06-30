import { Repository, DataSource } from "typeorm";
import { AppDataSource } from "../data-source";
import { User } from "../Entities/User";
import { PlatformLink } from "../Entities/Auth/PlatformLink";
import { Character } from "../Entities/Character/Character";
import { Platform } from "../Adapters/BaseAdapter";

export interface AuthResult {
    success: boolean;
    message: string;
    user?: User;
}

export class AuthService {
    private userRepo: Repository<User>;
    private platformLinkRepo: Repository<PlatformLink>;
    private characterRepo: Repository<Character>;

    constructor(dataSource?: DataSource) {
        const ds = dataSource || AppDataSource;
        this.userRepo = ds.getRepository(User);
        this.platformLinkRepo = ds.getRepository(PlatformLink);
        this.characterRepo = ds.getRepository(Character);
    }

    // Register a new user
    async register(username: string, password: string, email?: string): Promise<AuthResult> {
        // Check if username already exists
        const existingUser = await this.userRepo.findOne({ where: { username } });
        if (existingUser) {
            return {
                success: false,
                message: "❌ Username already exists",
            };
        }

        // Create new user
        const user = new User();
        user.username = username;
        user.password = password; // TODO: Hash password in production
        user.email = email || null;

        await this.userRepo.save(user);

        return {
            success: true,
            message: `✅ User "${username}" registered successfully`,
            user,
        };
    }

    // Login with username and password
    async login(username: string, password: string): Promise<AuthResult> {
        const user = await this.userRepo.findOne({ where: { username } });
        
        if (!user) {
            return {
                success: false,
                message: "❌ User not found",
            };
        }

        // Simple password check (TODO: Use bcrypt in production)
        if (user.password !== password) {
            return {
                success: false,
                message: "❌ Invalid password",
            };
        }

        return {
            success: true,
            message: `✅ Logged in as "${username}"`,
            user,
        };
    }

    // Link a platform ID to a user (for auth from messaging platforms)
    async linkPlatform(user: User, platform: Platform, platformId: string): Promise<void> {
        // Check if link already exists
        const existingLink = await this.platformLinkRepo.findOne({
            where: { platform: platform as any, platformId },
        });

        if (existingLink) {
            // Update existing link
            existingLink.user = user;
            existingLink.isActive = true;
            existingLink.linkedAt = new Date();
            await this.platformLinkRepo.save(existingLink);
        } else {
            // Create new link
            const link = new PlatformLink();
            link.user = user;
            link.platform = platform as any;
            link.platformId = platformId;
            link.isActive = true;
            link.linkedAt = new Date();
            await this.platformLinkRepo.save(link);
        }
    }

    // Resolve user from platform ID
    async getUserByPlatformId(platform: Platform, platformId: string): Promise<User | null> {
        const link = await this.platformLinkRepo.findOne({
            where: { platform: platform as any, platformId, isActive: true },
            relations: ["user"],
        });

        return link?.user || null;
    }

    // Get all characters for a user
    async getUserCharacters(user: User): Promise<Character[]> {
        return this.characterRepo.find({
            where: { user: { id: user.id } },
            relations: ["currentPlace", "race", "cclass"],
        });
    }

    // Get user's active character (first one, or could add selection logic)
    async getActiveCharacter(user: User): Promise<Character | null> {
        const characters = await this.getUserCharacters(user);
        return characters.length > 0 ? characters[0] : null;
    }

    // List user's characters
    async listCharacters(user: User): Promise<string> {
        const characters = await this.getUserCharacters(user);

        if (characters.length === 0) {
            return "No characters found. Use /create-character to create one.";
        }

        let display = `👤 **${user.username}'s Characters**\n\n`;
        characters.forEach((char, index) => {
            display += `${index + 1}. **${char.name}** - ${char.title}\n`;
            display += `   🎭 ${char.race?.race || "Unknown"} ${char.cclass?.cclass || "Unknown"}\n`;
            display += `   📊 Level ${char.level} | ${char.curr_xp} XP\n`;
            display += `   📍 ${char.currentPlace?.name || "Unknown"}\n\n`;
        });

        return display;
    }
}
