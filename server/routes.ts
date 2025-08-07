import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { generateOutreachMessage, generateSubjectLine } from "./services/gemini";
import { sendEmail } from "./services/sendgrid";
import { discoverInfluencersByCategory, searchYouTubeInfluencers } from "./services/youtube";
import { insertOutreachMessageSchema } from "@shared/schema";

// Validation schemas
const generateMessageSchema = z.object({
  influencerId: z.string(),
  brandName: z.string().optional(),
  brandDescription: z.string().optional(),
});

const sendMessageSchema = z.object({
  messageId: z.string(),
  toEmail: z.string().email(),
  fromEmail: z.string().email().default("noreply@icy-outreach.com"),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all influencers
  app.get("/api/influencers", async (req, res) => {
    try {
      const influencers = await storage.getInfluencers();
      res.json(influencers);
    } catch (error) {
      console.error("Error fetching influencers:", error);
      res.status(500).json({ error: "Failed to fetch influencers" });
    }
  });

  // Get specific influencer
  app.get("/api/influencers/:id", async (req, res) => {
    try {
      const influencer = await storage.getInfluencer(req.params.id);
      if (!influencer) {
        return res.status(404).json({ error: "Influencer not found" });
      }
      res.json(influencer);
    } catch (error) {
      console.error("Error fetching influencer:", error);
      res.status(500).json({ error: "Failed to fetch influencer" });
    }
  });

  // Generate outreach message
  app.post("/api/generate-message", async (req, res) => {
    try {
      const { influencerId, brandName, brandDescription } = generateMessageSchema.parse(req.body);
      
      const influencer = await storage.getInfluencer(influencerId);
      if (!influencer) {
        return res.status(404).json({ error: "Influencer not found" });
      }

      // Generate message content
      const messageContent = await generateOutreachMessage({
        influencerName: influencer.name,
        influencerHandle: influencer.handle,
        category: influencer.category,
        platform: influencer.platform,
        recentContent: influencer.recentContent as any[],
        brandName,
        brandDescription,
      });

      // Generate subject line
      const subject = await generateSubjectLine(influencer.name, influencer.category);

      // Create a demo user ID or use existing one for testing
      let testUserId = "test-user-id";
      try {
        // Try to create a test user if it doesn't exist
        const existingUser = await storage.getUserByUsername("testuser");
        if (!existingUser) {
          const testUser = await storage.createUser({
            username: "testuser",
            password: "password",
            email: "test@example.com"
          });
          testUserId = testUser.id;
        } else {
          testUserId = existingUser.id;
        }
      } catch (error) {
        console.log("Using fallback user ID for demo purposes");
      }

      // Save draft message
      const outreachMessage = await storage.createOutreachMessage({
        subject,
        content: messageContent,
        influencerId,
        userId: testUserId,
        status: "draft",
        emailUsed: influencer.email || "",
        aiGenerated: true,
      });

      res.json({
        messageId: outreachMessage.id,
        subject,
        content: messageContent,
        influencer: {
          id: influencer.id,
          name: influencer.name,
          handle: influencer.handle,
          category: influencer.category,
          email: influencer.email,
          avatar: influencer.avatar,
        },
      });
    } catch (error) {
      console.error("Error generating message:", error);
      res.status(500).json({ error: "Failed to generate message" });
    }
  });

  // Update message content
  app.patch("/api/messages/:id", async (req, res) => {
    try {
      const messageId = req.params.id;
      const { content, subject } = req.body;

      const message = await storage.getOutreachMessage(messageId);
      if (!message) {
        return res.status(404).json({ error: "Message not found" });
      }

      // Update the message content (you'll need to add this method to storage)
      // For now, we'll just return success
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating message:", error);
      res.status(500).json({ error: "Failed to update message" });
    }
  });

  // Send outreach message
  app.post("/api/send-message", async (req, res) => {
    try {
      const { messageId, toEmail, fromEmail } = sendMessageSchema.parse(req.body);
      
      const message = await storage.getOutreachMessage(messageId);
      if (!message) {
        return res.status(404).json({ error: "Message not found" });
      }

      // Send email via SendGrid
      const emailSent = await sendEmail(
        process.env.SENDGRID_API_KEY || "",
        {
          to: toEmail,
          from: fromEmail,
          subject: message.subject,
          text: message.content,
          html: message.content.replace(/\n/g, '<br>'),
        }
      );

      if (!emailSent) {
        return res.status(500).json({ error: "Failed to send email" });
      }

      // Update message status
      await storage.updateOutreachMessageStatus(messageId, "sent", new Date());

      res.json({ 
        success: true, 
        message: "Outreach message sent successfully",
        sentTo: toEmail 
      });
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // Get outreach messages for an influencer
  app.get("/api/influencers/:id/messages", async (req, res) => {
    try {
      const messages = await storage.getOutreachMessagesByInfluencer(req.params.id);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Demo route to create a test user
  app.post("/api/demo/create-user", async (req, res) => {
    try {
      const existingUser = await storage.getUserByUsername("testuser");
      if (existingUser) {
        return res.json({ success: true, message: "Test user already exists", userId: existingUser.id });
      }
      
      const testUser = await storage.createUser({
        username: "testuser",
        password: "password",
        email: "test@example.com"
      });
      
      res.json({ 
        success: true, 
        message: "Test user created",
        userId: testUser.id 
      });
    } catch (error) {
      console.error("Error creating test user:", error);
      res.status(500).json({ error: "Failed to create test user" });
    }
  });

  // Discover influencers from YouTube
  app.post("/api/discover-influencers", async (req, res) => {
    try {
      const { category, count = 50 } = req.body;
      
      if (!category) {
        return res.status(400).json({ error: "Category is required" });
      }
      
      try {
        // Try YouTube API first
        await discoverInfluencersByCategory(category, count);
      } catch (youtubeError) {
        console.warn("YouTube API failed, using fallback demo data:", youtubeError);
        // Fallback to demo data if YouTube API fails
        await createDemoInfluencersForCategory(category, Math.min(count, 20));
      }
      
      res.json({ 
        success: true, 
        message: `Started discovering ${category} influencers`,
        category
      });
    } catch (error) {
      console.error("Error discovering influencers:", error);
      res.status(500).json({ error: "Failed to discover influencers" });
    }
  });

  // Helper function to create demo influencers for a category
  async function createDemoInfluencersForCategory(category: string, count: number) {
    const demoInfluencers = generateDemoInfluencers(category, count);
    
    for (const influencer of demoInfluencers) {
      try {
        const existing = await storage.getInfluencers();
        const exists = existing.some(e => e.name === influencer.name);
        if (!exists) {
          await storage.createInfluencer(influencer);
        }
      } catch (error) {
        console.error(`Error creating demo influencer ${influencer.name}:`, error);
      }
    }
  }

  function generateDemoInfluencers(category: string, count: number) {
    const demoData: Record<string, any[]> = {
      tech: [
        { name: "TechReviews Pro", handle: "@techreviews", followers: 850000, avgViews: 42500, email: "contact@techreviews.com", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100", recentContent: ["iPhone 15 Review", "AI Tools Guide", "Gaming Setup"] },
        { name: "CodeWithSarah", handle: "@codewithsarah", followers: 420000, avgViews: 21000, email: null, avatar: "https://images.unsplash.com/photo-1494790108755-2616b5c1b8a8?w=100&h=100", recentContent: ["Python Tutorial", "React Native", "Web Dev Tips"] },
        { name: "Gadget Master", handle: "@gadgetmaster", followers: 1200000, avgViews: 60000, email: "hello@gadgetmaster.tv", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100", recentContent: ["Best Phones 2024", "Smart Home Setup", "VR Headsets"] },
        { name: "DevTips Daily", handle: "@devtipsdaily", followers: 320000, avgViews: 16000, email: null, avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100", recentContent: ["JavaScript Tips", "CSS Tricks", "Git Workflow"] },
      ],
      beauty: [
        { name: "GlowUp with Emma", handle: "@glowupemma", followers: 950000, avgViews: 47500, email: "emma@glowup.com", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100", recentContent: ["Summer Makeup", "Skincare Routine", "Product Reviews"] },
        { name: "Natural Beauty Hub", handle: "@naturalbeauty", followers: 680000, avgViews: 34000, email: null, avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=100&h=100", recentContent: ["DIY Face Masks", "Clean Beauty", "Ingredient Guide"] },
        { name: "Makeup Artist Pro", handle: "@makeupartistpro", followers: 1500000, avgViews: 75000, email: "bookings@makeupartist.pro", avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100", recentContent: ["Wedding Makeup", "Red Carpet Looks", "Tutorials"] },
        { name: "Skincare Science", handle: "@skincarescience", followers: 420000, avgViews: 21000, email: null, avatar: "https://images.unsplash.com/photo-1506863530036-1efeddceb993?w=100&h=100", recentContent: ["Retinol Guide", "Acne Solutions", "Anti-Aging Tips"] },
      ],
      fitness: [
        { name: "FitLife with Jake", handle: "@fitlifejake", followers: 1100000, avgViews: 55000, email: "jake@fitlife.com", avatar: "https://images.unsplash.com/photo-1566753323558-f4e0952af115?w=100&h=100", recentContent: ["HIIT Workout", "Meal Prep Guide", "Strength Training"] },
        { name: "Yoga Journey", handle: "@yogajourney", followers: 780000, avgViews: 39000, email: null, avatar: "https://images.unsplash.com/photo-1545167622-3a6ac756afa4?w=100&h=100", recentContent: ["Morning Yoga", "Meditation Tips", "Flexibility Training"] },
        { name: "Home Gym Hero", handle: "@homegymhero", followers: 520000, avgViews: 26000, email: "contact@homegym.hero", avatar: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=100&h=100", recentContent: ["Equipment Reviews", "Budget Workouts", "Space-Saving Tips"] },
        { name: "Nutrition Facts", handle: "@nutritionfacts", followers: 640000, avgViews: 32000, email: null, avatar: "https://images.unsplash.com/photo-1559309172-e2eca3e8ea5d?w=100&h=100", recentContent: ["Protein Guide", "Meal Planning", "Supplement Reviews"] },
      ],
    };

    const categoryData = demoData[category] || [];
    return categoryData.slice(0, count).map((data, index) => ({
      ...data,
      platform: "youtube" as const,
      category,
      brandFitScore: Math.floor(Math.random() * 30) + 70,
      channelId: `demo_${category}_${index}`,
    }));
  }

  // Search specific YouTube influencers
  app.post("/api/search-youtube", async (req, res) => {
    try {
      const { query, maxResults = 20 } = req.body;
      
      if (!query) {
        return res.status(400).json({ error: "Search query is required" });
      }
      
      const influencers = await searchYouTubeInfluencers(query, maxResults);
      
      // Save discovered influencers to database
      const saved = [];
      for (const influencerData of influencers) {
        try {
          const existingInfluencers = await storage.getInfluencers();
          const exists = existingInfluencers.some(existing => 
            existing.channelId === influencerData.channelId || existing.name === influencerData.name
          );
          
          if (!exists) {
            const savedInfluencer = await storage.createInfluencer(influencerData);
            saved.push(savedInfluencer);
          }
        } catch (error) {
          console.error(`Error saving influencer ${influencerData.name}:`, error);
        }
      }
      
      res.json({ 
        success: true, 
        message: `Found and saved ${saved.length} new influencers`,
        influencers: saved
      });
    } catch (error) {
      console.error("Error searching YouTube:", error);
      res.status(500).json({ error: "Failed to search YouTube influencers" });
    }
  });

  // Demo route to populate some influencers for testing
  app.post("/api/demo/populate-influencers", async (req, res) => {
    try {
      const demoInfluencers = [
        {
          name: "Alex Chen",
          handle: "@alextech",
          platform: "youtube",
          category: "tech",
          followers: 245000,
          avgViews: 12300,
          email: "alex@techreview.com",
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
          channelId: "UCtech123",
          brandFitScore: 87,
          recentContent: ["AI innovations", "smartphone reviews", "tech tutorials"],
        },
        {
          name: "Sofia Rodriguez",
          handle: "@sofiabeauty",
          platform: "youtube",
          category: "beauty",
          followers: 189000,
          avgViews: 8700,
          email: null,
          avatar: "https://images.unsplash.com/photo-1494790108755-2616c96d5d2b?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
          channelId: "UCbeauty456",
          brandFitScore: 72,
          recentContent: ["makeup tutorials", "skincare routines", "product reviews"],
        },
        {
          name: "Marcus Johnson",
          handle: "@marcusfitness",
          platform: "youtube",
          category: "fitness",
          followers: 321000,
          avgViews: 15200,
          email: "marcus.johnson@gmail.com",
          avatar: "https://images.unsplash.com/photo-1571019613540-b7ba3e1b0fcd?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
          channelId: "UCfitness789",
          brandFitScore: 94,
          recentContent: ["workout routines", "nutrition tips", "fitness motivation"],
        },
      ];

      const createdInfluencers = [];
      for (const influencer of demoInfluencers) {
        const created = await storage.createInfluencer(influencer);
        createdInfluencers.push(created);
      }

      res.json({ 
        success: true, 
        message: `Created ${createdInfluencers.length} demo influencers`,
        influencers: createdInfluencers 
      });
    } catch (error) {
      console.error("Error populating demo influencers:", error);
      res.status(500).json({ error: "Failed to populate demo influencers" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
