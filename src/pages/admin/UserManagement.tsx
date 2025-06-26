import React, { useState } from 'react';
import { Edit, Trash2, Eye, UserPlus, MoreHorizontal } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import DataTable, { Column } from '../../components/admin/DataTable';
import { User } from '../../contexts/AuthContext';

const UserManagement: React.FC = () => {
  const [users] = useState<User[]>([
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'user',
      status: 'active',
      phone: '+62812345678',
      createdAt: '2023-01-15T10:30:00Z',
      lastLogin: '2024-01-15T09:15:00Z',
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: 'agent',
      status: 'active',
      phone: '+62812345679',
      createdAt: '2023-02-20T14:20:00Z',
      lastLogin: '2024-01-14T16:45:00Z',
    },
    {
      id: '3',
      name: 'Bob Wilson',
      email: 'bob@example.com',
      role: 'user',
      status: 'suspended',
      phone: '+62812345680',
      createdAt: '2023-03-10T08:15:00Z',
      lastLogin: '2024-01-10T11:30:00Z',
    },
  ]);

  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleDeleteUser = (user: User) => {
    if (confirm(`Apakah Anda yakin ingin menghapus pengguna ${user.name}?`)) {
      // Handle delete logic here
      console.log('Delete user:', user.id);
    }
  };

  const getRoleLabel = (role: string) => {
    const roleMap = {
      user: 'Pengguna',
      agent: 'Agen',
      admin: 'Admin',
      superadmin: 'Super Admin',
    };
    return roleMap[role as keyof typeof roleMap] || role;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Aktif', className: 'bg-green-100 text-green-800' },
      inactive: { label: 'Tidak Aktif', className: 'bg-gray-100 text-gray-800' },
      suspended: { label: 'Ditangguhkan', className: 'bg-red-100 text-red-800' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const columns: Column<User>[] = [
    {
      key: 'name',
      title: 'Nama',
      sortable: true,
      render: (value, record) => (
        <div className="flex items-center">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-3">
            <span className="text-sm font-medium text-primary">
              {record.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="font-medium text-neutral-900">{value}</div>
            <div className="text-sm text-neutral-500">{record.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      title: 'Peran',
      sortable: true,
      render: (value) => getRoleLabel(value),
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      render: (value) => getStatusBadge(value),
    },
    {
      key: 'phone',
      title: 'Telepon',
      render: (value) => value || '-',
    },
    {
      key: 'createdAt',
      title: 'Terdaftar',
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString('id-ID'),
    },
    {
      key: 'lastLogin',
      title: 'Login Terakhir',
      sortable: true,
      render: (value) => value ? new Date(value).toLocaleDateString('id-ID') : 'Belum pernah',
    },
  ];

  const renderActions = (user: User) => (
    <div className="flex items-center space-x-2">
      <button
        onClick={(e) => {
          e.stopPropagation();
          console.log('View user:', user.id);
        }}
        className="p-1 text-neutral-500 hover:text-primary"
        title="Lihat Detail"
      >
        <Eye size={16} />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleEditUser(user);
        }}
        className="p-1 text-neutral-500 hover:text-primary"
        title="Edit"
      >
        <Edit size={16} />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleDeleteUser(user);
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
        <title>Manajemen Pengguna | Admin Properti Pro</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">Manajemen Pengguna</h1>
            <p className="text-neutral-600">Kelola pengguna, agen, dan admin platform</p>
          </div>
          <button
            onClick={() => {
              setSelectedUser(null);
              setShowUserModal(true);
            }}
            className="btn-primary flex items-center"
          >
            <UserPlus size={18} className="mr-2" />
            Tambah Pengguna
          </button>
        </div>
      </div>

      <DataTable
        data={users}
        columns={columns}
        actions={renderActions}
        searchable
        filterable
        pagination
        pageSize={10}
        onRowClick={(user) => console.log('Row clicked:', user)}
      />

      {/* User Modal - Placeholder */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">
              {selectedUser ? 'Edit Pengguna' : 'Tambah Pengguna'}
            </h2>
            <p className="text-neutral-600 mb-4">
              Form untuk {selectedUser ? 'mengedit' : 'menambah'} pengguna akan ditampilkan di sini.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowUserModal(false)}
                className="px-4 py-2 text-neutral-600 hover:text-neutral-800"
              >
                Batal
              </button>
              <button className="btn-primary">
                {selectedUser ? 'Simpan' : 'Tambah'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;