window.createConnectFour = function(root) {
    root.innerHTML = `
        <div class="game-box">
            <div class="game-toolbar">
                <strong>Ход: <span class="connect-four-turn">Красные</span></strong>
                <button class="game-button connect-four-restart">Заново</button>
            </div>

            <div class="mode-switch">
                <button class="mode-button active" data-mode="two">👥 Вдвоём</button>
                <button class="mode-button" data-mode="ai">🤖 Против ИИ</button>
            </div>

            <div class="connect-four-board"></div>

            <p class="game-status connect-four-status">
                Нажми на колонку, чтобы поставить фишку
            </p>
        </div>
    `;

    const boardElement = root.querySelector(".connect-four-board");
    const turnElement = root.querySelector(".connect-four-turn");
    const statusElement = root.querySelector(".connect-four-status");
    const restartButton = root.querySelector(".connect-four-restart");

    const ROWS = 6;
    const COLS = 7;

    const modeButtons = root.querySelectorAll(".mode-button");

    let board;
    let currentPlayer;
    let gameOver;
    let mode = "two";
    let aiTimer = null;
    let winLine = [];

    const cells = [];

    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const cell = document.createElement("button");

            cell.className = "connect-four-cell";
            cell.setAttribute(
                "aria-label",
                `Строка ${row + 1}, колонка ${col + 1}`
            );

            cell.addEventListener("click", () => {
                if (mode === "ai" && currentPlayer === 2) return;
                playColumn(col);
            });

            boardElement.appendChild(cell);
            cells.push(cell);
        }
    }

    function createEmptyBoard() {
        return Array.from(
            { length: ROWS },
            () => Array(COLS).fill(0)
        );
    }

    function reset() {
        clearTimeout(aiTimer);

        board = createEmptyBoard();
        currentPlayer = 1;
        gameOver = false;
        winLine = [];

        statusElement.textContent =
            "Нажми на колонку, чтобы поставить фишку";

        render();
    }

    function render() {
        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                const cell = cells[row * COLS + col];
                const value = board[row][col];

                cell.classList.toggle("red", value === 1);
                cell.classList.toggle("yellow", value === 2);
                cell.classList.toggle(
                    "win",
                    winLine.some(([r, c]) => r === row && c === col)
                );
            }
        }

        turnElement.textContent =
            currentPlayer === 1
                ? "Красные"
                : "Жёлтые";
    }

    function playColumn(col) {
        if (gameOver) return;

        let targetRow = -1;

        for (let row = ROWS - 1; row >= 0; row--) {
            if (board[row][col] === 0) {
                targetRow = row;
                break;
            }
        }

        if (targetRow === -1) {
            statusElement.textContent =
                "Эта колонка заполнена";

            GameBox.sound("error");

            return;
        }

        board[targetRow][col] = currentPlayer;

        GameBox.sound("drop");

        if (checkWin(targetRow, col, currentPlayer)) {
            gameOver = true;

            render();

            const winner =
                currentPlayer === 1
                    ? "Красные"
                    : "Жёлтые";

            statusElement.textContent =
                `${winner} победили!`;

            if (mode === "ai") {
                GameBox.win(currentPlayer === 1 ? GameBox.name(1) : GameBox.aiName);
                GameBox.sound(currentPlayer === 1 ? "win" : "lose");
            } else {
                GameBox.win(GameBox.name(currentPlayer));
                GameBox.sound("win");
            }

            GameBox.vibrate(100);

            return;
        }

        if (isBoardFull()) {
            gameOver = true;

            render();

            statusElement.textContent =
                "Ничья! Поле полностью заполнено.";

            return;
        }

        currentPlayer =
            currentPlayer === 1
                ? 2
                : 1;

        statusElement.textContent =
            mode === "ai" && currentPlayer === 2
                ? "ИИ думает..."
                : `Ход игрока ${
                    currentPlayer === 1
                        ? "красных"
                        : "жёлтых"
                }`;

        render();

        if (mode === "ai" && currentPlayer === 2) {
            aiTimer = setTimeout(aiMove, 450);
        }
    }

    function dropRow(col) {
        for (let row = ROWS - 1; row >= 0; row--) {
            if (board[row][col] === 0) return row;
        }

        return -1;
    }

    // Простой ИИ: выигрывает, блокирует, иначе выбирает ход ближе к центру,
    // не давая сопернику выиграть следующим ходом.
    function aiMove() {
        if (gameOver) return;

        const columns = [3, 2, 4, 1, 5, 0, 6].filter(col => dropRow(col) !== -1);

        const winsWith = (player, col) => {
            const row = dropRow(col);
            board[row][col] = player;
            const result = checkWin(row, col, player, true);
            board[row][col] = 0;
            return result;
        };

        let choice = columns.find(col => winsWith(2, col));

        if (choice === undefined) {
            choice = columns.find(col => winsWith(1, col));
        }

        if (choice === undefined) {
            const safe = columns.filter(col => {
                const row = dropRow(col);

                if (row === 0) return true;

                board[row][col] = 2;
                const danger = board[row - 1][col] === 0 && winsWith(1, col);
                board[row][col] = 0;

                return !danger;
            });

            const pool = safe.length ? safe : columns;

            choice = Math.random() < 0.7
                ? pool[0]
                : pool[Math.floor(Math.random() * pool.length)];
        }

        playColumn(choice);
    }

    function checkWin(row, col, player, test) {
        const directions = [
            [0, 1],
            [1, 0],
            [1, 1],
            [1, -1]
        ];

        for (const [rowDirection, colDirection] of directions) {
            let count = 1;

            count += countDirection(
                row,
                col,
                rowDirection,
                colDirection,
                player
            );

            count += countDirection(
                row,
                col,
                -rowDirection,
                -colDirection,
                player
            );

            if (count >= 4) {
                if (!test) {
                    winLine = [[row, col]];

                    [1, -1].forEach(sign => {
                        let r = row + rowDirection * sign;
                        let c = col + colDirection * sign;

                        while (
                            r >= 0 && r < ROWS &&
                            c >= 0 && c < COLS &&
                            board[r][c] === player
                        ) {
                            winLine.push([r, c]);
                            r += rowDirection * sign;
                            c += colDirection * sign;
                        }
                    });
                }

                return true;
            }
        }

        return false;
    }

    function countDirection(
        row,
        col,
        rowDirection,
        colDirection,
        player
    ) {
        let count = 0;

        let nextRow = row + rowDirection;
        let nextCol = col + colDirection;

        while (
            nextRow >= 0 &&
            nextRow < ROWS &&
            nextCol >= 0 &&
            nextCol < COLS &&
            board[nextRow][nextCol] === player
        ) {
            count++;

            nextRow += rowDirection;
            nextCol += colDirection;
        }

        return count;
    }

    function isBoardFull() {
        return board[0].every(
            cell => cell !== 0
        );
    }

    restartButton.addEventListener(
        "click",
        reset
    );

    modeButtons.forEach(button => {
        button.addEventListener("click", () => {
            mode = button.dataset.mode;

            modeButtons.forEach(item => {
                item.classList.toggle("active", item === button);
            });

            reset();
        });
    });

    reset();

    return function cleanup() {
        clearTimeout(aiTimer);

        restartButton.removeEventListener(
            "click",
            reset
        );
    };
};