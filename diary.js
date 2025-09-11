// ====== Firebase Setup ======
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC9M9No4HNitBiiqvXxGMYQSQJ0TNhKxR0",
  authDomain: "pastelthoughts-19dd4.firebaseapp.com",
  projectId: "pastelthoughts-19dd4",
  messagingSenderId: "578642737437",
  appId: "pastelthoughts-19dd4.web.app"
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

let currentDate = new Date();
let entries = {}; // Will be loaded from Firestore
let currentUser = null;

// ====== Firebase Auth Listener ======
onAuthStateChanged(auth, user => {
  if (!user) return window.location.href = 'login.html';
  currentUser = user;
  loadEntries();
});

// ====== Load Entries from Firestore ======
async function loadEntries() {
  const docRef = doc(db, "users", currentUser.uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    entries = docSnap.data().entries || {};
  } else {
    entries = {};
  }
  window.entries = entries; // Sync global for profile.js
  renderPastEntries();
  renderCalendar(currentDate);
  if (typeof renderExportList === 'function') renderExportList();
}

// ====== Save Entry to Firestore ======
async function saveEntryToFirebase(dateKey, text) {
  entries[dateKey] = text;
  const docRef = doc(db, "users", currentUser.uid);
  await setDoc(docRef, { entries }, { merge: true });
  window.entries = entries; // Sync global
}

// ====== Delete Entry from Firestore ======
async function deleteEntryFromFirebase(dateKey) {
  delete entries[dateKey];
  const docRef = doc(db, "users", currentUser.uid);
  await setDoc(docRef, { entries }, { merge: true });
  window.entries = entries; // Sync global
}

// ====== Render Past Entries ======
function renderPastEntries() {
  timeline.innerHTML = '<h3>Past Entries</h3>';

  const sortedDates = Object.keys(entries).sort((a,b) => new Date(b) - new Date(a));

  sortedDates.forEach(dateKey => {
    const entryValue = entries[dateKey];
    const card = document.createElement('div');
    card.classList.add('entry-card');

    const displayDate = new Date(dateKey).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
    card.dataset.key = dateKey;
    card.dataset.text = entryValue;
    card.innerHTML = `<strong>${displayDate}</strong><p>${entryValue}</p>`;

    card.onclick = () => { // Use onclick to avoid multiple listeners
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

      const savePastEditBtn = document.getElementById('savePastEditBtn');
      const deletePastEntryBtn = document.getElementById('deletePastEntryBtn');

      savePastEditBtn.onclick = async () => {
        const newText = document.getElementById('editPastEntry').value;
        if (!newText) return alert("Cannot save empty entry!");
        await saveEntryToFirebase(dateKey, newText);
        renderPastEntries();
        renderCalendar(currentDate);
        alert("Entry updated!");
        hideAllSections();
        timeline.style.display = 'flex';
        document.getElementById('editor').style.display = 'flex';
        if (typeof renderExportList === 'function') renderExportList();
      };

      deletePastEntryBtn.onclick = async () => {
        if (confirm("Are you sure you want to delete this entry?")) {
          await deleteEntryFromFirebase(dateKey);
          renderPastEntries();
          renderCalendar(currentDate);
          hideAllSections();
          timeline.style.display = 'flex';
          document.getElementById('editor').style.display = 'flex';
          if (typeof renderExportList === 'function') renderExportList();
        }
      };
    };

    timeline.appendChild(card);
  });
}

// ====== Save Today's Entry ======
saveBtn.onclick = async () => {
  const text = editorTextarea.value;
  if (!text) return alert("Please write something before saving.");

  const todayKey = new Date().toISOString().split('T')[0];
  await saveEntryToFirebase(todayKey, text);

  editorTextarea.value = "";
  renderPastEntries();
  renderCalendar(currentDate);
  alert("Entry saved!");
  if (typeof renderExportList === 'function') renderExportList();
};

// ====== Back Button ======
backBtn.onclick = () => {
  hideAllSections();
  timeline.style.display = 'flex';
  document.getElementById('editor').style.display = 'flex';
};

// ====== Calendar Setup ======
let calendarEntry = document.createElement("div");
calendarEntry.id = "calendarEntry";
calendarEntry.style.marginTop = "20px";
calendarSection.appendChild(calendarEntry);

function renderCalendar(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
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
    cell.onclick = () => showCalendarEntry(key, day, month, year);
    calendarGrid.appendChild(cell);
  }
}

function showCalendarEntry(key, day, month, year) {
  calendarEntry.style.display = "block";
  let html = `<h2>${day} ${new Date(year, month).toLocaleString("default",{month:"long"})} ${year}</h2>`;

  if (entries[key]) {
    html += `<textarea id="editEntryTextarea" style="width:100%;height:150px;padding:10px;border-radius:12px;border:1px solid #d94f87;">${entries[key]}</textarea>
             <div style="margin-top:10px; display:flex; gap:10px;">
               <button id="saveEditBtn" class="save-btn">Save Edit</button>
               <button id="deleteEntryBtn" class="save-btn" style="background:#ff4d6d;">Delete</button>
             </div>`;
  } else {
    html += `<p>No entry yet.</p>
             <textarea id="newCalendarEntry" placeholder="Write something..." style="margin-top:10px;width:100%;height:150px;padding:10px;border-radius:12px;border:1px solid #d94f87;"></textarea>
             <button id="saveCalendarBtn" class="save-btn" style="margin-top:10px;">Save</button>`;
  }

  calendarEntry.innerHTML = html;

  const saveBtnCal = document.getElementById("saveCalendarBtn");
  if (saveBtnCal) saveBtnCal.onclick = async () => {
    const text = document.getElementById("newCalendarEntry").value;
    if (!text) return alert("Cannot save empty entry!");
    await saveEntryToFirebase(key, text);
    renderCalendar(currentDate);
    showCalendarEntry(key, day, month, year);
    renderPastEntries();
    if (typeof renderExportList === 'function') renderExportList();
  };

  const saveEditBtn = document.getElementById("saveEditBtn");
  if (saveEditBtn) saveEditBtn.onclick = async () => {
    const newText = document.getElementById("editEntryTextarea").value;
    if (!newText) return alert("Cannot save empty entry!");
    await saveEntryToFirebase(key, newText);
    renderCalendar(currentDate);
    renderPastEntries();
    alert("Entry updated!");
    if (typeof renderExportList === 'function') renderExportList();
  };

  const deleteBtn = document.getElementById("deleteEntryBtn");
  if (deleteBtn) deleteBtn.onclick = async () => {
    if (confirm("Are you sure you want to delete this entry?")) {
      await deleteEntryFromFirebase(key);
      renderCalendar(currentDate);
      renderPastEntries();
      calendarEntry.style.display = "none";
      if (typeof renderExportList === 'function') renderExportList();
    }
  };
}

// ====== Month Navigation ======
document.getElementById("prevMonth").onclick = () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar(currentDate);
};
document.getElementById("nextMonth").onclick = () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar(currentDate);
};

// ====== Hide All Sections Helper ======
function hideAllSections() {
  document.querySelectorAll(".view").forEach(s => s.style.display = "none");
}
