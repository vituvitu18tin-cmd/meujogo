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

/* ===== IMPEDIR ZOOM/SCROLL NO MOBILE ===== */
document.body.addEventListener('touchmove', e => e.preventDefault(), { passive: false });

let score = 0;
let xp = 0;
let level = 1;

let touchX = 0;
let touchY = 0;

const player = {
    x: canvas.width/2,
    y: canvas.height/2,
    radius: 15,
    speed: 5,
    hp: 100,
    dashCooldown: 0
};

const enemies = [];
const projectiles = [];
const keys = {};

/* ===== CONTROLES PC ===== */
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);
window.addEventListener('mousedown', shoot);

/* ===== JOYSTICK ===== */
if (joystick) {
    joystick.addEventListener('touchmove', e => {
        const t = e.touches[0];
        const rect = joystick.getBoundingClientRect();

        touchX = (t.clientX - (rect.left + rect.width/2)) / 40;
        touchY = (t.clientY - (rect.top + rect.height/2)) / 40;
    });

    joystick.addEventListener('touchend', () => {
        touchX = 0;
        touchY = 0;
    });
}

/* ===== TIRO MOBILE MELHORADO ===== */
if (shootBtn) {
    shootBtn.addEventListener('touchstart', () => {
        const target = getNearestEnemy();
        if (!target) return;

        shootAt(target.x, target.y, 10);
    });
}

/* ===== FUNÇÃO DE TIRO ===== */
function shoot(e) {
    shootAt(e.clientX, e.clientY, 12);
}

function shootAt(tx, ty, speed) {
    const angle = Math.atan2(ty - player.y, tx - player.x);

    projectiles.push({
        x: player.x,
        y: player.y,
        vx: Math.cos(angle)*speed,
        vy: Math.sin(angle)*speed,
        radius: 4
    });
}

/* ===== INIMIGO MAIS PRÓXIMO ===== */
function getNearestEnemy() {
    let nearest = null;
    let minDist = Infinity;

    enemies.forEach(en => {
        let d = Math.hypot(player.x - en.x, player.y - en.y);
        if (d < minDist) {
            minDist = d;
            nearest = en;
        }
    });

    return nearest;
}

/* ===== SPAWN ===== */
function spawnEnemy() {
    let type = Math.random();

    let enemy = {
        x: Math.random()*canvas.width,
        y: Math.random()*canvas.height
    };

    if (type < 0.6) {
        Object.assign(enemy, { radius: 15, hp: 1, speed: 2, color: 'red', type: 'normal' });
    } else if (type < 0.85) {
        Object.assign(enemy, { radius: 25, hp: 5, speed: 1, color: 'purple', type: 'tank' });
    } else {
        Object.assign(enemy, { radius: 18, hp: 2, speed: 1.5, color: 'blue', type: 'shooter', cooldown: 0 });
    }

    enemies.push(enemy);
    setTimeout(spawnEnemy, Math.max(300, 1000 - score));
}

/* ===== UPDATE ===== */
function update() {

    // teclado
    if (keys['KeyW']) player.y -= player.speed;
    if (keys['KeyS']) player.y += player.speed;
    if (keys['KeyA']) player.x -= player.speed;
    if (keys['KeyD']) player.x += player.speed;

    // mobile
    player.x += touchX * player.speed;
    player.y += touchY * player.speed;

    /* ===== LIMITAR TELA ===== */
    player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));

    // dash
    if (keys['ShiftLeft'] && player.dashCooldown <= 0) {
        player.x += (keys['KeyD'] - keys['KeyA']) * 80;
        player.y += (keys['KeyS'] - keys['KeyW']) * 80;
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

        // shooter
        if (en.type === 'shooter') {
            en.cooldown--;
            if (en.cooldown <= 0) {
                shootAt(player.x, player.y, 6);
                en.cooldown = 120;
            }
        }

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

/* ===== DRAW ===== */
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
        ctx.fillStyle = "yellow";
        ctx.fill();
    });

    update();
    requestAnimationFrame(draw);
}

/* ===== RESIZE FIX ===== */
window.addEventListener('resize', () => {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
});

/* START */
spawnEnemy();
draw();
