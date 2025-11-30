import { useState, useEffect } from 'react';
import { Users, Plus, UserPlus, Home, Crown } from 'lucide-react';

interface Family {
  id: number;
  name: string;
  createdBy: number;
  createdAt: string;
  role: string;
  colorCode: string;
  joinedAt: string;
}

interface Member {
  userId: number;
  email: string;
  fullName: string | null;
  role: string;
  colorCode: string;
  joinedAt: string;
}

export default function FamilyManagement() {
  const [families, setFamilies] = useState<Family[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newFamilyName, setNewFamilyName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

  useEffect(() => {
    fetchFamilies();
  }, []);

  useEffect(() => {
    if (selectedFamily) {
      fetchMembers(selectedFamily.id);
    }
  }, [selectedFamily]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  };

  const fetchFamilies = async () => {
    try {
      const response = await fetch(`${API_URL}/api/families/list`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (data.success) {
        setFamilies(data.families);
        if (data.families.length > 0 && !selectedFamily) {
          setSelectedFamily(data.families[0]);
        }
      }
    } catch (err: any) {
      console.error('Fetch families error:', err);
    }
  };

  const fetchMembers = async (familyId: number) => {
    try {
      const response = await fetch(`${API_URL}/api/families/${familyId}/members`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (data.success) {
        setMembers(data.members);
      }
    } catch (err: any) {
      console.error('Fetch members error:', err);
    }
  };

  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/families/create`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: newFamilyName }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchFamilies();
        setShowCreateModal(false);
        setNewFamilyName('');
      } else {
        setError(data.error || 'Tạo gia đình thất bại');
      }
    } catch (err: any) {
      setError('Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFamily) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/families/${selectedFamily.id}/invite`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchMembers(selectedFamily.id);
        setShowInviteModal(false);
        setInviteEmail('');
        setInviteRole('member');
      } else {
        setError(data.error || 'Mời thành viên thất bại');
      }
    } catch (err: any) {
      setError('Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Quản lý Gia đình</h1>
                <p className="text-sm text-gray-500">{families.length} gia đình</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Tạo gia đình
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Families List */}
          <div className="md:col-span-1 bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Danh sách gia đình</h2>
            <div className="space-y-2">
              {families.map((family) => (
                <button
                  key={family.id}
                  onClick={() => setSelectedFamily(family)}
                  className={`w-full text-left p-4 rounded-xl transition-all ${
                    selectedFamily?.id === family.id
                      ? 'bg-blue-100 border-2 border-blue-500'
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: family.colorCode }}
                    >
                      <Home className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800">{family.name}</div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        {family.role === 'admin' && <Crown className="w-3 h-3" />}
                        {family.role === 'admin' ? 'Quản trị viên' : 'Thành viên'}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
              {families.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Chưa có gia đình nào
                </div>
              )}
            </div>
          </div>

          {/* Members List */}
          <div className="md:col-span-2 bg-white rounded-2xl shadow-lg p-6">
            {selectedFamily ? (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold text-gray-800">
                    Thành viên của {selectedFamily.name}
                  </h2>
                  {selectedFamily.role === 'admin' && (
                    <button
                      onClick={() => setShowInviteModal(true)}
                      className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition-colors"
                    >
                      <UserPlus className="w-5 h-5" />
                      Mời thành viên
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {members.map((member) => (
                    <div
                      key={member.userId}
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl"
                    >
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                        style={{ backgroundColor: member.colorCode }}
                      >
                        {member.fullName?.charAt(0) || member.email.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800">
                          {member.fullName || 'Chưa có tên'}
                        </div>
                        <div className="text-sm text-gray-500">{member.email}</div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        {member.role === 'admin' && (
                          <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-medium flex items-center gap-1">
                            <Crown className="w-4 h-4" />
                            Admin
                          </span>
                        )}
                        {member.role === 'member' && (
                          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                            Thành viên
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-16 text-gray-500">
                Chọn một gia đình để xem thành viên
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Family Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Tạo gia đình mới</h2>
            <form onSubmit={handleCreateFamily}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên gia đình
                </label>
                <input
                  type="text"
                  value={newFamilyName}
                  onChange={(e) => setNewFamilyName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ví dụ: Gia đình Nguyễn Văn A"
                  required
                />
              </div>
              {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-xl text-sm">
                  {error}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewFamilyName('');
                    setError('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Đang tạo...' : 'Tạo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Mời thành viên</h2>
            <form onSubmit={handleInviteMember}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="email@example.com"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vai trò
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'admin' | 'member')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="member">Thành viên</option>
                  <option value="admin">Quản trị viên</option>
                </select>
              </div>
              {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-xl text-sm">
                  {error}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowInviteModal(false);
                    setInviteEmail('');
                    setInviteRole('member');
                    setError('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Đang mời...' : 'Mời'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}