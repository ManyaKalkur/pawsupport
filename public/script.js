function goTo(page) {
  window.location.href = page;
}
const images = [
  "../images/pup1.jpg",
  "../images/pup2.jpg",
  "../images/cat1.jpg",
  "../images/cat2.jpg"
];

let index = 0;

function changeBackground() {
  document.querySelector(".hero").style.backgroundImage = `url(${images[index]})`;
  index = (index + 1) % images.length;
}

setInterval(changeBackground, 3000);
changeBackground();