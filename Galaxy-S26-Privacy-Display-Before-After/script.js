const phone = document.getElementById('phone');
const screen = document.getElementById('screen');
const notif = document.getElementById('notif');
const angleVal = document.getElementById('angleVal');
const modeBtns = document.querySelectorAll('.mode-btn');
const snooper = document.getElementById('snooper');

const corners = ['tl', 'tr', 'bl', 'br'];
corners.forEach(c => {
  const cornerEl = document.createElement('div');
  cornerEl.className = `corner corner-${c}`;
  for (let i = 1; i <= 16; i++) {
    const layer = document.createElement('div');
    layer.className = 'c-layer';
    layer.style.transform = `translateZ(-${i}px)`;
    cornerEl.appendChild(layer);
  }
  phone.appendChild(cornerEl);
});

let mode = 'full';

modeBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    modeBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    mode = btn.dataset.mode;
  });
});

let targetRx = 0, targetRy = 0, targetPriv = 0;
let rx = 0, ry = 0, priv = 0;
let hasInteracted = false;
let time = 0;

function lerp(a, b, t) { return a + (b - a) * t; }

function tick() {
  if (!hasInteracted) {
    time += 0.015;
    targetRy = Math.sin(time) * 25; 
    targetRx = Math.cos(time * 0.8) * 15;
    
    let dist = Math.sqrt(targetRx * targetRx + targetRy * targetRy);
    let maxTilt = 40;
    let normDist = Math.min(dist / maxTilt, 1);
    
    targetPriv = Math.pow(normDist, 1.3) * 0.95;
    angleVal.textContent = Math.round(normDist * 85) + '\u00B0';
  }

  rx = lerp(rx, targetRx, 0.08);
  ry = lerp(ry, targetRy, 0.08);
  priv = lerp(priv, targetPriv, 0.1);

  phone.style.transform = 'rotateX(' + rx + 'deg) rotateY(' + ry + 'deg)';

  if (mode === 'full') {
    screen.style.setProperty('--priv-opacity', priv);
    notif.style.setProperty('--notif-priv', 0);
  } else {
    screen.style.setProperty('--priv-opacity', 0);
    notif.style.setProperty('--notif-priv', priv);
  }

  requestAnimationFrame(tick);
}

tick();

document.addEventListener('mousemove', function(e) {
snooper.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
  hasInteracted = true;
  var rect = phone.getBoundingClientRect();
  var cx = rect.left + rect.width / 2;
  var cy = rect.top + rect.height / 2;

  var dx = e.clientX - cx;
  var dy = e.clientY - cy;

  var maxDist = Math.min(window.innerWidth, window.innerHeight) * 0.45;
  var dist = Math.sqrt(dx * dx + dy * dy);
  var normDist = Math.min(dist / maxDist, 1);

  var maxTilt = 40;
  targetRy = (dx / maxDist) * maxTilt;
  targetRx = -(dy / maxDist) * maxTilt;
  targetRy = Math.max(-maxTilt, Math.min(maxTilt, targetRy));
  targetRx = Math.max(-maxTilt, Math.min(maxTilt, targetRx));

  var angle = Math.round(normDist * 85);
  targetPriv = Math.pow(normDist, 1.3) * 0.95;

  angleVal.textContent = angle + '\u00B0';
});

document.addEventListener('mouseleave', function() {
  targetRx = 0;
  targetRy = 0;
  targetPriv = 0;
  angleVal.textContent = '0\u00B0';
});

document.addEventListener('touchstart', function() {
  hasInteracted = true;
}, {passive: true});