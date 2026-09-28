window.createConnectFour = function(root) {
    root.innerHTML = `
        <div class="game-box">
            <div class="game-toolbar">
                <strong>Ход: <span class="connect-four-turn">Красные</span></strong>
                <button class="game-button connect-four-restart">Заново</button>
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

    let board;
    let currentPlayer;
    let gameOver;

    function createEmptyBoard() {
        return Array.from(
            { length: ROWS },
            () => Array(COLS).fill(0)
        );
    }

    function reset() {
        board = createEmptyBoard();
        currentPlayer = 1;
        gameOver = false;

        statusElement.textContent =
            "Нажми на колонку, чтобы поставить фишку";

        render();
    }

    function render() {
        boardElement.innerHTML = "";

        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                const cell = document.createElement("button");

                cell.className = "connect-four-cell";

                const value = board[row][col];

                if (value === 1) {
                    cell.classList.add("red");
                }

                if (value === 2) {
                    cell.classList.add("yellow");
                }

                cell.setAttribute(
                    "aria-label",
                    `Строка ${row + 1}, колонка ${col + 1}`
                );

                cell.addEventListener("click", () => {
                    playColumn(col);
                });

                boardElement.appendChild(cell);
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

            return;
        }

        board[targetRow][col] = currentPlayer;

        if (checkWin(targetRow, col, currentPlayer)) {
            gameOver = true;

            render();

            const winner =
                currentPlayer === 1
                    ? "Красные"
                    : "Жёлтые";

            statusElement.textContent =
                `${winner} победили!`;

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
            `Ход игрока ${
                currentPlayer === 1
                    ? "красных"
                    : "жёлтых"
            }`;

        render();
    }

    function checkWin(row, col, player) {
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

    reset();

    return function cleanup() {
        restartButton.removeEventListener(
            "click",
            reset
        );
    };
};