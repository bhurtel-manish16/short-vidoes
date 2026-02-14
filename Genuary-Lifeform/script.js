import * as THREE from "three";
import {OrbitControls} from "three/addons/controls/OrbitControls.js";
import * as BGU from "three/addons/utils/BufferGeometryUtils.js";

console.clear();

const gu = {
  time: {value: 0}
}

// https://discourse.threejs.org/t/wireframe-of-quads/17924
const ToQuads = (g) => {
  let p = g.parameters;
  let segmentsX = (g.type == "TorusGeometry" ? p.tubularSegments : p.radialSegments) || p.widthSegments || p.thetaSegments || (p.points.length - 1) || 1;
  let segmentsY = (g.type == "TorusGeometry" ? p.radialSegments : p.tubularSegments) || p.heightSegments || p.phiSegments || p.segments || 1;
  let indices = [];
  for (let i = 0; i < segmentsY + 1; i++) {
    let index11 = 0;
    let index12 = 0;
    for (let j = 0; j < segmentsX; j++) {
      index11 = (segmentsX + 1) * i + j;
      index12 = index11 + 1;
      let index21 = index11;
      let index22 = index11 + (segmentsX + 1);
      indices.push(index11, index12);
      if (index22 < ((segmentsX + 1) * (segmentsY + 1) - 1)) {
        indices.push(index21, index22);
      }
    }
    if ((index12 + segmentsX + 1) <= ((segmentsX + 1) * (segmentsY + 1) - 1)) {
      indices.push(index12, index12 + segmentsX + 1);
    }
  }
  g.setIndex(indices);
}

class SeaBed extends THREE.LineSegments{
  constructor(){
    const g = new THREE.PlaneGeometry(100, 100, 400, 400).rotateX(-Math.PI * 0.5).rotateY(Math.PI * 0.25);
    ToQuads(g);
    const m = new THREE.MeshBasicMaterial({
      color: "#048",
      onBeforeCompile: shader => {
        shader.uniforms.time = gu.time;
        shader.vertexShader = `
          uniform float time;
          varying float vN;
          varying vec3 vPos;
          ${noise}
          ${shader.vertexShader}
        `.replace(
          `#include <begin_vertex>`,
          `#include <begin_vertex>
          float t = time;
          float posX = position.x - mod(t, 2. * sqrt(2.)); // loop "back and forth"
          transformed.x = posX;
          float xShift = posX + t;
          float n = snoise(vec2(xShift, position.z) * 0.1);
          //n = abs(n);
          vN = n;
          transformed.y = n * 1.;
          vPos = transformed;
          `
        );
        shader.fragmentShader = `
          varying float vN;
          varying vec3 vPos;
          ${shader.fragmentShader}
        `.replace(
          `vec4 diffuseColor = vec4( diffuse, opacity );`,
          `
          vec3 col = mix(diffuse, vec3(0, 0.75, 1), 1. - smoothstep(-0.5, 0., vN));
          col += vec3(0, 0.2, 0.1) * (1. - smoothstep(10., 15., length(vPos)));
          vec4 diffuseColor = vec4( col, opacity );`
        );
        //console.log(shader.fragmentShader)
      }
    });
    super(g, m);
    this.position.y = -5;
  }
}

class Background extends THREE.Mesh{
  constructor(){
    const g = new THREE.SphereGeometry(300);
    const m = new THREE.MeshBasicMaterial({
      side: THREE.BackSide,
      fog: false,
      color: "white",
      
      map: (() => {
        const c = document.createElement("canvas");
        c.width = 1; c.heihgt = 1024;
        const ctx = c.getContext("2d");
        
        const grd = ctx.createLinearGradient(0, 0, 0, c.height);
        grd.addColorStop(0.1, "#044");
        grd.addColorStop(0.4, "#" + scene.background.getHexString());
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, c.width, c.height);

        const tex = new THREE.CanvasTexture(c);
        tex.colorSpace = "srgb";
        tex.anisotropy = 16;
        return tex;
      })()
      
    });
    super(g, m);
  }
}

class WaterStuff extends THREE.Group{
  constructor(){
    super();
    
    this.items = Array.from({length: 50}, () => {
      const item = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.25, 2, 3, 7, 3),
        new THREE.MeshBasicMaterial({wireframe: true, color: "#068"})
      );
      this.setRandom(item, 50 - Math.random() * 100);
      this.add(item);
      return item;
    })
  }
  
  setRandom(o, x){
    const a = Math.PI * Math.random();
    const r = 5 + Math.random() * 10;
    o.position.set(
      x,
      Math.sin(a) * r,
      Math.cos(a) * r
    );
    o.rotation.setFromVector3(new THREE.Vector3().random().multiplyScalar(Math.PI * 2));
    o.scale.y = 1 + (Math.random() - 0.5) * 1.5;
  }
  
  update(dt){
    const lim = 50;
    this.items.forEach(item => {
      let iPos = item.position.x - dt;
      item.position.x = iPos;
      if(iPos < -lim){
        iPos = (iPos + lim) % 100;
        this.setRandom(item, lim + iPos);
      }
    })
  }
}

class Thing extends THREE.Group{
  constructor(){
    super();

    const gBase = new THREE.SphereGeometry(3, 64, 32);
    
    const gLines = new THREE.EdgesGeometry(gBase, 0.5);
    const mLines = new THREE.LineBasicMaterial({color: "#8ff", transparent: true, opacity: 0.75});
    const lines = new THREE.LineSegments(gLines, mLines);
    this.add(lines);
    
    const gPoints = BGU.mergeVertices(gBase.clone().deleteAttribute("uv").deleteAttribute("normal"));
    const mPoints = new THREE.PointsMaterial({color: "#0ff",size: 0.1, transparent: true});
    const points = new THREE.Points(gPoints, mPoints);
    this.add(points);
    
    [mLines, mPoints].forEach(m => {
      //console.log(m.type)
      m.onBeforeCompile = shader => {
        shader.uniforms.time = gu.time;
        shader.vertexShader = `
          uniform float time;
          varying vec3 vPos;
          mat2 rot(float a){return mat2(cos(a), sin(a), -sin(a), cos(a));}
          ${shader.vertexShader}
        `.replace(
          `#include <begin_vertex>`,
          `#include <begin_vertex>
          
            vec3 pos = position;
            vPos = pos;
            
            pos.y *= 0.05; // thickness
            
            float a = atan(pos.z, pos.x);
            float s = cos(a * 4.);
            float r = s * 0.125 + 0.875;
            pos.xz *= r; // 4 "petals"
            
            pos.x -= (smoothstep(0., 3., pos.x)) * 0.75; // squeezed front
            
            float syncWave = sin(time * 1.25 + pos.x);
            
            float zSwaying = smoothstep(0.25, 2., abs(pos.z));
            mat2 zRot = rot(PI * 0.1 * zSwaying * syncWave * sign(pos.z));
            pos.yz *= zRot; // wing swaying
            
            pos.y += syncWave * 0.5 * ((1. - smoothstep(-3., 3., position.x)) * 0.5 + 0.5); // body waving

            transformed = pos;
          
          `
        );
        
        if(m.type == "PointsMaterial") {
          shader.fragmentShader = `
            varying vec3 vPos;
            ${shader.fragmentShader}
          `.replace(
            `vec4 diffuseColor = vec4( diffuse, opacity );`,
            `
            vec2 uv = gl_PointCoord - 0.5;
            float pl = length(uv);
            float fw = length(fwidth(uv));
            float f = 1. - smoothstep(0.5 - fw, 0.5, pl);
            
            if (pl > 0.5) discard;
            
            vec3 bodyColor = mix(vec3(1), diffuse, smoothstep(2., 1., vPos.x));
            vec3 col = mix(bodyColor, diffuse, smoothstep(0.5, 1.0, abs(vPos.z)));
            
            vec4 diffuseColor = vec4( col, opacity * f );
            `
          );
          //console.log(shader.fragmentShader)
        }
      }
    })
    
    this.position.y = 1;
  }
}


const scene = new THREE.Scene();
scene.background = new THREE.Color("#024");
scene.fog = new THREE.Fog(scene.background, 8, 30);
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 500);
camera.position.set(0.5, 0.25, -1).setLength(7.25);
const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setPixelRatio(devicePixelRatio);
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.maxDistance = 15;
controls.maxPolarAngle = Math.PI * 0.6;

const background = new Background();
scene.add(background);

const thing = new Thing();
scene.add(thing);
const seaBed = new SeaBed();
scene.add(seaBed);
const waterStuff = new WaterStuff();
scene.add(waterStuff);

const clock = new THREE.Clock();
let t = 0;

renderer.setAnimationLoop(() => {
  const dt = clock.getDelta();
  t += dt;
  gu.time.value = t * 1.25;
  controls.update();
  
  waterStuff.update(dt);
  
  renderer.render(scene, camera);
})