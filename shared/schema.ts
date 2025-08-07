import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const brands = pgTable("brands", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  targetAudience: text("target_audience"),
  website: text("website"),
  userId: varchar("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const influencers = pgTable("influencers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  handle: text("handle").notNull(),
  platform: text("platform").notNull(), // youtube, instagram
  category: text("category").notNull(), // tech, beauty, fitness, travel, food
  followers: integer("followers").notNull(),
  avgViews: integer("avg_views"),
  email: text("email"),
  avatar: text("avatar"),
  channelId: text("channel_id"),
  brandFitScore: integer("brand_fit_score"), // 1-100
  recentContent: jsonb("recent_content"), // Array of recent videos/posts
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const campaigns = pgTable("campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("active"), // active, paused, completed
  brandId: varchar("brand_id").references(() => brands.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const outreachMessages = pgTable("outreach_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  influencerId: varchar("influencer_id").references(() => influencers.id).notNull(),
  campaignId: varchar("campaign_id").references(() => campaigns.id),
  userId: varchar("user_id").references(() => users.id).notNull(),
  status: text("status").notNull().default("draft"), // draft, sent, delivered, opened, replied
  sentAt: timestamp("sent_at"),
  emailUsed: text("email_used"),
  aiGenerated: boolean("ai_generated").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  brands: many(brands),
  campaigns: many(campaigns),
  outreachMessages: many(outreachMessages),
}));

export const brandsRelations = relations(brands, ({ one, many }) => ({
  user: one(users, {
    fields: [brands.userId],
    references: [users.id],
  }),
  campaigns: many(campaigns),
}));

export const influencersRelations = relations(influencers, ({ many }) => ({
  outreachMessages: many(outreachMessages),
}));

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  brand: one(brands, {
    fields: [campaigns.brandId],
    references: [brands.id],
  }),
  user: one(users, {
    fields: [campaigns.userId],
    references: [users.id],
  }),
  outreachMessages: many(outreachMessages),
}));

export const outreachMessagesRelations = relations(outreachMessages, ({ one }) => ({
  influencer: one(influencers, {
    fields: [outreachMessages.influencerId],
    references: [influencers.id],
  }),
  campaign: one(campaigns, {
    fields: [outreachMessages.campaignId],
    references: [campaigns.id],
  }),
  user: one(users, {
    fields: [outreachMessages.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
});

export const insertBrandSchema = createInsertSchema(brands).omit({
  id: true,
  createdAt: true,
});

export const insertInfluencerSchema = createInsertSchema(influencers).omit({
  id: true,
  createdAt: true,
});

export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  id: true,
  createdAt: true,
});

export const insertOutreachMessageSchema = createInsertSchema(outreachMessages).omit({
  id: true,
  createdAt: true,
  sentAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Brand = typeof brands.$inferSelect;
export type InsertBrand = z.infer<typeof insertBrandSchema>;

export type Influencer = typeof influencers.$inferSelect;
export type InsertInfluencer = z.infer<typeof insertInfluencerSchema>;

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;

export type OutreachMessage = typeof outreachMessages.$inferSelect;
export type InsertOutreachMessage = z.infer<typeof insertOutreachMessageSchema>;
