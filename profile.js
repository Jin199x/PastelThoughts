// ====== Firebase Setup ======
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { 
  getFirestore, doc, getDoc, setDoc,
  collection, query, orderBy, getDocs, // 👈 FIXED missing comma
  onSnapshot
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC9M9No4HNitBiiqvXxGMYQSQJ0TNhKxR0",
  authDomain: "pastelthoughts-19dd4.firebaseapp.com",
  projectId: "pastelthoughts-19dd4",
  messagingSenderId: "578642737437",
  appId: "pastelthoughts-19dd4.web.app" // 👈 replace with real appId from Firebase console
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ====== DOM Elements ======
const exportList = document.getElementById("exportList");
const profilePic = document.getElementById("profilePic");
const uploadPic = document.getElementById("uploadPic");
const cropCanvas = document.getElementById("cropCanvas");
const ctx = cropCanvas?.getContext("2d");
const applyCropBtn = document.getElementById("applyCropBtn");
const profileEmail = document.getElementById("profileEmail");
const profileNameInput = document.getElementById("profileNameInput");
const saveNameBtn = document.getElementById("saveNameBtn");
const streakCountEl = document.getElementById("streakCountEl");
const totalEntriesEl = document.getElementById("totalEntriesEl");
const searchExport = document.getElementById("searchExport");
const toggleSelectBtn = document.getElementById("toggleSelectBtn");
const exportBtn = document.getElementById("exportBtn");

// ====== Theme Switch ======
const themeButtons = document.querySelectorAll(".theme-btn");
const body = document.body;
themeButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const selectedTheme = btn.dataset.theme;
    body.classList.remove("theme-pink", "theme-blue", "theme-dark", "theme-lavender");
    body.classList.add(selectedTheme);
  });
});

// ====== Cropping Vars ======
let img = new Image();
let isDragging = false;
let startX = 0, startY = 0;
let cropRect = { x: 0, y: 0, width: 0, height: 0 };
let allSelected = false;

// ----- Helper: normalize date -> YYYY-MM-DD -----
function toDateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ===== Load Entries from Firestore =====
async function loadEntries() {
  if (!window.currentUser) {
    window.entries = {};
    renderExportList();
    return;
  }

  const userDocRef = doc(db, "users", window.currentUser.uid);
  const userSnap = await getDoc(userDocRef);
  let entriesObj = {};

  if (userSnap.exists()) {
    const userData = userSnap.data();

    if (userData.entries && typeof userData.entries === "object" && Object.keys(userData.entries).length > 0) {
      Object.keys(userData.entries).forEach(k => {
        const v = userData.entries[k];
        entriesObj[k] = (typeof v === "string") ? v : (v.content || v.text || JSON.stringify(v));
      });
    } else {
      try {
        const entriesCol = collection(db, "users", window.currentUser.uid, "entries");
        const q = query(entriesCol, orderBy("date", "desc"));
        const snap = await getDocs(q);
        snap.forEach(docSnap => {
          const d = docSnap.data();
          let key;
          if (d.date && typeof d.date.toDate === "function") {
            key = d.date.toDate().toISOString();
          } else if (d.date) {
            key = new Date(d.date).toISOString();
          } else {
            key = docSnap.id;
          }
          entriesObj[key] = d.content || d.text || d.entry || d.body || "";
        });
      } catch (e) {
        console.warn("No subcollection entries or failed to read it:", e);
      }
    }
  }

  window.entries = entriesObj;
  renderExportList();
  await updateStatsAndSave();
}
window.loadEntries = loadEntries;

// ===== Real-time listener =====
function listenForEntries() {
  if (!window.currentUser) return;
  const userDocRef = doc(db, "users", window.currentUser.uid);

  onSnapshot(userDocRef, (docSnap) => {
    if (docSnap.exists()) {
      const userData = docSnap.data();
      window.entries = userData.entries || {};
      renderExportList();
    }
  });
}

// ===== Profile Picture Loader =====
async function loadProfilePic() {
  try {
    if (!window.currentUser) return;
    const userDocRef = doc(db, "users", window.currentUser.uid);
    const userSnap = await getDoc(userDocRef);
    if (!userSnap.exists()) return;
    const userData = userSnap.data();
    if (userData.profilePic && profilePic) profilePic.src = userData.profilePic;
  } catch (err) {
    console.error("Failed to load profile picture:", err);
  }
}

// ===== Upload & Crop Image =====
if (uploadPic) {
  uploadPic.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => img.src = evt.target.result;
    reader.readAsDataURL(file);
  });
}

img.onload = () => {
  if (!cropCanvas) return;
  cropCanvas.width = Math.min(img.width, 300);
  cropCanvas.height = Math.min(img.height, 300);
  cropCanvas.style.display = "block";
  if (applyCropBtn) applyCropBtn.style.display = "inline-block";
  drawCanvas();
};

function drawCanvas() {
  if (!ctx || !cropCanvas) return;
  ctx.clearRect(0, 0, cropCanvas.width, cropCanvas.height);
  ctx.drawImage(img, 0, 0, cropCanvas.width, cropCanvas.height);
  if (cropRect.width && cropRect.height) {
    ctx.strokeStyle = "#d94f87";
    ctx.lineWidth = 2;
    ctx.strokeRect(cropRect.x, cropRect.y, cropRect.width, cropRect.height);
  }
}

function getPos(e) {
  const rect = cropCanvas.getBoundingClientRect();
  let x = e.touches ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
  let y = e.touches ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
  return { x, y };
}
function startDrag(e) { isDragging = true; const pos = getPos(e); startX = pos.x; startY = pos.y; }
function drag(e) { if (!isDragging) return; const pos = getPos(e); cropRect.x = Math.min(startX, pos.x); cropRect.y = Math.min(startY, pos.y); cropRect.width = Math.abs(pos.x - startX); cropRect.height = Math.abs(pos.y - startY); drawCanvas(); }
function endDrag() { isDragging = false; }

if (cropCanvas) {
  cropCanvas.addEventListener("mousedown", startDrag);
  cropCanvas.addEventListener("mousemove", drag);
  cropCanvas.addEventListener("mouseup", endDrag);
  cropCanvas.addEventListener("mouseleave", endDrag);
  cropCanvas.addEventListener("touchstart", startDrag);
  cropCanvas.addEventListener("touchmove", drag);
  cropCanvas.addEventListener("touchend", endDrag);
}

// ImgBB key
const IMGBB_API_KEY = "7ca937bbce3d1c452e27b7b18d04a451";

if (applyCropBtn) {
  applyCropBtn.addEventListener("click", async () => {
    if (!cropRect.width || !cropRect.height || !cropCanvas) return;

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
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: "POST", body: form });
      const data = await response.json();
      if (data.success) {
        const imageUrl = data.data.url;
        if (profilePic) profilePic.src = imageUrl;
        const userDocRef = doc(db, "users", window.currentUser.uid);
        await setDoc(userDocRef, { profilePic: imageUrl }, { merge: true });
        alert("Profile picture updated successfully!");
      } else alert("Failed to upload image.");
    } catch (err) {
      console.error(err);
      alert("Error uploading image.");
    }

    cropCanvas.style.display = "none";
    applyCropBtn.style.display = "none";
    uploadPic.value = "";
    cropRect = { x: 0, y: 0, width: 0, height: 0 };
  });
}

// ===== User Info load/save =====
async function loadUserInfo() {
  if (!window.currentUser) return;
  if (profileEmail) profileEmail.textContent = window.currentUser.email || "";
  const userDocRef = doc(db, "users", window.currentUser.uid);
  const userSnap = await getDoc(userDocRef);
  if (userSnap.exists() && profileNameInput) {
    const userData = userSnap.data();
    profileNameInput.value = userData.name || "";
  }
}

const profileNameInput = document.getElementById("profileNameInput");
const saveNameBtn = document.getElementById("saveNameBtn");

if (saveNameBtn) {
  saveNameBtn.addEventListener("click", async () => {
    const newName = profileNameInput.value.trim();
    if (!newName) return alert("Name cannot be empty!");

    const userDocRef = doc(db, "users", window.currentUser.uid);
    await setDoc(userDocRef, { name: newName }, { merge: true });

    alert("Name updated successfully!");
  });
}

// Load name on page load
async function loadUserInfo() {
  if (!window.currentUser) return;
  const userDocRef = doc(db, "users", window.currentUser.uid);
  const userSnap = await getDoc(userDocRef);
  if (userSnap.exists()) {
    const userData = userSnap.data();
    profileNameInput.value = userData.name || "";
    profileEmail.textContent = window.currentUser.email || "";
  }
}


// ===== Stats calculation & save =====
function computeStreak(entriesObj) {
  const daySet = new Set();
  Object.keys(entriesObj || {}).forEach(k => {
    const d = new Date(k);
    if (!isNaN(d)) daySet.add(toDateKey(d));
  });
  const dayArr = Array.from(daySet).sort((a, b) => new Date(b) - new Date(a));
  if (dayArr.length === 0) return { streak: 0, total: 0 };

  let streak = 0;
  let expected = new Date(dayArr[0]);
  while (true) {
    const expectedKey = toDateKey(expected);
    if (dayArr.includes(expectedKey)) {
      streak++;
      expected.setDate(expected.getDate() - 1);
    } else break;
  }
  return { streak, total: dayArr.length };
}

async function updateStatsAndSave() {
  const userEntries = window.entries || {};
  const { streak, total } = computeStreak(userEntries);
  if (streakCountEl) streakCountEl.textContent = streak;
  if (totalEntriesEl) totalEntriesEl.textContent = total;
  try {
    const userDocRef = doc(db, "users", window.currentUser.uid);
    await setDoc(userDocRef, { streak: streak, totalEntries: total }, { merge: true });
  } catch (e) {
    console.warn("Failed to save stats:", e);
  }
}
function refreshProfileStats() { updateStatsAndSave(); }

// ===== Export Entries UI & PDF export =====
function renderExportList() {
  if (!exportList) return;
  exportList.innerHTML = '';
  const userEntries = window.entries || {};
  const keys = Object.keys(userEntries).sort((a, b) => new Date(b) - new Date(a));
  keys.forEach(key => {
    const displayDate = isNaN(new Date(key)) ? key : new Date(key).toLocaleString();
    const div = document.createElement('div');
    div.style.marginBottom = '6px';
    div.innerHTML = `
      <label style="color:#d94f87;">
        <input type="checkbox" class="exportCheck" data-key="${key}">
        ${displayDate} - ${String(userEntries[key]).substring(0, 40)}${String(userEntries[key]).length > 40 ? '...' : ''}
      </label>
    `;
    exportList.appendChild(div);
  });
  refreshProfileStats();
}

if (searchExport) {
  searchExport.addEventListener('input', () => {
    const query = searchExport.value.toLowerCase();
    document.querySelectorAll('#exportList div').forEach(div => {
      div.style.display = div.textContent.toLowerCase().includes(query) ? 'block' : 'none';
    });
  });
}

if (toggleSelectBtn) {
  toggleSelectBtn.addEventListener('click', () => {
    allSelected = !allSelected;
    document.querySelectorAll('.exportCheck').forEach(cb => cb.checked = allSelected);
    toggleSelectBtn.textContent = allSelected ? 'Deselect All' : 'Select All';
  });
}

if (exportBtn) {
  exportBtn.addEventListener('click', async () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let yOffset = 20;
    const userEntries = window.entries || {};
    const checkedEntries = document.querySelectorAll('.exportCheck:checked');
    if (checkedEntries.length === 0) return alert('Please select at least one entry.');

    checkedEntries.forEach(cb => {
      const key = cb.dataset.key;
      doc.setFontSize(14);
      doc.setTextColor(200, 50, 135);
      const displayDate = isNaN(new Date(key)) ? key : new Date(key).toLocaleString();
      doc.text(displayDate, 20, yOffset);
      yOffset += 8;

      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      const splitText = doc.splitTextToSize(String(userEntries[key]), 170);
      doc.text(splitText, 20, yOffset);
      yOffset += splitText.length * 7 + 10;

      if (yOffset > 280) {
        doc.addPage();
        yOffset = 20;
      }
    });

    doc.save('PastelThoughtsDiary.pdf');
  });
}

// ===== Firebase Auth Listener =====
onAuthStateChanged(auth, async (user) => {
  if (!user) return window.location.href = 'index.html';

  window.currentUser = user;

  const userDocRef = doc(db, "users", currentUser.uid);
  const userSnap = await getDoc(userDocRef);

  if (!userSnap.exists()) {
    await setDoc(userDocRef, {
      name: "",
      profilePic: "",
      entries: {},
      streak: 0,
      totalEntries: 0
    });
  }

  await loadEntries();
  listenForEntries();
  await loadProfilePic();
  await loadUserInfo();
  await refreshProfileStats();
  renderExportList();
});



