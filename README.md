# 🎯 IT School - Hệ Thống Báo Cáo Sự Cố

Ứng dụng web để báo cáo sự cố IT, tích hợp trực tiếp với **Google Sheet**.

## 📋 Cấu Trúc Google Sheet

Google Sheet của bạn cần có 3 sheets:

### 1️⃣ **Sheet "Devices"** (Danh sách thiết bị)
```
Cột A: Device ID (VD: OPS-123)
Cột B: Device Name (VD: Dell Laptop)
Cột C: Room (VD: Phòng IT)
```

### 2️⃣ **Sheet "Staffs"** (Danh sách nhân viên)
```
Cột A: Staff Name (VD: Nguyễn Văn A)
Cột B: Avatar URL (VD: https://example.com/avatar.jpg)
Cột C: Status (on-duty / off-duty)
```

### 3️⃣ **Sheet "Reports"** (Báo cáo sự cố)
```
Cột A: Timestamp
Cột B: Device ID
Cột C: Reporter Name
Cột D: Description
Cột E: Status
```

---

## 🚀 Cách Cài Đặt

### **Bước 1: Cập nhật config.js**

```javascript
const CONFIG = {
  SHEET_ID: '1jQUiXw2LrmSGYvS7OtscIfwe6sOYt-1dwf05a77scjk', // ID Google Sheet
  DEVICES_SHEET: 'Devices',
  STAFFS_SHEET: 'Staffs',
  REPORT_SHEET: 'Reports',
  API_KEY: 'YOUR_GOOGLE_API_KEY', // Google API Key
  GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/d/YOUR_SCRIPT_ID/usercss'
};
```

### **Bước 2: Tạo Google Apps Script**

1. Mở Google Sheet
2. Vào **Tools** → **Script Editor**
3. Copy code từ `GoogleAppsScript.gs` và paste
4. **Lưu** và **Deploy as Web App**
   - Execute as: Bạn
   - Who has access: Anyone
5. Copy **Deployment URL**

### **Bước 3: Cập nhật GOOGLE_SCRIPT_URL trong config.js**

```javascript
GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/d/abc123.../usercss'
```

### **Bước 4: Lấy Google API Key** (Tùy chọn - cho fetch dữ liệu)

1. Vào [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới
3. Enable **Google Sheets API**
4. Tạo **API Key**
5. Paste vào `config.js`

---

## 🎯 Cách Sử Dụng

### **Cách 1: Quét QR Code**
Tạo QR code chứa URL:
```
https://your-domain.com?id=OPS-123
```
Khi quét → Tự động điền Device ID

### **Cách 2: Nhập trực tiếp**
```
https://your-domain.com
```
Người dùng nhập Device ID → Kiểm tra tự động

---

## 📱 Các Tính Năng

✅ Quét QR code → Tự động điền  
✅ Kiểm tra thiết bị hợp lệ  
✅ Chọn nhanh lỗi phổ biến  
✅ Upload hình ảnh (nén tự động)  
✅ Danh sách nhân viên trực ban  
✅ Responsive mobile-friendly  
✅ Tích hợp Google Sheet  

---

## 🌐 Deploy

### **GitHub Pages**
```bash
git push origin main
```
Vào Settings → Pages → Enable

### **Netlify**
```bash
netlify deploy --prod --dir=.
```

### **Firebase Hosting**
```bash
firebase deploy
```

---

## 🔧 Troubleshooting

**❌ CORS Error?**
- Dùng Google Apps Script (có CORS support sẵn)
- Hoặc dùng JSONP proxy

**❌ Sheet không load?**
- Kiểm tra API Key
- Kiểm tra Sheet ID
- Kiểm tra tên sheet: `Devices`, `Staffs`, `Reports`

**❌ Hình ảnh không upload?**
- Cập nhật Google Apps Script code
- Kiểm tra quyền truy cập Sheet

---

## 📧 Support

Liên hệ: support@itschool.vn

---

**Made with ❤️ for IT Support**
