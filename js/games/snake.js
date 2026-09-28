window.createSnake = function(root) {
    root.innerHTML = `
        <div class="game-box snake-game">
            <div class="game-toolbar">
                <strong>Счёт: <span class="snake-score">0</span></strong>
                <button class="game-button snake-restart">Заново</button>
            </div>

            <canvas class="game-canvas snake-canvas" width="400" height="400"></canvas>

            <p class="game-status snake-status">
                Стрелки, WASD или свайпы
            </p>

            <div class="mobile-controls snake-mobile-controls">
                <div class="mobile-dpad">
                    <button class="mobile-control snake-up">↑</button>

                    <div class="mobile-dpad-middle">
                        <button class="mobile-control snake-left">←</button>
                        <button class="mobile-control snake-down">↓</button>
                        <button class="mobile-control snake-right">→</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    const canvas = root.querySelector(".snake-canvas");
    const ctx = canvas.getContext("2d");

    const scoreElement = root.querySelector(".snake-score");
    const statusElement = root.querySelector(".snake-status");
    const restartButton = root.querySelector(".snake-restart");

    const upButton = root.querySelector(".snake-up");
    const downButton = root.querySelector(".snake-down");
    const leftButton = root.querySelector(".snake-left");
    const rightButton = root.querySelector(".snake-right");

    const SIZE = 20;
    const CELLS = 20;

    let snake;
    let food;
    let direction;
    let nextDirection;
    let score;
    let timer;
    let gameOver;

    let touchStartX = 0;
    let touchStartY = 0;

    function reset() {
        clearInterval(timer);

        snake = [
            { x: 10, y: 10 },
            { x: 9, y: 10 },
            { x: 8, y: 10 }
        ];

        direction = { x: 1, y: 0 };
        nextDirection = { x: 1, y: 0 };

        score = 0;
        gameOver = false;

        scoreElement.textContent = "0";
        statusElement.textContent =
            "Стрелки, WASD или свайпы";

        createFood();
        draw();

        timer = setInterval(update, 110);
    }

    function createFood() {
        do {
            food = {
                x: Math.floor(Math.random() * CELLS),
                y: Math.floor(Math.random() * CELLS)
            };
        } while (
            snake.some(
                part =>
                    part.x === food.x &&
                    part.y === food.y
            )
        );
    }

    function setDirection(x, y) {
        if (
            direction.x === -x &&
            direction.y === -y
        ) {
            return;
        }

        if (
            nextDirection.x === -x &&
            nextDirection.y === -y
        ) {
            return;
        }

        nextDirection = { x, y };
    }

    function update() {
        if (gameOver) return;

        direction = { ...nextDirection };

        const head = {
            x: snake[0].x + direction.x,
            y: snake[0].y + direction.y
        };

        if (
            head.x < 0 ||
            head.x >= CELLS ||
            head.y < 0 ||
            head.y >= CELLS
        ) {
            endGame();
            return;
        }

        const hitSelf = snake.some(
            part =>
                part.x === head.x &&
                part.y === head.y
        );

        if (hitSelf) {
            endGame();
            return;
        }

        snake.unshift(head);

        if (
            head.x === food.x &&
            head.y === food.y
        ) {
            score++;
            scoreElement.textContent = score;
            createFood();
        } else {
            snake.pop();
        }

        draw();
    }

    function endGame() {
        gameOver = true;
        clearInterval(timer);

        statusElement.textContent =
            "Игра окончена. Нажми «Заново».";

        draw();
    }

    function draw() {
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = "#111";
        ctx.lineWidth = 1;

        for (let i = 0; i <= CELLS; i++) {
            ctx.beginPath();
            ctx.moveTo(i * SIZE, 0);
            ctx.lineTo(i * SIZE, canvas.height);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, i * SIZE);
            ctx.lineTo(canvas.width, i * SIZE);
            ctx.stroke();
        }

        ctx.fillStyle = "#e53935";

        ctx.beginPath();
        ctx.arc(
            food.x * SIZE + SIZE / 2,
            food.y * SIZE + SIZE / 2,
            SIZE * 0.34,
            0,
            Math.PI * 2
        );
        ctx.fill();

        snake.forEach((part, index) => {
            ctx.fillStyle =
                index === 0 ? "#63b875" : "#3f8f55";

            ctx.fillRect(
                part.x * SIZE + 2,
                part.y * SIZE + 2,
                SIZE - 4,
                SIZE - 4
            );
        });
    }

    function keyDown(event) {
        const key = event.key.toLowerCase();

        if (key === "arrowup" || key === "w") {
            setDirection(0, -1);
            event.preventDefault();
        }

        if (key === "arrowdown" || key === "s") {
            setDirection(0, 1);
            event.preventDefault();
        }

        if (key === "arrowleft" || key === "a") {
            setDirection(-1, 0);
            event.preventDefault();
        }

        if (key === "arrowright" || key === "d") {
            setDirection(1, 0);
            event.preventDefault();
        }
    }

    function touchStart(event) {
        if (!event.touches.length) return;

        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;

        event.preventDefault();
    }

    function touchMove(event) {
        event.preventDefault();
    }

    function touchEnd(event) {
        if (!event.changedTouches.length) return;

        const touch = event.changedTouches[0];

        const dx = touch.clientX - touchStartX;
        const dy = touch.clientY - touchStartY;

        if (
            Math.abs(dx) < 25 &&
            Math.abs(dy) < 25
        ) {
            return;
        }

        if (Math.abs(dx) > Math.abs(dy)) {
            setDirection(dx > 0 ? 1 : -1, 0);
        } else {
            setDirection(0, dy > 0 ? 1 : -1);
        }

        event.preventDefault();
    }

    function buttonDirection(button, x, y) {
        const handler = event => {
            event.preventDefault();
            setDirection(x, y);
        };

        button.addEventListener("pointerdown", handler);

        return handler;
    }

    const upHandler = buttonDirection(upButton, 0, -1);
    const downHandler = buttonDirection(downButton, 0, 1);
    const leftHandler = buttonDirection(leftButton, -1, 0);
    const rightHandler = buttonDirection(rightButton, 1, 0);

    canvas.addEventListener(
        "touchstart",
        touchStart,
        { passive: false }
    );

    canvas.addEventListener(
        "touchmove",
        touchMove,
        { passive: false }
    );

    canvas.addEventListener(
        "touchend",
        touchEnd,
        { passive: false }
    );

    document.addEventListener("keydown", keyDown);

    restartButton.addEventListener("click", reset);

    reset();

    return function cleanup() {
        clearInterval(timer);

        document.removeEventListener("keydown", keyDown);

        restartButton.removeEventListener("click", reset);

        canvas.removeEventListener("touchstart", touchStart);
        canvas.removeEventListener("touchmove", touchMove);
        canvas.removeEventListener("touchend", touchEnd);

        upButton.removeEventListener("pointerdown", upHandler);
        downButton.removeEventListener("pointerdown", downHandler);
        leftButton.removeEventListener("pointerdown", leftHandler);
        rightButton.removeEventListener("pointerdown", rightHandler);
    };
};