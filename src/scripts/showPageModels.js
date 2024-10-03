import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

export default class ShowPageModels {
  constructor(pathModel, idContainer) {
    this.container = document.getElementById(idContainer);

    this.animating = false;
    this.windowWidth = 0;
    this.windowHeight = 0;
    this.percentLoading = 0;
    this.doneRender = false;
    this.pathModel = pathModel;

    this.init();
    this.startAnimation();
    this.addListenerShow();
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
        this.model.scale.set(80, 80, 80);
        this.scene.add(this.model);

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

  animate() {
    if (this.animating) {
      requestAnimationFrame(() => this.animate());

      if (this.model) {
        this.model.rotation.y += 0.004;
        this.model.rotation.z += 0.004;
        this.model.rotation.x += 0.004;
      }

      //console.log(this.pathModel, 'animate')

      this.renderer.render(this.scene, this.camera);
    }
  }

  startAnimation() {
    this.animate();
  }

  pauseAnimation() {
    this.animating = false;
  }

  resumeAnimation() {
    this.animating = true;
    this.animate();
  }

  addListenerShow() {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            this.resumeAnimation();
          }

          if (!entry.isIntersecting) {
            this.pauseAnimation();
          }
        }
      },
      { threshold: 0 },
    );

    if (this.container) {
      observer.observe(this.container);
    }
  }
}
