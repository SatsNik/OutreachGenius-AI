import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Youtube, Instagram } from "lucide-react";
import type { Influencer } from "@shared/schema";

interface InfluencerCardProps {
  influencer: Influencer;
  onConnect: (influencer: Influencer) => void;
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
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

const getBrandFitColor = (score: number): string => {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-yellow-500";
  return "bg-red-500";
};

export default function InfluencerCard({ influencer, onConnect }: InfluencerCardProps) {
  const brandFitScore = influencer.brandFitScore || 75;
  const brandFitWidth = Math.round((brandFitScore / 100) * 16); // Convert to Tailwind width classes

  return (
    <Card className="hover:shadow-lg transition-shadow" data-testid={`card-influencer-${influencer.id}`}>
      <CardContent className="p-6">
        <div className="flex items-start space-x-4 mb-4">
          <img
            src={influencer.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(influencer.name)}&background=3B82F6&color=fff`}
            alt={`${influencer.name} profile`}
            className="w-12 h-12 rounded-full object-cover"
            data-testid={`img-avatar-${influencer.id}`}
          />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900" data-testid={`text-name-${influencer.id}`}>
              {influencer.name}
            </h3>
            <p className="text-sm text-gray-600" data-testid={`text-handle-${influencer.id}`}>
              {influencer.handle}
            </p>
            <div className="flex items-center space-x-2 mt-1">
              <Badge className={getCategoryColor(influencer.category)} data-testid={`badge-category-${influencer.id}`}>
                {influencer.category}
              </Badge>
              <div className="flex items-center text-xs text-gray-500">
                {influencer.platform === "youtube" ? (
                  <Youtube className="w-3 h-3 mr-1" />
                ) : (
                  <Instagram className="w-3 h-3 mr-1" />
                )}
                {influencer.platform}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Followers:</span>
            <span className="font-medium" data-testid={`text-followers-${influencer.id}`}>
              {formatNumber(influencer.followers)}
            </span>
          </div>
          {influencer.avgViews && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Avg. Views:</span>
              <span className="font-medium" data-testid={`text-avgviews-${influencer.id}`}>
                {formatNumber(influencer.avgViews)}
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Brand Fit:</span>
            <div className="flex items-center space-x-1">
              <div className="w-16 h-2 bg-gray-200 rounded-full">
                <div 
                  className={`h-2 ${getBrandFitColor(brandFitScore)} rounded-full transition-all`}
                  style={{ width: `${(brandFitScore / 100) * 100}%` }}
                ></div>
              </div>
              <span className={`text-xs font-medium ${brandFitScore >= 80 ? 'text-green-600' : brandFitScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                {brandFitScore}%
              </span>
            </div>
          </div>
        </div>

        <Button
          onClick={() => onConnect(influencer)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center space-x-2"
          data-testid={`button-connect-${influencer.id}`}
        >
          <MessageCircle className="w-4 h-4" />
          <span>Connect</span>
        </Button>
      </CardContent>
    </Card>
  );
}
