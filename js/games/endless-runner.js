window.createEndlessRunner = function(root) {
    root.innerHTML = `
        <div class="game-box runner-game">
            <div class="game-toolbar">
                <strong>
                    Счёт: <span class="runner-score">0</span>
                    · <span class="runner-distance">0</span> м
                    · 🪙 <span class="runner-coins">0</span>
                </strong>

                <button class="game-button runner-restart">Заново</button>
            </div>

            <canvas class="game-canvas runner-canvas" width="720" height="405"></canvas>

            <p class="game-status runner-status">
                Space, ↑ или тап - прыжок. Держи дольше - прыжок выше. P - пауза.
            </p>

            <div class="mobile-controls">
                <button class="runner-jump" aria-label="Прыжок">↑ Прыжок</button>
            </div>
        </div>
    `;

    const canvas = root.querySelector(".runner-canvas");
    const ctx = canvas.getContext("2d");
    const scoreElement = root.querySelector(".runner-score");
    const distanceElement = root.querySelector(".runner-distance");
    const coinsElement = root.querySelector(".runner-coins");
    const restartButton = root.querySelector(".runner-restart");
    const jumpButton = root.querySelector(".runner-jump");

    const W = canvas.width;
    const H = canvas.height;
    const GROUND = 340;
    const STORAGE_KEY = "gamebox:runner";

    const GRAVITY = 2600;
    const JUMP_SPEED = 980;
    const JUMP_CUT = 380;
    const AIR_TIME = 2 * JUMP_SPEED / GRAVITY;
    const START_SPEED = 340;
    const MAX_SPEED = 920;
    const PX_PER_METER = 40;
    const MILESTONE = 250;

    const PLAYER = { x: 110, w: 30, h: 44 };

    const OBSTACLES = [
        { kind: "cactus", w: 22, h: 42, lift: 0, weight: 3 },
        { kind: "cactus2", w: 48, h: 42, lift: 0, weight: 2, minSpeed: 400 },
        { kind: "tall", w: 26, h: 62, lift: 0, weight: 2 },
        { kind: "crate", w: 50, h: 38, lift: 0, weight: 2 },
        { kind: "spikes", w: 78, h: 20, lift: 0, weight: 2 },
        { kind: "birdLow", w: 38, h: 22, lift: 6, weight: 2, minSpeed: 420 },
        { kind: "birdHigh", w: 38, h: 22, lift: 58, weight: 1, minSpeed: 520 }
    ];

    const THEMES = [
        { sky: "#8ecae6", far: "#6f9fa0", near: "#4f7a5a", ground: "#7a5c3e", top: "#5d8a3a", clouds: true },
        { sky: "#f2a65a", far: "#b5704a", near: "#8a5236", ground: "#5e3f2b", top: "#9c5a32", clouds: true },
        { sky: "#1b2440", far: "#2b3a5c", near: "#223050", ground: "#2d2a2a", top: "#3d5c3d", stars: true },
        { sky: "#f1d9a7", far: "#d4a373", near: "#c08552", ground: "#a9744f", top: "#d9a066" }
    ];

    const STARS = Array.from({ length: 40 }, () => ({
        x: Math.random() * W,
        y: Math.random() * (GROUND - 120),
        r: Math.random() * 1.4 + 0.4
    }));

    let state;
    let player;
    let obstacles;
    let coins;
    let speed;
    let distance;
    let coinCount;
    let untilNext;
    let jumpBuffer;
    let jumpHeld;
    let coyote;
    let runPhase;
    let boostFlash;
    let nextMilestone;
    let overTime;
    let records;
    let lastScore = -1;

    function loadStats() {
        try {
            const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
            return value && typeof value === "object" ? value : {};
        } catch (error) {
            return {};
        }
    }

    function saveStats(stats) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
        } catch (error) {}
    }

    let stats = loadStats();

    function meters() {
        return Math.floor(distance / PX_PER_METER);
    }

    function score() {
        return meters() + coinCount * 10;
    }

    function reset() {
        state = "ready";
        player = { y: GROUND - PLAYER.h, vy: 0, onGround: true };
        obstacles = [];
        coins = [];
        speed = START_SPEED;
        distance = 0;
        coinCount = 0;
        untilNext = 500;
        jumpBuffer = 0;
        jumpHeld = false;
        coyote = 0;
        runPhase = 0;
        boostFlash = 0;
        nextMilestone = MILESTONE;
        records = [];
        lastScore = -1;

        updateHud();
        loop.stop();
        draw();
    }

    function updateHud() {
        const value = score();

        if (value === lastScore) return;

        lastScore = value;
        scoreElement.textContent = value;
        distanceElement.textContent = meters();
        coinsElement.textContent = coinCount;
    }

    // Время, когда низ персонажа выше заданной высоты, при полном прыжке.
    function clearTime(height) {
        const disc = JUMP_SPEED * JUMP_SPEED - 2 * GRAVITY * height;
        return disc > 0 ? 2 * Math.sqrt(disc) / GRAVITY : 0;
    }

    // Препятствие честное, если при текущей скорости его можно перепрыгнуть с запасом.
    function canClear(type) {
        if (type.kind === "birdHigh") return true;

        const top = type.lift + type.h + 4;
        const travel = speed * clearTime(top);

        return travel >= type.w + PLAYER.w + 16;
    }

    function pickObstacle() {
        const options = OBSTACLES.filter(type =>
            (!type.minSpeed || speed >= type.minSpeed) && canClear(type)
        );

        const total = options.reduce((sum, type) => sum + type.weight, 0);
        let roll = Math.random() * total;

        for (const type of options) {
            roll -= type.weight;
            if (roll <= 0) return type;
        }

        return options[0];
    }

    function spawnObstacle() {
        const type = pickObstacle();
        const x = W + 20;

        obstacles.push({
            ...type,
            x,
            y: GROUND - type.lift - type.h,
            flap: Math.random() * Math.PI * 2
        });

        // Минимальный разрыв: персонаж успевает приземлиться и прыгнуть снова.
        const minGap = speed * AIR_TIME * 0.8 + 70;
        const extra = Math.random() * speed * 0.9;

        untilNext = type.w + minGap + extra;

        const roll = Math.random();

        if (type.kind !== "birdHigh" && roll < 0.45) {
            spawnArc(x + type.w / 2);
        } else if (roll < 0.75) {
            spawnLine(x + type.w + minGap * 0.35, Math.min(5, Math.floor((minGap * 0.5) / 30)));
        }
    }

    // Монеты дугой по траектории прыжка - их реально собрать.
    function spawnArc(centerX) {
        const apex = JUMP_SPEED * JUMP_SPEED / (2 * GRAVITY);

        for (let i = -2; i <= 2; i++) {
            const t = (i * 34) / speed;
            const height = apex - GRAVITY / 2 * t * t;

            coins.push({
                x: centerX + i * 34,
                y: GROUND - PLAYER.h / 2 - Math.max(30, height * 0.92),
                taken: false
            });
        }
    }

    function spawnLine(startX, count) {
        for (let i = 0; i < count; i++) {
            coins.push({
                x: startX + i * 30,
                y: GROUND - PLAYER.h / 2,
                taken: false
            });
        }
    }

    function begin() {
        state = "running";
        loop.start();
    }

    function pressJump() {
        if (state === "over") {
            if (performance.now() - overTime > 500) {
                reset();
                begin();
                jumpBuffer = 0.12;
                jumpHeld = true;
            }
            return;
        }

        if (state === "paused") {
            state = "running";
            loop.start();
            return;
        }

        if (state === "ready") begin();

        jumpBuffer = 0.12;
        jumpHeld = true;
    }

    function releaseJump() {
        jumpHeld = false;
    }

    function togglePause() {
        if (state === "running") {
            state = "paused";
            loop.stop();
            draw();
        } else if (state === "paused") {
            state = "running";
            loop.start();
        }
    }

    function gameOver() {
        state = "over";
        overTime = performance.now();

        const finalScore = score();
        const finalDistance = meters();

        stats.totalCoins = (stats.totalCoins || 0) + coinCount;

        if (finalScore > (stats.highScore || 0)) {
            stats.highScore = finalScore;
            records.push("счёт");
        }

        if (finalDistance > (stats.bestDistance || 0)) {
            stats.bestDistance = finalDistance;
            records.push("дистанция");
        }

        saveStats(stats);

        GameBox.sound("hit");
        GameBox.vibrate(150);
        GameBox.submit(finalScore);

        loop.stop();
        draw();
    }

    function overlaps(a, b) {
        return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    }

    function step() {
        if (state !== "running") return false;

        const dt = 1 / 60;

        speed = Math.min(MAX_SPEED, START_SPEED + distance * 0.0105);

        const move = speed * dt;

        distance += move;
        runPhase += move * 0.045;
        boostFlash = Math.max(0, boostFlash - dt * 1.5);

        if (meters() >= nextMilestone) {
            nextMilestone += MILESTONE;
            boostFlash = 1;
            GameBox.sound("power");
        }

        // Прыжок: буфер нажатия и «время койота» прощают неточное нажатие.
        jumpBuffer = Math.max(0, jumpBuffer - dt);
        coyote = player.onGround ? 0.08 : Math.max(0, coyote - dt);

        if (jumpBuffer > 0 && (player.onGround || coyote > 0)) {
            player.vy = -JUMP_SPEED;
            player.onGround = false;
            coyote = 0;
            jumpBuffer = 0;

            GameBox.sound("jump");
        }

        if (!jumpHeld && player.vy < -JUMP_CUT) {
            player.vy = -JUMP_CUT;
        }

        player.vy += GRAVITY * dt;
        player.y += player.vy * dt;

        if (player.y >= GROUND - PLAYER.h) {
            player.y = GROUND - PLAYER.h;
            player.vy = 0;
            player.onGround = true;
        } else {
            player.onGround = false;
        }

        untilNext -= move;

        if (untilNext <= 0) spawnObstacle();

        obstacles.forEach(obstacle => {
            obstacle.x -= move;
            obstacle.flap += dt * 10;
        });

        coins.forEach(coin => {
            coin.x -= move;
        });

        obstacles = obstacles.filter(obstacle => obstacle.x + obstacle.w > -20);
        coins = coins.filter(coin => coin.x > -20 && !coin.taken);

        const hitbox = {
            x: PLAYER.x + 5,
            y: player.y + 4,
            w: PLAYER.w - 10,
            h: PLAYER.h - 6
        };

        for (const coin of coins) {
            if (overlaps(hitbox, { x: coin.x - 10, y: coin.y - 10, w: 20, h: 20 })) {
                coin.taken = true;
                coinCount++;
                GameBox.sound("eat");
            }
        }

        for (const obstacle of obstacles) {
            const box = {
                x: obstacle.x + 3,
                y: obstacle.y + 3,
                w: obstacle.w - 6,
                h: obstacle.h - 3
            };

            if (overlaps(hitbox, box)) {
                gameOver();
                return false;
            }
        }

        updateHud();
    }

    function mix(a, b, t) {
        const pa = parseInt(a.slice(1), 16);
        const pb = parseInt(b.slice(1), 16);

        const r = Math.round(((pa >> 16) & 255) * (1 - t) + ((pb >> 16) & 255) * t);
        const g = Math.round(((pa >> 8) & 255) * (1 - t) + ((pb >> 8) & 255) * t);
        const bl = Math.round((pa & 255) * (1 - t) + (pb & 255) * t);

        return `rgb(${r}, ${g}, ${bl})`;
    }

    // Фон меняется каждые 300 м с плавным переходом.
    function currentTheme() {
        const position = meters() / 300;
        const index = Math.floor(position) % THEMES.length;
        const next = (index + 1) % THEMES.length;
        const t = Math.max(0, (position % 1) - 0.85) / 0.15;

        const a = THEMES[index];
        const b = THEMES[next];

        return {
            sky: mix(a.sky, b.sky, t),
            far: mix(a.far, b.far, t),
            near: mix(a.near, b.near, t),
            ground: mix(a.ground, b.ground, t),
            top: mix(a.top, b.top, t),
            clouds: t < 0.5 ? a.clouds : b.clouds,
            stars: t < 0.5 ? a.stars : b.stars
        };
    }

    function drawHills(color, offset, height, wave, base) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(0, base);

        for (let x = 0; x <= W; x += 16) {
            const y = base - height * (0.55 + 0.45 * Math.sin((x + offset) * wave) * Math.sin((x + offset) * wave * 0.37 + 1));
            ctx.lineTo(x, y);
        }

        ctx.lineTo(W, base);
        ctx.closePath();
        ctx.fill();
    }

    function drawBackground(theme) {
        ctx.fillStyle = theme.sky;
        ctx.fillRect(0, 0, W, H);

        if (theme.stars) {
            ctx.fillStyle = "#fff";

            STARS.forEach(star => {
                const x = (star.x - distance * 0.02 % W + W) % W;
                ctx.fillRect(x, star.y, star.r, star.r);
            });

            ctx.fillStyle = "#f4f1de";
            ctx.beginPath();
            ctx.arc(W - 90, 70, 22, 0, Math.PI * 2);
            ctx.fill();
        }

        if (theme.clouds) {
            ctx.fillStyle = "rgba(255, 255, 255, .7)";

            for (let i = 0; i < 4; i++) {
                const x = ((i * 230 - distance * 0.08) % (W + 200) + W + 200) % (W + 200) - 100;
                const y = 50 + (i % 2) * 40;

                ctx.beginPath();
                ctx.arc(x, y, 18, 0, Math.PI * 2);
                ctx.arc(x + 22, y - 8, 22, 0, Math.PI * 2);
                ctx.arc(x + 46, y, 16, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        drawHills(theme.far, distance * 0.1, 110, 0.012, GROUND);
        drawHills(theme.near, distance * 0.3, 60, 0.02, GROUND);

        ctx.fillStyle = theme.ground;
        ctx.fillRect(0, GROUND, W, H - GROUND);

        ctx.fillStyle = theme.top;
        ctx.fillRect(0, GROUND, W, 6);

        ctx.fillStyle = "rgba(0, 0, 0, .15)";

        for (let x = -(distance % 40); x < W; x += 40) {
            ctx.fillRect(x, GROUND + 18, 14, 3);
        }
    }

    function drawSpeedLines() {
        const intensity = Math.max(0, (speed - 520) / (MAX_SPEED - 520)) * 0.6 + boostFlash * 0.6;

        if (intensity <= 0.02) return;

        ctx.strokeStyle = `rgba(255, 255, 255, ${Math.min(0.5, intensity * 0.5)})`;
        ctx.lineWidth = 2;
        ctx.beginPath();

        for (let i = 0; i < 12; i++) {
            const y = 30 + ((i * 53) % (GROUND - 40));
            const length = 40 + (i % 4) * 25;
            const x = W - ((distance * 1.5 + i * 97) % (W + length));

            ctx.moveTo(x, y);
            ctx.lineTo(x + length, y);
        }

        ctx.stroke();
    }

    function drawObstacle(obstacle) {
        const { x, y, w, h, kind } = obstacle;

        if (kind === "cactus" || kind === "tall" || kind === "cactus2") {
            ctx.fillStyle = "#2f7d3a";

            const parts = kind === "cactus2" ? [x, x + 26] : [x];

            parts.forEach(px => {
                const width = kind === "cactus2" ? 22 : w;

                ctx.fillRect(px + width * 0.3, y, width * 0.4, h);
                ctx.fillRect(px, y + h * 0.35, width * 0.3, 6);
                ctx.fillRect(px, y + h * 0.18, 5, h * 0.25);
                ctx.fillRect(px + width * 0.7, y + h * 0.5, width * 0.3, 6);
                ctx.fillRect(px + width - 5, y + h * 0.3, 5, h * 0.25);
            });
        }

        if (kind === "crate") {
            ctx.fillStyle = "#a0723d";
            ctx.fillRect(x, y, w, h);
            ctx.strokeStyle = "#6b4a24";
            ctx.lineWidth = 3;
            ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
            ctx.beginPath();
            ctx.moveTo(x + 3, y + 3);
            ctx.lineTo(x + w - 3, y + h - 3);
            ctx.stroke();
        }

        if (kind === "spikes") {
            ctx.fillStyle = "#9aa3ad";
            ctx.beginPath();

            for (let px = x; px < x + w - 1; px += 13) {
                ctx.moveTo(px, y + h);
                ctx.lineTo(px + 6.5, y);
                ctx.lineTo(px + 13, y + h);
            }

            ctx.fill();
        }

        if (kind === "birdLow" || kind === "birdHigh") {
            const wing = Math.sin(obstacle.flap) * 8;

            ctx.fillStyle = "#5b3a6e";
            ctx.fillRect(x + 6, y + 8, w - 12, 10);

            ctx.beginPath();
            ctx.moveTo(x + 10, y + 10);
            ctx.lineTo(x + 20, y + 10 - wing - 6);
            ctx.lineTo(x + 28, y + 10);
            ctx.fill();

            ctx.fillStyle = "#f4a742";
            ctx.beginPath();
            ctx.moveTo(x + 6, y + 11);
            ctx.lineTo(x, y + 14);
            ctx.lineTo(x + 6, y + 16);
            ctx.fill();
        }
    }

    function drawPlayer() {
        const x = PLAYER.x;
        const y = player.y;
        const airborne = !player.onGround;
        const swing = airborne ? 0.6 : Math.sin(runPhase) * 0.8;

        ctx.strokeStyle = "#1f3b2a";
        ctx.lineWidth = 6;
        ctx.lineCap = "round";

        const hipX = x + 15;
        const hipY = y + 30;

        ctx.beginPath();
        ctx.moveTo(hipX, hipY);
        ctx.lineTo(hipX + Math.sin(swing) * 12, hipY + 14);
        ctx.moveTo(hipX, hipY);
        ctx.lineTo(hipX - Math.sin(swing) * 12, hipY + 14);
        ctx.stroke();

        ctx.fillStyle = "#3f8f55";
        ctx.fillRect(x + 6, y + 10, 18, 22);

        ctx.fillStyle = "#f0caa3";
        ctx.beginPath();
        ctx.arc(x + 17, y + 6, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "#f0caa3";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(x + 15, y + 15);
        ctx.lineTo(x + 15 - Math.sin(swing) * 10, y + 26);
        ctx.stroke();
    }

    function drawCoins() {
        coins.forEach(coin => {
            ctx.fillStyle = "#ffd54f";
            ctx.beginPath();
            ctx.arc(coin.x, coin.y, 9, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "#f9a825";
            ctx.fillRect(coin.x - 1.5, coin.y - 5, 3, 10);
        });
    }

    function drawText(text, y, size, color) {
        ctx.fillStyle = color || "#fff";
        ctx.font = `bold ${size}px Arial`;
        ctx.textAlign = "center";
        ctx.fillText(text, W / 2, y);
    }

    function draw() {
        const theme = currentTheme();

        drawBackground(theme);
        drawSpeedLines();
        drawCoins();
        obstacles.forEach(drawObstacle);
        drawPlayer();

        ctx.fillStyle = "rgba(0, 0, 0, .35)";
        ctx.fillRect(W - 170, 10, 160, 26);
        ctx.fillStyle = "#fff";
        ctx.font = "13px Arial";
        ctx.textAlign = "right";
        ctx.fillText(`Рекорд: ${stats.highScore || 0} · ${stats.bestDistance || 0} м`, W - 18, 28);

        if (boostFlash > 0.4 && state === "running") {
            drawText("Скорость ↑", 80, 26, `rgba(255, 255, 255, ${boostFlash})`);
        }

        if (state === "ready" || state === "paused" || state === "over") {
            ctx.fillStyle = "rgba(0, 0, 0, .5)";
            ctx.fillRect(0, 0, W, H);
        }

        if (state === "ready") {
            drawText("Endless Runner", H / 2 - 20, 32);
            drawText("Тап, Space или ↑ - старт", H / 2 + 16, 18, "#ddd");
        }

        if (state === "paused") {
            drawText("Пауза", H / 2 - 10, 32);
            drawText("Нажми, чтобы продолжить", H / 2 + 24, 18, "#ddd");
        }

        if (state === "over") {
            drawText("Game Over", H / 2 - 60, 34);
            drawText(`Счёт ${score()} · ${meters()} м · 🪙 ${coinCount}`, H / 2 - 22, 20, "#eee");
            drawText(
                `Рекорд ${stats.highScore || 0} · Лучшая дистанция ${stats.bestDistance || 0} м · Всего монет ${stats.totalCoins || 0}`,
                H / 2 + 10,
                14,
                "#bbb"
            );

            if (records.length) {
                drawText(`Новый рекорд: ${records.join(", ")}!`, H / 2 + 40, 18, "#ffd54f");
            }

            drawText("Тап или Space - заново", H / 2 + 74, 16, "#ddd");
        }
    }

    const loop = GameBox.loop(step, draw);

    const JUMP_KEYS = ["Space", "ArrowUp", "KeyW"];

    function keyDown(event) {
        if (JUMP_KEYS.includes(event.code)) {
            event.preventDefault();

            if (!event.repeat) pressJump();
        }

        if (event.code === "KeyP" || event.code === "Escape") {
            togglePause();
        }
    }

    function keyUp(event) {
        if (JUMP_KEYS.includes(event.code)) releaseJump();
    }

    function pointerDown(event) {
        event.preventDefault();

        try {
            canvas.setPointerCapture(event.pointerId);
        } catch (error) {}

        pressJump();
    }

    function visibility() {
        if (document.hidden && state === "running") togglePause();
    }

    canvas.addEventListener("pointerdown", pointerDown);
    canvas.addEventListener("pointerup", releaseJump);
    canvas.addEventListener("pointercancel", releaseJump);
    canvas.addEventListener("contextmenu", event => event.preventDefault());

    GameBox.hold(jumpButton, pressJump, releaseJump);

    restartButton.addEventListener("click", () => {
        reset();
    });

    document.addEventListener("keydown", keyDown);
    document.addEventListener("keyup", keyUp);
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("blur", releaseJump);

    reset();

    return function cleanup() {
        loop.stop();

        document.removeEventListener("keydown", keyDown);
        document.removeEventListener("keyup", keyUp);
        document.removeEventListener("visibilitychange", visibility);
        window.removeEventListener("blur", releaseJump);
    };
};
