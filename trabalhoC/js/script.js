import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { VRButton } from "three/addons/webxr/VRButton.js";
import * as Stats from "three/addons/libs/stats.module.js";


//////////////////////
/* GLOBAL VARIABLES */
//////////////////////
let scene, renderer, allMeshes = {}, controls, selectedMaterial = 0, materials = {}, helper;

//let persp_camera;
let camera_idx = 3, cameras, ortho_cameras, persp_camera, moonLight, treeGroup, ovniGroup , spotLight;

let keyR = false, keyF = false, keyQ = false, keyA = false, keyW = false, keyS = false, keyE = false, keyD = false, prevKey2 = false, key2 = false,
prevKeyD = false,
keyArrowUp = false, keyArrowDown = false, keyArrowLeft = false, keyArrowRight = false, key7 = false, prevKey1 = false, key1 = false, skyMat;
let flowerColors = ["#ffffff", "#ffff00", "#e066ff", "#00a1ff"];
let groundMesh;
let clock = new THREE.Clock();

const BASE = 10; // base unit for scaling

const MATERIAL_TYPES = [
    (color) => new THREE.MeshPhongMaterial({ color }),
    (color) => new THREE.MeshToonMaterial({ color }),
    (color) => new THREE.MeshLambertMaterial({ color }),
    (color) => new THREE.MeshBasicMaterial({ color }),
];

function createCylinder(name, obj, x, y, z, material, radiust, radiusb, height, rotate = null) {
  const geometry = new THREE.CylinderGeometry(radiust, radiusb, height);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  if(rotate) mesh.rotation.z = Math.PI / 4 * rotate //rodar no eixo z
  obj.add(mesh);
  allMeshes[name] = mesh;
}

function createSphere(name, radius, color, x, y, z) {
  let geometry = new THREE.SphereGeometry(radius, 32, 32);
  let material = new THREE.MeshBasicMaterial({ color: color });
  let sphere = new THREE.Mesh(geometry, material);
  sphere.position.set(x, y, z);
 
  scene.add(sphere);

  allMeshes[name] = sphere;
  return sphere;
}

function createElipsoide(name, obj, x, y, z, material, radiusX, radiusY, radiusZ) {
  const geometry = new THREE.SphereGeometry(1, 32, 32);
  geometry.scale(radiusX, radiusY, radiusZ);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  obj.add(mesh);
  allMeshes[name] = mesh;
  return mesh;
}

function createCapsule(name, obj, x, y, z, material, radius, capHeight) {
  // Calculate thetaLength to simulate a cap. Full sphere height = 2 * radius
  const thetaLength = Math.acos((radius - capHeight) / radius);

  const geometry = new THREE.SphereGeometry(
    radius,       // radius
    32,           // widthSegments
    32,           // heightSegments
    0,            // phiStart
    Math.PI * 2,  // phiLength (full circle)
    0,            // thetaStart (from top pole)
    thetaLength   // thetaLength (downward from top)
  );

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  allMeshes[name] = mesh;
  obj.add(mesh);
}

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
    createOrthoCamera({size: 0, y: 1000, offset_h: 0}),
  ];

  persp_camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 1000);
  persp_camera.position.x = 50;
  persp_camera.position.z = 50;
  persp_camera.position.y = 30;
  persp_camera.lookAt(scene.position);

  cameras = [...ortho_cameras, persp_camera];
  resizeCameras();
}

function addGroup(group, parent, x, y, z) { 
  group.position.set(x, y, z);
  parent.add(group);
}

function createTree(x , z, base, id) { //with id pq assim n dava para fazer diff keys para a mesh...
  x = x ?? 0, z = z ?? 0;
  treeGroup = new THREE.Group(); //9fiz bem? assim todas as trees ficam no mesmo grupo
  addGroup(treeGroup, scene, x, 20, z);
  createCylinder(`trunk_${id}`, treeGroup, 0, 0, 0, new THREE.MeshBasicMaterial({ color: 0x8B4513 }), 2/6 * BASE, 2/6 * base, 4.5 * base); // trunk
  createCylinder(`branch2_${id}`, treeGroup, 2/4 * base, 0.7 * base, 0, new THREE.MeshBasicMaterial({ color: 0x8B4513 }), 1/12 * base, 1/12 * base, 1/3 * base, 1); // branch2
  createElipsoide(`leaves_${id}`, treeGroup, 0,  2.25 * base, 0, new THREE.MeshBasicMaterial({ color: 0x228B22 }), 1.5 * base, 1* base, 1.5 * base); // leaves  
  createCylinder(`branch1_${id}`, treeGroup, 2/6 * base, 0.25 * base, 0, new THREE.MeshBasicMaterial({ color: 0x8B4513 }), 1/6 * base, 1/6 * base, 1.5 * base, -1); // branch1
  createElipsoide(`leaves2_${id}`, treeGroup, 1.1 * base, 1 * base, 0, new THREE.MeshBasicMaterial({ color: 0x228B22 }), 2/3 * base, 1/3 * base, 2/3 * base); // leaves2
}


function createOvni() {
    ovniGroup = new THREE.Group();
    const ovniY = 30;
    addGroup(ovniGroup, scene, 0, ovniY, 0);
    createElipsoide(`body_ovni`, ovniGroup, 0, 0, 0, new THREE.MeshBasicMaterial({ color: 0x808080 }), 2 * BASE, 0.7 * BASE, 2 * BASE); 
    createCylinder(`prop_ovni`, ovniGroup, 0, -0.7 * BASE, 0, new THREE.MeshBasicMaterial({ color: 0x228B22 }), 1 * BASE, 1 * BASE, 1/5 * BASE); // propeller
    createCapsule(`capsule_ovni`, ovniGroup, 0, 5 , 0, new THREE.MeshBasicMaterial({ color: 0x8B4513 }),   BASE , BASE); // capsule
   
    // Create target
    const propellerY = ovniY - 0.7 * BASE - 0.5 * (1/5 * BASE); // center of propeller

    // Create a spotlight target below the UFO
    const target = new THREE.Object3D();
    target.position.set(0, propellerY - 4 * BASE, 0);

    // Add spotlight to the cylinder
    spotLight = new THREE.SpotLight(0xffffff, 10); 
    spotLight.position.set(0, propellerY ,0);
    spotLight.target = target;
     scene.add(spotLight);       
    scene.add(spotLight.target);

    helper = new THREE.SpotLightHelper(spotLight);
    scene.add(helper);

    
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

/*function createCameras() {

  persp_camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 1000);
  persp_camera.position.x = 50;
  persp_camera.position.z = 50;
  persp_camera.position.y = 30;
  persp_camera.lookAt(scene.position);

  resizeCameras();
}*/

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

   /*const geometry = new THREE.BoxGeometry(10, 20, 20);
    const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: 0xD92649 }));
    mesh.position.set(30,30,30);
    scene.add(mesh);*/
}

function createTexture(dotColors, bgColor, dotSize, numDots, gradient) {
    console.log("Creating floral texture...");
     // Generate the procedural texture
        const textureSize = 512;
        const canvas = document.createElement("canvas");
        canvas.width = textureSize;
        canvas.height = textureSize;
        const context = canvas.getContext("2d");
    
      if(!gradient) {
        context.fillStyle = bgColor;
      }
      else{
        const gradient = context.createLinearGradient(0, 0, 0, textureSize);
        gradient.addColorStop(0, '#00008B'); // Blue color
        gradient.addColorStop(0.8, '#00008B'); // Blue color
        gradient.addColorStop(1, '#9400D3'); // Purple color
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


function createSkydome() {
        // Create a sphere geometry
        var geometry = new THREE.SphereGeometry(600, 32, 32,0,Math.PI * 2,0,Math.PI/2);

        // Apply the texture to the material
        materials.sky = new THREE.MeshPhongMaterial({ side: THREE.BackSide});
    
        // Create the skydome mesh
        var skydome = new THREE.Mesh(geometry,materials.sky);

        skydome.position.set(0,-100,0);

        // Add the skydome to your scene
        scene.add(skydome);
}


function createGround() {
    const groundGeo = new THREE.PlaneGeometry(1700, 1700, 250, 250);
    let disMap = new THREE.TextureLoader().load('/heightmap2.png');
    disMap.wrapS = disMap.wrapT = THREE.RepeatWrapping;

    materials.ground = new THREE.MeshPhongMaterial({
        displacementMap: disMap,
       displacementScale: 150,
        displacementBias: -50,

        //wireframe: true, 
        
        color:  0x228B22,
    });
    
    groundMesh = new THREE.Mesh(groundGeo, materials.ground);

    scene.add(groundMesh);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.rotation.y = 0;
}


function createMoon() {
    var moon = new THREE.Object3D();

    createSphere("moon", 50, 0xFFF5CC , 30, 300, 30);
    moonLight = new THREE.DirectionalLight(0xFFF5CC , 5);
    moonLight.position.set(-300, 300, -200);

    moonLight.target.position.set(1, -1, 1);
    scene.add(moonLight.target); // must be in the scene to work
    moon.add(moonLight);
    scene.add(moon);
}


function handleKey1() {
  if ((!prevKey1) && key1) {
   
      materials.ground.map = createTexture(flowerColors, "#228B22", 2, 1000, false);
    
    materials.ground.needsUpdate = true;
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
        moonLight.intensity = 5;
      }
    prevKeyD = true;
  }
}


function processKeys(time) {
  handleKey1();
  handleKey2();
  handleKeyD();
   
}




////////////
/* UPDATE */
////////////
function update() {
  let delta = clock.getDelta();
  processKeys(delta);
  controls.update();
  //checkCollisions();
 
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


   const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);
    const axesHelper = new THREE.AxesHelper(500); // 500 is the size — adjust as needed
    scene.add(axesHelper);
    controls = new OrbitControls( persp_camera, renderer.domElement);
    controls.target.x = scene.position.x;
    controls.target.y = scene.position.y+60;
    controls.target.z = scene.position.z;
     
      controls.update();

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);  
  window.addEventListener("resize", onResize);
}

function changeMaterials() {
    for (const key in allMeshes) {
        const mesh = allMeshes[key];
        const color = mesh.userData.originalColor;
        mesh.material = MATERIAL_TYPES[selectedMaterial](color);
    }
}



function animate() {
  helper.update();
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
        key1 = true;
        break;
    case 50: // 2
      key2 = true;
      break;
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
