// camera.js - Chase camera with FOV dynamics and FOV warping
// Exports: WW2.camera.update(camera, playerAircraft, dt)

WW2 = window.WW2 || {};

WW2.camera = (function() {
  let mode = 'chase'; // 'chase', 'cockpit', 'cinematic', 'free'
  let smoothPos = new THREE.Vector3();
  let smoothLookAt = new THREE.Vector3();
  let init = false;

  function setMode(m) {
    mode = m;
  }

  function initCamera(camera, aircraft) {
    smoothPos.copy(aircraft.mesh.position);
    smoothLookAt.copy(aircraft.mesh.position);
    init = true;
  }

  function update(camera, player, dt) {
    if (!player || !player.isAlive) return;

    const forward = new THREE.Vector3(0, 0, 1)
      .applyAxisAngle(new THREE.Vector3(0, 1, 0), player.angle)
      .applyAxisAngle(new THREE.Vector3(1, 0, 0), -player.pitch);

    const up = new THREE.Vector3(0, 1, 0)
      .applyAxisAngle(new THREE.Vector3(0, 1, 0), player.angle);

    const speedRatio = player.speed / player.stats.maxSpeed;

    // FOV warping based on speed (cinematic effect)
    const baseFOV = mode === 'cockpit' ? 80 : 60;
    const targetFOV = baseFOV + speedRatio * 20;
    camera.fov += (targetFOV - camera.fov) * dt * 2;
    camera.updateProjectionMatrix();

    switch (mode) {
      case 'chase': {
        // Calculate desired camera position behind aircraft
        const dist = 25;
        const height = 8;
        const desiredPos = player.mesh.position.clone()
          .add(forward.clone().multiplyScalar(-dist))
          .add(up.clone().multiplyScalar(height));

        // Smooth follow
        const lerpFactor = 1 - Math.pow(0.01, dt);
        smoothPos.lerp(desiredPos, lerpFactor * 5);

        // Look slightly ahead of aircraft
        const lookTarget = player.mesh.position.clone()
          .add(forward.clone().multiplyScalar(15));
        smoothLookAt.lerp(lookTarget, lerpFactor * 8);

        camera.position.copy(smoothPos);
        camera.lookAt(smoothLookAt);
        break;
      }

      case 'cockpit': {
        // Inside cockpit view
        const cockpitPos = player.mesh.position.clone()
          .add(forward.clone().multiplyScalar(2))
          .add(new THREE.Vector3(0, 0.5, 0));

        const cockpitLook = player.mesh.position.clone()
          .add(forward.clone().multiplyScalar(50));

        smoothPos.lerp(cockpitPos, 1 - Math.pow(0.001, dt));
        smoothLookAt.lerp(cockpitLook, 1 - Math.pow(0.001, dt));

        camera.position.copy(smoothPos);
        camera.lookAt(smoothLookAt);
        break;
      }

      case 'cinematic': {
        // Wide orbiting shot
        const time = Date.now() * 0.0003;
        const orbitDist = 60;
        const orbitHeight = 20;

        const desiredPos = player.mesh.position.clone()
          .add(new THREE.Vector3(
            Math.sin(time) * orbitDist,
            orbitHeight,
            Math.cos(time) * orbitDist
          ));

        smoothPos.lerp(desiredPos, dt * 1.5);
        smoothLookAt.lerp(player.mesh.position, dt * 3);

        camera.position.copy(smoothPos);
        camera.lookAt(smoothLookAt);
        break;
      }

      case 'free': {
        // Free camera stays at current position, user controls with mouse
        // Position is handled by input directly
        break;
      }
    }

    // Add subtle camera shake based on G-force
    if (mode === 'chase' || mode === 'cockpit') {
      const shakeIntensity = speedRatio * 0.3 * (Math.abs(player.roll) + Math.abs(player.pitch));
      camera.position.x += (Math.random() - 0.5) * shakeIntensity;
      camera.position.y += (Math.random() - 0.5) * shakeIntensity;
    }
  }

  return { update, setMode, initCamera, mode: () => mode };
})();
