# 🏠 FamilyHub

> Ứng dụng quản lý chi tiêu và công việc gia đình - Mobile-first PWA on Cloudflare

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/vomodo/family-hub)

## ✨ Tính năng

### MVP (Phase 1)
- ✅ Xác thực người dùng (đăng ký, đăng nhập, quên mật khẩu)
- ✅ Quản lý gia đình (tạo, mời thành viên)
- ✅ Theo dõi chi tiêu (thêm, xem, lọc)
- ✅ Upload ảnh hóa đơn
- ✅ Quy đổi tiền tệ tự động
- ✅ Dashboard tổng quan
- ✅ PWA - Cài đặt trên điện thoại
- ✅ Mobile-first responsive design

### Coming Soon (Phase 2)
- ⏳ To-do list gia đình
- ⏳ Buy list (danh sách mua sắm)
- ⏳ Lịch gia đình
- ⏳ AI OCR tự động (Cloudflare Workers AI)
- ⏳ Thông báo email
- ⏳ Xuất báo cáo

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
pnpm --filter=@family-hub/api db:migrate
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

## 📁 Project Structure

```
family-hub/
├── packages/
│   ├── web/              # Frontend React app
│   │   ├── src/
│   │   │   ├── components/   # React components
│   │   │   ├── pages/        # Page components
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
│   │   │   ├── db/           # Database schema
│   │   │   ├── middleware/   # Auth, CORS
│   │   │   ├── lib/          # Utilities
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
├── pnpm-workspace.yaml
├── turbo.json
├── package.json
└── README.md
```

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

## 🔧 Development Scripts

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
```

### Production Secrets

```bash
# Set via Wrangler CLI
wrangler secret put JWT_SECRET
wrangler secret put SMTP_PASSWORD
wrangler secret put EXCHANGE_RATE_API_KEY
```

## 📊 Cloudflare Free Tier Limits

| Service | Free Tier | MVP Usage |
|---------|-----------|----------|
| Workers | 100,000 req/day | ~3,000 req/day |
| D1 | 5M reads/day | ~10,000 reads/day |
| R2 | 10GB storage | ~2GB (images) |
| Pages | Unlimited | Unlimited |

**Kết luận**: Hoàn toàn đủ cho 10-20 người dùng nội bộ 👍

## 🤝 Contributing

Những phần cần phát triển:

- [ ] Authentication routes (login, register, forgot password)
- [ ] Family management API
- [ ] Expense tracking with image upload
- [ ] Currency conversion API integration
- [ ] To-do list feature
- [ ] Calendar integration
- [ ] Email notifications

## 📝 License

MIT License - See [LICENSE](LICENSE) for details

## 👨‍💻 Author

**Vu Minh Duc**
- GitHub: [@vomodo](https://github.com/vomodo)
- Website: [ducvu.vn](https://ducvu.vn)
- Email: duc@ducvu.vn

---

<p align="center">
  Made with ❤️ for Vietnamese families
</p>
