import { apiRequest } from "./queryClient";

export interface GenerateMessageRequest {
  influencerId: string;
  brandName?: string;
  brandDescription?: string;
}

export interface GenerateMessageResponse {
  messageId: string;
  subject: string;
  content: string;
  influencer: {
    id: string;
    name: string;
    handle: string;
    category: string;
    email: string | null;
    avatar: string | null;
  };
}

export interface SendMessageRequest {
  messageId: string;
  toEmail: string;
  fromEmail?: string;
}

export interface SendMessageResponse {
  success: boolean;
  message: string;
  sentTo: string;
}

export const api = {
  generateMessage: async (data: GenerateMessageRequest): Promise<GenerateMessageResponse> => {
    const response = await apiRequest("POST", "/api/generate-message", data);
    return response.json();
  },

  sendMessage: async (data: SendMessageRequest): Promise<SendMessageResponse> => {
    const response = await apiRequest("POST", "/api/send-message", {
      ...data,
      fromEmail: data.fromEmail || "noreply@icy-outreach.com",
    });
    return response.json();
  },

  populateDemoInfluencers: async (): Promise<any> => {
    const response = await apiRequest("POST", "/api/demo/populate-influencers", {});
    return response.json();
  },
};
