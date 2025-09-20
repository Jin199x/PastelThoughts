// ====== Firebase Setup ======
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, doc, updateDoc, getDoc, deleteField } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC9M9No4HNitBiiqvXxGMYQSQJ0TNhKxR0",
  authDomain: "pastelthoughts-19dd4.firebaseapp.com",
  projectId: "pastelthoughts-19dd4",
  messagingSenderId: "578642737437",
  appId: "1:578642737437:web:0a7e058cb42a9e340709f4"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ====== DOM Elements ======
const fullEntry = document.getElementById('fullEntry');
const backBtn = document.getElementById('backBtn');
const entryDate = document.getElementById('entryDate');
const entryText = document.getElementById('entryText');
const timeline = document.getElementById('timeline');
const editorTextarea = document.querySelector('.editor textarea');
const saveBtn = document.querySelector('.editor .save-btn');
const calendarBtn = document.getElementById("calendarBtn");
const calendarSection = document.getElementById("calendar");
const calendarGrid = document.getElementById("calendarGrid");
const calendarMonth = document.getElementById("calendarMonth");
const profileBtn = document.getElementById("profileBtn");
const profileSection = document.getElementById("profile");
const todayBtn = document.getElementById("todayBtn");
const logoutBtn = document.getElementById('logoutBtn');
const prevMonthBtn = document.getElementById("prevMonth");
const nextMonthBtn = document.getElementById("nextMonth");

let currentDate = new Date();
let currentUser = null;

// ====== 30-minute session check on page load ======
const thirtyMinutes = 30 * 60 * 1000;
const loginTime = localStorage.getItem("loginTime");

if (!loginTime || Date.now() - loginTime > thirtyMinutes) {
  localStorage.removeItem("loginTime");
  auth.signOut().then(() => {
    window.location.href = "index.html";
  });
} else {
  // Reset loginTime on any user activity
  function resetLoginTime() {
    localStorage.setItem("loginTime", Date.now());
  }

  ['click', 'keydown', 'mousemove', 'scroll'].forEach(event => {
    window.addEventListener(event, resetLoginTime);
  });
}



// ====== Firebase Auth Listener ======
onAuthStateChanged(auth, user => {
  if (!user) return window.location.href = 'index.html';
  currentUser = user;
  renderPastEntries();
  renderCalendar(currentDate);
  renderExportList();
});

// ====== Save / Edit Entry ======
async function saveEntryToFirebase(dateKey, text) {
  if (!currentUser) return;
  const userRef = doc(db, "users", currentUser.uid);
  await updateDoc(userRef, {
    [`entries.${dateKey}`]: text
  });
}

// ====== Delete Entry ======
async function deleteEntryFromFirebase(dateKey) {
  if (!currentUser) return;
  const userRef = doc(db, "users", currentUser.uid);
  await updateDoc(userRef, {
    [`entries.${dateKey}`]: deleteField()
  });
}

// ====== Render Past Entries ======
async function renderPastEntries() {
  if (!currentUser) return;
  const docSnap = await getDoc(doc(db, "users", currentUser.uid));
  const entries = docSnap.exists() ? docSnap.data().entries || {} : {};

  timeline.innerHTML = '<h3>Past Entries</h3>';
  const sortedDates = Object.keys(entries).sort((a, b) => new Date(b) - new Date(a));

  sortedDates.forEach(dateKey => {
    const entryValue = entries[dateKey];
    const card = document.createElement('div');
    card.classList.add('entry-card');
    const displayDate = new Date(dateKey).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
    card.innerHTML = `<strong>${displayDate}</strong><p>${entryValue}</p>`;
    card.onclick = () => showFullEntry(dateKey, entryValue, displayDate);
    timeline.appendChild(card);
  });
}

// ====== Show Full Entry ======
function showFullEntry(dateKey, entryValue, displayDate) {
  hideAllSections();
  fullEntry.style.display = 'flex';
  entryDate.textContent = displayDate;

  entryText.innerHTML = `
    <textarea id="editPastEntry" style="width:100%;height:150px;padding:10px;border-radius:12px;border:1px solid #d94f87;">${entryValue}</textarea>
    <div style="margin-top:10px; display:flex; gap:10px;">
      <button id="savePastEditBtn" class="save-btn">Save Edit</button>
      <button id="deletePastEntryBtn" class="save-btn" style="background:#ff4d6d;">Delete</button>
    </div>
  `;

  const saveBtn = document.getElementById('savePastEditBtn');
  const deleteBtn = document.getElementById('deletePastEntryBtn');

  saveBtn.onclick = async () => {
    const newText = document.getElementById('editPastEntry').value;
    if (!newText) return alert("Cannot save empty entry!");
    await saveEntryToFirebase(dateKey, newText);
    alert("Entry saved!");
    renderPastEntries();
    renderCalendar(currentDate);
    renderExportList();
    hideAllSections();
    timeline.style.display = 'flex';
    document.getElementById('editor').style.display = 'flex';
  };

  deleteBtn.onclick = async () => {
    if (!confirm("Are you sure you want to delete this entry?")) return;
    await deleteEntryFromFirebase(dateKey);
    alert("Entry deleted!");
    renderPastEntries();
    renderCalendar(currentDate);
    renderExportList();
    hideAllSections();
    timeline.style.display = 'flex';
    document.getElementById('editor').style.display = 'flex';
  };
}

// ====== Save Today's Entry ======
saveBtn.onclick = async () => {
  const text = editorTextarea.value;
  if (!text) return alert("Please write something before saving.");
  const todayKey = new Date().toISOString().split('T')[0];

  await saveEntryToFirebase(todayKey, text);
  editorTextarea.value = "";
  alert("Entry saved!");
  renderPastEntries();
  renderCalendar(currentDate);
  renderExportList();
};

// ====== Calendar ======
let calendarEntry = document.createElement("div");
calendarEntry.id = "calendarEntry";
calendarEntry.style.marginTop = "20px";
calendarSection.appendChild(calendarEntry);

async function renderCalendar(date) {
  if (!currentUser) return;
  const docSnap = await getDoc(doc(db, "users", currentUser.uid));
  const entries = docSnap.exists() ? docSnap.data().entries || {} : {};

  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayKey = new Date().toISOString().split('T')[0];

  calendarGrid.innerHTML = "";
  calendarMonth.textContent = date.toLocaleString("default", { month: "long" }) + " " + year;

  for (let i = 0; i < firstDay; i++) {
    const emptyCell = document.createElement("div");
    emptyCell.classList.add("calendar-cell", "empty");
    calendarGrid.appendChild(emptyCell);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const cell = document.createElement("div");
    cell.classList.add("calendar-cell");
    cell.textContent = day;

    const key = `${year}-${String(month + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    if (entries[key]) cell.classList.add("has-entry");

    // Disable future dates
    if (key > todayKey) {
      cell.style.opacity = "0.5";
      cell.style.cursor = "not-allowed";
      cell.title = "You can only add entries for today or past dates";
    } else {
      cell.onclick = () => showCalendarEntry(key, day, month, year);
    }

    calendarGrid.appendChild(cell);
  }
}

// ====== Show Calendar Entry ======
async function showCalendarEntry(key, day, month, year) {
  if (!currentUser) return;
  const docSnap = await getDoc(doc(db, "users", currentUser.uid));
  const entries = docSnap.exists() ? docSnap.data().entries || {} : {};

  calendarEntry.style.display = "block";
  let html = `<h2>${day} ${new Date(year, month).toLocaleString("default",{month:"long"})} ${year}</h2>`;

  if (entries[key]) {
    html += `
      <div id="calendarEntryCard" style="
        border: 1px solid #d94f87; 
        border-radius: 12px; 
        padding: 12px; 
        background:#fff; 
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        cursor:pointer;
      ">
        <p id="calendarEntryText" style="white-space:pre-wrap; margin:0;">${entries[key]}</p>
        <small style="color:#888; display:block; margin-top:6px;">Click to edit</small>
      </div>
    `;
  } else {
    html += `<textarea id="newCalendarEntry" placeholder="Write something..." style="width:100%;height:150px;padding:10px;border-radius:12px;border:1px solid #d94f87;"></textarea>
             <button id="saveCalendarBtn" class="save-btn" style="margin-top:10px;">Save</button>`;
  }

  calendarEntry.innerHTML = html;

  // If the card exists, clicking it will show edit/delete buttons
  const entryCard = document.getElementById("calendarEntryCard");
  if (entryCard) {
    entryCard.onclick = () => {
      calendarEntry.innerHTML = `
        <h2>${day} ${new Date(year, month).toLocaleString("default",{month:"long"})} ${year}</h2>
        <textarea id="editEntryTextarea" style="width:100%;height:150px;padding:10px;border-radius:12px;border:1px solid #d94f87;">${entries[key]}</textarea>
        <div style="margin-top:10px; display:flex; gap:10px;">
          <button id="saveEditBtn" class="save-btn">Save</button>
          <button id="cancelEditBtn" class="save-btn" style="background:#aaa;">Cancel</button>
          <button id="deleteCalendarEntryBtn" class="save-btn" style="background:#ff4d6d;">Delete</button>
        </div>
      `;

      document.getElementById("saveEditBtn").onclick = async () => {
        const newText = document.getElementById("editEntryTextarea").value;
        if (!newText) return alert("Cannot save empty entry!");
        await saveEntryToFirebase(key, newText);
        alert("Entry updated!");
        renderPastEntries();
        renderCalendar(currentDate);
        calendarEntry.style.display = "none";
        renderExportList();
      };

      document.getElementById("cancelEditBtn").onclick = () => {
        showCalendarEntry(key, day, month, year);
      };

      document.getElementById("deleteCalendarEntryBtn").onclick = async () => {
        if (!confirm("Are you sure you want to delete this entry?")) return;
        await deleteEntryFromFirebase(key);
        alert("Entry deleted!");
        renderPastEntries();
        renderCalendar(currentDate);
        calendarEntry.style.display = "none";
        renderExportList();
      };
    };
  }

  // Save new entry
  const saveBtnCal = document.getElementById("saveCalendarBtn");
  if (saveBtnCal) saveBtnCal.onclick = async () => {
    const text = document.getElementById("newCalendarEntry").value;
    if (!text) return alert("Cannot save empty entry!");
    await saveEntryToFirebase(key, text);
    alert("Entry saved!");
    renderPastEntries();
    renderCalendar(currentDate);
    calendarEntry.style.display = "none";
    renderExportList();
  };
}

// ====== Month Navigation ======
prevMonthBtn.onclick = () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(currentDate); };
nextMonthBtn.onclick = () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(currentDate); };

// ====== Hide Sections / Navigation ======
function hideAllSections() { document.querySelectorAll(".view").forEach(s => s.style.display = "none"); }
todayBtn.onclick = () => { hideAllSections(); timeline.style.display='flex'; document.getElementById('editor').style.display='flex'; };
calendarBtn.onclick = () => { hideAllSections(); calendarSection.style.display='flex'; renderCalendar(currentDate); };
profileBtn.onclick = () => { hideAllSections(); profileSection.style.display='flex'; };
backBtn.onclick = () => { hideAllSections(); timeline.style.display='flex'; document.getElementById('editor').style.display='flex'; };
logoutBtn.onclick = async () => { await signOut(auth); window.location.href='index.html'; };

// ====== Today Button ======
todayBtn.onclick = () => {
  hideAllSections();
  document.getElementById('editor').style.display = 'flex';
  timeline.style.display = 'flex';
};

// ====== Calendar Button ======
calendarBtn.onclick = () => {
  hideAllSections();
  calendarSection.style.display = 'flex';
  renderCalendar(currentDate);
};

// ====== Profile Button ======
profileBtn.onclick = () => {
  hideAllSections();
  profileSection.style.display = 'flex';
};

// ====== Logout ======
logoutBtn.onclick = async () => {
  await signOut(auth);
  window.location.href = 'index.html';
};

//=== DATE config ===
const dateEl = document.getElementById("currentDate");

function updateDate() {
  const today = new Date();
  const options = { month: "long", day: "numeric", year: "numeric" };
  dateEl.textContent = today.toLocaleDateString("en-US", options);
}

// Initial display
updateDate();

// Calculate milliseconds until next midnight
function scheduleMidnightUpdate() {
  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const msUntilMidnight = tomorrow - now;

  setTimeout(() => {
    updateDate(); // Update at midnight
    setInterval(updateDate, 24 * 60 * 60 * 1000); // Then every 24h
  }, msUntilMidnight);
}

scheduleMidnightUpdate();

// == Greeting ==
function getTimeBasedGreeting(name) {
  const now = new Date();
  const hour = now.getHours();

  if (hour >= 5 && hour < 12) return `Good morning, ${name}!`;
  if (hour >= 12 && hour < 17) return `Good afternoon, ${name}!`;
  if (hour >= 17 && hour < 21) return `Good evening, ${name}!`;
  return `Hello, ${name}!`;
}

onAuthStateChanged(auth, async (user) => {
  if (user) {
    window.currentUser = user;

    const userDocRef = doc(db, "users", window.currentUser.uid);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
      const savedName = docSnap.data().name || "User";
      document.getElementById("welcomeSidebar").textContent = getTimeBasedGreeting(savedName);
      profileNameInput.placeholder = savedName;
    }
  }
});


// ===== Load saved theme on diary page =====
async function loadTheme() {
  if (!window.currentUser) return;
  const userRef = doc(db, "users", window.currentUser.uid);
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    const data = snap.data();
    if (data.theme) document.body.classList.add(data.theme);
  }
}

onAuthStateChanged(auth, async (user) => {
  if (!user) return window.location.href = 'index.html';
  window.currentUser = user;

  // call theme loader for diary page
  await loadTheme();

  // existing diary setup calls
  renderPastEntries();
  renderCalendar(currentDate);
  renderExportList();
});

// ===== Install Prompt (Chrome/Android) =====
let deferredPrompt;
const installBtn = document.createElement('button');
installBtn.id = 'installBtn';
installBtn.textContent = 'Install App';
Object.assign(installBtn.style, {
  position: 'fixed',
  bottom: '20px',
  right: '20px',
  padding: '10px 20px',
  background: '#d94f87',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  display: 'none',
  zIndex: 9999,
  cursor: 'pointer'
});
document.body.appendChild(installBtn);

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.style.display = 'block';
});

installBtn.addEventListener('click', async () => {
  installBtn.style.display = 'none';
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const choice = await deferredPrompt.userChoice;
  console.log('User choice:', choice.outcome);
  deferredPrompt = null;
});

// ===== iOS Support =====
function isIos() {
  return /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
}

function isInStandaloneMode() {
  return ('standalone' in window.navigator) && window.navigator.standalone;
}

if (isIos() && !isInStandaloneMode()) {
  const iosMsg = document.createElement('div');
  iosMsg.innerHTML = `
    Tap <span style="font-weight:bold;">Share</span> → 
    <span style="font-weight:bold;">Add to Home Screen</span> to install the app.
    <span id="closeIosMsg" style="margin-left:10px;cursor:pointer;font-weight:bold;">✕</span>
  `;
  Object.assign(iosMsg.style, {
    position: 'fixed',
    bottom: '0',
    width: '100%',
    padding: '10px',
    background: '#d94f87',
    color: '#fff',
    textAlign: 'center',
    fontSize: '14px',
    zIndex: 9999,
    boxSizing: 'border-box'
  });
  document.body.appendChild(iosMsg);

  document.getElementById('closeIosMsg').addEventListener('click', () => {
    iosMsg.style.display = 'none';
  });
}


const loadingScreen = document.getElementById("loadingScreen");
const appContent = document.getElementById("appContent");

function showLoading() {
  loadingScreen.style.display = "flex";
  appContent.style.display = "none";
}

function hideLoading() {
  loadingScreen.style.display = "none";
  appContent.style.display = "block";
}


















