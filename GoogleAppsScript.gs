/**
 * 🔧 GOOGLE APPS SCRIPT - BACKEND
 * Lưu code này vào Google Apps Script Editor của Google Sheet
 * 
 * Steps:
 * 1. Mở Google Sheet của bạn
 * 2. Tools → Script Editor
 * 3. Copy-paste code này
 * 4. Deploy as Web App:
 *    - Execute as: Bạn
 *    - Who has access: Anyone
 * 5. Copy Deployment URL vào config.js
 */

const SHEET_ID = '1jQUiXw2LrmSGYvS7OtscIfwe6sOYt-1dwf05a77scjk';
const DEVICES_SHEET = 'Devices';
const STAFFS_SHEET = 'Staffs';
const REPORT_SHEET = 'Reports';

// =====================================
// 🎯 HANDLE POST REQUESTS
// =====================================

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    if (action === 'getDevices') {
      return getDevices();
    } else if (action === 'getStaffs') {
      return getStaffs();
    } else if (action === 'saveReport') {
      return saveReport(data.data);
    } else if (action === 'getDeviceInfo') {
      return getDeviceInfo(data.id);
    }
    
    return respond(false, 'Action không tồn tại');
  } catch (error) {
    Logger.log('Error: ' + error);
    return respond(false, error.toString());
  }
}

// =====================================
// 📊 GET DEVICES
// =====================================

function getDevices() {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(DEVICES_SHEET);
  const data = sheet.getDataRange().getValues();
  
  const devices = [];
  for (let i = 1; i < data.length; i++) {
    devices.push({
      'Device ID': data[i][0],
      'Device Name': data[i][1],
      'Room': data[i][2]
    });
  }
  
  return ContentService.createTextOutput(JSON.stringify(devices))
    .setMimeType(ContentService.MimeType.JSON);
}

// =====================================
// 👥 GET STAFFS
// =====================================

function getStaffs() {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(STAFFS_SHEET);
  const data = sheet.getDataRange().getValues();
  
  const staffs = [];
  for (let i = 1; i < data.length; i++) {
    staffs.push({
      'Staff Name': data[i][0],
      'Avatar URL': data[i][1],
      'Status': data[i][2]
    });
  }
  
  return ContentService.createTextOutput(JSON.stringify(staffs))
    .setMimeType(ContentService.MimeType.JSON);
}

// =====================================
// ✅ SAVE REPORT
// =====================================

function saveReport(reportData) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(REPORT_SHEET);
    
    // Kiểm tra header
    const firstRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    if (firstRow[0] !== 'Timestamp') {
      sheet.insertRows(1);
      sheet.getRange(1, 1, 1, 6).setValues([['Timestamp', 'Device ID', 'Reporter Name', 'Description', 'Status', 'Image']]);
    }
    
    // Thêm dòng mới
    const newRow = [
      new Date().toLocaleString('vi-VN'),
      reportData.idMay || '',
      reportData.nguoiBao || '',
      reportData.moTa || '',
      'Pending',
      reportData.imageData ? 'Có ảnh' : 'Không'
    ];
    
    sheet.appendRow(newRow);
    
    // Nếu có ảnh, lưu vào Drive
    if (reportData.imageData) {
      saveImageToDrive(reportData.imageData, reportData.idMay, reportData.nguoiBao);
    }
    
    return respond(true, 'Báo cáo đã được lưu thành công');
  } catch (error) {
    Logger.log('Save Error: ' + error);
    return respond(false, 'Lỗi khi lưu: ' + error.toString());
  }
}

// =====================================
// 🖼️ SAVE IMAGE TO DRIVE
// =====================================

function saveImageToDrive(base64Data, deviceId, reporterName) {
  try {
    const folder = DriveApp.getFoldersByName('IT-School-Reports').next();
    
    const blob = Utilities.newBlob(
      Utilities.base64DecodeWebSafe(base64Data),
      'image/jpeg',
      `Report_${deviceId}_${reporterName}_${Date.now()}.jpg`
    );
    
    folder.createFile(blob);
  } catch (error) {
    Logger.log('Image save error: ' + error);
    // Tạo folder nếu chưa có
    const folder = DriveApp.createFolder('IT-School-Reports');
    const blob = Utilities.newBlob(
      Utilities.base64DecodeWebSafe(base64Data),
      'image/jpeg',
      `Report_${deviceId}_${reporterName}_${Date.now()}.jpg`
    );
    folder.createFile(blob);
  }
}

// =====================================
// ✅ GET DEVICE INFO
// =====================================

function getDeviceInfo(deviceId) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(DEVICES_SHEET);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === deviceId) {
      return ContentService.createTextOutput(JSON.stringify({
        found: true,
        name: data[i][1],
        room: data[i][2]
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    found: false
  })).setMimeType(ContentService.MimeType.JSON);
}

// =====================================
// 🔄 RESPONSE HELPER
// =====================================

function respond(success, msg) {
  const response = {
    success: success,
    msg: msg
  };
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

// =====================================
// 🧪 TEST FUNCTION
// =====================================

function test() {
  Logger.log(getDevices());
  Logger.log(getStaffs());
}
