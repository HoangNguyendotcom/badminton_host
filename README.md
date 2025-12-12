# Badminton Host

Webapp Next.js để nhập danh sách người chơi và chia đội cầu lông theo mã session (lưu tạm trên trình duyệt). Kết nối Supabase sẽ bổ sung sau.

## Chạy dự án

```bash
npm install
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) để xem ứng dụng.

## Build production

```bash
npm run build
npm start
```

## Deploy lên Vercel

Dự án đã sẵn sàng để deploy lên Vercel:

1. **Qua Vercel CLI:**
   ```bash
   npm i -g vercel
   vercel
   ```

2. **Qua GitHub:**
   - Push code lên GitHub repository
   - Vào [vercel.com](https://vercel.com)
   - Import project từ GitHub
   - Vercel sẽ tự động detect Next.js và deploy

3. **Qua Vercel Dashboard:**
   - Vào [vercel.com/new](https://vercel.com/new)
   - Import Git repository hoặc upload code
   - Vercel sẽ tự động build và deploy

**Lưu ý:** 
- Không cần cấu hình thêm, Vercel tự động detect Next.js
- Không cần environment variables cho phiên bản hiện tại (localStorage-based)
- Build command: `npm run build` (mặc định)
- Output directory: `.next` (mặc định)

## Thư mục chính

- `app/` – App Router, trang chính tại `app/page.tsx`
- `components/` – Form, bảng người chơi, panel đội
- `lib/teamSplitter.ts` – Thuật toán chia đội cân bằng số người, giới tính, điểm
- `lib/sessionStore.ts` – Lưu/đọc session vào localStorage (Supabase: TODO)
- `types/` – Kiểu dữ liệu dùng chung