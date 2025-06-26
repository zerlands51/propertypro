import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Plus, Eye, EyeOff, ChevronRight, ChevronDown, MapPin } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import DataTable, { Column } from '../../components/admin/DataTable';
import { Location, LocationHierarchy } from '../../types/admin';
import { adminLocations, buildLocationHierarchy } from '../../data/adminLocations';

const LocationManagement: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationHierarchy, setLocationHierarchy] = useState<LocationHierarchy[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'hierarchy'>('table');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLocations(adminLocations);
    setLocationHierarchy(buildLocationHierarchy(adminLocations));
  }, []);

  const handleStatusToggle = (locationId: string) => {
    setLocations(prev => {
      const updated = prev.map(location => 
        location.id === locationId 
          ? { ...location, isActive: !location.isActive, updatedAt: new Date().toISOString() }
          : location
      );
      setLocationHierarchy(buildLocationHierarchy(updated));
      return updated;
    });
  };

  const handleDeleteLocation = (location: Location) => {
    if (location.propertyCount > 0) {
      alert(`Tidak dapat menghapus lokasi "${location.name}" karena masih memiliki ${location.propertyCount} properti.`);
      return;
    }
    
    // Check if location has children
    const hasChildren = locations.some(l => l.parentId === location.id);
    if (hasChildren) {
      alert(`Tidak dapat menghapus lokasi "${location.name}" karena masih memiliki sub-lokasi.`);
      return;
    }
    
    if (confirm(`Apakah Anda yakin ingin menghapus lokasi "${location.name}"?`)) {
      const updated = locations.filter(l => l.id !== location.id);
      setLocations(updated);
      setLocationHierarchy(buildLocationHierarchy(updated));
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
          onRowClick={(location) => handleEditLocation(location)}
        />
      ) : (
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b border-neutral-200">
            <h3 className="font-medium text-neutral-900">Hierarki Lokasi</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {locationHierarchy.map(node => renderHierarchyNode(node))}
          </div>
        </div>
      )}

      {/* Location Form Modal */}
      {showLocationModal && (
        <LocationFormModal
          location={selectedLocation}
          locations={locations}
          onClose={() => setShowLocationModal(false)}
          onSave={(location) => {
            if (selectedLocation) {
              const updated = locations.map(l => l.id === location.id ? location : l);
              setLocations(updated);
              setLocationHierarchy(buildLocationHierarchy(updated));
            } else {
              const updated = [...locations, location];
              setLocations(updated);
              setLocationHierarchy(buildLocationHierarchy(updated));
            }
            setShowLocationModal(false);
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
  onSave 
}) => {
  const [formData, setFormData] = useState({
    name: location?.name || '',
    slug: location?.slug || '',
    type: location?.type || 'province' as const,
    parentId: location?.parentId || '',
    description: location?.description || '',
    isActive: location?.isActive ?? true,
    coordinates: {
      latitude: location?.coordinates?.latitude || 0,
      longitude: location?.coordinates?.longitude || 0,
    },
  });

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

  const getAvailableParents = () => {
    const typeHierarchy = {
      province: [],
      city: ['province'],
      district: ['city'],
      subdistrict: ['district'],
    };
    
    const allowedParentTypes = typeHierarchy[formData.type];
    return locations.filter(l => 
      allowedParentTypes.includes(l.type) && 
      l.id !== location?.id &&
      l.isActive
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newLocation: Location = {
      id: location?.id || Date.now().toString(),
      ...formData,
      propertyCount: location?.propertyCount || 0,
      createdAt: location?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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
                <option value="province">Provinsi</option>
                <option value="city">Kota/Kabupaten</option>
                <option value="district">Kecamatan</option>
                <option value="subdistrict">Kelurahan/Desa</option>
              </select>
            </div>
            
            {formData.type !== 'province' && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Parent Lokasi
                </label>
                <select
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={formData.parentId}
                  onChange={(e) => setFormData(prev => ({ ...prev, parentId: e.target.value }))}
                  required
                >
                  <option value="">Pilih Parent Lokasi</option>
                  {getAvailableParents().map(parent => (
                    <option key={parent.id} value={parent.id}>
                      {parent.name}
                    </option>
                  ))}
                </select>
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
                  value={formData.coordinates.latitude}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    coordinates: { 
                      ...prev.coordinates, 
                      latitude: parseFloat(e.target.value) || 0 
                    }
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
                  value={formData.coordinates.longitude}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    coordinates: { 
                      ...prev.coordinates, 
                      longitude: parseFloat(e.target.value) || 0 
                    }
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
          </div>
          
          <div className="flex justify-end space-x-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-neutral-600 hover:text-neutral-800"
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              {location ? 'Simpan Perubahan' : 'Tambah Lokasi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LocationManagement;