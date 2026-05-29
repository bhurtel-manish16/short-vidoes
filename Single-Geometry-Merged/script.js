import * as THREE from "three";
import {OrbitControls} from "three/addons/controls/OrbitControls.js";
import * as BGU from "three/addons/utils/BufferGeometryUtils.js";

console.clear();

class WeirdStructure extends THREE.Mesh{
  constructor(){
    const gs = [];
    const pt0 = new THREE.Vector3();
    const pt1 = new THREE.Vector3();
    const dir = new THREE.Matrix4();
    const up = new THREE.Vector3(0, 1, 0);
    
    const setColor = (g, color) => {
      const c = color.isColor ? color : new THREE.Color(color);
      g.setAttribute("color", new THREE.Float32BufferAttribute(
        Array.from({length: g.attributes.position.count}, () => {return [...c]}).flat(),
        3
      ))
      return g;
    }
    
    const setLine = (p0, p1, color = "white", d = 0.05) => {
      dir.lookAt(p0, p1, up);
      const dist = pt0.distanceTo(pt1);
      const g = new THREE.CylinderGeometry(d, d, dist, 8)
        .translate(0, dist * 0.5, 0)
        .rotateX(-Math.PI * 0.5)
        .applyMatrix4(dir)
        .translate(...p0)
        .toNonIndexed();
      setColor(g, color);
      return g;
    }
    
    const setSphere = (p, r = 0.1, color = "white") => {
      const g = new THREE.IcosahedronGeometry(r, 1).translate(...p);
      setColor(g, color);
      return g;
    }

    for(let i = 0; i < 10; i++){
      const endShift = (i * 0.5 + 1);
      pt0.set(0, endShift, i);
      
      pt1.set(endShift * (i % 2 == 0 ? 1 : -1), 0, i);
      const joist = BGU.mergeGeometries([
        setLine(pt0, pt1, "black"),
        setLine(pt0, pt1.clone().setX(-pt1.x), "black")
      ]);
      
      // endpoints
      const g0 = setSphere(pt0, 0.25, "white");
      const g1 = setSphere(pt1, 0.25, "white");
      const g2 = setSphere(pt1.clone().setX(-pt1.x), 0.25, "white");
      
      const arc = new THREE.TorusGeometry(endShift, 0.025, 8, 64, Math.PI)
        .translate(0, 0, i)
        .toNonIndexed();
      setColor(arc, "black");
      
      gs.push(BGU.mergeGeometries([joist, g0, g1, g2, arc]));
    }
    
    // rails
    gs.push(
      setLine(new THREE.Vector3(0.5, 0, 9), new THREE.Vector3(0.5, 0, 0), "white"),
      setLine(new THREE.Vector3(-0.5, 0, 9), new THREE.Vector3(-0.5, 0, 0), "white")
    )
    
    // fir-tree
    const firParts = 36;
    const r = 1;
    const h = 3;
    const turns = 2;
    const fullAngle = Math.PI * 2 * turns;
    const fir = BGU.mergeGeometries(Array.from({length: firParts}, (_, idx) => {
      const a = idx / (firParts);
      const aInv = 1. - a;
      const radius = r * aInv;
      const height = h * a;
      const angle = fullAngle * a;
      pt0.set(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
      pt1.set(Math.cos(angle + Math.PI) * radius, height, Math.sin(angle + Math.PI) * radius);
      return BGU.mergeGeometries([
        setLine(pt0, pt1, "green", 0.02 * aInv + 0.02), 
        setSphere(pt0, 0.05, "green"),
        setSphere(pt1, 0.05, "green")
      ]);
    }));
    
    gs.push(
      fir.clone().translate(-2, 0, 9),
      fir.clone().translate(2, 0, 9)
    );
    
    // lines
    for(let i = 0; i < 100; i++){
      const basePoint = new THREE.Vector3().randomDirection().setLength(50);
      const dir = new THREE.Vector3().randomDirection().setLength((Math.random() * 0.5 + 0.5) * 2);
      pt0.copy(dir).add(basePoint);
      pt1.copy(dir).negate().add(basePoint);
      
      const line = BGU.mergeGeometries([
        setLine(pt0, pt1, "#888", 0.2),
        setSphere(pt0, 0.5, "red"),
        setSphere(pt1, 0.5, "blue")
      ]);
      
      gs.push(line);
    }
    
    const g = BGU.mergeGeometries(gs);
    g.translate(0, 0, -4.5);
    const m = new THREE.MeshPhongMaterial({
      shininess: 500,
      vertexColors: true
    });
    super(g, m);
  }
}

const scene = new THREE.Scene();
scene.background = new THREE.Color("#444");
const camera = new THREE.PerspectiveCamera(
  45,
  innerWidth / innerHeight,
  1,
  1000
);
camera.position.set(0, 0, 1).setLength(15);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(devicePixelRatio);
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);
addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

const camShift = new THREE.Vector3(0, 2, 0);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.object.position.add(camShift);
controls.target.add(camShift);

const light = new THREE.DirectionalLight(0xffffff, 1.5 * Math.PI);
light.position.setScalar(10);
light.castShadow = true;
light.shadow.mapSize.setScalar(1024);
scene.add(light, new THREE.AmbientLight(0xffffff, 0.5 * Math.PI));

const weirdStructure = new WeirdStructure();
scene.add(weirdStructure);

const clock = new THREE.Timer();
let t = 0;

renderer.setAnimationLoop(() => {
  clock.update();
  const dt = clock.getDelta();
  t += dt;

  controls.update();
  renderer.render(scene, camera);
});