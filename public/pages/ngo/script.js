const user    = JSON.parse(localStorage.getItem("user"));
const profile = JSON.parse(localStorage.getItem("profile"));

if (!user || user.role !== "ngo") {
  window.location.replace("../../index.html");
}

window.addEventListener("pageshow", function (event) {
  if (event.persisted) window.location.reload();
});

const welcomeEl = document.getElementById("welcomeText");
if (welcomeEl && profile) {
  welcomeEl.innerText = `Welcome, ${profile.name} !`;
}

function logout() {
  showModal(
    "Logging Out",
    "Thank you for your wonderful work caring for animals. See you soon!",
    "Log Out",
    () => {
      localStorage.removeItem("user");
      localStorage.removeItem("profile");
      showToast("Thank you for your kindness! <br> Come back soon.", "success");
      setTimeout(() => window.location.href = "../../index.html", 1500);
    }
  );
}

function showStats() {
  fetch(`http://localhost:3000/ngo/stats/${profile.ngo_id}`)
    .then(res => res.json())
    .then(data => {
      document.getElementById("statRequests").textContent = data.total_requests ?? "N\\A";
      document.getElementById("statPending").textContent = data.pending ?? "N\\A";
      document.getElementById("statAnimals").textContent = data.total_animals ?? "N\\A";
      document.getElementById("statDonations").textContent = data.total_donations ?? "N\\A";
    })
    .catch(err => console.error("Stats error:", err));
}
showStats();

function showToast(message, type = "success") {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  const icons = { success: "✅", error: "❌", info: "ℹ️" };
  toast.innerHTML = `<span>${icons[type] || "🐾"}</span> <span>${message}</span>`;
  document.body.appendChild(toast);
  setTimeout(() => toast.style.opacity = "0", 2800);
  setTimeout(() => toast.remove(), 3200);
}

function showModal(title, body, confirmLabel, onConfirm, danger = false) {
  const overlay = document.createElement("div");
  overlay.className= "modal-overlay";
  overlay.innerHTML = `
    <div class="modal">
      <h2>${title}</h2>
      <p>${body}</p>
      <div class="buttons">
        <button class="buttons" id="modalCancel">Cancel</button>
        <button class="${danger ? 'btn-danger' : 'buttons'}" id="modalConfirm">${confirmLabel}</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.querySelector("#modalCancel").onclick = () => overlay.remove();
  overlay.querySelector("#modalConfirm").onclick = () => { overlay.remove(); onConfirm(); };
  overlay.addEventListener("click", e => { if (e.target === overlay) overlay.remove(); });
}

//ANIMALS PAGE
const typeEmoji = {Dog: "🐶",dog: "🐶",Cat: "🐱",cat: "🐱"};
document.getElementById("animalForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const btn = e.target.querySelector("button[type=submit]");
  btn.textContent = "Adding…";
  btn.disabled = true;
  const name= document.getElementById("name").value.trim();
  const age= document.getElementById("age").value;
  const type = document.getElementById("type").value;
  const image_url= document.getElementById("image_url").value.trim();
  const desc= document.getElementById("desc").value.trim();
  fetch("http://localhost:3000/ngo/animals/add", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ngo_id: profile.ngo_id,
      name, type, age, image_url,
      description: desc
    })
  })
  .then(res => res.json())
  .then(data => {
    btn.textContent = "Add Animal";
    btn.disabled = false;
    if (data.error) { showToast(data.error, "error"); return; }
    showToast(`${typeEmoji[type] || "🐾"} ${name} added successfully!`, "success");
    e.target.reset();
    loadAnimals();
  })
  .catch(err => {
    btn.textContent = "Add Animal";
    btn.disabled = false;
    console.error(err);
    showToast("Could not reach server.", "error");
  });
});

function loadAnimals() {
  fetch(`http://localhost:3000/ngo/animals/${profile.ngo_id}`)
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById("animalList");
      if (!data || data.length === 0) {
        container.innerHTML = `
          <div class="empty-state" style="grid-column:1/-1">
            <div class="empty-icon">🐾</div>
            <p>No animals listed yet. Add your first one!</p>
          </div>`;
        return;
      }
      container.innerHTML = data.map(a => `
        <div class="card">
          <span class="card-emoji">${typeEmoji[a.type] || "🐾"}</span>
          <h3>${a.name}</h3>
          <div class="card-meta">
            ${a.image_url ? `<img src="${a.image_url}" alt="${a.name}" class="animal-img">` : ""}
            <div class="meta-row">Age: ${a.age != null ? a.age + ' yr' + (a.age != 1 ? 's' : '') : 'Unknown'}</div>
            <div class="meta-row"><span class="badge">${a.adoption_status}</span></div>
            ${a.description ? `<div class="meta-row" style="margin-top:4px;color:var(--text-muted);font-size:12px;">${a.description}</div>` : ''}
          </div>
          <button class="delete-btn-small" onclick="deleteAnimal(${a.animal_id}, '${a.name.replace(/'/g, "\\'")}')">Remove</button>
        </div>
      `).join('');
    })
    .catch(err => console.error("Animal load error:", err));
}

function deleteAnimal(animal_id, name) {
  showModal(
    "Remove Animal",
    `Are you sure you want to remove <strong>${name}</strong> from your list?`,
    "Remove",
    () => {
      fetch("http://localhost:3000/ngo/animals/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ animal_id, ngo_id: profile.ngo_id })
      })
      .then(res => res.json())
      .then(data => {
        if (data.error) { showToast(data.error, "error"); return; }
        showToast(`${name} removed.`, "info");
        loadAnimals();
      })
      .catch(err => console.error(err));
    },
    true
  );
}
loadAnimals();