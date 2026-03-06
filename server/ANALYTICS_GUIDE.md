# 📊 Login Analytics System - Hướng Dẫn Sử Dụng

## 🎯 Tổng Quan

Hệ thống Login Analytics giúp bạn:
- **Theo dõi số lần đăng nhập** của mỗi người dùng
- **Phân tích khoảng thời gian đăng nhập** (theo ngày, theo giờ)
- **Xác định giờ cao điểm** khi người dùng hoạt động nhiều nhất
- **Thống kê người dùng độc lập** và tần suất sử dụng
- **Tạo báo cáo toàn diện** về hoạt động đăng nhập

## 📁 Cấu Trúc Dự Án

```
server/
├── utils/
│   └── loginAnalytics.js       # Hàm phân tích dữ liệu
├── routes/
│   └── analytics.js             # API endpoints
├── logs/
│   └── login.log                # File lưu trữ log đăng nhập
└── index.js                     # Server chính

client/
└── src/
    └── components/
        └── Admin/
            ├── LoginAnalytics.jsx    # React component
            └── LoginAnalytics.css    # Styles
```

## 🚀 API Endpoints

### 1. **GET /analytics/login/summary**
Lấy thống kê tóm tắt

**Response:**
```json
{
  "success": true,
  "data": {
    "totalLogins": 8,
    "uniqueUsers": 3,
    "averageLoginsPerUser": "2.67",
    "reportGeneratedAt": "2026-01-19T15:50:00.000Z"
  }
}
```

### 2. **GET /analytics/login/users**
Lấy danh sách người dùng với số lần đăng nhập

**Response:**
```json
{
  "success": true,
  "data": {
    "totalUniqueUsers": 3,
    "users": [
      {
        "email": "admin@ant-tech.asia",
        "userId": "68bdcf22131c403154a093e8",
        "count": 3,
        "firstLogin": "2026-01-19T15:37:00.739Z",
        "lastLogin": "2026-01-19T15:48:29.159Z",
        "logins": [
          {
            "time": "2026-01-19T15:37:00.739Z",
            "ip": "127.0.0.1",
            "userAgent": "Mozilla/5.0..."
          }
        ]
      }
    ]
  }
}
```

### 3. **GET /analytics/login/by-date**
Lấy thống kê đăng nhập theo ngày

**Response:**
```json
{
  "success": true,
  "data": {
    "2026-01-19": {
      "date": "2026-01-19",
      "totalLogins": 8,
      "uniqueUsers": ["admin@ant-tech.asia", "hieuhp132@gmail.com", "hihi@smile.next"],
      "uniqueUserCount": 3,
      "logins": [...]
    }
  }
}
```

### 4. **GET /analytics/login/by-hour**
Lấy thống kê đăng nhập theo giờ

**Response:**
```json
{
  "success": true,
  "data": {
    "2026-01-19 15:00": {
      "hour": "2026-01-19 15:00",
      "totalLogins": 4,
      "uniqueUsers": ["admin@ant-tech.asia", "hieuhp132@gmail.com"],
      "uniqueUserCount": 2,
      "logins": [...]
    }
  }
}
```

### 5. **GET /analytics/login/peak-times**
Lấy các giờ cao điểm (sắp xếp từ cao đến thấp)

**Response:**
```json
{
  "success": true,
  "data": {
    "peakLoginTimes": [
      {
        "hour": "15:00",
        "count": 4
      },
      {
        "hour": "16:00",
        "count": 3
      }
    ]
  }
}
```

### 6. **GET /analytics/login/frequency**
Lấy tần suất đăng nhập của người dùng

**Response:**
```json
{
  "success": true,
  "data": {
    "userLoginFrequency": [
      {
        "email": "admin@ant-tech.asia",
        "userId": "68bdcf22131c403154a093e8",
        "loginCount": 3,
        "firstLogin": "2026-01-19T15:37:00.739Z",
        "lastLogin": "2026-01-19T15:48:29.159Z",
        "daysSinceFirstLogin": 0
      }
    ]
  }
}
```

### 7. **GET /analytics/login/user/:email**
Lấy chi tiết đăng nhập của một người dùng cụ thể

**Example:**
```
GET /analytics/login/user/admin@ant-tech.asia
```

**Response:**
```json
{
  "success": true,
  "data": {
    "email": "admin@ant-tech.asia",
    "userId": "68bdcf22131c403154a093e8",
    "count": 3,
    "firstLogin": "2026-01-19T15:37:00.739Z",
    "lastLogin": "2026-01-19T15:48:29.159Z",
    "logins": [...]
  }
}
```

## 💻 Sử Dụng Frontend

### Import Component
```jsx
import LoginAnalytics from './components/Admin/LoginAnalytics';

function AdminDashboard() {
  return <LoginAnalytics />;
}
```

### Features của Component
- **Tab Tóm Tắt**: Hiển thị biểu đồ cột giờ cao điểm
- **Tab Người Dùng**: Danh sách người dùng với số lần đăng nhập
- **Tab Theo Ngày**: Thống kê đăng nhập hàng ngày
- **Tab Giờ Cao Điểm**: Chi tiết giờ cao điểm
- **Nút Làm Mới**: Cập nhật dữ liệu mới nhất

## 🔧 Sử Dụng Backend (Node.js)

### Import Module
```javascript
const {
  parseLoginLog,
  getLoginCountByUser,
  getLoginByDate,
  getLoginByHour,
  getPeakLoginTimes,
  getUserLoginFrequency,
  getUniqueUsersCount,
  getTotalLoginCount,
  generateLoginReport
} = require('../utils/loginAnalytics');
```

### Ví Dụ Sử Dụng
```javascript
// Lấy số lần đăng nhập của mỗi người dùng
const userStats = getLoginCountByUser();
console.log(userStats);

// Lấy danh sách các giờ cao điểm
const peakTimes = getPeakLoginTimes();
console.log(peakTimes);

// Tạo báo cáo toàn diện
const report = generateLoginReport();
console.log(report);

// Lấy tần suất đăng nhập
const frequency = getUserLoginFrequency();
console.log(frequency);
```

## 📊 Ví Dụ Phân Tích Dữ Liệu

### Từ login.log hiện tại:
```
- admin@ant-tech.asia: 3 lần
  * 15:37:00
  * 15:39:14
  * 15:48:29

- hieuhp132@gmail.com: 3 lần
  * 15:37:17
  * 15:39:01
  * 15:48:20

- hihi@smile.next: 1 lần
  * 15:35:33

Giờ cao điểm: 15:00 (8 lần) - nhất là vào lúc 15:35-15:48
```

## 🔐 Security Considerations

1. **Authentication**: API nên có bảo vệ (middleware kiểm tra admin)
2. **Rate Limiting**: Hạn chế tần suất gọi API
3. **Data Privacy**: Không expose chi tiết IP, User Agent đầy đủ
4. **Log Rotation**: Xóa log cũ hơn 30 ngày

## ⚙️ Middleware Bảo Vệ (Tùy chọn)

```javascript
// Thêm middleware kiểm tra admin
router.use((req, res, next) => {
  // Kiểm tra user có phải admin
  const isAdmin = req.user?.role === 'admin';
  if (!isAdmin) {
    return res.status(403).json({
      success: false,
      error: 'Access denied'
    });
  }
  next();
});
```

## 📈 Thêm Tính Năng Trong Tương Lai

- [ ] Export dữ liệu ra CSV/Excel
- [ ] Biểu đồ thống kê nâng cao (Line Chart, Pie Chart)
- [ ] Thông báo đăng nhập bất thường
- [ ] So sánh với kỳ trước
- [ ] Filter theo ngày, người dùng
- [ ] Cache dữ liệu để tối ưu hiệu suất

## 🐛 Troubleshooting

### Login.log không tồn tại
```bash
# Tạo thư mục logs nếu chưa có
mkdir -p server/logs

# Hoặc check middleware đang ghi log đúng không
```

### API trả về lỗi 500
- Kiểm tra file login.log có quyền đọc
- Xem logs server để debug chi tiết

### Data không update
- Nhấn "Làm Mới Dữ Liệu" để reload từ API
- Kiểm tra API endpoint hoạt động
- Xem browser console để xem lỗi

## 📝 Ghi Chú

- Log đăng nhập được lưu dưới dạng NDJSON (mỗi dòng là 1 JSON object)
- Thời gian được lưu ở timezone UTC (Z)
- Có thể customize format đầu ra tùy theo nhu cầu
