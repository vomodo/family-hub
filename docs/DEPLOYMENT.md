# 🚀 Hướng dẫn Deploy FamilyHub

## Tổng quan

FamilyHub sử dụng Cloudflare infrastructure và GitHub Actions để tự động deploy:
- **Backend API**: Cloudflare Workers
- **Frontend Web**: Cloudflare Pages
- **Database**: Cloudflare D1 (SQLite)
- **File Storage**: Cloudflare R2

## Bước 1: Chuẩn bị Cloudflare

### 1.1. Tạo Cloudflare Account

1. Đăng ký tài khoản miễn phí tại [cloudflare.com](https://dash.cloudflare.com/sign-up)
2. Xác thực email
3. Lấy **Account ID** từ Dashboard > Overview

### 1.2. Tạo API Token

1. Truy cập [API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click "Create Token"
3. Chọn "Edit Cloudflare Workers" template
4. Hoặc tạo Custom Token với quyền:
   - **Account** > Workers Scripts > Edit
   - **Account** > Workers KV Storage > Edit  
   - **Account** > D1 > Edit
   - **Account** > R2 Storage > Edit
   - **Account** > Cloudflare Pages > Edit
5. Lưu lại **API Token** (chỉ hiển thị 1 lần)

### 1.3. Tạo D1 Database

```bash
cd packages/api
pnpm wrangler d1 create family-hub-db
```

Sau khi tầo xong, copy `database_id` vào `packages/api/wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "family-hub-db"
database_id = "<YOUR_DATABASE_ID_HERE>"
```

### 1.4. Tạo R2 Bucket

```bash
cd packages/api
pnpm wrangler r2 bucket create family-hub-receipts
```

Cập nhật `wrangler.toml`:

```toml
[[r2_buckets]]
binding = "RECEIPTS"
bucket_name = "family-hub-receipts"
```

### 1.5. Chạy Database Migrations

```bash
cd packages/api

# Generate migrations
pnpm run db:generate

# Apply migrations (production)
pnpm wrangler d1 execute family-hub-db --remote --file=./drizzle/migrations/0000_init.sql
```

### 1.6. Setup Secrets (Production)

```bash
cd packages/api

# JWT Secret
pnpm wrangler secret put JWT_SECRET
# Nhập: <random-string-at-least-32-chars>

# Turnstile Secret Key (lấy từ Cloudflare Turnstile)
pnpm wrangler secret put TURNSTILE_SECRET_KEY

# N8N Webhook URL (cho gửi email)
pnpm wrangler secret put N8N_WEBHOOK_URL

# Exchange Rate API Key (optional)
pnpm wrangler secret put EXCHANGE_RATE_API_KEY
```

## Bước 2: Setup GitHub Secrets

### 2.1. Truy cập GitHub Repository Settings

1. Mở repo: `https://github.com/vomodo/family-hub`
2. Vào **Settings** > **Secrets and variables** > **Actions**
3. Click "New repository secret"

### 2.2. Thêm các secrets sau:

| Secret Name | Giá trị | Mô tả |
|------------|--------|-------|
| `CLOUDFLARE_API_TOKEN` | Token từ bước 1.2 | Để deploy Workers & Pages |
| `CLOUDFLARE_ACCOUNT_ID` | Account ID từ bước 1.1 | ID của Cloudflare account |
| `VITE_API_URL` | `https://family-hub-api.workers.dev` | URL của API backend |

### 2.3. Xác minh Secrets

```bash
# Check secrets đã thêm
gh secret list
```

## Bước 3: Deploy Lần Đầu (Manual)

### 3.1. Deploy API

```bash
cd packages/api
pnpm run deploy
```

URL sau khi deploy: `https://family-hub-api.workers.dev`

### 3.2. Deploy Web

```bash
cd packages/web

# Build
pnpm run build

# Deploy
pnpm wrangler pages deploy dist --project-name=family-hub
```

URL sau khi deploy: `https://family-hub.pages.dev`

### 3.3. Kiểm tra deployment

```bash
# Test API health
curl https://family-hub-api.workers.dev

# Kết quả mong đợi:
# {"status":"ok","version":"0.2.0","message":"🏠 FamilyHub API - MVP Complete",...}

# Test Web
open https://family-hub.pages.dev
```

## Bước 4: Auto-Deploy với GitHub Actions

### 4.1. Cách hoạt động

GitHub Actions workflow (`.github/workflows/deploy.yml`) tự động:

1. **Detect Changes**: Kiểm tra files nào thay đổi (API hoặc Web)
2. **Deploy API**: Nếu có thay đổi trong `packages/api/**`
3. **Deploy Web**: Nếu có thay đổi trong `packages/web/**`
4. **Notify**: Gửi summary kết quả

### 4.2. Trigger Auto-Deploy

```bash
# Mỗi khi push lên main branch
git add .
git commit -m "feat: new feature"
git push origin main

# GitHub Actions tự động deploy!
```

### 4.3. Theo dõi deployment

1. Vào repository > **Actions** tab
2. Xem workflow "Deploy to Cloudflare" đang chạy
3. Click vào run để xem logs chi tiết

### 4.4. Manual Trigger

Nếu muốn deploy thủ công không cần push code:

1. Vào **Actions** > "Deploy to Cloudflare"
2. Click "Run workflow"
3. Chọn branch `main`
4. Click "Run workflow"

## Bước 5: Setup Custom Domain (Optional)

### 5.1. API Custom Domain

1. Vào Cloudflare Dashboard > Workers & Pages
2. Chọn worker `family-hub-api`
3. Vào tab "Triggers"
4. Thêm custom domain: `api.yourfamily.com`
5. Cập nhật DNS records (tự động)

### 5.2. Web Custom Domain

1. Vào Cloudflare Dashboard > Workers & Pages
2. Chọn project `family-hub`
3. Vào tab "Custom domains"
4. Thêm domain: `yourfamily.com`
5. Cập nhật DNS (tự động)

### 5.3. Cập nhật API URL

Sau khi có custom domain, cập nhật:

```bash
# GitHub Secret
VITE_API_URL=https://api.yourfamily.com

# Web .env (development)
echo "VITE_API_URL=https://api.yourfamily.com" > packages/web/.env
```

## Bước 6: Monitoring & Logs

### 6.1. Xem Logs

```bash
# API logs (real-time)
cd packages/api
pnpm wrangler tail

# Web logs
# Vào Cloudflare Dashboard > Pages > family-hub > Deployments > View build log
```

### 6.2. Analytics

- **API**: Dashboard > Workers & Pages > family-hub-api > Analytics
- **Web**: Dashboard > Pages > family-hub > Analytics

### 6.3. Debugging

```bash
# Test API endpoints
curl https://family-hub-api.workers.dev/api/auth/me \
  -H "Authorization: Bearer <YOUR_TOKEN>"

# Kiểm tra database
cd packages/api
pnpm wrangler d1 execute family-hub-db --remote --command="SELECT * FROM users LIMIT 5;"
```

## Bước 7: Rollback Nếu Cần

### 7.1. Rollback API

```bash
cd packages/api

# Liệt kê versions
pnpm wrangler deployments list

# Rollback về version trước
pnpm wrangler rollback <VERSION_ID>
```

### 7.2. Rollback Web

1. Vào Cloudflare Dashboard > Pages > family-hub
2. Tab "Deployments"
3. Tìm deployment trước đó
4. Click "..." > "Rollback to this deployment"

## Troubleshooting

### Lỗi: "API Token invalid"

- Kiểm tra `CLOUDFLARE_API_TOKEN` trong GitHub Secrets
- Tạo lại token với đầy đủ quyền

### Lỗi: "Database not found"

```bash
# Kiểm tra database_id trong wrangler.toml
cd packages/api
pnpm wrangler d1 list
```

### Lỗi: "R2 bucket not found"

```bash
# Kiểm tra bucket
cd packages/api
pnpm wrangler r2 bucket list
```

### Lỗi: "Build failed"

```bash
# Test build local
cd packages/web
pnpm run build

# Nếu lỗi, kiểm tra:
# 1. Dependencies: pnpm install
# 2. TypeScript errors: pnpm run lint
# 3. Environment variables: .env file
```

## Chi phí

**Cloudflare Free Tier bao gồm:**
- Workers: 100,000 requests/day
- Pages: Unlimited
- D1: 5M reads/day, 100k writes/day
- R2: 10GB storage, 10M Class A operations/month

**Chỉ phí:**
- Cho 10-20 users: **$0/tháng** (đủ free tier)
- Cho 100+ users: ~$5-10/tháng

## Tiếp theo

- [ ] Setup domain tùy chỉnh
- [ ] Bật SSL/TLS encryption
- [ ] Thêm monitoring alerts
- [ ] Setup backup database
- [ ] Phân quyền role-based access

## Liên hệ

Có vấn đề? Tạo issue tại: https://github.com/vomodo/family-hub/issues