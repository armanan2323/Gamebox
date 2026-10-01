window.createTicTacToe = function(root) {
    root.innerHTML = `
        <div class="game-box">
            <div class="game-toolbar">
                <strong>
                    Ход:
                    <span class="ttt-turn">X</span>
                </strong>

                <button class="game-button ttt-restart">
                    Заново
                </button>
            </div>

            <div class="mode-switch">
                <button
                    class="mode-button active"
                    data-mode="ai"
                >
                    Против ИИ
                </button>

                <button
                    class="mode-button"
                    data-mode="two"
                >
                    Два игрока
                </button>
            </div>

            <div class="ttt-board"></div>

            <p class="game-status ttt-status">
                Твой ход
            </p>
        </div>
    `;

    const boardElement =
        root.querySelector(".ttt-board");

    const turnElement =
        root.querySelector(".ttt-turn");

    const statusElement =
        root.querySelector(".ttt-status");

    const restartButton =
        root.querySelector(".ttt-restart");

    const modeButtons =
        root.querySelectorAll(".mode-button");

    let board = [];
    let currentPlayer = "X";
    let gameOver = false;
    let mode = "ai";
    let aiTimer = null;

    function reset() {
        if (aiTimer) {
            clearTimeout(aiTimer);
            aiTimer = null;
        }

        board = [
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            ""
        ];

        currentPlayer = "X";
        gameOver = false;

        statusElement.textContent =
            mode === "ai"
                ? "Твой ход"
                : `Ход: ${GameBox.name(1)} (X)`;

        render();
    }

    const combinations = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6]
    ];

    const cells = Array.from({ length: 9 }, (_, index) => {
        const cell = document.createElement("button");

        cell.className = "ttt-cell";

        cell.addEventListener("click", () => {
            makeMove(index);
        });

        boardElement.appendChild(cell);

        return cell;
    });

    function render() {
        const line = gameOver
            ? combinations.find(combination =>
                board[combination[0]] &&
                combination.every(index => board[index] === board[combination[0]])
            )
            : null;

        board.forEach(
            (value, index) => {
                const cell = cells[index];

                cell.textContent = value;
                cell.className = "ttt-cell";

                if (value) {
                    cell.classList.add(
                        value.toLowerCase()
                    );
                }

                if (line && line.includes(index)) {
                    cell.classList.add("win");
                }
            }
        );

        turnElement.textContent =
            currentPlayer;
    }

    function makeMove(index) {
        if (gameOver) return;

        if (board[index] !== "") {
            return;
        }

        if (
            mode === "ai" &&
            currentPlayer === "O"
        ) {
            return;
        }

        board[index] =
            currentPlayer;

        GameBox.sound("place");

        render();

        const result =
            checkGame();

        if (result) {
            return;
        }

        currentPlayer =
            currentPlayer === "X"
                ? "O"
                : "X";

        render();

        if (
            mode === "ai" &&
            currentPlayer === "O"
        ) {
            statusElement.textContent =
                "ИИ думает...";

            aiTimer = setTimeout(
                aiMove,
                450
            );
        } else {
            statusElement.textContent =
                `Ход: ${GameBox.name(currentPlayer === "X" ? 1 : 2)} (${currentPlayer})`;
        }
    }

    function aiMove() {
        aiTimer = null;

        if (gameOver) return;

        const emptyCells =
            getEmptyCells();

        if (!emptyCells.length) {
            return;
        }

        let move;

        const randomMistake =
            Math.random() < 0.45;

        if (randomMistake) {
            move =
                emptyCells[
                    Math.floor(
                        Math.random() *
                        emptyCells.length
                    )
                ];
        } else {
            move = findEasyMove();
        }

        board[move] = "O";

        GameBox.sound("move");

        render();

        const result =
            checkGame();

        if (result) {
            return;
        }

        currentPlayer = "X";

        statusElement.textContent =
            "Твой ход";

        render();
    }

    function findEasyMove() {
        const winningMove =
            findWinningMove("O");

        if (
            winningMove !== -1 &&
            Math.random() < 0.65
        ) {
            return winningMove;
        }

        const blockMove =
            findWinningMove("X");

        if (
            blockMove !== -1 &&
            Math.random() < 0.45
        ) {
            return blockMove;
        }

        if (
            board[4] === "" &&
            Math.random() < 0.5
        ) {
            return 4;
        }

        const corners = [
            0,
            2,
            6,
            8
        ].filter(
            index =>
                board[index] === ""
        );

        if (
            corners.length &&
            Math.random() < 0.5
        ) {
            return corners[
                Math.floor(
                    Math.random() *
                    corners.length
                )
            ];
        }

        const emptyCells =
            getEmptyCells();

        return emptyCells[
            Math.floor(
                Math.random() *
                emptyCells.length
            )
        ];
    }

    function findWinningMove(player) {
        const emptyCells =
            getEmptyCells();

        for (const index of emptyCells) {
            board[index] = player;

            const won =
                hasWinner(player);

            board[index] = "";

            if (won) {
                return index;
            }
        }

        return -1;
    }

    function getEmptyCells() {
        return board
            .map(
                (value, index) =>
                    value === ""
                        ? index
                        : -1
            )
            .filter(
                index => index !== -1
            );
    }

    function hasWinner(player) {
        return combinations.some(
            combination =>
                combination.every(
                    index =>
                        board[index] ===
                        player
                )
        );
    }

    function checkGame() {
        if (
            hasWinner(currentPlayer)
        ) {
            gameOver = true;

            const winnerNumber = currentPlayer === "X" ? 1 : 2;

            statusElement.textContent =
                mode === "ai"
                    ? currentPlayer === "X"
                        ? "Ты победил!"
                        : "ИИ победил!"
                    : `${GameBox.name(winnerNumber)} (${currentPlayer}) победил!`;

            if (mode === "ai") {
                GameBox.win(currentPlayer === "X" ? GameBox.name(1) : GameBox.aiName);
                GameBox.sound(currentPlayer === "X" ? "win" : "lose");
            } else {
                GameBox.win(GameBox.name(winnerNumber));
                GameBox.sound("win");
            }

            render();

            return true;
        }

        if (
            board.every(
                cell => cell !== ""
            )
        ) {
            gameOver = true;

            statusElement.textContent =
                "Ничья!";

            GameBox.sound("error");

            return true;
        }

        return false;
    }

    function changeMode(event) {
        mode =
            event.currentTarget.dataset.mode;

        modeButtons.forEach(
            button => {
                button.classList.toggle(
                    "active",
                    button.dataset.mode ===
                        mode
                );
            }
        );

        reset();
    }

    modeButtons.forEach(
        button => {
            button.addEventListener(
                "click",
                changeMode
            );
        }
    );

    restartButton.addEventListener(
        "click",
        reset
    );

    reset();

    return function cleanup() {
        if (aiTimer) {
            clearTimeout(aiTimer);
        }

        modeButtons.forEach(
            button => {
                button.removeEventListener(
                    "click",
                    changeMode
                );
            }
        );

        restartButton.removeEventListener(
            "click",
            reset
        );
    };
};