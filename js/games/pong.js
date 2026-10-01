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
    let serveDelay = 0;

    const touchTargets = new Map();
    const mobileControls = box.querySelector(".pong-mobile-controls");

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
        serveDelay = 45;

        mobileControls.classList.toggle("single", mode === "ai");

        status.textContent =
            mode === "ai"
                ? "Вы против ИИ • W/S, ↑/↓ или палец на поле"
                : "Вдвоём • Игрок 1: W/S • Игрок 2: ↑/↓ • или пальцы на своей половине";
    }

    function resetBall(direction) {
        ball.x = WIDTH / 2;
        ball.y = HEIGHT / 2;

        const angle = (Math.random() * 1.2 - 0.6);

        ball.vx = direction * 3.2;
        ball.vy = Math.sin(angle) * 3.2;

        serveDelay = 40;
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function moveTowards(paddle, targetY) {
        const center = paddle.y + paddle.height / 2;
        const diff = targetY - center;

        paddle.y += Math.max(-playerSpeed * 1.6, Math.min(playerSpeed * 1.6, diff));
    }

    function touchTarget(player) {
        for (const target of touchTargets.values()) {
            if (target.player === player) return target.y;
        }

        return null;
    }

    function movePlayerOne() {
        let direction = 0;

        const upKey = mode === "ai" ? keys.w || keys.ArrowUp : keys.w;
        const downKey = mode === "ai" ? keys.s || keys.ArrowDown : keys.s;

        if (upKey || touchState.player1Up) {
            direction -= 1;
        }

        if (downKey || touchState.player1Down) {
            direction += 1;
        }

        const target = touchTarget(1);

        if (target !== null && direction === 0) {
            moveTowards(playerOne, target);
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

            const target = touchTarget(2);

            if (target !== null && direction === 0) {
                moveTowards(playerTwo, target);
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

        // ИИ следит за мячом, когда тот летит к нему, иначе возвращается в центр.
        const target = ball.vx > 0 ? ball.y : HEIGHT / 2;
        const speed = aiSpeed + Math.min(1.6, (playerOne.score + playerTwo.score) * 0.08);

        if (target < paddleCenter - 20) {
            playerTwo.y -= speed;
        } else if (target > paddleCenter + 20) {
            playerTwo.y += speed;
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
        if (serveDelay > 0) {
            serveDelay--;
            return;
        }

        ball.x += ball.vx;
        ball.y += ball.vy;

        if (ball.y - ball.radius <= 0) {
            ball.y = ball.radius;
            ball.vy = Math.abs(ball.vy);
            GameBox.sound("move");
        }

        if (ball.y + ball.radius >= HEIGHT) {
            ball.y = HEIGHT - ball.radius;
            ball.vy = -Math.abs(ball.vy);
            GameBox.sound("move");
        }

        if (
            ball.vx < 0 &&
            circleHitsPaddle(playerOne)
        ) {
            bounceFromPaddle(playerOne, 1);
            GameBox.sound("bounce");
        }

        if (
            ball.vx > 0 &&
            circleHitsPaddle(playerTwo)
        ) {
            bounceFromPaddle(playerTwo, -1);
            GameBox.sound("bounce");
        }

        if (ball.x < -ball.radius) {
            playerTwo.score++;
            GameBox.sound(mode === "ai" ? "error" : "score");

            if (playerTwo.score >= winningScore) {
                finishGame(2);
                return;
            }

            resetBall(-1);
        }

        if (ball.x > WIDTH + ball.radius) {
            playerOne.score++;
            GameBox.sound("score");

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
                    ? "🏆 Вы победили! Пробел или «Заново» - ещё раз."
                    : "🤖 ИИ победил! Пробел или «Заново» - ещё раз.";

            GameBox.sound(player === 1 ? "win" : "lose");
            GameBox.win(player === 1 ? GameBox.name(1) : GameBox.aiName);
        } else {
            status.textContent =
                `🏆 Победил ${GameBox.name(player)}!`;

            GameBox.sound("win");
            GameBox.win(GameBox.name(player));
        }

        GameBox.vibrate(100);
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
            GameBox.name(1),
            WIDTH / 2 - 70,
            82
        );

        ctx.fillText(
            mode === "ai" ? "AI" : GameBox.name(2),
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

        if (!running) {
            ctx.fillStyle = "rgba(0, 0, 0, .55)";
            ctx.fillRect(0, 0, WIDTH, HEIGHT);

            ctx.fillStyle = "#fff";
            ctx.font = "bold 34px Arial";
            ctx.textAlign = "center";
            ctx.fillText("Нажми, чтобы сыграть ещё", WIDTH / 2, HEIGHT / 2 + 12);
        }
    }

    let lastStatus = "";

    function updateStatus() {
        if (!running) {
            return;
        }

        const text = mode === "ai"
            ? `Вы ${playerOne.score} : ${playerTwo.score} ИИ`
            : `${GameBox.name(1)} ${playerOne.score} : ${playerTwo.score} ${GameBox.name(2)}`;

        if (text !== lastStatus) {
            status.textContent = text;
            lastStatus = text;
        }
    }

    function step() {
        if (running) {
            movePlayerOne();
            movePlayerTwo();
            updateBall();
        }
    }

    const loop = GameBox.loop(step, () => {
        updateStatus();
        draw();
    });

    function setMode(newMode) {
        mode = newMode;

        modeButtons.forEach(button => {
            button.classList.toggle(
                "active",
                button.dataset.mode === mode
            );
        });

        lastStatus = "";
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
            event.preventDefault();

            if (!running) {
                lastStatus = "";
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

    controls.forEach(button => {
        const player = Number(button.dataset.player);
        const direction = button.dataset.direction;

        GameBox.hold(
            button,
            () => setTouch(player, direction, true),
            () => setTouch(player, direction, false)
        );
    });

    // Палец на поле: ракетка следует за ним. Во «вдвоём» каждый
    // игрок управляет своей половиной экрана (работает мультитач).
    function canvasDown(event) {
        event.preventDefault();

        if (!running) {
            lastStatus = "";
            createState();
            return;
        }

        try {
            canvas.setPointerCapture(event.pointerId);
        } catch (error) {}

        const point = GameBox.point(canvas, event);
        const player = mode === "two" && point.x > WIDTH / 2 ? 2 : 1;

        touchTargets.set(event.pointerId, { player, y: point.y });
    }

    function canvasMove(event) {
        const target = touchTargets.get(event.pointerId);

        if (!target) return;

        target.y = GameBox.point(canvas, event).y;
    }

    function canvasUp(event) {
        touchTargets.delete(event.pointerId);
    }

    canvas.addEventListener("pointerdown", canvasDown);
    canvas.addEventListener("pointermove", canvasMove);
    canvas.addEventListener("pointerup", canvasUp);
    canvas.addEventListener("pointercancel", canvasUp);

    function handleBlur() {
        Object.keys(keys).forEach(key => {
            keys[key] = false;
        });
    }

    modeButtons.forEach(button => {
        button.addEventListener("click", () => {
            setMode(button.dataset.mode);
        });
    });

    restartButton.addEventListener("click", () => {
        lastStatus = "";
        createState();
    });

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);

    createState();
    draw();
    loop.start();

    return function cleanup() {
        loop.stop();

        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("keyup", handleKeyUp);
        window.removeEventListener("blur", handleBlur);
    };
};