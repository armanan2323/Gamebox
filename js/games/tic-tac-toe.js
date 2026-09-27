window.createTicTacToe = function (root) {
    root.innerHTML = `
        <div class="game-box">
            <div class="game-toolbar">
                <strong class="ttt-status">Твой ход: X</strong>
                <button class="game-button ttt-restart">Заново</button>
            </div>

            <div class="mode-switch">
                <button class="mode-button active" data-mode="ai">
                    Против ИИ
                </button>

                <button class="mode-button" data-mode="friend">
                    С другом
                </button>
            </div>

            <div class="ttt-board"></div>

            <p class="game-status">
                Ты играешь за X.
            </p>
        </div>
    `;

    const boardElement = root.querySelector(".ttt-board");
    const status = root.querySelector(".ttt-status");
    const restart = root.querySelector(".ttt-restart");
    const modeButtons = root.querySelectorAll(".mode-button");

    let board;
    let gameOver;
    let mode = "ai";
    let currentPlayer = "X";
    let aiTimer;

    function start() {
        clearTimeout(aiTimer);

        board = Array(9).fill("");
        gameOver = false;
        currentPlayer = "X";

        updateStatus();
        render();
    }

    function updateStatus() {
        if (gameOver) return;

        if (mode === "ai") {
            status.textContent =
                currentPlayer === "X"
                    ? "Твой ход: X"
                    : "ИИ думает...";
        } else {
            status.textContent = `Ход игрока ${currentPlayer}`;
        }
    }

    function render() {
        boardElement.innerHTML = "";

        board.forEach((value, index) => {
            const button = document.createElement("button");

            button.className = "ttt-cell";
            button.textContent = value;

            button.addEventListener(
                "click",
                () => makeMove(index)
            );

            boardElement.appendChild(button);
        });
    }

    function makeMove(index) {
        if (
            gameOver ||
            board[index] ||
            (mode === "ai" && currentPlayer === "O")
        ) {
            return;
        }

        board[index] = currentPlayer;

        if (check(currentPlayer)) {
            finish(
                mode === "ai" && currentPlayer === "X"
                    ? "Ты победил!"
                    : `Игрок ${currentPlayer} победил!`
            );
            return;
        }

        if (board.every(Boolean)) {
            finish("Ничья.");
            return;
        }

        currentPlayer =
            currentPlayer === "X"
                ? "O"
                : "X";

        updateStatus();
        render();

        if (
            mode === "ai" &&
            currentPlayer === "O"
        ) {
            aiTimer = setTimeout(
                computerMove,
                350
            );
        }
    }

    function computerMove() {
        if (gameOver || mode !== "ai") return;

        let move = findWinningMove("O");

        if (move === null) {
            move = findWinningMove("X");
        }

        if (
            move === null &&
            board[4] === ""
        ) {
            move = 4;
        }

        if (move === null) {
            const corners = [0, 2, 6, 8]
                .filter(index => board[index] === "");

            if (corners.length) {
                move = corners[
                    Math.floor(
                        Math.random() * corners.length
                    )
                ];
            }
        }

        if (move === null) {
            const empty = board
                .map((value, index) =>
                    value ? null : index
                )
                .filter(index => index !== null);

            move = empty[
                Math.floor(
                    Math.random() * empty.length
                )
            ];
        }

        board[move] = "O";

        if (check("O")) {
            finish("ИИ победил.");
            return;
        }

        if (board.every(Boolean)) {
            finish("Ничья.");
            return;
        }

        currentPlayer = "X";

        updateStatus();
        render();
    }

    function findWinningMove(symbol) {
        for (let i = 0; i < 9; i++) {
            if (board[i]) continue;

            board[i] = symbol;

            const wins = check(symbol);

            board[i] = "";

            if (wins) return i;
        }

        return null;
    }

    function check(symbol) {
        const lines = [
            [0, 1, 2],
            [3, 4, 5],
            [6, 7, 8],
            [0, 3, 6],
            [1, 4, 7],
            [2, 5, 8],
            [0, 4, 8],
            [2, 4, 6]
        ];

        return lines.some(line =>
            line.every(index =>
                board[index] === symbol
            )
        );
    }

    function finish(message) {
        gameOver = true;
        clearTimeout(aiTimer);
        status.textContent = message;
        render();
    }

    modeButtons.forEach(button => {
        button.addEventListener("click", () => {
            mode = button.dataset.mode;

            modeButtons.forEach(item => {
                item.classList.toggle(
                    "active",
                    item === button
                );
            });

            start();
        });
    });

    restart.addEventListener("click", start);

    start();

    return function cleanup() {
        clearTimeout(aiTimer);
    };
};