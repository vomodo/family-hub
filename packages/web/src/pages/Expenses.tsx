import { useState, useEffect } from 'react';
import { Receipt, Plus, Upload, Filter, Calendar, DollarSign, Image as ImageIcon, Trash2, Edit2 } from 'lucide-react';

interface Expense {
  id: number;
  familyId: number;
  createdBy: number;
  title: string;
  amount: number;
  currency: string;
  vndAmount: number | null;
  transactionDate: string;
  imageUrl: string | null;
  category: string | null;
  createdAt: string;
}

interface Family {
  id: number;
  name: string;
  role: string;
}

export default function Expenses() {
  const [families, setFamilies] = useState<Family[]>([]);
  const [selectedFamilyId, setSelectedFamilyId] = useState<number | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    currency: 'VND',
    transactionDate: new Date().toISOString().split('T')[0],
    category: '',
    imageUrl: '',
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

  const categories = [
    'Ăn uống',
    'Mua sắm',
    'Giáo dục',
    'Y tế',
    'Đi lại',
    'Giải trí',
    'Hóa đơn',
    'Khác',
  ];

  const currencies = ['VND', 'USD', 'EUR', 'JPY', 'KRW', 'CNY', 'THB', 'SGD'];

  useEffect(() => {
    fetchFamilies();
  }, []);

  useEffect(() => {
    if (selectedFamilyId) {
      fetchExpenses();
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
      if (data.success) {
        setFamilies(data.families);
        if (data.families.length > 0 && !selectedFamilyId) {
          setSelectedFamilyId(data.families[0].id);
        }
      }
    } catch (err: any) {
      console.error('Fetch families error:', err);
    }
  };

  const fetchExpenses = async () => {
    if (!selectedFamilyId) return;

    try {
      const response = await fetch(`${API_URL}/api/expenses/family/${selectedFamilyId}`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (data.success) {
        setExpenses(data.expenses);
      }
    } catch (err: any) {
      console.error('Fetch expenses error:', err);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', imageFile);

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/expenses/upload-receipt`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        return data.imageUrl;
      }
      throw new Error(data.error || 'Upload failed');
    } catch (err: any) {
      console.error('Upload error:', err);
      setError('Upload ảnh thất bại');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFamilyId) return;

    setLoading(true);
    setError('');

    try {
      // Upload image first if exists
      let imageUrl = formData.imageUrl;
      if (imageFile) {
        const uploadedUrl = await uploadImage();
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }

      const response = await fetch(`${API_URL}/api/expenses/create`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          familyId: selectedFamilyId,
          title: formData.title,
          amount: parseFloat(formData.amount),
          currency: formData.currency,
          transactionDate: formData.transactionDate,
          category: formData.category || null,
          imageUrl: imageUrl || null,
        }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchExpenses();
        setShowAddModal(false);
        resetForm();
      } else {
        setError(data.error || 'Thêm chi tiêu thất bại');
      }
    } catch (err: any) {
      setError('Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa chi tiêu này?')) return;

    try {
      const response = await fetch(`${API_URL}/api/expenses/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      const data = await response.json();
      if (data.success) {
        await fetchExpenses();
      } else {
        alert(data.error || 'Xóa thất bại');
      }
    } catch (err: any) {
      alert('Lỗi kết nối');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      amount: '',
      currency: 'VND',
      transactionDate: new Date().toISOString().split('T')[0],
      category: '',
      imageUrl: '',
    });
    setImageFile(null);
    setImagePreview('');
    setError('');
  };

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === 'VND') {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(amount);
    }
    return `${amount.toLocaleString()} ${currency}`;
  };

  const getTotalExpenses = () => {
    return expenses.reduce((sum, exp) => sum + (exp.vndAmount || exp.amount), 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Receipt className="w-8 h-8 text-purple-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Quản lý Chi tiêu</h1>
                <p className="text-sm text-gray-500">
                  Tổng: {formatCurrency(getTotalExpenses(), 'VND')}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              disabled={!selectedFamilyId}
              className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              <Plus className="w-5 h-5" />
              Thêm chi tiêu
            </button>
          </div>
        </div>

        {/* Family Selector */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Chọn gia đình
          </label>
          <select
            value={selectedFamilyId || ''}
            onChange={(e) => setSelectedFamilyId(Number(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">-- Chọn gia đình --</option>
            {families.map((family) => (
              <option key={family.id} value={family.id}>
                {family.name}
              </option>
            ))}
          </select>
        </div>

        {/* Expenses List */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Danh sách chi tiêu</h2>
          
          {expenses.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Chưa có chi tiêu nào
            </div>
          ) : (
            <div className="space-y-3">
              {expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl hover:shadow-md transition-shadow"
                >
                  {/* Image */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-white flex items-center justify-center">
                    {expense.imageUrl ? (
                      <img
                        src={expense.imageUrl}
                        alt={expense.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-gray-300" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800">{expense.title}</div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      {new Date(expense.transactionDate).toLocaleDateString('vi-VN')}
                      {expense.category && (
                        <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full text-xs">
                          {expense.category}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="text-right">
                    <div className="font-bold text-lg text-purple-600">
                      {formatCurrency(expense.amount, expense.currency)}
                    </div>
                    {expense.currency !== 'VND' && expense.vndAmount && (
                      <div className="text-xs text-gray-500">
                        ≈ {formatCurrency(expense.vndAmount, 'VND')}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() => handleDeleteExpense(expense.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full my-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Thêm chi tiêu mới</h2>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tiêu đề
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ví dụ: Mua thực phẩm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số tiền
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="1000000"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Đơn vị
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {currencies.map((curr) => (
                      <option key={curr} value={curr}>
                        {curr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày giao dịch
                </label>
                <input
                  type="date"
                  value={formData.transactionDate}
                  onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Danh mục
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">-- Chọn danh mục --</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ảnh hóa đơn
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50"
                  >
                    <Upload className="w-5 h-5" />
                    Chọn ảnh
                  </label>
                  {imagePreview && (
                    <img src={imagePreview} alt="Preview" className="w-16 h-16 rounded-lg object-cover" />
                  )}
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-100 text-red-700 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading || uploading}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50"
                >
                  {loading || uploading ? 'Đang xử lý...' : 'Thêm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}