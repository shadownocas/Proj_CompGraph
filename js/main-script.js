import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { VRButton } from "three/addons/webxr/VRButton.js";
import * as Stats from "three/addons/libs/stats.module.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";

//////////////////////
/* GLOBAL VARIABLES */
//////////////////////
let scene, renderer, materials = {};

let camera_idx = 3, cameras, ortho_cameras, persp_camera;

let robot, armLeftGroup, armRightGroup, headGroup, legGroup, feetGroup, containerGroup;

let keyR = false, keyF = false, keyQ = false, keyA = false, keyW = false, keyS = false, keyE = false, keyD = false,

keyArrowUp = false, keyArrowDown = false, keyArrowLeft = false, keyArrowRight = false, key7 = false, prevKey7 = false;

let truck_mode = 0, colision= false, TRUCK = 4, colision_prev = false, isAnimating = false;

let MIN_X = 0, MIN_Y = 1, MIN_Z = 2, MAX_X = 3, MAX_Y = 4, MAX_Z = 5;

let robot_hitbox = [7.5, 16, 3.5, -7.5, -5, -22.5], container_base = [7.5, 10, 28, -7.5, -11, -25], container_hitbox = [];

let targetPos = new THREE.Vector3(0 , 6, -47.5); 

let clock = new THREE.Clock();

/////////////////////
/* CREATE SCENE(S) */
/////////////////////
function createScene() {
  scene = new THREE.Scene(); 
  scene.background = new THREE.Color(0xffffff);
  scene.add(new THREE.AxesHelper(10));

  createRobot(0, 8, 0);
 createContainer(0 , 6, -51.5)
}
//////////////////////
/* CREATE CAMERA(S) */
//////////////////////
function createOrthoCamera({size, x, y, z, offset_h, offset_w}) {
  x = x ?? 0, y = y ?? 0, z = z ?? 0, offset_h = offset_h ?? 0, offset_w = offset_w ?? 0;
  let ratio = window.innerHeight / window.innerWidth;
  let camera = new THREE.OrthographicCamera(- size / ratio + offset_w, size / ratio + offset_w, size + offset_h, - size + offset_h, 1, 1000);
  camera.position.x = x ?? 0;
  camera.position.y = y ?? 0;
  camera.position.z = z ?? 0;
  camera.lookAt(scene.position);
  camera.userData = {size, offset_h, offset_w};
  return camera;
}

function createCameras() {
  ortho_cameras = [
    createOrthoCamera({size: 25, x: 50, offset_w: 25}),
    createOrthoCamera({size: 25, z: 50}),
    createOrthoCamera({size: 50, y: 50, offset_h: 25}),
  ];

  persp_camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 1000);
  persp_camera.position.x = 50;
  persp_camera.position.z = 50;
  persp_camera.position.y = 30;
  persp_camera.lookAt(scene.position);

  cameras = [...ortho_cameras, persp_camera];
  resizeCameras();
}

////////////////////////
/* CREATE OBJECT3D(S) */
////////////////////////

function addGroup(group, parent, x, y, z) { 
  group.position.set(x, y, z);
  parent.add(group);
}

function addBox(obj, x, y, z, material, width, height, depth) {
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  obj.add(mesh);
}

function addCylinder(obj, x, y, z, material, radiust, radiusb, height, rotate = true) {
  const geometry = new THREE.CylinderGeometry(radiust, radiusb, height);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  if(rotate) mesh.rotation.z = Math.PI / 2 //rodar no eixo z
  obj.add(mesh);
}

function addWheel(parent, x, y, z) {
  addCylinder(parent, x, y, z, materials.black, 2.5, 2.5, 2);
}

function createRobot(x, y, z) {
  robot = new THREE.Object3D();

  materials.red = new THREE.MeshBasicMaterial({ color: 0xD92649 });
  materials.black = new THREE.MeshBasicMaterial({ color: 0x313536 });
  materials.blue = new THREE.MeshBasicMaterial({ color: 0x2649d9 });
  materials.grey = new THREE.MeshBasicMaterial({ color: 0x808080 });
  materials.yellow = new THREE.MeshBasicMaterial({ color: 0xD9B626 });

  //create the torso
  addBox(robot, 0, 0, 0, materials.red, 15, 10, 7);
  //create top wheels
  addWheel(robot, 6.5, -10.5, 0);
  addWheel(robot, -6.5, -10.5, 0);
  //create bumper and abdomen
  addBox(robot, 0, -10.5, -2.5, materials.red, 11, 3, 2);
  addBox(robot, 0, -7, 0, materials.red, 5, 4, 7);

  //create the arms
  armRightGroup = new THREE.Group();
  armLeftGroup = new THREE.Group();
  addGroup(armLeftGroup, robot, 0, 0, 0);
  addGroup(armRightGroup, robot, 0, 0, 0);
  addBox(armRightGroup, 10, 0, -5, materials.yellow, 5, 10, 3);
  addBox(armLeftGroup, -10, 0, -5, materials.yellow, 5, 10, 3);
  addBox(armRightGroup, 10, -6.5, -1.5, materials.yellow, 5, 3, 10);
  addBox(armLeftGroup, -10, -6.5, -1.5, materials.yellow, 5, 3, 10);
  addBox(armRightGroup, 12, 3, -7, materials.grey, 1, 10, 1);
  addBox(armLeftGroup, -12, 3, -7, materials.grey, 1, 10, 1); 

  //create the head
  headGroup = new THREE.Group();
  addGroup(headGroup, robot, 0, 5, -3.5);
  addBox(headGroup, 0, 2, 2.5, materials.blue, 5, 4, 5);
  addBox(headGroup, 1.5, 2.5, 5.5, materials.black, 2, 1, 1);
  addBox(headGroup, -1.5, 2.5, 5.5, materials.black, 2, 1, 1);
  addCylinder(headGroup, 1, 4, 2.5, materials.black, 0, 0.5, 2, false);
  addCylinder(headGroup, -1, 4, 2.5, materials.black, 0, 0.5, 2, false);

  //create the legs
  legGroup = new THREE.Group();
  addGroup(legGroup, robot, 0, -10.5, 0);
  addCylinder(legGroup, 0, 0, 0, materials.grey, 1.5, 1.5, 11);
  addBox(legGroup, 2, -3.5, 0, materials.grey, 3, 4, 3);
  addBox(legGroup, -2, -3.5, 0, materials.grey, 3, 4, 3);
  addBox(legGroup, 3, -14, -0.5, materials.blue, 5, 17, 4);
  addBox(legGroup, -3, -14, -0.5, materials.blue, 5, 17, 4);
  addWheel(legGroup, 6.5, -9, 0);
  addWheel(legGroup, -6.5, -9, 0);
  addWheel(legGroup, 6.5, -19, 0);
  addWheel(legGroup, -6.5, -19, 0);
  
  //create feet
  feetGroup = new THREE.Group();
  addGroup(feetGroup, legGroup, 0, -22.5, -2.5);
  addBox(feetGroup, 3, -1.5, 3, materials.grey, 5, 3, 6);
  addBox(feetGroup, -3, -1.5, 3, materials.grey, 5, 3, 6);

  scene.add(robot);

  robot.position.x = x;
  robot.position.y = y;
  robot.position.z = z;
}

function createContainer(x, y, z) {
  containerGroup = new THREE.Group();
  addGroup(containerGroup, scene, x, y, z);

  addBox(containerGroup, 0, 0, 0, materials.red, 11, 20, 50);
  addBox(containerGroup, 0, 1.5, 26.5, materials.red, 11, 3, 3);
  addWheel(containerGroup, 6.5, -8.5, -22.5);
  addWheel(containerGroup, 6.5, -8.5, -16.5);
  addWheel(containerGroup, -6.5, -8.5, -22.5);
  addWheel(containerGroup, -6.5, -8.5, -16.5);
}

//////////////////////
/* CHECK COLLISIONS */
//////////////////////
function checkCollisions() {
  if (truck_mode == TRUCK){
    container_hitbox[MIN_X] = container_base[MIN_X] + containerGroup.position.x;
    container_hitbox[MIN_Y] = container_base[MIN_Y] + containerGroup.position.y;
    container_hitbox[MIN_Z] = container_base[MIN_Z] + containerGroup.position.z;
    container_hitbox[MAX_X] = container_base[MAX_X] + containerGroup.position.x;
    container_hitbox[MAX_Y] = container_base[MAX_Y] + containerGroup.position.y;
    container_hitbox[MAX_Z] = container_base[MAX_Z] + containerGroup.position.z;

    if (container_hitbox[MAX_X] <=  robot_hitbox[MIN_X] &&
        container_hitbox[MIN_X] >=  robot_hitbox[MAX_X] &&
        container_hitbox[MAX_Y] <=  robot_hitbox[MIN_Y] &&
        container_hitbox[MIN_Y] >=  robot_hitbox[MAX_Y] &&
        container_hitbox[MAX_Z] <=  robot_hitbox[MIN_Z] &&
        container_hitbox[MIN_Z] >=  robot_hitbox[MAX_Z] 
      ){
      if(!colision){
        handleCollisions();
        colision = true
      } 
    }
    else{
      colision = false;
    }
  }
  else{
    colision = false;
  }

}

///////////////////////
/* HANDLE COLLISIONS */
///////////////////////
function handleCollisions() {
  isAnimating = true;
}

function animateCollision(delta) {
  const currentPos = containerGroup.position;
  const direction = new THREE.Vector3().subVectors(targetPos, currentPos);

  const distanceToTarget = direction.length();

  direction.normalize(); 
  const moveDistance =  10 * delta;
  if (moveDistance >= distanceToTarget) {
    containerGroup.position.copy(targetPos);
    isAnimating = false;
  } else {
    containerGroup.position.addScaledVector(direction, moveDistance);
  }
}


////////////
/* UPDATE */
////////////
function update() {
  let delta = clock.getDelta();
  processKeys(delta);
  checkCollisions();
  if (isAnimating) {
    animateCollision(delta);
  }
  truck_mode = 0;
}

/////////////
/* DISPLAY */
/////////////
function render() {
  renderer.render(scene, cameras[camera_idx]);
}

////////////////////////////////
/* INITIALIZE ANIMATION CYCLE */
////////////////////////////////
function init() {
  renderer = new THREE.WebGLRenderer({
    antialias: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  createScene();
  createCameras();

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);  
  window.addEventListener("resize", onResize);
}

/////////////////////
/* ANIMATION CYCLE */
/////////////////////

function handleKey7() {
  if ((!prevKey7) && key7) {
    Object.values(materials).forEach((value) => value.wireframe = !value.wireframe);
    prevKey7 = true;
  }
}

function processKeys(time) {
  if(isAnimating) return;
  handleRotation(time, keyF, keyR, headGroup, 1, -Math.PI, 0);
  handleRotation(time, keyS, keyW, legGroup, -1, 0, Math.PI/2);
  handleRotation(time,keyA, keyQ,  feetGroup, -1, 0, Math.PI);
  handleTranslationArms(time, keyD, keyE, armLeftGroup, armRightGroup);
  handleContainerTranslation(time, keyArrowUp, keyArrowDown, keyArrowLeft, keyArrowRight, containerGroup);
  handleKey7();
}

function handleContainerTranslation(time, keyUp, keyDown, keyLeft, keyRight, group) {
  let translX = keyLeft - keyRight;
  let translZ = keyUp - keyDown;
  group.position.add(new THREE.Vector3(translX, 0, translZ).normalize().multiplyScalar(5 * time));
}

function handleTranslationArms(time, keyForward, keyBackward, groupLeft, groupRight) {
  let transl = 0;
  if(keyForward) {
    transl++;
  }
  if(keyBackward) {
    transl--;
  }

  groupLeft.position.x -= 2 * time * transl;
  groupRight.position.x += 2 * time * transl;

  const minX = -5 ;
  const maxX = 0 ;

  if (groupRight.position.x <= minX){
     groupRight.position.x = minX;
     groupLeft.position.x = minX * -1;
     truck_mode++;
  } 
  if (groupRight.position.x >= maxX){ 
      groupRight.position.x = maxX;
      groupLeft.position.x = maxX * -1;
  }
}

function handleRotation(time, keyForward, keyBackward, group, invert, minAngle, maxAngle) {
  let rot = 0;
  if(keyForward) {
    rot++;
  }
  if(keyBackward) {
    rot--;
  }

  group.rotation.x += Math.PI/2 * time * rot * invert * Math.abs(maxAngle - minAngle) / 3;

  if (group.rotation.x <= minAngle) {
    group.rotation.x = minAngle
    if (group == headGroup) truck_mode++;
  };

  if (group.rotation.x >= maxAngle){
    group.rotation.x = maxAngle;
    if (group != headGroup) truck_mode++;
  }
}

function animate() {
 
  update();

  render();

  requestAnimationFrame(animate);
}

////////////////////////////
/* RESIZE WINDOW CALLBACK */
////////////////////////////

function resizeCameras() {
  if (!(window.innerHeight > 0 && window.innerWidth > 0)) {
    return;
  }

  let ratio = window.innerHeight / window.innerWidth;
  ortho_cameras.forEach((camera) => {
    camera.left   = - camera.userData.size / ratio + camera.userData.offset_w;
    camera.right  =   camera.userData.size / ratio + camera.userData.offset_w;
    camera.updateProjectionMatrix();
  });

  persp_camera.aspect = 1 / ratio;
  persp_camera.updateProjectionMatrix();
}

function onResize() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  resizeCameras();
}

///////////////////////
/* KEY DOWN CALLBACK */
///////////////////////
function onKeyDown(e) {
  switch (e.keyCode) {
    case 49: // 1
    case 50: // 2
    case 51: // 3
    case 52: // 4
      camera_idx = e.keyCode - 49;
      break;
    case 55: // 7
      key7 = true;
      break;
    case 82: // R
    case 114: // r
      keyR = true;
      break;
    case 70: // F
    case 102: // f
      keyF = true;
      break;
    case 81: // Q
    case 113: // q
      keyQ = true;
      break;
    case 65: // A
    case 97: // a
      keyA = true;
      break;
    case 87: // W
    case 119: // w
      keyW = true;
      break;
    case 83: // S
    case 115: // s
      keyS = true;
      break;
    case 69: // E
    case 101: // e
      keyE = true;
      break;
    case 68: // D
    case 100: // d
      keyD = true;
      break;
     // Arrow keys
    case 38: // Arrow Up
      keyArrowUp = true;
      break;
    case 40: // Arrow Down
      keyArrowDown = true;
      break;
    case 37: // Arrow Left
      keyArrowLeft = true;
      break;
    case 39: // Arrow Right
      keyArrowRight = true;
      break;
  }
}

///////////////////////
/* KEY UP CALLBACK */
///////////////////////
function onKeyUp(e) {
  switch (e.keyCode) {
    case 55: // 7
      key7 = false;
      prevKey7 = false;
      break;
    case 82: // R
    case 114: // r
      keyR = false;
      break;
    case 70: // F
    case 102: // f
      keyF = false;
      break;
    case 81: // Q
    case 113: // q
      keyQ = false;
      break;
    case 65: // A
    case 97: // a
      keyA = false;
      break;
    case 87: // W
    case 119: // w
      keyW = false;
      break;
    case 83: // S
    case 115: // s
      keyS = false;
      break;
    case 69: // E
    case 101: // e
      keyE = false;
      break;
    case 68: // D
    case 100: // d
      keyD = false;
      break;

     // Arrow keys
    case 38: // Arrow Up
      keyArrowUp = false;
      break;
    case 40: // Arrow Down
      keyArrowDown = false;
      break;
    case 37: // Arrow Left
      keyArrowLeft = false;
      break;
    case 39: // Arrow Right
      keyArrowRight = false;
      break;
  }
}

init();
animate();