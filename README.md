# 🏠 FamilyHub

> Ứng dụng quản lý chi tiêu và công việc gia đình - Mobile-first PWA on Cloudflare

[![Deploy to Cloudflare](https://github.com/vomodo/family-hub/actions/workflows/deploy.yml/badge.svg)](https://github.com/vomodo/family-hub/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-%3E%3D9.0.0-orange)](https://pnpm.io/)

## ✨ Tính năng

### ✅ MVP (Phase 1) - Hoàn thành 100%

- **Xác thực người dùng**
  - Đăng ký với OTP verification
  - Đăng nhập JWT-based
  - Anti-bot protection (Cloudflare Turnstile)
  - Email verification qua N8N webhook

- **Quản lý gia đình**
  - Tạo gia đình mới
  - Mời thành viên qua email
  - Xem danh sách thành viên
  - Phân quyền Admin/Member

- **Theo dõi chi tiêu**
  - Thêm/sửa/xóa chi tiêu
  - Upload ảnh hóa đơn (R2 storage)
  - Lọc theo ngày/tháng/category
  - Multi-currency support (VND, USD, EUR, JPY, THB, etc.)

- **Quy đổi tiền tệ**
  - Tự động quy đổi sang VND
  - Real-time exchange rates
  - Fallback rates nếu API down

- **Dashboard tổng quan**
  - Tổng chi tiêu theo family
  - Thống kê theo category
  - Biểu đồ phân tích
  - Real-time analytics

- **PWA - Progressive Web App**
  - Cài đặt lên màn hình chính
  - Offline support
  - Mobile-first responsive design

### ⏳ Coming Soon (Phase 2)

- To-do list gia đình
- Buy list (danh sách mua sắm)
- Lịch gia đình
- AI OCR tự động (Cloudflare Workers AI)
- Thông báo email
- Xuất báo cáo

## 🛠️ Tech Stack

### Frontend
- **React 18** + **Vite** - Fast development
- **Tailwind CSS** - Mobile-first utility CSS
- **React Query** - API state management
- **Zustand** - Global state
- **PWA** - Progressive Web App support
- **Lucide Icons** - Beautiful icons

### Backend
- **Hono** - Lightweight web framework
- **Drizzle ORM** - Type-safe SQL
- **Cloudflare Workers** - Serverless compute
- **Cloudflare D1** - SQLite database
- **Cloudflare R2** - Object storage

### Infrastructure
- **Cloudflare Pages** - Frontend hosting
- **Cloudflare Workers** - Backend API
- **GitHub Actions** - CI/CD automation
- **100% Free Tier** - Phù hợp sử dụng nội bộ

## 🚀 Quick Start

### Prerequisites

- Node.js >= 20
- pnpm >= 9
- Cloudflare account ([Sign up free](https://dash.cloudflare.com/sign-up))

### Installation

```bash
# 1. Clone repository
git clone https://github.com/vomodo/family-hub.git
cd family-hub

# 2. Install dependencies
pnpm install

# 3. Setup Cloudflare
pnpm --filter=@family-hub/api wrangler login

# 4. Create D1 database
pnpm --filter=@family-hub/api wrangler d1 create family-hub-db

# Copy database_id vào packages/api/wrangler.toml

# 5. Create R2 bucket
pnpm --filter=@family-hub/api wrangler r2 bucket create family-hub-receipts

# 6. Run migrations
pnpm --filter=@family-hub/api db:generate
pnpm --filter=@family-hub/api wrangler d1 execute family-hub-db --remote --file=./drizzle/migrations/0000_init.sql

# 7. Setup secrets
pnpm --filter=@family-hub/api wrangler secret put JWT_SECRET
pnpm --filter=@family-hub/api wrangler secret put TURNSTILE_SECRET_KEY
pnpm --filter=@family-hub/api wrangler secret put N8N_WEBHOOK_URL
```

### Development

```bash
# Run all services
pnpm dev

# Or run individually
pnpm dev:api    # Backend on http://localhost:8787
pnpm dev:web    # Frontend on http://localhost:5173
```

### Build & Deploy

```bash
# Build all packages
pnpm build

# Deploy API
pnpm deploy:api

# Deploy Frontend
pnpm deploy:web
```

## 🔄 Auto-Deploy với GitHub Actions

### Setup Secrets

1. Vào **Settings** > **Secrets and variables** > **Actions**
2. Thêm các secrets sau:

| Secret | Mô tả |
|--------|-------|
| `CLOUDFLARE_API_TOKEN` | API token từ Cloudflare |
| `CLOUDFLARE_ACCOUNT_ID` | Account ID từ Cloudflare |
| `VITE_API_URL` | URL của API (optional) |

### Auto-Deploy

Mỗi khi push lên `main` branch, GitHub Actions tự động:

1. ⚡ Phát hiện files thay đổi (API hoặc Web)
2. 🛠️ Build packages
3. 🚀 Deploy lên Cloudflare
4. ✅ Thông báo kết quả

```bash
# Push code -> auto deploy!
git add .
git commit -m "feat: new feature"
git push origin main
```

📚 **Chi tiết**: Xem [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) và [docs/GITHUB_ACTIONS.md](docs/GITHUB_ACTIONS.md)

## 📱 Mobile-First Features

### PWA Installation

1. Mở trên điện thoại
2. Nhấn "Cài đặt" khi prompt xuất hiện
3. Hoặc:
   - **iOS**: Safari > Share > Add to Home Screen
   - **Android**: Chrome > Menu > Install app

### Offline Support

- Service Worker cache API responses
- Cache static assets (images, CSS, JS)
- Offline page khi mất kết nối

### Touch Optimization

- Minimum 44x44px tap targets
- Bottom navigation for thumb-friendly access
- Pull-to-refresh on lists
- Native input types (date, number, tel)

## 📁 Project Structure

```
family-hub/
├── packages/
│   ├── web/              # Frontend React app
│   │   ├── src/
│   │   │   ├── components/   # React components
│   │   │   ├── pages/        # Page components
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── FamilyManagement.tsx
│   │   │   │   ├── Expenses.tsx
│   │   │   │   ├── Login.tsx
│   │   │   │   └── Register.tsx
│   │   │   ├── lib/          # Utilities
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   ├── public/
│   │   │   └── icons/        # PWA icons
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   ├── api/              # Backend Hono API
│   │   ├── src/
│   │   │   ├── routes/       # API routes
│   │   │   │   ├── auth.ts
│   │   │   │   ├── families.ts
│   │   │   │   └── expenses.ts
│   │   │   ├── db/           # Database schema
│   │   │   │   └── schema.ts
│   │   │   ├── middleware/   # Auth, CORS
│   │   │   ├── lib/          # Utilities
│   │   │   │   ├── email.ts
│   │   │   │   └── currency.ts
│   │   │   └── index.ts
│   │   ├── wrangler.toml
│   │   └── package.json
│   │
│   └── shared/           # Shared types & constants
│       ├── src/
│       │   ├── types/
│       │   └── constants.ts
│       └── package.json
│
├── docs/
│   ├── DEPLOYMENT.md      # Hướng dẫn deploy
│   └── GITHUB_ACTIONS.md  # CI/CD setup
│
├── .github/
│   └── workflows/
│       └── deploy.yml     # Auto-deploy workflow
│
├── pnpm-workspace.yaml
├── turbo.json
├── package.json
└── README.md
```

## 🛠️ Development Scripts

```bash
# Development
pnpm dev                  # Run all services
pnpm dev:web             # Frontend only
pnpm dev:api             # Backend only

# Build
pnpm build               # Build all packages
pnpm build:changed       # Build only changed packages

# Testing
pnpm test                # Run all tests
pnpm lint                # Lint all packages
pnpm lint:fix            # Fix linting issues

# Database
pnpm --filter=@family-hub/api db:generate  # Generate migrations
pnpm --filter=@family-hub/api db:migrate   # Run migrations
pnpm --filter=@family-hub/api db:studio    # Open Drizzle Studio

# Deploy
pnpm deploy:api          # Deploy backend
pnpm deploy:web          # Deploy frontend

# Cleanup
pnpm clean               # Remove node_modules & build files
```

## 🌍 Environment Variables

### Backend (packages/api/.dev.vars)

```bash
JWT_SECRET=your-secret-key-change-in-production
ENVIRONMENT=development
TURNSTILE_SECRET_KEY=your-turnstile-secret
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/...
EXCHANGE_RATE_API_KEY=your-exchange-rate-api-key
```

### Frontend (packages/web/.env)

```bash
VITE_API_URL=http://localhost:8787
```

### Production Secrets

```bash
# Set via Wrangler CLI
cd packages/api
pnpm wrangler secret put JWT_SECRET
pnpm wrangler secret put TURNSTILE_SECRET_KEY
pnpm wrangler secret put N8N_WEBHOOK_URL
pnpm wrangler secret put EXCHANGE_RATE_API_KEY
```

## 📊 Cloudflare Free Tier Limits

| Service | Free Tier | MVP Usage | Status |
|---------|-----------|----------|--------|
| Workers | 100,000 req/day | ~3,000 req/day | ✅ |
| D1 | 5M reads/day | ~10,000 reads/day | ✅ |
| R2 | 10GB storage | ~2GB (images) | ✅ |
| Pages | Unlimited | Unlimited | ✅ |

**Kết luận**: Hoàn toàn đủ cho 10-20 người dùng nội bộ 👍

## 🤝 Contributing

### Phát triển thiếu

- [ ] To-do list feature (Phase 2)
- [ ] Calendar integration (Phase 2)
- [ ] AI OCR auto-extract (Phase 2)
- [ ] Email notifications system
- [ ] Export reports (PDF/Excel)
- [ ] Mobile apps (React Native)

### Workflow

1. Fork repository
2. Tạo branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'feat: add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Tạo Pull Request

## 📝 License

MIT License - See [LICENSE](LICENSE) for details

## 👨‍💻 Author

**Vũ Minh Đức**
- GitHub: [@vomodo](https://github.com/vomodo)
- Website: [ducvu.vn](https://ducvu.vn)
- Email: duc@ducvu.vn

## 🚀 Roadmap

### Phase 1 (MVP) - ✅ Hoàn thành
- [x] Authentication với OTP
- [x] Family Management
- [x] Expense Tracking
- [x] Currency Conversion
- [x] Dashboard Analytics
- [x] PWA Support
- [x] CI/CD Auto-deploy

### Phase 2 (Q1 2026)
- [ ] To-do List gia đình
- [ ] Shopping List
- [ ] Calendar Integration
- [ ] AI OCR cho hóa đơn
- [ ] Email Notifications
- [ ] Export Reports

### Phase 3 (Q2 2026)
- [ ] Mobile Apps (iOS/Android)
- [ ] Budget Planning
- [ ] Recurring Expenses
- [ ] Multi-language Support
- [ ] Dark Mode

## ⭐ Star History

Nếu project hữu ích, hãy cho một star ⭐

---

<p align="center">
  Made with ❤️ for Vietnamese families<br/>
  <a href="https://family-hub.pages.dev">Live Demo</a> • 
  <a href="docs/DEPLOYMENT.md">Deployment Guide</a> • 
  <a href="docs/GITHUB_ACTIONS.md">CI/CD Guide</a>
</p>