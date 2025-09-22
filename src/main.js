import "./style.css";

// game.js
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const gameContainer = document.getElementById('game-container');
const leftBtn = document.getElementById('leftBtn');
const jumpBtn = document.getElementById('jumpBtn');
const rightBtn = document.getElementById('rightBtn');
const dialogOverlay = document.getElementById('dialog-overlay');
const dialogTitle = document.getElementById('dialog-title');
const dialogMessage = document.getElementById('dialog-message');
const nextLevelBtn = document.getElementById('nextLevelBtn');
const closeDialogBtn = document.getElementById('closeDialogBtn');

// --- Game Configuration ---
const GAME_WIDTH = 960;
const GAME_HEIGHT = 540;
const GRAVITY = 0.5;
const PLAYER_SPEED = 3;
const JUMP_STRENGTH = -10;
const TILE_SIZE = 32; // Assuming your pixel art sprites are around 32x32 or scale well to it

// --- Assets Loading ---
const assets = {};
let assetsLoaded = 0;
const totalAssets = 5; // Hero, platform, mushroom, spiky trap, glorious for end goal

function loadAsset(name, src) {
    const img = new Image();
    img.src = src;
    img.onload = () => {
        assetsLoaded++;
        if (assetsLoaded === totalAssets) {
            console.log("All assets loaded!");
            startGame();
        }
    };
    img.onerror = () => {
        console.error(`Failed to load asset: ${src}`);
        assetsLoaded++; // Still increment to avoid blocking game start indefinitely
    };
    assets[name] = img;
}

loadAsset('hero', 'img/hero.png'); // Replace with actual path to your Hero sprite
loadAsset('platform', 'img/platform_ground.png'); // Placeholder, create a simple ground tile
loadAsset('mushroom_monster', 'img/mushroom_monster.png'); // Replace with actual path
loadAsset('spiky_trap', 'img/spiky_trap.png'); // Replace with actual path
loadAsset('glorious_goal', 'img/glorious.png'); // Use Glorious as a goal marker

// --- Game State ---
let player = {
    x: 50,
    y: GAME_HEIGHT - TILE_SIZE * 2, // Start above a platform
    width: TILE_SIZE, // Assuming player sprite is roughly TILE_SIZE
    height: TILE_SIZE,
    dx: 0,
    dy: 0,
    onGround: false,
    facing: 'right'
};

let gamePaused = false;
let currentLevel = 1;
const maxLevels = 5;
let dayMode = true; // Initial mode

// Basic Level Structure (using a simple array for now)
const levels = [
    // Level 1: Simple platforming, one monster, one obstacle
    {
        platforms: [
            { x: 0, y: GAME_HEIGHT - TILE_SIZE, width: GAME_WIDTH, height: TILE_SIZE }, // Ground
            { x: 150, y: GAME_HEIGHT - TILE_SIZE * 3, width: TILE_SIZE * 3, height: TILE_SIZE },
            { x: 400, y: GAME_HEIGHT - TILE_SIZE * 4, width: TILE_SIZE * 2, height: TILE_SIZE },
        ],
        monsters: [
            { x: 200, y: GAME_HEIGHT - TILE_SIZE * 4, width: TILE_SIZE, height: TILE_SIZE, type: 'mushroom_monster', dx: 1 }
        ],
        obstacles: [
            { x: 300, y: GAME_HEIGHT - TILE_SIZE * 2, width: TILE_SIZE, height: TILE_SIZE, type: 'spiky_trap' }
        ],
        goal: { x: GAME_WIDTH - TILE_SIZE * 2, y: GAME_HEIGHT - TILE_SIZE * 2, width: TILE_SIZE, height: TILE_SIZE }
    },
    // Level 2: (Add more complex platforms, monsters, obstacles here)
    {
        platforms: [
            { x: 0, y: GAME_HEIGHT - TILE_SIZE, width: GAME_WIDTH, height: TILE_SIZE }, // Ground
            { x: 100, y: GAME_HEIGHT - TILE_SIZE * 3, width: TILE_SIZE * 2, height: TILE_SIZE },
            { x: 300, y: GAME_HEIGHT - TILE_SIZE * 5, width: TILE_SIZE * 4, height: TILE_SIZE },
            { x: 600, y: GAME_HEIGHT - TILE_SIZE * 3, width: TILE_SIZE * 3, height: TILE_SIZE },
        ],
        monsters: [
            { x: 350, y: GAME_HEIGHT - TILE_SIZE * 6, width: TILE_SIZE, height: TILE_SIZE, type: 'mushroom_monster', dx: 1 },
            { x: 650, y: GAME_HEIGHT - TILE_SIZE * 4, width: TILE_SIZE, height: TILE_SIZE, type: 'mushroom_monster', dx: -1 }
        ],
        obstacles: [
            { x: 150, y: GAME_HEIGHT - TILE_SIZE * 2, width: TILE_SIZE, height: TILE_SIZE, type: 'spiky_trap' },
            { x: 450, y: GAME_HEIGHT - TILE_SIZE * 2, width: TILE_SIZE, height: TILE_SIZE, type: 'spiky_trap' }
        ],
        goal: { x: GAME_WIDTH - TILE_SIZE * 2, y: GAME_HEIGHT - TILE_SIZE * 2, width: TILE_SIZE, height: TILE_SIZE }
    }
    // ... add 3 more levels
];

let currentLevelData = levels[currentLevel - 1];

// --- Input Handling ---
const keys = {
    left: false,
    right: false,
    jump: false
};

// Keyboard input
window.addEventListener('keydown', (e) => {
    if (gamePaused) return;
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = true;
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === ' ') keys.jump = true;
});

window.addEventListener('keyup', (e) => {
    if (gamePaused) return;
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === ' ') keys.jump = false;
});

// On-screen controls
leftBtn.addEventListener('touchstart', () => { if (!gamePaused) keys.left = true; });
leftBtn.addEventListener('touchend', () => { if (!gamePaused) keys.left = false; });
leftBtn.addEventListener('mousedown', () => { if (!gamePaused) keys.left = true; });
leftBtn.addEventListener('mouseup', () => { if (!gamePaused) keys.left = false; });
leftBtn.addEventListener('mouseleave', () => { if (!gamePaused) keys.left = false; }); // For mouse drag off button

rightBtn.addEventListener('touchstart', () => { if (!gamePaused) keys.right = true; });
rightBtn.addEventListener('touchend', () => { if (!gamePaused) keys.right = false; });
rightBtn.addEventListener('mousedown', () => { if (!gamePaused) keys.right = true; });
rightBtn.addEventListener('mouseup', () => { if (!gamePaused) keys.right = false; });
rightBtn.addEventListener('mouseleave', () => { if (!gamePaused) keys.right = false; });

jumpBtn.addEventListener('touchstart', (e) => { e.preventDefault(); if (!gamePaused) keys.jump = true; }); // prevent scrolling
jumpBtn.addEventListener('touchend', () => { if (!gamePaused) keys.jump = false; });
jumpBtn.addEventListener('mousedown', () => { if (!gamePaused) keys.jump = true; });
jumpBtn.addEventListener('mouseup', () => { if (!gamePaused) keys.jump = false; });
jumpBtn.addEventListener('mouseleave', () => { if (!gamePaused) keys.jump = false; });

// Day/Night Toggle (for demonstration)
canvas.addEventListener('dblclick', () => {
    dayMode = !dayMode;
    updateBackground();
});

function updateBackground() {
    if (dayMode) {
        canvas.style.backgroundColor = '#87CEEB'; // Day sky blue
    } else {
        canvas.style.backgroundColor = '#1a1a2e'; // Night sky dark blue
    }
}

// --- Game Loop Functions ---

function update() {
    if (gamePaused) return;

    // Apply gravity
    player.dy += GRAVITY;

    // Horizontal movement
    player.dx = 0;
    if (keys.left) {
        player.dx = -PLAYER_SPEED;
        player.facing = 'left';
    }
    if (keys.right) {
        player.dx = PLAYER_SPEED;
        player.facing = 'right';
    }

    // Jumping
    if (keys.jump && player.onGround) {
        player.dy = JUMP_STRENGTH;
        player.onGround = false;
        keys.jump = false; // Consume jump
    }

    // Update player position
    player.x += player.dx;
    player.y += player.dy;

    // Collision detection with platforms
    player.onGround = false;
    currentLevelData.platforms.forEach(platform => {
        if (checkCollision(player, platform)) {
            // Player is landing on a platform from above
            if (player.dy > 0 && player.y + player.height - player.dy <= platform.y) {
                player.y = platform.y - player.height;
                player.dy = 0;
                player.onGround = true;
            }
            // Player is hitting platform from below
            else if (player.dy < 0 && player.y >= platform.y + platform.height) {
                player.y = platform.y + platform.height;
                player.dy = 0;
            }
            // Player is moving horizontally into a platform (simple push-back)
            else if (player.dx !== 0) {
                 if (player.dx > 0 && player.x + player.width - player.dx <= platform.x) { // Colliding from left
                    player.x = platform.x - player.width;
                 } else if (player.dx < 0 && player.x >= platform.x + platform.width - player.dx) { // Colliding from right
                    player.x = platform.x + platform.width;
                 }
            }
        }
    });

    // Keep player within canvas bounds
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > GAME_WIDTH) player.x = GAME_WIDTH - player.width;
    if (player.y + player.height > GAME_HEIGHT) { // Falling off bottom, reset for now
        player.y = GAME_HEIGHT - player.height;
        player.dy = 0;
        player.onGround = true;
        // In a real game, this would be a "death" condition
    }

    // Update monsters (simple movement for now)
    currentLevelData.monsters.forEach(monster => {
        monster.x += monster.dx;
        // Simple monster boundary check
        if (monster.x <= 0 || monster.x + monster.width >= GAME_WIDTH) {
            monster.dx *= -1; // Reverse direction
        }
        // Basic player-monster collision (causes restart or damage)
        if (checkCollision(player, monster)) {
            console.log("Player hit a monster!");
            resetLevel(); // Simple restart for now
        }
    });

    // Check obstacle collision
    currentLevelData.obstacles.forEach(obstacle => {
        if (checkCollision(player, obstacle)) {
            console.log("Player hit an obstacle!");
            resetLevel(); // Simple restart for now
        }
    });

    // Check goal collision
    if (checkCollision(player, currentLevelData.goal)) {
        console.log("Goal reached!");
        showCompletionDialog();
    }
}

function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Draw platforms
    currentLevelData.platforms.forEach(platform => {
        ctx.drawImage(assets.platform, platform.x, platform.y, platform.width, platform.height);
    });

    // Draw obstacles
    currentLevelData.obstacles.forEach(obstacle => {
        ctx.drawImage(assets[obstacle.type], obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });

    // Draw monsters
    currentLevelData.monsters.forEach(monster => {
        ctx.drawImage(assets[monster.type], monster.x, monster.y, monster.width, monster.height);
    });

    // Draw player
    ctx.drawImage(assets.hero, player.x, player.y, player.width, player.height);

    // Draw goal
    ctx.drawImage(assets.glorious_goal, currentLevelData.goal.x, currentLevelData.goal.y, currentLevelData.goal.width, currentLevelData.goal.height);

    // Day/Night overlay for effect
    if (!dayMode) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'; // Dark overlay for night
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

// --- Helper Functions ---
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

function resetPlayerPosition() {
    player.x = 50;
    player.y = GAME_HEIGHT - TILE_SIZE * 2;
    player.dx = 0;
    player.dy = 0;
    player.onGround = false;
}

function resetLevel() {
    resetPlayerPosition();
    // Potentially reset monster positions or other level specific elements here
}

function showCompletionDialog(isFinalLevel = false) {
    gamePaused = true;
    dialogOverlay.classList.remove('hidden');

    if (isFinalLevel) {
        dialogTitle.textContent = "Congratulations!";
        dialogMessage.textContent = "You have completed all adventures! Would you like to play again?";
        nextLevelBtn.textContent = "Start Over";
        nextLevelBtn.onclick = () => {
            currentLevel = 1;
            loadLevel(currentLevel);
            hideCompletionDialog();
            resetPlayerPosition();
        };
        closeDialogBtn.textContent = "Close Game";
        closeDialogBtn.onclick = () => {
            alert("Thanks for playing!");
            hideCompletionDialog();
        };
    } else {
        dialogTitle.textContent = "Adventure Complete!";
        dialogMessage.textContent = `You finished Level ${currentLevel}. Ready for the next challenge?`;
        nextLevelBtn.textContent = "Next Adventure";
        nextLevelBtn.onclick = () => {
            currentLevel++;
            loadLevel(currentLevel);
            hideCompletionDialog();
            resetPlayerPosition();
        };
        closeDialogBtn.textContent = "Close";
        closeDialogBtn.onclick = hideCompletionDialog;
    }
}

function hideCompletionDialog() {
    dialogOverlay.classList.add('hidden');
    gamePaused = false;
}

function loadLevel(levelNum) {
    if (levelNum > maxLevels) {
        showCompletionDialog(true); // Show final congratulations
        return;
    }
    currentLevelData = levels[levelNum - 1];
    if (!currentLevelData) {
        console.error(`Level ${levelNum} not defined!`);
        showCompletionDialog(true); // Fallback to final screen if level missing
        return;
    }
    // You might want to randomize monster positions or other elements here
    resetPlayerPosition();
}


// --- Initialization ---
function startGame() {
    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;
    updateBackground(); // Set initial background
    loadLevel(currentLevel); // Load the first level
    requestAnimationFrame(loop); // Start the game loop
}

// Ensure all assets are loaded before starting
// The loadAsset function will call startGame() once all are ready.