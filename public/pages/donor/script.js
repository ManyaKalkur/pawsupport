const user    = JSON.parse(localStorage.getItem("user"));
const profile = JSON.parse(localStorage.getItem("profile"));

if (!user || user.role !== "donor") {
  window.location.replace("../../index.html");
}
window.addEventListener("pageshow", function (event) {
  if (event.persisted) window.location.reload();
});

const welcome = document.getElementById("welcomeText");
if (welcome) {
  welcome.innerText = `Welcome, ${profile.name}!`;
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

//DONOR PAGE
let selectedNGO    = null;
let pendingRequest = null;

function showSection(type) {
  document.getElementById("ngoSection").classList.add("hidden");
  document.getElementById("requestSection").classList.add("hidden");
  if (type === "ngo") {
    document.getElementById("ngoSection").classList.remove("hidden");
  } else {
    document.getElementById("requestSection").classList.remove("hidden");
    loadRequests();
  }
}

function toggleDropdown() {
  const dropdown = document.getElementById("ngoOptions");
  dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
}

document.addEventListener("click", function (e) {
  const dropdown = document.getElementById("ngoOptions");
  const header = document.querySelector(".dropdown-header");
  if (!header.contains(e.target) && !dropdown.contains(e.target)) {
    dropdown.style.display = "none";
  }
});

function loadNGOs() {
  fetch("http://localhost:3000/ngos")
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById("ngoOptions");
      container.innerHTML = "";
      data.forEach(ngo => {
        const div = document.createElement("div");
        div.innerText = `${ngo.name} (${ngo.city})`;
        div.onclick = () => {
          selectedNGO = ngo.ngo_id;
          document.getElementById("selectedNGO").innerText = div.innerText;
          container.style.display = "none";
        };
        container.appendChild(div);
      });
    })
    .catch(err => console.error("NGO load error:", err));
}

function loadRequests() {
  const container = document.getElementById("ngoRequests");
  container.innerHTML = "Loading...";
  fetch("http://localhost:3000/donation-requests")
    .then(res => res.json())
    .then(data => {
      container.innerHTML = "";
      if (!data || data.length === 0) {
        container.innerHTML = "<p>No active requests</p>";
        return;
      }
      data.forEach(req => {
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
          <h3>${req.title}</h3>
          <p>${req.description}</p>
          <p>Quantity: ${req.quantity}</p>
          <p><b>${req.ngo_name}</b> (${req.ngo_city})</p>
          <button>Donate</button>
        `;
        card.querySelector("button").onclick = () => {
          confirmDonation(req.request_id, req.ngo_id, req.quantity, req.request_type);
        };
        container.appendChild(card);
      });
    })
    .catch(err => {
      container.innerHTML = "Error loading requests";
      console.error(err);
    });
}

function makeDonation() {
  if (!selectedNGO) {
    alert("Select an NGO first");
    return;
  }
  if (document.getElementById("type").value === "") {
    alert("Select a donation type");
    return;
  }
  const donation_type= document.getElementById("type").value;
  const amount = document.getElementById("amount").value.trim();
  if (amount === "") {
    alert("Enter an amount");
    return;
  }
  const description= document.getElementById("desc").value;
  fetch("http://localhost:3000/donate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      donor_id: profile.donor_id,
      ngo_id: selectedNGO,
      donation_type,
      amount,
      description
    })
  })
  .then(res => res.json())
  .then(data => {
    if (data.error) { alert(data.error); return; }
    showSuccessModal("Thank you for helping animals in need!");
  })
  .catch(err => console.error("Donate error:", err));
}

function confirmDonation(request_id, ngo_id, quantity, type) {
  pendingRequest = { request_id, ngo_id, quantity, type };
  document.getElementById("donatePopup").classList.remove("hidden");
}

document.addEventListener("DOMContentLoaded", () => {
  loadNGOs();
  document.getElementById("cancelBtn").onclick = () => {
    document.getElementById("donatePopup").classList.add("hidden");
    pendingRequest = null;
  };
  document.getElementById("yesBtn").onclick = () => {
    if (!pendingRequest) return;
    fetch("http://localhost:3000/donate/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        donor_id: profile.donor_id,
        ngo_id: pendingRequest.ngo_id,
        request_id: pendingRequest.request_id,
        donation_type: pendingRequest.type,
        amount: pendingRequest.quantity
      })
    })
    .then(res => res.json())
    .then(data => {
      document.getElementById("donatePopup").classList.add("hidden");
      if (data.error) { alert(data.error); return; }
      showSuccessModal("Thank you for helping animals in need!");
      pendingRequest = null;
    })
    .catch(err => console.error("Request donate error:", err));
  };
});

function showSuccessModal(message) {
  const modal = document.getElementById("modal");
  modal.querySelector("p").innerText = message;
  modal.classList.remove("hidden");
  setTimeout(() => {
    modal.classList.add("hidden");
  }, 2000);
}

window.toggleDropdown = toggleDropdown;
window.showSection    = showSection;
window.makeDonation   = makeDonation;

//ADOPT PAGE
function loadAnimals() {
  fetch("http://localhost:3000/animals")
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById("animalGrid");
      container.innerHTML = "";
      if (!data || data.length === 0) {
        container.innerHTML = "<p>No animals available right now</p>";
        return;
      }
      data.forEach(animal => {
        container.innerHTML += `
          <div class="animal-card">
            <img src="${animal.image_url || 'https://placehold.co/300'}" alt="${animal.name}">
            <h2>${animal.name}</h2>
            <p>${animal.age} yrs • ${animal.gender}</p>
            <p><b>${animal.ngo_name}</b> (${animal.ngo_city})</p>
            <p>${animal.description}</p>
            <button onclick="openAdopt(${animal.animal_id})">Request Adoption</button>
          </div>
        `;
      });
    })
    .catch(err => console.error("Animal load error:", err));
}
loadAnimals();

let selectedAnimalId = null;
function openAdopt(id) {
  selectedAnimalId = id;
  document.getElementById("adoptDesc").value = "";
  document.getElementById("adoptPopup").classList.remove("hidden");
}
function closePopup() {
  const popup = document.getElementById("adoptPopup");
  if (popup) popup.classList.add("hidden");
  selectedAnimalId = null;
}
function submitAdoption() {
  if (!selectedAnimalId) {
    alert("No animal selected");
    return;
  }
  const req_desc = document.getElementById("adoptDesc").value;
  fetch("http://localhost:3000/adopt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      donor_id:  profile.donor_id,
      animal_id: selectedAnimalId,
      req_desc
    })
  })
  .then(res => res.json())
  .then(data => {
    if (data.error) { alert("Error: " + data.error); return; }
    showSuccessModal("We have received your adoption request! The shelter will contact you soon.");
    closePopup();
  })
  .catch(err => console.error("Adopt error:", err));
}

window.openAdopt      = openAdopt;
window.closePopup     = closePopup;
window.submitAdoption = submitAdoption;

//APPROVALS PAGE
function loadDonations() {
  const container = document.getElementById("donationsList");
  container.innerHTML = "Loading donations...";
  fetch(`http://localhost:3000/donations/${profile.donor_id}`)
    .then(res => res.json())
    .then(data => {
      if (!data || data.length === 0) {
        container.innerHTML = "No donations found";
        return;
      }
      container.innerHTML = "";
      data.forEach(d => {
        const div = document.createElement("div");
        div.className = "card";
        const statusClass = d.status.toLowerCase();
        div.innerHTML = `
          <h3>Donation #${d.donation_id}</h3>
          <p><b>Request ID:</b> ${d.request_id || "Direct Donation"}</p>
          <p><b>Type:</b> ${d.donation_type}</p>
          <p><b>Amount:</b> ${d.amount}</p>
          <p><b>NGO ID:</b> ${d.ngo_id}</p>
          <p><b>Status:</b> <span class="status ${statusClass}">${d.status}</span></p>
        `;
        container.appendChild(div);
      });
    })
    .catch(err => {
      container.innerHTML = "Error loading donations";
      console.error(err);
    });
}

function loadAdoptions() {
  const container = document.getElementById("adoptionsList");
  container.innerHTML = "Loading adoptions...";
  fetch(`http://localhost:3000/adoptions/${profile.donor_id}`)
    .then(res => res.json())
    .then(data => {
      if (!data || data.length === 0) {
        container.innerHTML = "No adoptions found";
        return;
      }
      container.innerHTML = "";
      data.forEach(a => {
        const div = document.createElement("div");
        div.className = "card";
        const statusClass = a.status.toLowerCase();
        div.innerHTML = `
          <h3>Adoption #${a.request_id}</h3>
          <p><b>Animal ID:</b> ${a.animal_id}</p>
          <p><b>Status:</b> <span class="status ${statusClass}">${a.status}</span></p>
        `;
        container.appendChild(div);
      });
    })
    .catch(err => {
      container.innerHTML = "Error loading adoptions";
      console.error(err);
    });
}

document.addEventListener("DOMContentLoaded", () => {
  loadDonations();
  loadAdoptions();
});
