/**
 * 🎯 JAVASCRIPT LOGIC - FRONTEND
 * Toàn bộ logic form, upload, submit
 */

let timeout = null;
let compressedImg = { data: null, type: null };
let devicesCache = [];

// =====================================
// 📍 PAGE LOAD - KHỞI TẠO
// =====================================

window.addEventListener('DOMContentLoaded', function() {
  // Lấy Device ID từ URL (nếu quét QR)
  const urlParams = new URLSearchParams(window.location.search);
  const deviceIdFromUrl = urlParams.get('id');
  
  if (deviceIdFromUrl) {
    document.getElementById('idMay').value = deviceIdFromUrl;
    checkDevice(deviceIdFromUrl);
  }

  // Load staffs
  loadStaffTeam();
});

// =====================================
// 👥 LOAD STAFF TEAM
// =====================================

async function loadStaffTeam() {
  try {
    const staffs = await fetchStaffs();
    
    if (staffs && staffs.length > 0) {
      let teamHTML = `
        <div class="team-box">
          <div class="team-title">Đội ngũ kỹ thuật trực ban</div>
          <div class="team-list">
      `;
      
      for (let staff of staffs) {
        teamHTML += `
          <div class="tech-item">
            <img src="${staff['Avatar URL']}" alt="${staff['Staff Name']}">
            <div>${staff['Staff Name']}</div>
          </div>
        `;
      }
      
      teamHTML += `
          </div>
        </div>
      `;
      
      document.getElementById('teamBoxContainer').innerHTML = teamHTML;
    }
  } catch (error) {
    console.error('❌ Lỗi load staff:', error);
  }
}

// =====================================
// ✏️ QUICK ACTION - THÊM TEXT
// =====================================

function addText(text) {
  const ta = document.getElementById('moTa');
  if (ta.value) {
    ta.value += ', ' + text;
  } else {
    ta.value = text;
  }
  
  // Highlight ô text
  ta.style.backgroundColor = '#e0f2fe';
  setTimeout(() => {
    ta.style.backgroundColor = '#f8fafc';
  }, 300);
}

// =====================================
// 🔍 CHECK DEVICE DELAY
// =====================================

function checkDeviceDelay(id) {
  clearTimeout(timeout);
  timeout = setTimeout(() => checkDevice(id), 400);
}

// =====================================
// ✅ CHECK DEVICE
// =====================================

async function checkDevice(id) {
  const card = document.getElementById('devCard');
  const status = document.getElementById('checkStatus');
  
  if (!id.trim()) {
    card.style.display = 'none';
    status.innerText = '';
    return;
  }
  
  status.innerText = '⏳ Đang kiểm tra...';
  
  try {
    const result = await getDeviceInfo(id);
    
    if (result.found) {
      card.style.display = 'block';
      document.getElementById('infoName').innerText = result.name;
      document.getElementById('infoRoom').innerText = '📍 ' + result.room;
      status.innerHTML = '<span style="color:var(--success)">✓ Hợp lệ</span>';
    } else {
      card.style.display = 'none';
      status.innerHTML = '<span style="color:#efd044">⚠ Mã máy không tồn tại. Bạn vẫn muốn tiếp tục ghi và gửi</span>';
    }
  } catch (error) {
    console.error('❌ Lỗi check device:', error);
    card.style.display = 'none';
    status.innerHTML = '<span style="color:#ef4444">❌ Lỗi kết nối</span>';
  }
}

// =====================================
// 🖼️ HANDLE FILE SELECT
// =====================================

function handleFileSelect(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = function(evt) {
    const img = new Image();
    img.src = evt.target.result;
    
    img.onload = function() {
      const canvas = document.createElement('canvas');
      let w = img.width, h = img.height;
      const MAX = 800;
      
      // Resize ảnh nếu quá lớn
      if (w > h) {
        if (w > MAX) {
          h *= MAX / w;
          w = MAX;
        }
      } else {
        if (h > MAX) {
          w *= MAX / h;
          h = MAX;
        }
      }
      
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      
      // Nén thành JPEG
      const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
      document.getElementById('previewImg').src = dataUrl;
      document.getElementById('previewImg').style.display = 'block';
      document.getElementById('uploadPlaceholder').style.display = 'none';
      compressedImg = {
        data: dataUrl.split(',')[1],
        type: 'image/jpeg'
      };
    };
  };
}

// =====================================
// 🔄 RESET FORM
// =====================================

function handleResetForm() {
  document.getElementById('issueForm').reset();
  document.getElementById('previewImg').style.display = 'none';
  document.getElementById('uploadPlaceholder').style.display = 'block';
  compressedImg = { data: null, type: null };
  
  const btn = document.getElementById('btnSend');
  btn.disabled = false;
  btn.innerText = 'GỬI YÊU CẦU NGAY';
  
  document.getElementById('devCard').style.display = 'none';
  document.getElementById('checkStatus').innerText = '';
  document.getElementById('successScreen').style.display = 'none';
  document.getElementById('formScreen').style.display = 'block';
  window.scrollTo(0, 0);
}

// =====================================
// 📨 HANDLE SUBMIT
// =====================================

async function handleSubmit(e) {
  e.preventDefault();
  
  const btn = document.getElementById('btnSend');
  btn.disabled = true;
  btn.innerText = '⏳ ĐANG GỬI DỮ LIỆU...';
  
  const data = {
    idMay: document.getElementById('idMay').value,
    nguoiBao: document.getElementById('nguoiBao').value,
    moTa: document.getElementById('moTa').value,
    imageData: compressedImg.data,
    mimeType: compressedImg.type
  };
  
  try {
    const result = await saveReport(data);
    
    if (result.success) {
      document.getElementById('formScreen').style.display = 'none';
      document.getElementById('successScreen').style.display = 'block';
      window.scrollTo(0, 0);
    } else {
      alert('Lỗi: ' + result.msg);
      btn.disabled = false;
      btn.innerText = 'GỬI LẠI';
    }
  } catch (error) {
    console.error('❌ Lỗi submit:', error);
    alert('Lỗi mạng! Vui lòng thử lại.');
    btn.disabled = false;
    btn.innerText = 'GỬI LẠI';
  }
}
