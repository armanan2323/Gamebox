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

                    <canvas
                        class="tetris-next"
                        width="120"
                        height="120"
                    ></canvas>
                </div>
            </div>

            <p class="game-status tetris-status">
                Стрелки - движение, ↑ - поворот, Space - сброс.
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

    let board;
    let current;
    let next;
    let score;
    let gameOver;
    let dropTimer;
    let lastDrop;

    function createBoard() {
        return Array.from(
            { length: ROWS },
            () => Array(COLS).fill(0)
        );
    }

    function randomPiece() {
        const shape =
            pieces[
                Math.floor(
                    Math.random() * pieces.length
                )
            ];

        return {
            shape: shape.map(row => [...row]),
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
        gameOver = false;

        scoreElement.textContent = score;
        status.textContent =
            "Стрелки - движение, ↑ - поворот, Space - сброс.";

        draw();

        lastDrop = Date.now();

        dropTimer = setInterval(() => {
            if (gameOver) return;

            if (
                Date.now() - lastDrop >
                Math.max(
                    120,
                    700 - Math.floor(score / 500) * 40
                )
            ) {
                drop();

                lastDrop = Date.now();
            }
        }, 30);
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
            !collision(current, dx, 0)
        ) {
            current.x += dx;
            draw();
        }
    }

    function drop() {
        if (gameOver) return;

        if (!collision(current, 0, 1)) {
            current.y++;
        } else {
            lockPiece();
        }

        draw();
    }

    function hardDrop() {
        if (gameOver) return;

        while (!collision(current, 0, 1)) {
            current.y++;
        }

        lockPiece();
        draw();
    }

    function rotate() {
        if (gameOver) return;

        const oldShape = current.shape;

        const newShape =
            oldShape[0].map(
                (_, index) =>
                    oldShape.map(
                        row => row[index]
                    ).reverse()
            );

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
        }

        draw();
    }

    function lockPiece() {
        current.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    const py =
                        current.y + y;

                    const px =
                        current.x + x;

                    if (
                        py >= 0 &&
                        py < ROWS
                    ) {
                        board[py][px] = 1;
                    }
                }
            });
        });

        clearLines();

        current = next;
        current.x = Math.floor(
            (COLS - current.shape[0].length) / 2
        );
        current.y = 0;

        next = randomPiece();

        if (collision(current)) {
            gameOver = true;
            status.textContent =
                "Игра окончена. Нажми «Заново».";
        }
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
            score +=
                [0, 100, 300, 500, 800][lines];

            scoreElement.textContent = score;
        }
    }

    function drawCell(context, x, y, size) {
        context.fillStyle = "#d8ddd7";
        context.fillRect(
            x * size,
            y * size,
            size - 1,
            size - 1
        );
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
                        SIZE
                    );
                }
            }
        }

        current.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    drawCell(
                        ctx,
                        current.x + x,
                        current.y + y,
                        SIZE
                    );
                }
            });
        });

        nextCtx.fillStyle = "#111411";
        nextCtx.fillRect(
            0,
            0,
            nextCanvas.width,
            nextCanvas.height
        );

        next.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    drawCell(
                        nextCtx,
                        x + 1,
                        y + 1,
                        24
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

        if (event.code === "ArrowLeft") move(-1);
        if (event.code === "ArrowRight") move(1);
        if (event.code === "ArrowDown") drop();
        if (event.code === "ArrowUp") rotate();
        if (event.code === "Space") hardDrop();
    }

    controls.forEach(button => {
        button.addEventListener("pointerdown", event => {
            event.preventDefault();

            const action = button.dataset.action;

            if (action === "left") move(-1);
            if (action === "right") move(1);
            if (action === "down") drop();
            if (action === "rotate") rotate();
            if (action === "drop") hardDrop();
        });
    });

    restart.addEventListener("click", start);

    document.addEventListener("keydown", keydown);

    start();

    return function() {
        clearInterval(dropTimer);
        document.removeEventListener("keydown", keydown);
    };
};