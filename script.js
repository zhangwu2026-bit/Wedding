// ----- Mobile nav toggle -----
const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");
if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });
  navLinks.querySelectorAll("a").forEach(a => {
    a.addEventListener("click", () => {
      navLinks.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

// ----- RSVP local storage helpers -----
const STORAGE_KEY = "wedding_rsvps_v1";

function loadRsvps() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function saveRsvps(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function csvEscape(v) {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function downloadText(filename, text) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ----- Render RSVP list -----
const rsvpList = document.getElementById("rsvpList");

function renderRsvps() {
  if (!rsvpList) return;
  const rsvps = loadRsvps();

  if (rsvps.length === 0) {
    rsvpList.innerHTML = `<p class="muted small">No RSVPs saved on this device yet.</p>`;
    return;
  }

  rsvpList.innerHTML = rsvps
    .slice()
    .reverse()
    .map(r => {
      const date = new Date(r.createdAt).toLocaleString();
      return `
        <div class="rsvp-item">
          <div class="topline">
            <div><strong>${r.primaryName}</strong> <span class="muted small">(${r.email})</span></div>
            <div class="badge">${date}</div>
          </div>
          <div class="small"><strong>Headcount:</strong> ${r.headcount}</div>
          <div class="small"><strong>Attending:</strong> ${r.events.join(", ") || "—"}</div>
          <div class="small"><strong>Guests:</strong> ${r.partyNames}</div>
          <div class="small"><strong>Dietary:</strong> ${r.dietary || "—"}</div>
          <div class="small"><strong>Accommodations:</strong> ${r.accommodations || "—"}</div>
          <div class="small"><strong>Songs:</strong> ${[r.song1, r.song2, r.song3].filter(Boolean).join(" | ") || "—"}</div>
          <div class="small"><strong>Notes:</strong> ${r.notes || "—"}</div>
        </div>
      `;
    })
    .join("");
}

renderRsvps();

// ----- RSVP form submission -----
const form = document.getElementById("rsvpForm");
const statusEl = document.getElementById("formStatus");
const resetFormBtn = document.getElementById("resetFormBtn");

if (resetFormBtn && form) {
  resetFormBtn.addEventListener("click", () => {
    form.reset();
    if (statusEl) statusEl.textContent = "";
  });
}

if (form && statusEl) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    statusEl.textContent = "Saving…";

    const fd = new FormData(form);

    const events = Array.from(form.querySelectorAll('input[name="events"]:checked'))
      .map(el => el.value);

    if (events.length === 0) {
      statusEl.textContent = "Please select at least one event to attend.";
      return;
    }

    const record = {
      createdAt: new Date().toISOString(),
      primaryName: (fd.get("primaryName") || "").toString().trim(),
      email: (fd.get("email") || "").toString().trim(),
      phone: (fd.get("phone") || "").toString().trim(),
      relationship: (fd.get("relationship") || "").toString().trim(),
      partyNames: (fd.get("partyNames") || "").toString().trim(),
      headcount: Number(fd.get("headcount") || 1),
      events,
      dietary: (fd.get("dietary") || "").toString().trim(),
      accommodations: (fd.get("accommodations") || "").toString().trim(),
      song1: (fd.get("song1") || "").toString().trim(),
      song2: (fd.get("song2") || "").toString().trim(),
      song3: (fd.get("song3") || "").toString().trim(),
      notes: (fd.get("notes") || "").toString().trim(),
    };

    if (!record.primaryName || !record.email || !record.partyNames) {
      statusEl.textContent = "Please fill out your name, email, and guest names.";
      return;
    }

    const rsvps = loadRsvps();
    rsvps.push(record);
    saveRsvps(rsvps);

    form.reset();
    statusEl.textContent = "Saved! (Stored locally on this device.)";
    renderRsvps();
  });
}

// ----- Export / Clear -----
const exportBtn = document.getElementById("exportCsvBtn");
const clearBtn = document.getElementById("clearRsvpsBtn");

if (exportBtn) {
  exportBtn.addEventListener("click", () => {
    const rsvps = loadRsvps();
    if (rsvps.length === 0) {
      alert("No RSVPs to export on this device.");
      return;
    }

    const header = [
      "createdAt","primaryName","email","phone","relationship","partyNames","headcount",
      "events","dietary","accommodations","song1","song2","song3","notes"
    ];

    const rows = rsvps.map(r => ([
      r.createdAt, r.primaryName, r.email, r.phone, r.relationship, r.partyNames, r.headcount,
      (r.events || []).join("; "),
      r.dietary, r.accommodations, r.song1, r.song2, r.song3, r.notes
    ]));

    const csv = [
      header.map(csvEscape).join(","),
      ...rows.map(row => row.map(csvEscape).join(","))
    ].join("\n");

    downloadText("wedding_rsvps.csv", csv);
  });
}

if (clearBtn) {
  clearBtn.addEventListener("click", () => {
    const ok = confirm("Clear all saved RSVPs on this device? This cannot be undone.");
    if (!ok) return;
    localStorage.removeItem(STORAGE_KEY);
    renderRsvps();
  });
}
// ----- Simple carousel (Cat Photos) -----
const carousels = document.querySelectorAll(".carousel");

carousels.forEach(carousel => {
  const images = carousel.querySelectorAll(".carousel-img");
  const prevBtn = carousel.querySelector(".prev");
  const nextBtn = carousel.querySelector(".next");

  let current = 0;

  function show(index){
    images.forEach(img => img.classList.remove("active"));
    images[index].classList.add("active");
  }

  prevBtn.addEventListener("click", () => {
    current = (current - 1 + images.length) % images.length;
    show(current);
  });

  nextBtn.addEventListener("click", () => {
    current = (current + 1) % images.length;
    show(current);
  });
});
