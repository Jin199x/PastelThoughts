import { getFirestore, doc, setDoc, addDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

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
let entries = {
  "2025-09-10": "Had a productive day working on my project...",
  "2025-09-09": "Went for a walk in the park and felt refreshed..."
};

// ====== Past Entries Rendering ======
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

    card.addEventListener('click', () => {
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

      document.getElementById('savePastEditBtn').addEventListener('click', () => {
        const newText = document.getElementById('editPastEntry').value.trim();
        if (!newText) return alert("Cannot save empty entry!");
        entries[dateKey] = newText;
        renderPastEntries();
        renderCalendar(currentDate);
        alert("Entry updated!");
        hideAllSections();
        renderExportList();
        timeline.style.display = 'flex';
        document.getElementById('editor').style.display = 'flex';
      });

      document.getElementById('deletePastEntryBtn').addEventListener('click', () => {
        if (confirm("Are you sure you want to delete this entry?")) {
          delete entries[dateKey];
          renderPastEntries();
          renderCalendar(currentDate);
          renderExportList();
          hideAllSections();
          timeline.style.display = 'flex';
          document.getElementById('editor').style.display = 'flex';
        }
      });
    });

    timeline.appendChild(card);
  });
}

// ====== Save Today's Entry ======
saveBtn.addEventListener('click', () => {
  const text = editorTextarea.value.trim();
  if (!text) return alert("Please write something before saving.");

  const todayKey = new Date().toISOString().split('T')[0];
  entries[todayKey] = text;

  editorTextarea.value = "";
  renderPastEntries();
  renderCalendar(currentDate);
  alert("Entry saved!");
  renderExportList();
});

// ====== Back Button ======
backBtn.addEventListener('click', () => {
  hideAllSections();
  timeline.style.display = 'flex';
  document.getElementById('editor').style.display = 'flex';
});

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
    cell.addEventListener("click", () => showCalendarEntry(key, day, month, year));
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

  const saveBtn = document.getElementById("saveCalendarBtn");
  if (saveBtn) saveBtn.addEventListener("click", () => {
    const text = document.getElementById("newCalendarEntry").value.trim();
    if (!text) return alert("Cannot save empty entry!");
    entries[key] = text;
    renderCalendar(currentDate);
    showCalendarEntry(key, day, month, year);
    renderPastEntries();
    renderExportList();
  });

  const saveEditBtn = document.getElementById("saveEditBtn");
  if (saveEditBtn) saveEditBtn.addEventListener("click", () => {
    const newText = document.getElementById("editEntryTextarea").value.trim();
    if (!newText) return alert("Cannot save empty entry!");
    entries[key] = newText;
    renderCalendar(currentDate);
    renderPastEntries();
    alert("Entry updated!");
    renderExportList();
  });

  const deleteBtn = document.getElementById("deleteEntryBtn");
  if (deleteBtn) deleteBtn.addEventListener("click", () => {
    if (confirm("Are you sure you want to delete this entry?")) {
      delete entries[key];
      renderCalendar(currentDate);
      renderPastEntries();
      calendarEntry.style.display = "none";
      renderExportList();
    }
  });
}

// Month navigation
document.getElementById("prevMonth").addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar(currentDate);
});
document.getElementById("nextMonth").addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar(currentDate);
});

renderCalendar(currentDate);

// ====== Navigation Buttons ======
calendarBtn.addEventListener("click", () => {
  hideAllSections();
  calendarSection.style.display = "flex";
});

todayBtn.addEventListener("click", () => {
  hideAllSections();
  timeline.style.display = 'flex';
  document.getElementById('editor').style.display = 'flex';
});

profileBtn.addEventListener("click", () => {
  hideAllSections();
  profileSection.style.display = 'flex';
});

// ====== Hide All Sections Helper ======
function hideAllSections() {
  document.getElementById('editor').style.display = 'none';
  fullEntry.style.display = 'none';
  timeline.style.display = 'none';
  calendarSection.style.display = 'none';
  profileSection.style.display = 'none';
  calendarEntry.style.display = 'none';
}

// ====== Logout ======
logoutBtn.addEventListener('click', () => {
  window.location.href = 'login.html'; // keep login.html as your redirect
});

