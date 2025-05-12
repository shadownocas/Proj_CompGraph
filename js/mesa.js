import * as THREE from "three";

let camera, scene, renderer;

let ball, table;

function addTableLeg(obj, x, y, z, material) {
  const geometry = new THREE.BoxGeometry(2, 6, 2);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y - 3, z);
  obj.add(mesh);
}

function addTableTop(obj, x, y, z, material) {
  const geometry = new THREE.BoxGeometry(60, 2, 20);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  obj.add(mesh);
}

function createBall(x, y, z) {
  const material = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
  const geometry = new THREE.SphereGeometry(4, 10, 10);
  ball = new THREE.Mesh(geometry, material);

  ball.userData = { jumping: true, step: 0 };
  ball.position.set(x, y, z);

  scene.add(ball);
}

function createTable(x, y, z) {
  table = new THREE.Object3D();

  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });

  addTableTop(table, 0, 0, 0, material);
  addTableLeg(table, -25, -1, -8, material);
  addTableLeg(table, -25, -1, 8, material);
  addTableLeg(table, 25, -1, 8, material);
  addTableLeg(table, 25, -1, -8, material);

  scene.add(table);

  table.position.x = x;
  table.position.y = y;
  table.position.z = z;
}

function createScene() {
  scene = new THREE.Scene();

  scene.add(new THREE.AxesHelper(10));

  createTable(0, 8, 0);
  createBall(0, 0, 15);
}

function createCamera() {
  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.x = 50;
  camera.position.y = 50;
  camera.position.z = 50;
  camera.lookAt(scene.position);
}

function onResize() {
  renderer.setSize(window.innerWidth, window.innerHeight);

  if (window.innerHeight > 0 && window.innerWidth > 0) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }
}

function onKeyDown(e) {
  switch (e.keyCode) {
    case 65: //A
    case 97: //a
      ball.material.wireframe = !ball.material.wireframe;
      table.children.forEach((element) => {
        element.material.wireframe = !element.material.wireframe;
      });
      break;
    case 83: //S
    case 115: //s
      ball.userData.jumping = !ball.userData.jumping;
      break;
  }
}

function render() {
  renderer.render(scene, camera);
}

function init() {
  renderer = new THREE.WebGLRenderer({
    antialias: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  createScene();
  createCamera();

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("resize", onResize);
}

function animate() {
  if (ball.userData.jumping) {
    ball.userData.step += 0.04;
    ball.position.y = Math.abs(30 * Math.sin(ball.userData.step));
    ball.position.z = 15 * Math.cos(ball.userData.step);
  }
  render();

  requestAnimationFrame(animate);
}

init();

animate();
