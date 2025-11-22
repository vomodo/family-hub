import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Turnstile from 'react-turnstile';

const API_URL = 'https://family-hub-api.vomodo.workers.dev';
const TURNSTILE_SITE_KEY = '0x4AAAAAACCWpZu7SNq9LpCK'; // Replace with your site key

export default function Register() {
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [otp, setOtp] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [tempData, setTempData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();

  // Step 1: Submit form and request OTP
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!turnstileToken) {
      setError('Vui lòng xác thực anti-bot');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/api/auth/register/request-otp`, {
        email,
        password,
        fullName: fullName || undefined,
        turnstileToken,
      });

      setTempData(res.data.tempData);
      setStep('otp');
      startCountdown();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Gửi mã OTP thất bại');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/api/auth/register/verify-otp`, {
        email: tempData.email,
        otp,
        passwordHash: tempData.passwordHash,
        fullName: tempData.fullName,
      });

      // Save token and user
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));

      // Redirect to dashboard
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Xác thực OTP thất bại');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    if (countdown > 0) return;

    setError('');
    setLoading(true);

    try {
      await axios.post(`${API_URL}/api/auth/register/resend-otp`, {
        email: tempData.email,
        fullName: tempData.fullName,
      });

      startCountdown();
      alert('✅ Mã OTP mới đã được gửi!');
    } catch (err: any) {
      setError('Gửi lại OTP thất bại');
    } finally {
      setLoading(false);
    }
  };

  const startCountdown = () => {
    setCountdown(60);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-2xl mb-4">
            <span className="text-3xl">🏠</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">FamilyHub</h1>
          <p className="text-gray-600 mt-2">Quản lý chi tiêu gia đình</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {step === 'form' ? (
            // Step 1: Registration Form
            <>
              <h2 className="text-2xl font-bold text-center mb-6">Đăng ký</h2>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmitForm} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Họ tên <span className="text-gray-400">(tùy chọn)</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full h-12 px-4 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nguyễn Văn A"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-12 px-4 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="email@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-12 px-4 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ít nhất 6 ký tự"
                    required
                    minLength={6}
                  />
                </div>

                {/* Cloudflare Turnstile */}
                <div className="flex justify-center">
                  <Turnstile
                    sitekey={TURNSTILE_SITE_KEY}
                    onVerify={(token) => setTurnstileToken(token)}
                    theme="light"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !turnstileToken}
                  className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                >
                  {loading ? 'Đang xử lý...' : 'Gửi mã OTP'}
                </button>
              </form>
            </>
          ) : (
            // Step 2: OTP Verification
            <>
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <span className="text-3xl">📧</span>
                </div>
                <h2 className="text-2xl font-bold">Xác thực email</h2>
                <p className="text-gray-600 mt-2">
                  Mã OTP đã được gửi đến<br />
                  <strong>{tempData?.email}</strong>
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                    Nhập mã OTP (6 chữ số)
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full h-14 px-4 text-center text-2xl font-mono tracking-widest border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="000000"
                    maxLength={6}
                    required
                  />
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Mã OTP có hiệu lực trong 10 phút
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                >
                  {loading ? 'Đang xác thực...' : 'Xác thực'}
                </button>

                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={countdown > 0 || loading}
                  className="w-full text-sm text-blue-500 hover:text-blue-600 font-medium disabled:text-gray-400"
                >
                  {countdown > 0
                    ? `Gửi lại mã sau ${countdown}s`
                    : 'Gửi lại mã OTP'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep('form');
                    setOtp('');
                    setError('');
                  }}
                  className="w-full text-sm text-gray-500 hover:text-gray-700"
                >
                  ← Quay lại
                </button>
              </form>
            </>
          )}

          {step === 'form' && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Đã có tài khoản?{' '}
                <Link to="/login" className="text-blue-500 hover:text-blue-600 font-medium">
                  Đăng nhập
                </Link>
              </p>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-gray-600 mt-8">
          © 2025 FamilyHub. Made with ❤️ for Vietnamese families
        </p>
      </div>
    </div>
  );
}
