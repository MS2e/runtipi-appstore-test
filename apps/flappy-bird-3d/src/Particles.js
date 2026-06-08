import * as THREE from 'three';

export class Particles {
  constructor(scene) {
    this.scene = scene;
    this.systems = {};
  }

  _createSystem(name, count, color, size = 0.05) {
    const positions = new Float32Array(count * 3);
    const velocities = [];
    const lifetimes = new Float32Array(count);
    const alive = new Uint8Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
      velocities.push(new THREE.Vector3());
      lifetimes[i] = 0;
      alive[i] = 0;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color, size, sizeAttenuation: true, transparent: true, opacity: 0.8
    });

    const points = new THREE.Points(geo, mat);
    this.scene.scene.add(points);

    this.systems[name] = { positions, velocities, lifetimes, alive, count, geo, points };
    return name;
  }

  init() {
    this._createSystem('jump', 50, 0xffd700, 0.06);
    this._createSystem('score', 80, 0x00ff88, 0.08);
    this._createSystem('collision', 100, 0xff4444, 0.1);
    this._createSystem('death', 150, 0xff0000, 0.12);
  }

  emit(name, origin, count, velocityRange = 2, spread = 1) {
    const sys = this.systems[name];
    if (!sys) return;

    let emitted = 0;
    for (let i = 0; i < sys.count && emitted < count; i++) {
      if (!sys.alive[i]) {
        sys.alive[i] = 1;
        sys.lifetimes[i] = 0.5 + Math.random() * 1.0;

        sys.positions[i * 3] = origin.x;
        sys.positions[i * 3 + 1] = origin.y;
        sys.positions[i * 3 + 2] = origin.z;

        sys.velocities[i].set(
          (Math.random() - 0.5) * velocityRange * spread,
          Math.random() * velocityRange,
          (Math.random() - 0.5) * velocityRange * spread
        );
        emitted++;
      }
    }
  }

  update(dt) {
    for (const name in this.systems) {
      const sys = this.systems[name];
      for (let i = 0; i < sys.count; i++) {
        if (!sys.alive[i]) continue;

        sys.lifetimes[i] -= dt;
        if (sys.lifetimes[i] <= 0) {
          sys.alive[i] = 0;
          sys.positions[i * 3 + 1] = -100; // hide
          continue;
        }

        sys.positions[i * 3] += sys.velocities[i].x * dt;
        sys.positions[i * 3 + 1] += sys.velocities[i].y * dt;
        sys.positions[i * 3 + 2] += sys.velocities[i].z * dt;
        sys.velocities[i].y -= 5 * dt; // gravity on particles
      }
      sys.geo.attributes.position.needsUpdate = true;
    }
  }

  clear() {
    for (const name in this.systems) {
      const sys = this.systems[name];
      sys.alive.fill(0);
      sys.positions.fill(-100);
      sys.geo.attributes.position.needsUpdate = true;
    }
  }

  dispose() {
    for (const name in this.systems) {
      const sys = this.systems[name];
      this.scene.scene.remove(sys.points);
      sys.geo.dispose();
      sys.points.material.dispose();
    }
  }
}
