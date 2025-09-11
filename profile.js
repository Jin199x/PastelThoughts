// ===== Theme Selector Logic =====
const themeButtons = document.querySelectorAll(".theme-btn");
const body = document.body;

themeButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const selectedTheme = btn.dataset.theme;
    body.classList.remove("theme-pink", "theme-blue", "theme-dark", "theme-lavender");
    body.classList.add(selectedTheme);
  });
});

// ====== Profile Picture Upload ======
// ====== Profile Picture Crop ======
const uploadPic = document.getElementById("uploadPic");
const cropCanvas = document.getElementById("cropCanvas");
const applyCropBtn = document.getElementById("applyCropBtn");
const ctx = cropCanvas.getContext("2d");

let img = new Image();
let isDragging = false;
let startX = 0, startY = 0;
let cropRect = { x: 0, y: 0, width: 0, height: 0 };

// Handle image upload
uploadPic.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (evt) => {
    img.src = evt.target.result;
  };
  reader.readAsDataURL(file);
});

img.onload = () => {
  cropCanvas.width = Math.min(img.width, 300);
  cropCanvas.height = Math.min(img.height, 300);
  cropCanvas.style.display = "block";
  applyCropBtn.style.display = "inline-block";
  ctx.drawImage(img, 0, 0, cropCanvas.width, cropCanvas.height);
};

// Helper to get mouse/touch coordinates relative to canvas
function getPos(e) {
  const rect = cropCanvas.getBoundingClientRect();
  let x, y;
  if (e.touches) {
    x = e.touches[0].clientX - rect.left;
    y = e.touches[0].clientY - rect.top;
  } else {
    x = e.clientX - rect.left;
    y = e.clientY - rect.top;
  }
  return { x, y };
}

// Start dragging
function startDrag(e) {
  isDragging = true;
  const pos = getPos(e);
  startX = pos.x;
  startY = pos.y;
}

// Dragging
function drag(e) {
  if (!isDragging) return;
  const pos = getPos(e);
  cropRect.x = Math.min(startX, pos.x);
  cropRect.y = Math.min(startY, pos.y);
  cropRect.width = Math.abs(pos.x - startX);
  cropRect.height = Math.abs(pos.y - startY);
  // redraw
  ctx.clearRect(0, 0, cropCanvas.width, cropCanvas.height);
  ctx.drawImage(img, 0, 0, cropCanvas.width, cropCanvas.height);
  // overlay crop rectangle
  ctx.strokeStyle = "#d94f87";
  ctx.lineWidth = 2;
  ctx.strokeRect(cropRect.x, cropRect.y, cropRect.width, cropRect.height);
}

// End dragging
function endDrag() {
  isDragging = false;
}

// Apply crop
applyCropBtn.addEventListener("click", () => {
  if (!cropRect.width || !cropRect.height) return;
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = cropRect.width;
  tempCanvas.height = cropRect.height;
  const tCtx = tempCanvas.getContext("2d");
  tCtx.drawImage(
    cropCanvas,
    cropRect.x, cropRect.y, cropRect.width, cropRect.height,
    0, 0, cropRect.width, cropRect.height
  );
  // set cropped image as profile picture
  document.getElementById("profilePic").src = tempCanvas.toDataURL();
  cropCanvas.style.display = "none";
  applyCropBtn.style.display = "none";
  uploadPic.value = "";
});

// ======= Event listeners for desktop & mobile =======
cropCanvas.addEventListener("mousedown", startDrag);
cropCanvas.addEventListener("mousemove", drag);
cropCanvas.addEventListener("mouseup", endDrag);
cropCanvas.addEventListener("mouseleave", endDrag);

cropCanvas.addEventListener("touchstart", startDrag);
cropCanvas.addEventListener("touchmove", drag);
cropCanvas.addEventListener("touchend", endDrag);

// ===== Export Entries Section =====
const exportList = document.getElementById('exportList');
const searchExport = document.getElementById('searchExport');
const toggleSelectBtn = document.getElementById('toggleSelectBtn');
const exportBtn = document.getElementById('exportBtn');

let allSelected = false; // toggle state

function renderExportList() {
  exportList.innerHTML = '';
  Object.keys(entries).forEach(key => {
    const div = document.createElement('div');
    div.style.marginBottom = '6px';
    div.innerHTML = `
      <label style="color:#d94f87;">
        <input type="checkbox" class="exportCheck" data-key="${key}">
        ${key} - ${entries[key].substring(0, 40)}${entries[key].length > 40 ? '...' : ''}
      </label>
    `;
    exportList.appendChild(div);
  });
}

// Initial render
renderExportList();

// Search/filter functionality
searchExport.addEventListener('input', () => {
  const query = searchExport.value.toLowerCase();
  document.querySelectorAll('#exportList div').forEach(div => {
    div.style.display = div.textContent.toLowerCase().includes(query) ? 'block' : 'none';
  });
});

// Toggle Select All / Deselect All
toggleSelectBtn.addEventListener('click', () => {
  allSelected = !allSelected;
  document.querySelectorAll('.exportCheck').forEach(cb => cb.checked = allSelected);
  toggleSelectBtn.textContent = allSelected ? 'Deselect All' : 'Select All';
});

// Export to PDF
exportBtn.addEventListener('click', () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let yOffset = 20;

  const checkedEntries = document.querySelectorAll('.exportCheck:checked');
  if (checkedEntries.length === 0) {
    alert('Please select at least one entry to export.');
    return;
  }

  checkedEntries.forEach(checkbox => {
    const key = checkbox.dataset.key;
    if (entries[key]) {
      doc.setFontSize(14);
      doc.setTextColor(200, 50, 135); // pink for date
      doc.text(key, 20, yOffset);
      yOffset += 8;

      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      const splitText = doc.splitTextToSize(entries[key], 170);
      doc.text(splitText, 20, yOffset);
      yOffset += splitText.length * 7 + 10;

      if (yOffset > 280) {
        doc.addPage();
        yOffset = 20;
      }
    }
  });

  doc.save('PastelThoughtsDiary.pdf');
});


