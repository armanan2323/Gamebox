window.createPong = function (root) {
    root.innerHTML = `
        <div class="game-box">
            <div class="game-toolbar">
                <strong>
                    <span class="player-score">0</span>
                    :
                    <span class="opponent-score">0</span>
                </strong>

                <button class="game-button pong-restart">Заново</button>
            </div>

            <div class="mode-switch">
                <button class="mode-button active" data-mode="ai">Против ИИ</button>
                <button class="mode-button" data-mode="friend">Вдвоём</button>
            </div>

            <div class="pong-wrap">
                <canvas class="pong-canvas" width="700" height="420"></canvas>
            </div>

            <div class="pong-mobile-controls">
                <div class="pong-control-group">
                    <button class="pong-control" data-control="p1-up">▲</button>
                    <button class="pong-control" data-control="p1-down">▼</button>
                </div>

                <div class="pong-control-group player-two-controls">
                    <button class="pong-control" data-control="p2-up">▲</button>
                    <button class="pong-control" data-control="p2-down">▼</button>
                </div>
            </div>

            <p class="game-status pong-status">
                Игрок 1: ↑ ↓
            </p>
        </div>
    `;

    const canvas = root.querySelector(".pong-canvas");
    const ctx = canvas.getContext("2d");

    const playerScore = root.querySelector(".player-score");
    const opponentScore = root.querySelector(".opponent-score");
    const status = root.querySelector(".pong-status");
    const restart = root.querySelector(".pong-restart");
    const modeButtons = root.querySelectorAll(".mode-button");
    const mobileControls = root.querySelectorAll(".pong-control");
    const playerTwoControls = root.querySelector(".player-two-controls");

    const player = {
        x: 20,
        y: 165,
        width: 12,
        height: 90,
        speed: 7
    };

    const opponent = {
        x: 668,
        y: 165,
        width: 12,
        height: 90,
        speed: 7
    };

    const keys = {
        p1Up: false,
        p1Down: false,
        p2Up: false,
        p2Down: false
    };

    let ball;
    let score1;
    let score2;
    let animation;
    let mode = "ai";
    let gameOver = false;

    function resetBall(direction = 1) {
        ball = {
            x: canvas.width / 2,
            y: canvas.height / 2,
            radius: 7,
            vx: 5 * direction,
            vy: Math.random() * 4 - 2
        };
    }

    function reset() {
        cancelAnimationFrame(animation);

        player.y = canvas.height / 2 - player.height / 2;
        opponent.y = canvas.height / 2 - opponent.height / 2;

        score1 = 0;
        score2 = 0;
        gameOver = false;

        playerScore.textContent = "0";
        opponentScore.textContent = "0";

        resetBall(Math.random() > .5 ? 1 : -1);

        updateStatus();
        draw();

        animation = requestAnimationFrame(update);
    }

    function updateStatus() {
        if (gameOver) return;

        if (mode === "ai") {
            status.textContent = "Игрок 1: ↑ ↓";
        } else {
            status.textContent = "Игрок 1: ↑ ↓ | Игрок 2: W S";
        }
    }

    function update() {
        if (gameOver) return;

        if (keys.p1Up) player.y -= player.speed;
        if (keys.p1Down) player.y += player.speed;

        player.y = clamp(
            player.y,
            0,
            canvas.height - player.height
        );

        if (mode === "friend") {
            if (keys.p2Up) opponent.y -= opponent.speed;
            if (keys.p2Down) opponent.y += opponent.speed;
        } else {
            const center = opponent.y + opponent.height / 2;

            if (center < ball.y - 10) {
                opponent.y += opponent.speed;
            }

            if (center > ball.y + 10) {
                opponent.y -= opponent.speed;
            }
        }

        opponent.y = clamp(
            opponent.y,
            0,
            canvas.height - opponent.height
        );

        ball.x += ball.vx;
        ball.y += ball.vy;

        if (
            ball.y - ball.radius <= 0 ||
            ball.y + ball.radius >= canvas.height
        ) {
            ball.vy *= -1;
        }

        if (hit(player)) {
            ball.x = player.x + player.width + ball.radius;
            ball.vx = Math.abs(ball.vx);
            changeAngle(player);
        }

        if (hit(opponent)) {
            ball.x = opponent.x - ball.radius;
            ball.vx = -Math.abs(ball.vx);
            changeAngle(opponent);
        }

        if (ball.x < -ball.radius) {
            score2++;
            opponentScore.textContent = score2;
            resetBall(1);
        }

        if (ball.x > canvas.width + ball.radius) {
            score1++;
            playerScore.textContent = score1;
            resetBall(-1);
        }

        if (score1 >= 5 || score2 >= 5) {
            gameOver = true;

            status.textContent =
                score1 >= 5
                    ? "Игрок 1 победил!"
                    : mode === "ai"
                        ? "ИИ победил."
                        : "Игрок 2 победил.";

            draw();
            return;
        }

        draw();
        animation = requestAnimationFrame(update);
    }

    function hit(paddle) {
        return (
            ball.x - ball.radius < paddle.x + paddle.width &&
            ball.x + ball.radius > paddle.x &&
            ball.y - ball.radius < paddle.y + paddle.height &&
            ball.y + ball.radius > paddle.y
        );
    }

    function changeAngle(paddle) {
        const center = paddle.y + paddle.height / 2;
        ball.vy = (ball.y - center) * 0.08;
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function draw() {
        ctx.fillStyle = "#161917";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = "#343934";
        ctx.setLineDash([8, 10]);

        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, 0);
        ctx.lineTo(canvas.width / 2, canvas.height);
        ctx.stroke();

        ctx.setLineDash([]);

        ctx.fillStyle = "#ffffff";

        ctx.fillRect(
            player.x,
            player.y,
            player.width,
            player.height
        );

        ctx.fillRect(
            opponent.x,
            opponent.y,
            opponent.width,
            opponent.height
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
    }

    function keydown(event) {
        if (
            event.code === "ArrowUp" ||
            event.code === "ArrowDown" ||
            event.code === "KeyW" ||
            event.code === "KeyS"
        ) {
            event.preventDefault();
        }

        if (event.code === "ArrowUp") keys.p1Up = true;
        if (event.code === "ArrowDown") keys.p1Down = true;
        if (event.code === "KeyW") keys.p2Up = true;
        if (event.code === "KeyS") keys.p2Down = true;
    }

    function keyup(event) {
        if (event.code === "ArrowUp") keys.p1Up = false;
        if (event.code === "ArrowDown") keys.p1Down = false;
        if (event.code === "KeyW") keys.p2Up = false;
        if (event.code === "KeyS") keys.p2Down = false;
    }

    function setMobileControl(control, pressed) {
        if (control === "p1-up") keys.p1Up = pressed;
        if (control === "p1-down") keys.p1Down = pressed;
        if (control === "p2-up") keys.p2Up = pressed;
        if (control === "p2-down") keys.p2Down = pressed;
    }

    function setMode(newMode) {
        mode = newMode;

        modeButtons.forEach(button => {
            button.classList.toggle(
                "active",
                button.dataset.mode === mode
            );
        });

        playerTwoControls.classList.toggle(
            "hidden-mobile-control",
            mode === "ai"
        );

        reset();
    }

    modeButtons.forEach(button => {
        button.addEventListener(
            "click",
            () => setMode(button.dataset.mode)
        );
    });

    restart.addEventListener("click", reset);

    document.addEventListener("keydown", keydown);
    document.addEventListener("keyup", keyup);

    mobileControls.forEach(button => {
        const control = button.dataset.control;

        const press = event => {
            event.preventDefault();
            setMobileControl(control, true);
        };

        const release = event => {
            event.preventDefault();
            setMobileControl(control, false);
        };

        button.addEventListener("pointerdown", press);
        button.addEventListener("pointerup", release);
        button.addEventListener("pointercancel", release);
        button.addEventListener("pointerleave", release);
    });

    setMode("ai");

    return function cleanup() {
        cancelAnimationFrame(animation);

        document.removeEventListener("keydown", keydown);
        document.removeEventListener("keyup", keyup);

        Object.keys(keys).forEach(key => {
            keys[key] = false;
        });
    };
};