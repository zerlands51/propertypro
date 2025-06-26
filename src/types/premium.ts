export interface PremiumListing {
  id: string;
  propertyId: string;
  userId: string;
  plan: PremiumPlan;
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  startDate: string;
  endDate: string;
  paymentId: string;
  features: PremiumFeature[];
  analytics: PremiumAnalytics;
  createdAt: string;
  updatedAt: string;
}

export interface PremiumPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  duration: number; // in days
  features: string[];
  description: string;
}

export interface PremiumFeature {
  id: string;
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
}

export interface PremiumAnalytics {
  views: number;
  inquiries: number;
  favorites: number;
  conversionRate: number;
  dailyViews: { date: string; views: number }[];
  topSources: { source: string; count: number }[];
}

export interface PaymentData {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'success' | 'failed' | 'cancelled';
  paymentMethod: string;
  transactionId?: string;
  midtransToken?: string;
  createdAt: string;
  updatedAt: string;
  billingDetails: BillingDetails;
}

export interface BillingDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface MidtransConfig {
  clientKey: string;
  serverKey: string;
  isProduction: boolean;
  snapUrl: string;
}

export interface MidtransResponse {
  token: string;
  redirect_url: string;
}

export interface PaymentNotification {
  transaction_time: string;
  transaction_status: string;
  transaction_id: string;
  status_message: string;
  status_code: string;
  signature_key: string;
  payment_type: string;
  order_id: string;
  merchant_id: string;
  gross_amount: string;
  fraud_status: string;
  currency: string;
}