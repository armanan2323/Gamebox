window.createMinesweeper = function(root) {
    root.innerHTML = `
        <div class="game-box">
            <div class="game-toolbar">
                <strong>Мин: <span class="mine-count">10</span></strong>
                <strong>⏱ <span class="mine-time">0:00</span></strong>
                <button class="game-button minesweeper-restart">Заново</button>
            </div>

            <div class="minesweeper-board"></div>

            <p class="game-status minesweeper-status">
                Нажми на клетку. ПКМ или долгое нажатие - флажок.
            </p>
        </div>
    `;

    const boardElement = root.querySelector(".minesweeper-board");
    const counter = root.querySelector(".mine-count");
    const status = root.querySelector(".minesweeper-status");
    const restart = root.querySelector(".minesweeper-restart");
    const timeElement = root.querySelector(".mine-time");

    const rows = 10;
    const cols = 10;
    const mines = 10;

    let board;
    let revealed;
    let flagCount;
    let gameOver;
    let longPressTimer;
    let longPressTriggered;
    let lastFlagTime = 0;
    let minesPlaced;
    let startTime;
    let clockTimer;
    let cells = [];
    let pressStart = null;

    function start() {
        clearTimeout(longPressTimer);
        clearInterval(clockTimer);

        board = Array.from(
            { length: rows },
            () =>
                Array.from(
                    { length: cols },
                    () => ({
                        mine: false,
                        open: false,
                        flagged: false,
                        number: 0
                    })
                )
        );

        revealed = 0;
        flagCount = 0;
        gameOver = false;
        minesPlaced = false;
        startTime = 0;
        timeElement.textContent = "0:00";

        counter.textContent = mines;
        status.textContent =
            "Нажми на клетку. ПКМ или долгое нажатие - флажок.";

        render();
    }

    function elapsed() {
        return startTime
            ? Math.floor((Date.now() - startTime) / 1000)
            : 0;
    }

    function updateClock() {
        const seconds = elapsed();
        timeElement.textContent =
            `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
    }

    // Мины раскладываются после первого клика: первая клетка и её соседи всегда безопасны.
    function placeMines(safeX, safeY) {
        let placed = 0;

        while (placed < mines) {
            const x = Math.floor(Math.random() * cols);
            const y = Math.floor(Math.random() * rows);

            if (
                Math.abs(x - safeX) <= 1 &&
                Math.abs(y - safeY) <= 1
            ) {
                continue;
            }

            if (!board[y][x].mine) {
                board[y][x].mine = true;
                placed++;
            }
        }
    }

    function calculateNumbers() {
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                if (board[y][x].mine) continue;

                let count = 0;

                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        if (dx === 0 && dy === 0) continue;

                        const nx = x + dx;
                        const ny = y + dy;

                        if (
                            nx >= 0 &&
                            nx < cols &&
                            ny >= 0 &&
                            ny < rows &&
                            board[ny][nx].mine
                        ) {
                            count++;
                        }
                    }
                }

                board[y][x].number = count;
            }
        }
    }

    function updateCounter() {
        counter.textContent = Math.max(0, mines - flagCount);
    }

    function toggleFlag(x, y) {
        if (gameOver) return;

        const cell = board[y][x];

        if (cell.open) return;

        if (!cell.flagged && flagCount >= mines) {
            return;
        }

        cell.flagged = !cell.flagged;

        flagCount += cell.flagged ? 1 : -1;
        lastFlagTime = Date.now();

        GameBox.sound("place");
        GameBox.vibrate(25);

        updateCounter();
        render();
    }

    function neighbors(x, y) {
        const result = [];

        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const nx = x + dx;
                const ny = y + dy;

                if (
                    (dx || dy) &&
                    nx >= 0 &&
                    nx < cols &&
                    ny >= 0 &&
                    ny < rows
                ) {
                    result.push([nx, ny]);
                }
            }
        }

        return result;
    }

    function openCell(x, y) {
        if (gameOver) return;

        const cell = board[y][x];

        if (cell.flagged) return;

        if (!minesPlaced) {
            placeMines(x, y);
            calculateNumbers();
            minesPlaced = true;
            startTime = Date.now();
            clockTimer = setInterval(updateClock, 1000);
        }

        // Нажатие на открытую цифру открывает соседей, если флажков столько же, сколько мин.
        if (cell.open) {
            if (!cell.number) return;

            const around = neighbors(x, y);
            const flags = around.filter(([nx, ny]) => board[ny][nx].flagged).length;

            if (flags !== cell.number) return;

            const hidden = around.filter(([nx, ny]) =>
                !board[ny][nx].open && !board[ny][nx].flagged
            );

            if (!hidden.length) return;

            const mine = hidden.find(([nx, ny]) => board[ny][nx].mine);

            if (mine) {
                explode(mine[0], mine[1]);
                return;
            }

            hidden.forEach(([nx, ny]) => reveal(nx, ny));
        } else if (cell.mine) {
            explode(x, y);
            return;
        } else {
            reveal(x, y);
        }

        GameBox.sound("flip");

        if (revealed >= rows * cols - mines) {
            gameOver = true;
            clearInterval(clockTimer);
            updateClock();

            board.forEach(row => {
                row.forEach(cell => {
                    if (cell.mine) {
                        cell.flagged = true;
                    }
                });
            });

            flagCount = mines;
            updateCounter();

            const seconds = elapsed();

            status.textContent = `Победа! Время: ${timeElement.textContent}`;

            GameBox.sound("win");
            GameBox.vibrate(80);
            GameBox.submit(Math.max(1, seconds));
        }

        render();
    }

    function explode(x, y) {
        const cell = board[y][x];

        cell.open = true;
        cell.exploded = true;
        gameOver = true;

        clearInterval(clockTimer);
        revealMines();

        status.textContent = "Ты попал на мину. Нажми «Заново».";

        GameBox.sound("explode");
        GameBox.vibrate([120, 60, 120]);

        render();
    }

    function reveal(x, y) {
        if (
            x < 0 ||
            x >= cols ||
            y < 0 ||
            y >= rows
        ) {
            return;
        }

        const cell = board[y][x];

        if (
            cell.open ||
            cell.flagged ||
            cell.mine
        ) {
            return;
        }

        cell.open = true;
        revealed++;

        if (cell.number !== 0) return;

        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx !== 0 || dy !== 0) {
                    reveal(x + dx, y + dy);
                }
            }
        }
    }

    function revealMines() {
        board.forEach(row => {
            row.forEach(cell => {
                if (cell.mine) {
                    cell.open = true;
                }
            });
        });
    }

    function buildBoard() {
        boardElement.innerHTML = "";
        boardElement.style.gridTemplateColumns =
            `repeat(${cols}, 1fr)`;

        cells = [];

        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const button = document.createElement("button");

                button.className = "mine-cell";
                button.dataset.x = x;
                button.dataset.y = y;

                boardElement.appendChild(button);
                cells.push(button);
            }
        }
    }

    // Обновляем существующие кнопки вместо пересоздания всего поля.
    function render() {
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const cell = board[y][x];
                const button = cells[y * cols + x];

                let className = "mine-cell";
                let text = "";

                if (cell.open) {
                    className += " open";

                    if (cell.mine) {
                        className += " mine";
                        text = "💣";

                        if (cell.exploded) className += " exploded";
                    } else if (cell.number > 0) {
                        className += ` n${cell.number}`;
                        text = cell.number;
                    }
                } else if (cell.flagged) {
                    className += " flagged";
                    text = "🚩";
                }

                if (button.className !== className) {
                    button.className = className;
                }

                if (button.textContent !== String(text)) {
                    button.textContent = text;
                }
            }
        }
    }

    function cellFromEvent(event) {
        const button = event.target.closest(".mine-cell");

        if (!button) return null;

        return {
            x: Number(button.dataset.x),
            y: Number(button.dataset.y)
        };
    }

    boardElement.addEventListener("contextmenu", event => {
        event.preventDefault();

        // На Android долгое нажатие вызывает и наш таймер, и contextmenu.
        if (Date.now() - lastFlagTime < 700) return;

        const cell = cellFromEvent(event);

        if (cell) toggleFlag(cell.x, cell.y);
    });

    boardElement.addEventListener("click", event => {
        const cell = cellFromEvent(event);

        if (!cell) return;

        if (longPressTriggered) {
            longPressTriggered = false;
            return;
        }

        openCell(cell.x, cell.y);
    });

    boardElement.addEventListener("pointerdown", event => {
        if (event.pointerType === "mouse") {
            return;
        }

        const cell = cellFromEvent(event);

        if (!cell) return;

        longPressTriggered = false;
        pressStart = { x: event.clientX, y: event.clientY };

        clearTimeout(longPressTimer);

        longPressTimer = setTimeout(() => {
            longPressTriggered = true;
            toggleFlag(cell.x, cell.y);
        }, 420);
    });

    boardElement.addEventListener("pointermove", event => {
        if (!pressStart) return;

        if (
            Math.abs(event.clientX - pressStart.x) > 10 ||
            Math.abs(event.clientY - pressStart.y) > 10
        ) {
            clearTimeout(longPressTimer);
            pressStart = null;
        }
    });

    ["pointerup", "pointercancel"].forEach(type => {
        boardElement.addEventListener(type, () => {
            clearTimeout(longPressTimer);
            pressStart = null;
        });
    });

    buildBoard();

    restart.addEventListener("click", start);

    start();

    return function() {
        clearTimeout(longPressTimer);
        clearInterval(clockTimer);
    };
};