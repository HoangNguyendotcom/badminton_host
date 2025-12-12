# Badminton Host

Webapp Next.js để nhập danh sách người chơi và chia đội cầu lông theo mã session (lưu tạm trên trình duyệt). Kết nối Supabase sẽ bổ sung sau.

## Chạy dự án

```bash
npm install
npm run dev
```

## Thư mục chính

- `app/` – App Router, trang chính tại `app/page.tsx`
- `components/` – Form, bảng người chơi, panel đội
- `lib/teamSplitter.ts` – Thuật toán chia đội cân bằng số người, giới tính, điểm
- `lib/sessionStore.ts` – Lưu/đọc session vào localStorage (Supabase: TODO)
- `types/` – Kiểu dữ liệu dùng chung