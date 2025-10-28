/**
 * Template Recommendation Component
 *
 * Displays recommended workflow templates based on user's prompt
 * with metadata, integrations, and "Use Template" action.
 */

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, Zap, Users } from 'lucide-react';
import type { TemplateRecommendation } from '@/services/templateService';

interface TemplateRecommendationProps {
  recommendations: TemplateRecommendation[];
  onSelectTemplate: (templateId: string) => void;
  isLoading?: boolean;
}

export default function TemplateRecommendations({
  recommendations,
  onSelectTemplate,
  isLoading = false
}: TemplateRecommendationProps) {
  if (isLoading) {
    return (
      <Card className="p-6 bg-amber-50 border-amber-200">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-amber-600"></div>
          <p className="text-sm text-amber-800">Finding relevant templates...</p>
        </div>
      </Card>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Lightbulb className="h-5 w-5 text-amber-600" />
        <h3 className="text-base font-semibold text-gray-900">
          Recommended Templates
        </h3>
        <Badge variant="secondary" className="ml-2">
          {recommendations.length} {recommendations.length === 1 ? 'match' : 'matches'}
        </Badge>
      </div>

      <p className="text-sm text-gray-600">
        We found templates that might match your requirements. Using a template is faster
        and often produces better results than generating from scratch.
      </p>

      {/* Template Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendations.map((recommendation) => (
          <TemplateCard
            key={recommendation.template.id}
            recommendation={recommendation}
            onSelect={() => onSelectTemplate(recommendation.template.id)}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Individual Template Card
 */
interface TemplateCardProps {
  recommendation: TemplateRecommendation;
  onSelect: () => void;
}

function TemplateCard({ recommendation, onSelect }: TemplateCardProps) {
  const { template, score, matchReasons } = recommendation;

  return (
    <Card className="p-4 hover:shadow-lg transition-all duration-200 hover:border-blue-300 group">
      <div className="space-y-3">
        {/* Header */}
        <div>
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {template.name}
            </h4>
            {score > 50 && (
              <Badge variant="default" className="shrink-0 bg-green-600">
                <Zap className="h-3 w-3 mr-1" />
                Best Match
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-600 line-clamp-2">
            {template.description}
          </p>
        </div>

        {/* Match Reasons */}
        {matchReasons.length > 0 && (
          <div className="space-y-1">
            {matchReasons.slice(0, 2).map((reason, index) => (
              <p key={index} className="text-xs text-blue-600 flex items-center gap-1">
                <span className="text-blue-400">✓</span> {reason}
              </p>
            ))}
          </div>
        )}

        {/* Metadata */}
        <div className="flex flex-wrap gap-2">
          {/* Category Badge */}
          <Badge variant="secondary" className="text-xs">
            {template.category}
          </Badge>

          {/* Complexity Badge */}
          <Badge
            variant="outline"
            className={`text-xs ${
              template.complexity === 'beginner'
                ? 'border-green-300 text-green-700'
                : template.complexity === 'intermediate'
                ? 'border-yellow-300 text-yellow-700'
                : 'border-red-300 text-red-700'
            }`}
          >
            {template.complexity}
          </Badge>

          {/* Node Count */}
          <Badge variant="outline" className="text-xs">
            {template.estimatedNodes} nodes
          </Badge>
        </div>

        {/* Integrations */}
        <div className="pt-2 border-t">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-3 w-3 text-gray-400" />
            <p className="text-xs text-gray-500 font-medium">Integrations:</p>
          </div>
          <div className="flex flex-wrap gap-1">
            {template.requiredIntegrations.slice(0, 3).map((integration) => (
              <Badge key={integration} variant="outline" className="text-xs">
                {integration}
              </Badge>
            ))}
            {template.requiredIntegrations.length > 3 && (
              <Badge variant="outline" className="text-xs text-gray-500">
                +{template.requiredIntegrations.length - 3} more
              </Badge>
            )}
          </div>
        </div>

        {/* Action Button */}
        <Button
          onClick={onSelect}
          variant="default"
          size="sm"
          className="w-full mt-2 group-hover:bg-blue-600 transition-colors"
        >
          Use This Template
        </Button>
      </div>
    </Card>
  );
}
