import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export default class ShowAbrahamsModel {
  constructor() {
    this.container = document.getElementById('containerAbraham');

    this.frameCount = 0;
    this.vertexDisplacement = 0.00;
    this.animatingDestroy = false;
    this.animatingDestroyTop = false;
    this.delay = 0;
    this.getBackNormalVertices = [];
    this.goingCrazy = false;
    this.animatingBuild = false;
    this.indexBuild = 0;

    this.firstDestroy = null;
    this.firsBuild = null;

    this.init();
    this.startAnimation();
  }
  
  init() {
    this.createScene();
    this.createLights();
    this.createCamera();
    this.setupRenderer();
    this.loadAbrahamsModel();
    this.setupOrbitControls();
    this.addResizeListener();
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
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 1, 1000);
    this.camera.position.z = 120;
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.container.appendChild(this.renderer.domElement);
  }

  loadAbrahamsModel() {
    const loader = new GLTFLoader();
    loader.load('/models/abrahamsModel.glb', (gltf) => {
      this.model = gltf.scene.children[0]; 
      this.model.scale.set(35, 35, 35);
      this.model.rotation.x = Math.PI / 1.9; 
      this.model.rotation.y = .1; 
      this.model.rotation.z = 50;  
      this.scene.add(this.model);

      this.extractGeometryForParticles(this.model);
    });
  }

  extractGeometryForParticles() {
    this.model.traverse((child) => {
      if (child.isMesh) {
        this.geometry = child.geometry
      }
    });

    if (this.geometry) {
      this.generateParticles();
    }
  }

  generateParticles() {
    const particlesMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.1
    });

    const particles = new THREE.Points(this.geometry, particlesMaterial);
    this.scene.add(particles);

    this.particles = particles;
  }

  setupOrbitControls() {
    const controls = new OrbitControls(this.camera, this.renderer.domElement);
    controls.minDistance = 120;
    controls.maxDistance = 120;
  }

  addResizeListener() {
    window.addEventListener('resize', () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    });
  }

  destroyModel () {
    if (this.vertexDisplacement < 0){
      this.vertexDisplacement = 0;
    }
    
    if (!this.particles) {
      return;
    }

    const positionAttribute = this.geometry.getAttribute('position');
    const vertices = positionAttribute.array;

    console.log(this.vertexDisplacement, 'this.vertexDisplacement')

    const originalVertices = []//JSON.parse(JSON.stringify(vertices)); 
    //console.log(originalVertices, 'originalVertices')

    for (let i = 0; i < vertices.length; i += 3) {
      originalVertices.push(vertices[i]);
      originalVertices.push(vertices[i + 1]);
      originalVertices.push(vertices[i + 2]);
      vertices[i] += Math.random() *  this.vertexDisplacement - ( this.vertexDisplacement / 2 );

      if (!this.firstDestroy){
        this.firstDestroy = vertices[i];
      }

      vertices[i + 1] += Math.random() *  this.vertexDisplacement - ( this.vertexDisplacement / 2 );
      vertices[i + 2] += Math.random() *  this.vertexDisplacement - ( this.vertexDisplacement / 2 );
    }

    this.getBackNormalVertices.push({
      vertices: originalVertices,
      order: this.vertexDisplacement
    })

    this.geometry.attributes.position.needsUpdate = true;
  }

  buildModel () {
    if (!this.particles) {
      return;
    }

    const positionAttribute = this.geometry.getAttribute('position');
    const vertices = positionAttribute.array;
    console.log(this.getBackNormalVertices[this.indexBuild].order)
    for (let i = 0; i < vertices.length; i++) {
      vertices[i] += this.getBackNormalVertices[this.indexBuild].vertices[i];

      if (i + 1 === vertices.length && ){
        console.log(this.firstDestroy, )
      }
    }

    //console.log(this.getBackNormalVertices[this.indexBuild].vertices.length, positionAttribute.array.length, 'buildModel')
    //positionAttribute.array = this.getBackNormalVertices[this.indexBuild].vertices

    this.geometry.attributes.position.needsUpdate = true;
  }

  handleDestroy () {
    if (!this.animatingDestroy){
      return;
    }

    if (this.delay < 1){
      this.delay++;
      return;
    } else {
      this.delay = 0;
    }

    if (this.vertexDisplacement < 0.03 && !this.animatingDestroyTop) {
      this.vertexDisplacement += 0.005;
    } 

    if (this.animatingDestroyTop) {
      this.vertexDisplacement -= 0.005;
    }

    if (this.vertexDisplacement >= 0.03) {
      this.animatingDestroyTop = true;
    }

    if (this.vertexDisplacement <= 0.00) {
      this.animatingDestroyTop = false;
      this.animatingDestroy = false;
    }

    this.destroyModel();
  }

  handleBuild () {
    if (!this.animatingBuild){
      return;
    }

    if (this.indexBuild === this.getBackNormalVertices.length){
      this.animatingBuild = false;
      return;
    }
    
    if (this.delay < 1){
      this.delay++;
      return;
    } else {
      this.delay = 0;
    }

    this.buildModel();
    this.indexBuild++
  }


  handleSetMode () {
    if (this.frameCount % 500 === 0) {
      this.goingCrazy = !this.goingCrazy;

      if (this.goingCrazy){
        this.animatingDestroy = true;
      }

      if (!this.goingCrazy){
        this.animatingBuild = true;
        this.getBackNormalVertices.reverse();
        this.indexBuild = 0;
      }
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    if (this.model) {
      this.model.rotation.y += 0.0007; // Rotate the model around the Y-axis
      this.model.rotation.z += 0.0007; // Rotate the model around the Y-axis
      this.model.rotation.x += 0.0007; // Rotate the model around the Y-axis
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