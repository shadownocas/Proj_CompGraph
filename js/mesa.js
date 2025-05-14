import * as THREE from "three";

let camera, scene, renderer;

let robot, armLeftGroup, armRightGroup, headGroup, legGroup, feetGroup;
let clock = new THREE.Clock();
let keyR = false, keyF = false, keyQ = false, keyA = false;

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

function addCylinder(obj, x, y, z, material, radiust, radiusb, height) {
  const geometry = new THREE.CylinderGeometry(radiust, radiusb, height);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.rotation.z = Math.PI / 2 //rodar no eixo z
  obj.add(mesh);
}



function createRobot(x, y, z) {
  robot = new THREE.Object3D();

  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
  //create the torso
  addBox(robot, 0, 0, 0, material, 15, 10, 7);

  //create the arms
  armRightGroup = new THREE.Group();
  armLeftGroup = new THREE.Group();
  addGroup(armLeftGroup, robot, 0, 0, 0);
  addGroup(armRightGroup, robot, 0, 0, 0);
  addBox(armRightGroup, 10, 0, -5, material, 5, 10, 3);
  addBox(armLeftGroup, -10, 0, -5, material, 5, 10, 3);
  addBox(armRightGroup, 10, -6.5, -1.5, material, 5, 3, 10);
  addBox(armLeftGroup, -10, -6.5, -1.5, material, 5, 3, 10);
  addBox(armRightGroup, 12, 3, -7, material, 1, 10, 1);
  addBox(armLeftGroup, -12, 3, -7, material, 1, 10, 1); 

  //create the head
  headGroup = new THREE.Group();
  addGroup(headGroup, robot, 0, 5, -3.5);
  addBox(headGroup, 0, 2, 2.5, material, 5, 4, 5);

  //create the legs
  legGroup = new THREE.Group();
  addGroup(legGroup, robot, 0, -10.5, 0);
  addCylinder(legGroup, 0, 0, 0, material, 1.5, 1.5, 11);
  addBox(legGroup, 2, -3.5, 0, material, 3, 4, 3);
  addBox(legGroup, 3, -14, -0.5, material, 5, 17, 4);
  
  //create feet
  feetGroup = new THREE.Group();
  addGroup(feetGroup, legGroup, 0, -22.5, -2.5);
  addBox(feetGroup, 3, -1.5, 3, material, 5, 3, 6);

  scene.add(robot);

  robot.position.x = x;
  robot.position.y = y;
  robot.position.z = z;
}

function createScene() {
  scene = new THREE.Scene();

  scene.add(new THREE.AxesHelper(10));

  createRobot(0, 8, 0);

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
    case 82: // R
    case 114: // r
      keyR = true;
      break;
    case 70: // F
    case 102: // f
      keyF = true;
      break;
    case 81:
    case 113: // q
      keyQ = true;
      break;
    case 65:
    case 97: // a
      keyA = true;
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
  window.addEventListener("keyup", onKeyUp);  
  window.addEventListener("resize", onResize);
}

function animate() {
 
  update();

  render();

  requestAnimationFrame(animate);
}

function onKeyUp(e) {
  switch (e.keyCode) {
    case 82: // R
    case 114: // r
      keyR = false;
    break;
    case 70: // F
    case 102: // f
      keyF = false;
    break;
     case 81:
    case 113: // q
      keyQ = false;
      break;
    case 65:
    case 97: // a
      keyA = false;
      break;

  }
}

function processKeys(time) {
  handleRoration(time, keyF, keyR, headGroup);
  //handleRoration(time, keyQ, keyA, legGroup);
  //handleRoration(time, keyW, keyS, feetGroup);
  
 
}

function handleRoration(time, keyForward, keyBackward, group) {
  let rot = 0;
  if(keyForward) {
    rot++;
  }
  if(keyBackward) {
    rot--;
  }
  console.log( group.rotation.x);
  if( group.rotation.x >= -Math.PI && group.rotation.x <= 0) {
    group.rotation.x += Math.PI/2 * time * rot;
  }
  if (group.rotation.x < -Math.PI){
    group.rotation.x = -Math.PI;  
  }
  if (group.rotation.x > 0){
    group.rotation.x = 0;  
  }


}

function update(){
  let time = clock.getDelta();
    processKeys(time);
    //processAnimations(time);
  }

  //paa garantir q animacao ocorre a vel constante --> obj.position.x += vel * time;}

  /*para detetar colisao
  Axmin <= Bxmax; &
  Aymin <= Bymax;&
  Bxmin <= Axmax;
  Bymin <= Aymax;*/

init();

animate();

