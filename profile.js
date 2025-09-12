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

// ===== DOM Elements =====
const profilePic = document.getElementById("profilePic");
const uploadPic = document.getElementById("uploadPic");
const cropCanvas = document.getElementById("cropCanvas");
const applyCropBtn = document.getElementById("applyCropBtn");
const ctx = cropCanvas.getContext("2d");

const profileNameInput = document.getElementById("profileName");
const profileEmail = document.getElementById("profileEmail");
const saveNameBtn = document.getElementById("saveNameBtn");

const streakCountEl = document.getElementById("streakCount");
const totalEntriesEl = document.getElementById("totalEntries");

const exportList = document.getElementById('exportList');
const searchExport = document.getElementById('searchExport');
const toggleSelectBtn = document.getElementById('toggleSelectBtn');
const exportBtn = document.getElementById('exportBtn');

let img = new Image();
let isDragging = false;
let startX = 0, startY = 0;
let cropRect = { x: 0, y: 0, width: 0, height: 0 };
let allSelected = false;

// ===== Firebase Auth Listener =====
onAuthStateChanged(auth, async (user) => {
  if (!user) return window.location.href = 'index.html';
  currentUser = user;

  // Load entries from diary.js
  await loadEntries();

  // Load profile data
  await loadProfilePic();
  await loadUserInfo();

  // Render stats and export list
  refreshProfileStats();
  renderExportList();
});

// ===== Load Profile Picture =====
async function loadProfilePic() {
  try {
    const userDocRef = doc(db, "users", currentUser.uid);
    const userSnap = await getDoc(userDocRef);
    if (!userSnap.exists()) return;
    const userData = userSnap.data();
    if (userData.profilePic) profilePic.src = userData.profilePic;
  } catch (err) {
    console.error("Failed to load profile picture:", err);
  }
}

// ===== Upload & Crop Image =====
uploadPic.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (evt) => img.src = evt.target.result;
  reader.readAsDataURL(file);
});

img.onload = () => {
  cropCanvas.width = Math.min(img.width, 300);
  cropCanvas.height = Math.min(img.height, 300);
  cropCanvas.style.display = "block";
  applyCropBtn.style.display = "inline-block";
  ctx.drawImage(img, 0, 0, cropCanvas.width, cropCanvas.height);
};

function getPos(e) {
  const rect = cropCanvas.getBoundingClientRect();
  let x = e.touches ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
  let y = e.touches ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
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

  const base64Image = tempCanvas.toDataURL().split(",")[1];
  try {
    const form = new FormData();
    form.append("image", base64Image);
    const response = await fetch(`https://api.imgbb.com/1/upload?key=7ca937bbce3d1c452e27b7b18d04a451`, { method: "POST", body: form });
    const data = await response.json();
    if (data.success) {
      const imageUrl = data.data.url;
      profilePic.src = imageUrl;
      const userDocRef = doc(db, "users", currentUser.uid);
      await setDoc(userDocRef, { profilePic: imageUrl }, { merge: true });
      await loadProfilePic();
      alert("Profile picture updated successfully!");
    } else alert("Failed to upload image.");
  } catch (err) {
    console.error(err);
    alert("Error uploading image.");
  }

  cropCanvas.style.display = "none";
  applyCropBtn.style.display = "none";
  uploadPic.value = "";
});

// ===== User Info =====
async function loadUserInfo() {
  profileEmail.textContent = currentUser.email;
  const userDocRef = doc(db, "users", currentUser.uid);
  const userSnap = await getDoc(userDocRef);
  if (userSnap.exists()) {
    const userData = userSnap.data();
    profileNameInput.value = userData.name || "";
  }
}

saveNameBtn.addEventListener("click", async () => {
  const newName = profileNameInput.value.trim();
  if (!newName) return alert("Name cannot be empty!");
  const userDocRef = doc(db, "users", currentUser.uid);
  await setDoc(userDocRef, { name: newName }, { merge: true });
  alert("Name updated successfully!");
});

// ===== Stats =====
function updateStats() {
  const entryDates = Object.keys(entries).sort((a, b) => new Date(b) - new Date(a));
  const today = new Date();
  let streak = 0;
  if (entryDates.length > 0) {
    let prevDate = new Date(entryDates[0]);
    for (let i = 0; i < entryDates.length; i++) {
      const entryDate = new Date(entryDates[i]);
      const diff = Math.floor((prevDate - entryDate) / (1000 * 60 * 60 * 24));
      if (i === 0 && (today.toDateString() === entryDate.toDateString() || diff === 1)) streak++;
      else if (diff === 1) streak++;
      else break;
      prevDate = entryDate;
    }
  }
  streakCountEl.textContent = streak;
  totalEntriesEl.textContent = entryDates.length;
}
function refreshProfileStats() { updateStats(); }

// ===== Export Entries =====
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
  refreshProfileStats();
}

searchExport.addEventListener('input', () => {
  const query = searchExport.value.toLowerCase();
  document.querySelectorAll('#exportList div').forEach(div => {
    div.style.display = div.textContent.toLowerCase().includes(query) ? 'block' : 'none';
  });
});

toggleSelectBtn.addEventListener('click', () => {
  allSelected = !allSelected;
  document.querySelectorAll('.exportCheck').forEach(cb => cb.checked = allSelected);
  toggleSelectBtn.textContent = allSelected ? 'Deselect All' : 'Select All';
});

exportBtn.addEventListener('click', async () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let yOffset = 20;
  const checkedEntries = document.querySelectorAll('.exportCheck:checked');
  if (checkedEntries.length === 0) return alert('Please select at least one entry.');

  checkedEntries.forEach(cb => {
    const key = cb.dataset.key;
    doc.setFontSize(14);
    doc.setTextColor(200, 50, 135);
    doc.text(key, 20, yOffset);
    yOffset += 8;

    doc.setFontSize(12);
    doc.setTextColor(0,0,0);
    const splitText = doc.splitTextToSize(entries[key], 170);
    doc.text(splitText, 20, yOffset);
    yOffset += splitText.length * 7 + 10;

    if (yOffset > 280) {
      doc.addPage();
      yOffset = 20;
    }
  });

  doc.save('PastelThoughtsDiary.pdf');
});
