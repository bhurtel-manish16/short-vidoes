const U = v => ({ value: v });

const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene  = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

const mat = new THREE.ShaderMaterial({
  uniforms: {
    time:       U(0.0),
    res:        U(new THREE.Vector2(window.innerWidth, window.innerHeight)),
    uvScale:    U(1.4),
    uvOffX:     U(0.00),
    uvOffY:     U(0.5),
    depthStep:  U(0.75),
    rotSpeed:   U(0.00000001),
    outerIter:  U(40),
    innerIter:  U(3),
    sInit:      U(0.7),
    minFold:    U(1.2),
    foldStr:    U(15.0),
    foldOff:    U(3.5),
    foldBX:     U(0.65),
    foldBY:     U(1.40),
    foldBZ:     U(2.00),
    modScale:   U(7.00),
    sLogMul:    U(0.2),
    brightness: U(440.0),
    hueOff:     U(0.78),
    hueScale:   U(.55),
    satMult:    U(0.50),
  },

  vertexShader: `void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }`,

  fragmentShader: `
    precision highp float;
    uniform float time;
    uniform vec2  res;
    uniform float uvScale;
    uniform float uvOffX;
    uniform float uvOffY;
    uniform float depthStep;
    uniform float rotSpeed;
    uniform int   outerIter;
    uniform int   innerIter;
    uniform float sInit;
    uniform float minFold;
    uniform float foldStr;
    uniform float foldOff;
    uniform float foldBX;
    uniform float foldBY;
    uniform float foldBZ;
    uniform float modScale;
    uniform float sLogMul;
    uniform float brightness;
    uniform float hueOff;
    uniform float hueScale;
    uniform float satMult;

    #define MAX_OUTER 200
    #define MAX_INNER  40

    vec3 hsv(float h, float s, float v){
      vec4 K = vec4(1., 2./3., 1./3., 3.);
      vec3 p = abs(fract(vec3(h) + K.xyz) * 6. - K.www);
      return v * mix(K.xxx, clamp(p - K.xxx, 0., 1.), s);
    }
    mat2 rotate2D(float a){ float c=cos(a),s=sin(a); return mat2(c,-s,s,c); }

    void main(){
      vec4  o = vec4(0.0);
      vec2 FC = gl_FragCoord.xy;
      float t = time;
      float g = 0.0;

      for(int oi = 0; oi < MAX_OUTER; oi++){
        if(oi >= outerIter) break;
        float e = 0.0;
        vec3 p = vec3(((FC.xy*0.5 - res)/res.x)*uvScale + vec2(uvOffX,uvOffY), g + depthStep);
        p.zx *= rotate2D(t * rotSpeed);
        float s = sInit;
        for(int ii = 0; ii < MAX_INNER; ii++){
          if(ii >= innerIter) break;
          s *= e = max(minFold, foldStr / dot(p,p));
          p  = vec3(foldBX,foldBY,foldBZ) - abs(abs(p)*e - vec3(foldOff));
        }
        g += mod(length(p.xz), p.y * modScale) / s;
        s = log(s * sLogMul);
        o.rgb += hsv(hueOff + g*hueScale, p.z*satMult, s/brightness);
      }
      o.a = 1.0;
      gl_FragColor = o;
    }
  `,
});

scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));

// Animated params
const ANIM_DEFS = [
  { key: 'depthStep', min: 0.175, max: 0.8, freq: 1.0, phase: 0.00 },
  { key: 'foldBX',   min: 1.10,  max: 3.20, freq: 0.5, phase: 1.05 },
  { key: 'foldBY',   min: 4.85,  max: 6.00, freq: 0.4, phase: 2.09 },
  { key: 'foldOff',  min: 4.00,  max: 5.75, freq: 0.5, phase: 3.14 },
  { key: 'hueOff',   min: 0.00,  max: 1.00, freq: 0.45, phase: 4.19 },
  { key: 'hueScale', min: 1.20,  max: 4.00, freq: 0.15, phase: 5.24 },
];

const ANIM_SPEED = 0.03;

const clock = new THREE.Clock();
let animTime = 0;

(function animate(){
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  animTime += delta * ANIM_SPEED;
  mat.uniforms.time.value = clock.elapsedTime;

  for (const def of ANIM_DEFS) {
    const t   = (Math.sin(animTime * def.freq * Math.PI * 2 + def.phase) + 1) / 2;
    const val = def.min + (def.max - def.min) * t;
    mat.uniforms[def.key].value = val;
  }

  renderer.render(scene, camera);
})();

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  mat.uniforms.res.value.set(window.innerWidth, window.innerHeight);
});