'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface CredibilityScore {
  score: number;
  confidence: number;
  factors: {
    cross_coverage: number;
    source_diversity: number;
    source_reputation: number;
    fact_consistency: number;
    ai_verification: number;
  };
  sourceCount: number;
  sourceDiversity: number;
  factConsistency: number;
  verificationStatus: 'verified' | 'credible' | 'unverified' | 'questionable';
  explanation: string;
}

interface CredibilityBadgeProps {
  score: CredibilityScore;
  variant?: 'default' | 'compact' | 'detailed';
  className?: string;
  showTooltip?: boolean;
}

export function CredibilityBadge({
  score,
  variant = 'default',
  className,
  showTooltip = true,
}: CredibilityBadgeProps) {
  const getBadgeConfig = (status: string) => {
    switch (status) {
      case 'verified':
        return {
          color: 'bg-green-500',
          textColor: 'text-green-700',
          borderColor: 'border-green-300',
          bgLight: 'bg-green-50',
          icon: '✓',
          label: 'Verified',
        };
      case 'credible':
        return {
          color: 'bg-blue-500',
          textColor: 'text-blue-700',
          borderColor: 'border-blue-300',
          bgLight: 'bg-blue-50',
          icon: '✓',
          label: 'Credible',
        };
      case 'unverified':
        return {
          color: 'bg-yellow-500',
          textColor: 'text-yellow-700',
          borderColor: 'border-yellow-300',
          bgLight: 'bg-yellow-50',
          icon: '!',
          label: 'Unverified',
        };
      case 'questionable':
        return {
          color: 'bg-red-500',
          textColor: 'text-red-700',
          borderColor: 'border-red-300',
          bgLight: 'bg-red-50',
          icon: '⚠',
          label: 'Questionable',
        };
      default:
        return {
          color: 'bg-gray-500',
          textColor: 'text-gray-700',
          borderColor: 'border-gray-300',
          bgLight: 'bg-gray-50',
          icon: '?',
          label: 'Unknown',
        };
    }
  };

  const config = getBadgeConfig(score.verificationStatus);

  if (variant === 'compact') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
          config.bgLight,
          config.textColor,
          className
        )}
        title={showTooltip ? score.explanation : undefined}
      >
        <span className={cn('w-2 h-2 rounded-full', config.color)} />
        {config.label}
      </span>
    );
  }

  if (variant === 'detailed') {
    return (
      <div
        className={cn(
          'border rounded-lg p-4 space-y-3',
          config.borderColor,
          config.bgLight,
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-white font-bold',
                config.color
              )}
            >
              {config.icon}
            </div>
            <div>
              <div className="font-semibold text-sm">{config.label}</div>
              <div className="text-xs text-gray-500">
                Score: {score.score.toFixed(1)}/100
              </div>
            </div>
          </div>
          <div className={cn('text-2xl font-bold', config.textColor)}>
            {Math.round(score.score)}
          </div>
        </div>

        {/* Explanation */}
        <p className="text-xs text-gray-600">{score.explanation}</p>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-600">Sources:</span>
            <span className="font-medium">{score.sourceCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Diversity:</span>
            <span className="font-medium">
              {Math.round(score.sourceDiversity)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Fact Check:</span>
            <span className="font-medium">
              {Math.round(score.factConsistency)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Confidence:</span>
            <span className="font-medium">
              {Math.round(score.confidence * 100)}%
            </span>
          </div>
        </div>

        {/* Factor breakdown */}
        <div className="space-y-1.5">
          <div className="text-xs font-medium text-gray-700">
            Score Factors:
          </div>
          {Object.entries(score.factors).map(([key, value]) => (
            <div key={key} className="flex items-center gap-2">
              <span className="text-xs text-gray-600 capitalize w-32">
                {key.replace(/_/g, ' ')}:
              </span>
              <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={cn('h-full', config.color)}
                  style={{ width: `${value}%` }}
                />
              </div>
              <span className="text-xs font-medium w-8 text-right">
                {Math.round(value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border',
        config.borderColor,
        config.bgLight,
        className
      )}
      title={showTooltip ? score.explanation : undefined}
    >
      <div
        className={cn(
          'w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold',
          config.color
        )}
      >
        {config.icon}
      </div>
      <div className="flex flex-col">
        <span className={cn('text-xs font-semibold', config.textColor)}>
          {config.label}
        </span>
        <span className="text-[10px] text-gray-500">
          {score.sourceCount} {score.sourceCount === 1 ? 'source' : 'sources'}
        </span>
      </div>
      <span className={cn('text-sm font-bold ml-1', config.textColor)}>
        {Math.round(score.score)}
      </span>
    </div>
  );
}

// Credibility Score Indicator (for article cards)
export function CredibilityIndicator({
  score,
  className,
}: {
  score: number;
  className?: string;
}) {
  const getColor = (s: number) => {
    if (s >= 90) return 'bg-green-500';
    if (s >= 70) return 'bg-blue-500';
    if (s >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className={cn('w-2 h-2 rounded-full', getColor(score))} />
      <span className="text-xs text-gray-600">{Math.round(score)}</span>
    </div>
  );
}

// Source Count Badge
export function SourceCountBadge({
  count,
  className,
}: {
  count: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs',
        count >= 5
          ? 'bg-green-100 text-green-700'
          : count >= 3
          ? 'bg-blue-100 text-blue-700'
          : count >= 2
          ? 'bg-yellow-100 text-yellow-700'
          : 'bg-gray-100 text-gray-700',
        className
      )}
    >
      <svg
        className="w-3 h-3"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
        />
      </svg>
      {count} {count === 1 ? 'source' : 'sources'}
    </span>
  );
}
