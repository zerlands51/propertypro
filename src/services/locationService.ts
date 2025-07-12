import { supabase } from '../lib/supabase';

export interface Location {
  id: string;
  name: string;
  type: 'provinsi' | 'kota' | 'kecamatan' | 'kelurahan';
  parent_id?: string;
  slug: string;
  description?: string;
  is_active?: boolean;
  property_count?: number;
  latitude?: number;
  longitude?: number;
  created_at: string;
  updated_at: string;
  image_url?: string | null; // Added
  image_alt_text?: string | null; // Added
}

class LocationService {
  async getProvinces(): Promise<{id: string, name: string}[]> {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name')
        .eq('type', 'provinsi')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Error fetching provinces:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch provinces:', error);
      throw error;
    }
  }

  async getCitiesByProvince(provinceId: string): Promise<{id: string, name: string}[]> {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name')
        .eq('type', 'kota')
        .eq('parent_id', provinceId)
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Error fetching cities:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch cities:', error);
      throw error;
    }
  }

  async getDistrictsByCity(cityId: string): Promise<{id: string, name: string}[]> {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name')
        .eq('type', 'kecamatan')
        .eq('parent_id', cityId)
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Error fetching districts:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch districts:', error);
      throw error;
    }
  }

  async getLocationById(id: string): Promise<Location | null> {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching location:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to fetch location:', error);
      throw error;
    }
  }

  async searchLocations(query: string, type?: string): Promise<Location[]> {
    try {
      let queryBuilder = supabase
        .from('locations')
        .select('*')
        .eq('is_active', true)
        .ilike('name', `%${query}%`)
        .order('name')
        .limit(10);

      if (type) {
        queryBuilder = queryBuilder.eq('type', type);
      }

      const { data, error } = await queryBuilder;

      if (error) {
        console.error('Error searching locations:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to search locations:', error);
      throw error;
    }
  }

  async getAllLocations(filters?: {
    isActive?: boolean;
    search?: string;
    type?: string;
  }): Promise<Location[]> {
    try {
      let queryBuilder = supabase
        .from('locations')
        .select('*')
        .order('name');

      if (filters?.isActive !== undefined) {
        queryBuilder = queryBuilder.eq('is_active', filters.isActive);
      }

      if (filters?.search) {
        queryBuilder = queryBuilder.ilike('name', `%${filters.search}%`);
      }

      if (filters?.type) {
        queryBuilder = queryBuilder.eq('type', filters.type);
      }

      const { data, error } = await queryBuilder;

      if (error) {
        console.error('Error fetching all locations:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch all locations:', error);
      throw error;
    }
  }

  async createLocation(locationData: Partial<Location>): Promise<Location | null> {
    try {
      const { data, error } = await supabase
        .from('locations')
        .insert({
          name: locationData.name,
          type: locationData.type,
          parent_id: locationData.parent_id || null,
          slug: locationData.slug,
          description: locationData.description || null,
          is_active: locationData.is_active !== undefined ? locationData.is_active : true,
          property_count: 0,
          latitude: locationData.latitude || null,
          longitude: locationData.longitude || null,
          image_url: locationData.image_url || null, // Store image URL
          image_alt_text: locationData.image_alt_text || null, // Store image alt text
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error creating location:', error);
      return null;
    }
}

export const locationService = new LocationService();