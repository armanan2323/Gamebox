window.createSnake = function(root) {
    root.innerHTML = `
        <div class="game-box snake-wrap">
            <div class="game-toolbar">
                <strong>
                    Счёт: <span class="snake-score">0</span>
                </strong>

                <button class="game-button snake-restart">
                    Заново
                </button>
            </div>

            <canvas
                class="game-canvas snake-canvas"
                width="400"
                height="400"
            ></canvas>

            <p class="game-status snake-status">
                Управление: стрелки или WASD
            </p>

            <div class="mobile-controls snake-mobile-controls">
                <div class="mobile-dpad">
                    <button
                        class="mobile-control snake-up"
                        aria-label="Вверх"
                    >↑</button>

                    <div class="mobile-dpad-middle">
                        <button
                            class="mobile-control snake-left"
                            aria-label="Влево"
                        >←</button>

                        <button
                            class="mobile-control snake-down"
                            aria-label="Вниз"
                        >↓</button>

                        <button
                            class="mobile-control snake-right"
                            aria-label="Вправо"
                        >→</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    const canvas =
        root.querySelector(".snake-canvas");

    const ctx =
        canvas.getContext("2d");

    const scoreElement =
        root.querySelector(".snake-score");

    const statusElement =
        root.querySelector(".snake-status");

    const restartButton =
        root.querySelector(".snake-restart");

    const upButton =
        root.querySelector(".snake-up");

    const downButton =
        root.querySelector(".snake-down");

    const leftButton =
        root.querySelector(".snake-left");

    const rightButton =
        root.querySelector(".snake-right");

    const SIZE = 20;
    const CELLS = canvas.width / SIZE;

    let snake;
    let food;
    let direction;
    let nextDirection;
    let score;
    let gameOver;
    let timer = null;

    function reset() {
        if (timer) {
            clearInterval(timer);
        }

        snake = [
            { x: 10, y: 10 },
            { x: 9, y: 10 },
            { x: 8, y: 10 }
        ];

        direction = {
            x: 1,
            y: 0
        };

        nextDirection = {
            x: 1,
            y: 0
        };

        score = 0;
        gameOver = false;

        scoreElement.textContent = "0";

        statusElement.textContent =
            "Управление: стрелки или WASD";

        createFood();
        draw();

        timer = setInterval(
            update,
            110
        );
    }

    function createFood() {
        do {
            food = {
                x: Math.floor(
                    Math.random() * CELLS
                ),
                y: Math.floor(
                    Math.random() * CELLS
                )
            };
        } while (
            snake.some(
                part =>
                    part.x === food.x &&
                    part.y === food.y
            )
        );
    }

    function update() {
        if (gameOver) return;

        direction = {
            ...nextDirection
        };

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

        if (
            snake.some(
                part =>
                    part.x === head.x &&
                    part.y === head.y
            )
        ) {
            endGame();
            return;
        }

        snake.unshift(head);

        if (
            head.x === food.x &&
            head.y === food.y
        ) {
            score++;

            scoreElement.textContent =
                score;

            createFood();
        } else {
            snake.pop();
        }

        draw();
    }

    function endGame() {
        gameOver = true;

        if (timer) {
            clearInterval(timer);
        }

        statusElement.textContent =
            "Игра окончена. Нажми «Заново».";

        draw();
    }

    function draw() {
        ctx.fillStyle = "#f7f8f6";

        ctx.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        ctx.fillStyle = "#3f8f55";

        ctx.fillRect(
            food.x * SIZE + 3,
            food.y * SIZE + 3,
            SIZE - 6,
            SIZE - 6
        );

        snake.forEach(
            (part, index) => {
                ctx.fillStyle =
                    index === 0
                        ? "#286638"
                        : "#3f8f55";

                ctx.fillRect(
                    part.x * SIZE + 2,
                    part.y * SIZE + 2,
                    SIZE - 4,
                    SIZE - 4
                );
            }
        );
    }

    function setDirection(x, y) {
        if (
            direction.x === -x &&
            direction.y === -y
        ) {
            return;
        }

        nextDirection = {
            x,
            y
        };
    }

    function keyDown(event) {
        const key =
            event.key.toLowerCase();

        if (
            key === "arrowup" ||
            key === "w"
        ) {
            setDirection(0, -1);
            event.preventDefault();
        }

        if (
            key === "arrowdown" ||
            key === "s"
        ) {
            setDirection(0, 1);
            event.preventDefault();
        }

        if (
            key === "arrowleft" ||
            key === "a"
        ) {
            setDirection(-1, 0);
            event.preventDefault();
        }

        if (
            key === "arrowright" ||
            key === "d"
        ) {
            setDirection(1, 0);
            event.preventDefault();
        }
    }

    function bindButton(
        button,
        x,
        y
    ) {
        const handler = event => {
            event.preventDefault();
            setDirection(x, y);
        };

        button.addEventListener(
            "pointerdown",
            handler
        );

        return handler;
    }

    const upHandler =
        bindButton(
            upButton,
            0,
            -1
        );

    const downHandler =
        bindButton(
            downButton,
            0,
            1
        );

    const leftHandler =
        bindButton(
            leftButton,
            -1,
            0
        );

    const rightHandler =
        bindButton(
            rightButton,
            1,
            0
        );

    document.addEventListener(
        "keydown",
        keyDown
    );

    restartButton.addEventListener(
        "click",
        reset
    );

    reset();

    return function cleanup() {
        if (timer) {
            clearInterval(timer);
        }

        document.removeEventListener(
            "keydown",
            keyDown
        );

        restartButton.removeEventListener(
            "click",
            reset
        );

        upButton.removeEventListener(
            "pointerdown",
            upHandler
        );

        downButton.removeEventListener(
            "pointerdown",
            downHandler
        );

        leftButton.removeEventListener(
            "pointerdown",
            leftHandler
        );

        rightButton.removeEventListener(
            "pointerdown",
            rightHandler
        );
    };
};