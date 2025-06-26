export interface AnalyticsData {
  overview: {
    totalListings: number;
    activeListings: number;
    totalUsers: number;
    totalAgents: number;
    totalViews: number;
    totalInquiries: number;
    conversionRate: number;
    averagePrice: number;
  };
  
  listingsByType: {
    [key: string]: number;
  };
  
  listingsByLocation: {
    province: string;
    count: number;
    percentage: number;
  }[];
  
  listingsByPurpose: {
    jual: number;
    sewa: number;
  };
  
  activeListingsToday: number;
  activeListingsThisWeek: number;
  
  userRegistrations: {
    date: string;
    count: number;
    cumulative: number;
  }[];
  
  popularLocations: {
    name: string;
    type: 'province' | 'city' | 'district';
    count: number;
    growth: number;
  }[];
  
  popularCategories: {
    name: string;
    count: number;
    percentage: number;
    growth: number;
  }[];
  
  priceAnalysis: {
    averageByType: {
      [key: string]: number;
    };
    priceRanges: {
      range: string;
      count: number;
      percentage: number;
    }[];
  };
  
  performanceMetrics: {
    date: string;
    views: number;
    inquiries: number;
    newListings: number;
    newUsers: number;
  }[];
  
  agentPerformance: {
    agentId: string;
    agentName: string;
    totalListings: number;
    activeListings: number;
    totalViews: number;
    totalInquiries: number;
    conversionRate: number;
  }[];
}

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface TimeSeriesData {
  date: string;
  value: number;
  label?: string;
}