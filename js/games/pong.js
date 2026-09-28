window.createPong = function(root) {
    root.innerHTML = `
        <div class="game-box">
            <div class="game-toolbar">
                <strong>
                    Игрок:
                    <span class="pong-player-score">0</span>
                    :
                    <span class="pong-ai-score">0</span>
                    ИИ
                </strong>

                <button class="game-button pong-restart">
                    Заново
                </button>
            </div>

            <canvas
                class="game-canvas pong-canvas"
                width="720"
                height="420"
            ></canvas>

            <p class="game-status pong-status">
                Управление: W / S или ↑ / ↓
            </p>

            <div class="mobile-game-controls pong-mobile-buttons">
                <button
                    class="mobile-game-button pong-up"
                    aria-label="Вверх"
                >↑</button>

                <button
                    class="mobile-game-button pong-down"
                    aria-label="Вниз"
                >↓</button>
            </div>
        </div>
    `;

    const canvas =
        root.querySelector(
            ".pong-canvas"
        );

    const ctx =
        canvas.getContext("2d");

    const playerScoreElement =
        root.querySelector(
            ".pong-player-score"
        );

    const aiScoreElement =
        root.querySelector(
            ".pong-ai-score"
        );

    const statusElement =
        root.querySelector(
            ".pong-status"
        );

    const restartButton =
        root.querySelector(
            ".pong-restart"
        );

    const upButton =
        root.querySelector(
            ".pong-up"
        );

    const downButton =
        root.querySelector(
            ".pong-down"
        );

    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;

    const paddle = {
        width: 14,
        height: 90,
        speed: 6,
        x: 25,
        y: HEIGHT / 2 - 45
    };

    const ai = {
        width: 14,
        height: 90,
        speed: 2.5,
        x: WIDTH - 39,
        y: HEIGHT / 2 - 45
    };

    const ball = {
        radius: 9,
        x: WIDTH / 2,
        y: HEIGHT / 2,
        dx: 3.2,
        dy: 2
    };

    const keys = {
        up: false,
        down: false
    };

    let playerScore = 0;
    let aiScore = 0;
    let running = true;
    let animationId = null;

    function resetBall(direction) {
        ball.x = WIDTH / 2;
        ball.y = HEIGHT / 2;

        ball.dx =
            direction * 3.2;

        ball.dy =
            (
                Math.random() > 0.5
                    ? 1
                    : -1
            ) * 1.8;
    }

    function reset() {
        if (animationId) {
            cancelAnimationFrame(
                animationId
            );
        }

        playerScore = 0;
        aiScore = 0;
        running = true;

        playerScoreElement.textContent =
            "0";

        aiScoreElement.textContent =
            "0";

        paddle.y =
            HEIGHT / 2 -
            paddle.height / 2;

        ai.y =
            HEIGHT / 2 -
            ai.height / 2;

        resetBall(
            Math.random() > 0.5
                ? 1
                : -1
        );

        statusElement.textContent =
            "Управление: W / S или ↑ / ↓";

        loop();
    }

    function updatePlayer() {
        if (keys.up) {
            paddle.y -= paddle.speed;
        }

        if (keys.down) {
            paddle.y += paddle.speed;
        }

        paddle.y = Math.max(
            0,
            Math.min(
                HEIGHT -
                    paddle.height,
                paddle.y
            )
        );
    }

    function updateAI() {
        const aiCenter =
            ai.y +
            ai.height / 2;

        const difference =
            ball.y - aiCenter;

        const deadZone = 25;

        if (
            Math.abs(difference) >
            deadZone
        ) {
            if (difference > 0) {
                ai.y += ai.speed;
            } else {
                ai.y -= ai.speed;
            }
        }

        ai.y = Math.max(
            0,
            Math.min(
                HEIGHT -
                    ai.height,
                ai.y
            )
        );
    }

    function updateBall() {
        ball.x += ball.dx;
        ball.y += ball.dy;

        if (
            ball.y -
                ball.radius <=
                0 ||
            ball.y +
                ball.radius >=
                HEIGHT
        ) {
            ball.dy *= -1;
        }

        if (
            ball.x -
                ball.radius <=
                paddle.x +
                    paddle.width &&
            ball.x +
                ball.radius >=
                paddle.x &&
            ball.y >=
                paddle.y &&
            ball.y <=
                paddle.y +
                    paddle.height &&
            ball.dx < 0
        ) {
            const relative =
                (
                    ball.y -
                    (
                        paddle.y +
                        paddle.height /
                            2
                    )
                ) /
                (
                    paddle.height /
                    2
                );

            ball.dx = 3.2;
            ball.dy =
                relative * 2.5;
        }

        if (
            ball.x +
                ball.radius >=
                ai.x &&
            ball.x -
                ball.radius <=
                ai.x +
                    ai.width &&
            ball.y >= ai.y &&
            ball.y <=
                ai.y +
                    ai.height &&
            ball.dx > 0
        ) {
            const relative =
                (
                    ball.y -
                    (
                        ai.y +
                        ai.height /
                            2
                    )
                ) /
                (
                    ai.height /
                    2
                );

            ball.dx = -3.2;
            ball.dy =
                relative * 2.5;
        }

        if (
            ball.x +
                ball.radius <
                0
        ) {
            aiScore++;

            aiScoreElement.textContent =
                aiScore;

            if (aiScore >= 7) {
                endGame(
                    "ИИ победил."
                );

                return;
            }

            resetBall(1);
        }

        if (
            ball.x -
                ball.radius >
                WIDTH
        ) {
            playerScore++;

            playerScoreElement.textContent =
                playerScore;

            if (playerScore >= 7) {
                endGame(
                    "Ты победил!"
                );

                return;
            }

            resetBall(-1);
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

        ctx.setLineDash([
            8,
            12
        ]);

        ctx.strokeStyle =
            "#c5cbc3";

        ctx.lineWidth = 2;

        ctx.beginPath();

        ctx.moveTo(
            WIDTH / 2,
            0
        );

        ctx.lineTo(
            WIDTH / 2,
            HEIGHT
        );

        ctx.stroke();

        ctx.setLineDash([]);

        ctx.fillStyle =
            "#222";

        ctx.fillRect(
            paddle.x,
            paddle.y,
            paddle.width,
            paddle.height
        );

        ctx.fillRect(
            ai.x,
            ai.y,
            ai.width,
            ai.height
        );

        ctx.beginPath();

        ctx.arc(
            ball.x,
            ball.y,
            ball.radius,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.closePath();
    }

    function endGame(message) {
        running = false;

        statusElement.textContent =
            `${message} Нажми «Заново».`;

        draw();
    }

    function keyDown(event) {
        const key =
            event.key.toLowerCase();

        if (
            key === "w" ||
            event.key === "ArrowUp"
        ) {
            keys.up = true;
            event.preventDefault();
        }

        if (
            key === "s" ||
            event.key === "ArrowDown"
        ) {
            keys.down = true;
            event.preventDefault();
        }
    }

    function keyUp(event) {
        const key =
            event.key.toLowerCase();

        if (
            key === "w" ||
            event.key === "ArrowUp"
        ) {
            keys.up = false;
            event.preventDefault();
        }

        if (
            key === "s" ||
            event.key === "ArrowDown"
        ) {
            keys.down = false;
            event.preventDefault();
        }
    }

    function holdButton(
        button,
        key
    ) {
        const start = event => {
            event.preventDefault();
            keys[key] = true;
        };

        const stop = event => {
            event.preventDefault();
            keys[key] = false;
        };

        button.addEventListener(
            "pointerdown",
            start
        );

        button.addEventListener(
            "pointerup",
            stop
        );

        button.addEventListener(
            "pointercancel",
            stop
        );

        button.addEventListener(
            "pointerleave",
            stop
        );

        return {
            start,
            stop
        };
    }

    const upHandlers =
        holdButton(
            upButton,
            "up"
        );

    const downHandlers =
        holdButton(
            downButton,
            "down"
        );

    function loop() {
        if (!running) {
            draw();
            return;
        }

        updatePlayer();
        updateAI();
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

        upButton.removeEventListener(
            "pointerdown",
            upHandlers.start
        );

        upButton.removeEventListener(
            "pointerup",
            upHandlers.stop
        );

        upButton.removeEventListener(
            "pointercancel",
            upHandlers.stop
        );

        upButton.removeEventListener(
            "pointerleave",
            upHandlers.stop
        );

        downButton.removeEventListener(
            "pointerdown",
            downHandlers.start
        );

        downButton.removeEventListener(
            "pointerup",
            downHandlers.stop
        );

        downButton.removeEventListener(
            "pointercancel",
            downHandlers.stop
        );

        downButton.removeEventListener(
            "pointerleave",
            downHandlers.stop
        );
    };
};