import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { VRButton } from "three/addons/webxr/VRButton.js";
import * as Stats from "three/addons/libs/stats.module.js";

import * as House from "./house.js"

//////////////////////
/* GLOBAL VARIABLES */
//////////////////////
let scene, renderer, allMeshes = [], controls, selectedMaterial = 0, helper, mats = [];

let camera_idx = 3, persp_camera, moonLight, treeGroup, ovniGroup , spotLight, ovniLights = [];

let keyR = false, keyQ = false, keyD = false, prevKey2 = false, key2 = false, prevKeyR = false, 
prevKeyD = false, keyP = false, keyS = false, prevKeyS = false, prevKeyP = false, prevKeyQ = false, prevKeyW = false, keyW = false, prevKeyE = false, keyE = false,
keyArrowUp = false, keyArrowDown = false, keyArrowLeft = false, keyArrowRight = false, key7 = false, prevKey1 = false, key1 = false, prevKey7 = false;
let flowerColors = ["#ffffff", "#ffff00", "#e066ff", "#00a1ff"];
let groundMesh, prevIlumination = 0;

let clock = new THREE.Clock();
const SPOTLIGHT_INTENSITY = 10;
const PONTUALLIGHT_INTENSITY = 100;
const MOONLIGHT_INTENSITY = 0.5;
const BASE = 10; // base unit for scaling

////////////////////////
/* CREATE MATERIAL(S) */
////////////////////////

const materials = {
  house_accent: createMat({ color: "#3666e0" }),
  house_wall: createMat({ color: "#e0e0e0" }),
  house_roof: createMat({ color: "#e1341e" }),
  house_window: createMat({ color: "#261968", shininess: 150, specular: 80, emissive: "#ebdf14" }),
  wood: createMat({ color: "#8b4513" }),
  leaves: createMat({ color: "#228B22"}),
  moon: createMat({ color: "#fff5cc", emissive: "#fff5cc", }),
  ovni_light: createMat({ color: "#ffdebb", emissive: "#ffdebb" }),
  ovni_body: createMat({ color: "#808080" }),
  ovni_cap: createMat({ color: "#bbfff4" }),
  ground: createMat({ }),
  sky: new THREE.MeshBasicMaterial({}),
};

function createMat({color, emissive, specular, shininess}) {
  return [
    new THREE.MeshPhongMaterial({ color, shininess: shininess ?? 0, emissive: emissive ?? "#000000", specular: "#0f0f0f"}), 
    new THREE.MeshToonMaterial({ color, emissive: emissive ?? "#000000" }), 
    new THREE.MeshLambertMaterial({ color, emissive: emissive ?? "#000000" }),
    new THREE.MeshBasicMaterial({ color })
  ];
}

function createMesh(geometry, material) {
  mats.push(materials[material]);
  const mesh = new THREE.Mesh(geometry, materials[material][selectedMaterial]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  allMeshes.push(mesh);
  return mesh;
}

function createHouseMesh(vertices, faces, material, parent) {
  const geometry = new THREE.BufferGeometry();
  geometry.setIndex(faces);
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.computeVertexNormals();

  addGroup(createMesh(geometry, material), parent, 0, 0, 0);
}

function createCylinder(obj, x, y, z, material, radiust, radiusb, height, rotate = null) {
  const geometry = new THREE.CylinderGeometry(radiust, radiusb, height);
  const mesh = createMesh(geometry, material);
  
  if(rotate) mesh.rotation.z = Math.PI / 4 * rotate //rodar no eixo z
  addGroup(mesh, obj, x, y, z);
  return mesh;
}

function createSphere(obj, radius, material, x, y, z) {
  let geometry = new THREE.SphereGeometry(radius, 32, 32);
  let mesh = createMesh(geometry, material);

  addGroup(mesh, obj, x, y, z);
  return mesh;
}

function createElipsoide(obj, x, y, z, material, radiusX, radiusY, radiusZ) {
  const mesh = createSphere(obj, 1, material, x, y, z);
  mesh.geometry.scale(radiusX, radiusY, radiusZ);
  return mesh;
}

function createCapsule(obj, x, y, z, material, radius, capHeight) {
  // Calculate thetaLength to simulate a cap. Full sphere height = 2 * radius
  const thetaLength = Math.acos((radius - capHeight) / radius);
  const geometry = new THREE.SphereGeometry(radius, 32, 32, 0, Math.PI * 2, 0, thetaLength);

  const mesh = createMesh(geometry, material);
  addGroup(mesh, obj, x, y, z);
  return mesh;
}

function createCamera() {
  persp_camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 3000);
  persp_camera.position.x = 50;
  persp_camera.position.z = 50;
  persp_camera.position.y = 500;
  persp_camera.lookAt(scene.position);

  resizeCamera();
}

function addGroup(group, parent, x, y, z) { 
  group.position.set(x, y, z);
  parent.add(group);
}

function createTree(x, z, base, id) { //with id pq assim n dava para fazer diff keys para a mesh...
  const treeGroup = new THREE.Group(); //9fiz bem? assim todas as trees ficam no mesmo grupo
  addGroup(treeGroup, scene, x, 20, z);
  createCylinder(treeGroup, 0, 0, 0,  "wood" , 2/6 * base, 2/6 * base, 4.5 * base); // trunk
  createCylinder(treeGroup, 2/4 * base, 0.7 * base, 0,  "wood" , 1/12 * base, 1/12 * base, 1/3 * base, 1); // branch2
  createElipsoide(treeGroup, 0,  2.25 * base, 0,  "leaves" , 1.5 * base, 1* base, 1.5 * base); // leaves  
  createCylinder(treeGroup, 2/6 * base, 0.25 * base, 0,  "wood" , 1/6 * base, 1/6 * base, 1.5 * base, -1); // branch1
  createElipsoide(treeGroup, 1.1 * base, 1 * base, 0, "leaves", 2/3 * base, 1/3 * base, 2/3 * base); // leaves2
}

function createOvni() {
  ovniGroup = new THREE.Group();
  const ovniY = 100;
  addGroup(ovniGroup, scene, 0, ovniY, 0);
  createElipsoide(ovniGroup, 0, 0, 0,  "ovni_body" , 2 * BASE, 0.5 * BASE, 2 * BASE); 
  createCylinder(ovniGroup, 0, -0.5 * BASE, 0, "house_roof", 1 * BASE, 1 * BASE, 1/5 * BASE); // propeller
  createCapsule(ovniGroup, 0, 0.25 * BASE , 0,  "ovni_cap" ,   BASE , BASE); // capsule
  
  // Create target
  const propellerY = -0.7 * BASE - 0.5 * (1/5 * BASE); // center of propeller

  // Create a spotlight target below the UFO
  const target = new THREE.Object3D();
  addGroup(target, ovniGroup, 0, propellerY - BASE, 0); // position target below the propeller


  // Add spotlight to the cylinder
  spotLight = new THREE.SpotLight(0xff00ff, SPOTLIGHT_INTENSITY, 100); 
  spotLight.position.set(0, propellerY, 0);
  spotLight.target = target;
  spotLight.angle = Math.PI / 8;
  spotLight.penumbra = 0.99;
  ovniGroup.add(spotLight.target); // Add target to the group
  ovniGroup.add(spotLight); // Add spotlight to the group

  helper = new THREE.SpotLightHelper(spotLight);
  scene.add(helper);

  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const angx = Math.cos(angle) * BASE * 1.5;
    const angz = Math.sin(angle) * BASE * 1.5;
    createSphere(ovniGroup, 0.2*BASE, "ovni_light", angx, -0.4 * BASE , angz);

    const pointLight = new THREE.PointLight(0xffffff, PONTUALLIGHT_INTENSITY);
    //pointLight.position.set(angx, ovniY - 0.8*BASE, angz);  // y = ovniY - 0.5*BASE
    addGroup(pointLight, ovniGroup,angx, -0.8*BASE, angz); // Add point light to the ovniGroup
    ovniGroup.add(pointLight);
    const helper = new THREE.PointLightHelper(pointLight);
    scene.add(helper);
    ovniLights.push(pointLight);
  }
}

function createAllTrees() {
  let baseSizes = [10, 14, 18];
  const rangeX = 500;
  const rangeZ = 500;
  const snapStep = 1; //se divisao der 23.3333 it snaps to 20
  const usedPositions = new Set();

  for (let i = 0; i < 3; i++) {
    let randX, randZ, key;
    do {
      randX = Math.round(((Math.random() - 0.5) * rangeX) / snapStep) * snapStep;
      randZ = Math.round(((Math.random() - 0.5) * rangeZ) / snapStep) * snapStep;
      key = `${randX},${randZ}`;
    } while (usedPositions.has(key));
    usedPositions.add(key);
    createTree(randX, randZ, baseSizes[i], i);
  }
}

/////////////////////
/* CREATE SCENE(S) */
/////////////////////
function createScene() {
  scene = new THREE.Scene(); 
  scene.background = new THREE.Color(0xffffff);
  createGround();
  createSkydome();
  createMoon();
  createAllTrees();
  createOvni();
  createHouse();
}

function createTexture(dotColors, bgColor, dotSize, numDots, gradient) {

  // Generate the procedural texture
  const textureSize = 512;
  const canvas = document.createElement("canvas");
  canvas.width = textureSize;
  canvas.height = textureSize;
  const context = canvas.getContext("2d");

  if(!gradient) {
    context.fillStyle = bgColor;
  } else {
    const gradient = context.createLinearGradient(0, 0, 0, textureSize);
    gradient.addColorStop(0,   '#00008B'); // Blue color
    gradient.addColorStop(0.7, '#00008B'); // Blue color
    gradient.addColorStop(1,   '#9400D3'); // Purple color
    context.fillStyle = gradient;
  }
  context.fillRect(0, 0, textureSize, textureSize);

  for (let i = 0; i < numDots; i++) {
    const x = Math.random() * textureSize;
    const y = Math.random() * textureSize;
    const color = dotColors[Math.floor(Math.random() * dotColors.length)];

    context.fillStyle = color;
    context.fillRect(x, y, dotSize, dotSize);
  }

  const texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function createHouse() {
  const house = new THREE.Group();

  createHouseMesh(House.house_vertices, House.house_accent, "house_accent", house);
  createHouseMesh(House.house_vertices, House.house_walls, "house_wall", house);
  createHouseMesh(House.house_vertices, House.house_roof, "house_roof", house);
  createHouseMesh(House.house_vertices, House.house_windows, "house_window", house);
  createHouseMesh(House.house_vertices, House.house_door, "wood", house);

  house.scale.multiplyScalar(10/6);

  addGroup(house, scene, -10, -1, 20);
  house.rotateY(Math.PI / 3)
}

function createSkydome() {
  // Create a sphere geometry
  let geometry = new THREE.SphereGeometry(600, 32, 32,0,Math.PI * 2,0,Math.PI/2);

  materials.sky.side = THREE.BackSide;

  let skydome = new THREE.Mesh(geometry, materials.sky);
  addGroup(skydome, scene, 0, -100, 0);
}


function createGround() {
  const geometry = new THREE.PlaneGeometry(1700, 1700, 250, 250);
  let disMap = new THREE.TextureLoader().load('/heightmap2.png');
  disMap.wrapS = disMap.wrapT = THREE.RepeatWrapping;
  disMap.needsUpdate = true;

  const mat = materials.ground;
  
  for(let i = 0; i < 3; i++){ //Q- e a basic mesh material??? (não suporta displacementMaps)
    mat[i].displacementMap = disMap;
    mat[i].displacementScale = 150;
    mat[i].displacementBias = -50;
    mat[i].flatShading = false;
    // mat[i].metalness = 0.2;
    // mat[i].roughness = 0.8;
  }
  
  groundMesh = createMesh(geometry, "ground");
  geometry.computeVertexNormals();
  scene.add(groundMesh);

  groundMesh.rotation.x = -Math.PI / 2;
  groundMesh.rotation.y = 0;
}


function createMoon() {
  var moon = new THREE.Object3D();

  createSphere(scene, 35, "moon" , 100, 300, 30);
  moonLight = new THREE.DirectionalLight(0xFFF5CC , MOONLIGHT_INTENSITY);
  moonLight.position.set(-300, 300, -200);

  moonLight.target.position.set(1, -1, 1);
  scene.add(moonLight.target); // must be in the scene to work
  moon.add(moonLight);
  scene.add(moon);
}


function handleKey1() {
  if ((!prevKey1) && key1) {
    for(let i = 0; i < 4; i++){ //Q- e a basic mesh???
      materials.ground[i].map = createTexture(flowerColors, "#228B22", 2, 1000, false);
      materials.ground[i].needsUpdate = true;
    }
    prevKey1 = true;
  }
}

function handleKey2() {
  if((!prevKey2) && key2) {
    materials.sky.map = createTexture(["#ffffff"], "#228B22", 1, 1000, true);
    materials.sky.needsUpdate = true;
    
    prevKey2 = true;
  }
}

function handleKeyD() {
  if ((!prevKeyD) && keyD) {
    if (moonLight.intensity) {
        moonLight.intensity = 0;
      }
      else {
        moonLight.intensity = MOONLIGHT_INTENSITY;
      }
    prevKeyD = true;
  }
}

function handleKeyS() {
    if ((!prevKeyS) && keyS) {
    spotLight.intensity ? spotLight.intensity =  0 : spotLight.intensity = SPOTLIGHT_INTENSITY;
    prevKeyS = true;
  }
}

function handleKeyP() {
  if ((!prevKeyP) && keyP) {
    for (let i = 0; i < ovniLights.length; i++) {
      const pontualLight = ovniLights[i];
      pontualLight.intensity ? pontualLight.intensity = 0 : pontualLight.intensity = PONTUALLIGHT_INTENSITY;
    }
    prevKeyP = true;
  }
}


function handleKeyQ(materialIndex) {
  if ((!prevKeyQ) && keyQ) {
      selectedMaterial = materialIndex;
      changeMaterials();
      prevKeyQ = true;
  }
}

function handleKeyW(materialIndex) {
  if ((!prevKeyW) && keyW) {
      selectedMaterial = materialIndex;
      changeMaterials();
      prevKeyW = true;
  }
}

function handleKeyE(materialIndex) {
  if ((!prevKeyE) && keyE) {
      selectedMaterial = materialIndex;
      changeMaterials();
      prevKeyE = true;
    }
}

function handleKeyR() {
  if ((!prevKeyR) && keyR) {
    if(selectedMaterial != 3) {
      prevIlumination = selectedMaterial;
      selectedMaterial = 3;
      changeMaterials();
    }
    else{
      selectedMaterial = prevIlumination;
      changeMaterials();
    }
    prevKeyR = true;
  }
}

function handleOvniTranslation(time, keyUp, keyDown, keyLeft, keyRight, group) {
  let translX = keyRight - keyLeft;
  let translZ = keyDown- keyUp ;
  group.position.add(new THREE.Vector3(translX, 0, translZ).normalize().multiplyScalar(50 * time));
}


function handleKey7() {
  if ((!prevKey7) && key7) {
    camera_idx === 1 ?  camera_idx = 0 : camera_idx = 1;
    prevKey7 = true;
  }
}

function processKeys(time) {
  handleKey1();
  handleKey2();
  handleKeyD();
  handleKeyS();
  handleKeyP();
  handleKeyQ(2);
  handleKeyW(0);
  handleKeyE(1);
  handleKey7();
  handleKeyR();
  handleOvniTranslation(time, keyArrowUp, keyArrowDown, keyArrowLeft, keyArrowRight, ovniGroup);
}

function handleOvniRotation(time) {
  ovniGroup.rotation.y += 5 * time;
}

////////////
/* UPDATE */
////////////
function update() {
  let delta = clock.getDelta();
  processKeys(delta);
  handleOvniRotation(delta);
  controls.update();
  //checkCollisions();
}

/////////////
/* DISPLAY */
/////////////
function render() {
  renderer.render(scene, persp_camera);
}

////////////////////////////////
/* INITIALIZE ANIMATION CYCLE */
////////////////////////////////
function init() {
  renderer = new THREE.WebGLRenderer({
    antialias: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  document.body.appendChild(renderer.domElement);

  createScene();
  createCamera();


  const ambientLight = new THREE.AmbientLight(0xffffff, 0.04);
  scene.add(ambientLight);
  const axesHelper = new THREE.AxesHelper(500);
  scene.add(axesHelper);
  controls = new OrbitControls(persp_camera, renderer.domElement);
  controls.target.x = scene.position.x;
  controls.target.y = scene.position.y+60;
  controls.target.z = scene.position.z;
  controls.maxPolarAngle = Math.PI/2 - Math.PI/160;
  controls.minDistance = 0;
  controls.maxDistance = 500;
    
  controls.update();

  document.body.appendChild(VRButton.createButton(renderer));
  renderer.xr.enabled = true;
  //renderer.setAnimationLoop(animate);

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);  
  window.addEventListener("resize", onResize);
}

function changeMaterials() {
  for(let index = 0; index < allMeshes.length; index++) {
    allMeshes[index].material = mats[index][selectedMaterial];
  }
}



function animate() {
  helper.update();
  update();
  
  render();
  renderer.setAnimationLoop(animate);
  //requestAnimationFrame(animate);
}

////////////////////////////
/* RESIZE WINDOW CALLBACK */
////////////////////////////

function resizeCamera() {
  if (!(window.innerHeight > 0 && window.innerWidth > 0)) {
    return;
  }

  let ratio = window.innerHeight / window.innerWidth;
  persp_camera.aspect = 1 / ratio;
  persp_camera.updateProjectionMatrix();
}

function onResize() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  resizeCamera();
}



///////////////////////
/* KEY DOWN CALLBACK */
///////////////////////
function onKeyDown(e) {
  switch (e.keyCode) {
    case 49: // 1
        key1 = true;
        break;
    case 50: // 2
      key2 = true;
      break;
    case 55: // 7
      key7 = true;
      break;
    case 82: // R
    case 114: // r
      keyR = true;
      break;
  
    case 81: // Q
    case 113: // q
      keyQ = true;
      break;
  
    case 87: // W
    case 119: // w
      keyW = true;
      break;
    case 80: // P
    case 112: // p
      keyP = true;
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
    case 49: // 1
        key1 = false;
        prevKey1 = false;
        break;
    case 50: // 2
      key2 = false;
      prevKey2 = false;
      break;
    case 55: // 7
      key7 = false;
      prevKey7 = false;
      break;
    case 82: // R
    case 114: // r
      keyR = false;
      prevKeyR = false;
      break;
    case 81: // Q
    case 113: // q
      keyQ = false;
      prevKeyQ = false;
      break;
    case 87: // W
    case 119: // w
      keyW = false;
      prevKeyW = false;
      break;
    case 80: // P
    case 112: // p
      keyP = false;
      prevKeyP = false;
      break;
    case 83: // S
    case 115: // s
      keyS = false;
      prevKeyS = false;
      break;
    case 69: // E
    case 101: // e
      keyE = false;
      prevKeyE = false;
      break;
    case 68: // D
    case 100: // d
      keyD = false;
      prevKeyD = false;
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
