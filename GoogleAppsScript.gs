/**
 * EMS PRO - BẢN HOÀN THIỆN ĐẦY ĐỦ 100% (WEB APP + API MOBILE BACKEND)
 * FIX TRIỆT ĐỂ 100% LỖI HIỂN THỊ ẢNH AVATAR DO CƠ CHẾ BẢO MẬT MỚI CỦA DRIVE
 */

var SHEET_ASSETS = "1_ThietBi", SHEET_TICKETS = "2_PhieuSuCo", SHEET_STAFF = "4_NhanSu", SHEET_CONFIG = "CONFIG";
var SHEET_TICKET_LOG = "3_TienDoXuLy", SHEET_SYSTEM_LOG = "6_SystemLog";
var FOLDER_IMG_ID = "1Fqob0H8oEoHhWkw7ZsXASpD3KU1d6ety"; 
var SYSTEM_PASSWORD = "admin123";

// --- 1. HỆ THỐNG GHI LOG KÉP (DUAL LOGGING) ---
function writeSystemLog(userEmail, action, detail) {
  try {
    var logSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_SYSTEM_LOG);
    if (!logSheet) return;
    var now = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd HH:mm:ss");
    logSheet.appendRow([Utilities.getUuid(), now, userEmail || "Hệ thống", action, "", detail || ""]);
  } catch (e) {}
}

function writeTicketProgress(ticketId, userEmail, action, detail, imgUrl) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_TICKET_LOG);
    if (!sheet) return;
    var now = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd HH:mm:ss");
    sheet.appendRow([Utilities.getUuid(), ticketId, now, userEmail || "Hệ thống", action, detail || "OK", imgUrl || ""]);
  } catch (e) {}
}

// --- 2. CORE ROUTING ---
function doGet(e) {
  // CỔNG API CHO APP DI ĐỘNG GỌI
  if (e.parameter && e.parameter.api === 'true') {
    var action = e.parameter.action;
    if (action === 'getDevices') return ContentService.createTextOutput(JSON.stringify({success: true, data: getDataSafe(SHEET_ASSETS)})).setMimeType(ContentService.MimeType.JSON);
    if (action === 'getStaffs') return ContentService.createTextOutput(JSON.stringify({success: true, data: getActiveTechs()})).setMimeType(ContentService.MimeType.JSON);
    return ContentService.createTextOutput(JSON.stringify({success: false, msg: "Action not found"})).setMimeType(ContentService.MimeType.JSON);
  }

  // LUỒNG WEB APP GỐC HIỂN THỊ GIAO DIỆN HTML
  var template; var config = getAppConfig();
  if (e.parameter && e.parameter.view === 'admin') {
    template = HtmlService.createTemplateFromFile('Dashboard');
    template.config = config;
  } else {
    template = HtmlService.createTemplateFromFile('Index');
    template.deviceId = (e.parameter && e.parameter.id) ? e.parameter.id : "";
    template.config = config;
    template.staffs = getActiveTechs();
  }
  return template.evaluate().setTitle(config.APP_NAME || "EMS PRO System").setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL).addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function getActiveTechs() {
  try {
    var staffs = getDataSafe(SHEET_STAFF); var techs = [];
    for (var i = 0; i < staffs.length; i++) {
      var s = staffs[i];
      if (String(s['Trang_Thai']).trim().toLowerCase() === 'true' && String(s['Vai_Tro']).trim().toLowerCase() === 'kỹ thuật') {
        var name = String(s['Ho_Ten']).trim(); var shortName = name.split(' ').slice(-2).join(' '); var avatar = fixImgUrl(s['Avatar']);
        if (!avatar) avatar = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name) + '&background=random&color=fff&bold=true';
        techs.push({ name: shortName, avatar: avatar });
      }
    }
    return techs;
  } catch(e) { return []; }
}

// --- 3. XỬ LÝ FRONTEND (GIÁO VIÊN BÁO LỖI) ---
function getDeviceInfo(id) {
  var devices = getDataSafe(SHEET_ASSETS);
  var dev = devices.find(function(d) { return String(d['ID_May']).trim().toLowerCase() == String(id).trim().toLowerCase(); });
  if (dev) return { found: true, name: dev['Ten_May'], room: dev['Phong'] || 'Chưa xác định' };
  return { found: false };
}

function userBaoHong(data) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet(); var sheet = ss.getSheetByName(SHEET_TICKETS);
    var idPhieu = Utilities.getUuid(); var now = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd HH:mm:ss");
    var imgUrl = data.imageData ? uploadImage(data.imageData, data.mimeType) : "";
    sheet.appendRow([idPhieu, now, "", "", data.idMay, data.nguoiBao, data.moTa, "Mới tiếp nhận", "", 0, 0, "", imgUrl, "False", "", "", "", ""]);
    writeTicketProgress(idPhieu, "GV: " + data.nguoiBao, "Báo hỏng thiết bị", data.moTa, imgUrl);
    writeSystemLog("Hệ thống", "Tiếp nhận phiếu mới", "Phiếu: " + idPhieu.substring(0,6) + " - Máy: " + data.idMay);
    triggerOpenClawWebhook(idPhieu, data.moTa, data.idMay, data.nguoiBao);
    return { success: true, msg: "OK" };
  } catch (e) { return { success: false, msg: e.toString() }; }
}

// --- 4. TÍCH HỢP TRỰC TIẾP AI GEMINI ---
function triggerOpenClawWebhook(ticketId, issueDescription, deviceId, reporter) {
  var GEMINI_API_KEY = "AIzaSyBhi5NmAxopm8GsOANHuQ2slGYYZ-mbhlk";
  var url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + GEMINI_API_KEY;
  var prompt = "Bạn là Chuyên gia Kỹ thuật IT Helpdesk. Hãy phân tích lỗi sau:\n- Mã thiết bị: " + deviceId + "\n- Người báo: " + reporter + "\n- Mô tả lỗi: " + issueDescription + "\n\nNHIỆM VỤ BẮT BUỘC: Bạn CHỈ ĐƯỢC trả về một chuỗi JSON hợp lệ, tuyệt đối không có ký tự markdown ```json ở đầu và cuối. Gồm 3 trường sau:\n1. \"aiDiagnosis\": (Chẩn đoán nguyên nhân lỗi ngắn gọn)\n2. \"sentiment\": (Chỉ chọn 1 trong 3 từ: 'Bình thường', 'Khẩn cấp', 'Nghiêm trọng')\n3. \"action\": (Đề xuất cách xử lý cho KTV)";
  var payload = { "contents": [{ "parts": [{"text": prompt}] }], "generationConfig": { "responseMimeType": "application/json" } };
  var options = { "method": "post", "contentType": "application/json", "payload": JSON.stringify(payload), "muteHttpExceptions": true };
  try {
    var response = UrlFetchApp.fetch(url, options); var data = JSON.parse(response.getContentText());
    if (data.error) { writeSystemLog("Hệ thống", "Lỗi API Gemini", data.error.message); return; }
    var textResult = data.candidates[0].content.parts[0].text; var aiData = JSON.parse(textResult);
    var ss = SpreadsheetApp.getActiveSpreadsheet(); var sheet = ss.getSheetByName(SHEET_TICKETS); var rows = sheet.getDataRange().getValues(); var headers = rows[0];
    var colId = headers.indexOf('ID_Phieu'), colDiag = headers.indexOf('AI_Diagnosis'), colSent = headers.indexOf('AI_Sentiment'), colAct = headers.indexOf('AI_Action');
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][colId]).trim() === String(ticketId).trim()) {
        sheet.getRange(i + 1, colDiag + 1).setValue(aiData.aiDiagnosis || "");
        sheet.getRange(i + 1, colSent + 1).setValue(aiData.sentiment || "");
        sheet.getRange(i + 1, colAct + 1).setValue(aiData.action || "");
        writeTicketProgress(ticketId, "🤖 AI Gemini", "Phân tích tự động", "Mức độ: " + (aiData.sentiment || "Bình thường"), "");
        writeSystemLog("Hệ thống", "AI phân tích thành công", "Phiếu: " + ticketId.substring(0,6));
        break;
      }
    }
  } catch (e) { writeSystemLog("Hệ thống", "Lỗi AI Gemini", e.toString()); }
}

// --- 5. ADMIN DASHBOARD LÕI ---
function getAppConfig() {
  var config = { APP_NAME: "EMS PRO", COMPANY_NAME: "QUẢN LÝ SỰ CỐ", PRIMARY_COLOR: "#0d6efd", LOGO_URL: "", CONTACT_INFO: "Hotline: Chưa cập nhật" };
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_CONFIG);
    if (sheet) {
      var data = sheet.getDataRange().getValues();
      for (var i = 0; i < data.length; i++) {
        var key = String(data[i][0] || "").trim().toUpperCase(); var value = String(data[i][1] || "").trim();
        if (key) config[key] = value;
      }
    }
  } catch(e) {}
  return config;
}

function getDataSafe(sheetName) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet(); var sheet = ss.getSheetByName(sheetName);
    if (!sheet) { var all = ss.getSheets(); for(var k=0; k<all.length; k++) if(all[k].getName().trim() == sheetName) { sheet = all[k]; break; } }
    if (!sheet) return []; var data = sheet.getDataRange().getValues(); if (data.length < 2) return [];
    var headers = data[0].map(function(h){return String(h).trim()}); var res = [];
    for (var i = 1; i < data.length; i++) {
      var row = data[i]; var obj = {};
      for (var j = 0; j < headers.length; j++) obj[headers[j]] = (row[j]===undefined)?"":row[j];
      res.push(obj);
    }
    return res;
  } catch(e) { return []; }
}

function loginSystem(email, password) {
  if (password === SYSTEM_PASSWORD) {
     writeSystemLog(email, "Đăng nhập", "Role: SuperAdmin");
     return { success: true, user: { name: "Admin System", role: "SuperAdmin", email: email, avatar: "" } };
  }
  var staff = getDataSafe(SHEET_STAFF);
  var user = staff.find(function(u) { return String(u['Email']).trim().toLowerCase() == String(email).trim().toLowerCase(); });
  if (!user) return { success: false, msg: "Email không tồn tại!" };
  if (String(user['Mat_Khau']) == String(password)) {
     if (String(user['Trang_Thai']).toLowerCase() == 'false') return { success: false, msg: "Tài khoản bị khóa!" };
     writeSystemLog(user['Ho_Ten'], "Đăng nhập", "Thành công");
     return { success: true, user: { name: user['Ho_Ten'], role: user['Vai_Tro'], email: user['Email'], avatar: fixImgUrl(user['Avatar']) } };
  }
  return { success: false, msg: "Sai mật khẩu!" };
}

function getDashboardStats(password, email) {
  var res = { kanban: {todo:[], doing:[], done:[]}, kpi: {total:0, cost:0}, chart: {dates:[], counts:[], costType:[0,0], topDevice:{labels:[],data:[]}, topRoom:{labels:[],data:[]}} };
  var tickets = getDataSafe(SHEET_TICKETS); var devices = getDataSafe(SHEET_ASSETS); var devMap = {};
  devices.forEach(function(d){ devMap[d['ID_May']] = { name: d['Ten_May'], room: d['Phong']||"Kho" }; });
  var dateMap={}, devCount={}, roomCount={};
  tickets.forEach(function(t) {
    var st = String(t['Trang_Thai']).trim(); var cp = (parseFloat(t['CP_Linh_Kien'])||0) + (parseFloat(t['CP_Nhan_Cong'])||0); var dInfo = devMap[t['ID_May']] || { name: t['ID_May'], room: "Khác" };
    var item = { id: t['ID_Phieu'], ticketId: t['ID_Phieu'], date: Utilities.formatDate(parseSmartDate(t['Ngay_Bao']), "GMT+7", "HH:mm dd/MM"), devName: dInfo.name, room: dInfo.room, desc: t['Mo_Ta_Loi'], reporter: t['Nguoi_Bao'], ktv: t['Ky_Thuat_Vien'], status: st, cost: cp, img: fixImgUrl(t['Anh_Su_Co']), aiDiag: t['AI_Diagnosis'] || '', aiSent: t['AI_Sentiment'] || '', aiAct: t['AI_Action'] || '', materials: (t['Ma_VT'] && String(t['Ma_VT']).startsWith('[')) ? JSON.parse(t['Ma_VT']) : [] };
    if(st.includes("Mới") || st.includes("Chờ")) res.kanban.todo.push(item);
    else if(st.includes("Đang") || st.includes("Kiểm")) res.kanban.doing.push(item);
    else res.kanban.done.push(item);
    res.kpi.total++; res.kpi.cost += cp; res.chart.costType[0] += (parseFloat(t['CP_Linh_Kien'])||0); res.chart.costType[1] += (parseFloat(t['CP_Nhan_Cong'])||0);
    var dStr = Utilities.formatDate(parseSmartDate(t['Ngay_Bao']), "GMT+7", "dd/MM"); dateMap[dStr] = (dateMap[dStr]||0)+1; devCount[dInfo.name] = (devCount[dInfo.name]||0)+1; roomCount[dInfo.room] = (roomCount[dInfo.room]||0)+1;
  });
  res.chart.dates = Object.keys(dateMap).sort().slice(-7); res.chart.counts = res.chart.dates.map(function(k){return dateMap[k]});
  res.kanban.todo.reverse(); res.kanban.doing.reverse(); res.kanban.done = res.kanban.done.slice(-20).reverse();
  res.chart.topDevice = getTopItems(devCount, 5); res.chart.topRoom = getTopItems(roomCount, 5);
  return res;
}

function getTableData(type, pwd, email) {
  if (type == 'ticket') return getDataSafe(SHEET_TICKETS).reverse().slice(0,100).map(function(r){ return { id: r['ID_Phieu'], dateRaw: String(r['Ngay_Bao']), date: Utilities.formatDate(parseSmartDate(r['Ngay_Bao']),"GMT+7","dd/MM HH:mm"), dev: r['ID_May'], reporter: r['Nguoi_Bao'], err: r['Mo_Ta_Loi'], status: r['Trang_Thai'], cost: (parseFloat(r['CP_Linh_Kien'])||0)+(parseFloat(r['CP_Nhan_Cong'])||0), img: fixImgUrl(r['Anh_Su_Co']), aiSent: r['AI_Sentiment'] || '' , materials: (r['Ma_VT'] && String(r['Ma_VT']).startsWith('[')) ? JSON.parse(r['Ma_VT']) : [] } });
  if (type == 'device') return getDataSafe(SHEET_ASSETS).map(function(r){ return { id: r['ID_May'], name: r['Ten_May'], model: r['Model_Serial'], room: r['Phong'], status: r['Trang_Thai'], img: fixImgUrl(r['Hinh_Anh']) }});
  if (type == 'staff') return getDataSafe(SHEET_STAFF).map(function(r){ return { id: r['ID_User'], name: r['Ho_Ten'], email: r['Email'], role: r['Vai_Tro'], phone: r['SĐT'], img: fixImgUrl(r['Avatar']), active: r['Trang_Thai'] }});
  if (type == 'material') return getDataSafe("5_KhoVatTu").map(function(r){ return { id: r['Ma_VT'], name: r['Ten_Vat_Tu'], unit: r['Don_Vi'], stock: r['Ton_Kho'], priceIn: r['Gia_Nhap'], priceOut: r['Gia_Xuat'] }});
  if (type == 'log') { var logs = getDataSafe(SHEET_TICKET_LOG); return logs.reverse().slice(0,150).map(function(r) { var t = r['Thoi_Gian'] || new Date(); var timeStr = "-"; try { timeStr = Utilities.formatDate(parseSmartDate(t),"GMT+7","dd/MM HH:mm"); } catch(e){} return { time: timeStr, user: String(r['Nguoi_XL'] || 'Hệ thống'), action: String(r['Hanh_Dong_Chi_Tiet'] || '-'), detail: String(r['Ket_Qua'] || '') }; }); }
  return [];
}

function createNewDevice(d) { try { var s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_ASSETS); var u = d.imgData ? uploadImage(d.imgData, d.mimeType) : ""; s.appendRow([d.id, d.name, d.model, "", d.room, d.date, "", "", "Hoạt động", "6 tháng", u, d.id]); writeSystemLog("Admin", "Thêm thiết bị mới", "Mã: " + d.id + " | Tên: " + d.name); return { success: true }; } catch (e) { return { success: false, msg: e.toString() } } }
function createNewStaff(d) { try { var s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_STAFF); var u = d.imgData ? uploadImage(d.imgData, d.mimeType) : ""; s.appendRow([d.id, d.email, "123456", d.name, d.role, d.phone, "", u, d.active]); writeSystemLog("Admin", "Thêm nhân sự", "Email: " + d.email + " | Quyền: " + d.role); return { success: true }; } catch (e) { return { success: false, msg: e.toString() } } }
function createNewMaterial(d) { try { var s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("5_KhoVatTu"); if (!s) return { success: false, msg: "Lỗi cấu trúc kho" }; s.appendRow([d.id, d.name, d.unit, d.stock, d.priceIn, d.priceOut]); writeSystemLog("Admin", "Nhập vật tư", "Mã: " + d.id + " | Tên: " + d.name + " | Số lượng: " + d.stock); return { success: true }; } catch (e) { return { success: false, msg: e.toString() }; } }
function getAllStaff() { return getDataSafe(SHEET_STAFF).map(function(s){return { id: s['Ho_Ten'], name: s['Ho_Ten'] }}); }

function updateTicketStatus(data, pwd, email) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet(); var s = ss.getSheetByName(SHEET_TICKETS); var rows = s.getDataRange().getValues(); var headers = rows[0], colMap = {}; headers.forEach(function(h,i){ colMap[String(h).trim()] = i+1; });
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][colMap['ID_Phieu']-1]) == data.id) {
        var r = i + 1;
        if (colMap['Trang_Thai']) s.getRange(r, colMap['Trang_Thai']).setValue(data.status);
        if (colMap['Ky_Thuat_Vien']) s.getRange(r, colMap['Ky_Thuat_Vien']).setValue(data.techId);
        if (colMap['CP_Linh_Kien']) s.getRange(r, colMap['CP_Linh_Kien']).setValue(data.costLK);
        if (colMap['CP_Nhan_Cong']) s.getRange(r, colMap['CP_Nhan_Cong']).setValue(data.costNC);
        if (colMap['Ma_VT']) s.getRange(r, colMap['Ma_VT']).setValue(JSON.stringify(data.materials || []));
        var logDetail = "Trạng thái: " + data.status + ". KTV: " + data.techId + ". ";
        if (data.materials && data.materials.length > 0) { logDetail += "Dùng linh kiện: "; var matSheet = ss.getSheetByName("5_KhoVatTu"); if (matSheet) { var mData = matSheet.getDataRange().getValues(); for (var k = 0; k < data.materials.length; k++) { var usedItem = data.materials[k]; logDetail += usedItem.name + " (x" + usedItem.qty + "), "; for (var m = 1; m < mData.length; m++) { if (String(mData[m][0]).trim() == usedItem.id) { var oldStock = parseFloat(mData[m][3]) || 0; var newStock = oldStock - usedItem.qty; matSheet.getRange(m + 1, 4).setValue(newStock); break; } } } } }
        writeTicketProgress(data.id, email, "Cập nhật phiếu", logDetail, ""); writeSystemLog(email, "Cập nhật phiếu: " + data.id.substring(0,6), "Trạng thái: " + data.status);
        return {success:true};
      }
    }
    return {success:false, msg:"Không tìm thấy phiếu"};
  } catch(e){ return {success:false, msg:e.toString()} }
}

// --- 6. HELPER FUNCTIONS CHUYÊN DỤNG (ÉP LINK DRIVE SANG HIỂN THỊ TRỰC TIẾP) ---
function fixImgUrl(u) {
  if (!u) return ""; var str = String(u).trim();
  if (str.includes("drive.google.com")) {
    var matchId = str.match(/[-\w]{25,}/);
    // Thay cấu trúc thumbnail bằng máy chủ kết xuất hình ảnh trực tiếp không bị chặn cookie
    if (matchId && matchId[0]) return "[https://drive.google.com/uc?id=](https://drive.google.com/uc?id=)" + matchId[0];
  }
  return str;
}

function uploadImage(b,m) {
  try {
    var f = DriveApp.getFolderById(FOLDER_IMG_ID); var r = f.createFile(Utilities.newBlob(Utilities.base64Decode(b), m, Utilities.getUuid()));
    r.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return "[https://drive.google.com/uc?id=](https://drive.google.com/uc?id=)" + r.getId();
  } catch(e) { return ""; }
}

function parseSmartDate(i) {
  if(!i) return new Date(); if(i instanceof Date) return i;
  var p=String(i).split(/[- :]/); if(p.length>=6) return new Date(p[0],p[1]-1,p[2],p[3],p[4],p[5]);
  return new Date(i);
}

function getTopItems(o,l) {
  var i=Object.keys(o).map(function(k){return[k,o[k]]}); i.sort(function(a,b){return b[1]-a[1]});
  return {labels:i.slice(0,l).map(function(x){return x[0]}), data:i.slice(0,l).map(function(x){return x[1]})};
}

// --- 7. API ENDPOINT TIẾP NHẬN WEBHOOK HOÀN CHỈNH ---
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) return ContentService.createTextOutput("Không có dữ liệu").setMimeType(ContentService.MimeType.TEXT);
    var data = JSON.parse(e.postData.contents);
    if (data.action === "login") return ContentService.createTextOutput(JSON.stringify({success: true, data: loginSystem(data.email, data.password)})).setMimeType(ContentService.MimeType.JSON);
    if (data.action === "getDashboard") return ContentService.createTextOutput(JSON.stringify({success: true, data: getDashboardStats(data.password, data.email)})).setMimeType(ContentService.MimeType.JSON);
    if (data.action === "userBaoHong") return ContentService.createTextOutput(JSON.stringify({success: true, data: userBaoHong(data.data)})).setMimeType(ContentService.MimeType.JSON);
    if (data.action === "updateTicket") return ContentService.createTextOutput(JSON.stringify({success: true, data: updateTicketStatus(data.data, data.password, data.email)})).setMimeType(ContentService.MimeType.JSON);
    if (data.action === "auto_ticket") {
      var ss = SpreadsheetApp.getActiveSpreadsheet(); var sheet = ss.getSheetByName(SHEET_TICKETS);
      var idPhieu = Utilities.getUuid(); var now = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd HH:mm:ss"); var reporter = "Hệ thống NOC";
      sheet.appendRow([idPhieu, now, "", "", data.id, reporter, data.issue, "Mới tiếp nhận", "", 0, 0, "", "", "False", "", "", "", ""]);
      writeTicketProgress(idPhieu, "🤖 NOC Auto", "Cảnh báo tự động", data.issue, "");
      writeSystemLog("Hệ thống", "Tiếp nhận cảnh báo NOC", "Phiếu: " + idPhieu.substring(0,6) + " - Máy: " + data.id);
      triggerOpenClawWebhook(idPhieu, data.issue, data.id, reporter);
      return ContentService.createTextOutput(JSON.stringify({success: true, ticketId: idPhieu})).setMimeType(ContentService.MimeType.JSON);
    }
    return ContentService.createTextOutput(JSON.stringify({success: false, msg: "Sai mã lệnh action"})).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    writeSystemLog("Hệ thống", "Lỗi Webhook NOC", error.toString());
    return ContentService.createTextOutput(JSON.stringify({success: false, error: error.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}