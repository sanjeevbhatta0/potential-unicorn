import { google, youtube_v3 } from 'googleapis';
import axios from 'axios';
import { BaseCrawler, CrawlResult } from './base.crawler';
import { YouTubeChannelConfig, getActiveChannels } from '../config/youtube-channels.config';
import { logger } from '../utils/logger';

// YouTube Transcript API (unofficial but works)
interface TranscriptLine {
  text: string;
  start: number;
  duration: number;
}

export class YouTubeCrawler extends BaseCrawler {
  private youtube: youtube_v3.Youtube;
  private apiKey: string;

  constructor() {
    super('youtube', 'YouTube News');
    this.apiKey = process.env.YOUTUBE_API_KEY || '';

    if (!this.apiKey) {
      throw new Error('YOUTUBE_API_KEY environment variable is required');
    }

    this.youtube = google.youtube({
      version: 'v3',
      auth: this.apiKey,
    });
  }

  async crawl(): Promise<CrawlResult[]> {
    const channels = getActiveChannels();
    const allResults: CrawlResult[] = [];

    logger.info(`[YouTube] Crawling ${channels.length} channels...`);

    for (const channel of channels) {
      try {
        const videos = await this.crawlChannel(channel);
        allResults.push(...videos);
        logger.info(`[YouTube] ${channel.channelName}: Found ${videos.length} videos`);

        // Rate limiting - YouTube API has quota limits
        await this.delay(1000);
      } catch (error) {
        logger.error(`[YouTube] Error crawling ${channel.channelName}:`, error);
      }
    }

    return allResults;
  }

  async crawlChannel(channel: YouTubeChannelConfig): Promise<CrawlResult[]> {
    try {
      // Get recent videos from channel
      const response = await this.youtube.search.list({
        part: ['id', 'snippet'],
        channelId: channel.channelId,
        order: 'date',
        type: ['video'],
        maxResults: 10,
        publishedAfter: this.getRecentDate(), // Last 24 hours
      });

      if (!response.data.items || response.data.items.length === 0) {
        return [];
      }

      const results: CrawlResult[] = [];

      for (const item of response.data.items) {
        if (!item.id?.videoId || !item.snippet) continue;

        try {
          const videoDetails = await this.getVideoDetails(item.id.videoId, channel);
          if (videoDetails) {
            results.push(videoDetails);
          }
        } catch (error) {
          logger.error(`[YouTube] Error fetching video ${item.id.videoId}:`, error);
        }
      }

      return results;
    } catch (error) {
      logger.error(`[YouTube] Error in crawlChannel for ${channel.channelName}:`, error);
      return [];
    }
  }

  async getVideoDetails(
    videoId: string,
    channel: YouTubeChannelConfig,
  ): Promise<CrawlResult | null> {
    try {
      // Get video details
      const response = await this.youtube.videos.list({
        part: ['snippet', 'contentDetails', 'statistics'],
        id: [videoId],
      });

      const video = response.data.items?.[0];
      if (!video || !video.snippet) {
        return null;
      }

      // Get transcript/captions
      const transcript = await this.getTranscript(videoId);

      // Extract content from description + transcript
      const content = this.extractContent(video.snippet.description || '', transcript);

      // Determine if this is news content (filter out non-news videos)
      if (!this.isNewsContent(video.snippet.title || '', content)) {
        return null;
      }

      const result: CrawlResult = {
        title: this.cleanText(video.snippet.title || ''),
        content: content,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        imageUrl: this.getBestThumbnail(video.snippet.thumbnails),
        author: channel.channelName,
        publishedAt: new Date(video.snippet.publishedAt || Date.now()),
        category: this.detectCategory(video.snippet.title || '', video.snippet.description || ''),
        metadata: {
          videoId: videoId,
          channelId: channel.channelId,
          channelType: channel.type,
          channelBias: channel.bias,
          sourceCredibility: channel.credibilityScore,
          duration: this.parseDuration(video.contentDetails?.duration || ''),
          viewCount: parseInt(video.statistics?.viewCount || '0'),
          likeCount: parseInt(video.statistics?.likeCount || '0'),
          commentCount: parseInt(video.statistics?.commentCount || '0'),
          hasTranscript: transcript.length > 0,
          tags: video.snippet.tags || [],
        },
      };

      return result;
    } catch (error) {
      logger.error(`[YouTube] Error getting video details for ${videoId}:`, error);
      return null;
    }
  }

  async getTranscript(videoId: string): Promise<string> {
    try {
      // Try to get Nepali captions first, then English
      const transcript = await this.fetchTranscript(videoId, 'ne');
      if (transcript) return transcript;

      return await this.fetchTranscript(videoId, 'en');
    } catch (error) {
      // Transcripts may not be available for all videos
      return '';
    }
  }

  private async fetchTranscript(videoId: string, lang: string): Promise<string> {
    try {
      // Using youtube-transcript library approach
      const url = `https://www.youtube.com/watch?v=${videoId}`;
      const response = await axios.get(url);
      const html = response.data;

      // Extract captions URL from page HTML
      const captionsMatch = html.match(/"captions":({.*?}),/);
      if (!captionsMatch) return '';

      const captions = JSON.parse(captionsMatch[1]);
      const playerCaptionsTracklistRenderer =
        captions.playerCaptionsTracklistRenderer;

      if (!playerCaptionsTracklistRenderer?.captionTracks) return '';

      // Find track for specified language
      const track = playerCaptionsTracklistRenderer.captionTracks.find(
        (t: any) => t.languageCode === lang,
      );

      if (!track?.baseUrl) return '';

      // Fetch transcript
      const transcriptResponse = await axios.get(track.baseUrl);
      const transcriptXml = transcriptResponse.data;

      // Parse XML and extract text
      const textMatches = transcriptXml.matchAll(/<text[^>]*>(.*?)<\/text>/g);
      const lines: string[] = [];

      for (const match of textMatches) {
        const text = match[1]
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'");
        lines.push(text);
      }

      return lines.join(' ');
    } catch (error) {
      return '';
    }
  }

  private extractContent(description: string, transcript: string): string {
    // Combine description and transcript (first 5000 chars of transcript)
    const transcriptPreview = transcript.substring(0, 5000);

    if (transcriptPreview) {
      return `${description}\n\n[Video Content]: ${transcriptPreview}`;
    }

    return description;
  }

  private isNewsContent(title: string, content: string): boolean {
    const newsKeywords = [
      'news',
      'खबर',
      'समाचार',
      'breaking',
      'latest',
      'ताजा',
      'नेपाल',
      'nepal',
      'राजनीति',
      'politics',
      'सरकार',
      'government',
      'प्रधानमन्त्री',
      'मन्त्री',
      'minister',
      'संसद',
      'parliament',
      'interview',
      'अन्तरवार्ता',
      'discussion',
      'छलफल',
      'analysis',
      'विश्लेषण',
    ];

    const titleLower = title.toLowerCase();
    const contentLower = content.toLowerCase();

    // Check if contains news keywords
    const hasNewsKeyword = newsKeywords.some(
      (keyword) => titleLower.includes(keyword) || contentLower.includes(keyword),
    );

    // Filter out entertainment, music, vlogs, etc.
    const nonNewsKeywords = [
      'song',
      'गीत',
      'music',
      'comedy',
      'funny',
      'entertainment',
      'मनोरञ्जन',
      'dance',
      'नृत्य',
      'movie',
      'film',
      'trailer',
      'vlog',
    ];

    const isNonNews = nonNewsKeywords.some(
      (keyword) => titleLower.includes(keyword),
    );

    return hasNewsKeyword && !isNonNews;
  }

  private detectCategory(title: string, description: string): string {
    const text = `${title} ${description}`.toLowerCase();

    const categories: Record<string, string[]> = {
      politics: ['राजनीति', 'politics', 'सरकार', 'government', 'संसद', 'parliament'],
      economy: ['अर्थ', 'economy', 'बजेट', 'budget', 'व्यापार', 'business'],
      sports: ['खेलकुद', 'sports', 'फुटबल', 'cricket', 'खेल'],
      entertainment: ['मनोरञ्जन', 'entertainment', 'फिल्म', 'movie'],
      technology: ['प्रविधि', 'technology', 'टेक्नोलोजी', 'internet'],
      health: ['स्वास्थ्य', 'health', 'hospital', 'अस्पताल'],
      education: ['शिक्षा', 'education', 'विद्यालय', 'school'],
      international: ['अन्तर्राष्ट्रिय', 'international', 'विश्व', 'world'],
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some((keyword) => text.includes(keyword))) {
        return category;
      }
    }

    return 'general';
  }

  private getBestThumbnail(
    thumbnails: youtube_v3.Schema$ThumbnailDetails | undefined,
  ): string | undefined {
    if (!thumbnails) return undefined;

    // Get highest quality thumbnail
    return (
      thumbnails.maxres?.url ||
      thumbnails.high?.url ||
      thumbnails.medium?.url ||
      thumbnails.default?.url
    );
  }

  private parseDuration(duration: string): number {
    // Parse ISO 8601 duration (e.g., PT15M33S)
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;

    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');

    return hours * 3600 + minutes * 60 + seconds;
  }

  private getRecentDate(): string {
    // Get date 24 hours ago in ISO format
    const date = new Date();
    date.setHours(date.getHours() - 24);
    return date.toISOString();
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
