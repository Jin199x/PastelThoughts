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

// ====== Profile Picture Upload to ImgBB ======
const uploadPic = document.getElementById("uploadPic");
const cropCanvas = document.getElementById("cropCanvas");
const applyCropBtn = document.getElementById("applyCropBtn");
const profilePic = document.getElementById("profilePic");
const ctx = cropCanvas.getContext("2d");

let img = new Image();
let isDragging = false;
let startX = 0, startY = 0;
let cropRect = { x: 0, y: 0, width: 0, height: 0 };

// Replace with your ImgBB API key
const imgbbApiKey = "7ca937bbce3d1c452e27b7b18d04a451";

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

// ===== Dragging logic =====
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
function startDrag(e){ isDragging=true; const pos=getPos(e); startX=pos.x; startY=pos.y; }
function drag(e){ 
  if(!isDragging) return;
  const pos=getPos(e);
  cropRect.x=Math.min(startX,pos.x);
  cropRect.y=Math.min(startY,pos.y);
  cropRect.width=Math.abs(pos.x-startX);
  cropRect.height=Math.abs(pos.y-startY);
  ctx.clearRect(0,0,cropCanvas.width,cropCanvas.height);
  ctx.drawImage(img,0,0,cropCanvas.width,cropCanvas.height);
  ctx.strokeStyle="#d94f87";
  ctx.lineWidth=2;
  ctx.strokeRect(cropRect.x,cropRect.y,cropRect.width,cropRect.height);
}
function endDrag(){ isDragging=false; }

cropCanvas.addEventListener("mousedown", startDrag);
cropCanvas.addEventListener("mousemove", drag);
cropCanvas.addEventListener("mouseup", endDrag);
cropCanvas.addEventListener("mouseleave", endDrag);
cropCanvas.addEventListener("touchstart", startDrag);
cropCanvas.addEventListener("touchmove", drag);
cropCanvas.addEventListener("touchend", endDrag);

// ===== Apply crop & upload to ImgBB + save URL to Firestore =====
applyCropBtn.addEventListener("click", async () => {
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

  // Convert to base64
  const base64Image = tempCanvas.toDataURL().split(",")[1];

  try {
    // Upload to ImgBB
    const form = new FormData();
    form.append("image", base64Image);

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbApiKey}`, {
      method: "POST",
      body: form
    });

    const data = await response.json();
    if (data.success) {
      const imageUrl = data.data.url;

      // Update the profile pic on page
      profilePic.src = imageUrl;

      // Save the URL to Firestore for the current user
      const userDocRef = doc(db, "users", currentUser.uid);
      await setDoc(userDocRef, { profilePic: imageUrl }, { merge: true });

      alert("Profile picture updated successfully!");
    } else {
      console.error(data);
      alert("Failed to upload image.");
    }

  } catch (err) {
    console.error(err);
    alert("Error uploading image.");
  }

  cropCanvas.style.display = "none";
  applyCropBtn.style.display = "none";
  uploadPic.value = "";
});

// ===== Export Entries Section =====
const exportList = document.getElementById('exportList');
const searchExport = document.getElementById('searchExport');
const toggleSelectBtn = document.getElementById('toggleSelectBtn');
const exportBtn = document.getElementById('exportBtn');

let allSelected = false; // toggle state

// Fetch user entries from Firestore and render
async function renderExportList() {
  exportList.innerHTML = '';

  try {
    const userDocRef = doc(db, "users", currentUser.uid);
    const userSnap = await getDoc(userDocRef);
    if (!userSnap.exists()) return;

    const userData = userSnap.data();
    const userEntries = userData.entries || {}; // ensure entries exist

    Object.keys(userEntries).forEach(key => {
      const div = document.createElement('div');
      div.style.marginBottom = '6px';
      div.innerHTML = `
        <label style="color:#d94f87;">
          <input type="checkbox" class="exportCheck" data-key="${key}">
          ${key} - ${userEntries[key].substring(0, 40)}${userEntries[key].length > 40 ? '...' : ''}
        </label>
      `;
      exportList.appendChild(div);
    });
  } catch (err) {
    console.error("Failed to fetch entries for export:", err);
  }
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
exportBtn.addEventListener('click', async () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let yOffset = 20;

  // Fetch latest entries before export
  const userDocRef = doc(db, "users", currentUser.uid);
  const userSnap = await getDoc(userDocRef);
  if (!userSnap.exists()) return alert("No entries found to export.");
  const userEntries = userSnap.data().entries || {};

  const checkedEntries = document.querySelectorAll('.exportCheck:checked');
  if (checkedEntries.length === 0) {
    alert('Please select at least one entry to export.');
    return;
  }

  checkedEntries.forEach(checkbox => {
    const key = checkbox.dataset.key;
    if (userEntries[key]) {
      doc.setFontSize(14);
      doc.setTextColor(200, 50, 135); // pink for date
      doc.text(key, 20, yOffset);
      yOffset += 8;

      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      const splitText = doc.splitTextToSize(userEntries[key], 170);
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


