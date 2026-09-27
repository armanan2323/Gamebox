window.createMinesweeper = function (root) {
    root.innerHTML = `
        <div class="game-box">
            <div class="game-toolbar">
                <strong>
                    🚩 <span class="mine-count">10</span>
                </strong>

                <button class="game-button minesweeper-restart">
                    Заново
                </button>
            </div>

            <div class="minesweeper-board"></div>

            <p class="game-status minesweeper-status">
                Нажми на клетку, чтобы открыть.
                Удерживай для флажка.
            </p>
        </div>
    `;

    const boardElement = root.querySelector(".minesweeper-board");
    const status = root.querySelector(".minesweeper-status");
    const restart = root.querySelector(".minesweeper-restart");
    const mineCount = root.querySelector(".mine-count");

    const rows = 10;
    const cols = 10;
    const mines = 10;

    let board;
    let gameOver;
    let revealed;
    let flags;

    const longPressDelay = 450;
    let longPressTimer = null;
    let longPressTriggered = false;

    function start() {
        board = Array.from(
            { length: rows },
            () =>
                Array.from(
                    { length: cols },
                    () => ({
                        mine: false,
                        open: false,
                        flag: false,
                        number: 0
                    })
                )
        );

        gameOver = false;
        revealed = 0;
        flags = 0;

        updateMineCounter();

        status.textContent =
            "Нажми на клетку, чтобы открыть. Удерживай для флажка.";

        placeMines();
        calculateNumbers();
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

    function openCell(x, y) {
        if (gameOver) return;

        const cell = board[y][x];

        if (cell.open || cell.flag) return;

        if (cell.mine) {
            cell.open = true;
            gameOver = true;

            revealMines();

            status.textContent =
                "💥 Ты попался на мине. Нажми «Заново».";

            render();
            return;
        }

        reveal(x, y);

        if (revealed >= rows * cols - mines) {
            win();
            return;
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
            cell.mine ||
            cell.flag
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

    function toggleFlag(x, y) {
        if (gameOver) return;

        const cell = board[y][x];

        if (cell.open) return;

        if (!cell.flag && flags >= mines) {
            status.textContent =
                "Все флажки уже использованы.";

            return;
        }

        cell.flag = !cell.flag;

        flags += cell.flag ? 1 : -1;

        updateMineCounter();
        render();

        if (flags === mines) {
            checkFlagWin();
        }
    }

    function checkFlagWin() {
        const correct =
            board.every(row =>
                row.every(cell =>
                    cell.mine === cell.flag
                )
            );

        if (correct) {
            win();
        }
    }

    function win() {
        gameOver = true;

        board.forEach(row => {
            row.forEach(cell => {
                if (cell.mine) {
                    cell.flag = true;
                }

                cell.open = true;
            });
        });

        flags = mines;
        updateMineCounter();

        status.textContent =
            "🎉 Победа! Все мины найдены.";

        render();
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

    function updateMineCounter() {
        mineCount.textContent =
            Math.max(0, mines - flags);
    }

    function render() {
        boardElement.innerHTML = "";

        boardElement.style.gridTemplateColumns =
            `repeat(${cols}, 1fr)`;

        board.forEach((row, y) => {
            row.forEach((cell, x) => {
                const button =
                    document.createElement("button");

                button.className = "mine-cell";

                if (cell.open) {
                    button.classList.add("open");

                    if (cell.mine) {
                        button.classList.add("mine");
                        button.textContent = "💣";
                    } else if (cell.number) {
                        button.textContent =
                            cell.number;
                    }
                } else if (cell.flag) {
                    button.textContent = "🚩";
                }

                button.addEventListener(
                    "click",
                    event => {
                        if (longPressTriggered) {
                            longPressTriggered = false;
                            return;
                        }

                        openCell(x, y);
                    }
                );

                button.addEventListener(
                    "contextmenu",
                    event => {
                        event.preventDefault();
                        toggleFlag(x, y);
                    }
                );

                button.addEventListener(
                    "pointerdown",
                    event => {
                        if (
                            event.pointerType !== "touch"
                        ) {
                            return;
                        }

                        longPressTriggered = false;

                        longPressTimer =
                            setTimeout(() => {
                                longPressTriggered = true;
                                toggleFlag(x, y);
                            }, longPressDelay);
                    }
                );

                button.addEventListener(
                    "pointerup",
                    event => {
                        if (
                            event.pointerType === "touch"
                        ) {
                            clearTimeout(longPressTimer);
                        }
                    }
                );

                button.addEventListener(
                    "pointercancel",
                    () => {
                        clearTimeout(longPressTimer);
                    }
                );

                button.addEventListener(
                    "pointerleave",
                    event => {
                        if (
                            event.pointerType === "touch"
                        ) {
                            clearTimeout(longPressTimer);
                        }
                    }
                );

                boardElement.appendChild(button);
            });
        });
    }

    restart.addEventListener("click", start);

    start();

    return function cleanup() {
        clearTimeout(longPressTimer);
    };
};