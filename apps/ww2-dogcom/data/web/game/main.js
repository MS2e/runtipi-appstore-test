// main.js - Game entry point and main loop
// Orchestrates all modules: terrain, aircraft, sky, sound, physics, input, ai, weapons, particles, camera, hud

class WW2Game {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.player = null;
    this.enemies = [];
    this.allies = [];
    this.terrain = null;
    this.clock = new THREE.Clock();
    this.gameTime = 0;
    this.cameraMode = 0;
    this.cameraModes = ['chase', 'cockpit', 'cinematic'];
    this.running = false;
    this.score = 0;
    this.kills = [];
  }

  async init() {
    // Setup Three.js scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x88bbdd, 0.00008);

    // Camera
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 20000);
    this.camera.position.set(0, 300, 200);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = false;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    document.body.appendChild(this.renderer.domElement);

    // Resize handler
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // --- Build World ---
    console.log('Building terrain...');
    this.terrain = WW2.terrain.createTerrain(this.scene, 8000, 128);

    console.log('Creating sky...');
    WW2.sky.createSky(this.scene);

    // --- Setup Systems ---
    console.log('Initializing systems...');
    WW2.input.init();
    WW2.weapons.init(this.scene);
    WW2.hud.init();

    // Initialize sound on first user interaction
    this.soundInitialized = false;
    const initSound = () => {
      if (!this.soundInitialized) {
        WW2.sound.init();
        this.soundInitialized = true;
      }
    };
    document.addEventListener('click', initSound, { once: false });

    // --- Create Player ---
    console.log('Creating player aircraft...');
    this.player = WW2.aircraft.createAircraft('spitfire', 'ally');
    this.player.mesh.position.set(0, 500, 0);
    this.player.angle = 0;
    this.scene.add(this.player.mesh);

    // Initialize camera
    WW2.camera.initCamera(this.camera, this.player);

    // --- Create Allies ---
    console.log('Creating ally squad...');
    for (let i = 0; i < 3; i++) {
      const types = ['spitfire', 'mustang', 'spitfire'];
      const ally = WW2.aircraft.createAircraft(types[i], 'ally');
      ally.mesh.position.set(
        Math.cos(i * 2.1) * 100,
        450 + i * 50,
        Math.sin(i * 2.1) * 100
      );
      ally.angle = i * 2.1;
      ally.state = 'patrol';
      this.scene.add(ally.mesh);
      this.allies.push(ally);
    }

    // --- Create Enemies ---
    console.log('Creating enemy fighters...');
    for (let i = 0; i < 8; i++) {
      const isZero = i % 2 === 0;
      const enemy = WW2.aircraft.createAircraft(
        isZero ? 'zero' : 'spitfire',
        'axis'
      );
      const angle = (i / 8) * Math.PI * 2;
      const dist = 1500 + Math.random() * 2000;
      enemy.mesh.position.set(
        Math.cos(angle) * dist,
        600 + Math.random() * 600,
        Math.sin(angle) * dist
      );
      enemy.angle = angle + Math.PI;
      enemy.state = 'patrol';
      this.scene.add(enemy.mesh);
      this.enemies.push(enemy);
    }

    // --- Controls Overlay ---
    this.setupControlsOverlay();

    // --- Start Game Loop ---
    this.running = true;
    this.animate();

    console.log('=== WW2 DOGCOM SIMULATOR LOADED ===');
    console.log('Player: Spitfire Mk.V | Allies: 3 | Enemies: 8');
  }

  setupControlsOverlay() {
    const div = document.createElement('div');
    div.id = 'controls';
    div.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);' +
      'background:rgba(0,0,0,0.7);color:#00ff88;padding:15px 25px;border-radius:8px;' +
      'font-family:monospace;font-size:13px;z-index:200;text-align:center;pointer-events:auto;' +
      'transition:opacity 2s;cursor:pointer;line-height:1.6;';
    div.innerHTML = '<div style="font-size:16px;font-weight:bold;margin-bottom:5px;">CONTROLS</div>' +
      '<div>W/S - Pitch | A/D - Roll | Q/E - Yaw</div>' +
      '<div>Shift - Throttle Up | Ctrl - Slow | Space / LMB - Fire</div>' +
      '<div>C - Camera Mode | R - Restart</div>' +
      '<div style="margin-top:5px;opacity:0.6;font-size:11px;">Click game to lock mouse</div>';
    div.onclick = () => { div.style.opacity = '0'; setTimeout(() => div.remove(), 2000); };
    document.body.appendChild(div);
  }

  handleInput() {
    const input = WW2.input.getInputState();

    if (input.rawKeys['KeyC']) {
      this.cameraMode = (this.cameraMode + 1) % this.cameraModes.length;
      WW2.camera.setMode(this.cameraModes[this.cameraMode]);
      input.rawKeys['KeyC'] = false;
    }

    if (input.rawKeys['KeyR']) {
      input.rawKeys['KeyR'] = false;
      location.reload();
    }

    return input;
  }

  updatePlayer(dt, input) {
    if (!this.player.isAlive) return;

    WW2.physics.updateAircraft(this.player, dt, input, this.terrain);

    const rpm = this.player.speed / this.player.stats.maxSpeed;
    WW2.sound.engineSetRPM('player', rpm);

    if (input.firing) {
      const allTargets = this.enemies.concat(this.allies);
      WW2.weapons.fire(this.player, allTargets, this.gameTime);
    }

    if (this.player.mesh.position.y > 2000 && Math.random() < 0.3) {
      const pos = this.player.mesh.position.clone();
      pos.y -= 1; pos.z -= 3;
      WW2.particles.contrail(pos, this.scene);
    }
  }

  updateAllies(dt) {
    for (let idx = 0; idx < this.allies.length; idx++) {
      const ally = this.allies[idx];
      if (!ally.isAlive) continue;

      const formationPos = new THREE.Vector3(
        this.player.mesh.position.x + Math.cos(this.gameTime + idx * 2.1) * 80,
        this.player.mesh.position.y + 30,
        this.player.mesh.position.z + Math.sin(this.gameTime + idx * 2.1) * 80
      );

      const dir = new THREE.Vector3().subVectors(formationPos, ally.mesh.position).normalize();
      const desiredAngle = Math.atan2(dir.x, dir.z);
      let diff = desiredAngle - ally.angle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;

      const input = {
        pitch: (formationPos.y - ally.mesh.position.y) * 0.005,
        roll: Math.max(-1, Math.min(1, diff * 2)),
        yaw: 0,
        throttle: 0.6,
        firing: false
      };

      for (const enemy of this.enemies) {
        if (enemy.isAlive) {
          const d = ally.mesh.position.distanceTo(enemy.mesh.position);
          if (d < 200) { input.firing = true; break; }
        }
      }

      WW2.physics.updateAircraft(ally, dt, input, this.terrain);

      const engineId = 'ally_' + idx;
      const engineNodes = WW2.sound.getEngineNodes ? WW2.sound.getEngineNodes() : {};
      if (!engineNodes[engineId]) WW2.sound.engineStart(engineId);
      WW2.sound.engineSetRPM(engineId, ally.speed / ally.stats.maxSpeed);
    }
  }

  updateEnemies(dt) {
    for (let idx = 0; idx < this.enemies.length; idx++) {
      const enemy = this.enemies[idx];
      if (!enemy.isAlive) continue;

      WW2.ai.updateEnemy(enemy, dt, this.player, this.enemies, this.terrain);

      if (enemy.state === 'engage' || enemy.state === 'search') {
        const allTargets = [this.player].concat(this.allies);
        for (const target of allTargets) {
          if (target.isAlive && target.team !== enemy.team) {
            const d = enemy.mesh.position.distanceTo(target.mesh.position);
            if (d < 250) {
              const dir = new THREE.Vector3().subVectors(target.mesh.position, enemy.mesh.position).normalize();
              const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), enemy.angle);
              if (forward.dot(dir) > 0.5) {
                WW2.weapons.fire(enemy, allTargets, this.gameTime);
                const engineId = 'enemy_' + idx;
                const engineNodes = WW2.sound.getEngineNodes ? WW2.sound.getEngineNodes() : {};
                if (!engineNodes[engineId]) WW2.sound.engineStart(engineId);
                break;
              }
            }
          }
        }
      }

      const distToPlayer = enemy.mesh.position.distanceTo(this.player.mesh.position);
      if (distToPlayer < 2000) {
        const rpm = enemy.speed / enemy.stats.maxSpeed;
        const engineId = 'enemy_' + idx;
        const engineNodes = WW2.sound.getEngineNodes ? WW2.sound.getEngineNodes() : {};
        if (!engineNodes[engineId]) WW2.sound.engineStart(engineId);
        WW2.sound.engineSetRPM(engineId, rpm);
      }
    }
  }

  checkRespawn() {
    for (let i = 0; i < this.enemies.length; i++) {
      const enemy = this.enemies[i];
      if (!enemy.isAlive) {
        if (!enemy.respawnTime) enemy.respawnTime = this.gameTime + 15;
        if (this.gameTime >= enemy.respawnTime) {
          enemy.isAlive = true;
          enemy.health = enemy.stats.health;
          enemy.state = 'patrol';
          enemy.target = null;
          const angle = Math.random() * Math.PI * 2;
          const dist = 2500 + Math.random() * 1500;
          enemy.mesh.position.set(
            this.player.mesh.position.x + Math.cos(angle) * dist,
            700 + Math.random() * 400,
            this.player.mesh.position.z + Math.sin(angle) * dist
          );
          enemy.mesh.visible = true;
          WW2.sound.engineStart('enemy_' + i);
          enemy.respawnTime = null;
        }
      }
    }
  }

  checkPlayerDeath() {
    if (this.player.isAlive && this.player.health <= 0) {
      this.player.isAlive = false;
      WW2.sound.explosion(30);
      WW2.particles.explosion(this.player.mesh.position, this.scene);
      WW2.sound.engineStop('player');
      this.showGameOver();
    }
  }

  showGameOver() {
    const div = document.createElement('div');
    div.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;' +
      'background:rgba(0,0,0,0.8);display:flex;flex-direction:column;' +
      'align-items:center;justify-content:center;z-index:300;color:#ff4444;' +
      'font-family:monospace;';
    div.innerHTML = '<div style="font-size:64px;margin-bottom:20px;">MISSION FAILED</div>' +
      '<div style="font-size:24px;color:#fff;margin-bottom:10px;">Your Spitfire has been shot down.</div>' +
      '<div style="font-size:20px;color:#00ff88;">Press R to restart</div>';
    document.body.appendChild(div);
  }

  update(dt) {
    this.gameTime += dt;
    const input = this.handleInput();
    this.updatePlayer(dt, input);
    this.updateAllies(dt);
    this.updateEnemies(dt);

    const allAircraft = [this.player].concat(this.allies).concat(this.enemies);
    WW2.weapons.update(dt, this.scene, allAircraft);
    WW2.particles.update(dt);
    WW2.camera.update(this.camera, this.player, dt);

    const allEnemies = this.enemies.filter(function(e) { return e.isAlive; });
    WW2.hud.update(this.player, allEnemies, this.terrain);

    this.checkPlayerDeath();
    this.checkRespawn();

    if (this.terrain && this.terrain.water) {
      this.terrain.water.position.y = this.terrain.seaLevel + Math.sin(this.gameTime * 0.5) * 2;
    }
  }

  render() {
    this.renderer.render(this.scene, this.camera);
    WW2.weapons.render(this.scene);
  }

  animate() {
    if (!this.running) return;
    const self = this;
    requestAnimationFrame(function() { self.animate(); });
    const dt = Math.min(this.clock.getDelta(), 0.05);
    this.update(dt);
    this.render();
  }
}

// Wait for Three.js to load, then start
function waitForThree() {
  if (typeof THREE !== 'undefined') {
    const game = new WW2Game();
    game.init();
    window.WW2Game = game;
  } else {
    setTimeout(waitForThree, 50);
  }
}

window.addEventListener('load', waitForThree);
