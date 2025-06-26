export interface AdPlacement {
  id: string;
  name: string;
  description?: string;
  location: string;
  dimensions: {
    width: number;
    height: number;
  };
  max_file_size: number;
  allowed_formats: string[];
  base_price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdvertiserAccount {
  id: string;
  user_id: string;
  company_name: string;
  contact_email: string;
  contact_phone?: string;
  billing_address?: any;
  payment_method?: any;
  credit_balance: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface AdCampaign {
  id: string;
  advertiser_id: string;
  name: string;
  description?: string;
  budget: number;
  daily_budget?: number;
  start_date: string;
  end_date: string;
  targeting_options?: {
    demographics?: {
      age_range?: [number, number];
      gender?: string[];
      interests?: string[];
    };
    geographic?: {
      countries?: string[];
      cities?: string[];
      radius?: number;
    };
    behavioral?: {
      property_types?: string[];
      price_ranges?: string[];
      search_history?: boolean;
    };
  };
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  total_spent: number;
  created_at: string;
  updated_at: string;
}

export interface Advertisement {
  id: string;
  campaign_id: string;
  placement_id: string;
  title: string;
  description?: string;
  image_url?: string;
  video_url?: string;
  click_url: string;
  alt_text?: string;
  ad_type: 'banner' | 'sidebar' | 'in_content' | 'footer' | 'popup' | 'video';
  content?: any;
  status: 'draft' | 'pending' | 'active' | 'paused' | 'expired' | 'rejected';
  priority: number;
  weight: number;
  impressions_count: number;
  clicks_count: number;
  created_at: string;
  updated_at: string;
  campaign?: AdCampaign;
  placement?: AdPlacement;
}

export interface AdImpression {
  id: string;
  ad_id: string;
  user_id?: string;
  session_id?: string;
  ip_address?: string;
  user_agent?: string;
  page_url?: string;
  referrer?: string;
  device_type?: string;
  browser?: string;
  location?: any;
  created_at: string;
}

export interface AdClick {
  id: string;
  ad_id: string;
  impression_id?: string;
  user_id?: string;
  session_id?: string;
  ip_address?: string;
  user_agent?: string;
  page_url?: string;
  referrer?: string;
  device_type?: string;
  browser?: string;
  location?: any;
  created_at: string;
}

export interface AdPayment {
  id: string;
  advertiser_id: string;
  campaign_id?: string;
  amount: number;
  currency: string;
  payment_method?: string;
  transaction_id?: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_date?: string;
  created_at: string;
  updated_at: string;
}

export interface AdAnalytics {
  impressions: number;
  clicks: number;
  ctr: number; // Click-through rate
  cost: number;
  cpm: number; // Cost per mille
  cpc: number; // Cost per click
  conversions?: number;
  revenue?: number;
  roi?: number; // Return on investment
}

export interface AdTargeting {
  demographics?: {
    age_range?: [number, number];
    gender?: ('male' | 'female' | 'other')[];
    interests?: string[];
    income_range?: [number, number];
  };
  geographic?: {
    countries?: string[];
    regions?: string[];
    cities?: string[];
    postal_codes?: string[];
    radius?: number;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  behavioral?: {
    property_types?: string[];
    price_ranges?: string[];
    search_history?: boolean;
    previous_interactions?: boolean;
    device_types?: string[];
    browsers?: string[];
  };
  temporal?: {
    days_of_week?: number[];
    hours_of_day?: number[];
    time_zones?: string[];
  };
}