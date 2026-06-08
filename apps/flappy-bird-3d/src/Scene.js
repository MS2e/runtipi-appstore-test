import * as THREE from 'three';

export class Scene {
  constructor(container) {
    this.container = container;
    this.width = container.clientWidth;
    this.height = container.clientHeight;
    this.clock = new THREE.Clock();
    this.scene = new THREE.Scene();
    this._build();
  }

  _build() {
    // Camera: side-view perspective
    this.camera = new THREE.PerspectiveCamera(60, this.width / this.height, 0.1, 100);
    this.camera.position.set(0, 2, 8);
    this.camera.lookAt(0, 0, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.container.appendChild(this.renderer.domElement);

    // Scene background - gradient sky
    this._createSkybox();

    // 3-point lighting
    this._createLighting();

    // Ground
    this._createGround();

    // Sky decorations (distant buildings)
    this._createCityscape();

    // Handle resize
    this._onResize = this._onResize.bind(this);
    window.addEventListener('resize', this._onResize);
  }

  _createSkybox() {
    // Gradient sky dome
    const skyGeo = new THREE.SphereGeometry(50, 32, 32);
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {
        topColor: { value: new THREE.Color(0x0077ff) },
        bottomColor: { value: new THREE.Color(0x001133) },
        offset: { value: 10 },
        exponent: { value: 0.6 }
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition + offset).y;
          gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
        }
      `,
      depthWrite: false
    });
    this.sky = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(this.sky);

    // Stars
    const starsGeo = new THREE.BufferGeometry();
    const starPositions = [];
    for (let i = 0; i < 500; i++) {
      starPositions.push(
        (Math.random() - 0.5) * 80,
        Math.random() * 30 + 5,
        (Math.random() - 0.5) * 80 - 20
      );
    }
    starsGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
    const starsMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.08, sizeAttenuation: true });
    this.stars = new THREE.Points(starsGeo, starsMat);
    this.scene.add(this.stars);
  }

  _createLighting() {
    // Ambient
    const ambient = new THREE.AmbientLight(0x334466, 0.6);
    this.scene.add(ambient);

    // Directional (main sun)
    this.sunLight = new THREE.DirectionalLight(0xffeedd, 1.2);
    this.sunLight.position.set(5, 8, 5);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 30;
    this.sunLight.shadow.camera.left = -10;
    this.sunLight.shadow.camera.right = 10;
    this.sunLight.shadow.camera.top = 10;
    this.sunLight.shadow.camera.bottom = -10;
    this.sunLight.shadow.bias = -0.0005;
    this.scene.add(this.sunLight);

    // Fill light
    const fill = new THREE.PointLight(0x4488ff, 0.4, 20);
    fill.position.set(-5, 3, -5);
    this.scene.add(fill);
  }

  _createGround() {
    // Ground plane
    const groundGeo = new THREE.PlaneGeometry(40, 40);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x2d5a27,
      roughness: 0.9,
      metalness: 0.0
    });
    this.ground = new THREE.Mesh(groundGeo, groundMat);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.y = -3;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);

    // Border walls (top and bottom)
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.7 });
    const wallGeo = new THREE.BoxGeometry(30, 0.3, 1);

    const topWall = new THREE.Mesh(wallGeo, wallMat);
    topWall.position.set(0, 8, 0);
    topWall.castShadow = true;
    topWall.receiveShadow = true;
    this.scene.add(topWall);

    const bottomWall = new THREE.Mesh(wallGeo, wallMat);
    bottomWall.position.set(0, -3.15, 0);
    bottomWall.castShadow = true;
    bottomWall.receiveShadow = true;
    this.scene.add(bottomWall);
  }

  _createCityscape() {
    const buildings = [];
    const buildingMat = new THREE.MeshStandardMaterial({ color: 0x1a2a3a, roughness: 0.8 });
    const windowMat = new THREE.MeshStandardMaterial({
      color: 0xffdd88, emissive: 0xffdd88, emissiveIntensity: 0.3
    });

    for (let i = 0; i < 20; i++) {
      const w = 0.5 + Math.random() * 1.5;
      const h = 2 + Math.random() * 8;
      const d = 0.5 + Math.random() * 1.5;
      const building = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        buildingMat
      );
      const side = Math.random() > 0.5 ? 1 : -1;
      building.position.set(
        side * (8 + Math.random() * 15),
        -3 + h / 2,
        -5 - Math.random() * 10
      );
      building.castShadow = true;
      building.receiveShadow = true;
      this.scene.add(building);
      buildings.push(building);

      // Windows
      for (let wy = 0; wy < Math.floor(h / 1.2); wy++) {
        for (let wx = 0; wx < Math.floor(w / 0.6); wx++) {
          if (Math.random() > 0.4) {
            const win = new THREE.Mesh(
              new THREE.PlaneGeometry(0.3, 0.4),
              Math.random() > 0.3 ? windowMat : new THREE.MeshStandardMaterial({ color: 0x111122 })
            );
            win.position.set(
              building.position.x - w / 2 + 0.3 + wx * 0.6,
              -3 + 0.8 + wy * 1.2,
              building.position.z + d / 2 + 0.01
            );
            this.scene.add(win);
          }
        }
      }
    }
  }

  _onResize() {
    this.width = this.container.clientWidth;
    this.height = this.container.clientHeight;
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }

  get renderer() { return this.renderer; }
  get scene() { return this.scene; }
  get camera() { return this.camera; }
  get clock() { return this.clock; }

  dispose() {
    window.removeEventListener('resize', this._onResize);
    this.renderer.dispose();
    // Clean up all geometries and materials
    this.scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
    });
  }
}
