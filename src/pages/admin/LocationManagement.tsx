import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Plus, Eye, EyeOff, ChevronRight, ChevronDown, MapPin } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import DataTable, { Column } from '../../components/admin/DataTable';
import { Location, LocationHierarchy } from '../../types/admin';
import { locationService } from '../../services/locationService';
import { useToast } from '../../contexts/ToastContext';
import { Upload, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const LocationManagement: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationHierarchy, setLocationHierarchy] = useState<LocationHierarchy[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'hierarchy'>('table');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLocations();
  }, [filterType, filterStatus]);

  const fetchLocations = async () => {
    setIsLoading(true);
    try {
      const filters: any = {};
      
      if (filterType !== 'all') {
        filters.type = filterType;
      }
      
      if (filterStatus === 'active') {
        filters.isActive = true;
      } else if (filterStatus === 'inactive') {
        filters.isActive = false;
      }
      
      const data = await locationService.getAllLocations(filters);
      setLocations(data);
      setLocationHierarchy(locationService.buildLocationHierarchy(data));
    } catch (error) {
      console.error('Error fetching locations:', error);
      showError('Error', 'Failed to load locations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusToggle = async (locationId: string) => {
    try {
      const location = locations.find(l => l.id === locationId);
      if (!location) return;
      
      const newStatus = !location.isActive;
      const success = await locationService.toggleLocationStatus(locationId, newStatus);
      
      if (success) {
        setLocations(prev => 
          prev.map(location => 
            location.id === locationId 
              ? { ...location, isActive: newStatus, updatedAt: new Date().toISOString() }
              : location
          )
        );
        setLocationHierarchy(locationService.buildLocationHierarchy(
          locations.map(location => 
            location.id === locationId 
              ? { ...location, isActive: newStatus, updatedAt: new Date().toISOString() }
              : location
          )
        ));
        
        showSuccess(
          'Status Updated', 
          `Location "${location.name}" is now ${newStatus ? 'active' : 'inactive'}.`
        );
      } else {
        throw new Error('Failed to update location status');
      }
    } catch (error) {
      console.error('Error toggling location status:', error);
      showError('Error', 'Failed to update location status. Please try again.');
    }
  };

  const handleDeleteLocation = async (location: Location) => {
    if (location.propertyCount > 0) {
      showError(
        'Cannot Delete Location', 
        `Location "${location.name}" still has ${location.propertyCount} properties.`
      );
      return;
    }
    
    // Check if location has children
    const hasChildren = locations.some(l => l.parentId === location.id);
    if (hasChildren) {
      showError(
        'Cannot Delete Location', 
        `Location "${location.name}" still has sub-locations.`
      );
      return;
    }
    
    if (confirm(`Are you sure you want to delete location "${location.name}"?`)) {
      try {
        const success = await locationService.deleteLocation(location.id);
        
        if (success) {
          const updatedLocations = locations.filter(l => l.id !== location.id);
          setLocations(updatedLocations);
          setLocationHierarchy(locationService.buildLocationHierarchy(updatedLocations));
          
          showSuccess('Location Deleted', `Location "${location.name}" has been deleted successfully.`);
        } else {
          throw new Error('Failed to delete location');
        }
      } catch (error) {
        console.error('Error deleting location:', error);
        showError('Error', 'Failed to delete location. Please try again.');
      }
    }
  };

  const handleEditLocation = (location: Location) => {
    setSelectedLocation(location);
    setShowLocationModal(true);
  };

  const getTypeLabel = (type: string) => {
    const typeMap = {
      province: 'Provinsi',
      city: 'Kota/Kabupaten',
      district: 'Kecamatan',
      subdistrict: 'Kelurahan/Desa',
    };
    return typeMap[type as keyof typeof typeMap] || type;
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
        isActive 
          ? 'bg-green-100 text-green-800' 
          : 'bg-gray-100 text-gray-800'
      }`}>
        {isActive ? (
          <>
            <Eye size={12} className="mr-1" />
            Aktif
          </>
        ) : (
          <>
            <EyeOff size={12} className="mr-1" />
            Tidak Aktif
          </>
        )}
      </span>
    );
  };

  const toggleNodeExpansion = (nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  // Filter locations based on selected filters
  const filteredLocations = locations.filter(location => {
    if (filterType !== 'all' && location.type !== filterType) return false;
    if (filterStatus === 'active' && !location.isActive) return false;
    if (filterStatus === 'inactive' && location.isActive) return false;
    return true;
  });

  const columns: Column<Location>[] = [
    {
      key: 'name',
      title: 'Lokasi',
      sortable: true,
      render: (value, record) => (
        <div className="flex items-center">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
            <MapPin size={16} className="text-primary" />
          </div>
          <div>
            <div className="font-medium text-neutral-900">{value}</div>
            <div className="text-sm text-neutral-500">{record.slug}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      title: 'Tipe',
      sortable: true,
      render: (value) => (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
          {getTypeLabel(value)}
        </span>
      ),
    },
    {
      key: 'parentId',
      title: 'Parent',
      render: (value) => {
        if (!value) return '-';
        const parent = locations.find(l => l.id === value);
        return parent ? parent.name : '-';
      },
    },
    {
      key: 'propertyCount',
      title: 'Jumlah Properti',
      sortable: true,
      render: (value) => (
        <span className="font-medium">{value.toLocaleString()}</span>
      ),
    },
    {
      key: 'isActive',
      title: 'Status',
      sortable: true,
      render: (value) => getStatusBadge(value),
    },
    {
      key: 'updatedAt',
      title: 'Terakhir Diperbarui',
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString('id-ID'),
    },
  ];

  const renderActions = (location: Location) => (
    <div className="flex items-center space-x-2">
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleStatusToggle(location.id);
        }}
        className={`p-1 rounded ${
          location.isActive 
            ? 'text-gray-600 hover:text-gray-800' 
            : 'text-green-600 hover:text-green-800'
        }`}
        title={location.isActive ? 'Nonaktifkan' : 'Aktifkan'}
      >
        {location.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleEditLocation(location);
        }}
        className="p-1 text-neutral-500 hover:text-primary"
        title="Edit"
      >
        <Edit size={16} />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleDeleteLocation(location);
        }}
        className="p-1 text-neutral-500 hover:text-red-600"
        title="Hapus"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );

  const renderHierarchyNode = (node: LocationHierarchy, level: number = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    
    return (
      <div key={node.id}>
        <div 
          className={`flex items-center py-2 px-4 hover:bg-neutral-50 cursor-pointer ${
            level > 0 ? `ml-${level * 6}` : ''
          }`}
          style={{ paddingLeft: `${level * 24 + 16}px` }}
          onClick={() => handleEditLocation(node)}
        >
          <div className="flex items-center flex-1">
            {hasChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNodeExpansion(node.id);
                }}
                className="mr-2 p-1 hover:bg-neutral-200 rounded"
              >
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
            )}
            {!hasChildren && <div className="w-6" />}
            
            <div className="w-6 h-6 bg-primary/10 rounded flex items-center justify-center mr-3">
              <MapPin size={12} className="text-primary" />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{node.name}</span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                  {getTypeLabel(node.type)}
                </span>
                {getStatusBadge(node.isActive)}
              </div>
              <div className="text-sm text-neutral-500">
                {node.propertyCount} properti
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleStatusToggle(node.id);
              }}
              className={`p-1 rounded ${
                node.isActive 
                  ? 'text-gray-600 hover:text-gray-800' 
                  : 'text-green-600 hover:text-green-800'
              }`}
            >
              {node.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEditLocation(node);
              }}
              className="p-1 text-neutral-500 hover:text-primary"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteLocation(node);
              }}
              className="p-1 text-neutral-500 hover:text-red-600"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        
        {hasChildren && isExpanded && (
          <div>
            {node.children!.map(child => renderHierarchyNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <Helmet>
        <title>Manajemen Lokasi | Admin Properti Pro</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">Manajemen Lokasi</h1>
            <p className="text-neutral-600">Kelola hierarki lokasi properti di platform</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex border rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 text-sm ${
                  viewMode === 'table' 
                    ? 'bg-primary text-white' 
                    : 'bg-white text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                Tabel
              </button>
              <button
                onClick={() => setViewMode('hierarchy')}
                className={`px-4 py-2 text-sm ${
                  viewMode === 'hierarchy' 
                    ? 'bg-primary text-white' 
                    : 'bg-white text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                Hierarki
              </button>
            </div>
            <button
              onClick={() => {
                setSelectedLocation(null);
                setShowLocationModal(true);
              }}
              className="btn-primary flex items-center"
            >
              <Plus size={18} className="mr-2" />
              Tambah Lokasi
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Tipe Lokasi
            </label>
            <select
              className="px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">Semua Tipe</option>
              <option value="province">Provinsi</option>
              <option value="city">Kota/Kabupaten</option>
              <option value="district">Kecamatan</option>
              <option value="subdistrict">Kelurahan/Desa</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Status
            </label>
            <select
              className="px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Tidak Aktif</option>
            </select>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-2xl font-bold text-neutral-900">
            {locations.length}
          </div>
          <div className="text-sm text-neutral-600">Total Lokasi</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-2xl font-bold text-blue-600">
            {locations.filter(l => l.type === 'province').length}
          </div>
          <div className="text-sm text-neutral-600">Provinsi</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-2xl font-bold text-green-600">
            {locations.filter(l => l.type === 'city').length}
          </div>
          <div className="text-sm text-neutral-600">Kota/Kabupaten</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-2xl font-bold text-yellow-600">
            {locations.filter(l => l.type === 'district').length}
          </div>
          <div className="text-sm text-neutral-600">Kecamatan</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-2xl font-bold text-purple-600">
            {locations.reduce((sum, l) => sum + l.propertyCount, 0).toLocaleString()}
          </div>
          <div className="text-sm text-neutral-600">Total Properti</div>
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'table' ? (
        <DataTable
          data={filteredLocations}
          columns={columns}
          actions={renderActions}
          searchable
          pagination
          pageSize={10}
          loading={isLoading}
          onRowClick={(location) => handleEditLocation(location)}
        />
      ) : (
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b border-neutral-200">
            <h3 className="font-medium text-neutral-900">Hierarki Lokasi</h3>
          </div>
          {isLoading ? (
            <div className="p-8 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {locationHierarchy.length > 0 ? (
                locationHierarchy.map(node => renderHierarchyNode(node))
              ) : (
                <div className="p-8 text-center text-neutral-500">
                  Tidak ada data lokasi yang ditemukan
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Location Form Modal */}
      {showLocationModal && (
        <LocationFormModal
          location={selectedLocation}
          locations={locations}
          onClose={() => setShowLocationModal(false)}
          onSave={async (location) => {
            try {
              if (selectedLocation) {
                // Update existing location
                const updatedLocation = await locationService.updateLocation(location.id, location);
                
                if (updatedLocation) {
                  const updatedLocations = locations.map(l => l.id === location.id ? updatedLocation : l);
                  setLocations(updatedLocations);
                  setLocationHierarchy(locationService.buildLocationHierarchy(updatedLocations));
                  
                  showSuccess('Location Updated', `Location "${location.name}" has been updated successfully.`);
                } else {
                  throw new Error('Failed to update location');
                }
              } else {
                // Create new location
                const newLocation = await locationService.createLocation(location);
                
                if (newLocation) {
                  const updatedLocations = [...locations, newLocation];
                  setLocations(updatedLocations);
                  setLocationHierarchy(locationService.buildLocationHierarchy(updatedLocations));
                  
                  showSuccess('Location Created', `Location "${location.name}" has been created successfully.`);
                } else {
                  throw new Error('Failed to create location');
                }
              }
              
              setShowLocationModal(false);
            } catch (error) {
              console.error('Error saving location:', error);
              showError('Error', 'Failed to save location. Please try again.');
            }
          }}
        />
      )}
    </div>
  );
};

// Location Form Modal Component
interface LocationFormModalProps {
  location: Location | null;
  locations: Location[];
  onClose: () => void;
  onSave: (location: Location) => void;
}

const LocationFormModal: React.FC<LocationFormModalProps> = ({
  location,
  locations,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    name: location?.name || '',
    slug: location?.slug || '',
    type: location?.type || ('provinsi' as const), // Ensure type matches DB enum
    parentId: location?.parent_id || '', // Use parent_id from existing location
    description: location?.description || '',
    isActive: location?.is_active ?? true, // Use is_active from existing location
    latitude: location?.latitude || 0,
    longitude: location?.longitude || 0,
    image_url: location?.image_url || '', // Initialize with existing image URL
    image_alt_text: location?.image_alt_text || '', // Initialize with existing alt text
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>(formData.image_url || ''); // Use formData.image_url for initial preview
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);

  const [availableParents, setAvailableParents] = useState<Location[]>([]);
  const [isLoadingParents, setIsLoadingParents] = useState(false);
  const { showError } = useToast();

  useEffect(() => {
    // Update image preview if formData.image_url changes (e.g., when editing an existing location)
    setImagePreviewUrl(formData.image_url || '');
  }, [formData.image_url]);

  useEffect(() => {
    loadAvailableParents();
  }, [formData.type]);

  const loadAvailableParents = async () => {
    const typeHierarchy: { [key: string]: string[] } = { // Explicitly define typeHierarchy
      provinsi: [],
      kota: ['provinsi'],
      kecamatan: ['kota'],
      kelurahan: ['kecamatan'],
    };
    
    const allowedParentTypes = typeHierarchy[formData.type];
    
    if (!allowedParentTypes || allowedParentTypes.length === 0) {
      setAvailableParents([]);
      setFormData(prev => ({ ...prev, parentId: '' })); // Clear parentId if no parent type
      return;
    }
    
    setIsLoadingParents(true);
    try {
      // Fetch parents based on the allowed parent type (assuming only one level up)
      const parents = await locationService.getAllLocations({
        type: allowedParentTypes[0], // Get locations of the allowed parent type
        isActive: true,
      });
      
      // Filter out the current location to prevent circular references
      setAvailableParents(
        parents.filter(p => p.id !== location?.id)
      );
    } catch (error) {
      console.error('Error loading available parents:', error);
      showError('Error', 'Failed to load parent locations. Please try again.');
    } finally {
      setIsLoadingParents(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name),
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate image file types
      if (!file.type.startsWith('image/')) {
        setImageUploadError('Invalid file type. Please select an image (PNG, JPG, GIF).');
        setImageFile(null);
        setImagePreviewUrl('');
        return;
      }
      // Validate image file size (e.g., 5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setImageUploadError('File size too large. Maximum 5MB.');
        setImageFile(null);
        setImagePreviewUrl('');
        return;
      }

      setImageFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
      setImageUploadError(null); // Clear previous errors
    } else {
      setImageFile(null);
      setImagePreviewUrl(formData.image_url || ''); // Revert to existing image if input cleared
      setImageUploadError(null);
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    // If no new file is selected and there's an existing URL, return it
    if (!imageFile && formData.image_url) return formData.image_url;
    // If no new file and no existing URL, return null
    if (!imageFile && !formData.image_url) return null;

    setIsUploadingImage(true);
    setImageUploadError(null);

    try {
      const fileExtension = imageFile!.name.split('.').pop();
      // Ensure slug is available for folder structure, fallback to a generic name
      const folderName = formData.slug || 'untitled-location';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExtension}`;
      const filePath = `${folderName}/${fileName}`; // Organize by location slug

      const { data, error } = await supabase.storage
        .from('location-images') // Use your bucket name
        .upload(filePath, imageFile!, {
          cacheControl: '3600', // Cache for 1 hour
          upsert: false, // Do not overwrite if file exists (unique naming prevents this)
        });

      if (error) {
        throw error;
      }

      const { data: publicUrlData } = supabase.storage
        .from('location-images')
        .getPublicUrl(data.path);

      return publicUrlData.publicUrl;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      setImageUploadError(`Failed to upload image: ${error.message}`);
      return null;
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation for required fields
    if (!formData.name || !formData.slug || !formData.type) {
      showError('Validation Error', 'Please fill in all required fields.');
      return;
    }
    if (formData.type !== 'provinsi' && !formData.parentId) {
      showError('Validation Error', 'Parent location is required for non-province types.');
      return;
    }

    let finalImageUrl: string | null = formData.image_url;

    // Only attempt upload if a new file is selected or existing image is cleared
    if (imageFile || (formData.image_url && imagePreviewUrl === '')) {
      finalImageUrl = await uploadImage();
      if (finalImageUrl === null && imageFile) { // If upload failed for a new file
        showError('Upload Failed', 'Could not upload image. Please try again.');
        return;
      }
    } else if (!imageFile && imagePreviewUrl === '') {
        // If user explicitly cleared the image and didn't select a new one
        finalImageUrl = null;
    }

    const newLocation: Location = {
      id: location?.id || crypto.randomUUID(), // Use crypto.randomUUID() for new IDs
      name: formData.name,
      slug: formData.slug,
      type: formData.type,
      parent_id: formData.parentId || null,
      description: formData.description || null,
      is_active: formData.isActive,
      property_count: location?.property_count || 0, // Keep existing count
      latitude: formData.latitude,
      longitude: formData.longitude,
      image_url: finalImageUrl, // Store the uploaded URL or null
      image_alt_text: formData.image_alt_text || formData.name, // Use name as default alt text
      created_at: location?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    onSave(newLocation);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-neutral-200">
          <h2 className="text-xl font-semibold">
            {location ? 'Edit Lokasi' : 'Tambah Lokasi'}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Nama Lokasi
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Slug
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Tipe Lokasi
              </label>
              <select
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  type: e.target.value as any,
                  parentId: '' // Reset parent when type changes
                }))}
              >
                <option value="provinsi">Provinsi</option>
                <option value="kota">Kota/Kabupaten</option>
                <option value="kecamatan">Kecamatan</option>
                <option value="kelurahan">Kelurahan/Desa</option>
              </select>
            </div>
            
            {formData.type !== 'provinsi' && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Parent Lokasi
                </label>
                <select
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={formData.parentId}
                  onChange={(e) => setFormData(prev => ({ ...prev, parentId: e.target.value }))}
                  required
                  disabled={isLoadingParents}
                >
                  <option value="">Pilih Parent Lokasi</option>
                  {availableParents.map(parent => (
                    <option key={parent.id} value={parent.id}>
                      {parent.name}
                    </option>
                  ))}
                </select>
                {isLoadingParents && (
                  <div className="text-xs text-neutral-500 mt-1">Loading parent locations...</div>
                )}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Deskripsi
              </label>
              <textarea
                rows={3}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Deskripsi lokasi (opsional)"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={formData.latitude}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    latitude: parseFloat(e.target.value) || 0 
                  }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={formData.longitude}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    longitude: parseFloat(e.target.value) || 0 
                  }))}
                />
              </div>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                className="h-4 w-4 text-primary border-neutral-300 rounded focus:ring-primary"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              />
              <label htmlFor="isActive" className="ml-2 text-sm text-neutral-700">
                Lokasi aktif
              </label>
            </div>

            {/* Image Upload Field */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Gambar Lokasi
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-neutral-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  {imagePreviewUrl ? (
                    <div className="relative w-32 h-32 mx-auto mb-2">
                      <img src={imagePreviewUrl} alt="Image Preview" className="w-full h-full object-cover rounded-md" />
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreviewUrl('');
                          setFormData(prev => ({ ...prev, image_url: '' })); // Clear URL in form data
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        aria-label="Remove image"
                      >
                        <XCircle size={16} />
                      </button>
                    </div>
                  ) : (
                    <Upload size={32} className="mx-auto text-neutral-400" />
                  )}
                  <div className="flex text-sm text-neutral-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary/80 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary"
                    >
                      <span>Upload a file</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        accept="image/*"
                        onChange={handleImageChange}
                        disabled={isUploadingImage}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-neutral-500">PNG, JPG, GIF up to 5MB</p>
                  {imageUploadError && (
                    <p className="text-red-500 text-xs mt-1">{imageUploadError}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Image Alt Text */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Deskripsi Gambar (Alt Text)
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={formData.image_alt_text}
                onChange={(e) => setFormData(prev => ({ ...prev, image_alt_text: e.target.value }))}
                placeholder="Contoh: Pemandangan kota Jakarta"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-neutral-600 hover:text-neutral-800"
              disabled={isUploadingImage}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isUploadingImage}
            >
              {isUploadingImage ? 'Mengunggah...' : (location ? 'Simpan Perubahan' : 'Tambah Lokasi')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LocationManagement;