import { useState, useEffect } from 'react';
import { useCustomAuth } from '@/hooks/useCustomAuth';

interface User {
  id: string;
  email: string;
  username: string;
  full_name: string;
  role: string;
  created_at: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminDashboard() {
  const { user, loading } = useCustomAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [error, setError] = useState('');

  // Check if user is admin
  if (loading) return <div>Loading...</div>;
  if (!user || user.role !== 'admin') {
    return <div>Access denied. Admin privileges required.</div>;
  }

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('custom_jwt');
      const res = await fetch(
        `/api/admin/users?page=${currentPage}&limit=10&search=${search}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users);
        setPagination(data.pagination);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to fetch users');
    }
  };

  const updateUser = async (userId: string, updates: any) => {
    try {
      const token = localStorage.getItem('custom_jwt');
      const res = await fetch('/api/admin/update-user', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, updates }),
      });
      const data = await res.json();
      if (res.ok) {
        setEditingUser(null);
        fetchUsers();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to update user');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage, search]);

  return (
    <div style={{ maxWidth: 1200, margin: '2rem auto', padding: '0 1rem' }}>
      <h1>Admin Dashboard</h1>
      
      <div style={{ marginBottom: '2rem' }}>
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: '0.5rem', marginRight: '1rem' }}
        />
      </div>

      {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ddd', padding: '0.5rem' }}>Email</th>
            <th style={{ border: '1px solid #ddd', padding: '0.5rem' }}>Username</th>
            <th style={{ border: '1px solid #ddd', padding: '0.5rem' }}>Full Name</th>
            <th style={{ border: '1px solid #ddd', padding: '0.5rem' }}>Role</th>
            <th style={{ border: '1px solid #ddd', padding: '0.5rem' }}>Created</th>
            <th style={{ border: '1px solid #ddd', padding: '0.5rem' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td style={{ border: '1px solid #ddd', padding: '0.5rem' }}>{user.email}</td>
              <td style={{ border: '1px solid #ddd', padding: '0.5rem' }}>{user.username}</td>
              <td style={{ border: '1px solid #ddd', padding: '0.5rem' }}>{user.full_name}</td>
              <td style={{ border: '1px solid #ddd', padding: '0.5rem' }}>
                {editingUser?.id === user.id ? (
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                ) : (
                  user.role
                )}
              </td>
              <td style={{ border: '1px solid #ddd', padding: '0.5rem' }}>
                {new Date(user.created_at).toLocaleDateString()}
              </td>
              <td style={{ border: '1px solid #ddd', padding: '0.5rem' }}>
                {editingUser?.id === user.id ? (
                  <>
                    <button onClick={() => updateUser(user.id, { role: editingUser.role })}>
                      Save
                    </button>
                    <button onClick={() => setEditingUser(null)}>Cancel</button>
                  </>
                ) : (
                  <button onClick={() => setEditingUser(user)}>Edit</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {pagination && (
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
            style={{ marginRight: '1rem' }}
          >
            Previous
          </button>
          <span>
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total users)
          </span>
          <button
            disabled={currentPage === pagination.totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
            style={{ marginLeft: '1rem' }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
} 