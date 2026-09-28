window.createPuzzle15 = function(root) {
    root.innerHTML = `
        <div class="game-box">
            <div class="game-toolbar">
                <strong>
                    Ходы: <span class="puzzle15-moves">0</span>
                </strong>

                <button class="game-button puzzle15-restart">
                    Заново
                </button>
            </div>

            <div class="puzzle15-board"></div>

            <p class="game-status puzzle15-status">
                Собери числа от 1 до 15.
            </p>
        </div>
    `;

    const boardElement =
        root.querySelector(".puzzle15-board");

    const movesElement =
        root.querySelector(".puzzle15-moves");

    const status =
        root.querySelector(".puzzle15-status");

    const restart =
        root.querySelector(".puzzle15-restart");

    let board;
    let moves;

    function start() {
        board = [
            1,2,3,4,
            5,6,7,8,
            9,10,11,12,
            13,14,15,0
        ];

        moves = 0;

        for (let i = 0; i < 300; i++) {
            const empty = board.indexOf(0);

            const neighbors = getNeighbors(empty);

            const target =
                neighbors[
                    Math.floor(
                        Math.random() *
                        neighbors.length
                    )
                ];

            [board[empty], board[target]] =
                [board[target], board[empty]];
        }

        movesElement.textContent = moves;
        status.textContent =
            "Собери числа от 1 до 15.";

        render();
    }

    function getNeighbors(index) {
        const row = Math.floor(index / 4);
        const col = index % 4;

        const result = [];

        if (row > 0) {
            result.push(index - 4);
        }

        if (row < 3) {
            result.push(index + 4);
        }

        if (col > 0) {
            result.push(index - 1);
        }

        if (col < 3) {
            result.push(index + 1);
        }

        return result;
    }

    function move(index) {
        const empty = board.indexOf(0);

        if (!getNeighbors(empty).includes(index)) {
            return;
        }

        [board[empty], board[index]] =
            [board[index], board[empty]];

        moves++;

        movesElement.textContent = moves;

        if (isSolved()) {
            status.textContent =
                `Победа! Ходов: ${moves}`;
        }

        render();
    }

    function isSolved() {
        for (let i = 0; i < 15; i++) {
            if (board[i] !== i + 1) {
                return false;
            }
        }

        return board[15] === 0;
    }

    function render() {
        boardElement.innerHTML = "";

        board.forEach((value, index) => {
            const cell = document.createElement("button");

            cell.className = "puzzle15-cell";

            if (value) {
                cell.textContent = value;

                cell.addEventListener(
                    "click",
                    () => move(index)
                );
            }

            boardElement.appendChild(cell);
        });
    }

    restart.addEventListener("click", start);

    start();

    return function() {};
};