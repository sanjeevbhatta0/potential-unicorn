export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed';
export type AdEventType = 'impression' | 'click';

export interface AdSpace {
  id: string;
  xPosition: number;
  yPosition: number;
  width: number;
  height: number;
  isPremium: boolean;
  baseRatePerHour: number;
  createdAt: Date;
}

export interface AdCampaign {
  id: string;
  advertiserId: string;
  name: string;
  status: CampaignStatus;
  budget: number;
  spent: number;
  startTime: Date;
  endTime: Date;
  targeting: AdTargeting;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdTargeting {
  geography?: string[]; // Countries, regions
  demographics?: {
    ageMin?: number;
    ageMax?: number;
    gender?: 'male' | 'female' | 'all';
    interests?: string[];
  };
  schedule?: {
    dayOfWeek?: number[]; // 0-6 (Sunday-Saturday)
    hourOfDay?: number[]; // 0-23
  };
  devices?: ('desktop' | 'mobile' | 'tablet')[];
}

export interface AdPlacement {
  id: string;
  campaignId: string;
  adSpaceId: string;
  creativeUrl: string;
  linkUrl?: string;
  startTime: Date;
  endTime: Date;
  impressions: number;
  clicks: number;
  cost: number;
  isActive: boolean;
  createdAt: Date;
}

export interface CreateCampaignDto {
  name: string;
  budget: number;
  startTime: Date;
  endTime: Date;
  targeting?: AdTargeting;
}

export interface UpdateCampaignDto {
  name?: string;
  status?: CampaignStatus;
  budget?: number;
  startTime?: Date;
  endTime?: Date;
  targeting?: Partial<AdTargeting>;
}

export interface CreatePlacementDto {
  campaignId: string;
  adSpaceId: string;
  creativeUrl: string;
  linkUrl?: string;
  startTime: Date;
  endTime: Date;
}

export interface AdAnalytics {
  placementId: string;
  impressions: number;
  clicks: number;
  ctr: number; // Click-through rate
  cost: number;
  cpm: number; // Cost per thousand impressions
  cpc: number; // Cost per click
  dateRange: {
    from: Date;
    to: Date;
  };
}

export interface AdEvent {
  id: string;
  placementId: string;
  eventType: AdEventType;
  userId?: string;
  userAgent?: string;
  ipAddress?: string;
  referrer?: string;
  createdAt: Date;
}
