export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  isActive: boolean;
  propertyCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Location {
  id: string;
  name: string;
  type: 'province' | 'city' | 'district' | 'subdistrict';
  parentId?: string;
  slug: string;
  description?: string;
  isActive: boolean;
  propertyCount: number;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface LocationHierarchy extends Location {
  children?: LocationHierarchy[];
  parent?: Location;
}

export interface Report {
  id: string;
  propertyId: string;
  reporterId: string;
  reporterName: string;
  reporterEmail: string;
  type: 'spam' | 'inappropriate_content' | 'fake_listing' | 'wrong_category' | 'duplicate' | 'other';
  reason: string;
  description?: string;
  status: 'pending' | 'under_review' | 'resolved' | 'dismissed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolution?: string;
  property: {
    id: string;
    title: string;
    type: string;
    purpose: 'jual' | 'sewa';
    price: number;
    priceUnit: 'juta' | 'miliar';
    location: {
      city: string;
      province: string;
    };
    images: string[];
    agent: {
      id: string;
      name: string;
      email: string;
    };
    status: 'active' | 'inactive' | 'suspended' | 'removed';
  };
}

export interface ModerationAction {
  id: string;
  reportId?: string;
  propertyId: string;
  adminId: string;
  adminName: string;
  action: 'approve' | 'remove' | 'suspend' | 'warn_user' | 'edit_content' | 'change_category' | 'dismiss_report';
  reason: string;
  details?: string;
  previousStatus?: string;
  newStatus?: string;
  createdAt: string;
  property: {
    id: string;
    title: string;
    agent: {
      id: string;
      name: string;
      email: string;
    };
  };
}

export interface ModerationStats {
  totalReports: number;
  pendingReports: number;
  resolvedReports: number;
  dismissedReports: number;
  actionsToday: number;
  averageResolutionTime: number; // in hours
  reportsByType: {
    [key: string]: number;
  };
  reportsByPriority: {
    [key: string]: number;
  };
}

export interface SystemSettings {
  general: {
    siteName: string;
    siteDescription: string;
    siteUrl: string;
    adminEmail: string;
    supportEmail: string;
    timezone: string;
    language: string;
    currency: string;
    dateFormat: string;
    timeFormat: string;
  };
  features: {
    userRegistration: boolean;
    emailVerification: boolean;
    propertyApproval: boolean;
    autoPublish: boolean;
    guestInquiries: boolean;
    socialLogin: boolean;
    multiLanguage: boolean;
    darkMode: boolean;
    maintenance: boolean;
  };
  limits: {
    maxPropertiesPerUser: number;
    maxImagesPerProperty: number;
    maxFileSize: number; // in MB
    sessionTimeout: number; // in minutes
    maxLoginAttempts: number;
    passwordMinLength: number;
    propertyTitleMaxLength: number;
    propertyDescriptionMaxLength: number;
  };
  email: {
    provider: 'smtp' | 'sendgrid' | 'mailgun' | 'ses';
    smtpHost?: string;
    smtpPort?: number;
    smtpUsername?: string;
    smtpPassword?: string;
    fromEmail: string;
    fromName: string;
    replyToEmail: string;
    enableNotifications: boolean;
    enableWelcomeEmail: boolean;
    enablePropertyAlerts: boolean;
  };
  security: {
    enableTwoFactor: boolean;
    enableCaptcha: boolean;
    captchaProvider: 'recaptcha' | 'hcaptcha';
    captchaSiteKey?: string;
    captchaSecretKey?: string;
    enableRateLimit: boolean;
    rateLimitRequests: number;
    rateLimitWindow: number; // in minutes
    enableIpBlocking: boolean;
    blockedIps: string[];
    enableSsl: boolean;
    enableHsts: boolean;
  };
  storage: {
    provider: 'local' | 's3' | 'cloudinary' | 'gcs';
    s3Bucket?: string;
    s3Region?: string;
    s3AccessKey?: string;
    s3SecretKey?: string;
    cloudinaryCloudName?: string;
    cloudinaryApiKey?: string;
    cloudinaryApiSecret?: string;
    maxStorageSize: number; // in GB
    enableImageOptimization: boolean;
    enableImageWatermark: boolean;
    watermarkText?: string;
  };
  seo: {
    enableSitemap: boolean;
    enableRobotsTxt: boolean;
    metaTitle: string;
    metaDescription: string;
    metaKeywords: string;
    ogImage: string;
    enableStructuredData: boolean;
    googleAnalyticsId?: string;
    googleTagManagerId?: string;
    facebookPixelId?: string;
  };
  social: {
    facebookUrl?: string;
    twitterUrl?: string;
    instagramUrl?: string;
    linkedinUrl?: string;
    youtubeUrl?: string;
    enableSocialSharing: boolean;
    enableSocialLogin: boolean;
    facebookAppId?: string;
    googleClientId?: string;
    twitterApiKey?: string;
  };
  notifications: {
    enableEmailNotifications: boolean;
    enableSmsNotifications: boolean;
    enablePushNotifications: boolean;
    smsProvider: 'twilio' | 'nexmo' | 'aws-sns';
    twilioAccountSid?: string;
    twilioAuthToken?: string;
    twilioPhoneNumber?: string;
    pushProvider: 'firebase' | 'onesignal';
    firebaseServerKey?: string;
    oneSignalAppId?: string;
    oneSignalApiKey?: string;
  };
  backup: {
    enableAutoBackup: boolean;
    backupFrequency: 'daily' | 'weekly' | 'monthly';
    backupRetention: number; // in days
    backupLocation: 'local' | 's3' | 'gcs';
    enableDatabaseBackup: boolean;
    enableFileBackup: boolean;
    lastBackupDate?: string;
    nextBackupDate?: string;
  };
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'superadmin';
  permissions: string[];
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}