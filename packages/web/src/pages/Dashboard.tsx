import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, TrendingUp, Receipt, Users as UsersIcon, PieChart } from 'lucide-react';

interface User {
  id: number;
  email: string;
  fullName: string | null;
  createdAt: string;
}

interface Family {
  id: number;
  name: string;
  role: string;
}

interface CategoryStat {
  category: string | null;
  total: number;
  count: number;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [families, setFamilies] = useState<Family[]>([]);
  const [selectedFamilyId, setSelectedFamilyId] = useState<number | null>(null);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [expenseCount, setExpenseCount] = useState(0);
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
    fetchFamilies();
  }, []);

  useEffect(() => {
    if (selectedFamilyId) {
      fetchDashboardData();
    }
  }, [selectedFamilyId]);

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
      if (data.success && data.families.length > 0) {
        setFamilies(data.families);
        setSelectedFamilyId(data.families[0].id);
      }
    } catch (err: any) {
      console.error('Fetch families error:', err);
    }
  };

  const fetchDashboardData = async () => {
    if (!selectedFamilyId) return;

    try {
      // Fetch expenses
      const expensesRes = await fetch(`${API_URL}/api/expenses/family/${selectedFamilyId}`, {
        headers: getAuthHeaders(),
      });
      const expensesData = await expensesRes.json();
      if (expensesData.success) {
        const total = expensesData.expenses.reduce(
          (sum: number, exp: any) => sum + (exp.vndAmount || exp.amount),
          0
        );
        setTotalExpenses(total);
        setExpenseCount(expensesData.expenses.length);
      }

      // Fetch category stats
      const statsRes = await fetch(
        `${API_URL}/api/expenses/family/${selectedFamilyId}/stats/by-category`,
        { headers: getAuthHeaders() }
      );
      const statsData = await statsRes.json();
      if (statsData.success) {
        setCategoryStats(statsData.stats);
      }
    } catch (err: any) {
      console.error('Fetch dashboard data error:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const getTopCategories = () => {
    return categoryStats
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  };

  return (
    <div className="pb-20 md:pb-0 min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">🏠 FamilyHub</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">Đăng xuất</span>
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Welcome card */}
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg p-6 mb-6 text-white">
          <h2 className="text-2xl font-bold mb-2">
            Xin chào{user?.fullName ? `, ${user.fullName}` : ''}! 👋
          </h2>
          <p className="text-blue-100 mb-4">
            Chào mừng bạn đến với FamilyHub
          </p>
          
          {families.length > 0 && (
            <div className="mt-4">
              <label className="block text-sm text-blue-100 mb-2">Gia đình hiện tại</label>
              <select
                value={selectedFamilyId || ''}
                onChange={(e) => setSelectedFamilyId(Number(e.target.value))}
                className="w-full sm:w-auto px-4 py-2 bg-white bg-opacity-20 backdrop-blur-sm border border-white border-opacity-30 rounded-xl text-white focus:ring-2 focus:ring-white focus:ring-opacity-50"
              >
                {families.map((family) => (
                  <option key={family.id} value={family.id} className="text-gray-800">
                    {family.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Tổng chi tiêu</h3>
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(totalExpenses)}</p>
            <p className="text-xs text-gray-500 mt-1">Tất cả thời gian</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Giao dịch</h3>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Receipt className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{expenseCount}</p>
            <p className="text-xs text-gray-500 mt-1">Tổng số giao dịch</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Gia đình</h3>
              <div className="p-2 bg-green-100 rounded-lg">
                <UsersIcon className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{families.length}</p>
            <p className="text-xs text-gray-500 mt-1">Bạn tham gia</p>
          </div>
        </div>

        {/* Category breakdown */}
        {categoryStats.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="w-6 h-6 text-purple-600" />
              <h2 className="text-xl font-bold">Chi tiêu theo danh mục</h2>
            </div>
            <div className="space-y-3">
              {getTopCategories().map((stat, index) => {
                const percentage = (stat.total / totalExpenses) * 100;
                return (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium text-gray-700">
                        {stat.category || 'Không phân loại'}
                      </span>
                      <span className="text-gray-500">
                        {formatCurrency(stat.total)} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Features */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Tính năng đã hoàn thành</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50">
              <span className="text-2xl">✅</span>
              <div>
                <p className="font-medium text-green-800">Xác thực OTP</p>
                <p className="text-sm text-green-600">Đăng ký và đăng nhập</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50">
              <span className="text-2xl">✅</span>
              <div>
                <p className="font-medium text-green-800">Quản lý gia đình</p>
                <p className="text-sm text-green-600">Tạo và mời thành viên</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50">
              <span className="text-2xl">✅</span>
              <div>
                <p className="font-medium text-green-800">Theo dõi chi tiêu</p>
                <p className="text-sm text-green-600">CRUD và thống kê</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50">
              <span className="text-2xl">✅</span>
              <div>
                <p className="font-medium text-green-800">Upload hóa đơn</p>
                <p className="text-sm text-green-600">Lưu trữ trên R2</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50">
              <span className="text-2xl">✅</span>
              <div>
                <p className="font-medium text-green-800">Quy đổi tiền tệ</p>
                <p className="text-sm text-green-600">Tự động sang VND</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50">
              <span className="text-2xl">✅</span>
              <div>
                <p className="font-medium text-green-800">PWA Support</p>
                <p className="text-sm text-green-600">Cài đặt trên mobile</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}