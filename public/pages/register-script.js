function showForm(type) {
  document.getElementById("donorForm").style.display = type === "donor" ? "block" : "none";
  document.getElementById("ngoForm").style.display   = type === "ngo"   ? "block" : "none";
}

//Donor registration
document.getElementById("donorForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const name     = document.getElementById("d_name").value;
  const email    = document.getElementById("d_email").value;
  const password = document.getElementById("d_password").value;

  fetch("http://localhost:3000/register/donor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password })
  })
  .then(res => res.json())
  .then(data => {
    if (data.error) {
      alert("Error: " + data.error);
      return;
    }
    showToast("Donor Registered Successfully");
    setTimeout(() => {
      window.location.href = "login.html";
    }, 3000);
  })
  .catch(err => {
    alert("Could not reach server. Is it running?");
    console.error(err);
  });
});

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

//NGO registration
document.getElementById("ngoForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const name     = document.getElementById("n_name").value;
  const email    = document.getElementById("n_email").value;
  const phone    = document.getElementById("n_phone").value;
  const city     = document.getElementById("n_city").value;
  const reg_no   = document.getElementById("n_reg").value;
  const password = document.getElementById("n_password").value;

  fetch("http://localhost:3000/register/ngo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password, phone, city, reg_no })
  })
  .then(res => res.json())
  .then(data => {
    if (data.error) {
      alert("Error: " + data.error);
      return;
    }
    showToast("NGO Registered Successfully");
    setTimeout(() => {
      window.location.href = "login.html";
    }, 3000);
  })
  .catch(err => {
    alert("Could not reach server. Is it running?");
    console.error(err);
  });
});

const images = [
  "../../images/pup1.jpg",
  "../../images/pup2.jpg",
  "../../images/cat1.jpg",
  "../../images/cat2.jpg"
];

let index = 0;

function changeBackground() {
  document.querySelector("body").style.backgroundImage = `url(${images[index]})`;
  index = (index + 1) % images.length;
}
setInterval(changeBackground, 3000);
changeBackground();
