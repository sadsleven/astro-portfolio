import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

export default class ShowAbrahamsModel {
  constructor(pathModel, idContainer) {
    this.container = document.getElementById(idContainer);

    this.frameCount = 0;
    this.vertexDisplacement = 0.0;
    this.animatingDestroy = false;
    this.delay = 0;
    this.getBackNormalVertices = [];
    this.goingCrazy = false;
    this.animatingBuild = false;
    this.indexBuild = 0;
    this.windowWidth = 0;
    this.windowHeight = 0;
    this.percentLoading = 0;
    this.doneRender = false;

    this.pathModel = pathModel;

    this.init();
    this.startAnimation();
  }

  init() {
    this.setWindowSize();
    this.createScene();
    this.createLights();
    this.createCamera();
    this.setupRenderer();
    this.loadAbrahamsModel();
    this.setupOrbitControls();
    this.addResizeListener();
  }

  setWindowSize() {
    this.windowWidth = window.innerWidth > 1200 ? 600 : window.innerWidth;
    this.windowHeight = this.windowWidth;
  }

  createScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xffffff);
  }

  createLights() {
    this.scene.add(new THREE.AmbientLight(0xffffff, 2));

    const dirLight1 = new THREE.DirectionalLight(0xffddcc, 2);
    dirLight1.position.set(1, 0.75, 0.5);
    this.scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xccccff, 2);
    dirLight2.position.set(-1, 0.75, -0.5);
    this.scene.add(dirLight2);
  }

  createCamera() {
    const aspect = this.windowWidth / this.windowHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 1, 1000);
    this.camera.position.z = 120;
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(this.windowWidth, this.windowHeight);
    this.container.appendChild(this.renderer.domElement);
  }

  waitForModelToRender() {
    this.renderer.compile(this.scene, this.camera);
    this.renderer.render(this.scene, this.camera);

    this.doneRender = true;
    console.log("doneRender", this.pathModel);
  }

  loadAbrahamsModel() {
    const dracoLoader = new DRACOLoader();
    const loader = new GLTFLoader();
    dracoLoader.setDecoderPath("/draco/gltf/");
    loader.setDRACOLoader(dracoLoader);

    loader.load(
      this.pathModel,
      (gltf) => {
        this.model = gltf.scene.children[0];
        this.model.scale.set(40, 40, 40);
        this.model.rotation.x = Math.PI / 1.9;
        this.model.rotation.y = 0.1;
        this.model.rotation.z = 50;
        this.scene.add(this.model);

        this.extractGeometryForParticles(this.model);

        this.waitForModelToRender();
      },
      (xhr) => {
        this.percentLoading = Math.round((xhr.loaded / xhr.total) * 100);
        /*console.log(
          `Loading model: ${this.percentLoading}%`,
          this.pathModel,
          xhr,
          xhr.loaded,
          xhr.total,
        );

        document.getElementById("loader-text").innerText =
          `Loading model: ${this.percentLoading}%`;*/
      },
      (error) => {
        console.error("Error loading model:", error);
      },
    );
  }

  extractGeometryForParticles() {
    this.model.traverse((child) => {
      if (child.isMesh) {
        this.geometry = child.geometry;
      }
    });

    if (this.geometry) {
      this.generateParticles();
    }
  }

  generateParticles() {
    const particlesMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.1,
    });

    const particles = new THREE.Points(this.geometry, particlesMaterial);
    this.scene.add(particles);

    this.particles = particles;
  }

  setupOrbitControls() {
    const controls = new OrbitControls(this.camera, this.renderer.domElement);
    controls.enableZoom = false;
  }

  addResizeListener() {
    window.addEventListener("resize", () => {
      this.setWindowSize();
      const width = this.windowWidth;
      const height = this.windowHeight;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    });
  }

  destroyModel() {
    if (this.vertexDisplacement < 0) {
      this.vertexDisplacement = 0;
    }

    if (!this.particles) {
      return;
    }

    const positionAttribute = this.geometry.getAttribute("position");
    const vertices = positionAttribute.array;

    const originalVertices = [];

    for (let i = 0; i < vertices.length; i += 3) {
      originalVertices.push(vertices[i]);
      originalVertices.push(vertices[i + 1]);
      originalVertices.push(vertices[i + 2]);
      vertices[i] +=
        Math.random() * this.vertexDisplacement - this.vertexDisplacement / 2;
      vertices[i + 1] +=
        Math.random() * this.vertexDisplacement - this.vertexDisplacement / 2;
      vertices[i + 2] +=
        Math.random() * this.vertexDisplacement - this.vertexDisplacement / 2;
    }

    this.getBackNormalVertices.push({
      vertices: originalVertices,
      order: this.vertexDisplacement,
    });

    this.geometry.attributes.position.needsUpdate = true;
  }

  buildModel() {
    if (!this.particles) {
      return;
    }

    const positionAttribute = this.geometry.getAttribute("position");
    const vertices = positionAttribute.array;

    for (let i = 0; i < vertices.length; i++) {
      vertices[i] = this.getBackNormalVertices[this.indexBuild].vertices[i];
    }

    this.geometry.attributes.position.needsUpdate = true;
  }

  handleDestroy() {
    if (!this.animatingDestroy) {
      return;
    }

    // Test to optimize
    /*if (this.delay < 1){
      this.delay++;
      return;
    } else {
      this.delay = 0;
    }*/

    if (this.vertexDisplacement < 0.06) {
      this.vertexDisplacement += 0.005;
    }

    if (this.vertexDisplacement >= 0.06) {
      this.animatingDestroy = false;
    }

    this.destroyModel();
  }

  handleBuild() {
    if (!this.animatingBuild) {
      return;
    }

    if (this.indexBuild === this.getBackNormalVertices.length) {
      this.animatingBuild = false;
      return;
    }

    // Test to optimize
    /*if (this.delay < 1){
      this.delay++;
      return;
    } else {
      this.delay = 0;
    }*/

    this.buildModel();
    this.indexBuild++;
  }

  handleSetMode() {
    if (this.frameCount % 300 === 0) {
      this.goingCrazy = !this.goingCrazy;

      if (this.goingCrazy) {
        this.getBackNormalVertices = [];
        this.vertexDisplacement = 0;
        this.animatingDestroy = true;
      }

      if (!this.goingCrazy) {
        this.animatingBuild = true;
        this.getBackNormalVertices.reverse();
        this.indexBuild = 0;
      }
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    if (this.model) {
      this.model.rotation.y += 0.0007;
      this.model.rotation.z += 0.0007;
      this.model.rotation.x += 0.0004;
    }

    this.frameCount++;

    this.handleSetMode();
    this.handleDestroy();
    this.handleBuild();

    this.renderer.render(this.scene, this.camera);
  }

  startAnimation() {
    this.animate();
  }
}
