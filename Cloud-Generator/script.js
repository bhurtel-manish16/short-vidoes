const cloud = document.querySelector(".cloud");
let isDragging = false;
let offsetX = 0;
let offsetY = 0;
let startMouseX, startMouseY;

cloud.addEventListener("mousedown", (e) => {
  const rect = cloud.getBoundingClientRect();
  const scrollbarWidth = cloud.offsetWidth - cloud.clientWidth;
  const resizeHandleSize = 50;

  if (e.clientX > rect.right - scrollbarWidth - resizeHandleSize) return;
  if (e.clientY > rect.bottom - resizeHandleSize) return;

  isDragging = true;
  startMouseX = e.clientX;
  startMouseY = e.clientY;
});

document.addEventListener("mousemove", (e) => {
  if (!isDragging) return;

  const deltaX = e.clientX - startMouseX;
  const deltaY = e.clientY - startMouseY;

  cloud.style.transform = `translate(calc(-50% + ${
    offsetX + deltaX
  }px), calc(-50% + ${offsetY + deltaY}px))`;
});

document.addEventListener("mouseup", (e) => {
  if (isDragging) {
    const deltaX = e.clientX - startMouseX;
    const deltaY = e.clientY - startMouseY;
    offsetX += deltaX;
    offsetY += deltaY;
  }
  isDragging = false;
});

const weatherSlider = document.getElementById("weatherSlider");
const skyBackground = document.querySelector(".sky-background");
const shadow2 = document.getElementById("shadow2");
const shadow3 = document.getElementById("shadow3");
const shadow4 = document.getElementById("shadow4");
const shadow5 = document.getElementById("shadow5");
const lightningGlow = document.querySelector(".lightning-glow");

let lightningInterval = null;

function lerp(start, end, t) {
  return start + (end - start) * t;
}

function updateWeather(value) {
  const t = value / 100;

  if (value == 100) {
    if (!lightningInterval) {
      scheduleLightning();
    }
  } else {
    if (lightningInterval) {
      clearTimeout(lightningInterval);
      lightningInterval = null;
    }
  }

  const saturation = lerp(100, 30, t);
  const brightness = lerp(100, 50, t);
  skyBackground.style.filter = `saturate(${saturation}%) brightness(${brightness}%)`;

  const shadow2Opacity = lerp(0, 0.4, t);
  shadow2.setAttribute("flood-opacity", shadow2Opacity);

  const shadow3Opacity = lerp(0.1, 0.4, t);
  shadow3.setAttribute("flood-opacity", shadow3Opacity);

  const shadow4Opacity = lerp(0.2, 0.6, t);
  shadow4.setAttribute("flood-opacity", shadow4Opacity);

  const shadow5Opacity = lerp(0.2, 0.7, t);
  shadow5.setAttribute("flood-opacity", shadow5Opacity);
}

weatherSlider.addEventListener("input", (e) => {
  updateWeather(e.target.value);
});

updateWeather(0);

function triggerLightning() {
  const cloudRect = cloud.getBoundingClientRect();

  const randomX = (Math.random() - 0.5) * (cloudRect.width * 0.6);
  const randomY = Math.random() * (cloudRect.height * 0.3);

  lightningGlow.style.setProperty("--lightning-x", `${randomX}px`);
  lightningGlow.style.setProperty("--lightning-y", `${randomY}px`);

  lightningGlow.classList.remove("flash");
  void lightningGlow.offsetWidth;
  lightningGlow.classList.add("flash");

  setTimeout(() => {
    lightningGlow.classList.remove("flash");
  }, 800);
}

function scheduleLightning() {
  const randomDelay = 300 + Math.random() * 1200;

  lightningInterval = setTimeout(() => {
    triggerLightning();
    scheduleLightning();
  }, randomDelay);
}