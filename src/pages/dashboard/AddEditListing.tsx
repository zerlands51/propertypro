import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Save, 
  ArrowLeft, 
  Upload, 
  X, 
  Crown,
  MapPin,
  Home,
  DollarSign
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { provinces, cities, districts } from '../../data/locations';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

interface ListingFormData {
  title: string;
  description: string;
  propertyType: 'rumah' | 'apartemen' | 'ruko' | 'tanah';
  purpose: 'jual' | 'sewa';
  price: number;
  priceUnit: 'juta' | 'miliar';
  bedrooms: number;
  bathrooms: number;
  buildingSize: number;
  landSize: number;
  province: string;
  city: string;
  district: string;
  address: string;
  features: string[];
  images: string[];
  makePremium: boolean;
}

const AddEditListing: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const isEdit = !!id;
  
  const [isLoading, setIsLoading] = useState(false);
  const [filteredCities, setFilteredCities] = useState(cities);
  const [filteredDistricts, setFilteredDistricts] = useState(districts);
  const [newFeature, setNewFeature] = useState('');

  const [formData, setFormData] = useState<ListingFormData>({
    title: '',
    description: '',
    propertyType: 'rumah',
    purpose: 'jual',
    price: 0,
    priceUnit: 'juta',
    bedrooms: 0,
    bathrooms: 0,
    buildingSize: 0,
    landSize: 0,
    province: '',
    city: '',
    district: '',
    address: '',
    features: [],
    images: [],
    makePremium: false
  });

  useEffect(() => {
    if (isEdit && id) {
      // Load existing listing data
      fetchListing(id);
    }
  }, [isEdit, id]);

  const fetchListing = async (listingId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', listingId)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        // Parse location data
        const locationParts = data.location.split(', ');
        const districtName = locationParts[0] || '';
        const cityName = locationParts[1] || '';
        const provinceName = locationParts[2] || '';

        // Find IDs from names
        const provinceId = provinces.find(p => p.name === provinceName)?.id || '';
        const cityId = cities.find(c => c.name === cityName && c.provinceId === provinceId)?.id || '';
        const districtId = districts.find(d => d.name === districtName && d.cityId === cityId)?.id || '';

        // Convert property data to form data
        setFormData({
          title: data.title,
          description: data.description,
          propertyType: data.property_type,
          purpose: data.status === 'tersedia' ? 'jual' : 'sewa', // Map status to purpose
          price: parseFloat(data.price),
          priceUnit: parseFloat(data.price) >= 1000 ? 'miliar' : 'juta',
          bedrooms: data.bedrooms || 0,
          bathrooms: data.bathrooms || 0,
          buildingSize: data.square_meters,
          landSize: data.land_size || 0,
          province: provinceId,
          city: cityId,
          district: districtId,
          address: data.address || '',
          features: data.features || [],
          images: [], // We'll need to fetch images separately
          makePremium: false
        });

        // Fetch property media (images)
        const { data: mediaData, error: mediaError } = await supabase
          .from('property_media')
          .select('*')
          .eq('listing_id', listingId)
          .order('is_primary', { ascending: false });

        if (!mediaError && mediaData) {
          setFormData(prev => ({
            ...prev,
            images: mediaData.map(item => item.media_url)
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching listing:', error);
      showError('Error', 'Failed to load property data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (formData.province) {
      const filtered = cities.filter(city => city.provinceId === formData.province);
      setFilteredCities(filtered);
      if (formData.city && !filtered.find(c => c.id === formData.city)) {
        setFormData(prev => ({ ...prev, city: '', district: '' }));
      }
    }
  }, [formData.province]);

  useEffect(() => {
    if (formData.city) {
      const filtered = districts.filter(district => district.cityId === formData.city);
      setFilteredDistricts(filtered);
      if (formData.district && !filtered.find(d => d.id === formData.district)) {
        setFormData(prev => ({ ...prev, district: '' }));
      }
    }
  }, [formData.city]);

  const handleInputChange = (field: keyof ListingFormData, value: any) => {
    // Convert numeric string inputs to numbers
    if (['price', 'bedrooms', 'bathrooms', 'buildingSize', 'landSize'].includes(field)) {
      const numValue = value === '' ? 0 : parseFloat(value);
      setFormData(prev => ({ ...prev, [field]: numValue }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, imageUrl]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const addFeature = () => {
    if (newFeature.trim() && !formData.features.includes(newFeature.trim())) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }));
      setNewFeature('');
    }
  };

  const removeFeature = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter(f => f !== feature)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      showError('Authentication Error', 'You must be logged in to create or edit listings.');
      return;
    }
    
    setIsLoading(true);

    try {
      // Get location names from IDs
      const province = provinces.find(p => p.id === formData.province)?.name || '';
      const city = cities.find(c => c.id === formData.city)?.name || '';
      const district = districts.find(d => d.id === formData.district)?.name || '';
      
      // Format location string
      const location = `${district}, ${city}, ${province}`;
      
      // Prepare listing data
      const listingData = {
        title: formData.title,
        description: formData.description,
        price: formData.price,
        location: location,
        property_type: formData.propertyType,
        status: 'tersedia', // Default status
        square_meters: formData.buildingSize,
        bedrooms: formData.bedrooms || null,
        bathrooms: formData.bathrooms || null,
        features: formData.features,
        address: formData.address,
        land_size: formData.landSize || null,
        user_id: user.id
      };

      let listingId = id;
      
      if (isEdit) {
        // Update existing listing
        const { error } = await supabase
          .from('listings')
          .update(listingData)
          .eq('id', id);

        if (error) throw error;
      } else {
        // Insert new listing
        const { data, error } = await supabase
          .from('listings')
          .insert(listingData)
          .select('id')
          .single();

        if (error) throw error;
        listingId = data.id;
      }

      // Handle images
      if (listingId) {
        // If editing, first delete existing images
        if (isEdit) {
          await supabase
            .from('property_media')
            .delete()
            .eq('listing_id', listingId);
        }
        
        // Insert new images
        const mediaInserts = formData.images.map((url, index) => ({
          listing_id: listingId,
          media_url: url,
          media_type: 'photo',
          is_primary: index === 0 // First image is primary
        }));
        
        if (mediaInserts.length > 0) {
          const { error: mediaError } = await supabase
            .from('property_media')
            .insert(mediaInserts);
            
          if (mediaError) throw mediaError;
        }
      }

      showSuccess(
        isEdit ? 'Listing Updated' : 'Listing Created',
        isEdit ? 'Your property listing has been updated successfully.' : 'Your property listing has been created successfully.'
      );
      
      if (formData.makePremium) {
        // Redirect to premium upgrade
        navigate(`/premium/upgrade?propertyId=${listingId}`);
      } else {
        // Redirect to listings
        navigate('/dashboard/listings');
      }
    } catch (error: any) {
      console.error('Failed to save listing:', error);
      showError('Error', error.message || 'Failed to save listing. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && isEdit) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <Helmet>
        <title>{isEdit ? 'Edit Iklan' : 'Tambah Iklan'} | Dashboard Properti Pro</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/dashboard/listings')}
          className="flex items-center text-neutral-600 hover:text-neutral-800 mb-4"
        >
          <ArrowLeft size={20} className="mr-2" />
          Kembali ke Iklan Saya
        </button>
        
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">
          {isEdit ? 'Edit Iklan' : 'Tambah Iklan Baru'}
        </h1>
        <p className="text-neutral-600">
          {isEdit ? 'Perbarui informasi iklan properti Anda' : 'Buat iklan properti baru untuk dipublikasikan'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center">
            <Home size={20} className="mr-2" />
            Informasi Dasar
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Judul Iklan *
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Contoh: Rumah Minimalis 2 Lantai di Jakarta Selatan"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Jenis Properti *
              </label>
              <select
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={formData.propertyType}
                onChange={(e) => handleInputChange('propertyType', e.target.value)}
                required
              >
                <option value="rumah">Rumah</option>
                <option value="apartemen">Apartemen</option>
                <option value="ruko">Ruko</option>
                <option value="tanah">Tanah</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Tujuan *
              </label>
              <select
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={formData.purpose}
                onChange={(e) => handleInputChange('purpose', e.target.value as 'jual' | 'sewa')}
                required
              >
                <option value="jual">Dijual</option>
                <option value="sewa">Disewa</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Deskripsi *
              </label>
              <textarea
                rows={4}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Deskripsikan properti Anda secara detail..."
                required
                minLength={50}
              />
              <p className="text-xs text-neutral-500 mt-1">
                Minimal 50 karakter
              </p>
            </div>
          </div>
        </div>

        {/* Price Information */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center">
            <DollarSign size={20} className="mr-2" />
            Informasi Harga
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Harga *
              </label>
              <input
                type="number"
                step="0.1"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={formData.price || ''}
                onChange={(e) => handleInputChange('price', e.target.value)}
                placeholder="2.5"
                required
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Satuan Harga *
              </label>
              <select
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={formData.priceUnit}
                onChange={(e) => handleInputChange('priceUnit', e.target.value as 'juta' | 'miliar')}
                required
              >
                <option value="juta">Juta</option>
                <option value="miliar">Miliar</option>
              </select>
            </div>
          </div>
        </div>

        {/* Property Details */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Detail Properti</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Kamar Tidur
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={formData.bedrooms || ''}
                onChange={(e) => handleInputChange('bedrooms', e.target.value)}
                placeholder="3"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Kamar Mandi
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={formData.bathrooms || ''}
                onChange={(e) => handleInputChange('bathrooms', e.target.value)}
                placeholder="2"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Luas Bangunan (m²) *
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={formData.buildingSize || ''}
                onChange={(e) => handleInputChange('buildingSize', e.target.value)}
                placeholder="150"
                required
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Luas Tanah (m²)
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={formData.landSize || ''}
                onChange={(e) => handleInputChange('landSize', e.target.value)}
                placeholder="200"
                min="0"
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center">
            <MapPin size={20} className="mr-2" />
            Lokasi
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Provinsi *
              </label>
              <select
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={formData.province}
                onChange={(e) => handleInputChange('province', e.target.value)}
                required
              >
                <option value="">Pilih Provinsi</option>
                {provinces.map(province => (
                  <option key={province.id} value={province.id}>{province.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Kota/Kabupaten *
              </label>
              <select
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                disabled={!formData.province}
                required
              >
                <option value="">Pilih Kota/Kabupaten</option>
                {filteredCities.map(city => (
                  <option key={city.id} value={city.id}>{city.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Kecamatan *
              </label>
              <select
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={formData.district}
                onChange={(e) => handleInputChange('district', e.target.value)}
                disabled={!formData.city}
                required
              >
                <option value="">Pilih Kecamatan</option>
                {filteredDistricts.map(district => (
                  <option key={district.id} value={district.id}>{district.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Alamat Lengkap *
            </label>
            <textarea
              rows={2}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Jl. Contoh No. 123, RT/RW 01/02"
              required
              minLength={5}
            />
          </div>
        </div>

        {/* Features */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Fasilitas & Fitur</h2>
          
          <div className="mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                placeholder="Tambah fasilitas (contoh: Carport, Taman, Security 24 Jam)"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
              />
              <button
                type="button"
                onClick={addFeature}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                Tambah
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {formData.features.map((feature, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 bg-neutral-100 text-neutral-700 rounded-full text-sm"
              >
                {feature}
                <button
                  type="button"
                  onClick={() => removeFeature(feature)}
                  className="ml-2 text-neutral-500 hover:text-red-500"
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Images */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Foto Properti</h2>
          
          <div className="mb-4">
            <label className="block w-full">
              <div className="border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center hover:border-primary cursor-pointer">
                <Upload size={32} className="mx-auto text-neutral-400 mb-2" />
                <p className="text-neutral-600">Klik untuk upload foto atau drag & drop</p>
                <p className="text-sm text-neutral-500 mt-1">PNG, JPG hingga 10MB</p>
              </div>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {formData.images.map((image, index) => (
              <div key={index} className="relative">
                <img
                  src={image}
                  alt={`Property ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Premium Option */}
        <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg p-6 border border-yellow-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Crown size={24} className="text-yellow-600 mr-3" />
              <div>
                <h3 className="font-semibold text-yellow-800">Jadikan Premium</h3>
                <p className="text-sm text-yellow-700">
                  Tingkatkan visibilitas iklan Anda dengan fitur premium
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={formData.makePremium}
                onChange={(e) => handleInputChange('makePremium', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
            </label>
          </div>
          
          {formData.makePremium && (
            <div className="mt-4 p-3 bg-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                Setelah menyimpan iklan, Anda akan diarahkan ke halaman pembayaran premium.
              </p>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/dashboard/listings')}
            className="px-6 py-2 border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={18} className="mr-2" />
            {isLoading ? 'Menyimpan...' : (isEdit ? 'Simpan Perubahan' : 'Publikasikan Iklan')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddEditListing;