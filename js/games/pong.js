window.createPong = function(root) {
    const box = document.createElement("div");
    box.className = "game-box pong-game";

    box.innerHTML = `
        <div class="game-toolbar">
            <strong>Pong</strong>
            <button class="game-button pong-restart">Заново</button>
        </div>

        <div class="mode-switch">
            <button class="mode-button pong-mode active" data-mode="ai">
                🤖 Против ИИ
            </button>
            <button class="mode-button pong-mode" data-mode="two">
                👥 Вдвоём
            </button>
        </div>

        <div class="game-status pong-status">
            Первый до 7 очков
        </div>

        <div class="pong-wrap">
            <canvas class="pong-canvas" width="800" height="450"></canvas>

            <div class="pong-mobile-controls">
                <div class="pong-control-group">
                    <button class="pong-control" data-player="1" data-direction="up">
                        ▲
                    </button>
                    <button class="pong-control" data-player="1" data-direction="down">
                        ▼
                    </button>
                </div>

                <div class="pong-control-group player-two-controls">
                    <button class="pong-control" data-player="2" data-direction="up">
                        ▲
                    </button>
                    <button class="pong-control" data-player="2" data-direction="down">
                        ▼
                    </button>
                </div>
            </div>
        </div>
    `;

    root.appendChild(box);

    const canvas = box.querySelector(".pong-canvas");
    const ctx = canvas.getContext("2d");

    const status = box.querySelector(".pong-status");
    const restartButton = box.querySelector(".pong-restart");
    const modeButtons = box.querySelectorAll(".pong-mode");
    const controls = box.querySelectorAll(".pong-control");

    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;

    const paddleWidth = 14;
    const paddleHeight = 90;

    const playerSpeed = 6;
    const aiSpeed = 2.8;

    const winningScore = 7;

    let mode = "ai";
    let running = true;
    let animationFrame = null;

    let playerOne;
    let playerTwo;
    let ball;

    let keys = {
        w: false,
        s: false,
        ArrowUp: false,
        ArrowDown: false
    };

    let touchState = {
        player1Up: false,
        player1Down: false,
        player2Up: false,
        player2Down: false
    };

    function createState() {
        playerOne = {
            x: 25,
            y: HEIGHT / 2 - paddleHeight / 2,
            width: paddleWidth,
            height: paddleHeight,
            score: 0
        };

        playerTwo = {
            x: WIDTH - 25 - paddleWidth,
            y: HEIGHT / 2 - paddleHeight / 2,
            width: paddleWidth,
            height: paddleHeight,
            score: 0
        };

        ball = {
            x: WIDTH / 2,
            y: HEIGHT / 2,
            radius: 8,
            vx: Math.random() > 0.5 ? 3.2 : -3.2,
            vy: (Math.random() * 2 - 1) * 2.2
        };

        running = true;

        status.textContent =
            mode === "ai"
                ? "Вы против ИИ • Первый до 7 очков"
                : "Вдвоём • Игрок 1: W/S • Игрок 2: ↑/↓";
    }

    function resetBall(direction) {
        ball.x = WIDTH / 2;
        ball.y = HEIGHT / 2;

        const angle = (Math.random() * 1.2 - 0.6);

        ball.vx = direction * 3.2;
        ball.vy = Math.sin(angle) * 3.2;
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function movePlayerOne() {
        let direction = 0;

        if (keys.w || touchState.player1Up) {
            direction -= 1;
        }

        if (keys.s || touchState.player1Down) {
            direction += 1;
        }

        playerOne.y += direction * playerSpeed;

        playerOne.y = clamp(
            playerOne.y,
            0,
            HEIGHT - playerOne.height
        );
    }

    function movePlayerTwo() {
        if (mode === "two") {
            let direction = 0;

            if (keys.ArrowUp || touchState.player2Up) {
                direction -= 1;
            }

            if (keys.ArrowDown || touchState.player2Down) {
                direction += 1;
            }

            playerTwo.y += direction * playerSpeed;

            playerTwo.y = clamp(
                playerTwo.y,
                0,
                HEIGHT - playerTwo.height
            );

            return;
        }

        const paddleCenter =
            playerTwo.y + playerTwo.height / 2;

        const target = ball.y;

        if (target < paddleCenter - 25) {
            playerTwo.y -= aiSpeed;
        } else if (target > paddleCenter + 25) {
            playerTwo.y += aiSpeed;
        }

        playerTwo.y = clamp(
            playerTwo.y,
            0,
            HEIGHT - playerTwo.height
        );
    }

    function circleHitsPaddle(paddle) {
        return (
            ball.x - ball.radius < paddle.x + paddle.width &&
            ball.x + ball.radius > paddle.x &&
            ball.y - ball.radius < paddle.y + paddle.height &&
            ball.y + ball.radius > paddle.y
        );
    }

    function bounceFromPaddle(paddle, direction) {
        const paddleCenter =
            paddle.y + paddle.height / 2;

        const relative =
            (ball.y - paddleCenter) /
            (paddle.height / 2);

        const maxBounce = Math.PI / 3;

        const angle = relative * maxBounce;

        const speed = Math.min(
            8,
            Math.sqrt(
                ball.vx * ball.vx +
                ball.vy * ball.vy
            ) + 0.15
        );

        ball.vx = direction * speed * Math.cos(angle);
        ball.vy = speed * Math.sin(angle);

        if (direction === 1) {
            ball.x = paddle.x + paddle.width + ball.radius;
        } else {
            ball.x = paddle.x - ball.radius;
        }
    }

    function updateBall() {
        ball.x += ball.vx;
        ball.y += ball.vy;

        if (ball.y - ball.radius <= 0) {
            ball.y = ball.radius;
            ball.vy *= -1;
        }

        if (ball.y + ball.radius >= HEIGHT) {
            ball.y = HEIGHT - ball.radius;
            ball.vy *= -1;
        }

        if (
            ball.vx < 0 &&
            circleHitsPaddle(playerOne)
        ) {
            bounceFromPaddle(playerOne, 1);
        }

        if (
            ball.vx > 0 &&
            circleHitsPaddle(playerTwo)
        ) {
            bounceFromPaddle(playerTwo, -1);
        }

        if (ball.x < -ball.radius) {
            playerTwo.score++;

            if (playerTwo.score >= winningScore) {
                finishGame(2);
                return;
            }

            resetBall(-1);
        }

        if (ball.x > WIDTH + ball.radius) {
            playerOne.score++;

            if (playerOne.score >= winningScore) {
                finishGame(1);
                return;
            }

            resetBall(1);
        }
    }

    function finishGame(player) {
        running = false;

        if (mode === "ai") {
            status.textContent =
                player === 1
                    ? "🏆 Вы победили!"
                    : "🤖 ИИ победил!";
        } else {
            status.textContent =
                player === 1
                    ? "🏆 Победил игрок 1!"
                    : "🏆 Победил игрок 2!";
        }
    }

    function drawBackground() {
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, WIDTH, HEIGHT);

        ctx.strokeStyle = "#222";
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 14]);

        ctx.beginPath();
        ctx.moveTo(WIDTH / 2, 0);
        ctx.lineTo(WIDTH / 2, HEIGHT);
        ctx.stroke();

        ctx.setLineDash([]);
    }

    function drawPaddle(paddle) {
        ctx.fillStyle = "#fff";

        ctx.fillRect(
            paddle.x,
            paddle.y,
            paddle.width,
            paddle.height
        );
    }

    function drawBall() {
        ctx.beginPath();

        ctx.arc(
            ball.x,
            ball.y,
            ball.radius,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = "#fff";
        ctx.fill();
    }

    function drawScore() {
        ctx.fillStyle = "#fff";
        ctx.font = "bold 48px Arial";
        ctx.textAlign = "center";

        ctx.fillText(
            playerOne.score,
            WIDTH / 2 - 70,
            60
        );

        ctx.fillText(
            playerTwo.score,
            WIDTH / 2 + 70,
            60
        );
    }

    function drawLabels() {
        ctx.fillStyle = "#777";
        ctx.font = "14px Arial";
        ctx.textAlign = "center";

        ctx.fillText(
            "PLAYER 1",
            WIDTH / 2 - 70,
            82
        );

        ctx.fillText(
            mode === "ai" ? "AI" : "PLAYER 2",
            WIDTH / 2 + 70,
            82
        );
    }

    function draw() {
        drawBackground();
        drawScore();
        drawLabels();
        drawPaddle(playerOne);
        drawPaddle(playerTwo);
        drawBall();
    }

    function updateStatus() {
        if (!running) {
            return;
        }

        if (mode === "ai") {
            status.textContent =
                `Вы ${playerOne.score} : ${playerTwo.score} ИИ`;
        } else {
            status.textContent =
                `Игрок 1 ${playerOne.score} : ${playerTwo.score} Игрок 2`;
        }
    }

    function loop() {
        if (running) {
            movePlayerOne();
            movePlayerTwo();
            updateBall();
            updateStatus();
        }

        draw();

        animationFrame = requestAnimationFrame(loop);
    }

    function setMode(newMode) {
        mode = newMode;

        modeButtons.forEach(button => {
            button.classList.toggle(
                "active",
                button.dataset.mode === mode
            );
        });

        createState();
    }

    function handleKeyDown(event) {
        const key = event.key;

        if (
            key === "ArrowUp" ||
            key === "ArrowDown"
        ) {
            event.preventDefault();
        }

        if (key.toLowerCase() === "w") {
            keys.w = true;
        }

        if (key.toLowerCase() === "s") {
            keys.s = true;
        }

        if (key === "ArrowUp") {
            keys.ArrowUp = true;
        }

        if (key === "ArrowDown") {
            keys.ArrowDown = true;
        }

        if (key === " ") {
            if (!running) {
                createState();
            }
        }
    }

    function handleKeyUp(event) {
        const key = event.key;

        if (key.toLowerCase() === "w") {
            keys.w = false;
        }

        if (key.toLowerCase() === "s") {
            keys.s = false;
        }

        if (key === "ArrowUp") {
            keys.ArrowUp = false;
        }

        if (key === "ArrowDown") {
            keys.ArrowDown = false;
        }
    }

    function setTouch(player, direction, value) {
        if (player === 1 && direction === "up") {
            touchState.player1Up = value;
        }

        if (player === 1 && direction === "down") {
            touchState.player1Down = value;
        }

        if (player === 2 && direction === "up") {
            touchState.player2Up = value;
        }

        if (player === 2 && direction === "down") {
            touchState.player2Down = value;
        }
    }

    function handleControlStart(event) {
        event.preventDefault();

        const button = event.currentTarget;

        setTouch(
            Number(button.dataset.player),
            button.dataset.direction,
            true
        );
    }

    function handleControlEnd(event) {
        event.preventDefault();

        const button = event.currentTarget;

        setTouch(
            Number(button.dataset.player),
            button.dataset.direction,
            false
        );
    }

    modeButtons.forEach(button => {
        button.addEventListener("click", () => {
            setMode(button.dataset.mode);
        });
    });

    restartButton.addEventListener("click", () => {
        createState();
    });

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    controls.forEach(button => {
        button.addEventListener(
            "pointerdown",
            handleControlStart
        );

        button.addEventListener(
            "pointerup",
            handleControlEnd
        );

        button.addEventListener(
            "pointercancel",
            handleControlEnd
        );

        button.addEventListener(
            "pointerleave",
            handleControlEnd
        );
    });

    createState();
    draw();
    loop();

    return function cleanup() {
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
        }

        window.removeEventListener(
            "keydown",
            handleKeyDown
        );

        window.removeEventListener(
            "keyup",
            handleKeyUp
        );

        controls.forEach(button => {
            button.removeEventListener(
                "pointerdown",
                handleControlStart
            );

            button.removeEventListener(
                "pointerup",
                handleControlEnd
            );

            button.removeEventListener(
                "pointercancel",
                handleControlEnd
            );

            button.removeEventListener(
                "pointerleave",
                handleControlEnd
            );
        });
    };
};