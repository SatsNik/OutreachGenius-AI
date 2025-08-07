import { 
  users, brands, influencers, campaigns, outreachMessages,
  type User, type InsertUser,
  type Brand, type InsertBrand,
  type Influencer, type InsertInfluencer,
  type Campaign, type InsertCampaign,
  type OutreachMessage, type InsertOutreachMessage
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Influencers
  getInfluencers(limit?: number): Promise<Influencer[]>;
  getInfluencer(id: string): Promise<Influencer | undefined>;
  createInfluencer(influencer: InsertInfluencer): Promise<Influencer>;
  updateInfluencer(id: string, updates: Partial<Influencer>): Promise<Influencer | undefined>;

  // Outreach Messages
  createOutreachMessage(message: InsertOutreachMessage): Promise<OutreachMessage>;
  getOutreachMessage(id: string): Promise<OutreachMessage | undefined>;
  getOutreachMessagesByInfluencer(influencerId: string): Promise<OutreachMessage[]>;
  updateOutreachMessageStatus(id: string, status: string, sentAt?: Date): Promise<OutreachMessage | undefined>;

  // Brands
  getBrandsByUser(userId: string): Promise<Brand[]>;
  createBrand(brand: InsertBrand): Promise<Brand>;

  // Campaigns
  getCampaignsByUser(userId: string): Promise<Campaign[]>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getInfluencers(limit = 50): Promise<Influencer[]> {
    return await db
      .select()
      .from(influencers)
      .orderBy(desc(influencers.followers))
      .limit(limit);
  }

  async getInfluencer(id: string): Promise<Influencer | undefined> {
    const [influencer] = await db
      .select()
      .from(influencers)
      .where(eq(influencers.id, id));
    return influencer || undefined;
  }

  async createInfluencer(influencer: InsertInfluencer): Promise<Influencer> {
    const [newInfluencer] = await db
      .insert(influencers)
      .values(influencer)
      .returning();
    return newInfluencer;
  }

  async updateInfluencer(id: string, updates: Partial<Influencer>): Promise<Influencer | undefined> {
    const [updatedInfluencer] = await db
      .update(influencers)
      .set(updates)
      .where(eq(influencers.id, id))
      .returning();
    return updatedInfluencer || undefined;
  }

  async createOutreachMessage(message: InsertOutreachMessage): Promise<OutreachMessage> {
    const [newMessage] = await db
      .insert(outreachMessages)
      .values(message)
      .returning();
    return newMessage;
  }

  async getOutreachMessage(id: string): Promise<OutreachMessage | undefined> {
    const [message] = await db
      .select()
      .from(outreachMessages)
      .where(eq(outreachMessages.id, id));
    return message || undefined;
  }

  async getOutreachMessagesByInfluencer(influencerId: string): Promise<OutreachMessage[]> {
    return await db
      .select()
      .from(outreachMessages)
      .where(eq(outreachMessages.influencerId, influencerId))
      .orderBy(desc(outreachMessages.createdAt));
  }

  async updateOutreachMessageStatus(id: string, status: string, sentAt?: Date): Promise<OutreachMessage | undefined> {
    const updates: any = { status };
    if (sentAt) {
      updates.sentAt = sentAt;
    }

    const [updatedMessage] = await db
      .update(outreachMessages)
      .set(updates)
      .where(eq(outreachMessages.id, id))
      .returning();
    return updatedMessage || undefined;
  }

  async getBrandsByUser(userId: string): Promise<Brand[]> {
    return await db
      .select()
      .from(brands)
      .where(eq(brands.userId, userId))
      .orderBy(desc(brands.createdAt));
  }

  async createBrand(brand: InsertBrand): Promise<Brand> {
    const [newBrand] = await db
      .insert(brands)
      .values(brand)
      .returning();
    return newBrand;
  }

  async getCampaignsByUser(userId: string): Promise<Campaign[]> {
    return await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.userId, userId))
      .orderBy(desc(campaigns.createdAt));
  }

  async createCampaign(campaign: InsertCampaign): Promise<Campaign> {
    const [newCampaign] = await db
      .insert(campaigns)
      .values(campaign)
      .returning();
    return newCampaign;
  }
}

export const storage = new DatabaseStorage();
