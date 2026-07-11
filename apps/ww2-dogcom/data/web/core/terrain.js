// terrain.js - Simplex noise terrain with vertex coloring
// Exports: WW2.terrain.createTerrain(scene, size, resolution)

WW2 = window.WW2 || {};

WW2.terrain = (function() {
  // Compact 2D Simplex Noise implementation
  const F2 = 0.5 * (Math.sqrt(3) - 1);
  const G2 = (3 - Math.sqrt(3)) / 6;
  const grad3 = [
    [1,1],[-1,1],[1,-1],[-1,-1],
    [1,0],[-1,0],[0,1],[0,-1]
  ];

  // Permuted table (deterministic seed)
  const perm = new Uint8Array(512);
  const permMod8 = new Uint8Array(512);
  let seeded = false;

  function seed(s) {
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    for (let i = 255; i > 0; i--) {
      s = (s * 16807 + 0) % 2147483647;
      const j = s % (i + 1);
      [p[i], p[j]] = [p[j], p[i]];
    }
    for (let i = 0; i < 512; i++) {
      perm[i] = p[i & 255];
      permMod8[i] = perm[i] % 8;
    }
    seeded = true;
  }

  seed(42); // Default seed for consistent terrain

  function simplex2D(xin, yin) {
    const n0 = simplex2D_noise0(xin, yin);
    return n0;
  }

  function simplex2D_noise0(xin, yin) {
    let n0, n1, n2;
    const s = (xin + yin) * F2;
    const i = Math.floor(xin + s);
    const j = Math.floor(yin + s);
    const t = (i + j) * G2;
    const x0 = xin - i + t;
    const y0 = yin - j + t;
    const i1 = x0 > y0 ? 1 : 0;
    const j1 = x0 > y0 ? 0 : 1;
    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2;
    const y2 = y0 - 1 + 2 * G2;
    const i2 = i + 1;
    const j2 = j + 1;
    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 < 0) n0 = 0;
    else { t0 *= t0; const gi0 = permMod8[i + perm[j]]; n0 = t0 * t0 * (grad3[gi0][0] * x0 + grad3[gi0][1] * y0); }
    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 < 0) n1 = 0;
    else { t1 *= t1; const gi1 = permMod8[i + i1 + perm[j + j1]]; n1 = t1 * t1 * (grad3[gi1][0] * x1 + grad3[gi1][1] * y1); }
    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 < 0) n2 = 0;
    else { t2 *= t2; const gi2 = permMod8[i2 + perm[j2]]; n2 = t2 * t2 * (grad3[gi2][0] * x2 + grad3[gi2][1] * y2); }
    return 70 * (n0 + n1 + n2);
  }

  // Fractal Brownian Motion for more natural terrain
  function fbm(x, y, octaves, lacunarity, gain) {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxVal = 0;
    for (let i = 0; i < octaves; i++) {
      value += amplitude * simplex2D(x * frequency, y * frequency);
      maxVal += amplitude;
      amplitude *= gain;
      frequency *= lacunarity;
    }
    return value / maxVal;
  }

  // Height function combining multiple noise layers
  function getHeight(x, y) {
    // Large-scale terrain features
    let h = fbm(x * 0.003, y * 0.003, 6, 2.0, 0.5);
    // Medium detail
    h += 0.3 * fbm(x * 0.01, y * 0.01, 4, 2.0, 0.4);
    // Fine detail
    h += 0.1 * fbm(x * 0.05, y * 0.05, 3, 2.0, 0.3);
    // Normalize to 0-1 and create elevation distribution
    h = (h + 1) * 0.5;
    // Compress high elevations, expand lowlands
    h = Math.pow(h, 1.3);
    return h;
  }

  function getColor(height, slope) {
    // Color palette based on height and slope
    if (height < 0.08) return [0.15, 0.35, 0.55];    // Deep water
    if (height < 0.12) return [0.25, 0.50, 0.60];    // Shallow water
    if (height < 0.15) return [0.76, 0.70, 0.50];    // Beach/sand
    if (slope > 0.5) return [0.35, 0.30, 0.25];       // Rock/cliff
    if (height < 0.30) return [0.22, 0.45, 0.15];     // Grass/lowland
    if (height < 0.50) return [0.15, 0.35, 0.12];     // Forest
    if (height < 0.65) return [0.25, 0.32, 0.18];     // Mountain green
    if (height < 0.78) return [0.35, 0.33, 0.30];     // Rocky
    if (height < 0.88) return [0.55, 0.53, 0.50];     // Rock
    return [0.95, 0.95, 0.97];                         // Snow cap
  }

  function createTerrain(scene, size = 8000, resolution = 256) {
    const geo = new THREE.PlaneGeometry(size, size, resolution, resolution);
    geo.rotateX(-Math.PI / 2);

    const positions = geo.attributes.position.array;
    const vertexCount = positions.length / 3;
    const colors = new Float32Array(vertexCount * 3);

    // First pass: compute heights
    const heights = new Float32Array(vertexCount);
    const maxTerrainHeight = 350;

    for (let i = 0; i < vertexCount; i++) {
      const x = positions[i * 3];
      const z = positions[i * 3 + 2];
      const h = getHeight(x, z);
      heights[i] = h;
      positions[i * 3 + 1] = h * maxTerrainHeight;
    }

    // Compute slopes for coloring
    const slopeSize = Math.round(Math.sqrt(vertexCount));
    const slopes = new Float32Array(vertexCount);

    for (let iz = 1; iz < slopeSize - 1; iz++) {
      for (let ix = 1; ix < slopeSize - 1; ix++) {
        const idx = iz * slopeSize + ix;
        const hL = heights[idx - 1] * maxTerrainHeight;
        const hR = heights[idx + 1] * maxTerrainHeight;
        const hD = heights[idx - slopeSize] * maxTerrainHeight;
        const hU = heights[idx + slopeSize] * maxTerrainHeight;
        const dx = (hR - hL) / size * resolution;
        const dz = (hU - hD) / size * resolution;
        slopes[idx] = Math.sqrt(dx * dx + dz * dz);
      }
    }

    // Second pass: compute colors
    for (let i = 0; i < vertexCount; i++) {
      const [r, g, b] = getColor(heights[i], slopes[i] || 0);
      colors[i * 3] = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.9,
      metalness: 0.05,
      flatShading: false
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;
    mesh.name = 'terrain';
    scene.add(mesh);

    // Water plane at sea level
    const waterGeo = new THREE.PlaneGeometry(size * 2, size * 2);
    waterGeo.rotateX(-Math.PI / 2);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x1a6b8a,
      transparent: true,
      opacity: 0.7,
      roughness: 0.1,
      metalness: 0.3
    });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.position.y = maxTerrainHeight * 0.1;
    water.name = 'water';
    scene.add(water);

    return {
      mesh,
      water,
      getHeightAt: function(x, z) {
        const h = getHeight(x, z);
        return h * maxTerrainHeight;
      },
      seaLevel: maxTerrainHeight * 0.1,
      maxHeight: maxTerrainHeight
    };
  }

  return { createTerrain, seed };
})();
