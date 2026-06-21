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
      const statRequests = document.getElementById("statRequests");
      const statAnimals = document.getElementById("statAnimals");
      const statDonations = document.getElementById("statDonations");
      const statPending = document.getElementById("statPending");
      if (statRequests)
        statRequests.textContent = data.total_requests ?? "N/A";
      if (statAnimals)
        statAnimals.textContent = data.total_animals ?? "N/A";
      if (statDonations)
        statDonations.textContent = data.total_donations ?? "N/A";
      if (statPending)
        statPending.textContent = data.pending ?? "N/A";
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

//ASK PAGE
const requestEmoji = {money: "💰",food: "🥘", items: "📦"};
const requestForm = document.getElementById("requestForm");
if (requestForm) {
  document.getElementById("requestForm").addEventListener("submit", function (e) {
    e.preventDefault();
    const btn = e.target.querySelector("button[type=submit]");
    btn.textContent = "Submitting…"; btn.disabled = true;
    const title= document.getElementById("title").value.trim();
    const type = document.querySelector('input[name="reqType"]:checked').value.replace(/^./, c => c.toUpperCase());
    const quantity= document.getElementById("quantity").value;
    const desc= document.getElementById("desc").value.trim();
    fetch("http://localhost:3000/ngo/requests/create", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ ngo_id:profile.ngo_id, title, description:desc, request_type:type, quantity })
    })
    .then(r => r.json())
    .then(data => {
      btn.textContent = "Submit Request →"; btn.disabled = false;
      if (data.error) { showToast(data.error,"error"); return; }
      showToast("Request submitted!", "success");
      e.target.reset();
      loadMyRequests();
    })
    .catch(() => { btn.textContent="Submit Request"; btn.disabled=false; showToast("Could not reach server.","error"); });
  });
}

function loadMyRequests() {
  const c = document.getElementById("myRequests");
  if (!c) return;
  fetch(`http://localhost:3000/ngo/requests/${profile.ngo_id}`)
    .then(r => r.json())
    .then(data => {
      if (!data || data.length === 0) {
        c.innerHTML = `
          <div class="empty-state" style="grid-column:1/-1">
            <p>No requests yet. Create your first one now!</p>
          </div>
        `;
        return;
      }
      c.innerHTML = data.map(r => {
        const status = r.status || 'open';
        const canClose = status !== 'closed';
        return `
          <div class="card">
            <span class="card-emoji">${requestEmoji[r.request_type] || "📦"}</span>
            <h3>${r.title}</h3>
            <div class="card-meta">
              <div class="meta-row">
                <span class="badge">${capitalize(r.request_type)}</span>
              </div>
              <div>
                <span class="req-badge ${status}" style="margin-left:4px">${status}</span>
              </div>
              <div class="meta-row">Qty: ${r.quantity}</div>
              ${r.description ? `<div class="meta-row" style="margin-top:4px;color:white;font-size:12px;line-height:1.4">${r.description}</div>` : ''}
            </div>
            ${canClose ? `<button class="btn-close-req" onclick="closeRequest(${r.request_id})">Close Request</button>` : ''}
          </div>
        `;
      }).join('');
    })
    .catch(err => console.error("Load requests error:", err));
}

  function closeRequest(request_id) {
    showModal(
      "Close Request",
      "Are you sure you want to close this request? It will no longer be visible to donors.",
      "Close Request",
      () => {
        fetch("http://localhost:3000/ngo/requests/close", {
          method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ request_id, ngo_id: profile.ngo_id })
        })
        .then(r => r.json())
        .then(data => {
          if (data.error) { showToast(data.error,"error"); return; }
          showToast("Request closed.", "info");
          loadMyRequests();
        })
        .catch(() => showToast("Could not reach server.","error"));
      },
      true
    );
  }
  loadMyRequests();

//ANIMALS PAGE
const typeEmoji = {Dog: "🐶",dog: "🐶",Cat: "🐱",cat: "🐱"};
const animalForm = document.getElementById("animalForm");
if (animalForm) {
  animalForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const btn = e.target.querySelector("button[type=submit]");
    btn.textContent = "Adding…";
    btn.disabled = true;
    const name= document.getElementById("aname").value.trim();
    const age= document.getElementById("age").value;
    const type = document.getElementById("type").value;
    const gender = document.getElementById("gender").value;
    const image_url= document.getElementById("image_url").value.trim();
    const desc= document.getElementById("desc").value.trim();
    fetch("http://localhost:3000/ngo/animals/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ngo_id: profile.ngo_id,
        name, type, age, gender, image_url,
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
}

function loadAnimals() {
  const container = document.getElementById("animalList");
  if (!container) return;
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

//APPROVALS PAGE
function switchTab(tab, btn) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById(`tab-${tab}`).classList.add('active');
  if (tab === "donations") {
    renderDonationsList(allDonations);
  }
}
let allAdoptions = [];

function loadAdoptions() {
  if (!document.getElementById("adoptionsList")) return;
  fetch(`http://localhost:3000/ngo/adoption-requests/${profile.ngo_id}`)
    .then(r => r.json())
    .then(data => {
      allAdoptions = data || [];
      renderAdoptions(allAdoptions);
    })
    .catch(err => console.error(err));
}

function renderAdoptions(data) {
  const c = document.getElementById("adoptionsList");
  if (!data.length) {
    c.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><p>No adoption requests yet.</p></div>`;
    return;
  }
  c.innerHTML = data.map(r => `
    <div class="card">
      <div class="card-top">
        <div>
          <h3>🐾${r.animal_name} <span style="font-size:13px;color:white">(${r.animal_type})</span></h3>
          <div class="meta" style="margin-top:6px">
            <span>Donor: <strong style="color: white">${r.donor_name}</strong></span>
          </div>
          <div>
            <span>Date: <strong>${new Date(r.request_date).toLocaleDateString('en-IN')}</strong></span>
          </div>
        </div>
        <span class="badge-${r.status}">${r.status}</span>
      </div>
      ${r.req_desc? `<div style="font-size:12px; margin-top=30px;" class="desc">"${r.req_desc}"</div>` : ''}
      ${r.remarks? `<div style="font-size:10px;color:white">Remarks: ${r.remarks}</div>` : ''}
      ${r.status === 'pending' ? `
        <div class="action-row">
          <button class="btn-approve" onclick="respondAdoption(${r.request_id},'approved')">✅ Approve</button>
          <button class="btn-reject" onclick="respondAdoption(${r.request_id},'rejected')">❌ Reject</button>
        </div>` : ''}
    </div>
  `).join('');
}

function filterAdoptions(status, btn) {
  document.querySelectorAll('#tab-adoptions .filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderAdoptions(status === 'all' ? allAdoptions : allAdoptions.filter(r => r.status === status));
}

function respondAdoption(request_id, status) {
  showModal(
    status === 'approved' ? '✅ Approve Adoption' : '❌ Reject Adoption',
    status === 'approved'
      ? 'Approving will mark the animal as <strong>adopted</strong> and assign the donor automatically.'
      : 'This will reject the adoption request.',
    status === 'approved' ? 'Approve' : 'Reject',
    () => {
      fetch("http://localhost:3000/ngo/adoption-requests/respond", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ request_id, status })
      })
      .then(r => r.json())
      .then(data => {
        if (data.error) { showToast(data.error,"error"); return; }
        showToast(status === 'approved' ? 'Adoption approved! Animal marked as adopted.' : 'Adoption rejected.', "success");
        loadAdoptions();
      })
      .catch(() => showToast("Could not reach server.","error"));
    },
    status === 'rejected'
  );
}

let allDonations = [];
function loadDonations() {
  if (!document.getElementById("donationsList")) return;
  fetch(`http://localhost:3000/ngo/donations/${profile.ngo_id}`)
    .then(res => res.json())
    .then(data => {
      allDonations = data || [];
      if (document.getElementById("summaryBar")) {
        renderSummary(allDonations);
      }
      renderDonations(allDonations);
    })
    .catch(err => console.error("Donations load error:", err));
}

function renderDonations(data) {
  const c = document.getElementById("donationsList");
  if (!data.length) {
    c.innerHTML = `<div class="empty-state" style="grid-column:1/-1"></div><p>No donations yet.</p></div>`;
    return;
  }
  c.innerHTML = data.map(d => {
    const amountStr = d.donation_type === 'money'
      ? `₹${Number(d.amount).toLocaleString('en-IN')}`
      : `${d.amount} units`;
    let actions = '';
    if (d.status === 'pending') {
      actions = `
        <div class="action-row">
          <button class="btn-approve" onclick="updateDonation(${d.donation_id},'approved')">👍 Approve</button>
          <button class="btn-reject" onclick="updateDonation(${d.donation_id},'rejected')">❌ Reject</button>
        </div>`;
    } else if (d.status === 'approved') {
      actions = `
        <div class="action-row">
          <button class="btn-received" onclick="updateDonation(${d.donation_id},'received')">✅ Mark Received</button>
        </div>`;
    }
    const linkedInfo = d.request_id
      ? `<div class="linked-req-tag">
            Linked request: <strong>${d.request_id}</strong>
            <span class="badge-${d.request_status || 'open'}" style="margin-left:6px">${d.request_status || 'open'}</span>
          </div>`
      : `<div style="font-size:12px;color: white> Direct donation</div>`;
    return `<div class="card">
    <div class="card-top">
      <div>
        <h3>
          ${requestEmoji[d.donation_type]}
          ${capitalize(d.donation_type)}
          :
          <span style="color:white">${amountStr}</span>
        </h3>

        <div class="meta" style="margin-top:6px">
          <span>
            From:
            <strong style="color:white">
              ${d.donor_name || 'Unknown'}
            </strong>
          </span>
          <span>
            ${new Date(d.created_at).toLocaleDateString('en-IN')}
          </span>
        </div>
      </div>

      <span class="badge-${d.status}">
        ${d.status}
      </span>
    </div>
    ${linkedInfo}
    ${d.description
      ? `<div class="desc">"${d.description}"</div>`
      : ''
    }
    ${actions}
  </div>`;
  }).join('');
}

function filterDonations(status, btn) {
  document.querySelectorAll('#tab-donations .filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderDonations(status === 'all' ? allDonations : allDonations.filter(d => d.status === status));
}

function updateDonation(donation_id, status) {
  const cfg = {
    approved: { icon:'👍', label:'Approve', msg:'Approve this donation? The donor will see it as approved.' },
    rejected: { icon:'❌', label:'Reject', msg:'Reject this donation? This cannot be undone.' },
    received: { icon:'✅', label:'Mark as Received', msg:'Confirm you physically received this donation. If linked to a request, that request will be marked <strong>fulfilled</strong>.' }
  }[status];
  showModal(`${cfg.icon} ${cfg.label}`, cfg.msg, cfg.label, () => {
    fetch("http://localhost:3000/ngo/donations/update-status", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ donation_id, status })
    })
    .then(r => r.json())
    .then(data => {
      if (data.error) { showToast(data.error,"error"); return; }
      showToast(
        status === 'received' ? 'Donation received! Linked request marked fulfilled if applicable. ✅' : `Donation ${status}.`,
        "success"
      );
      loadDonations();
    })
    .catch(() => showToast("Could not reach server.","error"));
  }, status === 'rejected');
}
function capitalize(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; }
loadAdoptions();
loadDonations();

//REQUESTS PAGE
const typeClass = { money: "type-money", food: "type-food", items: "type-items" };
function renderSummary(data) {
  const total = data.length;
  const money = data.filter(d => d.donation_type === "money").length;
  const food  = data.filter(d => d.donation_type === "food").length;
  const items = data.filter(d => d.donation_type === "items").length;
  document.getElementById("summaryBar").innerHTML = `
    <div class="summary-item">
      <div class="s-icon">💝</div>
      <div class="s-info">
        <div class="s-label">Total</div>
        <div class="s-val">${total}</div>
      </div>
    </div>
    <div class="summary-item">
      <div class="s-icon">💰</div>
      <div class="s-info">
        <div class="s-label">Money</div>
        <div class="s-val">${money}</div>
      </div>
    </div>
    <div class="summary-item">
      <div class="s-icon">🥘</div>
      <div class="s-info">
        <div class="s-label">Food</div>
        <div class="s-val">${food}</div>
      </div>
    </div>
    <div class="summary-item">
      <div class="s-icon">📦</div>
      <div class="s-info">
        <div class="s-label">Items</div>
        <div class="s-val">${items}</div>
      </div>
    </div>
  `;
}

function renderDonationsList(data) {
  const c = document.getElementById("donationsList");
  if (!data || data.length === 0) {
    c.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <p>No donations received yet.</p>
      </div>
    `;
    return;
  }
  c.innerHTML = data.map(d => `
    <div class="card">
      <div class="card-top">
        <div>
          <h3>
            ${requestEmoji[d.donation_type] || "🎁"}
            ${capitalize(d.donation_type)}
          </h3>
          <div class="meta" style="margin-top:6px">
            <span>
              Amount:
              <strong style="color:white">
                ${formatAmount(d)}
              </strong>
            </span>
          </div>
          <div>
            <span>
              Date:<strong> ${new Date(d.created_at).toLocaleDateString('en-IN')}</strong>
            </span>
          </div>
          ${d.request_id
            ? `<div>
                 <span>
                   Request ID:
                   <strong>${d.request_id}</strong>
                 </span>
               </div>`
            : `<div>
                 <span>
                   Direct Donation
                 </span>
               </div>`
          }
        </div>
        <span class="badge-${d.status}">
          ${d.status}
        </span>
      </div>
      ${d.description
        ? `<div class="desc">
             "${d.description}"
           </div>`
        : ""
      }
      ${d.status === "requested"
        ? `
          <div class="action-row">
            <button class="btn-approve"
              onclick="updateDonation(${d.donation_id},'approved')">
              👍 Approve
            </button>

            <button class="btn-reject"
              onclick="updateDonation(${d.donation_id},'rejected')">
              ❌ Reject
            </button>
          </div>
        `
        : ""
      }
      ${d.status === "approved"
        ? `
          <div class="action-row">
            <button class="btn-received"
              onclick="updateDonation(${d.donation_id},'received')">
              ✅ Mark Received
            </button>
          </div>
        `
        : ""
      }
    </div>
  `).join("");
}

function filterDonations(filter, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const filtered =
  filter === "all"? allDonations : allDonations.filter(d => d.status === filter);
  renderDonationsList(filtered);
}

function formatAmount(d) {
  if (d.donation_type === 'money') return `₹${Number(d.amount).toLocaleString('en-IN')}`;
  return `${d.amount} units`;
}
function capitalize(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; }

//PROFILE PAGE
if (profile && document.getElementById("name")) {
  document.getElementById("name").value= profile.name || "";
  document.getElementById("email").value= user.email || "";
  document.getElementById("contact").value= profile.phone || "";
  document.getElementById("city").value= profile.city || "";
  document.getElementById("address").value= profile.address || "";
  document.getElementById("about").value= profile.about || "";
  document.getElementById("sidebarName").textContent =profile.name || "";
  document.getElementById("sidebarEmail").textContent =user.email || "";
}

const profileForm = document.getElementById("profileForm");
if (profileForm) {
  profileForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const btn = e.target.querySelector("button[type=submit]");
    btn.textContent = "Saving…";
    btn.disabled = true;
    const updates = {
      ngo_id: profile.ngo_id,
      phone: document.getElementById("contact").value.trim(),
      city: document.getElementById("city").value.trim(),
      address: document.getElementById("address").value.trim(),
      about: document.getElementById("about").value.trim()
    };
    fetch("http://localhost:3000/ngo/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates)
    })
    .then(res => res.json())
    .then(data => {
      btn.textContent= "Save Changes";
      btn.disabled = false;
      if (data.error) { showToast(data.error, "error"); return; }
      profile.phone= updates.phone;
      profile.city= updates.city;
      profile.address= updates.address;
      profile.about= updates.about;
      localStorage.setItem("profile", JSON.stringify(profile));
      showToast("Profile updated successfully!", "success");
    })
    .catch(err => {
      btn.textContent = "Save Changes";
      btn.disabled = false;
      console.error(err);
      showToast("Could not reach server.", "error");
    });
  });
}

function confirmDelete() {
  showModal(
    "⚠️ Delete Account",
    "This will permanently delete your account, animal listings, and all requests. This cannot be undone.",
    "Delete Forever",
    () => {
      fetch("http://localhost:3000/ngo/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.user_id })
      })
      .then(res=> res.json())
      .then(data=> {
        if (data.error) { showToast(data.error, "error"); return; }
        localStorage.clear();
        showToast("Account deleted. Goodbye!", "info");
        setTimeout(()=> window.location.href = "../../index.html", 1800);
      })
      .catch(err=> {
        console.error(err);
        showToast("Could not reach server.", "error");
      });
    },
    true
  );
}