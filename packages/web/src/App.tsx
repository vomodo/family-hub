import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BottomNav from './components/mobile/BottomNav';
import InstallPrompt from './components/InstallPrompt';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 px-4 py-3">
            <h1 className="text-xl font-bold text-gray-900">🏠 FamilyHub</h1>
          </header>

          {/* Main content */}
          <main className="pb-20 md:pb-0">
            <div className="max-w-7xl mx-auto px-4 py-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold mb-4">Chào mừng đến FamilyHub! 👋</h2>
                <p className="text-gray-600 mb-4">
                  Ứng dụng quản lý chi tiêu và công việc gia đình của bạn.
                </p>
                <div className="space-y-2">
                  <p className="flex items-center gap-2">
                    <span className="text-2xl">✅</span>
                    <span>React + Vite</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-2xl">✅</span>
                    <span>Tailwind CSS</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-2xl">✅</span>
                    <span>PWA Support</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-2xl">✅</span>
                    <span>Mobile-First Design</span>
                  </p>
                </div>
              </div>
            </div>
          </main>

          {/* Bottom Navigation (mobile only) */}
          <BottomNav />

          {/* Install Prompt */}
          <InstallPrompt />
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
