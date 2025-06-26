import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Eye, Plus, CheckCircle, XCircle, Clock, Image, MapPin } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import DataTable, { Column } from '../../components/admin/DataTable';
import { Property } from '../../types';
import { properties as mockProperties } from '../../data/properties';
import { formatPrice } from '../../utils/formatter';

interface PropertyWithStatus extends Property {
  status: 'pending' | 'approved' | 'rejected' | 'published' | 'unpublished';
  views: number;
  inquiries: number;
}

const PropertyManagement: React.FC = () => {
  const [properties, setProperties] = useState<PropertyWithStatus[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<PropertyWithStatus | null>(null);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPurpose, setFilterPurpose] = useState<string>('all');

  useEffect(() => {
    // Convert mock properties to properties with status
    const propertiesWithStatus: PropertyWithStatus[] = mockProperties.map((property, index) => ({
      ...property,
      status: ['pending', 'approved', 'published', 'unpublished'][index % 4] as any,
      views: Math.floor(Math.random() * 1000) + 50,
      inquiries: Math.floor(Math.random() * 50) + 1,
    }));
    setProperties(propertiesWithStatus);
  }, []);

  const handleStatusChange = (propertyId: string, newStatus: PropertyWithStatus['status']) => {
    setProperties(prev => 
      prev.map(property => 
        property.id === propertyId 
          ? { ...property, status: newStatus }
          : property
      )
    );
  };

  const handleDeleteProperty = (property: PropertyWithStatus) => {
    if (confirm(`Apakah Anda yakin ingin menghapus properti "${property.title}"?`)) {
      setProperties(prev => prev.filter(p => p.id !== property.id));
    }
  };

  const handleEditProperty = (property: PropertyWithStatus) => {
    setSelectedProperty(property);
    setShowPropertyModal(true);
  };

  const handleViewProperty = (property: PropertyWithStatus) => {
    setSelectedProperty(property);
    setShowDetailModal(true);
  };

  const getStatusBadge = (status: PropertyWithStatus['status']) => {
    const statusConfig = {
      pending: { label: 'Menunggu Review', className: 'bg-yellow-100 text-yellow-800', icon: Clock },
      approved: { label: 'Disetujui', className: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      rejected: { label: 'Ditolak', className: 'bg-red-100 text-red-800', icon: XCircle },
      published: { label: 'Dipublikasi', className: 'bg-green-100 text-green-800', icon: CheckCircle },
      unpublished: { label: 'Tidak Dipublikasi', className: 'bg-gray-100 text-gray-800', icon: XCircle },
    };
    
    const config = statusConfig[status];
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>
        <Icon size={12} className="mr-1" />
        {config.label}
      </span>
    );
  };

  const getTypeLabel = (type: string) => {
    const typeMap = {
      rumah: 'Rumah',
      apartemen: 'Apartemen',
      kondominium: 'Kondominium',
      ruko: 'Ruko',
      'gedung-komersial': 'Gedung Komersial',
      'ruang-industri': 'Ruang Industri',
      tanah: 'Tanah',
      lainnya: 'Lainnya',
    };
    return typeMap[type as keyof typeof typeMap] || type;
  };

  // Filter properties based on selected filters
  const filteredProperties = properties.filter(property => {
    if (filterStatus !== 'all' && property.status !== filterStatus) return false;
    if (filterType !== 'all' && property.type !== filterType) return false;
    if (filterPurpose !== 'all' && property.purpose !== filterPurpose) return false;
    return true;
  });

  const columns: Column<PropertyWithStatus>[] = [
    {
      key: 'title',
      title: 'Properti',
      sortable: true,
      render: (value, record) => (
        <div className="flex items-center">
          <div className="w-16 h-12 bg-neutral-200 rounded overflow-hidden mr-3 flex-shrink-0">
            {record.images[0] ? (
              <img 
                src={record.images[0]} 
                alt={record.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Image size={16} className="text-neutral-400" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-medium text-neutral-900 truncate">{value}</div>
            <div className="text-sm text-neutral-500 flex items-center">
              <MapPin size={12} className="mr-1" />
              {record.location.city}, {record.location.province}
            </div>
            <div className="text-sm font-medium text-primary">
              {formatPrice(record.price, record.priceUnit)}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      title: 'Tipe',
      sortable: true,
      render: (value) => getTypeLabel(value),
    },
    {
      key: 'purpose',
      title: 'Tujuan',
      sortable: true,
      render: (value) => value === 'jual' ? 'Dijual' : 'Disewa',
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      render: (value) => getStatusBadge(value),
    },
    {
      key: 'agent.name',
      title: 'Agen',
      render: (value, record) => (
        <div>
          <div className="font-medium text-neutral-900">{record.agent.name}</div>
          <div className="text-sm text-neutral-500">{record.agent.company}</div>
        </div>
      ),
    },
    {
      key: 'views',
      title: 'Views',
      sortable: true,
      render: (value) => value.toLocaleString(),
    },
    {
      key: 'inquiries',
      title: 'Inquiries',
      sortable: true,
      render: (value) => value.toLocaleString(),
    },
    {
      key: 'createdAt',
      title: 'Tanggal Dibuat',
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString('id-ID'),
    },
  ];

  const renderActions = (property: PropertyWithStatus) => (
    <div className="flex items-center space-x-2">
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleViewProperty(property);
        }}
        className="p-1 text-neutral-500 hover:text-primary"
        title="Lihat Detail"
      >
        <Eye size={16} />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleEditProperty(property);
        }}
        className="p-1 text-neutral-500 hover:text-primary"
        title="Edit"
      >
        <Edit size={16} />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleDeleteProperty(property);
        }}
        className="p-1 text-neutral-500 hover:text-red-600"
        title="Hapus"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );

  return (
    <div>
      <Helmet>
        <title>Manajemen Properti | Admin Properti Pro</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">Manajemen Properti</h1>
            <p className="text-neutral-600">Kelola semua listing properti di platform</p>
          </div>
          <button
            onClick={() => {
              setSelectedProperty(null);
              setShowPropertyModal(true);
            }}
            className="btn-primary flex items-center"
          >
            <Plus size={18} className="mr-2" />
            Tambah Properti
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Status
            </label>
            <select
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Semua Status</option>
              <option value="pending">Menunggu Review</option>
              <option value="approved">Disetujui</option>
              <option value="rejected">Ditolak</option>
              <option value="published">Dipublikasi</option>
              <option value="unpublished">Tidak Dipublikasi</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Tipe Properti
            </label>
            <select
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">Semua Tipe</option>
              <option value="rumah">Rumah</option>
              <option value="apartemen">Apartemen</option>
              <option value="kondominium">Kondominium</option>
              <option value="ruko">Ruko</option>
              <option value="gedung-komersial">Gedung Komersial</option>
              <option value="ruang-industri">Ruang Industri</option>
              <option value="tanah">Tanah</option>
              <option value="lainnya">Lainnya</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Tujuan
            </label>
            <select
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={filterPurpose}
              onChange={(e) => setFilterPurpose(e.target.value)}
            >
              <option value="all">Semua Tujuan</option>
              <option value="jual">Dijual</option>
              <option value="sewa">Disewa</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => {
                setFilterStatus('all');
                setFilterType('all');
                setFilterPurpose('all');
              }}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50"
            >
              Reset Filter
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-2xl font-bold text-neutral-900">
            {properties.length}
          </div>
          <div className="text-sm text-neutral-600">Total Properti</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-2xl font-bold text-yellow-600">
            {properties.filter(p => p.status === 'pending').length}
          </div>
          <div className="text-sm text-neutral-600">Menunggu Review</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-2xl font-bold text-green-600">
            {properties.filter(p => p.status === 'published').length}
          </div>
          <div className="text-sm text-neutral-600">Dipublikasi</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-2xl font-bold text-red-600">
            {properties.filter(p => p.status === 'rejected').length}
          </div>
          <div className="text-sm text-neutral-600">Ditolak</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-2xl font-bold text-blue-600">
            {properties.reduce((sum, p) => sum + p.views, 0).toLocaleString()}
          </div>
          <div className="text-sm text-neutral-600">Total Views</div>
        </div>
      </div>

      <DataTable
        data={filteredProperties}
        columns={columns}
        actions={renderActions}
        searchable
        pagination
        pageSize={10}
        onRowClick={(property) => handleViewProperty(property)}
      />

      {/* Property Detail Modal */}
      {showDetailModal && selectedProperty && (
        <PropertyDetailModal
          property={selectedProperty}
          onClose={() => setShowDetailModal(false)}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Property Form Modal */}
      {showPropertyModal && (
        <PropertyFormModal
          property={selectedProperty}
          onClose={() => setShowPropertyModal(false)}
          onSave={(property) => {
            if (selectedProperty) {
              setProperties(prev => 
                prev.map(p => p.id === property.id ? property : p)
              );
            } else {
              setProperties(prev => [...prev, property]);
            }
            setShowPropertyModal(false);
          }}
        />
      )}
    </div>
  );
};

// Property Detail Modal Component
interface PropertyDetailModalProps {
  property: PropertyWithStatus;
  onClose: () => void;
  onStatusChange: (propertyId: string, status: PropertyWithStatus['status']) => void;
}

const PropertyDetailModal: React.FC<PropertyDetailModalProps> = ({ 
  property, 
  onClose, 
  onStatusChange 
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-neutral-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Detail Properti</h2>
            <button
              onClick={onClose}
              className="text-neutral-500 hover:text-neutral-700"
            >
              <XCircle size={24} />
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Images */}
            <div>
              <div className="aspect-video bg-neutral-200 rounded-lg overflow-hidden mb-4">
                <img 
                  src={property.images[activeImageIndex]} 
                  alt={property.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto">
                {property.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImageIndex(index)}
                    className={`w-20 h-16 rounded overflow-hidden flex-shrink-0 border-2 ${
                      activeImageIndex === index ? 'border-primary' : 'border-transparent'
                    }`}
                  >
                    <img 
                      src={image} 
                      alt={`${property.title} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
            
            {/* Property Info */}
            <div>
              <div className="mb-4">
                <h3 className="text-xl font-semibold mb-2">{property.title}</h3>
                <div className="text-2xl font-bold text-primary mb-2">
                  {formatPrice(property.price, property.priceUnit)}
                </div>
                <div className="flex items-center text-neutral-600 mb-2">
                  <MapPin size={16} className="mr-1" />
                  {property.location.address}, {property.location.district}, {property.location.city}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <span className="text-sm text-neutral-500">Tipe</span>
                  <div className="font-medium">{property.type}</div>
                </div>
                <div>
                  <span className="text-sm text-neutral-500">Tujuan</span>
                  <div className="font-medium">{property.purpose === 'jual' ? 'Dijual' : 'Disewa'}</div>
                </div>
                <div>
                  <span className="text-sm text-neutral-500">Kamar Tidur</span>
                  <div className="font-medium">{property.bedrooms || '-'}</div>
                </div>
                <div>
                  <span className="text-sm text-neutral-500">Kamar Mandi</span>
                  <div className="font-medium">{property.bathrooms || '-'}</div>
                </div>
                <div>
                  <span className="text-sm text-neutral-500">Luas Bangunan</span>
                  <div className="font-medium">{property.buildingSize ? `${property.buildingSize} m²` : '-'}</div>
                </div>
                <div>
                  <span className="text-sm text-neutral-500">Luas Tanah</span>
                  <div className="font-medium">{property.landSize ? `${property.landSize} m²` : '-'}</div>
                </div>
              </div>
              
              <div className="mb-4">
                <span className="text-sm text-neutral-500">Deskripsi</span>
                <div className="mt-1 text-neutral-700">{property.description}</div>
              </div>
              
              <div className="mb-4">
                <span className="text-sm text-neutral-500">Fasilitas</span>
                <div className="mt-1 flex flex-wrap gap-2">
                  {property.features.map((feature, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 bg-neutral-100 text-neutral-700 text-sm rounded"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="mb-6">
                <span className="text-sm text-neutral-500">Agen</span>
                <div className="mt-1">
                  <div className="font-medium">{property.agent.name}</div>
                  <div className="text-sm text-neutral-600">{property.agent.company}</div>
                  <div className="text-sm text-neutral-600">{property.agent.phone}</div>
                  <div className="text-sm text-neutral-600">{property.agent.email}</div>
                </div>
              </div>
              
              {/* Status Actions */}
              <div className="border-t pt-4">
                <span className="text-sm text-neutral-500 block mb-2">Ubah Status</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => onStatusChange(property.id, 'approved')}
                    className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded hover:bg-blue-200"
                  >
                    Setujui
                  </button>
                  <button
                    onClick={() => onStatusChange(property.id, 'rejected')}
                    className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded hover:bg-red-200"
                  >
                    Tolak
                  </button>
                  <button
                    onClick={() => onStatusChange(property.id, 'published')}
                    className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded hover:bg-green-200"
                  >
                    Publikasikan
                  </button>
                  <button
                    onClick={() => onStatusChange(property.id, 'unpublished')}
                    className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded hover:bg-gray-200"
                  >
                    Batalkan Publikasi
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Property Form Modal Component
interface PropertyFormModalProps {
  property: PropertyWithStatus | null;
  onClose: () => void;
  onSave: (property: PropertyWithStatus) => void;
}

const PropertyFormModal: React.FC<PropertyFormModalProps> = ({ 
  property, 
  onClose, 
  onSave 
}) => {
  const [formData, setFormData] = useState({
    title: property?.title || '',
    description: property?.description || '',
    price: property?.price || 0,
    priceUnit: property?.priceUnit || 'juta' as const,
    type: property?.type || 'rumah' as const,
    purpose: property?.purpose || 'jual' as const,
    bedrooms: property?.bedrooms || 0,
    bathrooms: property?.bathrooms || 0,
    buildingSize: property?.buildingSize || 0,
    landSize: property?.landSize || 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newProperty: PropertyWithStatus = {
      id: property?.id || Date.now().toString(),
      ...formData,
      location: property?.location || {
        province: 'DKI Jakarta',
        city: 'Jakarta Selatan',
        district: 'Kebayoran Baru',
        address: 'Jl. Contoh No. 123',
      },
      images: property?.images || ['https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg'],
      features: property?.features || ['Carport', 'Taman'],
      agent: property?.agent || {
        id: 'a1',
        name: 'Admin',
        phone: '08123456789',
        email: 'admin@propertipro.id',
        company: 'Properti Pro',
      },
      createdAt: property?.createdAt || new Date().toISOString(),
      isPromoted: property?.isPromoted || false,
      status: property?.status || 'pending',
      views: property?.views || 0,
      inquiries: property?.inquiries || 0,
    };
    
    onSave(newProperty);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-neutral-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {property ? 'Edit Properti' : 'Tambah Properti'}
            </h2>
            <button
              onClick={onClose}
              className="text-neutral-500 hover:text-neutral-700"
            >
              <XCircle size={24} />
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Judul Properti
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Harga
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Satuan Harga
              </label>
              <select
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={formData.priceUnit}
                onChange={(e) => setFormData(prev => ({ ...prev, priceUnit: e.target.value as 'juta' | 'miliar' }))}
              >
                <option value="juta">Juta</option>
                <option value="miliar">Miliar</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Tipe Properti
              </label>
              <select
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
              >
                <option value="rumah">Rumah</option>
                <option value="apartemen">Apartemen</option>
                <option value="kondominium">Kondominium</option>
                <option value="ruko">Ruko</option>
                <option value="gedung-komersial">Gedung Komersial</option>
                <option value="ruang-industri">Ruang Industri</option>
                <option value="tanah">Tanah</option>
                <option value="lainnya">Lainnya</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Tujuan
              </label>
              <select
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={formData.purpose}
                onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value as 'jual' | 'sewa' }))}
              >
                <option value="jual">Dijual</option>
                <option value="sewa">Disewa</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Kamar Tidur
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={formData.bedrooms}
                onChange={(e) => setFormData(prev => ({ ...prev, bedrooms: Number(e.target.value) }))}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Kamar Mandi
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={formData.bathrooms}
                onChange={(e) => setFormData(prev => ({ ...prev, bathrooms: Number(e.target.value) }))}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Luas Bangunan (m²)
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={formData.buildingSize}
                onChange={(e) => setFormData(prev => ({ ...prev, buildingSize: Number(e.target.value) }))}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Luas Tanah (m²)
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={formData.landSize}
                onChange={(e) => setFormData(prev => ({ ...prev, landSize: Number(e.target.value) }))}
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Deskripsi
              </label>
              <textarea
                rows={4}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                required
              />
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
              {property ? 'Simpan Perubahan' : 'Tambah Properti'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PropertyManagement;