window.createSnake = function (root) {
    root.innerHTML = `
        <div class="game-box">
            <div class="game-toolbar">
                <strong>Счёт: <span class="snake-score">0</span></strong>
                <button class="game-button snake-restart">Заново</button>
            </div>

            <div class="snake-wrap">
                <canvas class="snake-canvas" width="500" height="500"></canvas>

                <div class="mobile-dpad">
                    <button class="dpad-up" data-dir="up">▲</button>
                    <button class="dpad-left" data-dir="left">◀</button>
                    <button class="dpad-down" data-dir="down">▼</button>
                    <button class="dpad-right" data-dir="right">▶</button>
                </div>
            </div>

            <p class="game-status snake-status">
                Используй стрелки или свайпы
            </p>
        </div>
    `;

    const canvas = root.querySelector(".snake-canvas");
    const ctx = canvas.getContext("2d");
    const scoreElement = root.querySelector(".snake-score");
    const status = root.querySelector(".snake-status");
    const restart = root.querySelector(".snake-restart");
    const controls = root.querySelectorAll(".mobile-dpad button");

    const size = 20;
    const cell = canvas.width / size;

    let snake;
    let food;
    let direction;
    let nextDirection;
    let score;
    let timer;
    let gameOver;
    let touchStartX = 0;
    let touchStartY = 0;

    function start() {
        clearInterval(timer);

        snake = [
            { x: 10, y: 10 },
            { x: 9, y: 10 },
            { x: 8, y: 10 }
        ];

        direction = "right";
        nextDirection = "right";
        score = 0;
        gameOver = false;

        scoreElement.textContent = score;
        status.textContent = "Используй стрелки или свайпы";

        placeFood();
        draw();

        timer = setInterval(update, 110);
    }

    function update() {
        if (gameOver) return;

        direction = nextDirection;

        const head = {
            x: snake[0].x,
            y: snake[0].y
        };

        if (direction === "up") head.y--;
        if (direction === "down") head.y++;
        if (direction === "left") head.x--;
        if (direction === "right") head.x++;

        if (
            head.x < 0 ||
            head.x >= size ||
            head.y < 0 ||
            head.y >= size ||
            snake.some(part => part.x === head.x && part.y === head.y)
        ) {
            finish();
            return;
        }

        snake.unshift(head);

        if (head.x === food.x && head.y === food.y) {
            score++;
            scoreElement.textContent = score;
            placeFood();
        } else {
            snake.pop();
        }

        draw();
    }

    function placeFood() {
        do {
            food = {
                x: Math.floor(Math.random() * size),
                y: Math.floor(Math.random() * size)
            };
        } while (
            snake &&
            snake.some(part => part.x === food.x && part.y === food.y)
        );
    }

    function setDirection(newDirection) {
        const opposite = {
            up: "down",
            down: "up",
            left: "right",
            right: "left"
        };

        if (newDirection !== opposite[direction]) {
            nextDirection = newDirection;
        }
    }

    function finish() {
        gameOver = true;
        clearInterval(timer);
        status.textContent = "Игра окончена. Нажми «Заново».";
        draw();
    }

    function draw() {
        ctx.fillStyle = "#161917";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#e7eae6";
        ctx.fillRect(
            food.x * cell + 4,
            food.y * cell + 4,
            cell - 8,
            cell - 8
        );

        snake.forEach((part, index) => {
            ctx.fillStyle = index === 0 ? "#ffffff" : "#bfc5bf";
            ctx.fillRect(
                part.x * cell + 2,
                part.y * cell + 2,
                cell - 4,
                cell - 4
            );
        });
    }

    function keydown(event) {
        const directions = {
            ArrowUp: "up",
            ArrowDown: "down",
            ArrowLeft: "left",
            ArrowRight: "right",
            KeyW: "up",
            KeyS: "down",
            KeyA: "left",
            KeyD: "right"
        };

        if (directions[event.code]) {
            event.preventDefault();
            setDirection(directions[event.code]);
        }
    }

    function touchstart(event) {
        const touch = event.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
    }

    function touchend(event) {
        const touch = event.changedTouches[0];

        const dx = touch.clientX - touchStartX;
        const dy = touch.clientY - touchStartY;

        if (Math.max(Math.abs(dx), Math.abs(dy)) < 25) return;

        if (Math.abs(dx) > Math.abs(dy)) {
            setDirection(dx > 0 ? "right" : "left");
        } else {
            setDirection(dy > 0 ? "down" : "up");
        }
    }

    controls.forEach(button => {
        button.addEventListener("pointerdown", event => {
            event.preventDefault();
            setDirection(button.dataset.dir);
        });
    });

    restart.addEventListener("click", start);

    document.addEventListener("keydown", keydown);
    canvas.addEventListener("touchstart", touchstart, { passive: true });
    canvas.addEventListener("touchend", touchend, { passive: true });

    start();

    return function cleanup() {
        clearInterval(timer);
        document.removeEventListener("keydown", keydown);
        canvas.removeEventListener("touchstart", touchstart);
        canvas.removeEventListener("touchend", touchend);
    };
};