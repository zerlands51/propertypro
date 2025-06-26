export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  priceUnit: 'juta' | 'miliar';
  type: PropertyType;
  purpose: 'jual' | 'sewa';
  bedrooms?: number;
  bathrooms?: number;
  buildingSize?: number;
  landSize?: number;
  location: Location;
  images: string[];
  features: string[];
  agent: Agent;
  createdAt: string;
  isPromoted: boolean;
}

export type PropertyType = 
  | 'rumah' 
  | 'apartemen' 
  | 'kondominium' 
  | 'ruko' 
  | 'gedung-komersial' 
  | 'ruang-industri' 
  | 'tanah' 
  | 'lainnya';

export interface Location {
  province: string;
  city: string;
  district: string;
  subDistrict?: string;
  village?: string;
  address: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
}

export interface Agent {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatar?: string;
  company?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: 'user' | 'agent' | 'admin';
  savedProperties: string[];
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}