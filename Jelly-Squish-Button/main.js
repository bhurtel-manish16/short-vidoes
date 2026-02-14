// Made by Voicu Apostol //
// www.cerpow.com //
// Copyright (c) 2026 by Voicu Apostol (https://codepen.io/cerpow/pen/LEZYxqM)
const canvas = document.querySelector("canvas");
const loader = document.querySelector(".loader");
const description = document.querySelector("h1");
const ctx = canvas.getContext("2d");
let totalFrames = 215;
let startFrame = 70;
let images = new Array();
let currentFrame = -1;
let dragFrame = startFrame;
let displayFrame = startFrame;
let fps = 120;
let dragSensitivity = 5.2;
let smoothing = 0.11;
let startTime = Date.now();

// Preload images
function preloadImages(callback) {
  let loadedImages = 0;
  for (let i = 0; i < totalFrames; i++) {
    const img = new Image();
    img.src = `https://cerpow.github.io/cerpow-img/jelly/jelly_${i
      .toString()
      .padStart(5, "0")}.jpg`;
    img.onload = () => {
      if (++loadedImages === totalFrames) callback();
    };
    images[i] = img;
  }
}

// On load
window.onload = async () => {
  console.log(`Loading ${totalFrames} images from remote server...`);

  gsap.set(canvas, { y: startFrame / dragSensitivity });

  // GSAP Draggable
  Draggable.create(canvas, {
    trigger: ".drag-trigger",
    type: "y",
    inertia: true,
    bounds: { minY: 0, maxY: (totalFrames - 1) / dragSensitivity },
    allowNativeTouchScrolling: "x",
    dragResistance: isMobile.any ? 0.5 : 0.8,
    edgeResistance: 1,
    minDuration: 0.4,
    onDrag: function () {
      dragFrame = this.y * dragSensitivity;
    },
    onThrowUpdate: function () {
      dragFrame = this.y * dragSensitivity;
    }
  });

  setCanvasSize();
  window.addEventListener("resize", () => {
    setCanvasSize();
    currentFrame = -1;
  });

  preloadImages(() => {
    loader.classList.add("hide");
    setTimeout(() => {
      animate();
      canvas.classList.add("fadeIn");
      document.querySelector(".bottom-controls").classList.add("fadeIn");
    }, 350);
  });

  // Follow mouse
  const followMouseCheckbox = document.getElementById("followMouseCheckbox");
  let followMouse = false;

  followMouseCheckbox.addEventListener("change", (e) => {
    followMouse = e.target.checked;
    if (followMouse) {
      Draggable.get(canvas).disable();
    } else {
      Draggable.get(canvas).enable();
      gsap.set(canvas, { y: displayFrame / dragSensitivity });
      Draggable.get(canvas).update();
    }
  });

  window.addEventListener("mousemove", (e) => {
    if (followMouse) {
      const normalizedY = e.clientY / window.innerHeight;
      dragFrame = normalizedY * (totalFrames - 1);
    }
  });
};

// Canvas size
const setCanvasSize = () => {
  const ratio = window.devicePixelRatio || 1;

  // Force 4:3 aspect ratio
  const width = canvas.clientWidth;
  const height = width * (3 / 4);

  canvas.width = width * ratio;
  canvas.height = height * ratio;

  // Set CSS height
  canvas.style.height = `${height}px`;

  ctx.scale(ratio, ratio);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "medium";
};

// Update frames
function animate() {
  requestAnimationFrame(animate);

  // Calculate delta time
  const now = Date.now();
  const dt = (now - startTime) / 1000;
  startTime = now;

  // Dampening
  const dampening = 1.0 - Math.exp(-smoothing * 60 * dt);
  displayFrame += (dragFrame - displayFrame) * dampening;

  // Draw image
  const newFrame = resetWithinBounds(displayFrame);
  if (newFrame !== currentFrame && images[0]?.complete) {
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    ctx.drawImage(
      images[newFrame],
      0,
      0,
      canvas.clientWidth,
      canvas.clientHeight
    );
    currentFrame = newFrame;
  }
}

// Clamp frame
function resetWithinBounds(frame) {
  return Math.max(0, Math.min(totalFrames - 1, Math.floor(frame)));
}

gsap.config({ trialWarn: false });
// Made by Voicu Apostol //
// www.cerpow.com //
