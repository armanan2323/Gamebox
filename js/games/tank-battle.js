window.createTankBattle = function(root) {
    function pad(player) {
        return `
            <div class="duo-pad duo-pad-${player}" data-player="${player}">
                <div class="mobile-dpad compact">
                    <button class="mobile-control" data-dir="up" aria-label="Вверх">↑</button>
                    <div class="mobile-dpad-middle">
                        <button class="mobile-control" data-dir="left" aria-label="Влево">←</button>
                        <button class="mobile-control" data-dir="down" aria-label="Вниз">↓</button>
                        <button class="mobile-control" data-dir="right" aria-label="Вправо">→</button>
                    </div>
                </div>
                <button class="duo-action duo-fire" data-action="fire">Огонь</button>
            </div>
        `;
    }

    root.innerHTML = `
        <div class="game-box tank-game">
            <div class="game-toolbar">
                <strong class="duo-score">
                    <span class="duo-name-1"></span>
                    <span class="duo-score-1">0</span>
                    :
                    <span class="duo-score-2">0</span>
                    <span class="duo-name-2"></span>
                </strong>

                <div class="toolbar-actions">
                    <button class="game-button tank-next">Новый раунд</button>
                    <button class="game-button tank-restart">Заново</button>
                </div>
            </div>

            <canvas class="game-canvas tank-canvas" width="640" height="480"></canvas>

            <p class="game-status tank-status">
                Синий: WASD + Space · Красный: стрелки + Enter
            </p>

            <div class="mobile-controls duo-controls">
                ${pad(1)}
                ${pad(2)}
            </div>
        </div>
    `;

    const canvas = root.querySelector(".tank-canvas");
    const ctx = canvas.getContext("2d");
    const status = root.querySelector(".tank-status");
    const nextButton = root.querySelector(".tank-next");
    const restartButton = root.querySelector(".tank-restart");
    const scoreElements = [null, root.querySelector(".duo-score-1"), root.querySelector(".duo-score-2")];

    root.querySelector(".duo-name-1").textContent = GameBox.name(1);
    root.querySelector(".duo-name-2").textContent = GameBox.name(2);

    const W = canvas.width;
    const H = canvas.height;
    const TILE = 32;
    const COLS = W / TILE;
    const ROWS = H / TILE;

    const TANK_SIZE = 24;
    const TANK_SPEED = 150;
    const TURN_SPEED = 9;
    const BULLET_SPEED = 430;
    const BULLET_RADIUS = 4;
    const MAX_BULLETS = 3;
    const FIRE_DELAY = 0.35;

    // Верхняя половина арены; нижняя получается поворотом на 180°,
    // поэтому у обоих игроков одинаковые условия.
    const LAYOUTS = [
        [
            "....................",
            "....................",
            "..##....BBBB....##..",
            "..#..............#..",
            "......BB....BB......",
            "....~~........~~....",
            "..BB.....##.....BB..",
            "......**#..#**......"
        ],
        [
            "....................",
            "....#..........#....",
            "....#...BBBB...#....",
            "....#..........#....",
            "..BBBB...##...BBBB..",
            "........~~~~........",
            "..**............**..",
            "..**..BB....BB..**.."
        ],
        [
            "....................",
            "......*......*......",
            "..BB..*..##..*..BB..",
            "..B..............B..",
            "......~~....~~......",
            "..##.....BB.....##..",
            "........*..*........",
            ".....BB......BB....."
        ]
    ];

    const SPAWNS = [
        null,
        { x: 1 * TILE + TILE / 2, y: 13 * TILE + TILE / 2, angle: -Math.PI / 2, color: "#3f8ff5", dark: "#245fae" },
        { x: 18 * TILE + TILE / 2, y: 1 * TILE + TILE / 2, angle: Math.PI / 2, color: "#e54848", dark: "#a42c2c" }
    ];

    const KEYS = {
        KeyW: [1, "up"], KeyS: [1, "down"], KeyA: [1, "left"], KeyD: [1, "right"], Space: [1, "fire"],
        ArrowUp: [2, "up"], ArrowDown: [2, "down"], ArrowLeft: [2, "left"], ArrowRight: [2, "right"],
        Enter: [2, "fire"], NumpadEnter: [2, "fire"]
    };

    let tiles;
    let tanks;
    let bullets;
    let particles;
    let wins = [0, 0, 0];
    let roundOver = false;
    let roundEndTime = 0;
    let layoutIndex = -1;
    let clock = 0;

    const input = [null, emptyInput(), emptyInput()];

    function emptyInput() {
        return { up: false, down: false, left: false, right: false, fire: false };
    }

    function buildTiles() {
        layoutIndex = (layoutIndex + 1 + Math.floor(Math.random() * (LAYOUTS.length - 1))) % LAYOUTS.length;

        const top = LAYOUTS[layoutIndex];
        const rows = [...top];

        for (let r = ROWS - top.length - 1; r >= 0; r--) {
            rows.push(top[r].split("").reverse().join(""));
        }

        tiles = rows.slice(0, ROWS).map(row =>
            row.padEnd(COLS, ".").slice(0, COLS).split("").map(char => {
                if (char === "#") return { type: "steel" };
                if (char === "B") return { type: "brick", hp: 2 };
                if (char === "~") return { type: "water" };
                if (char === "*") return { type: "bush" };
                return null;
            })
        );
    }

    function createTank(player) {
        const spawn = SPAWNS[player];

        return {
            player,
            x: spawn.x,
            y: spawn.y,
            vx: 0,
            vy: 0,
            angle: spawn.angle,
            color: spawn.color,
            dark: spawn.dark,
            cooldown: 0.6,
            alive: true
        };
    }

    function startRound() {
        buildTiles();

        tanks = [null, createTank(1), createTank(2)];
        bullets = [];
        particles = [];
        roundOver = false;

        nextButton.disabled = true;
        status.textContent = "Синий: WASD + Space · Красный: стрелки + Enter";

        loop.start();
    }

    function restart() {
        wins = [0, 0, 0];
        scoreElements[1].textContent = "0";
        scoreElements[2].textContent = "0";
        startRound();
    }

    function tileAt(x, y) {
        const col = Math.floor(x / TILE);
        const row = Math.floor(y / TILE);

        if (col < 0 || row < 0 || col >= COLS || row >= ROWS) return { type: "edge" };

        return tiles[row][col];
    }

    function blocksTank(tile) {
        return tile && tile.type !== "bush";
    }

    function tankHitsWorld(tank, x, y) {
        const half = TANK_SIZE / 2;

        if (x - half < 0 || y - half < 0 || x + half > W || y + half > H) return true;

        const left = Math.floor((x - half) / TILE);
        const right = Math.floor((x + half - 0.01) / TILE);
        const top = Math.floor((y - half) / TILE);
        const bottom = Math.floor((y + half - 0.01) / TILE);

        for (let row = top; row <= bottom; row++) {
            for (let col = left; col <= right; col++) {
                if (blocksTank(tiles[row][col])) return true;
            }
        }

        const other = tanks[tank.player === 1 ? 2 : 1];

        if (other.alive && Math.abs(other.x - x) < TANK_SIZE && Math.abs(other.y - y) < TANK_SIZE) {
            return true;
        }

        return false;
    }

    function angleDiff(a, b) {
        let diff = b - a;

        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;

        return diff;
    }

    function updateTank(tank, dt) {
        const control = input[tank.player];

        let dx = (control.right ? 1 : 0) - (control.left ? 1 : 0);
        let dy = (control.down ? 1 : 0) - (control.up ? 1 : 0);

        if (dx && dy) {
            dx *= Math.SQRT1_2;
            dy *= Math.SQRT1_2;
        }

        const targetVx = dx * TANK_SPEED;
        const targetVy = dy * TANK_SPEED;
        const blend = Math.min(1, dt * (dx || dy ? 12 : 16));

        tank.vx += (targetVx - tank.vx) * blend;
        tank.vy += (targetVy - tank.vy) * blend;

        if (dx || dy) {
            const diff = angleDiff(tank.angle, Math.atan2(dy, dx));
            const step = TURN_SPEED * dt;

            tank.angle += Math.abs(diff) <= step ? diff : Math.sign(diff) * step;
        }

        // Движение по осям отдельно - танк скользит вдоль стены, а не застревает.
        const nextX = tank.x + tank.vx * dt;

        if (!tankHitsWorld(tank, nextX, tank.y)) {
            tank.x = nextX;
        } else {
            tank.vx = 0;
            nudge(tank, "y");
        }

        const nextY = tank.y + tank.vy * dt;

        if (!tankHitsWorld(tank, tank.x, nextY)) {
            tank.y = nextY;
        } else {
            tank.vy = 0;
            nudge(tank, "x");
        }

        tank.cooldown = Math.max(0, tank.cooldown - dt);

        if (control.fire) fire(tank);
    }

    // Помогает въехать в проход шириной в одну клетку, если танк чуть не по центру.
    function nudge(tank, axis) {
        const value = tank[axis];
        const center = Math.floor(value / TILE) * TILE + TILE / 2;
        const diff = center - value;

        if (Math.abs(diff) < 1 || Math.abs(diff) > 10) return;

        const step = Math.sign(diff) * Math.min(Math.abs(diff), 1.5);
        const x = axis === "x" ? tank.x + step : tank.x;
        const y = axis === "y" ? tank.y + step : tank.y;

        if (!tankHitsWorld(tank, x, y)) {
            tank.x = x;
            tank.y = y;
        }
    }

    function fire(tank) {
        if (tank.cooldown > 0 || !tank.alive) return;

        const own = bullets.filter(bullet => bullet.owner === tank.player).length;

        if (own >= MAX_BULLETS) return;

        const nx = Math.cos(tank.angle);
        const ny = Math.sin(tank.angle);

        bullets.push({
            owner: tank.player,
            x: tank.x + nx * 18,
            y: tank.y + ny * 18,
            vx: nx * BULLET_SPEED,
            vy: ny * BULLET_SPEED
        });

        tank.cooldown = FIRE_DELAY;

        GameBox.sound("shoot");
    }

    function burst(x, y, color, count, speed) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const velocity = speed * (0.3 + Math.random() * 0.7);

            particles.push({
                x,
                y,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity,
                life: 0.3 + Math.random() * 0.5,
                color
            });
        }
    }

    function updateBullets(dt) {
        const steps = 3;

        for (const bullet of bullets) {
            for (let i = 0; i < steps && !bullet.dead; i++) {
                bullet.x += bullet.vx * dt / steps;
                bullet.y += bullet.vy * dt / steps;

                const tile = tileAt(bullet.x, bullet.y);

                if (tile && (tile.type === "edge" || tile.type === "steel")) {
                    bullet.dead = true;
                    burst(bullet.x, bullet.y, "#d7dbe0", 5, 80);
                    GameBox.sound("move");
                } else if (tile && tile.type === "brick") {
                    bullet.dead = true;
                    tile.hp--;

                    burst(bullet.x, bullet.y, "#c8693e", 7, 90);

                    if (tile.hp <= 0) {
                        tiles[Math.floor(bullet.y / TILE)][Math.floor(bullet.x / TILE)] = null;
                    }

                    GameBox.sound("hit");
                }

                if (bullet.dead) break;

                for (const tank of [tanks[1], tanks[2]]) {
                    if (!tank.alive || tank.player === bullet.owner) continue;

                    if (Math.hypot(tank.x - bullet.x, tank.y - bullet.y) < TANK_SIZE / 2 + BULLET_RADIUS) {
                        bullet.dead = true;
                        destroy(tank);
                        break;
                    }
                }
            }
        }

        // Встречные снаряды гасят друг друга.
        for (let i = 0; i < bullets.length; i++) {
            for (let j = i + 1; j < bullets.length; j++) {
                const a = bullets[i];
                const b = bullets[j];

                if (
                    !a.dead && !b.dead &&
                    a.owner !== b.owner &&
                    Math.hypot(a.x - b.x, a.y - b.y) < BULLET_RADIUS * 2.5
                ) {
                    a.dead = true;
                    b.dead = true;
                    burst(a.x, a.y, "#fff3b0", 6, 70);
                }
            }
        }

        bullets = bullets.filter(bullet => !bullet.dead);
    }

    function destroy(tank) {
        tank.alive = false;

        burst(tank.x, tank.y, tank.color, 26, 220);
        burst(tank.x, tank.y, "#ffb74d", 18, 160);

        GameBox.sound("explode");
        GameBox.vibrate(150);

        if (roundOver) return;

        roundOver = true;
        roundEndTime = clock;

        const winner = tank.player === 1 ? 2 : 1;

        wins[winner]++;
        scoreElements[winner].textContent = wins[winner];

        GameBox.win(GameBox.name(winner));

        status.textContent =
            `Раунд за ${GameBox.name(winner)}! Space, Enter или «Новый раунд» - следующий.`;

        nextButton.disabled = false;
    }

    function step() {
        const dt = 1 / 60;

        clock += dt;

        for (const tank of [tanks[1], tanks[2]]) {
            if (tank.alive) updateTank(tank, dt);
        }

        updateBullets(dt);

        particles.forEach(particle => {
            particle.x += particle.vx * dt;
            particle.y += particle.vy * dt;
            particle.vx *= 0.92;
            particle.vy *= 0.92;
            particle.life -= dt;
        });

        particles = particles.filter(particle => particle.life > 0);

        if (roundOver && clock - roundEndTime > 1.5 && !particles.length) {
            loop.stop();
            draw();
            return false;
        }
    }

    function drawTile(tile, x, y) {
        if (tile.type === "steel") {
            ctx.fillStyle = "#7d858f";
            ctx.fillRect(x, y, TILE, TILE);
            ctx.fillStyle = "#a3abb5";
            ctx.fillRect(x + 4, y + 4, TILE - 8, TILE - 8);
            ctx.fillStyle = "#5d646d";
            ctx.fillRect(x + 10, y + 10, TILE - 20, TILE - 20);
        }

        if (tile.type === "brick") {
            ctx.fillStyle = tile.hp > 1 ? "#a8502a" : "#7a3a1f";
            ctx.fillRect(x, y, TILE, TILE);
            ctx.fillStyle = "#3b1d10";
            ctx.fillRect(x, y + 15, TILE, 2);
            ctx.fillRect(x + 15, y, 2, 15);
            ctx.fillRect(x + 7, y + 17, 2, 15);
            ctx.fillRect(x + 23, y + 17, 2, 15);
        }

        if (tile.type === "water") {
            ctx.fillStyle = "#1f4f7a";
            ctx.fillRect(x, y, TILE, TILE);
            ctx.fillStyle = "#3a77ad";
            const wave = Math.sin(clock * 3 + x * 0.1) * 3;
            ctx.fillRect(x + 4, y + 9 + wave, 12, 2);
            ctx.fillRect(x + 16, y + 21 - wave, 12, 2);
        }
    }

    function drawTank(tank) {
        ctx.save();
        ctx.translate(tank.x, tank.y);
        ctx.rotate(tank.angle);

        ctx.fillStyle = "#1c1f22";
        ctx.fillRect(-13, -13, 26, 6);
        ctx.fillRect(-13, 7, 26, 6);

        ctx.fillStyle = tank.color;
        ctx.fillRect(-11, -8, 22, 16);

        ctx.fillStyle = tank.dark;
        ctx.fillRect(0, -2.5, 18, 5);

        ctx.beginPath();
        ctx.arc(0, 0, 6.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    function draw() {
        ctx.fillStyle = "#1b1f1b";
        ctx.fillRect(0, 0, W, H);

        ctx.strokeStyle = "#222722";
        ctx.lineWidth = 1;
        ctx.beginPath();

        for (let col = 1; col < COLS; col++) {
            ctx.moveTo(col * TILE + 0.5, 0);
            ctx.lineTo(col * TILE + 0.5, H);
        }

        for (let row = 1; row < ROWS; row++) {
            ctx.moveTo(0, row * TILE + 0.5);
            ctx.lineTo(W, row * TILE + 0.5);
        }

        ctx.stroke();

        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                const tile = tiles[row][col];

                if (tile && tile.type !== "bush") drawTile(tile, col * TILE, row * TILE);
            }
        }

        ctx.fillStyle = "#ffe082";

        bullets.forEach(bullet => {
            ctx.beginPath();
            ctx.arc(bullet.x, bullet.y, BULLET_RADIUS, 0, Math.PI * 2);
            ctx.fill();
        });

        [tanks[1], tanks[2]].forEach(tank => {
            if (tank.alive) drawTank(tank);
        });

        // Кусты рисуются поверх танков - в них можно спрятаться.
        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                const tile = tiles[row][col];

                if (tile && tile.type === "bush") {
                    const x = col * TILE;
                    const y = row * TILE;

                    ctx.fillStyle = "rgba(47, 125, 58, .88)";
                    ctx.fillRect(x, y, TILE, TILE);
                    ctx.fillStyle = "rgba(76, 163, 86, .9)";
                    ctx.fillRect(x + 3, y + 4, 10, 8);
                    ctx.fillRect(x + 17, y + 14, 11, 9);
                    ctx.fillRect(x + 6, y + 21, 8, 7);
                }
            }
        }

        particles.forEach(particle => {
            ctx.globalAlpha = Math.min(1, particle.life * 2);
            ctx.fillStyle = particle.color;
            ctx.fillRect(particle.x - 2, particle.y - 2, 4, 4);
        });

        ctx.globalAlpha = 1;

        if (roundOver) {
            const winner = tanks[1].alive ? 1 : 2;

            ctx.fillStyle = "rgba(0, 0, 0, .55)";
            ctx.fillRect(0, H / 2 - 50, W, 100);

            ctx.fillStyle = SPAWNS[winner].color;
            ctx.font = "bold 30px Arial";
            ctx.textAlign = "center";
            ctx.fillText(`Раунд за ${GameBox.name(winner)}`, W / 2, H / 2 + 2);

            ctx.fillStyle = "#ddd";
            ctx.font = "16px Arial";
            ctx.fillText("Space / Enter - следующий раунд", W / 2, H / 2 + 30);
        }
    }

    const loop = GameBox.loop(step, draw);

    function setInput(player, action, value) {
        input[player][action] = value;
    }

    function keyDown(event) {
        const binding = KEYS[event.code];

        if (!binding) return;

        event.preventDefault();

        if (event.target && event.target.blur && event.target.closest && event.target.closest("button")) {
            event.target.blur();
        }

        if (roundOver) {
            if (binding[1] === "fire" && !event.repeat && clock - roundEndTime > 0.6) {
                startRound();
            }

            return;
        }

        setInput(binding[0], binding[1], true);
    }

    function keyUp(event) {
        const binding = KEYS[event.code];

        if (!binding) return;

        setInput(binding[0], binding[1], false);
    }

    function releaseAll() {
        input[1] = emptyInput();
        input[2] = emptyInput();
    }

    root.querySelectorAll(".duo-pad").forEach(padElement => {
        const player = Number(padElement.dataset.player);

        padElement.querySelectorAll("[data-dir]").forEach(button => {
            GameBox.hold(
                button,
                () => setInput(player, button.dataset.dir, true),
                () => setInput(player, button.dataset.dir, false)
            );
        });

        const fireButton = padElement.querySelector("[data-action=fire]");

        GameBox.hold(
            fireButton,
            () => {
                if (roundOver) {
                    if (clock - roundEndTime > 0.6) startRound();
                    return;
                }

                setInput(player, "fire", true);
            },
            () => setInput(player, "fire", false)
        );
    });

    nextButton.addEventListener("click", startRound);
    restartButton.addEventListener("click", restart);

    document.addEventListener("keydown", keyDown);
    document.addEventListener("keyup", keyUp);
    window.addEventListener("blur", releaseAll);

    restart();

    return function cleanup() {
        loop.stop();
        releaseAll();

        document.removeEventListener("keydown", keyDown);
        document.removeEventListener("keyup", keyUp);
        window.removeEventListener("blur", releaseAll);
    };
};
