// sky.js - Volumetric sky dome with procedural clouds
// Exports: WW2.sky.createSky(scene)

WW2 = window.WW2 || {};

WW2.sky = (function() {
  function createSkyDome(scene, radius) {
    radius = radius || 15000;
    const skyGeo = new THREE.SphereGeometry(radius, 32, 32);
    skyGeo.scale(-1, 1, 1);

    const skyMat = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(0x0044aa) },
        midColor: { value: new THREE.Color(0x5588bb) },
        bottomColor: { value: new THREE.Color(0x99aacc) },
        offset: { value: 4 },
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
        uniform vec3 midColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition + offset).y;
          float t = max(pow(max(h, 0.0), exponent), 0.0);
          vec3 color = mix(bottomColor, midColor, smoothstep(0.0, 0.4, t));
          color = mix(color, topColor, smoothstep(0.4, 1.0, t));
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false
    });

    const sky = new THREE.Mesh(skyGeo, skyMat);
    sky.name = 'skyDome';
    scene.add(sky);

    const sunGeo = new THREE.SphereGeometry(500, 16, 16);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffffcc, fog: false });
    const sun = new THREE.Mesh(sunGeo, sunMat);
    sun.position.set(5000, 8000, -10000);
    scene.add(sun);

    const glowGeo = new THREE.SphereGeometry(800, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xffffaa, transparent: true, opacity: 0.3, fog: false
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.copy(sun.position);
    scene.add(glow);

    return { mesh: sky, sun, glow };
  }

  function createCloudLayer(scene, altitude, count) {
    altitude = altitude || 2500;
    count = count || 60;
    const clouds = new THREE.Group();
    clouds.name = 'clouds';

    const puffGeo = new THREE.SphereGeometry(1, 7, 5);
    const puffMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.85,
      roughness: 1,
      metalness: 0,
      depthWrite: false
    });

    const instancedClouds = new THREE.InstancedMesh(puffGeo, puffMat, count * 5);
    const dummy = new THREE.Object3D();
    let idx = 0;

    // Simple hash-based pseudo-random cloud placement
    for (let c = 0; c < count && idx < count * 5; c++) {
      const cx = (Math.random() - 0.5) * 10000;
      const cz = (Math.random() - 0.5) * 10000;
      const cy = altitude + (Math.random() - 0.5) * 600;

      const puffs = 3 + Math.floor(Math.random() * 5);
      for (let p = 0; p < puffs && idx < count * 5; p++) {
        const scale = 80 + Math.random() * 200;
        dummy.position.set(
          cx + (Math.random() - 0.5) * 400,
          cy + (Math.random() - 0.5) * 80,
          cz + (Math.random() - 0.5) * 400
        );
        dummy.scale.set(scale, scale * 0.3, scale * 0.7);
        dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        dummy.updateMatrix();
        instancedClouds.setMatrixAt(idx, dummy.matrix);
        instancedClouds.setColorAt(idx, new THREE.Color(1, 1, 1));
        idx++;
      }
    }

    instancedClouds.count = idx;
    instancedClouds.instanceMatrix.needsUpdate = true;
    if (instancedClouds.instanceColor) instancedClouds.instanceColor.needsUpdate = true;

    clouds.add(instancedClouds);
    scene.add(clouds);

    return clouds;
  }

  function createSky(scene) {
    const skyDome = createSkyDome(scene);
    const clouds = createCloudLayer(scene);

    const ambient = new THREE.AmbientLight(0x4466aa, 0.4);
    scene.add(ambient);

    const hemi = new THREE.HemisphereLight(0x88bbdd, 0x445522, 0.6);
    scene.add(hemi);

    const sunLight = new THREE.DirectionalLight(0xffeedd, 1.5);
    sunLight.position.set(5000, 8000, -10000);
    sunLight.castShadow = false;
    scene.add(sunLight);

    return { skyDome, clouds, ambient, hemi, sunLight };
  }

  return { createSky };
})();
