 const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('level');
const xpEl = document.getElementById('xp');
const hpBar = document.getElementById('hp-bar');

const joystick = document.getElementById('joystick');
const shootBtn = document.getElementById('shootBtn');

canvas.width = innerWidth;
canvas.height = innerHeight;

let score = 0;
let xp = 0;
let level = 1;
let tempoVivo = 0;

let touchX = 0;
let touchY = 0;

const player = {
    x: canvas.width/2,
    y: canvas.height/2,
    radius: 15,
    speed: 5,
    hp: 100,
    weapon: 'normal',
    dashCooldown: 0
};

const enemies = [];
const projectiles = [];
const keys = {};

window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);
window.addEventListener('mousedown', shoot);

/* ================= JOYSTICK ================= */
if (joystick) {
    joystick.addEventListener('touchmove', e => {
        const t = e.touches[0];
        const rect = joystick.getBoundingClientRect();

        touchX = (t.clientX - (rect.left + rect.width/2)) / 50;
        touchY = (t.clientY - (rect.top + rect.height/2)) / 50;
    });

    joystick.addEventListener('touchend', () => {
        touchX = 0;
        touchY = 0;
    });
}

/* ================= TIRO MOBILE ================= */
if (shootBtn) {
    shootBtn.addEventListener('touchstart', mobileShoot);
}

function mobileShoot() {
    const target = enemies[0];
    if (!target) return;

    const angle = Math.atan2(target.y - player.y, target.x - player.x);

    projectiles.push({
        x: player.x,
        y: player.y,
        vx: Math.cos(angle)*10,
        vy: Math.sin(angle)*10,
        radius: 4
    });
}

/* ================= TIRO PC ================= */
function shoot(e) {
    const angle = Math.atan2(e.clientY - player.y, e.clientX - player.x);

    projectiles.push({
        x: player.x,
        y: player.y,
        vx: Math.cos(angle)*12,
        vy: Math.sin(angle)*12,
        radius: 4
    });
}

/* ================= SPAWN INIMIGOS ================= */
function spawnEnemy() {
    let type = Math.random();

    let enemy = {
        x: Math.random()*canvas.width,
        y: Math.random()*canvas.height
    };

    if (type < 0.6) {
        enemy.radius = 15;
        enemy.hp = 1;
        enemy.speed = 2;
        enemy.color = 'red';
        enemy.type = 'normal';
    } else if (type < 0.85) {
        enemy.radius = 25;
        enemy.hp = 5;
        enemy.speed = 1;
        enemy.color = 'purple';
        enemy.type = 'tank';
    } else {
        enemy.radius = 18;
        enemy.hp = 2;
        enemy.speed = 1.5;
        enemy.color = 'blue';
        enemy.type = 'shooter';
        enemy.cooldown = 0;
    }

    enemies.push(enemy);
    setTimeout(spawnEnemy, Math.max(300, 1000 - score));
}

/* ================= UPDATE ================= */
function update() {

    // teclado
    if (keys['KeyW']) player.y -= player.speed;
    if (keys['KeyS']) player.y += player.speed;
    if (keys['KeyA']) player.x -= player.speed;
    if (keys['KeyD']) player.x += player.speed;

    // mobile (JOYSTICK)
    player.x += touchX * player.speed;
    player.y += touchY * player.speed;

    // dash
    if (keys['ShiftLeft'] && player.dashCooldown <= 0) {
        player.x += (keys['KeyD'] - keys['KeyA']) * 100;
        player.y += (keys['KeyS'] - keys['KeyW']) * 100;
        player.dashCooldown = 60;
    }
    if (player.dashCooldown > 0) player.dashCooldown--;

    // projéteis
    projectiles.forEach((p, pi) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.y < 0 || p.x > canvas.width || p.y > canvas.height)
            projectiles.splice(pi,1);
    });

    // inimigos
    enemies.forEach((en, ei) => {

        let angle = Math.atan2(player.y-en.y, player.x-en.x);
        en.x += Math.cos(angle)*en.speed;
        en.y += Math.sin(angle)*en.speed;

        // inimigo que atira
        if (en.type === 'shooter') {
            en.cooldown--;
            if (en.cooldown <= 0) {
                projectiles.push({
                    x: en.x,
                    y: en.y,
                    vx: Math.cos(angle)*6,
                    vy: Math.sin(angle)*6,
                    radius: 4,
                    enemy: true
                });
                en.cooldown = 120;
            }
        }

        // colisões
        projectiles.forEach((p, pi) => {

            if (p.enemy) {
                let d = Math.hypot(p.x-player.x, p.y-player.y);
                if (d < p.radius + player.radius) {
                    player.hp -= 5;
                    projectiles.splice(pi,1);
                }
                return;
            }

            let d = Math.hypot(p.x-en.x, p.y-en.y);

            if (d < p.radius + en.radius) {
                en.hp--;

                if (en.hp <= 0) {
                    enemies.splice(ei,1);
                    score += 10;
                    xp += 5;

                    if (xp >= level*20) {
                        xp = 0;
                        level++;
                        player.weapon = 'spread';
                    }
                }

                projectiles.splice(pi,1);
            }
        });

        let d = Math.hypot(player.x-en.x, player.y-en.y);
        if (d < player.radius + en.radius) {
            player.hp -= 0.5;
        }
    });

    // UI
    scoreEl.innerText = score;
    levelEl.innerText = level;
    xpEl.innerText = xp;
    hpBar.style.width = player.hp + '%';

    if (player.hp <= 0) {
        alert("GAME OVER\nScore: "+score);
        location.reload();
    }
}

/* ================= DRAW ================= */
function draw() {
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(0,0,canvas.width,canvas.height);

    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI*2);
    ctx.fillStyle = "lime";
    ctx.fill();

    enemies.forEach(en => {
        ctx.beginPath();
        ctx.arc(en.x, en.y, en.radius, 0, Math.PI*2);
        ctx.fillStyle = en.color;
        ctx.fill();
    });

    projectiles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI*2);
        ctx.fillStyle = p.enemy ? "orange" : "yellow";
        ctx.fill();
    });

    update();
    requestAnimationFrame(draw);
}

/* ================= START ================= */
setInterval(() => tempoVivo++, 1000);

spawnEnemy();
draw();
