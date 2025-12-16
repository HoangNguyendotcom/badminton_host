# Hướng Dẫn Test Supabase

## ✅ Đã hoàn thành

1. ✅ File `.env.local` đã được tạo với cấu hình Supabase
2. ✅ Tất cả các bảng đã được tạo trong Supabase:
   - `sessions` (có cột `address`)
   - `players` (có cột `team`)
   - `matches`
   - `match_players`
   - `tournament_pairs`
   - `tournament_brackets`
   - `tournament_standings`

## 🧪 Cách Test

### Bước 1: Kiểm tra kết nối (Đã chạy)

```bash
npm run test:supabase
```

Hoặc:
```bash
node scripts/test-supabase.js
```

### Bước 2: Restart Dev Server

```bash
# Dừng server hiện tại (nếu đang chạy) bằng Ctrl+C
npm run dev
```

### Bước 3: Test trong ứng dụng

1. Mở [http://localhost:3000](http://localhost:3000)
2. Tạo session mới:
   - Click "Tạo mã mới"
   - Chọn chế độ chơi
   - Nhập địa điểm (nếu muốn)
   - Click "Tạo phiên"
3. Thêm người chơi:
   - Nhập tên, giới tính, điểm
   - Click "Thêm"
4. Chia đội (nếu chế độ "Chia đội"):
   - Click "Chia đội"
   - Kiểm tra team assignment

### Bước 4: Kiểm tra dữ liệu trong Supabase

1. Vào [Supabase Dashboard](https://app.supabase.com)
2. Chọn project của bạn
3. Vào **Table Editor**
4. Kiểm tra các bảng:
   - **sessions**: Sẽ có session mới với `code`, `game_mode`, `address`
   - **players**: Sẽ có danh sách players với `team` assignment
   - **matches**: Sẽ có matches khi bạn tạo trận đấu

### Bước 5: Test đồng bộ

1. Tạo session và thêm dữ liệu
2. Refresh trang (F5)
3. Dữ liệu sẽ được load từ Supabase
4. Hoặc mở session khác bằng mã session

## 🔍 Kiểm tra Console

Mở Browser Console (F12) và kiểm tra:
- Không có lỗi về Supabase connection
- Có thể thấy logs về sync data (nếu có)

## 📊 Kiểm tra trong Supabase

### Xem dữ liệu real-time:

1. Vào **Table Editor** trong Supabase
2. Chọn bảng `sessions`
3. Bạn sẽ thấy session mới được tạo
4. Chọn bảng `players` để xem danh sách players với team assignment

### Kiểm tra logs:

1. Vào **Logs** trong Supabase Dashboard
2. Xem API requests và errors (nếu có)

## ⚠️ Troubleshooting

### Nếu không thấy dữ liệu trong Supabase:

1. Kiểm tra `.env.local` có đúng URL và Key không
2. Restart dev server sau khi tạo `.env.local`
3. Kiểm tra browser console có lỗi không
4. Chạy lại `npm run test:supabase`

### Nếu có lỗi connection:

1. Kiểm tra Supabase project có đang active không
2. Kiểm tra RLS policies (hiện tại đã cho phép public access)
3. Kiểm tra network connection

## 🎯 Test Cases

### Test Case 1: Tạo session mới
- ✅ Tạo session với địa điểm
- ✅ Session được lưu vào Supabase
- ✅ Có thể load lại session bằng mã

### Test Case 2: Thêm players
- ✅ Thêm players vào session
- ✅ Players được sync lên Supabase
- ✅ Team assignment được lưu (nếu chia đội)

### Test Case 3: Tạo matches
- ✅ Tạo trận đấu
- ✅ Match được lưu vào Supabase
- ✅ Match players được link đúng

### Test Case 4: Load session từ Supabase
- ✅ Join session bằng mã
- ✅ Dữ liệu được load từ Supabase
- ✅ Tất cả players, matches, pairs được restore

## 📝 Notes

- LocalStorage vẫn được sử dụng để cache session active (tối ưu hiệu suất)
- Tất cả dữ liệu được sync lên Supabase theo mã session
- Chỉ session active được giữ trong localStorage, các session cũ được cleanup


