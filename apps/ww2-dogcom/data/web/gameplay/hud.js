// hud.js - Heads-up display: speed, altitude, compass, target info, minimap
// Exports: WW2.hud.init(), .update(player, enemies, dt), .render()

WW2 = window.WW2 || {};

WW2.hud = (function() {
  let canvas = null;
  let ctx = null;
  let overlay = null;
  let width = 1920;
  let height = 1080;

  function init() {
    // Main HUD canvas
    canvas = document.createElement('canvas');
    canvas.id = 'hudCanvas';
    canvas.width = width;
    canvas.height = height;
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '100';
    ctx = canvas.getContext('2d');
    document.body.appendChild(canvas);

    // Crosshair overlay (SVG)
    overlay = document.createElement('div');
    overlay.id = 'hudOverlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:101;';
    document.body.appendChild(overlay);

    // Handle resize
    window.addEventListener('resize', () => {
      width = window.innerWidth * window.devicePixelRatio;
      height = window.innerHeight * window.devicePixelRatio;
      canvas.width = width;
      canvas.height = height;
    });

    return { canvas, overlay };
  }

  // Format degrees to compass
  function degreesToCompass(deg) {
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const idx = Math.round(deg / 45) % 8;
    return dirs[idx];
  }

  function update(player, enemies, terrain) {
    if (!ctx || !player) return;

    ctx.clearRect(0, 0, width, height);

    // === TOP BAR ===
    // Compass strip
    drawCompass(ctx, player.angle);

    // === SPEED + ALTITUDE (bottom left) ===
    drawFlightInfo(ctx, player);

    // === TARGET INFO (top right) ===
    drawTargetInfo(ctx, player, enemies);

    // === HEALTH BAR (bottom center) ===
    drawHealthBar(ctx, player);

    // === MINIMAP (bottom right) ===
    drawMinimap(ctx, player, enemies, terrain);

    // === KILL FEED (top left) ===
    // Could be added for notification-style alerts
  }

  function drawCompass(ctx, angle) {
    const centerX = width / 2;
    const y = 40;
    const barWidth = 600;
    const fontSize = 22;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(centerX - barWidth/2, y - 20, barWidth, 30);

    // Direction markers
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    ctx.font = `${fontSize}px monospace`;
    ctx.textAlign = 'center';

    // Normalize angle
    let normAngle = -angle / (Math.PI * 2) * 360;
    while (normAngle < 0) normAngle += 360;
    while (normAngle >= 360) normAngle -= 360;

    const offset = normAngle / 360 * barWidth;

    for (let i = -6; i <= 6; i++) {
      const deg = Math.floor(normAngle / 30) * 30 + i * 30;
      const x = centerX + (deg / 360 - 0.5) * barWidth + i * (barWidth / 12);
      const screenX = centerX + i * (barWidth / 12);

      if (screenX < centerX - barWidth/2 - 20 || screenX > centerX + barWidth/2 + 20) continue;

      const dirDeg = ((deg % 360) + 360) % 360;
      const dirName = degreesToCompass(dirDeg);

      if (screenX === centerX || Math.abs(screenX - centerX) < barWidth / 12) {
        ctx.fillStyle = '#00ff00';
        ctx.fillText(dirName, screenX, y);
      } else {
        ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
        ctx.fillText(dirName, screenX, y);
      }

      // Tick marks
      ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
      ctx.beginPath();
      ctx.moveTo(screenX, y + 5);
      ctx.lineTo(screenX, y + 10);
      ctx.stroke();
    }

    // Center indicator
    ctx.fillStyle = '#ff4444';
    ctx.beginPath();
    ctx.moveTo(centerX, y + 15);
    ctx.lineTo(centerX - 8, y + 25);
    ctx.lineTo(centerX + 8, y + 25);
    ctx.fill();
  }

  function drawFlightInfo(ctx, player) {
    const x = 50;
    const y = height - 200;
    const fontSize = 20;
    const lineH = 35;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(x - 15, y - 25, 200, 160);

    ctx.font = `${fontSize}px monospace`;
    ctx.textAlign = 'left';

    // Speed (km/h)
    ctx.fillStyle = '#00ff88';
    ctx.fillText(`SPD`, x, y);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${Math.round(player.speed * 3.6)} km/h`, x + 60, y);

    // Altitude (m)
    ctx.fillStyle = '#00ff88';
    ctx.fillText(`ALT`, x, y + lineH);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${Math.round(player.mesh.position.y)} m`, x + 60, y + lineH);

    // Vertical speed
    ctx.fillStyle = '#00ff88';
    ctx.fillText(`VS`, x, y + lineH * 2);
    ctx.fillStyle = player.velocity.y > 0 ? '#ff8844' : '#4488ff';
    const vs = Math.round(player.velocity.y * 60);
    ctx.fillText(`${vs > 0 ? '+' : ''}${vs} m/min`, x + 40, y + lineH * 2);

    // G-Force (approximate)
    ctx.fillStyle = '#00ff88';
    ctx.fillText(`G`, x, y + lineH * 3);
    const gForce = Math.sqrt(player.roll * player.roll + player.pitch * player.pitch) * 5 + 1;
    ctx.fillStyle = gForce > 8 ? '#ff4444' : '#ffffff';
    ctx.fillText(`${gForce.toFixed(1)}G`, x + 30, y + lineH * 3);

    // Aircraft type
    ctx.fillStyle = '#00ff88';
    ctx.fillText(`A/C`, x, y + lineH * 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(player.stats.name, x + 50, y + lineH * 4);
  }

  function drawTargetInfo(ctx, player, enemies) {
    const x = width - 300;
    const y = 60;
    const fontSize = 18;

    // Find closest enemy
    let closest = null;
    let closestDist = Infinity;

    for (const enemy of enemies) {
      if (!enemy.isAlive || enemy.team === player.team) continue;
      const d = player.mesh.position.distanceTo(enemy.mesh.position);
      if (d < closestDist) {
        closestDist = d;
        closest = enemy;
      }
    }

    if (closest) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(x - 10, y - 20, 290, 120);

      ctx.font = `${fontSize}px monospace`;
      ctx.textAlign = 'left';

      // Target name
      ctx.fillStyle = '#ff4444';
      ctx.fillText(`🎯 TARGET`, x, y);

      // Distance
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`DIST: ${Math.round(closestDist)} m`, x, y + 25);

      // Relative bearing
      const relPos = new THREE.Vector3().subVectors(closest.mesh.position, player.mesh.position);
      const bearing = Math.atan2(relPos.x, relPos.z) - player.angle;
      const bearingDeg = ((bearing * 180 / Math.PI) + 360) % 360;
      ctx.fillText(`BRG: ${Math.round(bearingDeg)}°`, x, y + 50);

      // Relative altitude
      const altDiff = closest.mesh.position.y - player.mesh.position.y;
      ctx.fillStyle = altDiff > 0 ? '#4488ff' : '#ff8844';
      ctx.fillText(`ALT: ${altDiff > 0 ? '+' : ''}${Math.round(altDiff)} m`, x, y + 75);

      // Health bar
      const healthPct = closest.health / closest.stats.health;
      ctx.fillStyle = '#333333';
      ctx.fillRect(x, y + 90, 200, 12);
      ctx.fillStyle = healthPct > 0.5 ? '#44ff44' : healthPct > 0.25 ? '#ffaa00' : '#ff4444';
      ctx.fillRect(x, y + 90, 200 * healthPct, 12);
      ctx.strokeStyle = '#666666';
      ctx.strokeRect(x, y + 90, 200, 12);
    }
  }

  function drawHealthBar(ctx, player) {
    const x = width / 2 - 150;
    const y = height - 60;
    const w = 300;
    const h = 20;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(x - 5, y - 25, w + 10, 45);

    // Label
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#00ff88';
    ctx.fillText('STRUCTURAL INTEGRITY', x + w / 2, y - 8);

    // Bar background
    ctx.fillStyle = '#333333';
    ctx.fillRect(x, y, w, h);

    // Health fill
    const healthPct = player.health / player.maxHealth;
    let barColor;
    if (healthPct > 0.6) barColor = '#44ff44';
    else if (healthPct > 0.3) barColor = '#ffaa00';
    else barColor = '#ff4444';

    ctx.fillStyle = barColor;
    ctx.fillRect(x, y, w * healthPct, h);

    // Border
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    // Percentage
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px monospace';
    ctx.fillText(`${Math.round(healthPct * 100)}%`, x + w / 2, y + 16);
  }

  function drawMinimap(ctx, player, enemies, terrain) {
    const size = 180;
    const x = width - size - 30;
    const y = height - size - 30;
    const range = 3000; // meters visible

    // Background
    ctx.fillStyle = 'rgba(0, 20, 0, 0.7)';
    ctx.beginPath();
    ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
    ctx.fill();

    // Border
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Grid lines
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.15)';
    ctx.lineWidth = 1;
    for (let i = -3; i <= 3; i++) {
      const gx = x + size/2 + (i / 3) * size/2;
      const gy = y + size/2 + (i / 3) * size/2;
      ctx.beginPath();
      ctx.moveTo(gx, y);
      ctx.lineTo(gx, y + size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, gy);
      ctx.lineTo(x + size, gy);
      ctx.stroke();
    }

    // Plot enemies
    for (const enemy of enemies) {
      if (!enemy.isAlive) continue;
      const relX = enemy.mesh.position.x - player.mesh.position.x;
      const relZ = enemy.mesh.position.z - player.mesh.position.z;

      // Rotate to match player's heading
      const cos = Math.cos(player.angle);
      const sin = Math.sin(player.angle);
      const rx = relX * cos + relZ * sin;
      const rz = -relX * sin + relZ * cos;

      const mx = x + size/2 + (rx / range) * size/2;
      const my = y + size/2 + (rz / range) * size/2;

      // Clip to circle
      const distFromCenter = Math.sqrt((mx - x - size/2)**2 + (my - y - size/2)**2);
      if (distFromCenter > size/2 - 5) continue;

      if (enemy.team === player.team) {
        ctx.fillStyle = '#44ff44';
      } else {
        ctx.fillStyle = '#ff4444';
      }

      ctx.beginPath();
      ctx.arc(mx, my, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Player (center)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x + size/2, y + size/2, 5, 0, Math.PI * 2);
    ctx.fill();

    // Player direction indicator
    const dirLen = 12;
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + size/2, y + size/2);
    ctx.lineTo(x + size/2, y + size/2 - dirLen);
    ctx.stroke();

    // Range ring
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x + size/2, y + size/2, size/2 * 0.5, 0, Math.PI * 2);
    ctx.stroke();
  }

  function drawCrosshair(ctx, player) {
    const cx = width / 2;
    const cy = height / 2;
    const size = 30;

    ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
    ctx.lineWidth = 2;

    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(cx - size, cy);
    ctx.lineTo(cx - size/4, cy);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx + size/4, cy);
    ctx.lineTo(cx + size, cy);
    ctx.stroke();

    // Vertical line
    ctx.beginPath();
    ctx.moveTo(cx, cy - size);
    ctx.lineTo(cx, cy - size/4);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx, cy + size/4);
    ctx.lineTo(cx, cy + size);
    ctx.stroke();

    // Center dot
    ctx.fillStyle = '#ff4444';
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  return { init, update, drawCrosshair };
})();
