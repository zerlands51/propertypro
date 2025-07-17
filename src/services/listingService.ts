import { supabase } from '../lib/supabase';
import { Property, PropertyType, ListingStatus } from '../types';
import { User } from '../contexts/AuthContext';
import { ListingFormData, UserListing } from '../types/listing';

class ListingService {
  async getAllListings(filters?: ListingFilters, page: number = 1, pageSize: number = 10): Promise<{
    data: Property[];
    count: number;
  }> {
    try {
      let query = supabase
        .from('listings')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters) {
        if (filters.status && filters.status !== 'all') {
          query = query.eq('status', filters.status);
        }
        
        if (filters.type && filters.type !== 'all') {
          query = query.eq('property_type', filters.type);
        }
        
        if (filters.purpose && filters.purpose !== 'all') {
          query = query.eq('purpose', filters.purpose);
        }
        
        // Price range filters
        if (filters.priceRange) {
          const [min, max] = filters.priceRange;
          if (min !== null) query = query.gte('price', min);
          if (max !== null) query = query.lte('price', max);
        }
        
        // Alternative price filters
        if (filters.minPrice !== undefined) {
          query = query.gte('price', filters.minPrice);
        }
        
        if (filters.maxPrice !== undefined) {
          query = query.lte('price', filters.maxPrice);
        }
        
        // Bedroom filters
        if (filters.minBedrooms !== undefined) {
          query = query.gte('bedrooms', filters.minBedrooms);
        }
        
        if (filters.maxBedrooms !== undefined) {
          query = query.lte('bedrooms', filters.maxBedrooms);
        }
        
        // Bathroom filters
        if (filters.minBathrooms !== undefined) {
          query = query.gte('bathrooms', filters.minBathrooms);
        }
        
        if (filters.maxBathrooms !== undefined) {
          query = query.lte('bathrooms', filters.maxBathrooms);
        }
        
        // Building size filters
        if (filters.minBuildingSize !== undefined) {
          query = query.gte('building_size', filters.minBuildingSize);
        }
        
        if (filters.maxBuildingSize !== undefined) {
          query = query.lte('building_size', filters.maxBuildingSize);
        }
        
        // Land size filters
        if (filters.minLandSize !== undefined) {
          query = query.gte('land_size', filters.minLandSize);
        }
        
        if (filters.maxLandSize !== undefined) {
          query = query.lte('land_size', filters.maxLandSize);
        }
        
        // Floors filters
        if (filters.minFloors !== undefined) {
          query = query.gte('floors', filters.minFloors);
        }
        
        if (filters.maxFloors !== undefined) {
          query = query.lte('floors', filters.maxFloors);
        }
        
        if (filters.location) {
          if (filters.location.province) {
            query = query.eq('province_id', filters.location.province);
          }
          if (filters.location.city) {
            query = query.eq('city_id', filters.location.city);
          }
          if (filters.location.district) {
            query = query.eq('district_id', filters.location.district);
          }
        }

        if (filters.features && filters.features.length > 0) {
          query = query.contains('features', filters.features);
        }
      }
      
      // Apply sorting
      if (filters?.sortBy) {
        switch (filters.sortBy) {
          case 'newest':
            query = query.order('created_at', { ascending: false });
            break;
          case 'oldest':
            query = query.order('created_at', { ascending: true });
            break;
          case 'price_asc':
            query = query.order('price', { ascending: true });
            break;
          case 'price_desc':
            query = query.order('price', { ascending: false });
            break;
          case 'views':
            query = query.order('views', { ascending: false });
            break;
          case 'building_size_asc':
            query = query.order('building_size', { ascending: true });
            break;
          case 'building_size_desc':
            query = query.order('building_size', { ascending: false });
            break;
          case 'land_size_asc':
            query = query.order('land_size', { ascending: true });
            break;
          case 'land_size_desc':
            query = query.order('land_size', { ascending: false });
            break;
          case 'premium':
            // First sort by is_promoted, then by created_at
            query = query.order('is_promoted', { ascending: false })
                         .order('created_at', { ascending: false });
            break;
        }
      } else {
        // Default sorting
        query = query.order('created_at', { ascending: false });
      }
      
      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);
      
      const { data, error, count } = await query;
      
      if (error) throw error;

      const enrichedListings = await this._enrichListingsWithRelatedData(data || []);
      
      let properties: Property[] = this._mapDbListingsToProperties(enrichedListings);
      
      return {
        data: properties,
        count: count || 0
      };
    } catch (error) {
      console.error('Error fetching listings:', error);
      throw error; 
    }
  }

  /**
   * Get a single listing by ID
   */
  async getListingById(id: string): Promise<Property | null> {
    try {
      const { data: listing, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      if (!listing) return null;
      
      const enrichedListingArray = await this._enrichListingsWithRelatedData([listing]);
      const enrichedListing = enrichedListingArray[0]; 
      
      return this._mapDbListingToProperty(enrichedListing);
    } catch (error) {
      console.error('Error fetching listing:', error);
      throw error; 
    }
  }

  /**
   * Get listings for a specific user
   */
  async getUserListings(userId: string): Promise<UserListing[]> {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select(`
          *, 
          premium_listings!fk_premium_property(status, end_date)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const enrichedListings = await this._enrichUserListingsWithLocationData(data || []);
      
      // Transform to UserListing interface
      const userListings: UserListing[] = enrichedListings.map((listing) => {
        // Get location names from enriched data
        const province = listing.province_name || '';
        const city = listing.city_name || '';
        
        // Use fallback image (ideally from property_media, but not fetched here for simplicity)
        const primaryImage = 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg';
        
        // Map status
        let status: 'active' | 'inactive' | 'expired' | 'pending';
        switch (listing.status) {
          case 'active':
            status = 'active';
            break;
          case 'pending':
          case 'draft':
            status = 'pending';
            break;
          case 'rejected':
          case 'rented':
          case 'sold':
            status = 'inactive';
            break;
          default:
            status = 'expired';
        }
        
        // Check if premium
        const premiumData = listing.premium_listings?.find(p => 
          p.status === 'active' && new Date(p.end_date) > new Date()
        );
        
        return {
          id: listing.id,
          title: listing.title,
          type: listing.property_type,
          purpose: listing.purpose,
          price: listing.price,
          priceUnit: listing.price_unit,
          status,
          isPremium: !!premiumData,
          premiumExpiresAt: premiumData?.end_date,
          views: listing.views,
          createdAt: listing.created_at,
          image: primaryImage,
          location: {
            city,
            province
          },
          bedrooms: listing.bedrooms || undefined,
          bathrooms: listing.bathrooms || undefined,
          buildingSize: listing.building_size || undefined,
          landSize: listing.land_size || undefined,
          floors: listing.floors || undefined
        };
      });
      
      return userListings;
    } catch (error) {
      console.error('Error fetching user listings:', error);
      throw error; // RE-THROW ERROR: Allow calling component to handle it
    }
  }
  
  /**
   * Create a new listing
   */
  async createListing(formData: ListingFormData, userId: string): Promise<string | null> {
    try {
      // Prepare listing data
      const listingData = this.prepareListingData(formData, userId);
      
      // Insert listing
      const { data, error } = await supabase
        .from('listings')
        .insert(listingData)
        .select('id')
        .single();
      
      if (error) throw error;
      if (!data) throw new Error('Failed to create listing');
      
      const listingId = data.id;
      
      // Upload images and create property media records
      if (formData.images.length > 0) {
        await this.savePropertyMedia(listingId, formData.images);
      }
      
      return listingId;
    } catch (error) {
      console.error('Error creating listing:', error);
      return null;
    }
  }

  /**
   * Update an existing listing
   */
  async updateListing(id: string, formData: ListingFormData, userId: string): Promise<boolean> {
    try {
      // Prepare listing data
      const listingData = this.prepareListingData(formData, userId);
      
      // Update listing
      const { error } = await supabase
        .from('listings')
        .update(listingData)
        .eq('id', id);
      
      if (error) throw error;
      
      // Delete existing media
      await supabase
        .from('property_media')
        .delete()
        .eq('listing_id', id);
      
      // Upload new images and create property media records
      if (formData.images.length > 0) {
        await this.savePropertyMedia(id, formData.images);
      }
      
      return true;
    } catch (error) {
      console.error('Error updating listing:', error);
      return false;
    }
  }

  /**
   * Update listing status
   */
  async updateListingStatus(id: string, status: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('listings')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error updating listing status:', error);
      return false;
    }
  }

  /**
   * Delete a listing
   */
  async deleteListing(id: string, userId: string): Promise<boolean> {
    try {
      // Delete property media first (foreign key constraint)
      const { error: mediaError } = await supabase
        .from('property_media')
        .delete()
        .eq('listing_id', id);
      
      if (mediaError) throw mediaError;
      
      // Delete the listing
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error deleting listing:', error);
      return false;
    }
  }

  /**
   * Increment view count for a listing
   */
  async incrementViewCount(id: string): Promise<void> {
    try {
      await supabase.rpc('increment_listing_views', { listing_id: id });
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
  }

  /**
   * Increment inquiry count for a listing
   */
  async incrementInquiryCount(id: string): Promise<void> {
    try {
      await supabase.rpc('increment_listing_inquiries', { listing_id: id });
    } catch (error) {
      console.error('Error incrementing inquiry count:', error);
    }
  }

  /**
   * Enrich listings with related data (locations, user profiles)
   * This avoids complex joins that can cause timeouts
   */
  private async enrichListingsWithRelatedData(listings: any[]): Promise<any[]> {
    if (!listings.length) return [];
    
    try {
      // Extract all unique IDs needed for related data
      const provinceIds = [...new Set(listings.map(listing => listing.province_id).filter(Boolean))];
      const cityIds = [...new Set(listings.map(listing => listing.city_id).filter(Boolean))];
      const districtIds = [...new Set(listings.map(listing => listing.district_id).filter(Boolean))];
      const userIds = [...new Set(listings.map(listing => listing.user_id).filter(Boolean))];
      
      // Fetch all locations in one query
      const { data: allLocations } = await supabase
        .from('locations')
        .select('id, name, type')
        .in('id', [...provinceIds, ...cityIds, ...districtIds]);
      
      // Fetch all user profiles in one query
      const { data: allUsers } = await supabase
        .from('user_profiles')
        .select('id, full_name, phone, company, avatar_url')
        .in('id', userIds);
      
      // Create lookup maps for quick access
      const locationsById = new Map();
      if (allLocations) {
        allLocations.forEach(location => {
          locationsById.set(location.id, location);
        });
      }
      
      const usersById = new Map();
      if (allUsers) {
        allUsers.forEach(user => {
          usersById.set(user.id, user);
        });
      }
      
      // Enrich each listing with its related data
      return listings.map(listing => {
        // Add location names
        const province = locationsById.get(listing.province_id);
        const city = locationsById.get(listing.city_id);
        const district = locationsById.get(listing.district_id);
        
        // Add user profile
        const userProfile = usersById.get(listing.user_id);
        
        return {
          ...listing,
          province_name: province?.name || '',
          city_name: city?.name || '',
          district_name: district?.name || '',
          user_profile: userProfile
        };
      });
    } catch (error) {
      console.error('Error enriching listings with related data:', error);
      return listings; // Return original listings if enrichment fails
    }
  }

  /**
   * Enrich listings with location data only (for user listings)
   */
  private async enrichListingsWithLocationData(listings: any[]): Promise<any[]> {
    if (!listings.length) return [];
    
    try {
      // Extract all unique location IDs
      const provinceIds = [...new Set(listings.map(listing => listing.province_id).filter(Boolean))];
      const cityIds = [...new Set(listings.map(listing => listing.city_id).filter(Boolean))];
      
      // Fetch all locations in one query
      const { data: allLocations } = await supabase
        .from('locations')
        .select('id, name, type')
        .in('id', [...provinceIds, ...cityIds]);
      
      // Create lookup map for quick access
      const locationsById = new Map();
      if (allLocations) {
        allLocations.forEach(location => {
          locationsById.set(location.id, location);
        });
      }
      
      // Enrich each listing with location names
      return listings.map(listing => {
        const province = locationsById.get(listing.province_id);
        const city = locationsById.get(listing.city_id);
        
        return {
          ...listing,
          province_name: province?.name || '',
          city_name: city?.name || ''
        };
      });
    } catch (error) {
      console.error('Error enriching listings with location data:', error);
      return listings; // Return original listings if enrichment fails
    }
  }

  /**
   * Upload an image to Supabase Storage
   */
  private async uploadImage(file: File | string, listingId: string): Promise<string> {
    // If the file is already a URL (not a data URL), return it
    if (typeof file === 'string' && !file.startsWith('data:')) {
      return file;
    }
    
    try {
      // For data URLs, convert to file
      let fileToUpload: File;
      if (typeof file === 'string') {
        // Convert data URL to File
        const res = await fetch(file);
        const blob = await res.blob();
        fileToUpload = new File([blob], `image-${Date.now()}.jpg`, { type: 'image/jpeg' });
      } else {
        fileToUpload = file;
      }
      
      // Generate a unique file name
      const fileName = `${listingId}/${Date.now()}-${fileToUpload.name.replace(/\s+/g, '-')}`;
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('property-images')
        .upload(fileName, fileToUpload, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) throw error;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('property-images')
        .getPublicUrl(data.path);
      
      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      // If upload fails, return the original URL
      return typeof file === 'string' ? file : '';
    }
  }

  /**
   * Save property media records
   */
  private async savePropertyMedia(listingId: string, images: string[]): Promise<void> {
    try {
      const mediaRecords = await Promise.all(images.map(async (image, index) => {
        // Upload image if it's a new one (data URL)
        let mediaUrl = image;
        if (image.startsWith('data:')) {
          mediaUrl = await this.uploadImage(image, listingId);
        }
        
        return {
          listing_id: listingId,
          media_url: mediaUrl,
          media_type: 'image',
          is_primary: index === 0 // First image is primary
        };
      }));
      
      // Insert media records
      const { error } = await supabase
        .from('property_media')
        .insert(mediaRecords);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error saving property media:', error);
    }
  }

  /**
   * Prepare listing data for database
   */
  private prepareListingData(formData: ListingFormData, userId: string): Partial<Listing> {
    return {
      user_id: userId,
      title: formData.title,
      description: formData.description,
      price: formData.price,
      price_unit: formData.priceUnit,
      property_type: formData.propertyType,
      purpose: formData.purpose,
      bedrooms: formData.bedrooms || null,
      bathrooms: formData.bathrooms || null,
      building_size: formData.buildingSize || null,
      land_size: formData.landSize || null,
      province_id: formData.province || null,
      city_id: formData.city || null,
      district_id: formData.district || null,
      address: formData.address || null,
      features: formData.features.length > 0 ? formData.features : null,
      status: 'pending', // New listings start as pending
      views: 0,
      inquiries: 0,
      is_promoted: false,
      floors: formData.floors || null
    };
  }

  /**
   * Map database listing response to Property interface (single listing)
   */
  private mapDbListingToProperty(dbListing: any): Property {
    const province = dbListing.province_name || '';
    const city = dbListing.city_name || '';
    const district = dbListing.district_name || '';
    
    // Get images from property_media
    let images = ['https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg']; // Default image
    if (dbListing.property_media && dbListing.property_media.length > 0) {
      images = dbListing.property_media.map((media: any) => media.media_url);
    }
    
    // Create agent object with minimal data for listing cards
    const userProfile = dbListing.user_profile || {};
    const agent = {
      id: dbListing.user_id,
      name: userProfile.full_name || 'Agent',
      phone: userProfile.phone || '',
      email: '', // Email not available in user_profiles
      avatar: userProfile.avatar_url,
      company: userProfile.company
    };
    
    // Map property type
    const propertyType = dbListing.property_type as PropertyType;
    
    return {
      id: dbListing.id,
      title: dbListing.title,
      description: dbListing.description,
      price: dbListing.price,
      priceUnit: dbListing.price_unit,
      type: propertyType,
      purpose: dbListing.purpose,
      bedrooms: dbListing.bedrooms || undefined,
      bathrooms: dbListing.bathrooms || undefined,
      buildingSize: dbListing.building_size || undefined,
      landSize: dbListing.land_size || undefined,
      floors: dbListing.floors || undefined,
      location: {
        province,
        city,
        district,
        address: dbListing.address || '',
        postalCode: dbListing.postal_code || undefined
      },
      images,
      features: dbListing.features || [],
      agent,
      createdAt: dbListing.created_at,
      isPromoted: dbListing.is_promoted,
      status: dbListing.status as ListingStatus,
      views: dbListing.views,
      inquiries: dbListing.inquiries
    };
  }

  /**
   * Map database listings response to Property interface (multiple listings)
   */
  private mapDbListingsToProperties(dbListings: any[]): Property[] {
    return dbListings.map(listing => this.mapDbListingToProperty(listing));
  }
}

export const listingService = new ListingService();