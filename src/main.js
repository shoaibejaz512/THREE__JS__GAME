import * as THREE from "three"
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, .1, 1000);
scene.add(camera);

camera.position.set(4.61, 2.74, 8);
scene.background = new THREE.Color(0x87ceeb);

const canvas = document.getElementById("canvas");
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true
});



renderer.setPixelRatio(devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;

renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.5;


function resizeRenderer() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

window.addEventListener("resize", resizeRenderer);
resizeRenderer(); // call once on load


// ================= BOX CLASS =================
class Box extends THREE.Mesh {
  constructor({
    width,
    heigth,
    depth,
    color = 0x00ff00,
    position = { x: 0, y: 0, z: 0 },
    velocity = { x: 0, y: 0, z: 0 },
    zAcceleration = false,
  }) {
    super(
      new THREE.BoxGeometry(width, heigth, depth),
      new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.7,
        metalness: 0.1,
      })
    );

    this.width = width;
    this.heigth = heigth;
    this.depth = depth;
    this.position.set(position.x, position.y, position.z);
    this.zAcceleration = zAcceleration;
    this.gravity = -0.008;
    this.velocity = velocity;

    this.updateSide();
  }

  updateSide() {
    this.top = this.heigth / 2 + this.position.y;
    this.bottom = this.position.y - this.heigth / 2;
    this.left = this.position.x - this.width / 2;
    this.right = this.position.x + this.width / 2;
    this.front = this.position.z - this.depth / 2;
    this.back = this.position.z + this.depth / 2;
  }

  update(ground) {
    this.position.x += this.velocity.x;
    this.position.z += this.velocity.z;
    if (this.zAcceleration) this.velocity.z += .003;
    this.updateSide();
    this.applyGravity(ground);
  }

  applyGravity(ground) {
    this.velocity.y += this.gravity;
    if (boxCollision({ box1: this, box2: ground })) {
      this.velocity.y *= .8;
      this.velocity.y = -this.velocity.y;
    } else {
      this.position.y += this.velocity.y;
    }
  }
}

// ================= COLLISION =================
function boxCollision({ box1, box2 }) {
  const xCollision = box1.right >= box2.left && box1.left <= box2.right;
  const zCollision = box1.front <= box2.back && box1.back >= box2.front;
  const yCollision =
    box1.bottom + box1.velocity.y <= box2.top &&
    box1.top >= box2.bottom;

  return xCollision && yCollision && zCollision;
}

// ================= PLAYER =================
const cube = new Box({
  width: 1.5,
  heigth: 1.5,
  depth: 1.5,
  position: { x: 0, y: 2, z: 3 },
  velocity: { x: 0, y: -.02, z: 0 },
  color: 0x8b4513 // brown
});
cube.castShadow = true;
scene.add(cube);

// ================= GROUND =================
const ground = new Box({
  width: 20,
  heigth: .5,
  depth: 70,
  position: { x: 0, y: -2, z: 0 },
  color: 0x228b22 // green
});
ground.receiveShadow = true;
scene.add(ground);

// ================= LIGHT =================
const light = new THREE.DirectionalLight(0xffffff, 3);
light.position.set(10, 15, 10);
light.castShadow = true;
scene.add(light);
scene.add(light.target);

scene.add(new THREE.AmbientLight(0xffffff, 0.6));

// ================= CONTROLS =================
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// ================= INPUT =================
let key = {
  keyA: false,
  keyD: false,
  keyS: false,
  keyW: false,
  space: false
};

window.addEventListener("keydown", (e) => {
  if (e.key === "a") key.keyA = true;
  if (e.key === "d") key.keyD = true;
  if (e.key === "w") key.keyW = true;
  if (e.key === "s") key.keyS = true;
  if (e.key === " ") cube.velocity.y = .2;
});

window.addEventListener("keyup", (e) => {
  if (e.key === "a") key.keyA = false;
  if (e.key === "d") key.keyD = false;
  if (e.key === "w") key.keyW = false;
  if (e.key === "s") key.keyS = false;
});

// ================= ENEMIES =================
let enemies = [];
let frames = 0;
let spawnRates = 20;

// ================= ANIMATE =================
function animate() {
  const id = requestAnimationFrame(animate);
  cube.update(ground);
  controls.update();

  cube.velocity.x = 0;
  cube.velocity.z = 0;

  if (key.keyA) cube.velocity.x = -.099;
  if (key.keyD) cube.velocity.x = .099;
  if (key.keyW) cube.velocity.z = -.05;
  if (key.keyS) cube.velocity.z = .05;

  if (frames % spawnRates === 0) {
    const enemy = new Box({
      width: 1.5,
      heigth: 1.5,
      depth: 1.5,
      position: {
        x: (Math.random() - .5) * 15,
        y: 0,
        z: -30
      },
      velocity: { x: 0, y: 0, z: 0 },
      zAcceleration: true,
      color: 0xff0000 // red
    });

    enemy.castShadow = true;
    scene.add(enemy);
    enemies.push(enemy);
  }

  enemies.forEach((ene) => {
    ene.update(ground);
    if (boxCollision({ box1: cube, box2: ene })) {
      cancelAnimationFrame(id);
    }
  });

  frames++;
  renderer.render(scene, camera);
}

animate();
