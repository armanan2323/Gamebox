window.createMinesweeper = function(root) {
    root.innerHTML = `
        <div class="game-box">
            <div class="game-toolbar">
                <strong>Мин: <span class="mine-count">10</span></strong>
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

    const rows = 10;
    const cols = 10;
    const mines = 10;

    let board;
    let revealed;
    let flagCount;
    let gameOver;
    let longPressTimer;
    let longPressTriggered;

    function start() {
        clearTimeout(longPressTimer);

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

        placeMines();
        calculateNumbers();

        counter.textContent = mines;
        status.textContent =
            "Нажми на клетку. ПКМ или долгое нажатие - флажок.";

        render();
    }

    function placeMines() {
        let placed = 0;

        while (placed < mines) {
            const x = Math.floor(Math.random() * cols);
            const y = Math.floor(Math.random() * rows);

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

        updateCounter();
        render();
    }

    function openCell(x, y) {
        if (gameOver) return;

        const cell = board[y][x];

        if (cell.open || cell.flagged) return;

        if (cell.mine) {
            cell.open = true;
            gameOver = true;

            revealMines();

            status.textContent = "Ты попал на мину.";
            render();
            return;
        }

        reveal(x, y);

        if (revealed >= rows * cols - mines) {
            gameOver = true;

            board.forEach(row => {
                row.forEach(cell => {
                    if (cell.mine) {
                        cell.flagged = true;
                    }
                });
            });

            flagCount = mines;
            updateCounter();

            status.textContent = "Победа!";
        }

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

    function render() {
        boardElement.innerHTML = "";

        boardElement.style.gridTemplateColumns =
            `repeat(${cols}, 1fr)`;

        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const cell = board[y][x];

                const button = document.createElement("button");

                button.className = "mine-cell";

                if (cell.open) {
                    button.classList.add("open");

                    if (cell.mine) {
                        button.classList.add("mine");
                        button.textContent = "💣";
                    } else if (cell.number > 0) {
                        button.textContent = cell.number;
                    }
                } else if (cell.flagged) {
                    button.classList.add("flagged");
                    button.textContent = "🚩";
                }

                button.addEventListener("contextmenu", event => {
                    event.preventDefault();
                    toggleFlag(x, y);
                });

                button.addEventListener("click", () => {
                    if (longPressTriggered) {
                        longPressTriggered = false;
                        return;
                    }

                    openCell(x, y);
                });

                button.addEventListener("pointerdown", event => {
                    if (event.pointerType !== "touch") {
                        return;
                    }

                    longPressTriggered = false;

                    clearTimeout(longPressTimer);

                    longPressTimer = setTimeout(() => {
                        longPressTriggered = true;
                        toggleFlag(x, y);
                    }, 500);
                });

                button.addEventListener("pointerup", event => {
                    if (event.pointerType === "touch") {
                        clearTimeout(longPressTimer);
                    }
                });

                button.addEventListener("pointercancel", event => {
                    if (event.pointerType === "touch") {
                        clearTimeout(longPressTimer);
                    }
                });

                boardElement.appendChild(button);
            }
        }
    }

    restart.addEventListener("click", start);

    start();

    return function() {
        clearTimeout(longPressTimer);
    };
};