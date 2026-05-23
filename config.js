/**
 * ⚙️ CONFIGURATION & API INTEGRATION
 * Cấu hình tất cả + Mock data + API calls
 */

const CONFIG = {
  // ========== GOOGLE SHEET ==========
  SHEET_ID: '1jQUiXw2LrmSGYvS7OtscIfwe6sOYt-1dwf05a77scjk',
  
  // ========== GOOGLE APPS SCRIPT URL ==========
  // Sau khi deploy, paste URL từ Apps Script vào đây
  GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/d/YOUR_DEPLOYMENT_ID/usercss',
  
  // ========== CHỌN MODE ==========
  USE_MOCK_DATA: true, // ← Bật để test không cần Google Sheet
  
  // ========== GIAO DIỆN ==========
  APP_NAME: 'Báo Cáo Sự Cố IT',
  COMPANY_NAME: 'IT School',
  LOGO_URL: null, // Để null thì hiển thị emoji 🏢
  CONTACT_INFO: '📞 Hotline: 0865 123 456 | Email: support@itschool.vn'
};

// =====================================
// 📊 MOCK DATA - TEST KHÔNG CẦN BACKEND
// =====================================

const MOCK_DEVICES = [
  { 'Device ID': 'OPS-001', 'Device Name': 'Dell Laptop', 'Room': 'Phòng IT' },
  { 'Device ID': 'OPS-002', 'Device Name': 'HP Monitor 24"', 'Room': 'Phòng Kế Toán' },
  { 'Device ID': 'OPS-003', 'Device Name': 'Canon Printer', 'Room': 'Phòng Hành Chính' },
  { 'Device ID': 'OPS-004', 'Device Name': 'Cisco Router', 'Room': 'Phòng Server' }
];

const MOCK_STAFFS = [
  {
    'Staff Name': 'Nguyễn Văn A',
    'Avatar URL': 'https://i.pravatar.cc/150?img=1',
    'Status': 'on-duty'
  },
  {
    'Staff Name': 'Trần Thị B',
    'Avatar URL': 'https://i.pravatar.cc/150?img=2',
    'Status': 'on-duty'
  },
  {
    'Staff Name': 'Phạm Minh C',
    'Avatar URL': 'https://i.pravatar.cc/150?img=3',
    'Status': 'off-duty'
  }
];

// =====================================
// 🔄 API CALLS - FETCH DATA
// =====================================

/**
 * Lấy danh sách thiết bị
 */
async function fetchDevices() {
  if (CONFIG.USE_MOCK_DATA) {
    return MOCK_DEVICES;
  }
  
  try {
    const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'getDevices' }),
      headers: { 'Content-Type': 'application/json' }
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Lỗi fetch devices:', error);
    return MOCK_DEVICES; // Fallback
  }
}

/**
 * Lấy danh sách nhân viên
 */
async function fetchStaffs() {
  if (CONFIG.USE_MOCK_DATA) {
    return MOCK_STAFFS;
  }
  
  try {
    const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'getStaffs' }),
      headers: { 'Content-Type': 'application/json' }
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Lỗi fetch staffs:', error);
    return MOCK_STAFFS; // Fallback
  }
}

/**
 * Lấy thông tin thiết bị (kiểm tra xem có tồn tại không)
 */
async function getDeviceInfo(deviceId) {
  if (CONFIG.USE_MOCK_DATA) {
    const device = MOCK_DEVICES.find(d => d['Device ID'] === deviceId);
    if (device) {
      return {
        found: true,
        name: device['Device Name'],
        room: device['Room']
      };
    } else {
      return { found: false };
    }
  }
  
  try {
    const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'getDeviceInfo', id: deviceId }),
      headers: { 'Content-Type': 'application/json' }
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Lỗi get device info:', error);
    return { found: false };
  }
}

/**
 * Lưu báo cáo vào Google Sheet
 */
async function saveReport(data) {
  if (CONFIG.USE_MOCK_DATA) {
    // Mock mode: chỉ show success message
    console.log('📝 Mock report:', data);
    return { success: true, msg: 'Mock mode - Data không được lưu vào Sheet' };
  }
  
  try {
    const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'saveReport', data: data }),
      headers: { 'Content-Type': 'application/json' }
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('❌ Lỗi save report:', error);
    return { success: false, msg: error.toString() };
  }
}

// =====================================
// 🎨 LOAD CONFIG VÀO UI
// =====================================

document.addEventListener('DOMContentLoaded', function() {
  // Update header
  document.getElementById('headerApp').textContent = CONFIG.APP_NAME;
  document.getElementById('headerCompany').textContent = CONFIG.COMPANY_NAME;
  
  if (CONFIG.LOGO_URL) {
    const img = document.createElement('img');
    img.src = CONFIG.LOGO_URL;
    img.className = 'header-logo';
    document.getElementById('headerLogo').innerHTML = '';
    document.getElementById('headerLogo').appendChild(img);
  }
  
  // Update contact info
  document.getElementById('contactInfo').textContent = CONFIG.CONTACT_INFO;
});
