import { storage } from "../storage";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

if (!YOUTUBE_API_KEY) {
  throw new Error("YOUTUBE_API_KEY environment variable is required");
}
const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

interface YouTubeChannel {
  id: string;
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      default: { url: string };
      medium: { url: string };
      high: { url: string };
    };
    customUrl?: string;
  };
  statistics: {
    subscriberCount: string;
    videoCount: string;
    viewCount: string;
  };
}

interface YouTubeSearchResult {
  id: {
    channelId: string;
  };
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      default: { url: string };
      medium: { url: string };
      high: { url: string };
    };
    channelTitle: string;
  };
}

export async function searchYouTubeInfluencers(query: string, maxResults: number = 50): Promise<any[]> {
  try {
    // Search for channels
    const searchUrl = `${YOUTUBE_API_BASE}/search?part=snippet&type=channel&q=${encodeURIComponent(query)}&maxResults=${Math.min(maxResults, 25)}&key=${YOUTUBE_API_KEY}`;
    
    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error(`YouTube API error ${searchResponse.status}:`, errorText);
      throw new Error(`YouTube API error: ${searchResponse.status} - ${errorText}`);
    }
    
    const searchData = await searchResponse.json();
    const channels = searchData.items as YouTubeSearchResult[];
    
    if (!channels || channels.length === 0) {
      return [];
    }
    
    // Get detailed channel statistics
    const channelIds = channels.map((channel: YouTubeSearchResult) => channel.id.channelId).join(',');
    const channelsUrl = `${YOUTUBE_API_BASE}/channels?part=snippet,statistics&id=${channelIds}&key=${YOUTUBE_API_KEY}`;
    
    const channelsResponse = await fetch(channelsUrl);
    if (!channelsResponse.ok) {
      throw new Error(`YouTube API error: ${channelsResponse.status}`);
    }
    
    const channelsData = await channelsResponse.json();
    const detailedChannels = channelsData.items as YouTubeChannel[];
    
    const influencers = [];
    
    for (const channel of detailedChannels) {
      const subscriberCount = parseInt(channel.statistics.subscriberCount) || 0;
      
      // Only include channels with reasonable subscriber counts (1K+)
      if (subscriberCount < 1000) continue;
      
      // Determine category based on channel title/description
      const category = determineCategory(channel.snippet.title, channel.snippet.description);
      
      const influencer = {
        name: channel.snippet.title,
        handle: channel.snippet.customUrl ? `@${channel.snippet.customUrl}` : `@${channel.snippet.title.replace(/\s+/g, '').toLowerCase()}`,
        platform: "youtube" as const,
        category,
        followers: subscriberCount,
        avgViews: Math.round(subscriberCount * 0.05), // Rough estimate: 5% of subscribers
        email: null, // Email not available from API
        avatar: channel.snippet.thumbnails.high?.url || channel.snippet.thumbnails.medium?.url || channel.snippet.thumbnails.default?.url,
        channelId: channel.id,
        brandFitScore: Math.floor(Math.random() * 40) + 60, // Random score between 60-100
        recentContent: generateContentThemes(category),
      };
      
      influencers.push(influencer);
    }
    
    return influencers;
  } catch (error) {
    console.error("Error searching YouTube influencers:", error);
    throw error;
  }
}

function determineCategory(title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase();
  
  // Tech keywords
  if (text.match(/tech|technology|programming|coding|software|ai|artificial intelligence|computer|developer|review|gadget|phone|iphone|android|laptop/)) {
    return "tech";
  }
  
  // Beauty keywords
  if (text.match(/beauty|makeup|skincare|cosmetic|fashion|style|hair|nails|tutorial/)) {
    return "beauty";
  }
  
  // Fitness keywords
  if (text.match(/fitness|workout|exercise|gym|health|nutrition|diet|muscle|training|yoga/)) {
    return "fitness";
  }
  
  // Travel keywords
  if (text.match(/travel|adventure|explore|destination|vacation|journey|trip|world|country|city/)) {
    return "travel";
  }
  
  // Food keywords
  if (text.match(/food|cooking|recipe|chef|kitchen|restaurant|meal|cuisine|baking|eating/)) {
    return "food";
  }
  
  // Gaming keywords
  if (text.match(/gaming|game|gamer|play|stream|esports|minecraft|fortnite|xbox|playstation/)) {
    return "gaming";
  }
  
  // Education keywords
  if (text.match(/education|learn|study|tutorial|course|lesson|teach|academic|school|university/)) {
    return "education";
  }
  
  // Default to lifestyle
  return "lifestyle";
}

function generateContentThemes(category: string): string[] {
  const themes: Record<string, string[]> = {
    tech: ["product reviews", "tech tutorials", "software demos", "gadget unboxings"],
    beauty: ["makeup tutorials", "skincare routines", "product reviews", "beauty tips"],
    fitness: ["workout routines", "nutrition advice", "fitness challenges", "health tips"],
    travel: ["destination guides", "travel vlogs", "cultural experiences", "adventure stories"],
    food: ["recipe tutorials", "restaurant reviews", "cooking tips", "food challenges"],
    gaming: ["gameplay videos", "game reviews", "streaming highlights", "gaming tutorials"],
    education: ["educational content", "tutorials", "explanations", "learning resources"],
    lifestyle: ["lifestyle content", "daily vlogs", "personal stories", "recommendations"],
  };
  
  return themes[category] || themes.lifestyle;
}

export async function discoverInfluencersByCategory(category: string, count: number = 20): Promise<void> {
  const searchQueries: Record<string, string[]> = {
    tech: ["tech review", "technology channel", "programming tutorial", "gadget review", "ai technology"],
    beauty: ["makeup tutorial", "beauty channel", "skincare routine", "beauty review", "cosmetics"],
    fitness: ["fitness channel", "workout routine", "health fitness", "gym training", "nutrition"],
    travel: ["travel vlog", "travel guide", "adventure travel", "world travel", "destination"],
    food: ["cooking channel", "recipe tutorial", "food review", "chef", "cooking show"],
    gaming: ["gaming channel", "game review", "gameplay", "gaming tutorial", "esports"],
    education: ["educational channel", "learning", "tutorial", "how to", "explained"],
  };
  
  const queries = searchQueries[category] || ["lifestyle vlog", "daily life", "personal channel"];
  
  for (const query of queries) {
    try {
      const influencers = await searchYouTubeInfluencers(query, Math.ceil(count / queries.length));
      
      // Save to database
      for (const influencerData of influencers) {
        try {
          // Check if influencer already exists
          const existingInfluencers = await storage.getInfluencers();
          const exists = existingInfluencers.some(existing => 
            existing.channelId === influencerData.channelId || existing.name === influencerData.name
          );
          
          if (!exists) {
            await storage.createInfluencer(influencerData);
          }
        } catch (error) {
          console.error(`Error saving influencer ${influencerData.name}:`, error);
        }
      }
      
      // Add delay between requests to respect API limits
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Error searching for "${query}":`, error);
    }
  }
}