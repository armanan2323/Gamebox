window.createAirHockey = function(root) {
    root.innerHTML = `
        <div class="game-box air-hockey-game">
            <div class="game-toolbar">
                <div class="hockey-score">
                    <span class="hockey-blue-score">0</span>
                    <span>:</span>
                    <span class="hockey-red-score">0</span>
                </div>
                <button class="game-button hockey-restart">Заново</button>
            </div>

            <div class="mode-switch hockey-mode-switch">
                <button class="mode-button active" data-mode="ai">🤖 Против ИИ</button>
                <button class="mode-button" data-mode="two">👥 Вдвоём</button>
            </div>

            <canvas class="air-hockey-canvas" width="480" height="720"></canvas>

            <div class="mobile-controls hockey-controls">
                <div class="mobile-dpad compact hockey-dpad-blue" data-player="1">
                    <button class="mobile-control" data-dir="up" aria-label="Вверх">↑</button>

                    <div class="mobile-dpad-middle">
                        <button class="mobile-control" data-dir="left" aria-label="Влево">←</button>
                        <button class="mobile-control" data-dir="down" aria-label="Вниз">↓</button>
                        <button class="mobile-control" data-dir="right" aria-label="Вправо">→</button>
                    </div>
                </div>
                <div class="mobile-dpad compact hockey-dpad-red" data-player="2">
                    <button class="mobile-control" data-dir="up" aria-label="Вверх">↑</button>

                    <div class="mobile-dpad-middle">
                        <button class="mobile-control" data-dir="left" aria-label="Влево">←</button>
                        <button class="mobile-control" data-dir="down" aria-label="Вниз">↓</button>
                        <button class="mobile-control" data-dir="right" aria-label="Вправо">→</button>
                    </div>
                </div>
            </div>

            <p class="game-status hockey-status">
                Веди биту пальцем или мышью. Клавиатура: WASD / стрелки. До 7 голов.
            </p>
        </div>
    `;

    const canvas = root.querySelector(".air-hockey-canvas");
    const ctx = canvas.getContext("2d");

    const restartButton =
        root.querySelector(".hockey-restart");

    const blueScoreElement =
        root.querySelector(".hockey-blue-score");

    const redScoreElement =
        root.querySelector(".hockey-red-score");

    const statusElement =
        root.querySelector(".hockey-status");

    const modeButtons =
        root.querySelectorAll(".mode-button");

    const W = canvas.width;
    const H = canvas.height;

    const WALL = 10;
    const GOAL_HALF = 80;
    const WIN_SCORE = 7;

    const player1 = {
        x: W / 2,
        y: H - 65,
        vx: 0,
        vy: 0,
        radius: 30,
        color: "#3f8ff5",
        target: null
    };

    const player2 = {
        x: W / 2,
        y: 65,
        vx: 0,
        vy: 0,
        radius: 30,
        color: "#e54848",
        target: null
    };

    const puck = {
        x: W / 2,
        y: H / 2,
        radius: 16,
        vx: 0,
        vy: 0,
        maxSpeed: 14
    };

    let scoreBlue = 0;
    let scoreRed = 0;
    let mode = "ai";
    let running = true;
    let serveDelay = 0;
    let lastHitSound = 0;

    const pointers = new Map();

    const keys = {};

    function resetPuck(direction = 1) {
        puck.x = W / 2;
        puck.y = H / 2 + direction * 40;

        puck.vx = 0;
        puck.vy = 0;

        serveDelay = 40;
    }

    function resetMallets() {
        player1.x = W / 2;
        player1.y = H - 65;
        player2.x = W / 2;
        player2.y = 65;

        [player1, player2].forEach(player => {
            player.vx = 0;
            player.vy = 0;
            player.target = null;
        });
    }

    function reset() {
        scoreBlue = 0;
        scoreRed = 0;
        running = true;

        pointers.clear();
        resetMallets();
        updateControls();

        resetPuck(
            Math.random() > 0.5 ? 1 : -1
        );

        updateScore();

        statusElement.textContent =
            mode === "ai"
                ? "Вы - синий снизу. Ведите биту пальцем, мышью или стрелками. До 7 голов."
                : "Синий - снизу, красный - сверху. Пальцем на своей половине или стрелками.";

        loop.start();
    }

    function updateScore() {
        blueScoreElement.textContent =
            scoreBlue;

        redScoreElement.textContent =
            scoreRed;
    }

    function clamp(value, min, max) {
        return Math.max(
            min,
            Math.min(max, value)
        );
    }

    function limitPlayer(player) {
        const r = player.radius;

        if (player === player1) {
            player.y = clamp(player.y, H / 2 + r, H - WALL - r);
        } else {
            player.y = clamp(player.y, WALL + r, H / 2 - r);
        }

        player.x = clamp(player.x, WALL + r, W - WALL - r);
    }

    function updatePlayer(player, up, down, left, right) {
        const oldX = player.x;
        const oldY = player.y;
        const speed = 6;

        if (player.target) {
            // Бита догоняет палец/мышь, но с ограничением скорости.
            const dx = player.target.x - player.x;
            const dy = player.target.y - player.y;
            const distance = Math.hypot(dx, dy);
            const maxStep = 18;

            if (distance > maxStep) {
                player.x += dx / distance * maxStep;
                player.y += dy / distance * maxStep;
            } else {
                player.x += dx;
                player.y += dy;
            }
        } else {
            if (up.some(key => keys[key])) player.y -= speed;
            if (down.some(key => keys[key])) player.y += speed;
            if (left.some(key => keys[key])) player.x -= speed;
            if (right.some(key => keys[key])) player.x += speed;
        }

        limitPlayer(player);

        player.vx = player.x - oldX;
        player.vy = player.y - oldY;
    }

    function updateAI() {
        const oldX = player2.x;
        const oldY = player2.y;
        const level = Math.min(1, 0.55 + (scoreBlue - scoreRed) * 0.08 + (scoreBlue + scoreRed) * 0.02);
        const speed = 3.6 + level * 2.4;

        let targetX;
        let targetY;

        if (puck.y < H / 2 + 20 && puck.vy <= 2) {
            // Атака: заходим за шайбу и бьём в сторону ворот соперника.
            targetX = puck.x + (puck.x - W / 2) * 0.15;
            targetY = puck.y - puck.radius - player2.radius + 6;
        } else {
            // Защита: держимся между шайбой и своими воротами.
            targetX = W / 2 + (puck.x - W / 2) * 0.55;
            targetY = 70;
        }

        const dx = targetX - player2.x;
        const dy = targetY - player2.y;
        const distance = Math.hypot(dx, dy);

        if (distance > 1) {
            const step = Math.min(speed, distance);
            player2.x += dx / distance * step;
            player2.y += dy / distance * step;
        }

        limitPlayer(player2);

        player2.vx = player2.x - oldX;
        player2.vy = player2.y - oldY;
    }

    function goal(blueScored) {
        if (blueScored) {
            scoreBlue++;
        } else {
            scoreRed++;
        }

        updateScore();
        GameBox.vibrate(80);

        const blueName = GameBox.name(1);
        const redName = mode === "ai" ? "ИИ" : GameBox.name(2);

        if (scoreBlue >= WIN_SCORE || scoreRed >= WIN_SCORE) {
            running = false;

            const blueWon = scoreBlue >= WIN_SCORE;

            statusElement.textContent = blueWon
                ? `🏆 Победил ${blueName}! Нажми на поле, чтобы сыграть ещё.`
                : `🏆 Победил ${redName}! Нажми на поле, чтобы сыграть ещё.`;

            if (mode === "ai") {
                GameBox.sound(blueWon ? "win" : "lose");
                GameBox.win(blueWon ? blueName : GameBox.aiName);
            } else {
                GameBox.sound("win");
                GameBox.win(blueWon ? blueName : GameBox.name(2));
            }

            return;
        }

        statusElement.textContent = blueScored
            ? `Гол! ${blueName} ${scoreBlue} : ${scoreRed} ${redName}`
            : `Гол! ${blueName} ${scoreBlue} : ${scoreRed} ${redName}`;

        GameBox.sound(mode === "ai" && !blueScored ? "error" : "score");

        resetMallets();
        resetPuck(blueScored ? -1 : 1);
    }

    function update() {
        if (!running) return false;

        updatePlayer(
            player1,
            mode === "ai" ? ["KeyW", "ArrowUp"] : ["KeyW"],
            mode === "ai" ? ["KeyS", "ArrowDown"] : ["KeyS"],
            mode === "ai" ? ["KeyA", "ArrowLeft"] : ["KeyA"],
            mode === "ai" ? ["KeyD", "ArrowRight"] : ["KeyD"]
        );

        if (mode === "ai") {
            updateAI();
        } else {
            updatePlayer(
                player2,
                ["ArrowUp"],
                ["ArrowDown"],
                ["ArrowLeft"],
                ["ArrowRight"]
            );
        }

        if (serveDelay > 0) {
            serveDelay--;
            collideWithPlayer(player1);
            collideWithPlayer(player2);
            return;
        }

        // Подшаги, чтобы быстрая шайба не пролетала сквозь биту.
        const steps = 3;

        for (let i = 0; i < steps; i++) {
            puck.x += puck.vx / steps;
            puck.y += puck.vy / steps;

            if (puck.x - puck.radius < WALL) {
                puck.x = WALL + puck.radius;
                puck.vx = Math.abs(puck.vx) * 0.92;
                wallSound();
            }

            if (puck.x + puck.radius > W - WALL) {
                puck.x = W - WALL - puck.radius;
                puck.vx = -Math.abs(puck.vx) * 0.92;
                wallSound();
            }

            const inGoal = Math.abs(puck.x - W / 2) < GOAL_HALF;

            if (puck.y - puck.radius < WALL) {
                if (inGoal) {
                    if (puck.y < WALL) {
                        goal(true);
                        return;
                    }
                } else {
                    puck.y = WALL + puck.radius;
                    puck.vy = Math.abs(puck.vy) * 0.92;
                    wallSound();
                }
            }

            if (puck.y + puck.radius > H - WALL) {
                if (inGoal) {
                    if (puck.y > H - WALL) {
                        goal(false);
                        return;
                    }
                } else {
                    puck.y = H - WALL - puck.radius;
                    puck.vy = -Math.abs(puck.vy) * 0.92;
                    wallSound();
                }
            }

            collideWithPlayer(player1);
            collideWithPlayer(player2);
        }

        puck.vx *= 0.995;
        puck.vy *= 0.995;
    }

    function wallSound() {
        if (Math.hypot(puck.vx, puck.vy) > 2) {
            hitSound("move");
        }
    }

    function hitSound(name) {
        const now = performance.now();

        if (now - lastHitSound > 70) {
            lastHitSound = now;
            GameBox.sound(name);
        }
    }

    function collideWithPlayer(player) {
        const dx = puck.x - player.x;
        const dy = puck.y - player.y;

        const distance =
            Math.hypot(dx, dy);

        const minDistance =
            puck.radius + player.radius;

        if (
            distance === 0 ||
            distance >= minDistance
        ) {
            return;
        }

        const nx = dx / distance;
        const ny = dy / distance;

        puck.x =
            player.x +
            nx * minDistance;

        puck.y =
            player.y +
            ny * minDistance;

        // Отражение относительно движущейся биты + передача её скорости.
        const relativeVx = puck.vx - player.vx;
        const relativeVy = puck.vy - player.vy;
        const along = relativeVx * nx + relativeVy * ny;

        if (along < 0) {
            puck.vx -= 1.9 * along * nx;
            puck.vy -= 1.9 * along * ny;
        }

        puck.vx += player.vx * 0.6;
        puck.vy += player.vy * 0.6;

        const speed = Math.hypot(puck.vx, puck.vy);

        if (speed > puck.maxSpeed) {
            puck.vx = puck.vx / speed * puck.maxSpeed;
            puck.vy = puck.vy / speed * puck.maxSpeed;
        }

        if (speed > 1) hitSound("bounce");
    }

    function drawTable() {
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, W, H);

        ctx.strokeStyle = "#333";
        ctx.lineWidth = 4;

        ctx.strokeRect(
            WALL,
            WALL,
            W - WALL * 2,
            H - WALL * 2
        );

        ctx.beginPath();

        ctx.moveTo(WALL, H / 2);
        ctx.lineTo(W - WALL, H / 2);

        ctx.strokeStyle = "#222";
        ctx.stroke();

        ctx.beginPath();

        ctx.arc(
            W / 2,
            H / 2,
            75,
            0,
            Math.PI * 2
        );

        ctx.strokeStyle = "#222";
        ctx.stroke();

        ctx.fillStyle = "#1a1a1a";

        ctx.fillRect(
            W / 2 - GOAL_HALF,
            0,
            GOAL_HALF * 2,
            WALL + 4
        );

        ctx.fillRect(
            W / 2 - GOAL_HALF,
            H - WALL - 4,
            GOAL_HALF * 2,
            WALL + 4
        );

        ctx.fillStyle = "#e54848";
        ctx.fillRect(W / 2 - GOAL_HALF, 0, GOAL_HALF * 2, 3);

        ctx.fillStyle = "#3f8ff5";
        ctx.fillRect(W / 2 - GOAL_HALF, H - 3, GOAL_HALF * 2, 3);
    }

    function drawPlayer(player) {
        ctx.beginPath();

        ctx.arc(
            player.x,
            player.y,
            player.radius,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            player.color;

        ctx.fill();

        ctx.beginPath();

        ctx.arc(
            player.x,
            player.y,
            player.radius - 8,
            0,
            Math.PI * 2
        );

        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    function drawPuck() {
        ctx.beginPath();

        ctx.arc(
            puck.x,
            puck.y,
            puck.radius,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = "#eee";
        ctx.fill();

        ctx.strokeStyle = "#777";
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    function draw() {
        drawTable();
        drawPlayer(player1);
        drawPlayer(player2);
        drawPuck();

        if (!running) {
            ctx.fillStyle = "rgba(0, 0, 0, .55)";
            ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = "#fff";
            ctx.font = "bold 34px Arial";
            ctx.textAlign = "center";
            ctx.fillText(`${scoreBlue} : ${scoreRed}`, W / 2, H / 2 - 10);
            ctx.font = "20px Arial";
            ctx.fillText("Нажми, чтобы сыграть ещё", W / 2, H / 2 + 28);
        }
    }

    const loop = GameBox.loop(update, draw);

    // Управление пальцами/мышью. Во «вдвоём» нижняя половина - синий,
    // верхняя - красный, работает мультитач.
    function pointerOwner(point) {
        if (mode === "ai") return player1;

        return point.y > H / 2 ? player1 : player2;
    }

    function pointerDown(event) {
        event.preventDefault();

        if (!running) {
            reset();
            return;
        }

        try {
            canvas.setPointerCapture(event.pointerId);
        } catch (error) {}

        const point = GameBox.point(canvas, event);
        const player = pointerOwner(point);

        pointers.set(event.pointerId, player);
        player.target = point;
    }

    function pointerMove(event) {
        const point = GameBox.point(canvas, event);

        if (pointers.has(event.pointerId)) {
            pointers.get(event.pointerId).target = point;
            return;
        }

        // Мышь без нажатия тоже управляет синей битой.
        if (event.pointerType === "mouse" && running) {
            const player = pointerOwner(point);

            if (mode === "ai" || player === player1) {
                player1.target = point;
            }
        }
    }

    function pointerUp(event) {
        const player = pointers.get(event.pointerId);

        if (player && event.pointerType !== "mouse") {
            player.target = null;
        }

        pointers.delete(event.pointerId);
    }

    function pointerLeave(event) {
        if (event.pointerType === "mouse" && !pointers.has(event.pointerId)) {
            player1.target = null;
        }
    }

    function keyDown(event) {
        if (
            [
                "ArrowUp",
                "ArrowDown",
                "ArrowLeft",
                "ArrowRight",
                "KeyW",
                "KeyA",
                "KeyS",
                "KeyD"
            ].includes(event.code)
        ) {
            event.preventDefault();
            keys[event.code] = true;

            player1.target = null;

            if (mode === "two" && event.code.startsWith("Arrow")) {
                player2.target = null;
            }
        }

        if (!running && (event.code === "Space" || event.code === "Enter")) {
            event.preventDefault();
            reset();
        }
    }

    function keyUp(event) {
        keys[event.code] = false;
    }

    function blur() {
        Object.keys(keys).forEach(key => {
            keys[key] = false;
        });
    }

    // Стрелки на экране: синий управляет как WASD, красный - как стрелки.
    const DPAD_KEYS = {
        1: { up: "KeyW", down: "KeyS", left: "KeyA", right: "KeyD" },
        2: { up: "ArrowUp", down: "ArrowDown", left: "ArrowLeft", right: "ArrowRight" }
    };

    root.querySelectorAll(".hockey-controls .mobile-dpad").forEach(pad => {
        const player = Number(pad.dataset.player);

        pad.querySelectorAll(".mobile-control").forEach(button => {
            const code = DPAD_KEYS[player][button.dataset.dir];

            GameBox.hold(
                button,
                () => {
                    keys[code] = true;
                    (player === 1 ? player1 : player2).target = null;
                },
                () => {
                    keys[code] = false;
                }
            );
        });
    });

    const redPad = root.querySelector(".hockey-dpad-red");

    function updateControls() {
        redPad.classList.toggle("hidden", mode === "ai");
    }

    canvas.addEventListener("pointerdown", pointerDown);
    canvas.addEventListener("pointermove", pointerMove);
    canvas.addEventListener("pointerup", pointerUp);
    canvas.addEventListener("pointercancel", pointerUp);
    canvas.addEventListener("pointerleave", pointerLeave);

    window.addEventListener(
        "keydown",
        keyDown
    );

    window.addEventListener(
        "keyup",
        keyUp
    );

    window.addEventListener("blur", blur);

    restartButton.addEventListener(
        "click",
        reset
    );

    modeButtons.forEach(button => {
        button.addEventListener("click", () => {
            mode = button.dataset.mode;

            modeButtons.forEach(item => {
                item.classList.toggle("active", item === button);
            });

            reset();
        });
    });

    reset();

    return function cleanup() {
        loop.stop();

        window.removeEventListener(
            "keydown",
            keyDown
        );

        window.removeEventListener(
            "keyup",
            keyUp
        );

        window.removeEventListener("blur", blur);
    };
};