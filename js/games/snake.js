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
    let directionQueue;
    let score;
    let timer;
    let gameOver;

    let touchStartX = 0;
    let touchStartY = 0;

    function reset() {
        clearTimeout(timer);

        snake = [
            { x: 10, y: 10 },
            { x: 9, y: 10 },
            { x: 8, y: 10 }
        ];

        direction = { x: 1, y: 0 };
        directionQueue = [];

        score = 0;
        gameOver = false;

        scoreElement.textContent = "0";
        statusElement.textContent =
            "Стрелки, WASD или свайпы";

        createFood();
        draw();

        schedule();
    }

    function schedule() {
        clearTimeout(timer);

        timer = setTimeout(() => {
            update();

            if (!gameOver) schedule();
        }, Math.max(60, 110 - score * 2));
    }

    function createFood() {
        if (snake.length >= CELLS * CELLS) {
            food = { x: -1, y: -1 };
            return;
        }

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

    // Очередь поворотов: быстрые нажатия (например, ↑ затем ←) не теряются.
    function setDirection(x, y) {
        if (gameOver) return;

        const last =
            directionQueue[directionQueue.length - 1] || direction;

        if (
            (last.x === x && last.y === y) ||
            (last.x === -x && last.y === -y)
        ) {
            return;
        }

        if (directionQueue.length < 3) {
            directionQueue.push({ x, y });
        }
    }

    function update() {
        if (gameOver || document.hidden) return;

        if (directionQueue.length) {
            direction = directionQueue.shift();
        }

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

        const eating =
            head.x === food.x &&
            head.y === food.y;

        // Хвост в этот ход уходит, поэтому в него можно «въехать».
        const body = eating ? snake : snake.slice(0, -1);

        const hitSelf = body.some(
            part =>
                part.x === head.x &&
                part.y === head.y
        );

        if (hitSelf) {
            endGame();
            return;
        }

        snake.unshift(head);

        if (eating) {
            score++;
            scoreElement.textContent = score;
            GameBox.sound("eat");
            createFood();

            if (food.x < 0) {
                endGame(true);
                return;
            }
        } else {
            snake.pop();
        }

        draw();
    }

    function endGame(won) {
        gameOver = true;
        clearTimeout(timer);

        statusElement.textContent = won
            ? `Победа! Поле заполнено. Счёт: ${score}`
            : `Игра окончена. Счёт: ${score}. Нажми «Заново» или пробел.`;

        GameBox.sound(won ? "win" : "lose");
        GameBox.vibrate(won ? 60 : [80, 40, 80]);
        GameBox.submit(score);

        draw();
    }

    function draw() {
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = "#111";
        ctx.lineWidth = 1;

        ctx.beginPath();

        for (let i = 0; i <= CELLS; i++) {
            ctx.moveTo(i * SIZE, 0);
            ctx.lineTo(i * SIZE, canvas.height);
            ctx.moveTo(0, i * SIZE);
            ctx.lineTo(canvas.width, i * SIZE);
        }

        ctx.stroke();

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

        if (gameOver && (key === " " || key === "enter")) {
            event.preventDefault();
            reset();
            return;
        }

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

        if (!event.touches.length) return;

        const touch = event.touches[0];
        const dx = touch.clientX - touchStartX;
        const dy = touch.clientY - touchStartY;

        if (Math.max(Math.abs(dx), Math.abs(dy)) < 22) return;

        if (Math.abs(dx) > Math.abs(dy)) {
            setDirection(dx > 0 ? 1 : -1, 0);
        } else {
            setDirection(0, dy > 0 ? 1 : -1);
        }

        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
    }

    function touchEnd(event) {
        if (!event.changedTouches.length) return;

        const touch = event.changedTouches[0];

        const dx = touch.clientX - touchStartX;
        const dy = touch.clientY - touchStartY;

        if (
            Math.abs(dx) < 22 &&
            Math.abs(dy) < 22
        ) {
            if (gameOver) reset();
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
        const handler = () => setDirection(x, y);

        GameBox.hold(button, handler);

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
        clearTimeout(timer);

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