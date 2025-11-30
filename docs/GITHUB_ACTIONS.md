# 🚀 GitHub Actions CI/CD Setup

## Tổng quan Workflow

FamilyHub sử dụng GitHub Actions để tự động deploy khi push code lên `main` branch.

## Workflow File

**Location**: `.github/workflows/deploy.yml`

```yaml
name: Deploy to Cloudflare

on:
  push:
    branches:
      - main
  workflow_dispatch: # Manual trigger
```

## Các Jobs

### 1. `changes` - Detect Changes

**Mục đích**: Phát hiện files nào thay đổi để chỉ deploy package cần thiết

**Sử dụng**: `dorny/paths-filter@v3`

**Output**:
- `api`: true nếu có thay đổi trong `packages/api/**` hoặc `packages/shared/**`
- `web`: true nếu có thay đổi trong `packages/web/**` hoặc `packages/shared/**`

### 2. `deploy-api` - Deploy API to Workers

**Chạy khi**: `changes.outputs.api == 'true'`

**Bước**:
1. Checkout code
2. Setup pnpm + Node.js 20
3. Install dependencies (`pnpm install --frozen-lockfile`)
4. Run migrations (`db:generate`)
5. Deploy (`pnpm deploy:api`)
6. Success/failure notification

**Environment**: `production-api`

**URL**: https://family-hub-api.workers.dev

### 3. `deploy-web` - Deploy Web to Pages

**Chạy khi**: `changes.outputs.web == 'true'`

**Bước**:
1. Checkout code
2. Setup pnpm + Node.js 20
3. Install dependencies
4. Build (`pnpm build`)
5. Deploy với `cloudflare/wrangler-action@v3`
6. Success/failure notification

**Environment**: `production-web`

**URL**: https://family-hub.pages.dev

### 4. `notify` - Deployment Summary

**Chạy**: Luôn (sau khi API và Web jobs xong)

**Hiển thị**: Tổng kết kết quả deployment

## Secrets Cần Thiết

Setup tại: **Repository Settings > Secrets and variables > Actions**

| Secret | Bắt buộc | Mô tả |
|--------|----------|-------|
| `CLOUDFLARE_API_TOKEN` | ✅ | API token để deploy Workers & Pages |
| `CLOUDFLARE_ACCOUNT_ID` | ✅ | Cloudflare Account ID |
| `VITE_API_URL` | ❌ | URL của API (default: https://family-hub-api.workers.dev) |

## Cách Lấy Secrets

### CLOUDFLARE_API_TOKEN

1. Truy cập: https://dash.cloudflare.com/profile/api-tokens
2. Click "Create Token"
3. Chọn "Edit Cloudflare Workers" template
4. Hoặc tạo Custom Token với permissions:
   ```
   Account:
     - Workers Scripts: Edit
     - Workers KV Storage: Edit
     - D1: Edit
     - R2 Storage: Edit
     - Cloudflare Pages: Edit
   ```
5. Copy token (chỉ hiển 1 lần)

### CLOUDFLARE_ACCOUNT_ID

1. Vào Cloudflare Dashboard
2. Chọn bất kỳ domain/zone
3. Scroll xuống sidebar bên phải
4. Copy "Account ID"

## Thêm Secrets vào GitHub

### Via GitHub UI

1. Mở: https://github.com/vomodo/family-hub/settings/secrets/actions
2. Click "New repository secret"
3. Nhập name và value
4. Click "Add secret"

### Via GitHub CLI

```bash
# Install GitHub CLI
brew install gh
# or: sudo apt install gh

# Login
gh auth login

# Add secrets
gh secret set CLOUDFLARE_API_TOKEN
gh secret set CLOUDFLARE_ACCOUNT_ID
gh secret set VITE_API_URL

# Verify
gh secret list
```

## Cách Sử Dụng

### Auto Deploy (Push to main)

```bash
# Make changes
git add .
git commit -m "feat: new feature"

# Push to main -> auto deploy
git push origin main

# Check status
open https://github.com/vomodo/family-hub/actions
```

### Manual Deploy

1. Vào: https://github.com/vomodo/family-hub/actions
2. Chọn "Deploy to Cloudflare" workflow
3. Click "Run workflow" button
4. Chọn branch `main`
5. Click "Run workflow"

### Deploy Chỉ API

```bash
# Chỉ thay đổi files trong packages/api/
git add packages/api/
git commit -m "fix: api bug"
git push

# Chỉ deploy-api job chạy
```

### Deploy Chỉ Web

```bash
# Chỉ thay đổi files trong packages/web/
git add packages/web/
git commit -m "style: UI update"
git push

# Chỉ deploy-web job chạy
```

## Monitoring Deployments

### Xem Workflow Runs

1. Vào **Actions** tab
2. Click vào workflow run muốn xem
3. Xem logs của từng job

### Kiểm tra Deploy Status

```bash
# Via GitHub CLI
gh run list --workflow=deploy.yml

# Xem logs của run gần nhất
gh run view --log

# Xem logs của run cụ thể
gh run view <RUN_ID> --log
```

### Notification Badges

Thêm vào README.md:

```markdown
[![Deploy](https://github.com/vomodo/family-hub/actions/workflows/deploy.yml/badge.svg)](https://github.com/vomodo/family-hub/actions/workflows/deploy.yml)
```

## Advanced Features

### Environment Protection Rules

Setup tại: **Settings > Environments**

1. Tạo environment `production-api` và `production-web`
2. Thêm protection rules:
   - Required reviewers: Chọn ai cần approve
   - Wait timer: Đợi X phút trước khi deploy
   - Deployment branches: Chỉ `main`

### Slack Notifications

Thêm step vào workflow:

```yaml
- name: Notify Slack
  if: always()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### Rollback on Failure

```yaml
- name: Rollback on failure
  if: failure()
  run: |
    cd packages/api
    pnpm wrangler rollback
```

## Troubleshooting

### Lỗi: "Resource not accessible by integration"

**Nguyên nhân**: Không có quyền access secrets

**Giải pháp**:
1. Kiểm tra secrets đã thêm chưa
2. Kiểm tra workflow permissions trong Settings > Actions

### Lỗi: "wrangler command not found"

**Nguyên nhân**: Dependencies chưa install đúng

**Giải pháp**: Đảm bảo có step:
```yaml
- run: pnpm install --frozen-lockfile
```

### Lỗi: "API token invalid"

**Giải pháp**:
1. Tạo lại API token với đầy đủ permissions
2. Cập nhật secret `CLOUDFLARE_API_TOKEN`
3. Re-run workflow

### Job bị skip

**Nguyên nhân**: Không có thay đổi trong package tương ứng

**Chắc chắn deploy**: Dùng manual trigger hoặc thay đổi file trong package đó

## Performance Tips

### Cache Dependencies

Workflow đã sử dụng cache:
```yaml
- uses: actions/setup-node@v4
  with:
    cache: 'pnpm'
```

### Parallel Jobs

API và Web deploy song song (không chờ nhau):
```yaml
jobs:
  deploy-api:
    needs: changes
  deploy-web:
    needs: changes  # Cả 2 chạy song song
```

### Skip CI

Nếu không muốn trigger deploy:
```bash
git commit -m "docs: update README [skip ci]"
```

## Best Practices

1. **Luôn test local trước khi push**
   ```bash
   pnpm build
   pnpm lint
   ```

2. **Sử dụng semantic commit messages**
   ```bash
   feat: new feature
   fix: bug fix
   docs: documentation
   style: formatting
   refactor: code restructure
   test: testing
   chore: maintenance
   ```

3. **Kiểm tra workflow trước khi merge**
   - Tạo PR
   - Đợi CI pass
   - Sau đó mới merge vào main

4. **Monitor deployment logs**
   - Check Actions tab sau mỗi push
   - Fix ngay nếu có lỗi

## Resources

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Cloudflare Workers Deploy](https://developers.cloudflare.com/workers/ci-cd/)
- [Wrangler Action](https://github.com/cloudflare/wrangler-action)
- [Path Filter Action](https://github.com/dorny/paths-filter)