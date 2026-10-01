window.createCarDodge = function(root) {
    root.innerHTML = `
        <div class="game-box">
            <div class="game-toolbar">
                <strong>
                    Счёт: <span class="car-score">0</span>
                </strong>

                <button class="game-button car-restart">
                    Заново
                </button>
            </div>

            <canvas
                class="game-canvas car-dodge-canvas"
                width="360"
                height="560"
            ></canvas>

            <p class="game-status car-status">
                ← → или A / D. На телефоне - веди пальцем по дороге.
            </p>

            <div class="mobile-game-controls">
                <button class="mobile-game-button car-left">←</button>
                <button class="mobile-game-button car-right">→</button>
            </div>
        </div>
    `;

    const canvas = root.querySelector(".car-dodge-canvas");
    const ctx = canvas.getContext("2d");

    const scoreElement = root.querySelector(".car-score");
    const statusElement = root.querySelector(".car-status");
    const restartButton = root.querySelector(".car-restart");

    const leftButton = root.querySelector(".car-left");
    const rightButton = root.querySelector(".car-right");

    const ROAD_LEFT = 45;
    const ROAD_RIGHT = 315;
    const LANES = 4;
    const LANE_WIDTH = (ROAD_RIGHT - ROAD_LEFT) / LANES;

    const player = {
        x: 160,
        y: 465,
        width: 40,
        height: 70,
        speed: 6
    };

    let enemies = [];
    let score = 0;
    let running = true;
    let spawnTimer = 0;
    let roadOffset = 0;
    let targetX = null;

    const keys = {
        left: false,
        right: false
    };

    function reset() {
        loop.stop();

        player.x = laneX(1);
        enemies = [];
        score = 0;
        spawnTimer = 0;
        roadOffset = 0;
        targetX = null;
        running = true;

        scoreElement.textContent = "0";
        statusElement.textContent =
            "← → или A / D. На телефоне - веди пальцем по дороге.";

        loop.start();
    }

    function laneX(lane) {
        return ROAD_LEFT + LANE_WIDTH * lane + (LANE_WIDTH - player.width) / 2;
    }

    function roadSpeed() {
        return 3 + Math.min(score / 25, 4);
    }

    function spawnEnemy() {
        // Не перекрываем все полосы сразу: всегда остаётся проезд.
        const blocked = new Set(
            enemies
                .filter(enemy => enemy.y < 120)
                .map(enemy => enemy.lane)
        );

        const free = [];

        for (let lane = 0; lane < LANES; lane++) {
            if (!blocked.has(lane)) free.push(lane);
        }

        if (free.length <= 1) return;

        const lane =
            free[Math.floor(Math.random() * free.length)];

        enemies.push({
            lane,
            x: laneX(lane),
            y: -80,
            width: 40,
            height: 70,
            color:
                ["#e53935", "#4d7cff", "#f4b400", "#9c5de0"][
                    Math.floor(Math.random() * 4)
                ]
        });
    }

    function update() {
        if (!running) return false;

        if (keys.left) {
            player.x -= player.speed;
            targetX = null;
        }

        if (keys.right) {
            player.x += player.speed;
            targetX = null;
        }

        if (targetX !== null) {
            const diff = targetX - player.x;
            player.x += Math.max(-player.speed * 1.4, Math.min(player.speed * 1.4, diff));
        }

        player.x = Math.max(
            ROAD_LEFT + 10,
            Math.min(
                ROAD_RIGHT - player.width - 10,
                player.x
            )
        );

        const speed = roadSpeed();

        roadOffset = (roadOffset + speed) % 50;

        spawnTimer++;

        if (spawnTimer > Math.max(30, 70 - score)) {
            spawnEnemy();
            spawnTimer = 0;
        }

        enemies.forEach(enemy => {
            enemy.y += speed;
        });

        enemies = enemies.filter(enemy => {
            if (enemy.y > canvas.height) {
                score++;
                scoreElement.textContent = score;

                if (score % 10 === 0) GameBox.sound("score");

                return false;
            }

            return true;
        });

        // Небольшой запас, чтобы касание краем не считалось аварией.
        const hitbox = {
            x: player.x + 4,
            y: player.y + 4,
            width: player.width - 8,
            height: player.height - 8
        };

        for (const enemy of enemies) {
            if (collision(hitbox, enemy)) {
                gameOver();
                return false;
            }
        }
    }

    function collision(a, b) {
        return (
            a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y
        );
    }

    function gameOver() {
        running = false;

        statusElement.textContent =
            `Авария! Счёт: ${score}. Нажми «Заново» или пробел.`;

        GameBox.sound("explode");
        GameBox.vibrate(200);
        GameBox.submit(score);

        draw();
        loop.stop();
    }

    function draw() {
        ctx.fillStyle = "#000";
        ctx.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        ctx.fillStyle = "#202020";

        ctx.fillRect(
            ROAD_LEFT,
            0,
            ROAD_RIGHT - ROAD_LEFT,
            canvas.height
        );

        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 3;
        ctx.setLineDash([25, 25]);
        ctx.lineDashOffset = -roadOffset;

        ctx.beginPath();

        for (let lane = 1; lane < LANES; lane++) {
            const x = ROAD_LEFT + LANE_WIDTH * lane;
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
        }

        ctx.stroke();

        ctx.setLineDash([]);
        ctx.lineDashOffset = 0;

        drawCar(
            player.x,
            player.y,
            player.width,
            player.height,
            "#3f8f55"
        );

        enemies.forEach(enemy => {
            drawCar(
                enemy.x,
                enemy.y,
                enemy.width,
                enemy.height,
                enemy.color
            );
        });
    }

    function drawCar(x, y, width, height, color) {
        ctx.fillStyle = color;

        ctx.beginPath();

        if (ctx.roundRect) {
            ctx.roundRect(x, y, width, height, 8);
        } else {
            ctx.rect(x, y, width, height);
        }

        ctx.fill();

        ctx.fillStyle = "#111";

        ctx.fillRect(
            x + 7,
            y + 13,
            width - 14,
            20
        );

        ctx.fillStyle = "#fff";

        ctx.fillRect(
            x + 5,
            y + 7,
            7,
            5
        );

        ctx.fillRect(
            x + width - 12,
            y + 7,
            7,
            5
        );
    }

    function keyDown(event) {
        const key = event.key.toLowerCase();

        if (!running && (key === " " || key === "enter")) {
            event.preventDefault();
            reset();
            return;
        }

        if (
            key === "a" ||
            event.key === "ArrowLeft"
        ) {
            keys.left = true;
            event.preventDefault();
        }

        if (
            key === "d" ||
            event.key === "ArrowRight"
        ) {
            keys.right = true;
            event.preventDefault();
        }
    }

    function keyUp(event) {
        const key = event.key.toLowerCase();

        if (
            key === "a" ||
            event.key === "ArrowLeft"
        ) {
            keys.left = false;
            event.preventDefault();
        }

        if (
            key === "d" ||
            event.key === "ArrowRight"
        ) {
            keys.right = false;
            event.preventDefault();
        }
    }

    function mobileButton(button, key) {
        GameBox.hold(
            button,
            () => {
                keys[key] = true;
            },
            () => {
                keys[key] = false;
            }
        );
    }

    mobileButton(leftButton, "left");
    mobileButton(rightButton, "right");

    // Управление пальцем: машина едет к точке касания.
    function steer(event) {
        if (!running) return;

        const point = GameBox.point(canvas, event);

        targetX = Math.max(
            ROAD_LEFT + 10,
            Math.min(ROAD_RIGHT - player.width - 10, point.x - player.width / 2)
        );
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

        steer(event);
    }

    function pointerMove(event) {
        if (event.buttons || event.pointerType === "touch") {
            steer(event);
        }
    }

    function pointerUp() {
        targetX = null;
    }

    canvas.addEventListener("pointerdown", pointerDown);
    canvas.addEventListener("pointermove", pointerMove);
    canvas.addEventListener("pointerup", pointerUp);
    canvas.addEventListener("pointercancel", pointerUp);

    const loop = GameBox.loop(update, draw);

    function blur() {
        keys.left = false;
        keys.right = false;
    }

    window.addEventListener("blur", blur);

    document.addEventListener("keydown", keyDown);
    document.addEventListener("keyup", keyUp);

    restartButton.addEventListener("click", reset);

    reset();

    return function cleanup() {
        loop.stop();

        document.removeEventListener("keydown", keyDown);
        document.removeEventListener("keyup", keyUp);
        window.removeEventListener("blur", blur);

        restartButton.removeEventListener("click", reset);
    };
};