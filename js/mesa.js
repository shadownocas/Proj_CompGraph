import * as THREE from "three";

let camera, scene, renderer;

let ball, robot, upperArmLeft, upperArmRight, upperArm;

function addRobotUpperArm(obj, x, y, z, material, side) {
  const geometry = new THREE.BoxGeometry(5, 10, 3);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  obj.add(mesh);
  
  if (side === "left") upperArmLeft = mesh;
  else if (side === "right") upperArmRight = mesh;
}

function addRobotLowerArm(obj, x, y, z, material) {
  upperArm = new THREE.BoxGeometry(5, 3, 10);
  const mesh = new THREE.Mesh(upperArm, material);
  mesh.position.set(x, y, z);
  obj.add(mesh);
}


function addRobotTube(obj, x, y, z, material) {
  upperArm = new THREE.BoxGeometry(1, 10, 1);
  const mesh = new THREE.Mesh(upperArm, material);
  mesh.position.set(x, y, z);
  obj.add(mesh);
}

function addChest(obj, x, y, z, material) {
  const geometry = new THREE.BoxGeometry(15, 10, 7);
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

function createRobot(x, y, z) {
  robot = new THREE.Object3D();

  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });

  addChest(robot, 0, 0, 0, material);
  addRobotUpperArm(robot, 10, 0, -5, material, "right");
  addRobotUpperArm(robot, -10, 0, -5, material, "left");

  addRobotLowerArm(upperArmRight, 0, -6.5, 3.5, material);
  addRobotLowerArm(upperArmLeft, 0, -6.5, 3.5, material);

  addRobotTube(upperArmRight, 2, 3, -2, material);
  addRobotTube(upperArmLeft, -2, 3, -2, material);
  //addTableLeg(robot, 25, -1, 8, material);
  //addTableLeg(robot, 25, -1, -8, material);

  scene.add(robot);

  robot.position.x = x;
  robot.position.y = y;
  robot.position.z = z;
}

function createScene() {
  scene = new THREE.Scene();

  scene.add(new THREE.AxesHelper(10));

  createRobot(0, 8, 0);
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
      robot.children.forEach((element) => {
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
