document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const email    = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  fetch("http://localhost:3000/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  })
  .then(res => res.json())
  .then(data => {
    if (data.error) {
      alert(data.error);
      return;
    }

    const { user, profile } = data;

    localStorage.setItem("user",    JSON.stringify(user));
    localStorage.setItem("profile", JSON.stringify(profile));

    if (user.role === "donor") {
      window.location.href = "donor/dashboard.html";
    } else if (user.role === "ngo") {
      window.location.href = "ngo/dashboard.html";
    }
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