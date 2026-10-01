window.createFlappyBird = function(root) {
    root.innerHTML = `
        <div class="game-box">
            <div class="game-toolbar">
                <strong>Счёт: <span class="flappy-score">0</span></strong>
                <button class="game-button flappy-restart">Заново</button>
            </div>

            <canvas class="game-canvas flappy-canvas" width="600" height="700"></canvas>

            <div class="mobile-controls">
                <button class="flappy-jump">↑ Прыжок</button>
            </div>

            <p class="game-status flappy-status">
                Нажми пробел, Enter или кнопку, чтобы начать
            </p>
        </div>
    `;

    const canvas = root.querySelector(".flappy-canvas");
    const ctx = canvas.getContext("2d");

    const scoreElement = root.querySelector(".flappy-score");
    const statusElement = root.querySelector(".flappy-status");
    const jumpButton = root.querySelector(".flappy-jump");
    const restartButton = root.querySelector(".flappy-restart");

    const width = canvas.width;
    const height = canvas.height;

    let bird;
    let pipes;
    let score;
    let gameStarted;
    let gameOver;
    let animationId;
    let lastTime;
    let pipeTimer;
    let deathTime = 0;

    const groundHeight = 35;

    const gravity = 1500;
    const jumpPower = -470;
    const pipeSpeed = 220;
    const pipeWidth = 85;
    const pipeGap = 180;
    const pipeInterval = 1.65;
    const birdX = 130;
    const birdRadius = 18;

    function reset() {
        cancelAnimationFrame(animationId);

        bird = {
            x: birdX,
            y: height / 2,
            velocity: 0
        };

        pipes = [];
        score = 0;
        gameStarted = false;
        gameOver = false;
        lastTime = 0;
        pipeTimer = 0;

        scoreElement.textContent = "0";

        statusElement.textContent =
            "Нажми пробел, Enter или кнопку, чтобы начать";

        draw();
    }

    function start() {
        if (gameOver) {
            // Небольшая пауза после проигрыша, чтобы случайный тап не начинал игру сразу.
            if (performance.now() - deathTime < 600) return;

            reset();
        }

        if (!gameStarted) {
            gameStarted = true;
            gameOver = false;
            statusElement.textContent = "Лети между трубами!";
            lastTime = performance.now();
            animationId = requestAnimationFrame(loop);
        }

        jump();
    }

    function jump() {
        if (!gameStarted) {
            start();
            return;
        }

        if (gameOver) return;

        bird.velocity = jumpPower;
        GameBox.sound("jump");
    }

    function createPipe() {
        const minTop = 80;
        const maxTop = height - groundHeight - 120 - pipeGap;

        const topHeight =
            minTop + Math.random() * (maxTop - minTop);

        pipes.push({
            x: width,
            top: topHeight,
            passed: false
        });
    }

    function update(delta) {
        bird.velocity += gravity * delta;
        bird.y += bird.velocity * delta;

        pipeTimer += delta;

        if (pipeTimer >= pipeInterval) {
            pipeTimer = 0;
            createPipe();
        }

        for (const pipe of pipes) {
            pipe.x -= pipeSpeed * delta;

            if (!pipe.passed && pipe.x + pipeWidth < bird.x) {
                pipe.passed = true;
                score++;
                scoreElement.textContent = score;
                GameBox.sound("score");
            }
        }

        pipes = pipes.filter(
            pipe => pipe.x + pipeWidth > -20
        );

        if (bird.y - birdRadius <= 0) {
            bird.y = birdRadius;
            bird.velocity = Math.max(0, bird.velocity);
        }

        if (bird.y + birdRadius >= height - groundHeight) {
            bird.y = height - groundHeight - birdRadius;
            endGame();
            return;
        }

        // Хитбокс птицы чуть меньше картинки - так честнее.
        const r = birdRadius - 3;

        for (const pipe of pipes) {
            const hitsTop =
                bird.x + r > pipe.x - 6 &&
                bird.x - r < pipe.x + pipeWidth + 6 &&
                bird.y - r < pipe.top;

            const bottomY = pipe.top + pipeGap;

            const hitsBottom =
                bird.x + r > pipe.x - 6 &&
                bird.x - r < pipe.x + pipeWidth + 6 &&
                bird.y + r > bottomY;

            if (hitsTop || hitsBottom) {
                endGame();
                return;
            }
        }
    }

    function endGame() {
        gameOver = true;
        gameStarted = false;
        deathTime = performance.now();

        statusElement.textContent =
            `Игра окончена. Счёт: ${score}. Нажми кнопку или пробел`;

        GameBox.sound("hit");
        GameBox.vibrate(150);
        GameBox.submit(score);

        draw();
    }

    function draw() {
        ctx.clearRect(0, 0, width, height);

        drawBackground();
        drawPipes();
        drawGround();
        drawBird();

        if (!gameStarted) {
            ctx.fillStyle = "rgba(0, 0, 0, .35)";
            ctx.fillRect(0, height / 2 - 50, width, 100);
            ctx.fillStyle = "#fff";
            ctx.font = "bold 30px Arial";
            ctx.textAlign = "center";
            ctx.fillText(
                gameOver ? `Счёт: ${score} · тап - ещё раз` : "Тап или пробел - старт",
                width / 2,
                height / 2 + 10
            );
        }
    }

    function drawBackground() {
        ctx.fillStyle = "#dce9f5";
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = "#ffffff";
        ctx.globalAlpha = 0.75;

        drawCloud(100, 110, 55);
        drawCloud(400, 180, 45);
        drawCloud(520, 80, 35);

        ctx.globalAlpha = 1;

    }

    function drawGround() {
        ctx.fillStyle = "#8baa72";
        ctx.fillRect(0, height - groundHeight, width, groundHeight);

        ctx.fillStyle = "#6f9457";
        ctx.fillRect(0, height - groundHeight, width, 7);
    }

    function drawCloud(x, y, size) {
        ctx.beginPath();

        ctx.arc(x, y, size * 0.45, 0, Math.PI * 2);
        ctx.arc(
            x + size * 0.45,
            y + 5,
            size * 0.35,
            0,
            Math.PI * 2
        );
        ctx.arc(
            x - size * 0.4,
            y + 8,
            size * 0.3,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }

    function drawPipes() {
        for (const pipe of pipes) {
            const bottomY = pipe.top + pipeGap;

            ctx.fillStyle = "#69a64f";

            ctx.fillRect(
                pipe.x,
                0,
                pipeWidth,
                pipe.top
            );

            ctx.fillRect(
                pipe.x,
                bottomY,
                pipeWidth,
                height - bottomY
            );

            ctx.fillStyle = "#4f8d3b";

            ctx.fillRect(
                pipe.x - 6,
                pipe.top - 24,
                pipeWidth + 12,
                24
            );

            ctx.fillRect(
                pipe.x - 6,
                bottomY,
                pipeWidth + 12,
                24
            );


            ctx.fillStyle = "#8bc76c";

            ctx.fillRect(
                pipe.x + 10,
                0,
                10,
                Math.max(0, pipe.top - 24)
            );

            ctx.fillRect(
                pipe.x + 10,
                bottomY + 24,
                10,
                height - bottomY - 24
            );
        }
    }

    function drawBird() {
        ctx.save();

        ctx.translate(bird.x, bird.y);

        let angle = bird.velocity / 900;

        angle = Math.max(-0.5, Math.min(0.8, angle));

        ctx.rotate(angle);

        ctx.fillStyle = "#f4c542";

        ctx.beginPath();
        ctx.arc(0, 0, birdRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#fff";

        ctx.beginPath();
        ctx.arc(8, -7, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#222";

        ctx.beginPath();
        ctx.arc(10, -7, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#e58b32";

        ctx.beginPath();
        ctx.moveTo(15, 2);
        ctx.lineTo(32, 7);
        ctx.lineTo(15, 12);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "#e0a92f";

        ctx.beginPath();
        ctx.ellipse(-7, 8, 12, 7, -0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    function loop(time) {
        if (!gameStarted) {
            draw();
            return;
        }

        let delta = (time - lastTime) / 1000;

        if (delta > 0.05) {
            delta = 0.05;
        }

        lastTime = time;

        update(delta);
        draw();

        if (gameStarted) {
            animationId = requestAnimationFrame(loop);
        }
    }

    function handleKey(event) {
        if (
            event.code === "Space" ||
            event.code === "Enter" ||
            event.code === "ArrowUp"
        ) {
            event.preventDefault();
            start();
        }
    }

    function handlePointer(event) {
        event.preventDefault();
        start();
    }

    window.addEventListener("keydown", handleKey);

    jumpButton.addEventListener("pointerdown", handlePointer);

    canvas.addEventListener("pointerdown", handlePointer);

    restartButton.addEventListener("click", () => {
        deathTime = 0;
        reset();
    });

    reset();

    return function cleanup() {
        cancelAnimationFrame(animationId);

        window.removeEventListener("keydown", handleKey);

        jumpButton.removeEventListener(
            "pointerdown",
            handlePointer
        );

        canvas.removeEventListener(
            "pointerdown",
            handlePointer
        );
    };
};