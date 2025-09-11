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
}

// ====== Save Today's Entry ======
saveBtn.onclick = async () => {
  const text = editorTextarea.value;
  if (!text) return alert("Please write something before saving.");
  const todayKey = new Date().toISOString().split('T')[0];

  try {
    await saveEntryToFirebase(todayKey, text);
    editorTextarea.value = "";
    renderPastEntries();
    renderCalendar(currentDate);
    alert("Entry saved!");
    if (typeof renderExportList === 'function') renderExportList();
  } catch (err) {
    console.error("Error saving entry:", err);
    alert("Failed to save entry. Try again.");
  }
};

// ====== Back Button ======
backBtn.onclick = () => {
  hideAllSections();
  timeline.style.display = 'flex';
  document.getElementById('editor').style.display = 'flex';
};

// ====== Calendar ======
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
    renderPastEntries();
    showCalendarEntry(key, day, month, year);
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

// ====== Hide All Sections ======
function hideAllSections() {
  document.querySelectorAll(".view").forEach(s => s.style.display = "none");
}

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
