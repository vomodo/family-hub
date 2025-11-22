import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';

interface User {
  id: number;
  email: string;
  fullName: string | null;
  createdAt: string;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="pb-20 md:pb-0">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">🏠 FamilyHub</h1>
          <button
            onClick={handleLogout}
            className="
              flex items-center gap-2
              px-3 py-2
              text-sm font-medium text-red-600
              hover:bg-red-50 rounded-lg
              transition-colors
            "
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">Đăng xuất</span>
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Welcome card */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 mb-6 text-white">
          <h2 className="text-2xl font-bold mb-2">
            Xin chào{user?.fullName ? `, ${user.fullName}` : ''}! 👋
          </h2>
          <p className="text-blue-100">
            Chào mừng bạn đến với FamilyHub
          </p>
          <div className="mt-4 text-sm text-blue-100">
            <p>Email: {user?.email}</p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Tổng chi tiêu</h3>
              <span className="text-2xl">💸</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">0 ₫</p>
            <p className="text-xs text-gray-500 mt-1">Tháng này</p>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Giao dịch</h3>
              <span className="text-2xl">📊</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">0</p>
            <p className="text-xs text-gray-500 mt-1">Tháng này</p>
          </div>

          <div className="bg-white rounded-xl shadow p-6 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Thành viên</h3>
              <span className="text-2xl">👨‍👩‍👧‍👦</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">1</p>
            <p className="text-xs text-gray-500 mt-1">Trong gia đình</p>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold mb-4">Tính năng</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <span className="text-2xl">✅</span>
              <div>
                <p className="font-medium">Xác thực</p>
                <p className="text-sm text-gray-500">Đăng ký và đăng nhập thành công</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <span className="text-2xl">✅</span>
              <div>
                <p className="font-medium">PWA Support</p>
                <p className="text-sm text-gray-500">Cài đặt lên màn hình chính</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <span className="text-2xl">✅</span>
              <div>
                <p className="font-medium">Mobile-First Design</p>
                <p className="text-sm text-gray-500">Tối ưu cho điện thoại</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
              <span className="text-2xl">⏳</span>
              <div>
                <p className="font-medium text-gray-500">Quản lý chi tiêu</p>
                <p className="text-sm text-gray-400">Coming soon...</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
              <span className="text-2xl">⏳</span>
              <div>
                <p className="font-medium text-gray-500">To-do List</p>
                <p className="text-sm text-gray-400">Coming soon...</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
