import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap, Bell, User, Youtube } from "lucide-react";
import InfluencerCard from "@/components/influencer-card";
import MessageGeneratorModal from "@/components/message-generator-modal";
import type { Influencer } from "@shared/schema";

export default function InfluencersPage() {
  const [selectedInfluencer, setSelectedInfluencer] = useState<Influencer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [followersFilter, setFollowersFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: influencers, isLoading, error } = useQuery<Influencer[]>({
    queryKey: ["/api/influencers"],
  });

  // Discovery mutation
  const discoverMutation = useMutation({
    mutationFn: async (category: string) => {
      const response = await apiRequest("POST", "/api/discover-influencers", { 
        category, 
        count: 30 
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Discovery started!",
        description: `Finding influencers from YouTube...`,
      });
      // Refetch influencers after a short delay
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/influencers"] });
      }, 3000);
    },
    onError: (error) => {
      toast({
        title: "Discovery failed",
        description: "Failed to start influencer discovery. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleConnect = (influencer: Influencer) => {
    setSelectedInfluencer(influencer);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedInfluencer(null);
  };

  const handleDiscoverInfluencers = (category: string) => {
    discoverMutation.mutate(category);
  };

  const filteredInfluencers = influencers?.filter((influencer) => {
    if (categoryFilter !== "all" && influencer.category !== categoryFilter) return false;
    if (platformFilter !== "all" && influencer.platform !== platformFilter) return false;
    
    if (followersFilter !== "all") {
      const followers = influencer.followers;
      switch (followersFilter) {
        case "1k-10k": return followers >= 1000 && followers < 10000;
        case "10k-100k": return followers >= 10000 && followers < 100000;
        case "100k-1m": return followers >= 100000 && followers < 1000000;
        case "1m+": return followers >= 1000000;
        default: return true;
      }
    }
    
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                ICY
              </h1>
              <span className="text-sm text-gray-500">AI Influencer Outreach</span>
            </div>
            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </button>
              <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Discovered Influencers</h2>
          <p className="text-gray-600">Connect with influencers and generate personalized outreach messages using AI</p>
        </div>

        {/* Discovery Section */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Discover More Influencers</h3>
                <p className="text-sm text-gray-600">Find influencers from YouTube using our AI-powered discovery</p>
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={() => handleDiscoverInfluencers("tech")}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                  data-testid="button-discover-tech"
                >
                  Discover Tech
                </Button>
                <Button
                  onClick={() => handleDiscoverInfluencers("beauty")}
                  size="sm"
                  className="bg-pink-600 hover:bg-pink-700"
                  data-testid="button-discover-beauty"
                >
                  Discover Beauty
                </Button>
                <Button
                  onClick={() => handleDiscoverInfluencers("fitness")}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  data-testid="button-discover-fitness"
                >
                  Discover Fitness
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Category:</label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-40" data-testid="filter-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="tech">Technology</SelectItem>
                    <SelectItem value="beauty">Beauty</SelectItem>
                    <SelectItem value="fitness">Fitness</SelectItem>
                    <SelectItem value="travel">Travel</SelectItem>
                    <SelectItem value="food">Food</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Followers:</label>
                <Select value={followersFilter} onValueChange={setFollowersFilter}>
                  <SelectTrigger className="w-40" data-testid="filter-followers">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Ranges</SelectItem>
                    <SelectItem value="1k-10k">1K - 10K</SelectItem>
                    <SelectItem value="10k-100k">10K - 100K</SelectItem>
                    <SelectItem value="100k-1m">100K - 1M</SelectItem>
                    <SelectItem value="1m+">1M+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Platform:</label>
                <Select value={platformFilter} onValueChange={setPlatformFilter}>
                  <SelectTrigger className="w-40" data-testid="filter-platform">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Platforms</SelectItem>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4 mb-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded mb-1 w-2/3"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded"></div>
                  </div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-red-600 mb-4">Failed to load influencers. Please try again.</p>
              <Button onClick={() => window.location.reload()} data-testid="button-retry">
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredInfluencers?.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Youtube className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No influencers found</h3>
              <p className="text-gray-600 mb-4">
                {influencers?.length === 0 
                  ? "No influencers have been discovered yet." 
                  : "No influencers match your current filters."
                }
              </p>
              {categoryFilter !== "all" || followersFilter !== "all" || platformFilter !== "all" ? (
                <Button 
                  onClick={() => {
                    setCategoryFilter("all");
                    setFollowersFilter("all");
                    setPlatformFilter("all");
                  }}
                  data-testid="button-clear-filters"
                >
                  Clear Filters
                </Button>
              ) : null}
            </CardContent>
          </Card>
        )}

        {/* Influencer Grid */}
        {!isLoading && !error && filteredInfluencers && filteredInfluencers.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="influencers-grid">
            {filteredInfluencers.map((influencer) => (
              <InfluencerCard
                key={influencer.id}
                influencer={influencer}
                onConnect={handleConnect}
              />
            ))}
          </div>
        )}
      </main>

      {/* Message Generator Modal */}
      {selectedInfluencer && (
        <MessageGeneratorModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          influencer={selectedInfluencer}
        />
      )}
    </div>
  );
}
