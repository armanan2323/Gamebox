window.createTetris = function(root) {
    root.innerHTML = `
        <div class="game-box">
            <div class="game-toolbar">
                <strong>
                    Счёт: <span class="tetris-score">0</span>
                </strong>

                <button class="game-button tetris-restart">
                    Заново
                </button>
            </div>

            <div class="tetris-layout">
                <div>
                    <canvas
                        class="tetris-canvas"
                        width="300"
                        height="600"
                    ></canvas>

                    <div class="tetris-controls">
                        <button data-action="left">←</button>
                        <button data-action="rotate">↻</button>
                        <button data-action="right">→</button>
                        <button data-action="down">↓</button>
                        <button data-action="drop">⤓</button>
                    </div>
                </div>

                <div class="tetris-side">
                    <strong>Следующая</strong>
                    <span class="tetris-level">Уровень 1</span>

                    <canvas
                        class="tetris-next"
                        width="120"
                        height="120"
                    ></canvas>
                </div>
            </div>

            <p class="game-status tetris-status">
                Стрелки - движение, ↑ - поворот, Space - сброс, P - пауза.
                На телефоне: тап - поворот, свайпы - движение.
            </p>
        </div>
    `;

    const canvas = root.querySelector(".tetris-canvas");
    const ctx = canvas.getContext("2d");

    const nextCanvas =
        root.querySelector(".tetris-next");

    const nextCtx =
        nextCanvas.getContext("2d");

    const scoreElement =
        root.querySelector(".tetris-score");

    const status =
        root.querySelector(".tetris-status");

    const restart =
        root.querySelector(".tetris-restart");

    const levelElement =
        root.querySelector(".tetris-level");

    const controls =
        root.querySelectorAll(".tetris-controls button");

    const COLS = 10;
    const ROWS = 20;
    const SIZE = 30;

    const pieces = [
        [[1, 1, 1, 1]],
        [
            [1, 1],
            [1, 1]
        ],
        [
            [0, 1, 0],
            [1, 1, 1]
        ],
        [
            [1, 0, 0],
            [1, 1, 1]
        ],
        [
            [0, 0, 1],
            [1, 1, 1]
        ],
        [
            [0, 1, 1],
            [1, 1, 0]
        ],
        [
            [1, 1, 0],
            [0, 1, 1]
        ]
    ];

    const colors = [
        "#4fc3f7",
        "#ffd54f",
        "#ba68c8",
        "#ff8a65",
        "#5c8df6",
        "#81c784",
        "#e57373"
    ];

    let board;
    let current;
    let next;
    let score;
    let lines;
    let gameOver;
    let paused;
    let dropTimer;
    let lastDrop;

    function createBoard() {
        return Array.from(
            { length: ROWS },
            () => Array(COLS).fill(0)
        );
    }

    let bag = [];

    // «Мешок» из 7 фигур: без длинных серий одинаковых фигур.
    function randomPiece() {
        if (!bag.length) {
            bag = pieces.map((_, index) => index);

            for (let i = bag.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [bag[i], bag[j]] = [bag[j], bag[i]];
            }
        }

        const type = bag.pop();
        const shape = pieces[type];

        return {
            color: type + 1,
            shape: shape.map(row => row.map(value => value ? type + 1 : 0)),
            x: Math.floor(
                (COLS - shape[0].length) / 2
            ),
            y: 0
        };
    }

    function start() {
        clearInterval(dropTimer);

        board = createBoard();
        current = randomPiece();
        next = randomPiece();

        score = 0;
        lines = 0;
        gameOver = false;
        paused = false;

        scoreElement.textContent = score;
        levelElement.textContent = "Уровень 1";
        status.textContent =
            "Стрелки - движение, ↑ - поворот, Space - сброс, P - пауза.";

        draw();

        lastDrop = Date.now();

        dropTimer = setInterval(() => {
            if (gameOver || paused || document.hidden) {
                lastDrop = Date.now();
                return;
            }

            if (Date.now() - lastDrop > dropInterval()) {
                drop();

                lastDrop = Date.now();
            }
        }, 30);
    }

    function level() {
        return Math.floor(lines / 10) + 1;
    }

    function dropInterval() {
        return Math.max(90, 750 - (level() - 1) * 65);
    }

    function togglePause() {
        if (gameOver) return;

        paused = !paused;

        status.textContent = paused
            ? "Пауза. Нажми P, чтобы продолжить."
            : "Игра продолжается.";

        draw();
    }

    function collision(piece, offsetX = 0, offsetY = 0, shape = piece.shape) {
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (!shape[y][x]) continue;

                const nx = piece.x + x + offsetX;
                const ny = piece.y + y + offsetY;

                if (
                    nx < 0 ||
                    nx >= COLS ||
                    ny >= ROWS
                ) {
                    return true;
                }

                if (
                    ny >= 0 &&
                    board[ny][nx]
                ) {
                    return true;
                }
            }
        }

        return false;
    }

    function move(dx) {
        if (
            !gameOver &&
            !paused &&
            !collision(current, dx, 0)
        ) {
            current.x += dx;
            GameBox.sound("move");
            draw();
        }
    }

    function drop(manual) {
        if (gameOver || paused) return;

        if (!collision(current, 0, 1)) {
            current.y++;

            if (manual) {
                score += 1;
                scoreElement.textContent = score;
                lastDrop = Date.now();
            }
        } else {
            lockPiece();
        }

        draw();
    }

    function hardDrop() {
        if (gameOver || paused) return;

        let distance = 0;

        while (!collision(current, 0, 1)) {
            current.y++;
            distance++;
        }

        score += distance * 2;
        scoreElement.textContent = score;

        lockPiece();
        draw();
    }

    function rotate() {
        if (gameOver || paused) return;

        const oldShape = current.shape;

        const newShape =
            oldShape[0].map(
                (_, index) =>
                    oldShape.map(
                        row => row[index]
                    ).reverse()
            );

        const before = current.shape;

        if (
            !collision(
                current,
                0,
                0,
                newShape
            )
        ) {
            current.shape = newShape;
        } else if (
            !collision(
                current,
                -1,
                0,
                newShape
            )
        ) {
            current.x--;
            current.shape = newShape;
        } else if (
            !collision(
                current,
                1,
                0,
                newShape
            )
        ) {
            current.x++;
            current.shape = newShape;
        } else if (
            newShape[0].length === 4 &&
            !collision(current, -2, 0, newShape)
        ) {
            current.x -= 2;
            current.shape = newShape;
        } else if (
            newShape[0].length === 4 &&
            !collision(current, 2, 0, newShape)
        ) {
            current.x += 2;
            current.shape = newShape;
        }

        if (current.shape !== before) {
            GameBox.sound("rotate");
        }

        draw();
    }

    function lockPiece() {
        let overflow = false;

        current.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    const py =
                        current.y + y;

                    const px =
                        current.x + x;

                    if (py < 0) {
                        overflow = true;
                    } else if (py < ROWS) {
                        board[py][px] = value;
                    }
                }
            });
        });

        if (!clearLines()) {
            GameBox.sound("place");
        }

        if (overflow) {
            finish();
            return;
        }

        current = next;
        current.x = Math.floor(
            (COLS - current.shape[0].length) / 2
        );
        current.y = 0;

        next = randomPiece();

        if (collision(current)) {
            finish();
        }
    }

    function finish() {
        gameOver = true;
        status.textContent =
            `Игра окончена. Счёт: ${score}. Нажми «Заново».`;

        GameBox.sound("lose");
        GameBox.vibrate([80, 40, 80]);
        GameBox.submit(score);
    }

    function clearLines() {
        let lines = 0;

        for (let y = ROWS - 1; y >= 0; y--) {
            if (board[y].every(Boolean)) {
                board.splice(y, 1);
                board.unshift(Array(COLS).fill(0));

                lines++;
                y++;
            }
        }

        if (lines) {
            const oldLevel = level();

            score +=
                [0, 100, 300, 500, 800][lines] * oldLevel;

            linesCleared(lines);

            scoreElement.textContent = score;

            GameBox.sound(lines >= 4 ? "win" : "score");
            GameBox.vibrate(30);

            if (level() > oldLevel) {
                status.textContent = `Уровень ${level()}!`;
            }

            levelElement.textContent = `Уровень ${level()}`;
        }

        return lines;
    }

    function linesCleared(count) {
        lines += count;
    }

    function drawCell(context, x, y, size, value, alpha = 1) {
        context.globalAlpha = alpha;
        context.fillStyle = colors[(value || 1) - 1];
        context.fillRect(
            x * size,
            y * size,
            size - 1,
            size - 1
        );

        context.fillStyle = "rgba(255, 255, 255, .25)";
        context.fillRect(
            x * size,
            y * size,
            size - 1,
            Math.max(2, size / 8)
        );
        context.globalAlpha = 1;
    }

    function draw() {
        ctx.fillStyle = "#111411";
        ctx.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                if (board[y][x]) {
                    drawCell(
                        ctx,
                        x,
                        y,
                        SIZE,
                        board[y][x]
                    );
                }
            }
        }

        if (!gameOver) {
            let ghost = 0;

            while (!collision(current, 0, ghost + 1)) {
                ghost++;
            }

            current.shape.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value) {
                        drawCell(
                            ctx,
                            current.x + x,
                            current.y + y + ghost,
                            SIZE,
                            value,
                            0.22
                        );
                    }
                });
            });
        }

        current.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    drawCell(
                        ctx,
                        current.x + x,
                        current.y + y,
                        SIZE,
                        value
                    );
                }
            });
        });

        if (paused || gameOver) {
            ctx.fillStyle = "rgba(0, 0, 0, .6)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = "#fff";
            ctx.font = "bold 30px Arial";
            ctx.textAlign = "center";
            ctx.fillText(
                paused ? "ПАУЗА" : "КОНЕЦ ИГРЫ",
                canvas.width / 2,
                canvas.height / 2
            );
        }

        nextCtx.fillStyle = "#111411";
        nextCtx.fillRect(
            0,
            0,
            nextCanvas.width,
            nextCanvas.height
        );

        const offsetX = (5 - next.shape[0].length) / 2;
        const offsetY = (5 - next.shape.length) / 2;

        next.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    drawCell(
                        nextCtx,
                        x + offsetX,
                        y + offsetY,
                        24,
                        value
                    );
                }
            });
        });
    }

    function keydown(event) {
        if (
            [
                "ArrowLeft",
                "ArrowRight",
                "ArrowDown",
                "ArrowUp",
                "Space"
            ].includes(event.code)
        ) {
            event.preventDefault();
        }

        if (event.code === "ArrowLeft" || event.code === "KeyA") move(-1);
        if (event.code === "ArrowRight" || event.code === "KeyD") move(1);
        if (event.code === "ArrowDown" || event.code === "KeyS") drop(true);
        if (event.code === "ArrowUp" || event.code === "KeyW") rotate();
        if (event.code === "Space") hardDrop();
        if (event.code === "KeyP" || event.code === "Escape") togglePause();
    }

    controls.forEach(button => {
        const action = button.dataset.action;
        const repeat =
            action === "left" || action === "right" || action === "down";

        GameBox.hold(button, () => {
            if (action === "left") move(-1);
            if (action === "right") move(1);
            if (action === "down") drop(true);
            if (action === "rotate") rotate();
            if (action === "drop") hardDrop();
        }, null, repeat ? { repeat: 70, delay: 170 } : {});
    });

    // Жесты на поле: тап - поворот, свайп влево/вправо - сдвиг, вниз - ускорение.
    GameBox.swipe(canvas, direction => {
        if (direction === "left") move(-1);
        if (direction === "right") move(1);
        if (direction === "down") drop(true);
        if (direction === "up") rotate();
    }, {
        continuous: true,
        distance: 26,
        onTap: () => rotate()
    });

    restart.addEventListener("click", start);

    document.addEventListener("keydown", keydown);

    start();

    return function() {
        clearInterval(dropTimer);
        document.removeEventListener("keydown", keydown);
    };
};