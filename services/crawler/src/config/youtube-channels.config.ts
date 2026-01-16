// YouTube Channel Configuration for Nepali News

export interface YouTubeChannelConfig {
  id: string;
  channelId: string;
  channelName: string;
  handle: string;
  type: 'independent' | 'mainstream' | 'international';
  category: string[];
  language: 'ne' | 'en' | 'mixed';
  bias?: 'left' | 'center' | 'right' | 'neutral';
  credibilityScore: number; // 0-100
  active: boolean;
}

// Popular Independent Nepali News YouTube Channels
export const YOUTUBE_CHANNELS: YouTubeChannelConfig[] = [
  // Independent Media
  {
    id: 'indepth-story',
    channelId: 'UCt6hqNYEZ8VhT6KkjFxZrIg',
    channelName: 'Indepth Story',
    handle: '@indepthstory',
    type: 'independent',
    category: ['politics', 'investigation', 'analysis'],
    language: 'ne',
    bias: 'neutral',
    credibilityScore: 85,
    active: true,
  },
  {
    id: 'nepali-comment',
    channelId: 'UCxT3VB_KRYKvxmF4Al3Gzwg',
    channelName: 'The Nepali Comment',
    handle: '@thenepalcomment',
    type: 'independent',
    category: ['politics', 'social', 'commentary'],
    language: 'ne',
    bias: 'neutral',
    credibilityScore: 82,
    active: true,
  },
  {
    id: 'sushant-pradhan',
    channelId: 'UCx_2KjSHPxFxKY5hQZQJ5Zw',
    channelName: 'Sushant Pradhan',
    handle: '@sushantpradhan',
    type: 'independent',
    category: ['politics', 'analysis', 'interview'],
    language: 'ne',
    bias: 'neutral',
    credibilityScore: 88,
    active: true,
  },
  {
    id: 'nepali-khabar',
    channelId: 'UCXJmE4KLLqxLbXe8DqvqF5Q',
    channelName: 'Nepali Khabar',
    handle: '@nepalikhabar',
    type: 'independent',
    category: ['news', 'current-affairs'],
    language: 'ne',
    bias: 'neutral',
    credibilityScore: 78,
    active: true,
  },
  {
    id: 'himal-khabar',
    channelId: 'UCNqQxhqLnlqvAzGY8xJDtFQ',
    channelName: 'Himal Khabar',
    handle: '@himalkhabar',
    type: 'independent',
    category: ['news', 'politics'],
    language: 'ne',
    bias: 'neutral',
    credibilityScore: 75,
    active: true,
  },
  {
    id: 'nepal-aaja',
    channelId: 'UCHjkj8OLqb9T5P4qd3WDvXg',
    channelName: 'Nepal Aaja',
    handle: '@nepalaaja',
    type: 'independent',
    category: ['news', 'discussion'],
    language: 'ne',
    bias: 'neutral',
    credibilityScore: 80,
    active: true,
  },

  // Mainstream TV Channels (for balance)
  {
    id: 'kantipur-tv',
    channelId: 'UClEttW5PM6uI16u3LlMcmXw',
    channelName: 'Kantipur TV HD',
    handle: '@kantipurtv',
    type: 'mainstream',
    category: ['news', 'entertainment', 'talk-show'],
    language: 'ne',
    bias: 'center',
    credibilityScore: 82,
    active: true,
  },
  {
    id: 'setopati-online',
    channelId: 'UC1FPiHhPGz7uaSmoPqNmOww',
    channelName: 'Setopati Online',
    handle: '@setopatitv',
    type: 'mainstream',
    category: ['news', 'politics'],
    language: 'ne',
    bias: 'center',
    credibilityScore: 85,
    active: true,
  },
  {
    id: 'ap1-tv',
    channelId: 'UCYfdidRxbB8Qhf0Nx7ioOYw',
    channelName: 'AP1 HD Television',
    handle: '@ap1hdtelevision',
    type: 'mainstream',
    category: ['news', 'talk-show'],
    language: 'ne',
    bias: 'center',
    credibilityScore: 78,
    active: true,
  },
  {
    id: 'news24-nepal',
    channelId: 'UC2-RtJroDCqsA77yGh7DaDw',
    channelName: 'News24 Nepal',
    handle: '@news24nepal',
    type: 'mainstream',
    category: ['news', 'breaking'],
    language: 'ne',
    bias: 'center',
    credibilityScore: 75,
    active: true,
  },
  {
    id: 'onlinekhabar-tv',
    channelId: 'UCj8gISGlvUXlKLmrFNwVvZQ',
    channelName: 'Online Khabar',
    handle: '@onlinekhabar',
    type: 'mainstream',
    category: ['news', 'politics'],
    language: 'ne',
    bias: 'center',
    credibilityScore: 83,
    active: true,
  },

  // International/English
  {
    id: 'bbc-nepali',
    channelId: 'UCxLJYJaXqC4JyK0s3aq7Vyw',
    channelName: 'BBC News Nepali',
    handle: '@bbcnewsnepali',
    type: 'international',
    category: ['news', 'international'],
    language: 'ne',
    bias: 'neutral',
    credibilityScore: 92,
    active: true,
  },
  {
    id: 'voa-nepali',
    channelId: 'UCxSJGF1fTVvMWsv7NYQz0pw',
    channelName: 'VOA Nepali',
    handle: '@voanepali',
    type: 'international',
    category: ['news', 'international'],
    language: 'ne',
    bias: 'neutral',
    credibilityScore: 88,
    active: true,
  },
];

// Get active channels by type
export function getChannelsByType(type: YouTubeChannelConfig['type']): YouTubeChannelConfig[] {
  return YOUTUBE_CHANNELS.filter((ch) => ch.type === type && ch.active);
}

// Get all active channels
export function getActiveChannels(): YouTubeChannelConfig[] {
  return YOUTUBE_CHANNELS.filter((ch) => ch.active);
}

// Get channel by ID
export function getChannelById(id: string): YouTubeChannelConfig | undefined {
  return YOUTUBE_CHANNELS.find((ch) => ch.id === id);
}

// Calculate source diversity score (used in credibility calculation)
export function calculateSourceDiversity(sources: YouTubeChannelConfig[]): number {
  const types = new Set(sources.map((s) => s.type));
  const biases = new Set(sources.map((s) => s.bias));

  // More diversity = higher score
  const typeScore = (types.size / 3) * 50; // Max 3 types
  const biasScore = (biases.size / 4) * 50; // Max 4 biases

  return Math.min(100, typeScore + biasScore);
}
