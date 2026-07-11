// ai.js - Enemy AI with BTA (Behavior Tree Agent) pattern
// Exports: WW2.ai.updateEnemy(enemy, dt, allies, enemies, player, terrain)

WW2 = window.WW2 || {};

WW2.ai = (function() {
  // AI States
  const STATE = {
    PATROL: 'patrol',
    SEARCH: 'search',
    ENGAGE: 'engage',
    MANEUVER: 'maneuver',
    RETREAT: 'retreat',
    REBASE: 'rebase'
  };

  // Patrol waypoints (circles over the map)
  function patrolTarget(enemy) {
    const t = enemy.mesh.position.x * 0.001 + enemy.mesh.position.z * 0.001;
    const radius = 1500;
    return new THREE.Vector3(
      Math.cos(t) * radius,
      enemy.stats.maxSpeed * 3 + 200,
      Math.sin(t) * radius
    );
  }

  // Find nearest enemy within detection range
  function detectEnemies(enemy, player, aiEnemies) {
    const range = enemy.stats.detectionRange;
    let closest = null;
    let closestDist = range;

    // Check player
    if (player && player.isAlive && player.team !== enemy.team) {
      const d = enemy.mesh.position.distanceTo(player.mesh.position);
      if (d < closestDist) {
        closestDist = d;
        closest = player;
      }
    }

    // Check AI on opposing team
    for (const other of aiEnemies) {
      if (other === enemy || !other.isAlive || other.team === enemy.team) continue;
      const d = enemy.mesh.position.distanceTo(other.mesh.position);
      if (d < closestDist) {
        closestDist = d;
        closest = other;
      }
    }

    return closest;
  }

  // Check if we have line of sight to target
  function hasLineOfSight(enemy, target) {
    const dist = enemy.mesh.position.distanceTo(target.mesh.position);
    const dir = new THREE.Vector3().subVectors(target.mesh.position, enemy.mesh.position).normalize();

    // Simple check: are we facing the target?
    const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), enemy.angle);
    const dot = forward.dot(dir);

    // Within 120 degrees cone and within range
    return dot > -0.5 && dist < enemy.stats.detectionRange * 1.5;
  }

  // Compute AI input based on current state
  function computeInput(enemy, target, dt) {
    const input = { pitch: 0, roll: 0, yaw: 0, throttle: 0.5, firing: false };

    switch (enemy.state) {
      case STATE.PATROL: {
        const target = patrolTarget(enemy);
        const dir = new THREE.Vector3().subVectors(target, enemy.mesh.position).normalize();
        const desiredAngle = Math.atan2(dir.x, dir.z);
        let diff = desiredAngle - enemy.angle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;

        input.roll = Math.max(-1, Math.min(1, diff * 2));
        input.pitch = (enemy.mesh.position.y - enemy.stats.maxSpeed * 3) * 0.002;
        input.throttle = 0.4;
        break;
      }

      case STATE.SEARCH: {
        // Looming/search pattern - circles while slowing
        input.roll = Math.sin(Date.now() * 0.002) * 0.7;
        input.pitch = 0.2;
        input.throttle = 0.3;
        break;
      }

      case STATE.ENGAGE: {
        if (!target || !target.isAlive) {
          enemy.state = STATE.SEARCH;
          return input;
        }

        const dist = enemy.mesh.position.distanceTo(target.mesh.position);
        const dir = new THREE.Vector3().subVectors(target.mesh.position, enemy.mesh.position).normalize();
        const desiredAngle = Math.atan2(dir.x, dir.z);
        let diff = desiredAngle - enemy.angle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;

        // Try to get on tail
        input.roll = Math.max(-1, Math.min(1, diff * 3));

        // Height matching
        const heightDiff = target.mesh.position.y - enemy.mesh.position.y;
        input.pitch = Math.max(-1, Math.min(1, heightDiff * 0.003));

        // Full throttle for energy
        input.throttle = 1.0;

        // Fire when in range and roughly facing target
        if (dist < 300 && Math.abs(diff) < 0.5) {
          input.firing = true;
        }

        // If target is too far and we're losing energy, switch to energy fight
        if (dist > 600 && enemy.speed < enemy.stats.maxSpeed * 0.5) {
          enemy.state = STATE.MANEUVER;
        }
        break;
      }

      case STATE.MANEUVER: {
        // Energy maneuvering - zoom climb
        input.pitch = 0.5;
        input.roll = Math.sin(Date.now() * 0.003) * 0.5;
        input.throttle = 1.0;

        // Drop down for speed when high enough
        if (enemy.mesh.position.y > enemy.stats.maxSpeed * 5) {
          input.pitch = -0.8;
        }

        // Check if we should re-engage
        if (target && target.isAlive) {
          const dist = enemy.mesh.position.distanceTo(target.mesh.position);
          if (dist < 400 && enemy.speed > enemy.stats.maxSpeed * 0.8) {
            enemy.state = STATE.ENGAGE;
          }
        }
        break;
      }

      case STATE.RETREAT: {
        // Run away when low health
        input.throttle = 1.0;
        input.pitch = -0.5; // Dive for speed
        input.roll = 0;

        if (enemy.health > enemy.stats.health * 0.6) {
          enemy.state = STATE.PATROL;
        }
        break;
      }
    }

    return input;
  }

  function updateEnemy(enemy, dt, player, aiEnemies, terrain) {
    if (!enemy.isAlive) return;

    // State machine transitions
    if (enemy.state === STATE.PATROL || enemy.state === STATE.SEARCH) {
      const target = detectEnemies(enemy, player, aiEnemies);
      if (target && hasLineOfSight(enemy, target)) {
        enemy.state = STATE.ENGAGE;
        enemy.target = target;
      } else if (target) {
        enemy.state = STATE.SEARCH;
        enemy.target = target;
      }
    }

    // Low health? Retreat
    if (enemy.health < enemy.stats.health * 0.25 && enemy.state !== STATE.RETREAT) {
      enemy.state = STATE.RETREAT;
    }

    // Search timeout - go back to patrol
    if (enemy.state === STATE.SEARCH && (!enemy.target || !enemy.target.isAlive)) {
      enemy.state = STATE.PATROL;
      enemy.target = null;
    }

    // Compute input based on state
    const input = computeInput(enemy, enemy.target, dt);

    // Apply physics
    WW2.physics.updateAircraft(enemy, dt, input, terrain);
  }

  return { updateEnemy, STATE, detectEnemies, hasLineOfSight, patrolTarget };
})();
