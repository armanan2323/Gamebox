window.createTetris = function (root) {
    root.innerHTML = `
        <div class="game-box">
            <div class="game-toolbar">
                <strong>Счёт: <span class="tetris-score">0</span></strong>
                <button class="game-button tetris-restart">Заново</button>
            </div>

            <div class="tetris-layout">
                <canvas class="tetris-canvas" width="200" height="400"></canvas>

                <div class="tetris-side">
                    <div class="tetris-next">
                        <strong>Следующая</strong>
                        <canvas class="tetris-next-canvas" width="100" height="100"></canvas>
                    </div>

                    <div class="tetris-controls">
                        <button class="tetris-rotate">↻</button>
                        <button class="tetris-left">←</button>
                        <button class="tetris-down">↓</button>
                        <button class="tetris-right">→</button>
                        <button class="tetris-drop">Сбросить вниз</button>
                    </div>
                </div>
            </div>

            <p class="game-status tetris-status">
                Стрелки, WASD или кнопки
            </p>
        </div>
    `;

    const canvas = root.querySelector(".tetris-canvas");
    const nextCanvas = root.querySelector(".tetris-next-canvas");
    const ctx = canvas.getContext("2d");
    const nextCtx = nextCanvas.getContext("2d");

    const scoreElement = root.querySelector(".tetris-score");
    const status = root.querySelector(".tetris-status");
    const restart = root.querySelector(".tetris-restart");

    const COLS = 10;
    const ROWS = 20;
    const CELL = 20;

    const shapes = [
        [[1, 1, 1, 1]],
        [[1, 1], [1, 1]],
        [[0, 1, 0], [1, 1, 1]],
        [[1, 0, 0], [1, 1, 1]],
        [[0, 0, 1], [1, 1, 1]],
        [[1, 1, 0], [0, 1, 1]],
        [[0, 1, 1], [1, 1, 0]]
    ];

    let board;
    let piece;
    let nextPiece;
    let score;
    let gameOver;
    let timer;

    function start() {
        clearInterval(timer);

        board = Array.from(
            { length: ROWS },
            () => Array(COLS).fill(0)
        );

        score = 0;
        gameOver = false;

        scoreElement.textContent = "0";
        status.textContent = "Стрелки, WASD или кнопки";

        piece = createPiece();
        nextPiece = createPiece();

        timer = setInterval(drop, 650);

        draw();
        drawNext();
    }

    function createPiece() {
        const shape = shapes[
            Math.floor(Math.random() * shapes.length)
        ].map(row => [...row]);

        return {
            shape,
            x: Math.floor((COLS - shape[0].length) / 2),
            y: 0
        };
    }

    function collide(testPiece = piece) {
        for (let y = 0; y < testPiece.shape.length; y++) {
            for (let x = 0; x < testPiece.shape[y].length; x++) {
                if (!testPiece.shape[y][x]) continue;

                const px = testPiece.x + x;
                const py = testPiece.y + y;

                if (
                    px < 0 ||
                    px >= COLS ||
                    py >= ROWS ||
                    (py >= 0 && board[py][px])
                ) {
                    return true;
                }
            }
        }

        return false;
    }

    function move(dx) {
        piece.x += dx;

        if (collide()) {
            piece.x -= dx;
        }

        draw();
    }

    function drop() {
        piece.y++;

        if (collide()) {
            piece.y--;
            merge();
            clearLines();

            piece = nextPiece;
            nextPiece = createPiece();

            if (collide()) {
                finish();
                return;
            }

            drawNext();
        }

        draw();
    }

    function hardDrop() {
        while (!collide()) {
            piece.y++;
        }

        piece.y--;
        merge();
        clearLines();

        piece = nextPiece;
        nextPiece = createPiece();

        if (collide()) {
            finish();
            return;
        }

        drawNext();
        draw();
    }

    function rotate() {
        const oldShape = piece.shape;

        const rotated = oldShape[0].map(
            (_, index) =>
                oldShape.map(row => row[index]).reverse()
        );

        piece.shape = rotated;

        if (collide()) {
            piece.shape = oldShape;
        }

        draw();
    }

    function merge() {
        piece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (!value) return;

                const py = piece.y + y;
                const px = piece.x + x;

                if (py >= 0) {
                    board[py][px] = 1;
                }
            });
        });
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
            score += lines * 100;
            scoreElement.textContent = score;
        }
    }

    function finish() {
        gameOver = true;
        clearInterval(timer);
        status.textContent = "Игра окончена. Нажми «Заново».";
        draw();
    }

    function drawCell(context, x, y, size, filled) {
        if (!filled) return;

        context.fillStyle = "#ffffff";
        context.fillRect(
            x * size + 1,
            y * size + 1,
            size - 2,
            size - 2
        );
    }

    function draw() {
        ctx.fillStyle = "#161917";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        board.forEach((row, y) => {
            row.forEach((value, x) => {
                drawCell(ctx, x, y, CELL, value);
            });
        });

        piece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    drawCell(
                        ctx,
                        piece.x + x,
                        piece.y + y,
                        CELL,
                        value
                    );
                }
            });
        });
    }

    function drawNext() {
        nextCtx.fillStyle = "#f4f5f3";
        nextCtx.fillRect(0, 0, 100, 100);

        const size = 22;
        const width = nextPiece.shape[0].length * size;
        const height = nextPiece.shape.length * size;

        const offsetX = (100 - width) / 2;
        const offsetY = (100 - height) / 2;

        nextPiece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (!value) return;

                nextCtx.fillStyle = "#1b1d1b";
                nextCtx.fillRect(
                    offsetX + x * size,
                    offsetY + y * size,
                    size - 2,
                    size - 2
                );
            });
        });
    }

    function keydown(event) {
        if (event.code === "ArrowLeft" || event.code === "KeyA") {
            event.preventDefault();
            move(-1);
        }

        if (event.code === "ArrowRight" || event.code === "KeyD") {
            event.preventDefault();
            move(1);
        }

        if (event.code === "ArrowDown" || event.code === "KeyS") {
            event.preventDefault();
            drop();
        }

        if (
            event.code === "ArrowUp" ||
            event.code === "KeyW"
        ) {
            event.preventDefault();
            rotate();
        }

        if (event.code === "Space") {
            event.preventDefault();
            hardDrop();
        }
    }

    root.querySelector(".tetris-left").addEventListener("pointerdown", () => move(-1));
    root.querySelector(".tetris-right").addEventListener("pointerdown", () => move(1));
    root.querySelector(".tetris-down").addEventListener("pointerdown", () => drop());
    root.querySelector(".tetris-rotate").addEventListener("pointerdown", () => rotate());
    root.querySelector(".tetris-drop").addEventListener("pointerdown", () => hardDrop());

    restart.addEventListener("click", start);
    document.addEventListener("keydown", keydown);

    start();

    return function cleanup() {
        clearInterval(timer);
        document.removeEventListener("keydown", keydown);
    };
};