import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { PointerLockControls } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/PointerLockControls.js';

let camera, scene, renderer, controls;
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canShoot = true;
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let prevTime = performance.now();
let life = 5;
let weapon = 'pistol';
let lastShot = 0;
let goats = [];
let exitCube;
let levelIndex = 0;
let levelCleared = false;

const levels = [
  {
    goats: [ {x:5,z:-5}, {x:-5,z:5} ],
    exit: {x:10,z:0}
  },
  {
    goats: [ {x:6,z:6}, {x:-6,z:-6}, {x:0,z:-8} ],
    exit: {x:12,z:0}
  }
];

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x808080);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);

  const canvas = document.getElementById('gameCanvas');
  renderer = new THREE.WebGLRenderer({ canvas });
  renderer.setSize(window.innerWidth, window.innerHeight);

  controls = new PointerLockControls(camera, canvas);

  const blocker = document.getElementById('message');
  blocker.style.display = 'block';
  blocker.textContent = 'Click to start';
  blocker.addEventListener('click', () => {
    controls.lock();
  });

  controls.addEventListener('lock', () => {
    blocker.style.display = 'none';
  });

  controls.addEventListener('unlock', () => {
    blocker.style.display = 'block';
    blocker.textContent = 'Paused';
  });

  scene.add(controls.getObject());

  const light = new THREE.HemisphereLight(0xffffff, 0x444444);
  light.position.set(0, 200, 0);
  scene.add(light);

  const floorGeometry = new THREE.PlaneGeometry(100, 100, 10, 10);
  const floorMaterial = new THREE.MeshBasicMaterial({ color: 0x707070 });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);
  document.addEventListener('mousedown', () => shoot());
  window.addEventListener('resize', onWindowResize);

  document.getElementById('pistolBtn').addEventListener('click', () => { weapon='pistol'; updateUI(); });
  document.getElementById('rifleBtn').addEventListener('click', () => { weapon='rifle'; updateUI(); });

  initLevel(levels[levelIndex]);
  updateUI();
  animate();
}

function initLevel(level) {
  goats.forEach(g => scene.remove(g));
  goats = [];
  if (exitCube) scene.remove(exitCube);
  levelCleared = false;
  controls.getObject().position.set(0, 2, 0);

  level.goats.forEach(pos => createGoat(pos.x, pos.z));

  const exitGeo = new THREE.BoxGeometry(2, 2, 2);
  const exitMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  exitCube = new THREE.Mesh(exitGeo, exitMat);
  exitCube.position.set(level.exit.x, 1, level.exit.z);
  scene.add(exitCube);
}

function createGoat(x, z) {
  const canvas = document.createElement('canvas');
  canvas.width = 64; canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 64, 64);
  ctx.font = '48px serif';
  ctx.fillStyle = '#000';
  ctx.fillText('🐐', 8, 48);
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.MeshBasicMaterial({ map: texture });
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const goat = new THREE.Mesh(geometry, material);
  goat.position.set(x, 0.5, z);
  scene.add(goat);
  goats.push(goat);
}

function onKeyDown(event) {
  switch (event.code) {
    case 'ArrowUp':
    case 'KeyW':
      moveForward = true;
      break;
    case 'ArrowLeft':
    case 'KeyA':
      moveLeft = true;
      break;
    case 'ArrowDown':
    case 'KeyS':
      moveBackward = true;
      break;
    case 'ArrowRight':
    case 'KeyD':
      moveRight = true;
      break;
    case 'Digit1':
      weapon = 'pistol';
      updateUI();
      break;
    case 'Digit2':
      weapon = 'rifle';
      updateUI();
      break;
  }
}

function onKeyUp(event) {
  switch (event.code) {
    case 'ArrowUp':
    case 'KeyW':
      moveForward = false;
      break;
    case 'ArrowLeft':
    case 'KeyA':
      moveLeft = false;
      break;
    case 'ArrowDown':
    case 'KeyS':
      moveBackward = false;
      break;
    case 'ArrowRight':
    case 'KeyD':
      moveRight = false;
      break;
  }
}

function shoot() {
  const now = performance.now();
  const rate = weapon === 'pistol' ? 500 : 100; // ms
  if (now - lastShot < rate) return;
  lastShot = now;
  const raycaster = new THREE.Raycaster(
    camera.getWorldPosition(new THREE.Vector3()),
    camera.getWorldDirection(new THREE.Vector3())
  );
  const intersects = raycaster.intersectObjects(goats);
  if (intersects.length > 0) {
    const goat = intersects[0].object;
    scene.remove(goat);
    goats.splice(goats.indexOf(goat), 1);
    if (goats.length === 0) {
      levelCleared = true;
      exitCube.material.color.set(0x00ff00);
      showMessage('Exit opened!');
    }
  }
}

function updateUI() {
  document.getElementById('life').textContent = `Life: ${life}`;
  document.getElementById('weapon').textContent = `Weapon: ${weapon.charAt(0).toUpperCase()+weapon.slice(1)}`;
}

function showMessage(text) {
  const el = document.getElementById('message');
  el.textContent = text;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 2000);
}

function restartGame() {
  life = 5;
  levelIndex = 0;
  initLevel(levels[levelIndex]);
  updateUI();
  showMessage('Game Restarted');
}

function nextLevel() {
  levelIndex++;
  if (levelIndex >= levels.length) {
    showMessage('You Win!');
    levelIndex = 0;
    setTimeout(() => restartGame(), 3000);
  } else {
    initLevel(levels[levelIndex]);
    showMessage(`Level ${levelIndex+1}`);
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);

  const time = performance.now();
  const delta = (time - prevTime) / 1000;

  velocity.x -= velocity.x * 10.0 * delta;
  velocity.z -= velocity.z * 10.0 * delta;

  direction.z = Number(moveForward) - Number(moveBackward);
  direction.x = Number(moveRight) - Number(moveLeft);
  direction.normalize();

  if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
  if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;

  controls.moveRight(-velocity.x * delta);
  controls.moveForward(-velocity.z * delta);

  goats.forEach(goat => {
    goat.rotation.y += 1 * delta;
    if (goat.position.distanceTo(controls.getObject().position) < 1) {
      life--;
      updateUI();
      scene.remove(goat);
      goats.splice(goats.indexOf(goat),1);
      if (life <= 0) {
        showMessage('Game Over');
        setTimeout(() => restartGame(), 3000);
      }
    }
  });

  if (levelCleared && controls.getObject().position.distanceTo(exitCube.position) < 1) {
    levelCleared = false;
    nextLevel();
  }

  renderer.render(scene, camera);
  prevTime = time;
}

init();
