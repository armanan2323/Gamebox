window.createBreakout = function(root) {
    root.innerHTML = `
        <div class="game-box">
            <div class="game-toolbar">
                <strong>
                    Счёт:
                    <span class="breakout-score">0</span>
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
                Управление: A / D или ← / →
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

    let bricks = [];
    let score = 0;
    let running = true;
    let animationId = null;

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
                    alive: true
                });
            }
        }
    }

    function reset() {
        if (animationId) {
            cancelAnimationFrame(
                animationId
            );
        }

        score = 0;
        running = true;

        scoreElement.textContent =
            "0";

        statusElement.textContent =
            "Управление: A / D или ← / →";

        paddle.x =
            WIDTH / 2 -
            paddle.width / 2;

        ball.x = WIDTH / 2;
        ball.y = HEIGHT - 60;
        ball.dx = 3.2;
        ball.dy = -3.2;

        createBricks();

        loop();
    }

    function updatePaddle() {
        if (keys.left) {
            paddle.x -= paddle.speed;
        }

        if (keys.right) {
            paddle.x += paddle.speed;
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
        ball.x += ball.dx;
        ball.y += ball.dy;

        if (
            ball.x - ball.radius <= 0 ||
            ball.x + ball.radius >= WIDTH
        ) {
            ball.dx *= -1;
        }

        if (
            ball.y - ball.radius <= 0
        ) {
            ball.dy *= -1;
        }

        if (
            ball.y + ball.radius >=
                paddle.y &&
            ball.y - ball.radius <=
                paddle.y +
                    paddle.height &&
            ball.x >= paddle.x &&
            ball.x <=
                paddle.x +
                    paddle.width &&
            ball.dy > 0
        ) {
            const hitPosition =
                (ball.x - paddle.x) /
                paddle.width;

            const angle =
                (hitPosition - 0.5) *
                2;

            const speed = 4.5;

            ball.dx =
                angle * speed;

            ball.dy =
                -Math.sqrt(
                    speed * speed -
                        ball.dx *
                            ball.dx
                );
        }

        bricks.forEach(
            brick => {
                if (!brick.alive) {
                    return;
                }

                if (
                    ball.x +
                        ball.radius >
                        brick.x &&
                    ball.x -
                        ball.radius <
                        brick.x +
                            brick.width &&
                    ball.y +
                        ball.radius >
                        brick.y &&
                    ball.y -
                        ball.radius <
                        brick.y +
                            brick.height
                ) {
                    brick.alive =
                        false;

                    score++;

                    scoreElement.textContent =
                        score;

                    ball.dy *= -1;
                }
            }
        );

        if (
            bricks.every(
                brick =>
                    !brick.alive
            )
        ) {
            running = false;

            statusElement.textContent =
                "Ты победил! Все блоки разбиты.";

            draw();

            return;
        }

        if (
            ball.y -
                ball.radius >
                HEIGHT
        ) {
            running = false;

            statusElement.textContent =
                "Игра окончена. Нажми «Заново».";

            draw();
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
            "#f7f8f6";

        ctx.fillRect(
            0,
            0,
            WIDTH,
            HEIGHT
        );

        ctx.fillStyle =
            "#222";

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
                    "#3f8f55";

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
            "#222";

        ctx.fill();

        ctx.closePath();
    }

    function keyDown(event) {
        const key =
            event.key.toLowerCase();

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

    function setMobileKey(
        key,
        value
    ) {
        return event => {
            event.preventDefault();
            keys[key] = value;
        };
    }

    const leftStart =
        setMobileKey(
            "left",
            true
        );

    const rightStart =
        setMobileKey(
            "right",
            true
        );

    const leftEnd =
        setMobileKey(
            "left",
            false
        );

    const rightEnd =
        setMobileKey(
            "right",
            false
        );

    leftButton.addEventListener(
        "pointerdown",
        leftStart
    );

    rightButton.addEventListener(
        "pointerdown",
        rightStart
    );

    leftButton.addEventListener(
        "pointerup",
        leftEnd
    );

    leftButton.addEventListener(
        "pointercancel",
        leftEnd
    );

    leftButton.addEventListener(
        "pointerleave",
        leftEnd
    );

    rightButton.addEventListener(
        "pointerup",
        rightEnd
    );

    rightButton.addEventListener(
        "pointercancel",
        rightEnd
    );

    rightButton.addEventListener(
        "pointerleave",
        rightEnd
    );

    function loop() {
        if (!running) {
            draw();
            return;
        }

        updatePaddle();
        updateBall();
        draw();

        animationId =
            requestAnimationFrame(
                loop
            );
    }

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
        if (animationId) {
            cancelAnimationFrame(
                animationId
            );
        }

        document.removeEventListener(
            "keydown",
            keyDown
        );

        document.removeEventListener(
            "keyup",
            keyUp
        );

        restartButton.removeEventListener(
            "click",
            reset
        );

        leftButton.removeEventListener(
            "pointerdown",
            leftStart
        );

        rightButton.removeEventListener(
            "pointerdown",
            rightStart
        );

        leftButton.removeEventListener(
            "pointerup",
            leftEnd
        );

        leftButton.removeEventListener(
            "pointercancel",
            leftEnd
        );

        leftButton.removeEventListener(
            "pointerleave",
            leftEnd
        );

        rightButton.removeEventListener(
            "pointerup",
            rightEnd
        );

        rightButton.removeEventListener(
            "pointercancel",
            rightEnd
        );

        rightButton.removeEventListener(
            "pointerleave",
            rightEnd
        );
    };
};