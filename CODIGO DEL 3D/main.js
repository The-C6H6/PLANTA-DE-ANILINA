import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const palette = {
  sky: 0xd8e5f2,
  fog: 0xbdcedf,
  grass: 0x7f9660,
  grassDark: 0x657a4b,
  asphalt: 0x414c58,
  asphaltDark: 0x313a44,
  concrete: 0xc8d0d8,
  concreteDark: 0xa8b1ba,
  steel: 0xbcc7d0,
  steelDark: 0x7b8794,
  warmSteel: 0xd9d6cf,
  nb: 0x2d74c4,
  h2: 0xd94b44,
  feed: 0xb89234,
  recycle: 0x4bb36a,
  aniline: 0x909aa4,
  effluent: 0x555f68,
  accent: 0xf0b75f,
  flare: 0xff8f39,
  water: 0x3e6f94,
  storageFill: 0xdbe2d2,
  processFill: 0xdce8f5,
  hazardFill: 0xf4dfd7,
  utilityFill: 0xe7e2d8,
  controlFill: 0xddebd3,
  officeFill: 0xf9dfc5,
  effluentFill: 0xd9ead9,
  storageBorder: 0xd8a045,
  processBorder: 0x4f7cc3,
  hazardBorder: 0xd37f52,
  controlBorder: 0x6e9f64,
  officeBorder: 0xc98247,
  utilityBorder: 0x7d8c96,
};

const mount = document.querySelector('#scene');
const statusValue = document.querySelector('#status-value');
const gameModeButton = document.querySelector('#game-mode-button');
const gameModeValue = document.querySelector('#game-mode-value');
const gameHint = document.querySelector('#game-hint');
const focusButtons = [...document.querySelectorAll('[data-focus]')];
const toggleInputs = [...document.querySelectorAll('[data-toggle]')];

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(mount.clientWidth, mount.clientHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
mount.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(palette.sky);
scene.fog = new THREE.Fog(palette.fog, 185, 430);

const camera = new THREE.PerspectiveCamera(42, mount.clientWidth / mount.clientHeight, 0.1, 1200);
camera.position.set(168, 122, 156);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.enableRotate = true;
controls.enablePan = true;
controls.screenSpacePanning = true;
controls.minDistance = 35;
controls.maxDistance = 320;
controls.minPolarAngle = 0.08;
controls.maxPolarAngle = Math.PI / 2 - 0.04;
controls.rotateSpeed = 0.88;
controls.zoomSpeed = 1;
controls.panSpeed = 0.95;
controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE;
controls.mouseButtons.MIDDLE = THREE.MOUSE.DOLLY;
controls.mouseButtons.RIGHT = THREE.MOUSE.PAN;
controls.touches.ONE = THREE.TOUCH.ROTATE;
controls.touches.TWO = THREE.TOUCH.DOLLY_PAN;
controls.target.set(10, 12, 6);

const world = new THREE.Group();
const pipesGroup = new THREE.Group();
const labels = [];
const labelTargets = [];
const animatedFans = [];
const animatedFlames = [];
const animatedWorkers = [];
const collisionTargets = [];
const interactiveTargets = [];
const zoneRegistry = new Map();
const keyState = {
  KeyW: false,
  KeyA: false,
  KeyS: false,
  KeyD: false,
  ArrowUp: false,
  ArrowLeft: false,
  ArrowDown: false,
  ArrowRight: false,
  ShiftLeft: false,
  ShiftRight: false,
};
const playerState = {
  worker: null,
  active: false,
  pointerLocked: false,
  yaw: Math.PI * 0.86,
  pitch: 0.42,
  radius: 35,
  targetHeight: 3.2,
  moveIntensity: 0,
  moveCycle: 0,
  worldPosition: new THREE.Vector3(),
  parentWorld: new THREE.Vector3(),
  velocity: new THREE.Vector3(),
  moveVector: new THREE.Vector3(),
  lookVector: new THREE.Vector3(),
  rightVector: new THREE.Vector3(),
  cameraOffset: new THREE.Vector3(),
  cameraTarget: new THREE.Vector3(),
  lastZoneKey: 'product',
  playableLabel: 'Operario',
};
const siteBounds = {
  minX: -121,
  maxX: 121,
  minZ: -89,
  maxZ: 89,
};
let previousFrameTime = performance.now();

scene.add(world);
world.add(pipesGroup);

const raycaster = new THREE.Raycaster();
const cameraCollisionRaycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const pointerDown = new THREE.Vector2();

const desiredCameraPosition = new THREE.Vector3(168, 122, 156);
const desiredTarget = new THREE.Vector3(10, 12, 6);
let isCameraAnimating = false;
let isUserDragging = false;
let activeZoneKey = null;
let activeFocusKey = 'general';

const focusViews = {
  general: {
    label: 'Vista general',
    position: new THREE.Vector3(168, 122, 156),
    target: new THREE.Vector3(10, 10, 6),
  },
  feedstocks: {
    label: 'Materias primas',
    position: new THREE.Vector3(-18, 72, 76),
    target: new THREE.Vector3(-56, 8, -18),
  },
  reaction: {
    label: 'Reaccion',
    position: new THREE.Vector3(88, 78, 28),
    target: new THREE.Vector3(38, 12, -38),
  },
  nitro: {
    label: 'Nitrobenceno',
    position: new THREE.Vector3(-24, 56, 28),
    target: new THREE.Vector3(-55, 8, -47),
  },
  hydrogen: {
    label: 'Hidrogeno',
    position: new THREE.Vector3(-18, 56, 86),
    target: new THREE.Vector3(-67, 8, 4),
  },
  mixing: {
    label: 'Preparacion y mezcla',
    position: new THREE.Vector3(36, 46, 8),
    target: new THREE.Vector3(-10, 7, -47),
  },
  rit: {
    label: 'Precalentamiento y compresion',
    position: new THREE.Vector3(76, 48, 2),
    target: new THREE.Vector3(21, 8, -44),
  },
  reactor: {
    label: 'Reactor',
    position: new THREE.Vector3(112, 54, 4),
    target: new THREE.Vector3(55, 12, -44),
  },
  cooling: {
    label: 'Enfriamiento y condensacion',
    position: new THREE.Vector3(134, 46, 0),
    target: new THREE.Vector3(82, 8, -43),
  },
  separation: {
    label: 'Separacion',
    position: new THREE.Vector3(134, 68, 58),
    target: new THREE.Vector3(66, 10, 2),
  },
  distillation: {
    label: 'Destilacion y purificacion',
    position: new THREE.Vector3(158, 58, 56),
    target: new THREE.Vector3(97, 10, 6),
  },
  product: {
    label: 'Producto y despacho',
    position: new THREE.Vector3(126, 64, 132),
    target: new THREE.Vector3(76, 8, 48),
  },
  services: {
    label: 'Servicios',
    position: new THREE.Vector3(48, 54, 164),
    target: new THREE.Vector3(-8, 8, 70),
  },
  flare: {
    label: 'Antorcha',
    position: new THREE.Vector3(162, 48, -8),
    target: new THREE.Vector3(109, 12, -58),
  },
};

const zoneViews = {
  nitro: 'nitro',
  hydrogen: 'hydrogen',
  mixing: 'mixing',
  rit: 'rit',
  reactor: 'reactor',
  cooling: 'cooling',
  separation: 'separation',
  distillation: 'distillation',
  product: 'product',
  wastewater: 'services',
  support: 'services',
  flare: 'flare',
};

window.__plant3d = {
  camera,
  controls,
  focusViews,
  zoneViews,
  zoneRegistry,
  getState: () => ({
    activeZoneKey,
    isCameraAnimating,
    isGameMode: playerState.active,
    cameraPosition: camera.position.toArray(),
    target: controls.target.toArray(),
    focusKey: activeFocusKey,
  }),
  getWorkerMotionSample: () => animatedWorkers.slice(0, 4).map((worker, index) => ({
    index,
    y: worker.root.position.y,
    bodyTilt: worker.bodyRoot.rotation.z,
    headTurn: worker.headPivot.rotation.y,
  })),
  getPlayerState: () => playerState.worker ? {
    active: playerState.active,
    pointerLocked: playerState.pointerLocked,
    worldPosition: playerState.worker.root.getWorldPosition(new THREE.Vector3()).toArray(),
    yaw: playerState.yaw,
    pitch: playerState.pitch,
    zoneKey: playerState.lastZoneKey,
  } : null,
  focusZone: (zoneKey) => {
    const focusKey = zoneViews[zoneKey] ?? 'general';
    setActiveZone(zoneKey);
    setFocusView(focusKey, { zoneKey });
  },
  getLabelScreenPoint: (zoneKey) => {
    const zone = zoneRegistry.get(zoneKey);
    if (!zone) {
      return null;
    }

    const position = zone.sprite.getWorldPosition(new THREE.Vector3()).project(camera);
    return {
      x: ((position.x + 1) / 2) * renderer.domElement.clientWidth,
      y: ((-position.y + 1) / 2) * renderer.domElement.clientHeight,
    };
  },
  toggleGameMode: () => setGameMode(!playerState.active),
  setFocusView,
};

buildScene();
bindUi();
animate();

function buildScene() {
  addLights();
  addSite();
  addZonesAndEquipment();
  addPipeNetwork();
}

function addLights() {
  const hemi = new THREE.HemisphereLight(0xf0f6ff, 0x4e5e3b, 1.05);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xffffff, 1.45);
  key.position.set(120, 180, 80);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 10;
  key.shadow.camera.far = 420;
  key.shadow.camera.left = -190;
  key.shadow.camera.right = 190;
  key.shadow.camera.top = 170;
  key.shadow.camera.bottom = -170;
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xc5ddff, 0.4);
  fill.position.set(-80, 90, -60);
  scene.add(fill);
}

function addSite() {
  const ground = createMesh(
    new THREE.PlaneGeometry(320, 240),
    new THREE.MeshStandardMaterial({ color: palette.grass, roughness: 0.98 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  world.add(ground);

  const water = createMesh(
    new THREE.PlaneGeometry(320, 18),
    new THREE.MeshStandardMaterial({ color: palette.water, roughness: 0.25, metalness: 0.2 })
  );
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, 0.03, 110);
  world.add(water);

  addAsphaltPatch(0, 0, 246, 182);
  addAsphaltPatch(-108, 0, 20, 168);
  addAsphaltPatch(112, -14, 20, 154);
  addAsphaltPatch(6, -84, 232, 18);
  addAsphaltPatch(8, 22, 182, 14);
  addAsphaltPatch(74, 82, 118, 14);
  addAsphaltPatch(101, 52, 18, 64);
  addAsphaltPatch(-12, 94, 156, 16);

  addLaneMarks();
  addFence(248, 186);
  addTrees();
  addPipeRack({ x: 18, z: -22, length: 148, axis: 'x', levels: 2 });
  addPipeRack({ x: 26, z: 16, length: 124, axis: 'x', levels: 2 });
  addPipeRack({ x: 56, z: 38, length: 110, axis: 'x', levels: 1 });
  addPipeRack({ x: 26, z: -1, length: 68, axis: 'z', levels: 1 });
}

function addAsphaltPatch(x, z, width, depth) {
  const patch = createMesh(
    new THREE.BoxGeometry(width, 0.18, depth),
    new THREE.MeshStandardMaterial({ color: palette.asphalt, roughness: 0.94 })
  );
  patch.position.set(x, 0.09, z);
  patch.receiveShadow = true;
  world.add(patch);
}

function addLaneMarks() {
  const marks = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({ color: 0xf3f4ef });

  const lines = [
    { x: -108, z: -10, w: 1, d: 90, dash: true, rot: 0 },
    { x: -108, z: 52, w: 1, d: 28, dash: true, rot: 0 },
    { x: 113, z: -18, w: 1, d: 76, dash: true, rot: 0 },
    { x: 113, z: 53, w: 1, d: 30, dash: true, rot: 0 },
    { x: 8, z: -84, w: 180, d: 1, dash: true, rot: Math.PI / 2 },
    { x: 8, z: 94, w: 110, d: 1, dash: true, rot: Math.PI / 2 },
  ];

  lines.forEach((line) => {
    const count = line.dash ? Math.floor(line.d / 10) : 1;
    for (let index = 0; index < count; index += 1) {
      const dash = new THREE.Mesh(new THREE.PlaneGeometry(line.w, line.dash ? 5 : line.d), material);
      dash.rotation.x = -Math.PI / 2;
      dash.rotation.z = line.rot;
      dash.position.set(
        line.x + (line.rot ? (index - (count - 1) / 2) * 10 : 0),
        0.21,
        line.z + (line.rot ? 0 : (index - (count - 1) / 2) * 10)
      );
      marks.add(dash);
    }
  });

  world.add(marks);
}

function addFence(width, depth) {
  const posts = new THREE.Group();
  const postMaterial = new THREE.MeshStandardMaterial({ color: 0xcfd9df, metalness: 0.6, roughness: 0.35 });
  const railMaterial = new THREE.LineBasicMaterial({ color: 0xaebdca });

  const halfWidth = width / 2;
  const halfDepth = depth / 2;
  const spacing = 12;

  for (let x = -halfWidth; x <= halfWidth; x += spacing) {
    addFencePost(x, -halfDepth);
    addFencePost(x, halfDepth);
  }

  for (let z = -halfDepth + spacing; z < halfDepth; z += spacing) {
    addFencePost(-halfWidth, z);
    addFencePost(halfWidth, z);
  }

  function addFencePost(x, z) {
    const post = createMesh(new THREE.BoxGeometry(0.75, 4.4, 0.75), postMaterial);
    post.position.set(x, 2.2, z);
    posts.add(post);
  }

  const railPoints = [
    new THREE.Vector3(-halfWidth, 4, -halfDepth),
    new THREE.Vector3(halfWidth, 4, -halfDepth),
    new THREE.Vector3(halfWidth, 4, halfDepth),
    new THREE.Vector3(-halfWidth, 4, halfDepth),
    new THREE.Vector3(-halfWidth, 4, -halfDepth),
  ];

  const lowerRail = new THREE.Line(new THREE.BufferGeometry().setFromPoints(railPoints), railMaterial);
  const upperRail = lowerRail.clone();
  upperRail.position.y = 1.5;

  world.add(posts, lowerRail, upperRail);
}

function addTrees() {
  const treePositions = [
    [-128, -90], [-128, -66], [-128, -42], [-128, -18], [-128, 30],
    [-118, 104], [-84, 104], [-52, 104], [10, 104], [50, 104], [122, 102],
    [132, -82], [132, -36], [132, 2], [132, 44], [132, 84],
  ];

  treePositions.forEach(([x, z], index) => {
    const tree = new THREE.Group();
    const trunk = createMesh(
      new THREE.CylinderGeometry(0.5, 0.7, 3.5, 7),
      new THREE.MeshStandardMaterial({ color: 0x6a4b2c, roughness: 0.95 })
    );
    trunk.position.y = 1.8;

    const crown = createMesh(
      new THREE.ConeGeometry(2.8 + (index % 3) * 0.3, 6.8, 8),
      new THREE.MeshStandardMaterial({ color: palette.grassDark, roughness: 0.95 })
    );
    crown.position.y = 6.2;

    tree.add(trunk, crown);
    tree.position.set(x, 0, z);
    world.add(tree);
  });
}

function addPipeRack({ x, z, length, axis, levels }) {
  const rack = new THREE.Group();
  const span = axis === 'x' ? length / 2 : length / 2;
  const step = 16;
  const count = Math.floor(length / step);
  const beamMaterial = new THREE.MeshStandardMaterial({ color: 0x5d6f7b, metalness: 0.48, roughness: 0.52 });

  for (let index = 0; index <= count; index += 1) {
    const offset = -span + index * step;
    const postLeft = createMesh(new THREE.BoxGeometry(0.9, 9, 0.9), beamMaterial);
    const postRight = createMesh(new THREE.BoxGeometry(0.9, 9, 0.9), beamMaterial);

    if (axis === 'x') {
      postLeft.position.set(offset, 4.5, -3.5);
      postRight.position.set(offset, 4.5, 3.5);
    } else {
      postLeft.position.set(-3.5, 4.5, offset);
      postRight.position.set(3.5, 4.5, offset);
    }

    rack.add(postLeft, postRight);
  }

  for (let level = 0; level < levels; level += 1) {
    const beam = createMesh(
      new THREE.BoxGeometry(axis === 'x' ? length : 7.6, 0.55, axis === 'x' ? 7.6 : length),
      beamMaterial
    );
    beam.position.set(0, 7 + level * 2.6, 0);
    rack.add(beam);
  }

  rack.position.set(x, 0, z);
  world.add(rack);
}

function addZonesAndEquipment() {
  const nitroZone = addZone({
    key: 'nitro',
    label: 'Descarga y tanques de nitrobenceno',
    center: [-56, -47],
    size: [64, 34],
    fill: palette.storageFill,
    border: palette.storageBorder,
  });
  addTruck(nitroZone, -23, 8, Math.PI / 2, { tankColor: palette.steel, bodyColor: 0x30455e });
  addCanopy(nitroZone, -28, 8, 18, 16, 8, 0x4f7cc3);
  addTankGroup(nitroZone, [
    [-8, -7, 5, 19],
    [6, -7, 5, 19],
    [20, -7, 5, 20],
    [-1, 9, 5, 18],
    [16, 9, 5, 18],
  ], { bodyColor: palette.warmSteel, trimColor: palette.accent });
  const nitroPump = createPumpSkid({ accentColor: palette.nb, scale: 0.82 });
  nitroPump.position.set(24, 0.35, 8);
  nitroZone.add(nitroPump);
  addPersonnel(nitroZone, [
    { x: -26, z: 2, rotation: Math.PI * 0.18, scale: 1.02, pose: 'idle', expression: 'wide' },
    { x: -20, z: 10, rotation: -Math.PI * 0.12, scale: 0.96, pose: 'pointing', expression: 'alert' },
  ]);

  const hydrogenZone = addZone({
    key: 'hydrogen',
    label: 'Descarga y regulacion de H2',
    center: [-67, 4],
    size: [58, 26],
    fill: palette.hazardFill,
    border: palette.hazardBorder,
  });
  addTruck(hydrogenZone, -22, 4, Math.PI / 2, { tankColor: 0xd4d8dc, bodyColor: 0x596b7b });
  addCylinderBundle(hydrogenZone, -6, 0);
  const h2Mixer = createVerticalSeparator(1.6, 8.2, { color: 0xdce2e8, trimColor: palette.hazardBorder });
  h2Mixer.position.set(9, 0, -4);
  hydrogenZone.add(h2Mixer);
  addHorizontalVessel(hydrogenZone, 13, 2, 14, 2.5, { color: palette.steel, y: 5 });
  addHorizontalVessel(hydrogenZone, 19, -4, 12, 2.1, { color: palette.steel, y: 5 });
  addPersonnel(hydrogenZone, [
    { x: -10, z: 8, rotation: Math.PI * 0.1, scale: 0.98, pose: 'idle', expression: 'skeptical' },
    { x: 2, z: -7, rotation: Math.PI * 0.44, scale: 0.92, pose: 'hands', expression: 'wide' },
  ]);

  const mixingZone = addZone({
    key: 'mixing',
    label: 'Preparacion y mezcla',
    center: [-10, -47],
    size: [28, 30],
    fill: palette.processFill,
    border: palette.processBorder,
  });
  addMixingSkid(mixingZone, 0, 0);

  const ritZone = addZone({
    key: 'rit',
    label: 'Precalentamiento y RIT',
    center: [21, -44],
    size: [46, 32],
    fill: palette.processFill,
    border: palette.processBorder,
  });
  addReactionTrain(ritZone, 0, 0);

  const reactorZone = addZone({
    key: 'reactor',
    label: 'Reactor catalitico',
    center: [55, -44],
    size: [26, 28],
    fill: palette.processFill,
    border: palette.processBorder,
  });
  addCatalyticReactor(reactorZone, 0, 0);

  const coolingZone = addZone({
    key: 'cooling',
    label: 'Enfriamiento y condensacion',
    center: [82, -43],
    size: [38, 26],
    fill: palette.processFill,
    border: palette.processBorder,
  });
  addCoolingBank(coolingZone, 0, 0);

  const separationZone = addZone({
    key: 'separation',
    label: 'Separacion y decantacion',
    center: [50, 4],
    size: [60, 30],
    fill: palette.processFill,
    border: palette.processBorder,
  });
  addPrimarySeparation(separationZone, 0, 0);

  const distillationZone = addZone({
    key: 'distillation',
    label: 'Destilacion y purificacion',
    center: [97, 6],
    size: [42, 36],
    fill: palette.processFill,
    border: palette.processBorder,
  });
  addDistillationSection(distillationZone, 0, 0);
  addPersonnel(distillationZone, [
    { x: -3, z: 12, rotation: Math.PI * 0.88, scale: 1.04, pose: 'pointing', expression: 'alert' },
    { x: 23, z: 9, rotation: -Math.PI * 0.6, scale: 0.96, pose: 'idle', expression: 'skeptical' },
  ]);

  const productZone = addZone({
    key: 'product',
    label: 'Tanques, envasado y despacho',
    center: [78, 48],
    size: [58, 32],
    fill: palette.storageFill,
    border: palette.storageBorder,
  });
  addTankGroup(productZone, [
    [-12, 2, 5.4, 22],
    [4, 2, 5.4, 22],
    [20, 2, 5.4, 22],
  ], { bodyColor: 0xdbe0e4, trimColor: palette.nb, label: 'ANILINA' });
  addDrumArea(productZone, 15, 7);
  addTruck(productZone, 28, 7, Math.PI / 2, { tankColor: 0xd7dce0, bodyColor: 0x48647d, scale: 0.9 });
  addCanopy(productZone, 25, 7, 16, 14, 8, 0x4f7cc3);
  addPersonnel(productZone, [
    { x: 10, z: 10, rotation: Math.PI * 0.08, scale: 1, pose: 'hands', expression: 'skeptical', playable: true, name: 'Operario de despacho' },
    { x: 26, z: 2, rotation: Math.PI * 0.58, scale: 0.92, pose: 'idle', expression: 'wide' },
  ]);

  const wastewaterZone = addZone({
    key: 'wastewater',
    label: 'Tratamiento de efluentes',
    center: [-93, 53],
    size: [40, 34],
    fill: palette.effluentFill,
    border: palette.controlBorder,
  });
  addWaterTreatment(wastewaterZone, 0, 0);

  const supportZone = addZone({
    key: 'support',
    label: 'Servicios, control y administracion',
    center: [8, 76],
    size: [154, 26],
    fill: palette.utilityFill,
    border: palette.utilityBorder,
  });
  addSupportBuildings(supportZone, 0, 0);
  addPersonnel(supportZone, [
    { x: -8, z: -5, rotation: Math.PI * 0.18, scale: 1.02, pose: 'idle', expression: 'skeptical' },
    { x: 20, z: -4, rotation: -Math.PI * 0.14, scale: 0.96, pose: 'pointing', expression: 'alert' },
    { x: 52, z: -2, rotation: -Math.PI * 0.32, scale: 0.9, pose: 'hands', expression: 'wide' },
  ]);

  const flareZone = addZone({
    key: 'flare',
    label: 'Antorcha',
    center: [109, -58],
    size: [12, 18],
    fill: palette.hazardFill,
    border: palette.hazardBorder,
  });
  addFlare(flareZone, 0, 0);
}

function addZone({ key, label, center, size, fill, border }) {
  const group = new THREE.Group();
  group.position.set(center[0], 0, center[1]);

  const padMaterial = new THREE.MeshStandardMaterial({
    color: fill,
    roughness: 0.98,
    metalness: 0.02,
    emissive: 0x000000,
  });

  const pad = createMesh(new THREE.BoxGeometry(size[0], 1.6, size[1]), padMaterial);
  pad.position.y = 0.8;
  pad.receiveShadow = true;
  group.add(pad);

  const outline = addRectOutline(size[0] + 1.2, size[1] + 1.2, border, 1.64);
  group.add(outline);

  const volume = new THREE.Mesh(new THREE.BoxGeometry(size[0], 18, size[1]), new THREE.MeshBasicMaterial({ visible: false }));
  volume.position.y = 9;
  volume.userData.key = key;
  interactiveTargets.push(volume);
  group.add(volume);

  const sprite = createLabelSprite(label, border);
  sprite.position.set(0, 15, 0);
  sprite.userData.zoneKey = key;
  sprite.userData.focusKey = zoneViews[key] ?? 'general';
  group.add(sprite);
  labels.push(sprite);
  labelTargets.push(sprite);

  zoneRegistry.set(key, {
    key,
    label,
    pad,
    outline,
    sprite,
    center: new THREE.Vector2(center[0], center[1]),
    size: new THREE.Vector2(size[0], size[1]),
  });
  world.add(group);
  return group;
}

function addRectOutline(width, depth, color, y) {
  const points = [
    new THREE.Vector3(-width / 2, y, -depth / 2),
    new THREE.Vector3(width / 2, y, -depth / 2),
    new THREE.Vector3(width / 2, y, depth / 2),
    new THREE.Vector3(-width / 2, y, depth / 2),
    new THREE.Vector3(-width / 2, y, -depth / 2),
  ];

  return new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color }));
}

function addTankGroup(parent, entries, { bodyColor, trimColor, label }) {
  entries.forEach(([x, z, radius, height], index) => {
    const tank = createVerticalTank(radius, height, { bodyColor, trimColor, label: label && index < 3 ? label : '' });
    tank.position.set(x, 0.1, z);
    parent.add(tank);
  });
}

function createVerticalTank(radius, height, { bodyColor, trimColor, label }) {
  const group = new THREE.Group();
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.58, metalness: 0.26 });
  const trimMaterial = new THREE.MeshStandardMaterial({ color: trimColor, roughness: 0.45, metalness: 0.52 });

  const shell = createMesh(
    new THREE.CylinderGeometry(radius, radius, height, 28),
    bodyMaterial
  );
  shell.position.y = height / 2 + 2.2;
  group.add(shell);

  const roof = createMesh(new THREE.CylinderGeometry(radius * 1.04, radius * 0.82, 2.5, 28), bodyMaterial);
  roof.position.y = height + 2.2;
  group.add(roof);

  const topRing = createMesh(new THREE.TorusGeometry(radius * 1.04, 0.22, 10, 40), trimMaterial);
  topRing.rotation.x = Math.PI / 2;
  topRing.position.y = height + 3.2;
  group.add(topRing);

  const baseRing = createMesh(new THREE.TorusGeometry(radius * 1.05, 0.18, 10, 36), trimMaterial);
  baseRing.rotation.x = Math.PI / 2;
  baseRing.position.y = 2.1;
  group.add(baseRing);

  for (let index = 0; index < 4; index += 1) {
    const angle = (index / 4) * Math.PI * 2;
    const leg = createMesh(new THREE.CylinderGeometry(0.18, 0.18, 2, 10), trimMaterial);
    leg.position.set(Math.cos(angle) * (radius * 0.68), 1, Math.sin(angle) * (radius * 0.68));
    group.add(leg);
  }

  const ladder = createMesh(new THREE.BoxGeometry(0.3, height - 1, 0.3), trimMaterial);
  ladder.position.set(radius * 0.92, height / 2 + 2.4, 0);
  group.add(ladder);

  const cap = createMesh(new THREE.CylinderGeometry(0.35, 0.35, 1.3, 10), trimMaterial);
  cap.position.y = height + 4.2;
  group.add(cap);

  if (label) {
    const text = createLabelSprite(label, palette.nb, {
      fontSize: 42,
      width: 420,
      height: 128,
      background: 'rgba(255,255,255,0.82)',
      textColor: '#1b3c63',
      borderColor: '#5f89c6',
    });
    text.position.set(0, height / 2 + 2.4, radius + 0.5);
    text.scale.set(8, 2.8, 1);
    group.add(text);
    labels.push(text);
  }

  return group;
}

function addMixingSkid(parent, x, z) {
  const skid = new THREE.Group();
  skid.position.set(x, 0, z);

  addSkidFrame(skid, 0, 0, 20, 13);

  const vesselA = createVerticalSeparator(2.2, 9.6, { color: palette.steel, trimColor: palette.nb });
  vesselA.position.set(-4.4, 0, 1.2);
  skid.add(vesselA);

  const vesselB = createVerticalSeparator(1.45, 7.2, { color: palette.steelDark, trimColor: palette.processBorder });
  vesselB.position.set(3.6, 0, -2.6);
  skid.add(vesselB);

  const manifold = createMesh(
    new THREE.BoxGeometry(10.5, 0.5, 1),
    new THREE.MeshStandardMaterial({ color: 0x6a8293, roughness: 0.56, metalness: 0.26 })
  );
  manifold.position.set(0.8, 3.8, 0);
  skid.add(manifold);

  const pump = createPumpSkid({ accentColor: palette.nb, scale: 0.78 });
  pump.position.set(5.2, 0.4, 3.2);
  skid.add(pump);

  addEquipmentTag(skid, 'MIX-NB', -4.4, 13.6, 3.8, palette.nb, { scale: [4.6, 1.55, 1] });
  addEquipmentTag(skid, 'MIX-100', 3.6, 10.6, -6, palette.processBorder, { scale: [4.8, 1.55, 1] });

  parent.add(skid);
}

function addReactionTrain(parent, x, z) {
  const skid = new THREE.Group();
  skid.position.set(x, 0, z);

  addSkidFrame(skid, 0, 0, 36, 18);

  const h2Rit = createHorizontalExchanger(10.5, 1.55);
  h2Rit.position.set(-13.5, 5.3, -5.2);
  skid.add(h2Rit);

  const h2Heater = createHorizontalExchanger(10, 1.45);
  h2Heater.position.set(-5, 5.1, -5.2);
  skid.add(h2Heater);

  const nbRit = createHorizontalExchanger(10.5, 1.55);
  nbRit.position.set(-13.5, 5.3, 5.2);
  skid.add(nbRit);

  const nbHeater = createHorizontalExchanger(10, 1.45);
  nbHeater.position.set(-5, 5.1, 5.2);
  skid.add(nbHeater);

  const h2Mix = createVerticalSeparator(1.15, 6.4, { color: 0xd8dee4, trimColor: palette.hazardBorder });
  h2Mix.position.set(4.8, 0, -5.6);
  skid.add(h2Mix);

  const nbMix = createVerticalSeparator(1.25, 6.8, { color: palette.steel, trimColor: palette.nb });
  nbMix.position.set(5.4, 0, 5.2);
  skid.add(nbMix);

  const mainMixer = createVerticalSeparator(1.7, 8.2, { color: palette.warmSteel, trimColor: palette.processBorder });
  mainMixer.position.set(11.4, 0, -0.1);
  skid.add(mainMixer);

  const compressor = createCompressor();
  compressor.position.set(18.6, 0, 0);
  skid.add(compressor);

  const trimHeater = createHorizontalExchanger(9.5, 1.35);
  trimHeater.position.set(27.4, 5, 0);
  skid.add(trimHeater);

  addPipeRunToParent(skid, [
    [-9.35, 5.3, -5.2],
    [-9.35, 6.55, -5.2],
    [-9, 6.55, -5.2],
    [-9, 5.3, -5.2],
  ], 0.22, palette.h2);

  addPipeRunToParent(skid, [
    [-1, 5.3, -5.2],
    [2.4, 5.3, -5.2],
    [2.4, 8.2, -5.6],
    [4.8, 8.2, -5.6],
  ], 0.22, palette.h2);

  addEquipmentTag(skid, 'E-100', -13.5, 9.4, 9.2, palette.nb, { scale: [3.8, 1.55, 1] });
  addEquipmentTag(skid, 'E-106', -5, 9.4, 9.2, palette.nb, { scale: [3.8, 1.55, 1] });
  addEquipmentTag(skid, 'H-100', -5, 9.3, -9.2, palette.hazardBorder, { scale: [3.8, 1.55, 1] });
  addEquipmentTag(skid, 'CO-100', 19.2, 8.7, 5.4, palette.processBorder, { scale: [4.8, 1.55, 1] });

  parent.add(skid);
}

function addCatalyticReactor(parent, x, z) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const reactorBody = createVerticalVessel(3.4, 22, { color: palette.steel, trimColor: palette.processBorder });
  reactorBody.position.set(0, 0, 0);
  group.add(reactorBody);

  for (let index = 0; index < 3; index += 1) {
    const band = createMesh(
      new THREE.TorusGeometry(3.55, 0.16, 10, 42),
      new THREE.MeshStandardMaterial({ color: palette.processBorder, metalness: 0.54, roughness: 0.34 })
    );
    band.rotation.x = Math.PI / 2;
    band.position.y = 7 + index * 5.4;
    group.add(band);
  }

  const serviceVessel = createVerticalVessel(1.3, 6.5, { color: palette.warmSteel });
  serviceVessel.position.set(-6.5, 0, 2.2);
  group.add(serviceVessel);

  parent.add(group);
}

function addCoolingBank(parent, x, z) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const steelMaterial = new THREE.MeshStandardMaterial({ color: 0x778491, roughness: 0.66, metalness: 0.28 });
  const postPositions = [-14, -4.5, 4.5, 14];
  postPositions.forEach((postX) => {
    [-5.2, 5.2].forEach((postZ) => {
      const post = createMesh(new THREE.BoxGeometry(0.55, 9.5, 0.55), steelMaterial);
      post.position.set(postX, 4.75, postZ);
      group.add(post);
    });
  });

  [-5.2, 5.2].forEach((beamZ) => {
    const topBeam = createMesh(new THREE.BoxGeometry(29.8, 0.42, 0.42), steelMaterial);
    topBeam.position.set(0, 9.3, beamZ);
    group.add(topBeam);
  });

  [-14, -4.5, 4.5, 14].forEach((beamX) => {
    const topBeam = createMesh(new THREE.BoxGeometry(0.42, 0.42, 10.8), steelMaterial);
    topBeam.position.set(beamX, 9.3, 0);
    group.add(topBeam);
  });

  const exchangerA = createHorizontalExchanger(13.5, 1.65);
  exchangerA.position.set(-7.2, 5.3, -2.8);
  group.add(exchangerA);

  const exchangerB = createHorizontalExchanger(13.5, 1.65);
  exchangerB.position.set(7.2, 5.3, 2.8);
  group.add(exchangerB);

  const fanMaterial = new THREE.MeshStandardMaterial({ color: 0x3f4c58, roughness: 0.72, metalness: 0.18 });
  const fanPositions = [-10.8, -3.6, 3.6, 10.8];
  fanPositions.forEach((fanX) => {
    const fanHousing = createMesh(new THREE.CylinderGeometry(2.1, 2.1, 1.2, 24), fanMaterial);
    fanHousing.rotation.x = Math.PI / 2;
    fanHousing.position.set(fanX, 8.3, 0);
    group.add(fanHousing);

    const blades = new THREE.Group();
    for (let index = 0; index < 4; index += 1) {
      const blade = createMesh(
        new THREE.BoxGeometry(3.4, 0.12, 0.52),
        new THREE.MeshStandardMaterial({ color: 0xd5dde4, roughness: 0.42, metalness: 0.58 })
      );
      blade.rotation.y = (Math.PI / 2) * index;
      blades.add(blade);
    }
    blades.position.set(fanX, 8.7, 0);
    animatedFans.push(blades);
    group.add(blades);
  });

  const drainDrum = createVerticalSeparator(1, 5.6, { color: palette.steelDark, trimColor: palette.processBorder });
  drainDrum.position.set(13.6, 0, -7.4);
  group.add(drainDrum);

  addEquipmentTag(group, 'E-101', -7.2, 9.5, -7.4, palette.processBorder, { scale: [3.8, 1.45, 1] });
  addEquipmentTag(group, 'E-103', 7.4, 9.5, 7.3, palette.processBorder, { scale: [3.8, 1.45, 1] });

  parent.add(group);
}

function addPrimarySeparation(parent, x, z) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  addSkidFrame(group, -10, 0, 24, 16);

  const separator = createVerticalSeparator(2.45, 13.8, { color: palette.steel, trimColor: palette.processBorder });
  separator.position.set(-14, 0, -1);
  group.add(separator);

  const valveStand = new THREE.Group();
  const valveBody = createMesh(
    new THREE.CylinderGeometry(0.85, 0.85, 3.1, 18),
    new THREE.MeshStandardMaterial({ color: 0x6f8391, roughness: 0.52, metalness: 0.36 })
  );
  valveBody.rotation.z = Math.PI / 2;
  valveBody.position.set(0, 7.3, -5.8);
  valveStand.add(valveBody);

  const valveStem = createMesh(
    new THREE.CylinderGeometry(0.18, 0.18, 2.4, 12),
    new THREE.MeshStandardMaterial({ color: palette.accent, roughness: 0.36, metalness: 0.54 })
  );
  valveStem.position.set(0, 8.9, -5.8);
  valveStand.add(valveStem);

  const handWheel = createMesh(
    new THREE.TorusGeometry(0.8, 0.11, 8, 20),
    new THREE.MeshStandardMaterial({ color: palette.accent, roughness: 0.38, metalness: 0.48 })
  );
  handWheel.rotation.x = Math.PI / 2;
  handWheel.position.set(0, 9.8, -5.8);
  valveStand.add(handWheel);
  group.add(valveStand);

  const decanter = createDetailedHorizontalSeparator(17.5, 2.25, { color: palette.warmSteel, accentColor: palette.processBorder });
  decanter.position.set(13.5, 5.7, 3.6);
  group.add(decanter);

  const transferPump = createPumpSkid({ accentColor: palette.processBorder, scale: 0.74 });
  transferPump.position.set(11.4, 0.35, -8.2);
  group.add(transferPump);

  const sealPot = createVerticalSeparator(1, 5.2, { color: palette.steelDark, trimColor: palette.processBorder });
  sealPot.position.set(3.5, 0, -8);
  group.add(sealPot);

  addEquipmentTag(group, 'V-101', -14, 18.4, 4, palette.processBorder, { scale: [3.8, 1.45, 1] });
  addEquipmentTag(group, 'V-100', 13.5, 10.4, 8.4, palette.processBorder, { scale: [3.8, 1.45, 1] });

  parent.add(group);
}

function addDistillationSection(parent, x, z) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  const columnBHeight = 33.2;
  const columnBTopPipeY = 34.8;
  const condenserBPipeY = 29.8;

  addSkidFrame(group, 0, 0, 36, 20);

  const columnA = createDistillationColumn(2.45, 18.2);
  columnA.position.set(-12, 0, -6);
  group.add(columnA);

  const condenserA = createHorizontalExchanger(8.4, 1.05);
  condenserA.position.set(-17.8, 14.3, -11.2);
  group.add(condenserA);
  addEquipmentStand(group, -17.8, -11.2, 10.2, 4.4, 12.5);

  const e104 = createHorizontalExchanger(10.5, 1.45);
  e104.position.set(-16.6, 5.1, 8.4);
  group.add(e104);

  const refluxPump = createPumpSkid({ accentColor: palette.processBorder, scale: 0.72 });
  refluxPump.position.set(-7.8, 0.35, 8.4);
  group.add(refluxPump);

  const v102 = createDetailedHorizontalSeparator(12.5, 1.75, { color: palette.steel, accentColor: palette.processBorder });
  v102.position.set(-2.2, 5.1, -7.2);
  group.add(v102);

  const mix102 = createVerticalSeparator(1.35, 6.4, { color: palette.steelDark, trimColor: palette.processBorder });
  mix102.position.set(6.4, 0, -1.8);
  group.add(mix102);

  const e105 = createHorizontalExchanger(9.8, 1.35);
  e105.position.set(4.4, 4.8, 10.5);
  group.add(e105);

  const columnB = createDistillationColumn(2.15, columnBHeight);
  columnB.position.set(13.4, 0, 2.2);
  group.add(columnB);

  const condenserB = createHorizontalExchanger(8, 1);
  condenserB.position.set(20.6, condenserBPipeY, -5.6);
  group.add(condenserB);
  addEquipmentStand(group, 20.6, -5.6, 9.8, 4.2, 28);

  const reboilerA = createHorizontalExchanger(9.2, 1.4);
  reboilerA.position.set(-18.6, 4.9, 11.4);
  group.add(reboilerA);

  const reboilerB = createHorizontalExchanger(8.8, 1.3);
  reboilerB.position.set(19.2, 4.8, 11.4);
  group.add(reboilerB);

  const productPump = createPumpSkid({ accentColor: palette.aniline, scale: 0.74 });
  productPump.position.set(23.2, 0.35, 11.2);
  group.add(productPump);

  addPipeRunToParent(group, [
    [-12, 19.2, -6],
    [-12, 19.2, -11.2],
    [-17.8, 19.2, -11.2],
    [-17.8, 14.8, -11.2],
  ], 0.18, palette.effluent);

  addPipeRunToParent(group, [
    [-13.8, 14.2, -11.2],
    [-7.2, 14.2, -11.2],
    [-7.2, 8.2, -11.2],
    [-2.2, 8.2, -8.9],
  ], 0.16, palette.effluent);

  addPipeRunToParent(group, [
    [-12, 2.2, -4.2],
    [-12, 2.2, 6.4],
    [-18.6, 2.2, 6.4],
    [-18.6, 4.9, 11.4],
  ], 0.18, palette.aniline);

  addPipeRunToParent(group, [
    [-22.4, 4.9, 11.4],
    [-22.4, 9.1, -1.8],
    [-14.6, 9.1, -1.8],
  ], 0.16, palette.aniline);

  addPipeRunToParent(group, [
    [13.4, columnBTopPipeY, 2.2],
    [13.4, columnBTopPipeY, -5.6],
    [20.6, columnBTopPipeY, -5.6],
    [20.6, condenserBPipeY + 0.5, -5.6],
  ], 0.18, palette.aniline);

  addPipeRunToParent(group, [
    [17.8, condenserBPipeY, -5.6],
    [13.4, condenserBPipeY, -5.6],
    [13.4, columnBTopPipeY, 2.2],
  ], 0.16, palette.aniline);

  addPipeRunToParent(group, [
    [13.4, 2.2, 4.2],
    [13.4, 2.2, 8.2],
    [19.2, 2.2, 8.2],
    [19.2, 4.8, 11.4],
  ], 0.18, palette.nb);

  addPipeRunToParent(group, [
    [15.8, 4.8, 11.4],
    [15.8, 8.4, 7.2],
    [11.6, 8.4, 7.2],
  ], 0.16, palette.nb);

  addEquipmentTag(group, 'T-101', -12, 22.2, -1.2, palette.processBorder, { scale: [3.8, 1.45, 1] });
  addEquipmentTag(group, 'V-102', -2.2, 9.2, -11.2, palette.processBorder, { scale: [3.8, 1.45, 1] });
  addEquipmentTag(group, 'T-100', 13.4, 37.4, 7.2, palette.processBorder, { scale: [3.8, 1.45, 1] });
  addEquipmentTag(group, 'E-104', -16.6, 8.4, 14.2, palette.processBorder, { scale: [3.8, 1.45, 1] });
  addEquipmentTag(group, 'E-105', 4.4, 8.1, 15.6, palette.processBorder, { scale: [3.8, 1.45, 1] });
  addEquipmentTag(group, 'COND T-101', -17.8, 17.6, -14.8, palette.processBorder, { scale: [4.8, 1.45, 1] });
  addEquipmentTag(group, 'REB T-101', -18.6, 8.2, 15.6, palette.processBorder, { scale: [4.4, 1.45, 1] });
  addEquipmentTag(group, 'COND T-100', 20.6, 33.2, -8.9, palette.processBorder, { scale: [4.8, 1.45, 1] });
  addEquipmentTag(group, 'REB T-100', 19.2, 8, 15.8, palette.processBorder, { scale: [4.4, 1.45, 1] });

  parent.add(group);
}

function addDrumArea(parent, x, z) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      const drum = createMesh(
        new THREE.CylinderGeometry(0.72, 0.72, 1.7, 16),
        new THREE.MeshStandardMaterial({ color: 0x2f67a7, roughness: 0.42, metalness: 0.32 })
      );
      drum.position.set(col * 1.8 - 2.7, 0.9, row * 1.9 - 2);
      group.add(drum);
    }
  }

  parent.add(group);
}

function addWaterTreatment(parent, x, z) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const clarifier = createMesh(
    new THREE.CylinderGeometry(6.8, 6.8, 3.2, 32),
    new THREE.MeshStandardMaterial({ color: 0xd8ddd4, roughness: 0.72, metalness: 0.08 })
  );
  clarifier.position.set(-7, 1.8, -5);
  group.add(clarifier);

  const basin = createMesh(
    new THREE.BoxGeometry(13, 1.4, 9),
    new THREE.MeshStandardMaterial({ color: 0xc8d3d6, roughness: 0.84 })
  );
  basin.position.set(8, 0.9, -4);
  group.add(basin);

  const basinWater = createMesh(
    new THREE.BoxGeometry(11.6, 0.3, 7.6),
    new THREE.MeshStandardMaterial({ color: 0x80b6cb, roughness: 0.2, metalness: 0.1 })
  );
  basinWater.position.set(8, 1.2, -4);
  group.add(basinWater);

  const tank = createVerticalVessel(2.6, 6.2, { color: palette.steel });
  tank.position.set(6, 0, 9);
  group.add(tank);

  const skid = createPumpSkid();
  skid.position.set(-7, 0.3, 8);
  group.add(skid);

  parent.add(group);
}

function addSupportBuildings(parent, x, z) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const utilities = createBuilding(24, 14, 8, { wall: 0xb0b894, roof: 0x597254 });
  utilities.position.set(-44, 4, -2);
  group.add(utilities);

  const lab = createBuilding(26, 14, 9, { wall: 0xbdcadd, roof: 0x7b86ab });
  lab.position.set(6, 4.5, 0);
  group.add(lab);

  const office = createBuilding(34, 16, 10, { wall: 0xd3d1c8, roof: 0x808892 });
  office.position.set(55, 5, 0);
  group.add(office);

  parent.add(group);
}

function addFlare(parent, x, z) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const stack = createMesh(
    new THREE.CylinderGeometry(1.6, 2, 26, 18),
    new THREE.MeshStandardMaterial({ color: 0x767676, roughness: 0.75, metalness: 0.42 })
  );
  stack.position.y = 13;
  group.add(stack);

  const top = createMesh(
    new THREE.CylinderGeometry(1.1, 1.2, 3, 16),
    new THREE.MeshStandardMaterial({ color: 0x454545, roughness: 0.62, metalness: 0.4 })
  );
  top.position.y = 27.5;
  group.add(top);

  const flame = createMesh(
    new THREE.ConeGeometry(1.4, 4.6, 10),
    new THREE.MeshStandardMaterial({
      color: palette.flare,
      emissive: palette.flare,
      emissiveIntensity: 1.2,
      transparent: true,
      opacity: 0.92,
    })
  );
  flame.position.y = 31;
  animatedFlames.push(flame);
  group.add(flame);

  parent.add(group);
}

function addPersonnel(parent, entries) {
  entries.forEach((entry) => {
    const worker = createHelmetWorker(entry);
    worker.group.position.set(entry.x, 0, entry.z);
    worker.group.rotation.y = entry.rotation ?? 0;
    parent.add(worker.group);
    animatedWorkers.push(worker.animation);

    if (entry.playable && !playerState.worker) {
      playerState.worker = worker.animation;
      playerState.playableLabel = entry.name ?? 'Operario';
      playerState.lastZoneKey = 'product';
    }
  });
}

function createHelmetWorker(options = {}) {
  const {
    scale = 1,
    pose = 'idle',
    expression = 'wide',
    x = 0,
    z = 0,
  } = options;

  const group = new THREE.Group();
  group.name = 'helmet-worker';
  group.userData.ignoreCameraCollision = true;

  const bodyRoot = new THREE.Group();
  group.add(bodyRoot);

  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xf6f6f4, roughness: 0.92, metalness: 0.02 });
  const lineMaterial = new THREE.MeshStandardMaterial({ color: 0x171717, roughness: 0.74, metalness: 0.04 });
  const helmetMaterial = new THREE.MeshStandardMaterial({ color: 0xffe100, roughness: 0.36, metalness: 0.12 });

  const torsoPivot = new THREE.Group();
  torsoPivot.position.set(0, 2.25, 0);
  bodyRoot.add(torsoPivot);

  const torso = createMesh(new THREE.CapsuleGeometry(0.55, 1.85, 8, 16), bodyMaterial);
  torsoPivot.add(torso);

  const headPivot = new THREE.Group();
  headPivot.position.set(0, 4.25, 0);
  bodyRoot.add(headPivot);

  const head = createMesh(new THREE.SphereGeometry(0.82, 22, 18), bodyMaterial);
  headPivot.add(head);

  const helmetShell = createMesh(
    new THREE.SphereGeometry(0.9, 22, 14, 0, Math.PI * 2, 0, Math.PI * 0.62),
    helmetMaterial
  );
  helmetShell.position.set(0, 0.23, 0);
  helmetShell.scale.set(1.02, 0.92, 1.08);
  headPivot.add(helmetShell);

  const helmetBrim = createMesh(new THREE.CylinderGeometry(0.92, 0.92, 0.08, 24), helmetMaterial);
  helmetBrim.position.set(0.04, -0.2, 0.18);
  helmetBrim.scale.set(1.02, 1, 1.22);
  headPivot.add(helmetBrim);

  const helmetLip = createMesh(new THREE.TorusGeometry(0.9, 0.05, 8, 24), helmetMaterial);
  helmetLip.rotation.x = Math.PI / 2;
  helmetLip.position.set(0, -0.2, 0);
  headPivot.add(helmetLip);

  for (const x of [-0.18, 0.18]) {
    const ridge = createMesh(new THREE.BoxGeometry(0.1, 0.3, 0.9), helmetMaterial);
    ridge.position.set(x, 0.37, -0.02);
    ridge.rotation.z = x * 0.38;
    headPivot.add(ridge);
  }

  const eyeScaleY = expression === 'skeptical' ? 0.48 : 0.92;
  const eyeOffsetY = expression === 'skeptical' ? 4.3 : 4.25;
  const eyeRotZ = expression === 'alert' ? 0.18 : 0;

  [-0.27, 0.27].forEach((x, index) => {
    const eye = createMesh(new THREE.CylinderGeometry(0.19, 0.19, 0.05, 18), lineMaterial);
    eye.position.set(x, eyeOffsetY - 4.25, 0.72);
    eye.scale.y = eyeScaleY;
    eye.rotation.x = Math.PI / 2;
    eye.rotation.z = index === 0 ? eyeRotZ : -eyeRotZ;
    headPivot.add(eye);
  });

  const mouth = createMesh(new THREE.CapsuleGeometry(0.05, 0.28, 4, 8), lineMaterial);
  mouth.position.set(0, (expression === 'alert' ? 3.9 : 3.84) - 4.25, 0.77);
  mouth.rotation.z = expression === 'skeptical' ? -Math.PI * 0.26 : Math.PI * 0.08;
  mouth.rotation.x = Math.PI / 2;
  headPivot.add(mouth);

  const legOffsets = pose === 'pointing'
    ? [[-0.2, -0.08, -0.16], [0.22, 0.14, 0.14]]
    : [[-0.18, -0.03, -0.04], [0.18, 0.03, 0.04]];

  const legPivots = [];
  legOffsets.forEach(([legX, rotZ, rotX]) => {
    const legPivot = new THREE.Group();
    legPivot.position.set(legX, 1.58, 0);
    legPivot.rotation.z = rotZ;
    legPivot.rotation.x = rotX;
    bodyRoot.add(legPivot);

    const leg = createMesh(new THREE.CapsuleGeometry(0.14, 1.18, 6, 12), bodyMaterial);
    leg.position.set(0, -0.72, 0);
    legPivot.add(leg);
    legPivots.push({ pivot: legPivot, baseX: rotX, baseZ: rotZ });
  });

  const armsByPose = {
    idle: [
      { x: -0.52, y: 3.08, z: 0, rotZ: 0.48, rotX: 0.08 },
      { x: 0.52, y: 3.08, z: 0, rotZ: -0.42, rotX: -0.08 },
    ],
    pointing: [
      { x: -0.56, y: 3.18, z: 0.08, rotZ: 1.08, rotX: -0.28 },
      { x: 0.58, y: 3.02, z: 0, rotZ: -0.92, rotX: 0.16 },
    ],
    hands: [
      { x: -0.5, y: 3.04, z: -0.02, rotZ: 0.86, rotX: -0.14 },
      { x: 0.5, y: 3.04, z: -0.02, rotZ: -0.86, rotX: 0.14 },
    ],
  };

  const armPivots = [];
  (armsByPose[pose] ?? armsByPose.idle).forEach((armData) => {
    const armPivot = new THREE.Group();
    armPivot.position.set(armData.x, armData.y, armData.z);
    armPivot.rotation.z = armData.rotZ;
    armPivot.rotation.x = armData.rotX;
    bodyRoot.add(armPivot);

    const arm = createMesh(new THREE.CapsuleGeometry(0.12, 0.95, 6, 12), bodyMaterial);
    arm.position.set(0, -0.58, 0);
    armPivot.add(arm);
    armPivots.push({ pivot: armPivot, baseX: armData.rotX, baseZ: armData.rotZ });
  });

  group.scale.setScalar(scale);
  group.traverse((node) => {
    node.userData.ignoreCameraCollision = true;
  });

  const motionSeed = x * 0.17 + z * 0.11 + scale * 0.53;
  return {
    group,
    animation: {
      root: group,
      bodyRoot,
      torsoPivot,
      headPivot,
      armPivots,
      legPivots,
      pose,
      expression,
      phase: motionSeed,
      speed: 0.85 + ((Math.sin(motionSeed * 1.7) + 1) * 0.16),
      bobAmount: pose === 'pointing' ? 0.06 : 0.09,
      swayAmount: pose === 'hands' ? 0.08 : 0.05,
      homeY: 0,
    },
  };
}

function addPipeNetwork() {
  const pipeData = [
    {
      color: palette.nb,
      radius: 0.38,
      points: [
        [-60, 2.2, -55], [-32, 2.2, -55], [-32, 2.2, -40], [-22, 2.2, -40],
      ],
    },
    {
      color: palette.nb,
      radius: 0.34,
      points: [
        [110.4, 5.2, 10.5], [114.4, 5.2, 10.5], [114.4, 18.8, -22], [40, 18.8, -22], [40, 10, -46], [-22, 10, -46],
      ],
    },
    {
      color: palette.h2,
      radius: 0.34,
      points: [
        [-48, 5.4, 6], [-58, 5.4, 6], [-58, 6.2, 0],
      ],
    },
    {
      color: palette.recycle,
      radius: 0.36,
      points: [
        [38, 14, 1], [20, 14, 1], [20, 14, -10], [-50, 14, -10], [-50, 6.2, 0], [-58, 6.2, 0],
      ],
    },
    {
      color: palette.h2,
      radius: 0.32,
      points: [
        [-58, 6.2, 0], [-28, 6.2, 0], [-28, 15.8, -22], [84, 15.8, -22], [84, 15.8, -45.8], [80.4, 15.8, -45.8], [80.4, 5.5, -45.8],
      ],
    },
    {
      color: palette.h2,
      radius: 0.3,
      points: [
        [69.2, 5.5, -45.8], [69.2, 18.6, -45.8], [69.2, 18.6, -18.6], [11.7, 18.6, -18.6], [11.7, 18.6, -49.2], [11.7, 5.5, -49.2],
      ],
    },
    {
      color: palette.nb,
      radius: 0.34,
      points: [
        [-22, 4.8, -40], [0, 4.8, -40], [0, 8.2, -37], [15, 8.2, -37], [26.4, 8.2, -38.8],
      ],
    },
    {
      color: palette.h2,
      radius: 0.28,
      points: [
        [25.8, 8.2, -49.6], [25.8, 9.2, -44.1], [32.4, 9.2, -44.1],
      ],
    },
    {
      color: palette.nb,
      radius: 0.28,
      points: [
        [26.4, 8.2, -38.8], [26.4, 9.2, -44.1], [32.4, 9.2, -44.1],
      ],
    },
    {
      color: palette.h2,
      radius: 0.42,
      points: [
        [32.4, 9.2, -44.1], [40, 9.2, -44.1], [40, 12.2, -44.1], [40, 12.2, -38.8], [55, 12.2, -38.8], [55, 12.2, -40.6],
      ],
    },
    {
      color: palette.feed,
      radius: 0.36,
      points: [
        [58, 13.8, -44], [70, 13.8, -44], [70, 11, -43], [74, 11, -43],
      ],
    },
    {
      color: palette.effluent,
      radius: 0.32,
      points: [
        [90, 8.2, -43], [90, 8.2, -8], [40, 8.2, -8], [40, 10.2, 0],
      ],
    },
    {
      color: palette.h2,
      radius: 0.24,
      points: [
        [38, 14, 4], [72, 14, 4], [72, 17, -58], [109, 17, -58],
      ],
    },
    {
      color: palette.effluent,
      radius: 0.3,
      points: [
        [42, 5.4, 0], [52, 5.4, 0], [52, 5.4, 5.4], [63.5, 5.4, 5.4],
      ],
    },
    {
      color: palette.aniline,
      radius: 0.3,
      points: [
        [63.5, 6.2, 5.4], [74, 6.2, 5.4], [74, 6.2, 14.4], [80.4, 6.2, 14.4], [80.4, 6.2, 2], [84.8, 6.2, 2], [84.8, 6.2, 0],
      ],
    },
    {
      color: palette.water,
      radius: 0.24,
      points: [
        [63.5, 3.4, 6.6], [20, 3.4, 6.6], [20, 3.4, 40], [-70, 3.4, 40], [-70, 3.4, 55], [-93, 3.4, 55],
      ],
    },
    {
      color: palette.effluent,
      radius: 0.26,
      points: [
        [85, 18.6, -6], [85, 18.6, -11], [94.8, 18.6, -11], [94.8, 8.4, -3],
      ],
    },
    {
      color: palette.h2,
      radius: 0.22,
      points: [
        [85, 20.5, -6], [94, 20.5, -6], [94, 20.5, -58], [109, 20.5, -58],
      ],
    },
    {
      color: palette.aniline,
      radius: 0.26,
      points: [
        [85, 6.2, 0], [94, 6.2, 0], [94, 6.2, 16.5], [101.4, 6.2, 16.5], [101.4, 6.2, 4.2],
      ],
    },
    {
      color: palette.aniline,
      radius: 0.24,
      points: [
        [94.8, 7.2, -1.2], [100, 7.2, -1.2], [100, 7.2, 4.2], [103.4, 7.2, 4.2],
      ],
    },
    {
      color: palette.feed,
      radius: 0.26,
      points: [
        [103.4, 7.2, 4.2], [103.4, 7.2, 8.2], [110.4, 7.2, 8.2],
      ],
    },
    {
      color: palette.aniline,
      radius: 0.3,
      points: [
        [110.4, 35.4, 8.2], [116.4, 35.4, 8.2], [116.4, 35.4, 28], [88, 35.4, 28], [88, 4.2, 45], [78, 4.2, 45],
      ],
    },
  ];

  pipeData.forEach((pipe) => addPipeRun(pipe.points, pipe.radius, pipe.color));
}

function addPipeRun(points, radius, color) {
  addPipeRunToParent(pipesGroup, points, radius, color);
}

function addPipeRunToParent(parent, points, radius, color) {
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.36,
    metalness: 0.62,
    emissive: color,
    emissiveIntensity: 0.08,
  });

  for (let index = 0; index < points.length - 1; index += 1) {
    const start = new THREE.Vector3(...points[index]);
    const end = new THREE.Vector3(...points[index + 1]);
    const segment = start.distanceTo(end);

    const pipe = createMesh(new THREE.CylinderGeometry(radius, radius, segment, 12), material);
    pipe.position.copy(start).add(end).multiplyScalar(0.5);
    pipe.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.clone().sub(start).normalize());
    parent.add(pipe);
  }

  points.forEach((point) => {
    const joint = createMesh(new THREE.SphereGeometry(radius * 1.18, 12, 12), material);
    joint.position.set(point[0], point[1], point[2]);
    parent.add(joint);
  });
}

function addTruck(parent, x, z, rotation, { tankColor, bodyColor, scale = 1 }) {
  const truck = new THREE.Group();
  truck.position.set(x, 0, z);
  truck.rotation.y = rotation;
  truck.scale.setScalar(scale);

  const chassis = createMesh(
    new THREE.BoxGeometry(11, 1, 3),
    new THREE.MeshStandardMaterial({ color: 0x20262c, roughness: 0.85 })
  );
  chassis.position.y = 1.4;
  truck.add(chassis);

  const tank = createMesh(
    new THREE.CapsuleGeometry(1.25, 5.2, 6, 16),
    new THREE.MeshStandardMaterial({ color: tankColor, roughness: 0.4, metalness: 0.55 })
  );
  tank.rotation.z = Math.PI / 2;
  tank.position.set(-0.6, 2.7, 0);
  truck.add(tank);

  const cabin = createMesh(
    new THREE.BoxGeometry(2.6, 2.4, 2.8),
    new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.54, metalness: 0.26 })
  );
  cabin.position.set(4.6, 2.2, 0);
  truck.add(cabin);

  const windshield = createMesh(
    new THREE.BoxGeometry(1.8, 1.3, 2.4),
    new THREE.MeshStandardMaterial({ color: 0x7aa5c7, roughness: 0.12, metalness: 0.18, transparent: true, opacity: 0.75 })
  );
  windshield.position.set(4.95, 2.55, 0);
  truck.add(windshield);

  const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x23292f, roughness: 0.92 });
  [-4.2, -1.2, 3.5].forEach((wheelX) => {
    [-1.6, 1.6].forEach((wheelZ) => {
      const wheel = createMesh(new THREE.CylinderGeometry(0.72, 0.72, 0.7, 16), wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wheelX, 0.72, wheelZ);
      truck.add(wheel);
    });
  });

  parent.add(truck);
}

function addCanopy(parent, x, z, width, depth, height, roofColor) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const roof = createMesh(
    new THREE.BoxGeometry(width, 0.7, depth),
    new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.6, metalness: 0.25 })
  );
  roof.position.y = height;
  group.add(roof);

  for (const dx of [-width / 2 + 1.2, width / 2 - 1.2]) {
    for (const dz of [-depth / 2 + 1.2, depth / 2 - 1.2]) {
      const post = createMesh(
        new THREE.BoxGeometry(0.45, height, 0.45),
        new THREE.MeshStandardMaterial({ color: 0x557492, roughness: 0.72, metalness: 0.28 })
      );
      post.position.set(dx, height / 2, dz);
      group.add(post);
    }
  }

  parent.add(group);
}

function addCylinderBundle(parent, x, z) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  for (let row = 0; row < 2; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      const bottle = createMesh(
        new THREE.CapsuleGeometry(0.9, 5.6, 6, 12),
        new THREE.MeshStandardMaterial({ color: 0xdce3ea, roughness: 0.38, metalness: 0.52 })
      );
      bottle.position.set(col * 2.5 - 2.5, 4.4, row * 2.8 - 1.4);
      group.add(bottle);
    }
  }

  parent.add(group);
}

function createVerticalVessel(radius, height, { color, trimColor = palette.accent }) {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ color, roughness: 0.46, metalness: 0.45 });
  const trim = new THREE.MeshStandardMaterial({ color: trimColor, roughness: 0.4, metalness: 0.52 });

  const body = createMesh(new THREE.CapsuleGeometry(radius, Math.max(height - radius * 2, 0.1), 8, 18), material);
  body.position.y = height / 2 + 1.5;
  group.add(body);

  for (let index = 0; index < 4; index += 1) {
    const leg = createMesh(new THREE.CylinderGeometry(0.14, 0.14, 1.5, 10), trim);
    const angle = (index / 4) * Math.PI * 2;
    leg.position.set(Math.cos(angle) * radius * 0.62, 0.75, Math.sin(angle) * radius * 0.62);
    group.add(leg);
  }

  const head = createMesh(new THREE.CylinderGeometry(0.26, 0.26, 1, 10), trim);
  head.position.y = height + 2.1;
  group.add(head);

  return group;
}

function addHorizontalVessel(parent, x, z, length, radius, { color, y, rotation = 0 }) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.y = rotation;

  const body = createMesh(
    new THREE.CapsuleGeometry(radius, Math.max(length - radius * 2, 0.1), 8, 18),
    new THREE.MeshStandardMaterial({ color, roughness: 0.42, metalness: 0.5 })
  );
  body.rotation.z = Math.PI / 2;
  group.add(body);

  [-length / 4, length / 4].forEach((supportX) => {
    const support = createMesh(
      new THREE.BoxGeometry(1.1, y - 0.4, 1.2),
      new THREE.MeshStandardMaterial({ color: palette.steelDark, roughness: 0.82, metalness: 0.12 })
    );
    support.position.set(supportX, -(y - 0.4) / 2, 0);
    group.add(support);
  });

  parent.add(group);
  return group;
}

function createHorizontalExchanger(length, radius) {
  const group = new THREE.Group();
  const shellMaterial = new THREE.MeshStandardMaterial({ color: 0xb8c5d0, roughness: 0.38, metalness: 0.55 });
  const trimMaterial = new THREE.MeshStandardMaterial({ color: palette.steelDark, roughness: 0.5, metalness: 0.44 });

  const shell = createMesh(
    new THREE.CapsuleGeometry(radius, Math.max(length - radius * 2, 0.1), 8, 18),
    shellMaterial
  );
  shell.rotation.z = Math.PI / 2;
  group.add(shell);

  [-0.28, 0, 0.28].forEach((offset) => {
    const ring = createMesh(new THREE.TorusGeometry(radius * 0.98, 0.12, 8, 26), trimMaterial);
    ring.rotation.y = Math.PI / 2;
    ring.position.x = length * offset;
    group.add(ring);
  });

  [-length * 0.28, length * 0.28].forEach((supportX) => {
    const saddle = createMesh(
      new THREE.BoxGeometry(1.25, 2.9, radius * 1.15),
      new THREE.MeshStandardMaterial({ color: 0x70808b, roughness: 0.7, metalness: 0.22 })
    );
    saddle.position.set(supportX, -1.8, 0);
    group.add(saddle);
  });

  const nozzleTop = createMesh(new THREE.CylinderGeometry(radius * 0.14, radius * 0.14, 1.5, 12), trimMaterial);
  nozzleTop.position.set(0, radius + 0.68, 0);
  group.add(nozzleTop);

  const nozzleSideA = createMesh(new THREE.CylinderGeometry(radius * 0.12, radius * 0.12, 1.6, 12), trimMaterial);
  nozzleSideA.rotation.z = Math.PI / 2;
  nozzleSideA.position.set(-length / 2 + radius * 0.7, 0.2, 0);
  group.add(nozzleSideA);

  const nozzleSideB = nozzleSideA.clone();
  nozzleSideB.position.x = length / 2 - radius * 0.7;
  group.add(nozzleSideB);

  return group;
}

function createCompressor() {
  const group = new THREE.Group();

  const base = createMesh(
    new THREE.BoxGeometry(10.6, 0.8, 6.2),
    new THREE.MeshStandardMaterial({ color: 0x6d7f88, roughness: 0.72, metalness: 0.2 })
  );
  base.position.y = 0.4;
  group.add(base);

  const motor = createMesh(
    new THREE.CylinderGeometry(1.15, 1.15, 4.2, 18),
    new THREE.MeshStandardMaterial({ color: 0x567b94, roughness: 0.48, metalness: 0.42 })
  );
  motor.rotation.z = Math.PI / 2;
  motor.position.set(-2.8, 1.7, 0);
  group.add(motor);

  const coupling = createMesh(
    new THREE.CylinderGeometry(0.38, 0.38, 1.2, 12),
    new THREE.MeshStandardMaterial({ color: palette.accent, roughness: 0.36, metalness: 0.54 })
  );
  coupling.rotation.z = Math.PI / 2;
  coupling.position.set(0.1, 1.7, 0);
  group.add(coupling);

  const casing = createMesh(
    new THREE.CylinderGeometry(1.5, 2.4, 3.8, 24),
    new THREE.MeshStandardMaterial({ color: 0x5f7180, roughness: 0.56, metalness: 0.3 })
  );
  casing.rotation.z = Math.PI / 2;
  casing.position.set(2.2, 1.8, 0);
  group.add(casing);

  const suctionCone = createMesh(
    new THREE.ConeGeometry(1.2, 2.2, 24),
    new THREE.MeshStandardMaterial({ color: 0x7a8b97, roughness: 0.52, metalness: 0.26 })
  );
  suctionCone.rotation.z = -Math.PI / 2;
  suctionCone.position.set(4.6, 1.8, 0);
  group.add(suctionCone);

  const separator = createVerticalSeparator(0.95, 4.8, { color: palette.warmSteel, trimColor: palette.processBorder });
  separator.position.set(4.9, 0, 2.1);
  group.add(separator);

  const discharge = createMesh(
    new THREE.CylinderGeometry(0.26, 0.26, 2.8, 12),
    new THREE.MeshStandardMaterial({ color: palette.processBorder, roughness: 0.34, metalness: 0.5 })
  );
  discharge.rotation.z = Math.PI / 2;
  discharge.position.set(4.9, 3.8, 0);
  group.add(discharge);

  return group;
}

function createDistillationColumn(radius, height) {
  const group = createVerticalVessel(radius, height, { color: palette.warmSteel, trimColor: palette.processBorder });
  const trayCount = Math.max(3, Math.round(height / 5.8));
  const lowerOffset = 4.5;
  const upperOffset = 4.3;
  const usableHeight = Math.max(height - lowerOffset - upperOffset, 1);

  for (let index = 0; index < trayCount; index += 1) {
    const tray = createMesh(
      new THREE.TorusGeometry(radius * 1.02, 0.1, 8, 28),
      new THREE.MeshStandardMaterial({ color: palette.processBorder, roughness: 0.38, metalness: 0.5 })
    );
    tray.rotation.x = Math.PI / 2;
    tray.position.y = 1.9 + lowerOffset + (usableHeight * index) / Math.max(trayCount - 1, 1);
    group.add(tray);
  }

  return group;
}

function createPumpSkid(options = {}) {
  const { accentColor = 0x547b94, scale = 1 } = options;
  const group = new THREE.Group();

  const base = createMesh(
    new THREE.BoxGeometry(8.5, 0.8, 4.6),
    new THREE.MeshStandardMaterial({ color: 0x6d7f88, roughness: 0.72, metalness: 0.2 })
  );
  base.position.y = 0.4;
  group.add(base);

  const motor = createMesh(
    new THREE.CylinderGeometry(0.8, 0.8, 3.6, 16),
    new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.48, metalness: 0.42 })
  );
  motor.rotation.z = Math.PI / 2;
  motor.position.set(-1.3, 1.5, 0);
  group.add(motor);

  const pump = createMesh(
    new THREE.CapsuleGeometry(0.65, 2, 6, 12),
    new THREE.MeshStandardMaterial({ color: 0x9eacb7, roughness: 0.46, metalness: 0.52 })
  );
  pump.rotation.z = Math.PI / 2;
  pump.position.set(1.7, 1.5, 0);
  group.add(pump);

  const suction = createMesh(
    new THREE.CylinderGeometry(0.16, 0.16, 1.6, 10),
    new THREE.MeshStandardMaterial({ color: palette.steelDark, roughness: 0.52, metalness: 0.36 })
  );
  suction.rotation.z = Math.PI / 2;
  suction.position.set(-3.9, 1.5, 0);
  group.add(suction);

  const discharge = createMesh(
    new THREE.CylinderGeometry(0.18, 0.18, 1.9, 10),
    new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.42, metalness: 0.4 })
  );
  discharge.position.set(3.5, 2.4, 0);
  group.add(discharge);

  group.scale.setScalar(scale);
  return group;
}

function addEquipmentTag(parent, text, x, y, z, color, options = {}) {
  const sprite = createLabelSprite(text, color, {
    fontSize: 36,
    width: 240,
    height: 90,
    background: 'rgba(255,255,255,0.78)',
    textColor: '#18324a',
    borderColor: '#4c6d95',
  });
  const scale = options.scale ?? [4.4, 1.45, 1];
  sprite.position.set(x, y, z);
  sprite.scale.set(scale[0], scale[1], scale[2]);
  parent.add(sprite);
  labels.push(sprite);
  return sprite;
}

function createVerticalSeparator(radius, height, options = {}) {
  const {
    color = palette.steel,
    trimColor = palette.processBorder,
  } = options;

  const group = createVerticalVessel(radius, height, { color, trimColor });
  const trimMaterial = new THREE.MeshStandardMaterial({ color: trimColor, roughness: 0.36, metalness: 0.5 });

  [0.32, 0.68].forEach((factor) => {
    const band = createMesh(new THREE.TorusGeometry(radius * 1.03, 0.1, 8, 28), trimMaterial);
    band.rotation.x = Math.PI / 2;
    band.position.y = 1.9 + height * factor;
    group.add(band);
  });

  const sideNozzle = createMesh(new THREE.CylinderGeometry(0.2, 0.2, radius * 1.4, 10), trimMaterial);
  sideNozzle.rotation.z = Math.PI / 2;
  sideNozzle.position.set(radius + 0.5, height * 0.56 + 1.5, 0);
  group.add(sideNozzle);

  const drain = createMesh(new THREE.CylinderGeometry(0.14, 0.14, 1.1, 10), trimMaterial);
  drain.position.y = 0.65;
  group.add(drain);

  return group;
}

function createDetailedHorizontalSeparator(length, radius, options = {}) {
  const {
    color = palette.steel,
    accentColor = palette.processBorder,
  } = options;

  const group = new THREE.Group();
  const bodyMaterial = new THREE.MeshStandardMaterial({ color, roughness: 0.42, metalness: 0.5 });
  const trimMaterial = new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.36, metalness: 0.52 });

  const body = createMesh(
    new THREE.CapsuleGeometry(radius, Math.max(length - radius * 2, 0.1), 8, 18),
    bodyMaterial
  );
  body.rotation.z = Math.PI / 2;
  group.add(body);

  [-length * 0.28, length * 0.28].forEach((supportX) => {
    const support = createMesh(
      new THREE.BoxGeometry(1.3, 3.1, radius * 1.16),
      new THREE.MeshStandardMaterial({ color: 0x70808b, roughness: 0.74, metalness: 0.18 })
    );
    support.position.set(supportX, -1.9, 0);
    group.add(support);
  });

  const topNozzle = createMesh(new THREE.CylinderGeometry(0.22, 0.22, 1.5, 10), trimMaterial);
  topNozzle.position.set(-length * 0.12, radius + 0.7, 0);
  group.add(topNozzle);

  const endNozzle = createMesh(new THREE.CylinderGeometry(0.18, 0.18, 1.6, 10), trimMaterial);
  endNozzle.rotation.z = Math.PI / 2;
  endNozzle.position.set(length / 2 - radius * 0.72, 0.25, 0);
  group.add(endNozzle);

  const boot = createMesh(
    new THREE.CylinderGeometry(radius * 0.32, radius * 0.32, 2.2, 14),
    new THREE.MeshStandardMaterial({ color, roughness: 0.46, metalness: 0.42 })
  );
  boot.position.set(length * 0.16, -1.2, 0);
  group.add(boot);

  const manway = createMesh(new THREE.TorusGeometry(radius * 0.54, 0.1, 8, 22), trimMaterial);
  manway.rotation.x = Math.PI / 2;
  manway.position.set(-length * 0.04, radius * 0.9, 0);
  group.add(manway);

  return group;
}

function addSkidFrame(parent, x, z, width, depth) {
  const frame = new THREE.Group();
  frame.position.set(x, 0, z);

  const base = createMesh(
    new THREE.BoxGeometry(width, 0.7, depth),
    new THREE.MeshStandardMaterial({ color: 0x648498, roughness: 0.72, metalness: 0.22 })
  );
  base.position.y = 0.35;
  frame.add(base);

  for (const dx of [-width / 2 + 0.8, width / 2 - 0.8]) {
    for (const dz of [-depth / 2 + 0.8, depth / 2 - 0.8]) {
      const post = createMesh(
        new THREE.BoxGeometry(0.35, 1.6, 0.35),
        new THREE.MeshStandardMaterial({ color: 0x5a7588, roughness: 0.74, metalness: 0.24 })
      );
      post.position.set(dx, 1.1, dz);
      frame.add(post);
    }
  }

  parent.add(frame);
}

function addEquipmentStand(parent, x, z, width, depth, height) {
  const stand = new THREE.Group();
  stand.position.set(x, 0, z);

  const steelMaterial = new THREE.MeshStandardMaterial({ color: 0x6a7884, roughness: 0.7, metalness: 0.22 });

  for (const dx of [-width / 2 + 0.6, width / 2 - 0.6]) {
    for (const dz of [-depth / 2 + 0.5, depth / 2 - 0.5]) {
      const post = createMesh(new THREE.BoxGeometry(0.45, height, 0.45), steelMaterial);
      post.position.set(dx, height / 2, dz);
      stand.add(post);
    }
  }

  const beamA = createMesh(new THREE.BoxGeometry(width, 0.36, 0.36), steelMaterial);
  beamA.position.set(0, height, -depth / 2 + 0.5);
  stand.add(beamA);

  const beamB = beamA.clone();
  beamB.position.z = depth / 2 - 0.5;
  stand.add(beamB);

  const beamC = createMesh(new THREE.BoxGeometry(0.36, 0.36, depth - 1), steelMaterial);
  beamC.position.set(-width / 2 + 0.6, height, 0);
  stand.add(beamC);

  const beamD = beamC.clone();
  beamD.position.x = width / 2 - 0.6;
  stand.add(beamD);

  parent.add(stand);
}

function createBuilding(width, depth, height, { wall, roof }) {
  const group = new THREE.Group();

  const body = createMesh(
    new THREE.BoxGeometry(width, height, depth),
    new THREE.MeshStandardMaterial({ color: wall, roughness: 0.85 })
  );
  body.position.y = height / 2;
  group.add(body);

  const roofMesh = createMesh(
    new THREE.BoxGeometry(width + 2, 1.2, depth + 2),
    new THREE.MeshStandardMaterial({ color: roof, roughness: 0.72, metalness: 0.16 })
  );
  roofMesh.position.y = height + 0.7;
  group.add(roofMesh);

  const windowMaterial = new THREE.MeshStandardMaterial({
    color: 0x6e97b5,
    roughness: 0.2,
    metalness: 0.08,
    emissive: 0x1f3040,
    emissiveIntensity: 0.45,
  });

  for (let side = -1; side <= 1; side += 2) {
    for (let row = 0; row < 2; row += 1) {
      for (let col = 0; col < 4; col += 1) {
        const windowPane = createMesh(new THREE.PlaneGeometry(3.6, 2), windowMaterial);
        windowPane.position.set(-width / 2 + 5 + col * 5.2, 3.2 + row * 3, side * (depth / 2 + 0.02));
        windowPane.rotation.y = side === 1 ? Math.PI : 0;
        group.add(windowPane);
      }
    }
  }

  return group;
}

function createLabelSprite(text, color, options = {}) {
  const width = options.width ?? 640;
  const height = options.height ?? 176;
  const fontSize = options.fontSize ?? 52;
  const background = options.background ?? 'rgba(255,255,255,0.95)';
  const textColor = options.textColor ?? '#11283b';
  const borderColor = options.borderColor ?? `#${new THREE.Color(color).getHexString()}`;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');

  context.clearRect(0, 0, width, height);
  roundRect(context, 8, 8, width - 16, height - 16, 30);
  context.fillStyle = background;
  context.fill();
  context.lineWidth = 6;
  context.strokeStyle = borderColor;
  context.stroke();

  context.fillStyle = textColor;
  context.font = `700 ${fontSize}px "Segoe UI", Arial, sans-serif`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  wrapText(context, text, width / 2, height / 2, width - 52, fontSize * 1.05);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(width / 40, height / 40, 1);
  sprite.renderOrder = 1000;
  return sprite;
}

function roundRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
}

function wrapText(context, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  words.forEach((word) => {
    const trial = currentLine ? `${currentLine} ${word}` : word;
    if (context.measureText(trial).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = trial;
    }
  });

  lines.push(currentLine);
  const offset = ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, index) => {
    context.fillText(line, x, y - offset + index * lineHeight);
  });
}

function createMesh(geometry, material) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  collisionTargets.push(mesh);
  return mesh;
}

function bindUi() {
  renderer.domElement.style.cursor = 'grab';
  renderer.domElement.tabIndex = 0;

  focusButtons.forEach((button) => {
    button.addEventListener('click', () => {
      if (playerState.active) {
        setGameMode(false);
      }
      setFocusView(button.dataset.focus);
    });
  });

  if (gameModeButton) {
    gameModeButton.addEventListener('click', () => setGameMode(!playerState.active));
  }

  toggleInputs.forEach((input) => {
    input.addEventListener('change', () => {
      if (input.dataset.toggle === 'labels') {
        labels.forEach((label) => {
          label.visible = input.checked;
        });
      }

      if (input.dataset.toggle === 'pipes') {
        pipesGroup.visible = input.checked;
      }

      if (input.dataset.toggle === 'autorotate') {
        controls.autoRotate = input.checked;
        controls.autoRotateSpeed = 0.8;
      }
    });
  });

  controls.addEventListener('start', () => {
    isCameraAnimating = false;
    isUserDragging = true;
    renderer.domElement.style.cursor = 'grabbing';
  });

  controls.addEventListener('end', () => {
    isUserDragging = false;
    renderer.domElement.style.cursor = 'grab';
  });

  renderer.domElement.addEventListener('click', onSceneClick);
  renderer.domElement.addEventListener('pointerdown', onPointerDown);
  renderer.domElement.addEventListener('pointerup', onPointerUp);
  renderer.domElement.addEventListener('pointermove', onPointerMove);
  renderer.domElement.addEventListener('pointerleave', onPointerLeave);
  document.addEventListener('pointerlockchange', onPointerLockChange);
  document.addEventListener('mousemove', onGameMouseMove);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('resize', onResize);
  updateGameModeUi();
}

function onPointerDown(event) {
  if (playerState.active) {
    return;
  }
  pointerDown.set(event.clientX, event.clientY);
}

function onPointerUp(event) {
  if (playerState.active) {
    return;
  }
  const movedDistance = pointerDown.distanceTo(new THREE.Vector2(event.clientX, event.clientY));
  if (movedDistance > 6 || event.button !== 0) {
    return;
  }

  updatePointerFromEvent(event);
  raycaster.setFromCamera(pointer, camera);
  const labelHit = raycaster.intersectObjects(labelTargets, false)[0];
  if (!labelHit) {
    return;
  }

  const { zoneKey, focusKey } = labelHit.object.userData;
  setActiveZone(zoneKey);
  setFocusView(focusKey, { zoneKey });
}

function onPointerMove(event) {
  if (playerState.active) {
    renderer.domElement.style.cursor = playerState.pointerLocked ? 'none' : 'crosshair';
    return;
  }
  updatePointerFromEvent(event);

  raycaster.setFromCamera(pointer, camera);
  const labelHit = raycaster.intersectObjects(labelTargets, false)[0];
  renderer.domElement.style.cursor = isUserDragging
    ? 'grabbing'
    : labelHit ? 'pointer' : 'grab';

  if (labelHit) {
    setActiveZone(labelHit.object.userData.zoneKey);
    return;
  }

  const areaHit = raycaster.intersectObjects(interactiveTargets, false)[0];
  if (!areaHit) {
    setActiveZone(activeZoneKey);
    return;
  }

  setActiveZone(areaHit.object.userData.key);
}

function onPointerLeave() {
  if (playerState.active) {
    return;
  }
  renderer.domElement.style.cursor = 'grab';
  setActiveZone(activeZoneKey);
}

function onSceneClick(event) {
  if (!playerState.active || event.button !== 0) {
    return;
  }

  requestGamePointerLock();
}

function onPointerLockChange() {
  playerState.pointerLocked = document.pointerLockElement === renderer.domElement;
  renderer.domElement.style.cursor = playerState.active
    ? (playerState.pointerLocked ? 'none' : 'crosshair')
    : 'grab';
  updateGameModeUi();
}

function onGameMouseMove(event) {
  if (!playerState.active || !playerState.pointerLocked) {
    return;
  }

  playerState.yaw -= event.movementX * 0.0028;
  playerState.pitch = THREE.MathUtils.clamp(playerState.pitch - event.movementY * 0.0018, 0.16, 0.76);
}

function onKeyDown(event) {
  if (event.code in keyState) {
    keyState[event.code] = true;
    if (playerState.active) {
      event.preventDefault();
    }
  }

  if (event.code === 'KeyJ') {
    event.preventDefault();
    setGameMode(!playerState.active);
  }
}

function onKeyUp(event) {
  if (event.code in keyState) {
    keyState[event.code] = false;
    if (playerState.active) {
      event.preventDefault();
    }
  }
}

function updatePointerFromEvent(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function setGameMode(active) {
  if (!playerState.worker) {
    return;
  }

  const nextState = Boolean(active);
  if (playerState.active === nextState) {
    if (nextState) {
      requestGamePointerLock();
    }
    return;
  }

  playerState.active = nextState;
  isCameraAnimating = false;
  controls.autoRotate = false;

  if (nextState) {
    controls.enabled = false;
    playerState.velocity.set(0, 0, 0);
    playerState.moveIntensity = 0;
    const workerPosition = playerState.worker.root.getWorldPosition(playerState.worldPosition);
    const zoneKey = getZoneKeyAtWorldPosition(workerPosition.x, workerPosition.z);
    playerState.lastZoneKey = zoneKey ?? playerState.lastZoneKey;
    setActiveZone(playerState.lastZoneKey);
    document.body.classList.add('is-game-mode');
    renderer.domElement.style.cursor = 'crosshair';
    requestGamePointerLock();
  } else {
    controls.enabled = true;
    playerState.pointerLocked = false;
    playerState.velocity.set(0, 0, 0);
    playerState.moveIntensity = 0;
    Object.keys(keyState).forEach((code) => {
      keyState[code] = false;
    });
    if (document.pointerLockElement === renderer.domElement) {
      document.exitPointerLock();
    }
    document.body.classList.remove('is-game-mode');
    const workerPosition = playerState.worker.root.getWorldPosition(playerState.worldPosition);
    const zoneKey = getZoneKeyAtWorldPosition(workerPosition.x, workerPosition.z) ?? 'general';
    setActiveZone(zoneKey);
    setFocusView(zoneViews[zoneKey] ?? 'general', { zoneKey });
    renderer.domElement.style.cursor = 'grab';
  }

  updateGameModeUi();
}

function updateGameModeUi() {
  if (!gameModeValue || !gameModeButton || !gameHint) {
    return;
  }

  if (!playerState.worker) {
    gameModeValue.textContent = 'Sin operario jugable';
    gameModeButton.disabled = true;
    return;
  }

  gameModeButton.disabled = false;

  if (!playerState.active) {
    gameModeValue.textContent = 'Exploracion libre';
    gameModeButton.textContent = 'Entrar al juego';
    gameHint.innerHTML = 'Controla a un operario con <code>WASD</code>, mira con el mouse y corre con <code>Shift</code>.';
    return;
  }

  gameModeValue.textContent = playerState.pointerLocked
    ? `Controlando: ${playerState.playableLabel}`
    : `Juego en pausa: ${playerState.playableLabel}`;
  gameModeButton.textContent = 'Salir del juego';
  gameHint.innerHTML = playerState.pointerLocked
    ? 'Mueve al operario con <code>WASD</code>, usa <code>Shift</code> para correr y presiona <code>J</code> para salir.'
    : 'Haz click sobre la escena para retomar la camara del juego o pulsa <code>J</code> para salir.';
}

function requestGamePointerLock() {
  if (!playerState.active || document.pointerLockElement === renderer.domElement) {
    return;
  }

  renderer.domElement.requestPointerLock?.();
}

function getZoneKeyAtWorldPosition(x, z) {
  let nearestZoneKey = null;
  let nearestDistance = Infinity;

  for (const zone of zoneRegistry.values()) {
    const halfWidth = zone.size.x / 2;
    const halfDepth = zone.size.y / 2;

    if (
      x >= zone.center.x - halfWidth &&
      x <= zone.center.x + halfWidth &&
      z >= zone.center.y - halfDepth &&
      z <= zone.center.y + halfDepth
    ) {
      return zone.key;
    }

    const distance = Math.hypot(x - zone.center.x, z - zone.center.y);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestZoneKey = zone.key;
    }
  }

  return nearestZoneKey;
}

function updatePlayer(delta) {
  if (!playerState.active || !playerState.worker) {
    return;
  }

  const forwardAmount = (keyState.KeyW || keyState.ArrowUp ? 1 : 0) - (keyState.KeyS || keyState.ArrowDown ? 1 : 0);
  const strafeAmount = (keyState.KeyD || keyState.ArrowRight ? 1 : 0) - (keyState.KeyA || keyState.ArrowLeft ? 1 : 0);

  playerState.lookVector.set(-Math.sin(playerState.yaw), 0, -Math.cos(playerState.yaw)).normalize();
  playerState.rightVector.copy(playerState.lookVector).cross(new THREE.Vector3(0, 1, 0)).normalize();
  playerState.moveVector.set(0, 0, 0);
  playerState.moveVector
    .addScaledVector(playerState.lookVector, forwardAmount)
    .addScaledVector(playerState.rightVector, strafeAmount);

  if (playerState.moveVector.lengthSq() > 0) {
    playerState.moveVector.normalize();
  }

  const isSprinting = keyState.ShiftLeft || keyState.ShiftRight;
  const targetSpeed = playerState.moveVector.lengthSq() > 0
    ? 8.2 * (isSprinting ? 1.55 : 1)
    : 0;
  const velocityTarget = playerState.moveVector.clone().multiplyScalar(targetSpeed);
  const lerpAlpha = 1 - Math.exp(-delta * 10);
  playerState.velocity.lerp(velocityTarget, lerpAlpha);

  const root = playerState.worker.root;
  root.position.x += playerState.velocity.x * delta;
  root.position.z += playerState.velocity.z * delta;

  root.getWorldPosition(playerState.worldPosition);
  const parent = root.parent;
  if (parent) {
    parent.getWorldPosition(playerState.parentWorld);
    const clampedX = THREE.MathUtils.clamp(playerState.worldPosition.x, siteBounds.minX, siteBounds.maxX);
    const clampedZ = THREE.MathUtils.clamp(playerState.worldPosition.z, siteBounds.minZ, siteBounds.maxZ);
    root.position.x += clampedX - playerState.worldPosition.x;
    root.position.z += clampedZ - playerState.worldPosition.z;
  }

  if (playerState.velocity.lengthSq() > 0.3) {
    const desiredYaw = Math.atan2(playerState.velocity.x, playerState.velocity.z);
    root.rotation.y = lerpAngle(root.rotation.y, desiredYaw, 1 - Math.exp(-delta * 14));
    playerState.moveCycle += delta * (isSprinting ? 9.2 : 5.7);
  } else {
    playerState.moveCycle += delta * 1.4;
  }

  playerState.moveIntensity = THREE.MathUtils.clamp(playerState.velocity.length() / (8.2 * 1.55), 0, 1);

  root.getWorldPosition(playerState.worldPosition);
  const zoneKey = getZoneKeyAtWorldPosition(playerState.worldPosition.x, playerState.worldPosition.z);
  if (zoneKey && zoneKey !== playerState.lastZoneKey) {
    playerState.lastZoneKey = zoneKey;
    setActiveZone(zoneKey);
  } else if (zoneKey) {
    setActiveZone(zoneKey);
  }

  updatePlayerCamera(delta);
}

function updatePlayerCamera(delta) {
  if (!playerState.worker) {
    return;
  }

  const target = playerState.worker.root.getWorldPosition(playerState.cameraTarget);
  target.y += playerState.targetHeight;

  const horizontalDistance = playerState.radius * Math.cos(playerState.pitch);
  const verticalDistance = 2.4 + playerState.radius * Math.sin(playerState.pitch);
  playerState.cameraOffset.set(
    Math.sin(playerState.yaw) * horizontalDistance,
    verticalDistance,
    Math.cos(playerState.yaw) * horizontalDistance
  );

  const desiredPosition = target.clone().add(playerState.cameraOffset);
  const cameraDirection = desiredPosition.clone().sub(target).normalize();
  const desiredDistance = target.distanceTo(desiredPosition);
  cameraCollisionRaycaster.set(target, cameraDirection);
  cameraCollisionRaycaster.far = desiredDistance;

  const obstruction = cameraCollisionRaycaster
    .intersectObjects(collisionTargets, false)
    .find((hit) => !hit.object.userData.ignoreCameraCollision && hit.distance > 0.6);

  const finalPosition = obstruction
    ? target.clone().addScaledVector(cameraDirection, Math.max(obstruction.distance - 0.9, 2.2))
    : desiredPosition;
  const followAlpha = 1 - Math.exp(-delta * 8);
  camera.position.lerp(finalPosition, followAlpha);
  controls.target.lerp(target, followAlpha);
  controls.target.copy(target);
  camera.lookAt(target);
}

function lerpAngle(current, target, alpha) {
  const delta = Math.atan2(Math.sin(target - current), Math.cos(target - current));
  return current + delta * alpha;
}

function setActiveZone(zoneKey) {
  activeZoneKey = zoneKey ?? activeZoneKey;

  zoneRegistry.forEach((zone) => {
    zone.pad.material.emissive.setHex(0x000000);
    zone.pad.position.y = 0.8;
    zone.outline.material.color.setHex(getOutlineColor(zone.key));
  });

  if (!zoneKey) {
    statusValue.textContent = focusViews[getCurrentFocusKey()].label;
    return;
  }

  const zone = zoneRegistry.get(zoneKey);
  if (!zone) {
    return;
  }

  zone.pad.material.emissive.set(getOutlineColor(zone.key));
  zone.pad.material.emissiveIntensity = 0.18;
  zone.pad.position.y = 1;
  zone.outline.material.color.set(0xffffff);
  statusValue.textContent = zone.label;
}

function getOutlineColor(zoneKey) {
  const outlineMap = {
    nitro: palette.storageBorder,
    hydrogen: palette.hazardBorder,
    mixing: palette.processBorder,
    rit: palette.processBorder,
    reactor: palette.processBorder,
    cooling: palette.processBorder,
    separation: palette.processBorder,
    distillation: palette.processBorder,
    product: palette.storageBorder,
    wastewater: palette.controlBorder,
    support: palette.utilityBorder,
    flare: palette.hazardBorder,
  };

  return outlineMap[zoneKey];
}

function setFocusView(key, options = {}) {
  const view = focusViews[key];
  if (!view) {
    return;
  }

  activeFocusKey = key;
  activeZoneKey = options.zoneKey ?? activeZoneKey;
  desiredCameraPosition.copy(view.position);
  desiredTarget.copy(view.target);
  statusValue.textContent = view.label;
  isCameraAnimating = true;

  focusButtons.forEach((button) => {
    button.classList.toggle('is-active', button.dataset.focus === key);
  });
}

function getCurrentFocusKey() {
  return activeFocusKey;
}

function onResize() {
  const { clientWidth, clientHeight } = mount;
  camera.aspect = clientWidth / clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(clientWidth, clientHeight);
}

function animate() {
  requestAnimationFrame(animate);
  const now = performance.now();
  const delta = Math.min((now - previousFrameTime) / 1000, 0.05);
  previousFrameTime = now;
  const time = now * 0.001;

  animatedFans.forEach((fan, index) => {
    fan.rotation.y += 0.08 + index * 0.002;
  });

  animatedFlames.forEach((flame, index) => {
    const pulse = 1 + Math.sin(performance.now() * 0.008 + index) * 0.12;
    flame.scale.set(1, pulse, 1);
    flame.material.opacity = 0.82 + Math.sin(now * 0.011 + index) * 0.08;
  });

  updatePlayer(delta);

  animatedWorkers.forEach((worker, index) => {
    if (playerState.active && worker === playerState.worker) {
      animatePlayableWorker(worker, time);
      return;
    }

    animateNpcWorker(worker, time, index);
  });

  if (isCameraAnimating && !playerState.active) {
    camera.position.lerp(desiredCameraPosition, 0.09);
    controls.target.lerp(desiredTarget, 0.11);

    const cameraSettled = camera.position.distanceToSquared(desiredCameraPosition) < 0.05;
    const targetSettled = controls.target.distanceToSquared(desiredTarget) < 0.05;
    if (cameraSettled && targetSettled) {
      camera.position.copy(desiredCameraPosition);
      controls.target.copy(desiredTarget);
      isCameraAnimating = false;
    }
  }

  controls.update();

  renderer.render(scene, camera);
}

function animateNpcWorker(worker, time, index) {
  const cycle = time * worker.speed + worker.phase + index * 0.23;
  const step = Math.sin(cycle * 2.2);
  const sway = Math.sin(cycle * 1.15);
  const nod = Math.sin(cycle * 1.6 + 0.35);
  const torsoSwing = worker.pose === 'hands' ? 0.12 : 0.06;
  const headTurn = worker.expression === 'skeptical' ? 0.12 : 0.07;
  const legSwing = worker.pose === 'pointing' ? 0.12 : 0.2;

  worker.root.position.y = worker.homeY + (step * worker.bobAmount + 0.02 * sway) * 0.75;
  worker.bodyRoot.rotation.z = sway * worker.swayAmount;
  worker.torsoPivot.rotation.z = sway * torsoSwing;
  worker.headPivot.rotation.y = sway * headTurn;
  worker.headPivot.rotation.z = nod * 0.04;

  worker.armPivots.forEach((arm, armIndex) => {
    const isLeadArm = worker.pose === 'pointing' && armIndex === 0;
    const baseSwing = isLeadArm ? 0.06 : (worker.pose === 'hands' ? 0.1 : 0.22);
    const direction = armIndex === 0 ? -1 : 1;
    arm.pivot.rotation.x = arm.baseX + step * baseSwing * direction;
    arm.pivot.rotation.z = arm.baseZ + sway * (isLeadArm ? 0.04 : 0.03) * direction;
  });

  worker.legPivots.forEach((leg, legIndex) => {
    const direction = legIndex === 0 ? 1 : -1;
    leg.pivot.rotation.x = leg.baseX + step * legSwing * direction;
    leg.pivot.rotation.z = leg.baseZ + sway * 0.02 * direction;
  });
}

function animatePlayableWorker(worker, time) {
  const stride = playerState.moveCycle;
  const speedBlend = playerState.moveIntensity;
  const idleSway = Math.sin(time * 1.8 + worker.phase);
  const bob = Math.sin(stride * 2.2) * 0.1 * speedBlend + idleSway * 0.018 * (1 - speedBlend);
  const step = Math.sin(stride * 2.2);
  const armSwing = 0.34 * speedBlend + 0.08 * (1 - speedBlend);
  const legSwing = 0.28 * speedBlend;

  worker.root.position.y = worker.homeY + bob;
  worker.bodyRoot.rotation.z = idleSway * 0.02 + step * 0.04 * speedBlend;
  worker.torsoPivot.rotation.z = step * 0.06 * speedBlend;
  worker.headPivot.rotation.y = Math.sin(time * 1.3 + worker.phase) * 0.04;
  worker.headPivot.rotation.z = idleSway * 0.02;

  worker.armPivots.forEach((arm, armIndex) => {
    const direction = armIndex === 0 ? -1 : 1;
    arm.pivot.rotation.x = arm.baseX + step * armSwing * direction;
    arm.pivot.rotation.z = arm.baseZ + Math.sin(time * 1.4 + armIndex) * 0.015;
  });

  worker.legPivots.forEach((leg, legIndex) => {
    const direction = legIndex === 0 ? 1 : -1;
    leg.pivot.rotation.x = leg.baseX + step * legSwing * direction;
    leg.pivot.rotation.z = leg.baseZ;
  });
}
