import { Scene } from './Scene.js';
import { Bird } from './Bird.js';
import { PipeManager } from './PipeManager.js';
import { Game } from './Game.js';
import { PostProcessing } from './PostProcessing.js';
import { Particles } from './Particles.js';
import { UI } from './UI.js';
import * as THREE from 'three';

// WebGL error boundary
function checkWebGL() {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) {
    document.getElementById('canvas-container').innerHTML =
      '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#ff4444;font-size:24px;text-align:center;padding:20px;">WebGL is not supported in this browser. Please use a modern browser.</div>';
    return false;
  }
  return true;
}

async function main() {
  if (!checkWebGL()) return;

  const container = document.getElementById('canvas-container');
  const ui = new UI();

  try {
    // Initialize subsystems
    const scene = new Scene(container);
    const bird = new Bird(scene);
    const pipes = new PipeManager(scene);
    const game = new Game();
    const particles = new Particles(scene);
    particles.init();

    let composer;
    try {
      composer = new PostProcessing(scene.renderer, scene.width, scene.height);
      composer.enable();
    } catch (e) {
      console.warn('Post-processing not available, falling back to standard render');
      composer = null;
    }

    // Input handling
    function handleInput(e) {
      if (e.type === 'keydown' && e.code !== 'Space' && e.code !== 'ArrowUp') return;
      e.preventDefault();

      if (game.state === 'idle') {
        ui.showStartScreen();
        return;
      }
      if (game.state === 'playing') {
        bird.jump();
        particles.emit('jump', bird.position, 8, 1, 0.5);
      }
    }

    document.addEventListener('keydown', handleInput);
    document.addEventListener('mousedown', handleInput);
    document.addEventListener('touchstart', (e) => { e.preventDefault(); handleInput(e); }, { passive: false });

    // Game loop with fixed timestep
    const FIXED_DT = 1 / 60;
    let accumulator = 0;

    function gameLoop(timestamp) {
      const realDt = Math.min(scene.clock.getDelta(), 0.05); // cap to prevent spiral
      accumulator += realDt;

      // Update game logic at fixed timestep
      let steps = 0;
      while (accumulator >= FIXED_DT && steps < 8) {
        accumulator -= FIXED_DT;

        bird.update(FIXED_DT);
        pipes.update(FIXED_DT);
        game.update(FIXED_DT);

        // Score check
        if (game.state === 'playing') {
          if (pipes.checkScoring(bird.position.x)) {
            game.addScore();
            ui.updateScore(game.getScore());
            particles.emit('score', new THREE.Vector3(0, bird.positionY, 0), 12, 3, 1.5);
          }
          pipes.setDifficulty(game.getScore());

          // Collision check (10% tightened)
          const birdBox = bird.boundingBox;
          // Shrink box slightly
          const s = 0.9;
          const shrunkBox = {
            minX: birdBox.minX * s, maxX: birdBox.maxX * s,
            minY: birdBox.minY * s + (birdBox.maxY - birdBox.minY) * 0.05,
            maxY: birdBox.maxY * s - (birdBox.maxY - birdBox.minY) * 0.05,
            minZ: birdBox.minZ * s, maxZ: birdBox.maxZ * s
          };

          if (pipes.checkCollision(shrunkBox)) {
            game.die();
            particles.emit('collision', bird.position, 30, 4, 2);
            setTimeout(() => particles.emit('death', bird.position, 50, 6, 2), 100);

            // Fade bloom for game over
            if (composer) composer.setBloomIntensity(0.2);

            setTimeout(() => {
              ui.showGameOver(game.getScore());
              game.saveHighScore(game.getScore());
            }, 800);
          }

          // Check wall collision
          if (bird.positionY >= 7.5 || bird.positionY <= -2.8) {
            game.die();
            particles.emit('death', bird.position, 40, 5, 2);
            if (composer) composer.setBloomIntensity(0.2);
            setTimeout(() => {
              ui.showGameOver(game.getScore());
              game.saveHighScore(game.getScore());
            }, 800);
          }
        }

        // Update particles
        particles.update(FIXED_DT);
      }

      // Render
      if (composer) {
        scene.camera.position.x = Math.sin(timestamp * 0.0003) * 0.3;
        composer.update();
      } else {
        scene.renderer.render(scene.scene, scene.camera);
      }

      // Particle update outside fixed timestep for smooth animation
      particles.update(realDt);

      requestAnimationFrame(gameLoop);
    }

    // Start button
    ui.btnPlay.addEventListener('click', () => {
      if (game.state === 'idle') {
        game.start();
        ui.showGameHUD();
      }
    });

    // Restart button
    ui.btnRestart.addEventListener('click', () => {
      bird.reset();
      pipes.clear();
      particles.clear();
      game.reset();
      if (composer) composer.setBloomIntensity(0.8);
      ui.updateScore(0);
      ui.showStartScreen();
    });

    // Start game loop
    requestAnimationFrame(gameLoop);

    // Hide loading screen
    setTimeout(() => ui.hideLoading(), 500);

    // Store references for cleanup
    window._flappyCleanup = () => {
      document.removeEventListener('keydown', handleInput);
      document.removeEventListener('mousedown', handleInput);
      document.removeEventListener('touchstart', handleInput);
      bird.destroy();
      pipes.clear();
      particles.dispose();
      scene.dispose();
      if (composer) composer.composer.dispose();
    };

  } catch (err) {
    console.error('Failed to initialize 3D Flappy Bird:', err);
    container.innerHTML = `<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#ff4444;font-size:20px;text-align:center;padding:20px;">Failed to initialize: ${err.message}</div>`;
  }
}

main().catch(err => {
  console.error('Main error:', err);
  document.getElementById('canvas-container').innerHTML =
    '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#ff4444;font-size:20px;text-align:center;padding:20px;">Initialization failed.</div>';
});
