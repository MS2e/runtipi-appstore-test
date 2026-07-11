// weapons.js - Guns, bullets, hit detection
// Exports: WW2.weapons.fire(aircraft, targets), .update(dt, scene)

WW2 = window.WW2 || {};

WW2.weapons = (function() {
  const bullets = [];
  const MAX_BULLETS = 500;
  const BULLET_SPEED = 750; // m/s (~Mach 2.2 for 7.7mm Browning)
  const BULLET_RANGE = 900; // meters

  // Bullet geometry (shared)
  let bulletGeo = null;
  let bulletMat = null;

  function init(scene) {
    bulletGeo = new THREE.SphereGeometry(0.3, 3, 2);
    bulletMat = new THREE.MeshBasicMaterial({ color: 0xffaa33 });
  }

  function fire(aircraft, targets, time) {
    if (!aircraft.isAlive) return false;
    if (time - aircraft.lastShot < aircraft.stats.gunRate) return false;

    aircraft.lastShot = time;
    WW2.sound.gunfire(aircraft.stats.gunCount);

    const count = 8; // bullets per burst
    const forward = new THREE.Vector3(0, 0, 1)
      .applyAxisAngle(new THREE.Vector3(0, 1, 0), aircraft.angle)
      .applyAxisAngle(new THREE.Vector3(1, 0, 0), -aircraft.pitch);

    for (let i = 0; i < count; i++) {
      if (bullets.length >= MAX_BULLETS) {
        // Recycle oldest bullet
        const old = bullets.shift();
        if (old.mesh && old.mesh.parent) old.mesh.parent.remove(old.mesh);
      }

      // Spread
      const spread = 0.02;
      const dir = forward.clone();
      dir.x += (Math.random() - 0.5) * spread;
      dir.y += (Math.random() - 0.5) * spread;
      dir.z += (Math.random() - 0.5) * spread;
      dir.normalize();

      // Start position: nose of aircraft
      const origin = aircraft.mesh.position.clone().add(
        forward.clone().multiplyScalar(3)
      );

      const bullet = {
        origin: origin.clone(),
        dir: dir,
        speed: BULLET_SPEED + (Math.random() - 0.5) * 30,
        damage: aircraft.stats.gunDamage,
        shooter: aircraft,
        distance: 0,
        life: BULLET_RANGE / BULLET_SPEED,
        hits: 0,
        mesh: null
      };

      // Create visible trail
      const trailGeo = new THREE.CylinderGeometry(0.05, 0.1, 2, 3);
      trailGeo.rotateX(-Math.PI / 2);
      const trailMat = new THREE.MeshBasicMaterial({
        color: 0xffcc44,
        transparent: true,
        opacity: 0.7
      });
      const mesh = new THREE.Mesh(trailGeo, trailMat);
      mesh.position.copy(origin);
      mesh.lookAt(origin.clone().add(dir));
      bullet.mesh = mesh;
      if (bullet.mesh.parent) bullet.mesh.parent.remove(bullet.mesh);

      bullets.push(bullet);
    }

    return true;
  }

  function update(dt, scene, allAircraft) {
    // Remove bullets that are too old or out of range
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.distance += b.speed * dt;
      b.life -= dt;

      if (b.life <= 0 || b.distance > BULLET_RANGE) {
        if (b.mesh && b.mesh.parent) b.mesh.parent.remove(b.mesh);
        bullets.splice(i, 1);
        continue;
      }

      // Update position
      if (b.mesh) {
        b.mesh.position.copy(b.origin).add(b.dir.clone().multiplyScalar(b.distance));

        // Fade opacity with distance
        const fade = 1 - b.distance / BULLET_RANGE;
        if (b.mesh.material) b.mesh.material.opacity = fade * 0.7;
      }

      // Hit detection
      for (const target of allAircraft) {
        if (target === b.shooter || !target.isAlive || target.team === b.shooter.team) continue;
        if (b.hits >= 3) break; // Max hits per bullet

        const dist = b.mesh.position.distanceTo(target.mesh.position);
        if (dist < 8) { // Hit radius
          // Hit!
          target.health -= b.damage;
          WW2.sound.hit();

          // Smoke trail on hit aircraft
          if (WW2.particles) WW2.particles.smoke(target.mesh.position, scene);

          if (target.health <= 0) {
            target.isAlive = false;
            WW2.sound.explosion(50);
            if (WW2.particles) WW2.particles.explosion(target.mesh.position, scene);
          }

          b.hits++;
          break;
        }
      }
    }
  }

  function render(scene) {
    for (const b of bullets) {
      if (!b.mesh.parent) scene.add(b.mesh);
    }
  }

  function clear() {
    for (const b of bullets) {
      if (b.mesh && b.mesh.parent) b.mesh.parent.remove(b.mesh);
    }
    bullets.length = 0;
  }

  return { init, fire, update, render, clear, bullets };
})();
