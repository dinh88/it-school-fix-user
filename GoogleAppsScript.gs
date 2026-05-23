/**
 * 🔧 GOOGLE APPS SCRIPT - BACKEND (HOÀN CHỈNH)
 * Lưu code này vào Google Apps Script Editor của Google Sheet
 * 
 * Steps:
 * 1. Mở Google Sheet: https://docs.google.com/spreadsheets/d/1h7SWX4iIiOUOFCEtMGryaMYYPKktA9DkNsy_du4Pi78
 * 2. Tools → Script Editor
 * 3. Copy-paste code này (xóa code cũ)
 * 4. Deploy: New deployment → Web app → Execute as: Me → Who has access: Anyone
 * 5. Copy URL → dán vào config.js (GOOGLE_SCRIPT_URL)
 */

const SHEET_ID = '1h7SWX4iIiOUOFCEtMGryaMYYPKktA9DkNsy_du4Pi78';
const CONFIG_SHEET = 'Config';
const DEVICES_SHEET = 'Devices';
const STAFFS_SHEET = 'Staffs';
const REPORT_SHEET = 'Reports';
const FOLDER_NAME = 'IT-School-Reports';

// =====================================
// 🎯 HANDLE POST REQUESTS
// =====================================

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    if (action === 'getConfig') {
      return respond(true, 'Thành công', getConfig());
    } else if (action === 'getDevices') {
      return respond(true, 'Thành công', getDevices());
    } else if (action === 'getStaffs') {
      return respond(true, 'Thành công', getStaffs());
    } else if (action === 'getDeviceInfo') {
      const deviceId = data.deviceId;
      return respond(true, 'Thành công', getDeviceInfo(deviceId));
    } else if (action === 'saveReport') {
      const reportData = data.data;
      const result = saveReport(reportData);
      return respond(result.success, result.msg, result.data);
    } else {
      return respond(false, 'Action không tồn tại');
    }
  } catch (error) {
    return respond(false, 'Lỗi server: ' + error.toString());
  }
}

// =====================================
// ⚙️ GET CONFIG
// =====================================

function getConfig() {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(CONFIG_SHEET);
    
    if (!sheet) {
      return {
        'APP_NAME': 'Báo Cáo Sự Cố IT',
        'COMPANY_NAME': 'IT School',
        'PRIMARY_COLOR': '#0d6efd',
        'CONTACT_INFO': '📞 Hotline: 0865 123 456'
      };
    }
    
    const data = sheet.getDataRange().getValues();
    const config = {};
    
    for (let i = 1; i < data.length; i++) {
      const key = data[i][0];
      const value = data[i][1];
      if (key) {
        config[key] = value;
      }
    }
    
    return config;
  } catch (error) {
    Logger.log('❌ Lỗi getConfig:', error);
    return {};
  }
}

// =====================================
// 📊 GET DEVICES
// =====================================

function getDevices() {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(DEVICES_SHEET);
    
    if (!sheet) return [];
    
    const data = sheet.getDataRange().getValues();
    const devices = [];
    const headers = data[0];
    
    for (let i = 1; i < data.length; i++) {
      const device = {};
      for (let j = 0; j < headers.length; j++) {
        device[headers[j]] = data[i][j];
      }
      if (device['Device ID']) {
        devices.push(device);
      }
    }
    
    return devices;
  } catch (error) {
    Logger.log('❌ Lỗi getDevices:', error);
    return [];
  }
}

// =====================================
// 👥 GET STAFFS
// =====================================

function getStaffs() {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(STAFFS_SHEET);
    
    if (!sheet) return [];
    
    const data = sheet.getDataRange().getValues();
    const staffs = [];
    const headers = data[0];
    
    for (let i = 1; i < data.length; i++) {
      const staff = {};
      for (let j = 0; j < headers.length; j++) {
        staff[headers[j]] = data[i][j];
      }
      if (staff['Staff Name']) {
        staffs.push(staff);
      }
    }
    
    return staffs;
  } catch (error) {
    Logger.log('❌ Lỗi getStaffs:', error);
    return [];
  }
}

// =====================================
// ✅ GET DEVICE INFO
// =====================================

function getDeviceInfo(deviceId) {
  try {
    const devices = getDevices();
    const device = devices.find(d => 
      d['Device ID'] && d['Device ID'].toString().toUpperCase() === deviceId.toUpperCase()
    );
    
    if (device) {
      return {
        found: true,
        name: device['Device Name'] || 'N/A',
        room: device['Room'] || 'N/A'
      };
    } else {
      return {
        found: false,
        name: 'N/A',
        room: 'N/A'
      };
    }
  } catch (error) {
    Logger.log('❌ Lỗi getDeviceInfo:', error);
    return { found: false, name: 'N/A', room: 'N/A' };
  }
}

// =====================================
// ✅ SAVE REPORT
// =====================================

function saveReport(reportData) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(REPORT_SHEET);
    
    if (!sheet) {
      return { success: false, msg: 'Sheet Reports không tồn tại' };
    }
    
    // Chuẩn bị dữ liệu
    const timestamp = new Date();
    const imageUrl = '';
    
    // Nếu có ảnh, lưu vào Drive
    let imageLink = '';
    if (reportData.imageData && reportData.imageData.trim()) {
      const imageResult = saveImageToDrive(reportData.imageData, reportData.idMay, reportData.nguoiBao);
      if (imageResult.success) {
        imageLink = imageResult.url;
      }
    }
    
    // Thêm dòng vào sheet
    const newRow = [
      timestamp,
      reportData.idMay,
      reportData.nguoiBao,
      reportData.moTa,
      imageLink,
      'Chưa xử lý'
    ];
    
    sheet.appendRow(newRow);
    
    return {
      success: true,
      msg: 'Báo cáo đã được lưu thành công',
      data: { timestamp: timestamp.toString(), imageUrl: imageLink }
    };
  } catch (error) {
    Logger.log('❌ Lỗi saveReport:', error);
    return { success: false, msg: 'Lỗi lưu báo cáo: ' + error.toString() };
  }
}

// =====================================
// 🖼️ SAVE IMAGE TO DRIVE
// =====================================

function saveImageToDrive(base64Data, deviceId, reporterName) {
  try {
    // Tạo/lấy folder
    let folder = null;
    const folders = DriveApp.getFoldersByName(FOLDER_NAME);
    
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder(FOLDER_NAME);
    }
    
    // Decode base64 → Blob
    const bytes = Utilities.newBlob(Utilities.base64Decode(base64Data)).getBytes();
    const blob = Utilities.newBlob(bytes, 'image/jpeg');
    
    // Tên file: deviceId_reporterName_timestamp
    const timestamp = new Date().getTime();
    const fileName = deviceId + '_' + reporterName.replace(/\s+/g, '_') + '_' + timestamp + '.jpg';
    
    // Lưu file
    const file = folder.createFile(blob).setName(fileName);
    
    return {
      success: true,
      url: file.getUrl()
    };
  } catch (error) {
    Logger.log('❌ Lỗi saveImageToDrive:', error);
    return { success: false, url: '' };
  }
}

// =====================================
// 🔄 RESPONSE HELPER
// =====================================

function respond(success, msg, data) {
  const response = {
    success: success,
    msg: msg,
    data: data || {}
  };
  
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

// =====================================
// 🧪 TEST FUNCTION
// =====================================

function test() {
  Logger.log('=== CONFIG ===');
  Logger.log(getConfig());
  
  Logger.log('=== DEVICES ===');
  Logger.log(getDevices());
  
  Logger.log('=== STAFFS ===');
  Logger.log(getStaffs());
  
  Logger.log('=== TEST DEVICE INFO ===');
  Logger.log(getDeviceInfo('OPS-001'));
}