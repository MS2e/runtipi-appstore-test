// aircraft.js - Procedural WW2 aircraft models
// Exports: WW2.aircraft.createAircraft(type, color, team)

WW2 = window.WW2 || {};

WW2.aircraft = (function() {
  const TYPES = {
    spifire: {
      name: 'Spitfire Mk.V',
      wingspan: 11.23,
      length: 9.7,
      maxSpeed: 195,    // m/s (~680 km/h)
      climbRate: 18,     // m/s
      turnRate: 0.04,    // rad/s
      engine: 'Merlin XX',
      topSpeed: 540,     // km/h for display
      health: 100,
      gunRate: 0.1,      // seconds between bursts
      gunCount: 8,       // 8x7.7mm Browning
      gunDamage: 8,
      detectionRange: 800,
    },
    zero: {
      name: 'Zero A6M5',
      wingspan: 11.38,
      length: 9.7,
      maxSpeed: 175,
      climbRate: 14,
      turnRate: 0.055,
      engine: 'Mitsubishi Kinsei',
      topSpeed: 510,
      health: 90,
      gunRate: 0.15,
      gunCount: 6,
      gunDamage: 7,
      detectionRange: 700,
    },
    mustang: {
      name: 'P-51 Mustang',
      wingspan: 11.1,
      length: 9.83,
      maxSpeed: 200,
      climbRate: 16,
      turnRate: 0.035,
      engine: 'V-1710',
      topSpeed: 700,
      health: 120,
      gunRate: 0.08,
      gunCount: 12,
      gunDamage: 6,
      detectionRange: 900,
    },
  };

  function createSpitfireMesh(color = 0x2E4B3E) {
    const group = new THREE.Group();

    // Fuselage - main body (teardrop shape)
    const fuselageGeo = new THREE.CylinderGeometry(0.35, 0.25, 7, 8, 1);
    fuselageGeo.rotateX(Math.PI / 2);
    const fuselageMat = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.5,
      metalness: 0.3
    });
    const fuselage = new THREE.Mesh(fuselageGeo, fuselageMat);
    group.add(fuselage);

    // Nose cone
    const noseGeo = new THREE.ConeGeometry(0.35, 2, 8);
    noseGeo.rotateX(-Math.PI / 2);
    const nose = new THREE.Mesh(noseGeo, fuselageMat);
    nose.position.z = 4.5;
    group.add(nose);

    // Cockpit canopy
    const cockpitGeo = new THREE.SphereGeometry(0.35, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2);
    const cockpitMat = new THREE.MeshStandardMaterial({
      color: 0x88bbee,
      transparent: true,
      opacity: 0.5,
      roughness: 0.05,
      metalness: 0.9
    });
    const cockpit = new THREE.Mesh(cockpitGeo, cockpitMat);
    cockpit.position.y = 0.3;
    cockpit.position.z = 0.5;
    group.add(cockpit);

    // Main wings (elliptical - Spitfire signature)
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0);
    // Elliptical wing profile
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      const x = t * 5.5;
      const y = 0.08 * Math.sqrt(1 - t * t);
      wingShape.lineTo(x, y);
    }
    for (let i = 20; i >= 0; i--) {
      const t = i / 20;
      const x = t * 5.5;
      const y = -0.04 * Math.sqrt(1 - t * t);
      wingShape.lineTo(x, y);
    }

    const wingExtrudeSettings = { depth: 0.05, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01 };
    const wingGeo = new THREE.ExtrudeGeometry(wingShape, wingExtrudeSettings);

    // Right wing
    const wingMat = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.5,
      metalness: 0.3
    });
    const rightWing = new THREE.Mesh(wingGeo, wingMat);
    rightWing.position.set(0, -0.05, 0.5);
    group.add(rightWing);

    // Left wing (mirrored)
    const leftWing = new THREE.Mesh(wingGeo, wingMat);
    leftWing.position.set(0, -0.05, 0.5);
    leftWing.scale.x = -1;
    group.add(leftWing);

    // Horizontal stabilizer (tail wings)
    const tailWingGeo = new THREE.BoxGeometry(4, 0.04, 0.8);
    const tailWingMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.5, metalness: 0.3 });
    const tailWing = new THREE.Mesh(tailWingGeo, tailWingMat);
    tailWing.position.z = -3.5;
    group.add(tailWing);

    // Vertical stabilizer (rudder)
    const vStabGeo = new THREE.BoxGeometry(0.04, 1.2, 1.0);
    const vStab = new THREE.Mesh(vStabGeo, tailWingMat);
    vStab.position.set(0, 0.6, -3.5);
    group.add(vStab);

    // Propeller hub
    const hubGeo = new THREE.SphereGeometry(0.15, 8, 8);
    const hubMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.2, metalness: 0.8 });
    const hub = new THREE.Mesh(hubGeo, hubMat);
    hub.position.z = 5.5;
    group.add(hub);

    // Propeller blades (will rotate)
    const propGroup = new THREE.Group();
    propGroup.position.z = 5.5;
    for (let i = 0; i < 4; i++) {
      const bladeGeo = new THREE.BoxGeometry(0.12, 2.4, 0.03);
      const blade = new THREE.Mesh(bladeGeo, hubMat);
      blade.rotation.z = (i * Math.PI) / 2;
      propGroup.add(blade);
    }
    group.add(propGroup);

    // RAF Roundels (simple circles on wings)
    const roundelGeo = new THREE.CircleGeometry(0.4, 16);
    const roundelCanvas = document.createElement('canvas');
    roundelCanvas.width = 64;
    roundelCanvas.height = 64;
    const ctx = roundelCanvas.getContext('2d');
    // Outer red
    ctx.fillStyle = '#CC0000';
    ctx.beginPath(); ctx.arc(32, 32, 30, 0, Math.PI * 2); ctx.fill();
    // White middle
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath(); ctx.arc(32, 32, 20, 0, Math.PI * 2); ctx.fill();
    // Red center
    ctx.fillStyle = '#CC0000';
    ctx.beginPath(); ctx.arc(32, 32, 10, 0, Math.PI * 2); ctx.fill();
    const roundelTex = new THREE.CanvasTexture(roundelCanvas);
    const roundelMat = new THREE.MeshBasicMaterial({ map: roundelTex, transparent: true, side: THREE.DoubleSide });

    const roundelR = new THREE.Mesh(roundelGeo, roundelMat);
    roundelR.position.set(3.5, 0.01, 1.5);
    roundelR.rotation.x = -Math.PI / 2;
    group.add(roundelR);

    const roundelL = new THREE.Mesh(roundelGeo, roundelMat);
    roundelL.position.set(-3.5, 0.01, 1.5);
    roundelL.rotation.x = -Math.PI / 2;
    group.add(roundelL);

    group.propeller = propGroup;
    group.userData.type = 'spitfire';
    return group;
  }

  function createZeroMesh(color = 0x1A5C1A) {
    const group = new THREE.Group();

    // Zero has a thicker fuselage
    const fuselageGeo = new THREE.CylinderGeometry(0.42, 0.30, 7.5, 8, 1);
    fuselageGeo.rotateX(Math.PI / 2);
    const fuselageMat = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.55,
      metalness: 0.25
    });
    const fuselage = new THREE.Mesh(fuselageGeo, fuselageMat);
    group.add(fuselage);

    // Nose
    const noseGeo = new THREE.ConeGeometry(0.42, 1.8, 8);
    noseGeo.rotateX(-Math.PI / 2);
    const nose = new THREE.Mesh(noseGeo, fuselageMat);
    nose.position.z = 4.65;
    group.add(nose);

    // Cockpit
    const cockpitGeo = new THREE.SphereGeometry(0.38, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2);
    const cockpitMat = new THREE.MeshStandardMaterial({
      color: 0x77aacc, transparent: true, opacity: 0.45, roughness: 0.05, metalness: 0.9
    });
    const cockpit = new THREE.Mesh(cockpitGeo, cockpitMat);
    cockpit.position.y = 0.35;
    cockpit.position.z = 0.8;
    group.add(cockpit);

    // Zero wings (straighter, less elliptical)
    const wingGeo = new THREE.BoxGeometry(5.5, 0.08, 1.5);
    const wingMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.55, metalness: 0.25 });
    const rightWing = new THREE.Mesh(wingGeo, wingMat);
    rightWing.position.set(2.75, 0, 0.5);
    group.add(rightWing);
    const leftWing = new THREE.Mesh(wingGeo, wingMat);
    leftWing.position.set(-2.75, 0, 0.5);
    group.add(leftWing);

    // Tail
    const tailWingGeo = new THREE.BoxGeometry(3.5, 0.05, 0.8);
    const tailWing = new THREE.Mesh(tailWingGeo, wingMat);
    tailWing.position.z = -3.7;
    group.add(tailWing);

    const vStabGeo = new THREE.BoxGeometry(0.05, 1.1, 1.0);
    const vStab = new THREE.Mesh(vStabGeo, wingMat);
    vStab.position.set(0, 0.55, -3.7);
    group.add(vStab);

    // Propeller (3-blade)
    const hubGeo = new THREE.SphereGeometry(0.18, 8, 8);
    const hubMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.2, metalness: 0.8 });
    const hub = new THREE.Mesh(hubGeo, hubMat);
    hub.position.z = 4.65;
    group.add(hub);

    const propGroup = new THREE.Group();
    propGroup.position.z = 4.65;
    for (let i = 0; i < 3; i++) {
      const bladeGeo = new THREE.BoxGeometry(0.15, 2.2, 0.03);
      const blade = new THREE.Mesh(bladeGeo, hubMat);
      blade.rotation.z = (i * Math.PI * 2) / 3;
      propGroup.add(blade);
    }
    group.add(propGroup);

    // Hinomaru (red circle) on wings
    const circleGeo = new THREE.CircleGeometry(0.45, 16);
    const circleCanvas = document.createElement('canvas');
    circleCanvas.width = 64; circleCanvas.height = 64;
    const cCtx = circleCanvas.getContext('2d');
    cCtx.fillStyle = '#FFFFFF';
    cCtx.fillRect(0, 0, 64, 64);
    cCtx.fillStyle = '#CC0000';
    cCtx.beginPath(); cCtx.arc(32, 32, 18, 0, Math.PI * 2); cCtx.fill();
    const circleTex = new THREE.CanvasTexture(circleCanvas);
    const circleMat = new THREE.MeshBasicMaterial({ map: circleTex, transparent: true, side: THREE.DoubleSide });

    const markR = new THREE.Mesh(circleGeo, circleMat);
    markR.position.set(3.5, 0.05, 0.5);
    markR.rotation.x = -Math.PI / 2;
    group.add(markR);
    const markL = new THREE.Mesh(circleGeo, circleMat);
    markL.position.set(-3.5, 0.05, 0.5);
    markL.rotation.x = -Math.PI / 2;
    group.add(markL);

    group.propeller = propGroup;
    group.userData.type = 'zero';
    return group;
  }

  function createMustangMesh(color = 0x2D4A2D) {
    const group = new THREE.Group();

    // Slender fuselage
    const fuselageGeo = new THREE.CylinderGeometry(0.36, 0.24, 8, 8, 1);
    fuselageGeo.rotateX(Math.PI / 2);
    const fuselageMat = new THREE.MeshStandardMaterial({
      color: color, roughness: 0.45, metalness: 0.35
    });
    const fuselage = new THREE.Mesh(fuselageGeo, fuselageMat);
    group.add(fuselage);

    // Distinctive Mustang nose (radiators, longer)
    const noseGeo = new THREE.ConeGeometry(0.36, 2.5, 8);
    noseGeo.rotateX(-Math.PI / 2);
    const nose = new THREE.Mesh(noseGeo, fuselageMat);
    nose.position.z = 5.2;
    group.add(nose);

    // Canopy - the distinctive "greenhouse" bubble
    const canopyGeo = new THREE.SphereGeometry(0.45, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.7);
    const canopyMat = new THREE.MeshStandardMaterial({
      color: 0x99ccdd, transparent: true, opacity: 0.4, roughness: 0.0, metalness: 0.9
    });
    const canopy = new THREE.Mesh(canopyGeo, canopyMat);
    canopy.position.y = 0.35;
    canopy.position.z = 0.5;
    group.add(canopy);

    // Wings (straight leading edge, Mustang style)
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0);
    wingShape.lineTo(5.5, 0.08);
    wingShape.lineTo(5.8, -0.04);
    wingShape.lineTo(0, -0.04);
    const wingExtrude = { depth: 0.06, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008 };
    const wingGeo = new THREE.ExtrudeGeometry(wingShape, wingExtrude);
    const wingMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.45, metalness: 0.35 });

    const rightWing = new THREE.Mesh(wingGeo, wingMat);
    rightWing.position.set(0, -0.05, 0.8);
    group.add(rightWing);
    const leftWing = new THREE.Mesh(wingGeo, wingMat);
    leftWing.position.set(0, -0.05, 0.8);
    leftWing.scale.x = -1;
    group.add(leftWing);

    // Tail (Mustang has distinctive tail)
    const tailWing = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.05, 0.9), wingMat);
    tailWing.position.z = -3.8;
    group.add(tailWing);

    const vStab = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.3, 1.2), wingMat);
    vStab.position.set(0, 0.65, -3.8);
    group.add(vStab);

    // Double-bubble vertical stabilizer (Mustang signature)
    const vStab2 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.4, 0.8), wingMat);
    vStab2.position.set(0, 1.35, -3.8);
    group.add(vStab2);

    // 3-blade propeller
    const hubMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.2, metalness: 0.8 });
    const hub = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), hubMat);
    hub.position.z = 6.0;
    group.add(hub);

    const propGroup = new THREE.Group();
    propGroup.position.z = 6.0;
    for (let i = 0; i < 3; i++) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.6, 0.03), hubMat);
      blade.rotation.z = (i * Math.PI * 2) / 3;
      propGroup.add(blade);
    }
    group.add(propGroup);

    // US Star roundel
    const starCanvas = document.createElement('canvas');
    starCanvas.width = 64; starCanvas.height = 64;
    const sCtx = starCanvas.getContext('2d');
    // Blue circle
    sCtx.fillStyle = '#3366CC';
    sCtx.beginPath(); sCtx.arc(32, 32, 22, 0, Math.PI * 2); sCtx.fill();
    // White bar
    sCtx.fillStyle = '#FFFFFF';
    sCtx.fillRect(8, 28, 48, 8);
    const starTex = new THREE.CanvasTexture(starCanvas);
    const starMat = new THREE.MeshBasicMaterial({ map: starTex, transparent: true, side: THREE.DoubleSide });

    const starGeo = new THREE.CircleGeometry(0.5, 16);
    const starR = new THREE.Mesh(starGeo, starMat);
    starR.position.set(3.5, 0.05, 0.8);
    starR.rotation.x = -Math.PI / 2;
    group.add(starR);
    const starL = new THREE.Mesh(starGeo, starMat);
    starL.position.set(-3.5, 0.05, 0.8);
    starL.rotation.x = -Math.PI / 2;
    group.add(starL);

    group.propeller = propGroup;
    group.userData.type = 'mustang';
    return group;
  }

  function createAircraft(type, team) {
    const stats = TYPES[type] || TYPES.spitfire;

    let mesh;
    if (type === 'zero') {
      const color = team === 'ally' ? 0x4A7A4A : 0x1A5C1A;
      mesh = createZeroMesh(color);
    } else if (type === 'mustang') {
      const color = team === 'axis' ? 0x6A6A6A : 0x2D4A2D;
      mesh = createMustangMesh(color);
    } else {
      const color = team === 'ally' ? 0x2E4B3E : 0x4A5A4A;
      mesh = createSpitfireMesh(color);
    }

    // Scale down for the game world
    mesh.scale.set(0.5, 0.5, 0.5);

    return {
      mesh,
      stats: { ...stats },
      team: team, // 'ally' or 'axis'
      health: stats.health,
      maxHealth: stats.health,
      velocity: new THREE.Vector3(),
      speed: 0,
      angle: 0,        // Yaw
      pitch: 0,        // Pitch
      roll: 0,         // Roll
      fuel: 100,
      isAlive: true,
      state: 'patrol',  // patrol, engage, evade, flee
      target: null,
      lastShot: 0,
    };
  }

  return { createAircraft, TYPES };
})();
