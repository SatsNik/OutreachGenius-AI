import { GoogleGenAI } from "@google/genai";
import type { Influencer } from "@shared/schema";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || "AIzaSyDANqyMJgyxeog62KzpoZ5LRA4YRa6SoX8" 
});

export interface OutreachMessageRequest {
  influencerName: string;
  influencerHandle: string;
  category: string;
  platform: string;
  recentContent?: any[];
  brandName?: string;
  brandDescription?: string;
}

export async function generateOutreachMessage(request: OutreachMessageRequest): Promise<string> {
  try {
    const systemPrompt = `You are an expert influencer outreach specialist. Generate a personalized, professional outreach email that:

1. Addresses the influencer by name
2. Shows genuine knowledge of their content and niche
3. Proposes a collaboration that aligns with their audience
4. Maintains a professional yet friendly tone
5. Includes a clear call-to-action
6. Is concise but compelling (200-300 words)

Key guidelines:
- Be authentic and avoid generic language
- Reference their specific content area (${request.category})
- Mention their platform (${request.platform})
- Show respect for their expertise and audience
- Propose value for both the influencer and their community
- Use a professional email format with greeting and signature`;

    const combinedPrompt = `${systemPrompt}

Generate a personalized outreach message for:

Influencer: ${request.influencerName} (${request.influencerHandle})
Category: ${request.category}
Platform: ${request.platform}
${request.recentContent ? `Recent content themes: ${JSON.stringify(request.recentContent)}` : ''}
${request.brandName ? `Brand: ${request.brandName}` : 'Brand: ICY Outreach Team'}
${request.brandDescription ? `Brand description: ${request.brandDescription}` : ''}

Create a compelling outreach message that demonstrates knowledge of their work and proposes a meaningful collaboration opportunity.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: combinedPrompt,
    });

    const generatedText = response.text;
    if (!generatedText) {
      throw new Error("Empty response from Gemini AI");
    }

    return generatedText;
  } catch (error) {
    console.error("Failed to generate outreach message:", error);
    throw new Error(`Failed to generate outreach message: ${error}`);
  }
}

export async function generateSubjectLine(influencerName: string, category: string): Promise<string> {
  try {
    const prompt = `Generate a compelling email subject line for an influencer outreach email to ${influencerName} who creates ${category} content. The subject should be:
- Professional yet engaging
- Personalized to the influencer
- Clear about collaboration intent
- Under 50 characters
- Avoid spam words

Return only the subject line, nothing else.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    return response.text || `Collaboration Opportunity - ${influencerName}`;
  } catch (error) {
    console.error("Failed to generate subject line:", error);
    return `Collaboration Opportunity - ${influencerName}`;
  }
}

export async function analyzeBrandFit(influencer: Influencer, brandDescription?: string): Promise<number> {
  try {
    const prompt = `Analyze the brand fit between an influencer and a brand. Rate from 1-100 based on:
- Content alignment
- Audience match
- Brand safety
- Engagement quality

Influencer: ${influencer.name}
Category: ${influencer.category}
Platform: ${influencer.platform}
Followers: ${influencer.followers}
${brandDescription ? `Brand: ${brandDescription}` : 'Brand: General technology/lifestyle brand'}

Respond with only a number from 1-100.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    const score = parseInt(response.text || "75");
    return Math.min(Math.max(score, 1), 100);
  } catch (error) {
    console.error("Failed to analyze brand fit:", error);
    return 75; // Default moderate score
  }
}
