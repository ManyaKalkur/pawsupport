const user    = JSON.parse(localStorage.getItem("user"));
const profile = JSON.parse(localStorage.getItem("profile"));

if (!user || user.role !== "donor") {
  window.location.replace("../../index.html");
}
window.addEventListener("pageshow", function (event) {
  if (event.persisted) window.location.reload();
});

document.getElementById("welcomeText").innerText = `Welcome, ${profile.name}! `;

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

function loadStats() {
  fetch(`http://localhost:3000/donor/stats/${profile.donor_id}`)
    .then(res => res.json())
    .then(data => {
      document.getElementById("totalDonations").innerText = data.total_donations;
      document.getElementById("totalAmount").innerText    = "₹ " + data.total_amount;
      document.getElementById("delivered").innerText      = data.delivered;
      document.getElementById("adoptionCount").innerText  = data.adoption_count;
    })
    .catch(err => console.error("Stats error:", err));
}
loadStats();

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
  overlay.className = "modal-overlay";
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
  overlay.querySelector("#modalCancel").onclick  = () => overlay.remove();
  overlay.querySelector("#modalConfirm").onclick = () => { overlay.remove(); onConfirm(); };
  overlay.addEventListener("click", e => { if (e.target === overlay) overlay.remove(); });
}