window.createBreakout = function(root) {
    root.innerHTML = `
        <div class="game-box">
            <div class="game-toolbar">
                <strong>
                    Счёт:
                    <span class="breakout-score">0</span>
                    · Жизни: <span class="breakout-lives">3</span>
                </strong>

                <button class="game-button breakout-restart">
                    Заново
                </button>
            </div>

            <canvas
                class="game-canvas breakout-canvas"
                width="720"
                height="480"
            ></canvas>

            <p class="game-status breakout-status">
                A / D или ← / →, мышь или палец. Пробел или тап - запуск мяча.
            </p>

            <div class="mobile-game-controls">
                <button
                    class="mobile-game-button breakout-left"
                    aria-label="Влево"
                >←</button>

                <button
                    class="mobile-game-button breakout-right"
                    aria-label="Вправо"
                >→</button>
            </div>
        </div>
    `;

    const canvas =
        root.querySelector(
            ".breakout-canvas"
        );

    const ctx =
        canvas.getContext("2d");

    const scoreElement =
        root.querySelector(
            ".breakout-score"
        );

    const statusElement =
        root.querySelector(
            ".breakout-status"
        );

    const restartButton =
        root.querySelector(
            ".breakout-restart"
        );

    const leftButton =
        root.querySelector(
            ".breakout-left"
        );

    const rightButton =
        root.querySelector(
            ".breakout-right"
        );

    const livesElement =
        root.querySelector(
            ".breakout-lives"
        );

    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;

    const paddle = {
        width: 110,
        height: 14,
        x: WIDTH / 2 - 55,
        y: HEIGHT - 35,
        speed: 8
    };

    const ball = {
        radius: 8,
        x: WIDTH / 2,
        y: HEIGHT - 60,
        dx: 3.2,
        dy: -3.2
    };

    const BRICK_ROWS = 5;
    const BRICK_COLS = 10;
    const BRICK_WIDTH = 62;
    const BRICK_HEIGHT = 22;
    const BRICK_GAP = 7;

    const ROW_COLORS = [
        "#e57373",
        "#ffb74d",
        "#fff176",
        "#81c784",
        "#64b5f6"
    ];

    let bricks = [];
    let score = 0;
    let lives = 3;
    let level = 1;
    let running = true;
    let launched = false;
    let targetX = null;

    const keys = {
        left: false,
        right: false
    };

    function createBricks() {
        bricks = [];

        const totalWidth =
            BRICK_COLS * BRICK_WIDTH +
            (BRICK_COLS - 1) * BRICK_GAP;

        const startX =
            (WIDTH - totalWidth) / 2;

        for (
            let row = 0;
            row < BRICK_ROWS;
            row++
        ) {
            for (
                let col = 0;
                col < BRICK_COLS;
                col++
            ) {
                bricks.push({
                    x:
                        startX +
                        col *
                            (BRICK_WIDTH +
                                BRICK_GAP),

                    y:
                        45 +
                        row *
                            (BRICK_HEIGHT +
                                BRICK_GAP),

                    width: BRICK_WIDTH,
                    height: BRICK_HEIGHT,
                    color: ROW_COLORS[row % ROW_COLORS.length],
                    points: BRICK_ROWS - row,
                    alive: true
                });
            }
        }
    }

    function ballSpeed() {
        return Math.min(9, 5 + (level - 1) * 0.6);
    }

    function resetBall() {
        launched = false;

        ball.x = paddle.x + paddle.width / 2;
        ball.y = paddle.y - ball.radius - 1;
        ball.dx = 0;
        ball.dy = 0;
    }

    function launch() {
        if (!running || launched) return;

        launched = true;

        const angle = (Math.random() * 0.6 - 0.3);
        const speed = ballSpeed();

        ball.dx = Math.sin(angle) * speed;
        ball.dy = -Math.cos(angle) * speed;

        GameBox.sound("bounce");
    }

    function reset() {
        loop.stop();

        score = 0;
        lives = 3;
        level = 1;
        running = true;
        targetX = null;

        scoreElement.textContent = "0";
        livesElement.textContent = "3";

        statusElement.textContent =
            "A / D или ← / →, мышь или палец. Пробел или тап - запуск мяча.";

        paddle.x =
            WIDTH / 2 -
            paddle.width / 2;

        createBricks();
        resetBall();

        loop.start();
    }

    function updatePaddle() {
        if (keys.left) {
            paddle.x -= paddle.speed;
            targetX = null;
        }

        if (keys.right) {
            paddle.x += paddle.speed;
            targetX = null;
        }

        if (targetX !== null) {
            const diff = targetX - (paddle.x + paddle.width / 2);
            paddle.x += Math.max(-paddle.speed * 2, Math.min(paddle.speed * 2, diff));
        }

        paddle.x = Math.max(
            0,
            Math.min(
                WIDTH - paddle.width,
                paddle.x
            )
        );
    }

    function updateBall() {
        if (!launched) {
            ball.x = paddle.x + paddle.width / 2;
            ball.y = paddle.y - ball.radius - 1;
            return;
        }

        ball.x += ball.dx;
        ball.y += ball.dy;

        if (ball.x - ball.radius <= 0) {
            ball.x = ball.radius;
            ball.dx = Math.abs(ball.dx);
            GameBox.sound("move");
        }

        if (ball.x + ball.radius >= WIDTH) {
            ball.x = WIDTH - ball.radius;
            ball.dx = -Math.abs(ball.dx);
            GameBox.sound("move");
        }

        if (ball.y - ball.radius <= 0) {
            ball.y = ball.radius;
            ball.dy = Math.abs(ball.dy);
            GameBox.sound("move");
        }

        if (
            ball.dy > 0 &&
            ball.y + ball.radius >= paddle.y &&
            ball.y - ball.radius <= paddle.y + paddle.height &&
            ball.x + ball.radius >= paddle.x &&
            ball.x - ball.radius <= paddle.x + paddle.width
        ) {
            const hitPosition =
                (ball.x - paddle.x) /
                paddle.width;

            // Угол ограничен ±60°, чтобы мяч не летал горизонтально.
            const angle =
                Math.max(-1, Math.min(1, (hitPosition - 0.5) * 2)) *
                (Math.PI / 3);

            const speed = ballSpeed();

            ball.dx = Math.sin(angle) * speed;
            ball.dy = -Math.cos(angle) * speed;
            ball.y = paddle.y - ball.radius;

            GameBox.sound("bounce");
        }

        // Разбиваем максимум один блок за шаг и отражаем по нужной оси.
        for (const brick of bricks) {
            if (!brick.alive) continue;

            const closestX = Math.max(brick.x, Math.min(ball.x, brick.x + brick.width));
            const closestY = Math.max(brick.y, Math.min(ball.y, brick.y + brick.height));
            const dx = ball.x - closestX;
            const dy = ball.y - closestY;

            if (dx * dx + dy * dy > ball.radius * ball.radius) continue;

            brick.alive = false;

            score += brick.points;
            scoreElement.textContent = score;

            const overlapX = Math.min(
                ball.x + ball.radius - brick.x,
                brick.x + brick.width - (ball.x - ball.radius)
            );

            const overlapY = Math.min(
                ball.y + ball.radius - brick.y,
                brick.y + brick.height - (ball.y - ball.radius)
            );

            if (overlapX < overlapY) {
                ball.dx = ball.x < brick.x + brick.width / 2
                    ? -Math.abs(ball.dx)
                    : Math.abs(ball.dx);
            } else {
                ball.dy = ball.y < brick.y + brick.height / 2
                    ? -Math.abs(ball.dy)
                    : Math.abs(ball.dy);
            }

            GameBox.sound("hit");
            break;
        }

        if (
            bricks.every(
                brick =>
                    !brick.alive
            )
        ) {
            level++;

            statusElement.textContent =
                `Уровень ${level}! Мяч стал быстрее.`;

            GameBox.sound("win");

            createBricks();
            resetBall();

            return;
        }

        if (
            ball.y -
                ball.radius >
                HEIGHT
        ) {
            lives--;
            livesElement.textContent = lives;

            GameBox.vibrate(120);

            if (lives > 0) {
                GameBox.sound("error");
                statusElement.textContent =
                    `Мяч потерян. Осталось жизней: ${lives}`;
                resetBall();
                return;
            }

            running = false;

            statusElement.textContent =
                `Игра окончена. Счёт: ${score}. Нажми «Заново» или пробел.`;

            GameBox.sound("lose");
            GameBox.submit(score);

            draw();
            loop.stop();

            return false;
        }
    }

    function draw() {
        ctx.clearRect(
            0,
            0,
            WIDTH,
            HEIGHT
        );

        ctx.fillStyle =
            "#101310";

        ctx.fillRect(
            0,
            0,
            WIDTH,
            HEIGHT
        );

        ctx.fillStyle =
            "#f2f4f1";

        ctx.fillRect(
            paddle.x,
            paddle.y,
            paddle.width,
            paddle.height
        );

        bricks.forEach(
            brick => {
                if (!brick.alive) {
                    return;
                }

                ctx.fillStyle =
                    brick.color;

                ctx.fillRect(
                    brick.x,
                    brick.y,
                    brick.width,
                    brick.height
                );
            }
        );

        ctx.beginPath();

        ctx.arc(
            ball.x,
            ball.y,
            ball.radius,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            "#fff";

        ctx.fill();

        ctx.closePath();

        if (!running) {
            ctx.fillStyle = "rgba(0, 0, 0, .55)";
            ctx.fillRect(0, 0, WIDTH, HEIGHT);
            ctx.fillStyle = "#fff";
            ctx.font = "bold 32px Arial";
            ctx.textAlign = "center";
            ctx.fillText("GAME OVER", WIDTH / 2, HEIGHT / 2);
        } else if (!launched) {
            ctx.fillStyle = "rgba(255, 255, 255, .8)";
            ctx.font = "18px Arial";
            ctx.textAlign = "center";
            ctx.fillText("Пробел или тап - запуск", WIDTH / 2, HEIGHT / 2 + 40);
        }
    }

    function keyDown(event) {
        const key =
            event.key.toLowerCase();

        if (key === " " || key === "enter" || event.key === "ArrowUp") {
            event.preventDefault();

            if (!running) {
                reset();
            } else {
                launch();
            }

            return;
        }

        if (
            key === "a" ||
            event.key ===
                "ArrowLeft"
        ) {
            keys.left = true;
            event.preventDefault();
        }

        if (
            key === "d" ||
            event.key ===
                "ArrowRight"
        ) {
            keys.right = true;
            event.preventDefault();
        }
    }

    function keyUp(event) {
        const key =
            event.key.toLowerCase();

        if (
            key === "a" ||
            event.key ===
                "ArrowLeft"
        ) {
            keys.left = false;
            event.preventDefault();
        }

        if (
            key === "d" ||
            event.key ===
                "ArrowRight"
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
                launch();
            },
            () => {
                keys[key] = false;
            }
        );
    }

    mobileButton(leftButton, "left");
    mobileButton(rightButton, "right");

    // Ракетка следует за мышью/пальцем, тап запускает мяч.
    function pointerDown(event) {
        event.preventDefault();

        if (!running) {
            reset();
            return;
        }

        try {
            canvas.setPointerCapture(event.pointerId);
        } catch (error) {}

        targetX = GameBox.point(canvas, event).x;
        launch();
    }

    function pointerMove(event) {
        if (event.pointerType === "mouse" || event.buttons) {
            targetX = GameBox.point(canvas, event).x;
        }
    }

    function pointerUp(event) {
        if (event.pointerType !== "mouse") {
            targetX = null;
        }
    }

    canvas.addEventListener("pointerdown", pointerDown);
    canvas.addEventListener("pointermove", pointerMove);
    canvas.addEventListener("pointerup", pointerUp);
    canvas.addEventListener("pointercancel", pointerUp);

    function step() {
        if (!running) return false;

        updatePaddle();
        return updateBall();
    }

    const loop = GameBox.loop(step, draw);

    function blur() {
        keys.left = false;
        keys.right = false;
    }

    window.addEventListener("blur", blur);

    document.addEventListener(
        "keydown",
        keyDown
    );

    document.addEventListener(
        "keyup",
        keyUp
    );

    restartButton.addEventListener(
        "click",
        reset
    );

    reset();

    return function cleanup() {
        loop.stop();

        document.removeEventListener(
            "keydown",
            keyDown
        );

        document.removeEventListener(
            "keyup",
            keyUp
        );

        window.removeEventListener("blur", blur);

        restartButton.removeEventListener(
            "click",
            reset
        );
    };
};