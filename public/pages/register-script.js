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
    alert("Donor Registered Successfully 🐾");
    window.location.href = "login.html";
  })
  .catch(err => {
    alert("Could not reach server. Is it running?");
    console.error(err);
  });
});

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
    alert("NGO Registered Successfully 🏢");
    window.location.href = "login.html";
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
