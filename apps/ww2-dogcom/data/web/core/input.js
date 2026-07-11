// input.js - Keyboard + mouse input handling
// Exports: WW2.input.init() → returns input state object

WW2 = window.WW2 || {};

WW2.input = (function() {
  const keys = {};
  const mouse = { x: 0, y: 0, dx: 0, dy: 0, buttons: 0, locked: false };

  function init() {
    // Keyboard
    document.addEventListener('keydown', (e) => {
      keys[e.code] = true;
      // Prevent scrolling with game keys
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyS', 'KeyA', 'KeyD'].includes(e.code)) {
        e.preventDefault();
      }
    });
    document.addEventListener('keyup', (e) => {
      keys[e.code] = false;
    });

    // Mouse movement
    document.addEventListener('mousemove', (e) => {
      if (mouse.locked) {
        mouse.dx += e.movementX || 0;
        mouse.dy += e.movementY || 0;
      }
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });

    // Mouse buttons
    document.addEventListener('mousedown', (e) => {
      mouse.buttons |= (1 << e.button);
    });
    document.addEventListener('mouseup', (e) => {
      mouse.buttons &= ~(1 << e.button);
    });

    // Pointer lock
    document.addEventListener('click', () => {
      if (!mouse.locked) {
        document.body.requestPointerLock();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      mouse.locked = document.pointerLockElement === document.body;
    });

    // Prevent context menu
    document.addEventListener('contextmenu', (e) => e.preventDefault());

    return getInputState;
  }

  function getInputState() {
    const pitch = 0, roll = 0, yaw = 0;

    // Keyboard pitch/roll/yaw
    let kbPitch = 0, kbRoll = 0, kbYaw = 0;
    if (keys['KeyW'] || keys['ArrowUp']) kbPitch = -1;
    if (keys['KeyS'] || keys['ArrowDown']) kbPitch = 1;
    if (keys['KeyA'] || keys['ArrowLeft']) kbRoll = -1;
    if (keys['KeyD'] || keys['ArrowRight']) kbRoll = 1;
    if (keys['KeyQ']) kbYaw = -1;
    if (keys['KeyE']) kbYaw = 1;

    // Mouse pitch/roll (when locked)
    let mPitch = 0, mRoll = 0, mYaw = 0;
    if (mouse.locked) {
      mPitch = Math.max(-1, Math.min(1, mouse.dy * 0.005));
      mRoll = Math.max(-1, Math.min(1, mouse.dx * 0.005));
    }

    const throttle = (keys['ShiftLeft'] || keys['ShiftRight']) ? 1 :
                    (keys['ControlLeft'] || keys['ControlRight']) ? 0.3 : 0.5;

    const firing = (mouse.buttons & 1) || keys['Space'];

    // Reset mouse deltas
    mouse.dx = 0;
    mouse.dy = 0;

    return {
      pitch: Math.max(-1, Math.min(1, kbPitch + mPitch)),
      roll: Math.max(-1, Math.min(1, kbRoll + mRoll)),
      yaw: Math.max(-1, Math.min(1, kbYaw + mYaw)),
      throttle: throttle,
      firing: firing,
      rawKeys: keys,
      mouse: { ...mouse }
    };
  }

  return { init, getInputState };
})();
