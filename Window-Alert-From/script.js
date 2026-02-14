const c = document.querySelector('#c')
const ctx = c.getContext('2d')

const dpr = Math.min(2, window.devicePixelRatio)

c.style.imageRendering = 'pixelated'
c.style.width = '100vw'
c.style.height = '100vh'

let prevTime = 0

const setup = () => {
  c.width = window.innerWidth * dpr
  c.height = window.innerHeight * dpr
  
  ctx.fillStyle = '#008080'
ctx.fillRect(0, 0, c.width, c.height);
}

const b = 4;
const b2 = b * 2;

const drawWindow = (x, y, w, h) => {
  const cx = x + w / 2;
  const cy = y + h / 2;

  ctx.beginPath()
  ctx.rect(x, y, w, h);
  ctx.fillStyle = 'darkgray';
  ctx.fill()

  ctx.strokeStyle = 'black'
  ctx.stroke();
  ctx.closePath()

  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x + w, y)
  ctx.lineTo(x + w - b, y + b)
  ctx.lineTo(x + b, y + h - b)
  ctx.lineTo(x, y + h)
  ctx.lineTo(x, y)
  ctx.closePath()
  ctx.fillStyle = 'white';
  ctx.fill()

  ctx.fillStyle = 'lightgray';
  ctx.fillRect(x + b, y + b, w - b2, h - b2);
}

const text = `The alert dialog should be used for messages which do not require any response on the part of the user, other than the acknowledgement of the message.

Dialog boxes are modal windows - they prevent the user from accessing the rest of the program's interface until the dialog box is closed. For this reason, you should not overuse any function that creates a dialog box (or modal window).

Alternatively <dialog> element can be used to display alerts. 
`;

const drawAlert = (x, y) => {
  const w = 500;
  const h = 250;

  const cx = x + w / 2;
  const cy = y + h / 2;
  
  drawWindow(x, y, w, h)
  
  const bw = 150;
  const by = 200;

  drawWindow(cx - bw /2, y + h - 70, bw, 40)

  ctx.fillStyle = 'black';
  ctx.font = '26px Tahoma';
  ctx.textAlign = 'center'
  ctx.fillText('Ok', cx, y + h - 40)
  
  const gradient = ctx.createLinearGradient(x, y, x + w, y);
  gradient.addColorStop(0, '#000080')
  gradient.addColorStop(1, '#ADD8E6')

  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.rect(x + b, y + b, w - b2, 40)
  ctx.fill()
  

  ctx.fillStyle = 'white';
  ctx.font = 'bold 26px Tahoma';
  ctx.textAlign = 'left'
  ctx.fillText('Alert', x + 16, y + 35)

  ctx.fillStyle = 'black';
  ctx.font = '26px Tahoma';
  ctx.textAlign = 'center'
  const t = performance.now() / 500;
  const tw = 30;
  const start = Math.floor(t) % text.length;
  ctx.fillText(text.substr(start, tw), cx, cy)
}

const animate = (time) => {
  requestAnimationFrame(animate)
  const delta = time - prevTime

  ctx.resetTransform();
  
  const cx = c.width / 2;
  const cy = c.height / 2;
  const t = time / 100000;
  
  const x = Math.cos(t * 117) * Math.cos(t * 10) * cx/2 - 250;
  const y = Math.sin(t * 113) * Math.sin(t * 10) * cy/2 - 100;
  
  ctx.translate(cx, cy)
  
  ctx.rotate(Math.sin(t * 100))
  
  drawAlert(x, y)
  
  prevTime = time 
}

window.addEventListener('resize', () => {
  setup()
})

setup()

requestAnimationFrame(animate);