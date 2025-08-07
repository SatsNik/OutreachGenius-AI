import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { X, CheckCircle, AlertCircle, Send, Loader2, Edit3 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Influencer } from "@shared/schema";

interface MessageGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  influencer: Influencer;
}

interface GeneratedMessage {
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

export default function MessageGeneratorModal({ isOpen, onClose, influencer }: MessageGeneratorModalProps) {
  const [generatedMessage, setGeneratedMessage] = useState<GeneratedMessage | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [customEmail, setCustomEmail] = useState("");
  const [useCustomEmailInput, setUseCustomEmailInput] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [isSending, setIsSending] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Generate message mutation
  const generateMessageMutation = useMutation({
    mutationFn: async (data: { influencerId: string }) => {
      const response = await apiRequest("POST", "/api/generate-message", data);
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedMessage(data);
      setGenerationError(null);
      setIsGenerating(false);
    },
    onError: (error) => {
      setGenerationError(error.message);
      setIsGenerating(false);
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { messageId: string; toEmail: string; fromEmail: string }) => {
      const response = await apiRequest("POST", "/api/send-message", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Message sent successfully!",
        description: `Outreach message sent to ${data.sentTo}`,
      });
      setIsSending(false);
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
      setIsSending(false);
    },
  });

  // Generate message when modal opens
  useEffect(() => {
    if (isOpen && influencer) {
      setIsGenerating(true);
      setGeneratedMessage(null);
      setGenerationError(null);
      setCustomEmail("");
      setUseCustomEmailInput(!influencer.email);
      setIsEditing(false);
      
      generateMessageMutation.mutate({ influencerId: influencer.id });
    }
  }, [isOpen, influencer]);

  const handleRegenerateMessage = () => {
    setIsGenerating(true);
    setGenerationError(null);
    generateMessageMutation.mutate({ influencerId: influencer.id });
  };

  const handleEditMessage = () => {
    setEditedContent(generatedMessage?.content || "");
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (generatedMessage) {
      setGeneratedMessage({
        ...generatedMessage,
        content: editedContent,
      });
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedContent("");
    setIsEditing(false);
  };

  const handleSendMessage = () => {
    if (!generatedMessage) return;

    const emailToUse = useCustomEmailInput ? customEmail : influencer.email;
    if (!emailToUse) {
      toast({
        title: "Email required",
        description: "Please provide an email address to send the message",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    sendMessageMutation.mutate({
      messageId: generatedMessage.messageId,
      toEmail: emailToUse,
      fromEmail: "noreply@icy-outreach.com",
    });
  };

  const getCategoryColor = (category: string): string => {
    switch (category.toLowerCase()) {
      case "tech":
      case "technology":
        return "bg-blue-100 text-blue-800";
      case "beauty":
        return "bg-pink-100 text-pink-800";
      case "fitness":
        return "bg-green-100 text-green-800";
      case "travel":
        return "bg-purple-100 text-purple-800";
      case "food":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const canSendMessage = generatedMessage && !isGenerating && (influencer.email || customEmail.trim());

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden" data-testid="modal-message-generator">
        <DialogHeader className="border-b border-gray-200 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-semibold text-gray-900">
                AI Message Generator
              </DialogTitle>
              <p className="text-sm text-gray-600">Powered by Gemini 2.0 Flash</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              data-testid="button-close-modal"
            >
              <X className="w-5 h-5 text-gray-500" />
            </Button>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(90vh-140px)] space-y-6">
          {/* Influencer Info */}
          <div className="bg-gray-50 rounded-lg p-4" data-testid="section-influencer-info">
            <div className="flex items-center space-x-3">
              <img
                src={influencer.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(influencer.name)}&background=3B82F6&color=fff`}
                alt={`${influencer.name} avatar`}
                className="w-10 h-10 rounded-full"
                data-testid="img-modal-avatar"
              />
              <div>
                <h4 className="font-medium text-gray-900" data-testid="text-modal-influencer-name">
                  {influencer.name}
                </h4>
                <div className="flex items-center space-x-2">
                  <Badge className={getCategoryColor(influencer.category)} data-testid="badge-modal-category">
                    {influencer.category}
                  </Badge>
                  <span className="text-sm text-gray-600">{influencer.handle}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Generation Status */}
          <div data-testid="section-generation-status">
            {/* Loading State */}
            {isGenerating && (
              <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg" data-testid="state-loading">
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                <span className="text-sm text-blue-700">Generating personalized message...</span>
              </div>
            )}

            {/* Error State */}
            {generationError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg" data-testid="state-error">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="text-sm text-red-700">Failed to generate message. Please try again.</span>
                </div>
                <Button
                  onClick={handleRegenerateMessage}
                  size="sm"
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                  variant="ghost"
                  data-testid="button-regenerate"
                >
                  Try again
                </Button>
              </div>
            )}

            {/* Generated Message */}
            {generatedMessage && !isGenerating && (
              <div data-testid="section-generated-message">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subject:</label>
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <span className="text-sm text-gray-900">{generatedMessage.subject}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Generated Message:</label>
                    {isEditing ? (
                      <div className="space-y-3">
                        <Textarea
                          value={editedContent}
                          onChange={(e) => setEditedContent(e.target.value)}
                          rows={8}
                          className="w-full resize-none"
                          placeholder="Edit your outreach message..."
                          data-testid="textarea-edit-message"
                        />
                        <div className="flex space-x-2">
                          <Button onClick={handleSaveEdit} size="sm" data-testid="button-save-edit">
                            Save
                          </Button>
                          <Button onClick={handleCancelEdit} variant="outline" size="sm" data-testid="button-cancel-edit">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed" data-testid="text-message-content">
                          {generatedMessage.content}
                        </div>
                        <div className="mt-3">
                          <Button
                            onClick={handleEditMessage}
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 hover:text-blue-700 font-medium"
                            data-testid="button-edit-message"
                          >
                            <Edit3 className="w-4 h-4 mr-1" />
                            Edit message
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Email Section */}
          {generatedMessage && !isGenerating && (
            <div className="border-t border-gray-200 pt-6" data-testid="section-email">
              <h4 className="font-medium text-gray-900 mb-4">Contact Information</h4>

              {/* Auto-detected Email */}
              {influencer.email && !useCustomEmailInput && (
                <div className="mb-4" data-testid="section-detected-email">
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-700">Email detected:</span>
                      <span className="text-sm font-medium text-green-800" data-testid="text-detected-email">
                        {influencer.email}
                      </span>
                    </div>
                    <Button
                      onClick={() => setUseCustomEmailInput(true)}
                      variant="ghost"
                      size="sm"
                      className="text-xs text-green-600 hover:text-green-700"
                      data-testid="button-use-custom-email"
                    >
                      Use different email
                    </Button>
                  </div>
                </div>
              )}

              {/* Custom Email Input */}
              {(useCustomEmailInput || !influencer.email) && (
                <div data-testid="section-custom-email">
                  {!influencer.email && (
                    <div className="flex items-center space-x-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Contact Unavailable</p>
                        <p className="text-xs text-amber-600">No email found for this influencer. Please provide one below.</p>
                      </div>
                    </div>
                  )}
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {influencer.email ? "Alternative Email Address" : "Influencer Email Address *"}
                  </label>
                  <div className="flex space-x-2">
                    <Input
                      type="email"
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      placeholder="influencer@example.com"
                      className="flex-1"
                      data-testid="input-custom-email"
                      required={!influencer.email}
                    />
                    <Button
                      onClick={() => {
                        if (customEmail && customEmail.includes("@")) {
                          toast({
                            title: "Email validated",
                            description: "Email address looks valid",
                          });
                        } else {
                          toast({
                            title: "Invalid email",
                            description: "Please enter a valid email address",
                            variant: "destructive",
                          });
                        }
                      }}
                      variant="outline"
                      size="sm"
                      data-testid="button-verify-email"
                    >
                      Verify
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {influencer.email ? "Alternative email will be used instead" : "The outreach message will be sent to this email address"}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-200 pt-4 bg-gray-50 -mx-6 -mb-6 px-6 py-4">
          <Button onClick={onClose} variant="outline" data-testid="button-cancel-modal">
            Cancel
          </Button>
          <Button
            onClick={handleSendMessage}
            disabled={!canSendMessage || isSending}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
            data-testid="button-send-message"
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Send Message</span>
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
