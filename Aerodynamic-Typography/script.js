import Matter from "https://esm.sh/matter-js";
const { Engine, Runner, Bodies, Composite, Events, Body } = Matter;

const engine = Engine.create();
engine.positionIterations = 8;
engine.velocityIterations = 8;

const world = engine.world;
world.gravity.y = 0.5;

const scene = document.getElementById("scene");
const fanBlades = document.getElementById("fan-blades");
const resetBtn = document.getElementById("reset-btn");
const letters = "LETTERS".split("");
const gap = 8;

const typographyBodies = [];
let windForce = 0;
let bladeRotation = 0;

const wallOptions = { isStatic: true, friction: 0.1, restitution: 0.2 };

let ground, ceiling, leftWall, rightWall;

function createBoundaries() {
  const leftMargin = 240;
  const rightMaring = 60;
  const w = window.innerWidth - rightMaring;
  const h = window.innerHeight;
  const thickness = 500;

  if (ground) Composite.remove(world, [ground, ceiling, leftWall, rightWall]);

  ground = Bodies.rectangle(
  w / 2,
  h / 2 + thickness / 2,
  w + 1000,
  thickness,
  wallOptions);


  ceiling = Bodies.rectangle(
  w / 2,
  -thickness / 2,
  w + 1000,
  thickness,
  wallOptions);


  leftWall = Bodies.rectangle(
  leftMargin - thickness / 2,
  h / 2,
  thickness,
  h * 3,
  wallOptions);


  rightWall = Bodies.rectangle(
  w + thickness / 2,
  h / 2,
  thickness,
  h * 3,
  wallOptions);


  Composite.add(world, [ground, ceiling, leftWall, rightWall]);
}

createBoundaries();
window.addEventListener("resize", createBoundaries);

const startY = window.innerHeight / 2;

let totalWidth = 0;
const measuredLetters = letters.map(char => {
  const span = document.createElement("span");
  span.innerText = char;
  span.className = "letter";
  scene.appendChild(span);

  const rect = span.getBoundingClientRect();
  const w = rect.width;
  const h = rect.height;

  totalWidth += w;

  return { span, w, h };
});

let currentX = window.innerWidth / 2 - totalWidth / 2;

measuredLetters.forEach(letter => {
  const { span, w, h } = letter;
  const bodyX = currentX + w / 2;

  const body = Bodies.rectangle(
  bodyX,
  startY,
  w,
  h,
  {
    density: 0.005,
    frictionAir: 0.03,
    friction: 0.2,
    restitution: 0.4 });



  typographyBodies.push({
    dom: span,
    body: body,
    initialX: bodyX,
    initialY: startY,
    w: w,
    h: h });


  Composite.add(world, body);
  currentX += w + gap;
});

window.addEventListener("wheel", e => {
  windForce += e.deltaY * 0.00015;
  windForce = Math.max(-0.2, Math.min(0.2, windForce));
});

resetBtn.addEventListener("click", () => {
  windForce = 0;
  typographyBodies.forEach(({ body, initialX, initialY }) => {
    Body.setVelocity(body, { x: 0, y: 0 });
    Body.setAngularVelocity(body, 0);
    Body.setAngle(body, 0);
    Body.setPosition(body, { x: initialX, y: initialY });
  });
});

Events.on(engine, "beforeUpdate", () => {
  windForce *= 0.94;
  typographyBodies.forEach(({ body }) => {
    Body.applyForce(body, body.position, { x: windForce, y: 0 });
  });
  bladeRotation += windForce * 500;
  fanBlades.style.transform = `rotate(${bladeRotation}deg)`;
});

Events.on(engine, "afterUpdate", () => {
  typographyBodies.forEach(item => {
    const { dom, body, initialY, w, h } = item;

    if (!item.energy) item.energy = 1;

    if (body.position.y > window.innerHeight + 100) {
      Body.setPosition(body, { x: body.position.x, y: initialY });
      Body.setVelocity(body, { x: 0, y: 0 });
    }

    const x = body.position.x - w / 2;
    const y = body.position.y - h / 2;

    dom.style.transform = `translate(${x}px, ${y}px) rotate(${body.angle}rad)`;

    const speed = Math.abs(body.velocity.x);

    item.energy += speed * 10;
    item.energy *= 0.9;

    let targetWeight = 900 - item.energy;
    targetWeight = Math.max(100, Math.min(900, targetWeight));

    dom.style.fontWeight = Math.round(targetWeight);
  });
});

const runner = Runner.create();
Runner.run(runner, engine);