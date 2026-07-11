// particles.js - Explosion, smoke, fire, trail effects
// Exports: WW2.particles.explosion(pos, scene), .smoke(pos, scene), .update(dt)

WW2 = window.WW2 || {};

WW2.particles = (function() {
  const particles = [];
  const MAX_PARTICLES = 3000;

  function createParticle(position, velocity, size, color, lifetime, type) {
    if (particles.length >= MAX_PARTICLES) {
      // Remove oldest
      const deadIdx = particles.findIndex(p => p.life <= 0);
      if (deadIdx >= 0) {
        particles.splice(deadIdx, 1);
      } else {
        return null; // Pool full
      }
    }

    const geo = new THREE.SphereGeometry(size, 4, 3);
    const mat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 1,
      depthWrite: false
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(position);

    return {
      mesh,
      velocity,
      size,
      lifetime,
      life: lifetime,
      type // 'fire', 'smoke', 'debris', 'spark'
    };
  }

  function explosion(position, scene) {
    // Fire burst
    for (let i = 0; i < 40; i++) {
      const dir = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      ).normalize();

      const speed = 5 + Math.random() * 25;
      const p = createParticle(
        position.clone(),
        dir.multiplyScalar(speed),
        2 + Math.random() * 6,
        Math.random() > 0.5 ? 0xff6600 : 0xff3300,
        0.5 + Math.random() * 1.5,
        'fire'
      );
      if (p) { scene.add(p.mesh); particles.push(p); }
    }

    // Smoke
    for (let i = 0; i < 30; i++) {
      const dir = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        Math.random() * 0.8 + 0.2,
        (Math.random() - 0.5) * 2
      ).normalize();

      const speed = 2 + Math.random() * 8;
      const p = createParticle(
        position.clone().add(new THREE.Vector3(0, 5, 0)),
        dir.multiplyScalar(speed),
        4 + Math.random() * 10,
        0x444444,
        2 + Math.random() * 3,
        'smoke'
      );
      if (p) { scene.add(p.mesh); particles.push(p); }
    }

    // Debris
    for (let i = 0; i < 20; i++) {
      const dir = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        Math.random(),
        (Math.random() - 0.5) * 2
      ).normalize();

      const speed = 10 + Math.random() * 30;
      const p = createParticle(
        position.clone(),
        dir.multiplyScalar(speed),
        0.5 + Math.random() * 1.5,
        Math.random() > 0.5 ? 0x888888 : 0x555555,
        1 + Math.random() * 2,
        'debris'
      );
      if (p) { scene.add(p.mesh); particles.push(p); }
    }

    // Sparks (bright flashes)
    for (let i = 0; i < 25; i++) {
      const dir = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      ).normalize();

      const speed = 15 + Math.random() * 35;
      const p = createParticle(
        position.clone(),
        dir.multiplyScalar(speed),
        0.3 + Math.random() * 0.5,
        0xffffaa,
        0.2 + Math.random() * 0.5,
        'spark'
      );
      if (p) { scene.add(p.mesh); particles.push(p); }
    }

    // Flash (bright center)
    const flash = createParticle(
      position.clone(),
      new THREE.Vector3(0, 0, 0),
      15,
      0xffffff,
      0.3,
      'flash'
    );
    if (flash) { scene.add(flash.mesh); particles.push(flash); }
  }

  function smoke(position, scene) {
    for (let i = 0; i < 5; i++) {
      const dir = new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        Math.random() * 0.5 + 0.1,
        (Math.random() - 0.5) * 0.5
      ).normalize();

      const p = createParticle(
        position.clone().add(new THREE.Vector3(
          (Math.random() - 0.5) * 3,
          (Math.random() - 0.5) * 3,
          (Math.random() - 0.5) * 3
        )),
        dir.multiplyScalar(2 + Math.random() * 3),
        3 + Math.random() * 5,
        0x555555,
        2 + Math.random() * 2,
        'smoke'
      );
      if (p) { scene.add(p.mesh); particles.push(p); }
    }
  }

  function contrail(position, scene) {
    const p = createParticle(
      position.clone(),
      new THREE.Vector3(0, 0, 0),
      1.5,
      0xcccccc,
      3,
      'smoke'
    );
    if (p) { scene.add(p.mesh); particles.push(p); }
  }

  function update(dt) {
    const gravity = -9.81;

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;

      if (p.life <= 0) {
        if (p.mesh.parent) p.mesh.parent.remove(p.mesh);
        particles.splice(i, 1);
        continue;
      }

      // Update position
      p.velocity.y += gravity * dt * 0.3; // Reduced gravity for visual effect
      p.mesh.position.add(p.velocity.clone().multiplyScalar(dt));

      // Type-specific behavior
      switch (p.type) {
        case 'fire':
          // Fire shrinks and changes color
          const fireFade = p.life / p.lifetime;
          p.mesh.scale.setScalar(fireFade);
          if (fireFade < 0.3) {
            p.mesh.material.color.setHex(0x444444); // Turns to smoke
            p.mesh.material.opacity = fireFade * 0.8;
          } else {
            p.mesh.material.opacity = fireFade;
          }
          break;

        case 'smoke':
          // Smoke expands and fades
          const smokeExpand = 1 + (1 - p.life / p.lifetime) * 3;
          p.mesh.scale.setScalar(smokeExpand);
          p.mesh.material.opacity = (p.life / p.lifetime) * 0.4;
          break;

        case 'debris':
          // Debris falls with gravity
          p.mesh.material.opacity = p.life / p.lifetime;
          break;

        case 'spark':
          // Sparks fade quickly
          p.mesh.material.opacity = p.life / p.lifetime;
          break;

        case 'flash':
          // Flash is instant
          p.mesh.material.opacity = Math.pow(p.life / p.lifetime, 3);
          break;
      }
    }
  }

  function clear() {
    for (const p of particles) {
      if (p.mesh.parent) p.mesh.parent.remove(p.mesh);
    }
    particles.length = 0;
  }

  return { explosion, smoke, contrail, update, clear, particles };
})();
