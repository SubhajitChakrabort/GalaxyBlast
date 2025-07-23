// --- Game Setup ---
const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const startScreen = document.getElementById("start-screen");
const victoryScreen = document.getElementById("victory-screen");
const startBtn = document.getElementById("start-btn");
const restartBtn = document.getElementById("restart-btn");
const bgMusic = document.getElementById("bg-music");
const backgroundSong = document.getElementById("background-song");

let gameWidth, gameHeight;
let spaceship,
  aliens,
  bullets,
  explosions,
  score,
  gameActive,
  alienTimer,
  alienInterval;
let screenShake = 0;
let flashAlpha = 0;
let slowMotion = 0;
let slowMotionFactor = 1;
let finalBossDefeated = false;
const finalBossExplosionSound = new Audio("final_boss_explosion.mp3");
// Add bullet sound

// --- Load Images ---
const spaceshipImg = new Image();
spaceshipImg.src = "spaceship.png";
const asteroidImg = new Image();
asteroidImg.src = "meteor 1.png";
const bossMeteorImg = new Image();
bossMeteorImg.src = "meteor2.png";
const finalBossImg = new Image();
finalBossImg.src = "Final Boss.png";

// --- Resize Canvas ---
function resizeCanvas() {
  gameWidth = window.innerWidth;
  gameHeight = window.innerHeight;
  canvas.width = gameWidth;
  canvas.height = gameHeight;
}
window.addEventListener("resize", resizeCanvas);

// --- UI Screens ---
function showStartScreen() {
  startScreen.style.display = "flex";
  victoryScreen.style.display = "none";
  scoreEl.style.display = "none";
  canvas.style.display = "none";
}
function showGame() {
  startScreen.style.display = "none";
  victoryScreen.style.display = "none";
  scoreEl.style.display = "block";
  canvas.style.display = "block";
}
function showVictory() {
  victoryScreen.style.display = "flex";
  scoreEl.style.display = "none";
  canvas.style.display = "none";
}

// --- Game Logic ---
function startGame() {
  resizeCanvas();
  spaceship = {
    x: gameWidth / 2,
    y: gameHeight - 100,
    w: 120, // increased from 80
    h: 120, // increased from 80
    speed: 10,
  };
  aliens = [];
  bullets = [];
  explosions = [];
  score = 0;
  gameActive = true;
  alienTimer = 0;
  alienInterval = 60;
  finalBossDefeated = false;
  showGame();
  bgMusic.currentTime = 0;
  bgMusic.pause();
  backgroundSong.currentTime = 0;
  backgroundSong.play();
  requestAnimationFrame(gameLoop);
}
function endGame() {
  gameActive = false;
  bgMusic.pause();
  backgroundSong.pause();
  showVictory();
}

// --- Drawing Functions ---
function drawSpaceship() {
  ctx.save();
  ctx.translate(spaceship.x, spaceship.y);
  if (spaceshipImg.complete && spaceshipImg.naturalWidth > 0) {
    ctx.drawImage(
      spaceshipImg,
      -spaceship.w / 2,
      -spaceship.h / 2,
      spaceship.w,
      spaceship.h
    );
  }
  ctx.restore();
}
function drawAlien(alien) {
  ctx.save();
  ctx.translate(alien.x, alien.y);
  if (alien.isFinalBoss) {
    if (finalBossImg.complete && finalBossImg.naturalWidth > 0) {
      ctx.drawImage(
        finalBossImg,
        -alien.size * 0.8,
        -alien.size * 0.8,
        alien.size * 1.6,
        alien.size * 1.6
      );
    }
  } else if (alien.isBoss) {
    if (bossMeteorImg.complete && bossMeteorImg.naturalWidth > 0) {
      ctx.drawImage(
        bossMeteorImg,
        -alien.size * 0.8,
        -alien.size * 0.8,
        alien.size * 1.6,
        alien.size * 1.6
      );
    }
  } else {
    if (asteroidImg.complete && asteroidImg.naturalWidth > 0) {
      ctx.drawImage(
        asteroidImg,
        -alien.size * 0.8,
        -alien.size * 0.8,
        alien.size * 1.6,
        alien.size * 1.6
      );
    }
  }
  ctx.restore();
}
function drawBullet(bullet) {
  ctx.save();
  ctx.translate(bullet.x, bullet.y);
  ctx.beginPath();
  ctx.ellipse(0, 0, 8, 24, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#00eaff"; // changed to cyan
  ctx.shadowColor = "#0055ff"; // blue glow
  ctx.shadowBlur = 18;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();
}
function drawExplosion(explosion) {
  ctx.save();
  ctx.translate(explosion.x, explosion.y);
  for (let i = 0; i < 8; i++) {
    ctx.save();
    ctx.rotate(((Math.PI * 2) / 8) * i);
    ctx.beginPath();
    ctx.arc(0, explosion.radius, explosion.radius / 2, 0, Math.PI * 2);
    ctx.fillStyle = explosion.color;
    ctx.globalAlpha = explosion.alpha;
    ctx.fill();
    ctx.restore();
  }
  // Center sparkle
  ctx.beginPath();
  ctx.arc(0, 0, explosion.radius / 1.5, 0, Math.PI * 2);
  ctx.fillStyle = "#fff";
  ctx.globalAlpha = explosion.alpha * 0.7;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();
}

// --- Spawning ---
function spawnAlien() {
  // Final boss appears at score 30 and only once
  if (score >= 30 && !aliens.some((a) => a.isFinalBoss)) {
    const size = 200;
    const x = gameWidth / 2;
    const y = -100;
    const speed = 0.7; // decreased from 1.5
    const color = "#ff00ff";
    aliens.push({ x, y, size, speed, color, isFinalBoss: true, hp: 10 });
    return;
  }
  // Boss meteor appears every 10th alien
  if (score > 0 && score % 10 === 0 && !aliens.some((a) => a.isBoss)) {
    const size = 140;
    const x = size + Math.random() * (gameWidth - size * 2);
    const y = -size;
    const speed = 1.2; // decreased from 2
    const color = "#ff4444";
    aliens.push({ x, y, size, speed, color, isBoss: true, hp: 3 });
    return;
  }
  const size = 64 + Math.random() * 64;
  const x = size + Math.random() * (gameWidth - size * 2);
  const y = -size;
  const speed = 1 + Math.random() * 1.2; // decreased from 2 + Math.random() * 2
  const color = "#fff";
  aliens.push({ x, y, size, speed, color });
  // Debug: log asteroid spawn
  // console.log('Asteroid spawned at', x, y, 'size', size);
}

// Add this helper to show a CSS explosion overlay
function showBossExplosionOverlay() {
  let overlay = document.createElement("div");
  overlay.id = "boss-explosion-overlay";
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100vw";
  overlay.style.height = "100vh";
  overlay.style.pointerEvents = "none";
  overlay.style.zIndex = "1000";
  overlay.style.background =
    "radial-gradient(circle at 50% 50%, #fff 0%, #ff00ff 30%, #ff4444 60%, transparent 100%)";
  overlay.style.opacity = "0.85";
  overlay.style.transition = "opacity 0.4s cubic-bezier(0.4,0,0.2,1)";
  document.body.appendChild(overlay);
  setTimeout(() => {
    overlay.style.opacity = "0";
    setTimeout(() => overlay.remove(), 400);
  }, 500);
}

// --- Main Game Loop ---
function gameLoop() {
  if (!gameActive) return;
  // Handle slow motion
  if (slowMotion > 0) {
    slowMotion--;
    slowMotionFactor = 0.25;
  } else {
    slowMotionFactor = 1;
  }
  // Screen shake effect
  if (screenShake > 0) {
    ctx.save();
    ctx.translate(
      (Math.random() - 0.5) * screenShake,
      (Math.random() - 0.5) * screenShake
    );
    screenShake -= 1.5;
    if (screenShake < 0) screenShake = 0;
  }
  ctx.clearRect(0, 0, gameWidth, gameHeight);

  // Draw spaceship
  drawSpaceship();

  // Draw and update bullets
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.y -= b.speed * slowMotionFactor;
    drawBullet(b);
    if (b.y < -40) bullets.splice(i, 1);
  }

  // Draw and update aliens
  for (let i = aliens.length - 1; i >= 0; i--) {
    const a = aliens[i];
    a.y += a.speed * slowMotionFactor;
    drawAlien(a);
    if (a.y > gameHeight + a.size) aliens.splice(i, 1);
  }

  // Collisions (bullets vs aliens)
  for (let i = aliens.length - 1; i >= 0; i--) {
    const a = aliens[i];
    for (let j = bullets.length - 1; j >= 0; j--) {
      const b = bullets[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < a.size * 0.8) {
        if (a.isFinalBoss && !finalBossDefeated) {
          a.hp--;
          bullets.splice(j, 1);
          // Add hit effect on every hit (not just death)
          screenShake = Math.max(screenShake, 8);
          flashAlpha = Math.max(flashAlpha, 0.15);
          if (a.hp <= 0) {
            finalBossDefeated = true;
            // Same effect as meteors
            screenShake = 20;
            explosions.push({
              x: a.x,
              y: a.y,
              radius: a.size / 2,
              color: a.color,
              alpha: 1,
            });
            aliens.splice(i, 1);
            showBossExplosionOverlay(); // Show CSS explosion overlay
            // Wait 500ms so the shake and blast are visible before showing victory
            setTimeout(endGame, 500);
            return;
          }
          break; // Prevent further processing after boss is hit
        } else if (a.isBoss) {
          a.hp--;
          bullets.splice(j, 1);
          if (a.hp <= 0) {
            explosions.push({
              x: a.x,
              y: a.y,
              radius: a.size / 2,
              color: a.color,
              alpha: 1,
            });
            aliens.splice(i, 1);
            score++;
          }
        } else {
          explosions.push({
            x: a.x,
            y: a.y,
            radius: a.size / 2,
            color: a.color,
            alpha: 1,
          });
          aliens.splice(i, 1);
          bullets.splice(j, 1);
          score++;
        }
        break;
      }
    }
  }

  // Draw and update explosions
  for (let i = explosions.length - 1; i >= 0; i--) {
    const ex = explosions[i];
    ex.radius += 2 * slowMotionFactor;
    ex.alpha -= 0.04 * slowMotionFactor;
    drawExplosion(ex);
    if (ex.alpha <= 0) explosions.splice(i, 1);
  }
  // White flash effect
  if (flashAlpha > 0) {
    ctx.save();
    ctx.globalAlpha = flashAlpha;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, gameWidth, gameHeight);
    ctx.restore();
    flashAlpha -= 0.04;
    if (flashAlpha < 0) flashAlpha = 0;
  }
  if (screenShake > 0) ctx.restore();

  // Score
  scoreEl.textContent = "Score: " + score;

  // Spawn aliens
  alienTimer++;
  if (alienTimer > alienInterval) {
    spawnAlien();
    alienTimer = 0;
    // Make it a bit harder as score increases
    if (alienInterval > 20) alienInterval -= 0.5;
  }

  requestAnimationFrame(gameLoop);
}

// --- Controls ---
function moveSpaceship(x) {
  if (!spaceship) return;
  spaceship.x = Math.max(40, Math.min(gameWidth - 40, x));
}
canvas.addEventListener("pointermove", (e) => {
  if (!gameActive) return;
  let x = e.touches ? e.touches[0].clientX : e.clientX;
  moveSpaceship(x);
});
canvas.addEventListener("touchmove", (e) => {
  if (!gameActive) return;
  let x = e.touches[0].clientX;
  moveSpaceship(x);
});

function shoot() {
  if (!gameActive) return;
  bullets.push({ x: spaceship.x, y: spaceship.y - 50, speed: 12 });
  // Play bullet sound (create a new Audio object each time)
  const sfx = new Audio("bullet_sound.mp3");
  sfx.volume = 0.5; // Optional: adjust volume
  sfx.play();
}
canvas.addEventListener("pointerdown", shoot);
canvas.addEventListener("touchstart", shoot);

startBtn.onclick = startGame;
restartBtn.onclick = startGame;

showStartScreen();
resizeCanvas();
