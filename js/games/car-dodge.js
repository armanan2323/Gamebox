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
                ← → или A / D
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
    let animationId;
    let spawnTimer = 0;

    const keys = {
        left: false,
        right: false
    };

    function reset() {
        if (animationId) {
            cancelAnimationFrame(animationId);
        }

        player.x = 160;
        enemies = [];
        score = 0;
        spawnTimer = 0;
        running = true;

        scoreElement.textContent = "0";
        statusElement.textContent =
            "← → или A / D";

        loop();
    }

    function spawnEnemy() {
        const lanes = [75, 135, 195, 255];

        const lane =
            lanes[
                Math.floor(
                    Math.random() * lanes.length
                )
            ];

        enemies.push({
            x: lane,
            y: -80,
            width: 40,
            height: 70,
            speed: 3 + Math.min(score / 250, 3),
            color:
                Math.random() > 0.5
                    ? "#e53935"
                    : "#4d7cff"
        });
    }

    function update() {
        if (keys.left) {
            player.x -= player.speed;
        }

        if (keys.right) {
            player.x += player.speed;
        }

        player.x = Math.max(
            ROAD_LEFT + 10,
            Math.min(
                ROAD_RIGHT - player.width - 10,
                player.x
            )
        );

        spawnTimer++;

        if (spawnTimer > Math.max(35, 75 - score / 8)) {
            spawnEnemy();
            spawnTimer = 0;
        }

        enemies.forEach(enemy => {
            enemy.y += enemy.speed;
        });

        enemies = enemies.filter(enemy => {
            if (enemy.y > canvas.height) {
                score++;
                scoreElement.textContent = score;
                return false;
            }

            return true;
        });

        for (const enemy of enemies) {
            if (collision(player, enemy)) {
                gameOver();
                return;
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
            "Авария! Нажми «Заново».";

        draw();
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

        ctx.beginPath();
        ctx.moveTo(105, 0);
        ctx.lineTo(105, canvas.height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(165, 0);
        ctx.lineTo(165, canvas.height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(225, 0);
        ctx.lineTo(225, canvas.height);
        ctx.stroke();

        ctx.setLineDash([]);

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
        ctx.roundRect(
            x,
            y,
            width,
            height,
            8
        );
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
        const start = event => {
            event.preventDefault();
            keys[key] = true;
        };

        const stop = event => {
            event.preventDefault();
            keys[key] = false;
        };

        button.addEventListener("pointerdown", start);
        button.addEventListener("pointerup", stop);
        button.addEventListener("pointercancel", stop);
        button.addEventListener("pointerleave", stop);

        return { start, stop };
    }

    const leftHandlers =
        mobileButton(leftButton, "left");

    const rightHandlers =
        mobileButton(rightButton, "right");

    function loop() {
        if (!running) {
            draw();
            return;
        }

        update();
        draw();

        animationId =
            requestAnimationFrame(loop);
    }

    document.addEventListener("keydown", keyDown);
    document.addEventListener("keyup", keyUp);

    restartButton.addEventListener("click", reset);

    reset();

    return function cleanup() {
        cancelAnimationFrame(animationId);

        document.removeEventListener("keydown", keyDown);
        document.removeEventListener("keyup", keyUp);

        restartButton.removeEventListener("click", reset);

        leftButton.removeEventListener(
            "pointerdown",
            leftHandlers.start
        );

        leftButton.removeEventListener(
            "pointerup",
            leftHandlers.stop
        );

        leftButton.removeEventListener(
            "pointercancel",
            leftHandlers.stop
        );

        leftButton.removeEventListener(
            "pointerleave",
            leftHandlers.stop
        );

        rightButton.removeEventListener(
            "pointerdown",
            rightHandlers.start
        );

        rightButton.removeEventListener(
            "pointerup",
            rightHandlers.stop
        );

        rightButton.removeEventListener(
            "pointercancel",
            rightHandlers.stop
        );

        rightButton.removeEventListener(
            "pointerleave",
            rightHandlers.stop
        );
    };
};