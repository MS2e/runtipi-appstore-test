// physics.js - Simplified flight dynamics model
// Exports: WW2.physics.updateAircraft(aircraft, dt, input)

WW2 = window.WW2 || {};

WW2.physics = (function() {
  // Simplified aerodynamic model based on point-mass + stability derivatives
  // Not a full 6-DOF simulator, but good enough for arcade-dogfighting

  function updateAircraft(aircraft, dt, input, terrain) {
    if (!aircraft.isAlive) return;

    const s = aircraft.stats;

    // Speed-dependent factors
    const speedRatio = aircraft.speed / s.maxSpeed;
    const dynamicPressure = 0.5 * 1.225 * aircraft.speed * aircraft.speed; // q = 0.5 * rho * v^2

    // Thrust (simplified throttle curve)
    const thrust = 0.5 + input.throttle * 0.5;
    const thrustForce = thrust * s.maxSpeed * 15;

    // Drag (parasitic + induced)
    const cd0 = 0.02;
    const cdInduced = 0.04 / (1 + speedRatio * speedRatio);
    const dragCoeff = cd0 + cdInduced;
    const dragForce = dragCoeff * dynamicPressure * 8;

    // Lift
    const aoa = aircraft.pitch;
    const liftCoeff = 2 * Math.PI * aoa;
    const liftForce = liftCoeff * dynamicPressure * 8;

    // Apply inputs
    // Pitch control
    const pitchTarget = input.pitch * s.turnRate * 1.5;
    aircraft.pitch += (pitchTarget - aircraft.pitch) * Math.min(1, dt * 4);

    // Roll control
    const rollTarget = input.roll * s.turnRate * 2;
    aircraft.roll += (rollTarget - aircraft.roll) * Math.min(1, dt * 6);

    // Update speed
    let thrustAccel = thrustForce / 100;
    let dragDecel = -(dragForce / 100);
    const climbPenalty = Math.max(0, Math.sin(aircraft.pitch)) * dragDecel * 2;
    aircraft.speed += (thrustAccel + dragDecel + climbPenalty) * dt;
    aircraft.speed = Math.max(50, Math.min(s.maxSpeed * 1.1, aircraft.speed));

    // Turn rate depends on roll and speed
    const turnRate = Math.sin(aircraft.roll) * 9.81 / Math.max(aircraft.speed, 60);
    aircraft.angle += turnRate * dt + input.yaw * s.turnRate * 0.5 * dt;

    // Update velocity & position
    const forward = new THREE.Vector3(
      Math.sin(aircraft.angle),
      0,
      Math.cos(aircraft.angle)
    );
    const climbVelocity = Math.sin(aircraft.pitch) * aircraft.speed;
    const forwardVelocity = Math.cos(aircraft.pitch) * aircraft.speed;

    aircraft.velocity.x = forward.x * forwardVelocity;
    aircraft.velocity.y = climbVelocity;
    aircraft.velocity.z = forward.z * forwardVelocity;

    aircraft.mesh.position.x += aircraft.velocity.x * dt;
    aircraft.mesh.position.y += aircraft.velocity.y * dt;
    aircraft.mesh.position.z += aircraft.velocity.z * dt;

    // Ground collision
    if (terrain) {
      const groundHeight = terrain.getHeightAt(aircraft.mesh.position.x, aircraft.mesh.position.z);
      if (aircraft.mesh.position.y < groundHeight + 5) {
        aircraft.mesh.position.y = groundHeight + 5;
        aircraft.pitch = Math.min(aircraft.pitch, 0.2);
        aircraft.velocity.y = Math.max(aircraft.velocity.y, 10);
      }
    }

    // Ceiling
    if (aircraft.mesh.position.y > 12000) {
      aircraft.velocity.y = Math.min(aircraft.velocity.y, 0);
      aircraft.mesh.position.y = 12000;
    }

    // Apply rotation to mesh
    aircraft.mesh.rotation.y = aircraft.angle;
    aircraft.mesh.rotation.x = -aircraft.pitch;
    aircraft.mesh.rotation.z = aircraft.roll;

    // Propeller spin
    if (aircraft.mesh.propeller) {
      const propSpeed = aircraft.speed / s.maxSpeed;
      aircraft.mesh.propeller.rotation.z += propSpeed * 25 * dt;
    }
  }

  // Line of sight check
  function lineOfSight(pos1, pos2, obstacleHeight) {
    obstacleHeight = obstacleHeight || 10;
    return pos1.y > obstacleHeight && pos2.y > obstacleHeight;
  }

  return { updateAircraft, lineOfSight };
})();
