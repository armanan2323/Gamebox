window.createChess = function(root) {
    root.innerHTML = `
        <div class="game-box">
            <div class="game-toolbar">
                <strong class="chess-status">
                    Ход белых
                </strong>

                <button class="game-button chess-restart">
                    Заново
                </button>
            </div>

            <div class="chess-board"></div>

            <p class="game-status chess-info">
                Нажми на фигуру, затем на клетку.
            </p>
        </div>
    `;

    const boardElement =
        root.querySelector(".chess-board");

    const status =
        root.querySelector(".chess-status");

    const info =
        root.querySelector(".chess-info");

    const restart =
        root.querySelector(".chess-restart");

    const pieces = {
        wK: "♔",
        wQ: "♕",
        wR: "♖",
        wB: "♗",
        wN: "♘",
        wP: "♙",
        bK: "♚",
        bQ: "♛",
        bR: "♜",
        bB: "♝",
        bN: "♞",
        bP: "♟"
    };

    let board;
    let turn;
    let selected;
    let gameOver;

    function start() {
        board = [
            ["bR","bN","bB","bQ","bK","bB","bN","bR"],
            ["bP","bP","bP","bP","bP","bP","bP","bP"],
            [null,null,null,null,null,null,null,null],
            [null,null,null,null,null,null,null,null],
            [null,null,null,null,null,null,null,null],
            [null,null,null,null,null,null,null,null],
            ["wP","wP","wP","wP","wP","wP","wP","wP"],
            ["wR","wN","wB","wQ","wK","wB","wN","wR"]
        ];

        turn = "w";
        selected = null;
        gameOver = false;

        status.textContent = "Ход белых";
        info.textContent =
            "Нажми на фигуру, затем на клетку.";

        render();
    }

    function color(piece) {
        return piece ? piece[0] : null;
    }

    function type(piece) {
        return piece ? piece[1] : null;
    }

    function validMove(fromY, fromX, toY, toX) {
        const piece = board[fromY][fromX];

        if (!piece) return false;

        if (
            color(piece) !== turn
        ) {
            return false;
        }

        const target = board[toY][toX];

        if (
            target &&
            color(target) === turn
        ) {
            return false;
        }

        const dx = toX - fromX;
        const dy = toY - fromY;

        const adx = Math.abs(dx);
        const ady = Math.abs(dy);

        const t = type(piece);

        if (t === "P") {
            const direction =
                turn === "w" ? -1 : 1;

            const startRow =
                turn === "w" ? 6 : 1;

            if (
                dx === 0 &&
                dy === direction &&
                !target
            ) {
                return true;
            }

            if (
                dx === 0 &&
                dy === direction * 2 &&
                fromY === startRow &&
                !target &&
                !board[fromY + direction][fromX]
            ) {
                return true;
            }

            if (
                adx === 1 &&
                dy === direction &&
                target &&
                color(target) !== turn
            ) {
                return true;
            }

            return false;
        }

        if (t === "N") {
            return (
                (adx === 1 && ady === 2) ||
                (adx === 2 && ady === 1)
            );
        }

        if (t === "K") {
            return (
                adx <= 1 &&
                ady <= 1
            );
        }

        if (
            t === "R" ||
            t === "B" ||
            t === "Q"
        ) {
            let stepX = 0;
            let stepY = 0;

            if (dx !== 0) {
                stepX = dx / adx;
            }

            if (dy !== 0) {
                stepY = dy / ady;
            }

            if (
                t === "R" &&
                dx !== 0 &&
                dy !== 0
            ) {
                return false;
            }

            if (
                t === "B" &&
                adx !== ady
            ) {
                return false;
            }

            if (
                t === "Q" &&
                !(
                    dx === 0 ||
                    dy === 0 ||
                    adx === ady
                )
            ) {
                return false;
            }

            let x = fromX + stepX;
            let y = fromY + stepY;

            while (
                x !== toX ||
                y !== toY
            ) {
                if (board[y][x]) {
                    return false;
                }

                x += stepX;
                y += stepY;
            }

            return true;
        }

        return false;
    }

    function move(fromY, fromX, toY, toX) {
        const piece = board[fromY][fromX];
        const target = board[toY][toX];

        board[toY][toX] = piece;
        board[fromY][fromX] = null;

        if (
            type(piece) === "P" &&
            (toY === 0 || toY === 7)
        ) {
            board[toY][toX] =
                color(piece) + "Q";
        }

        if (
            target &&
            type(target) === "K"
        ) {
            gameOver = true;

            status.textContent =
                turn === "w"
                    ? "Белые победили"
                    : "Чёрные победили";

            info.textContent =
                "Король был взят.";
        } else {
            turn = turn === "w" ? "b" : "w";

            status.textContent =
                turn === "w"
                    ? "Ход белых"
                    : "Ход чёрных";
        }

        selected = null;

        render();
    }

    function clickCell(y, x) {
        if (gameOver) return;

        const piece = board[y][x];

        if (!selected) {
            if (
                piece &&
                color(piece) === turn
            ) {
                selected = { y, x };
                render();
            }

            return;
        }

        if (
            selected.y === y &&
            selected.x === x
        ) {
            selected = null;
            render();
            return;
        }

        if (
            piece &&
            color(piece) === turn
        ) {
            selected = { y, x };
            render();
            return;
        }

        if (
            validMove(
                selected.y,
                selected.x,
                y,
                x
            )
        ) {
            move(
                selected.y,
                selected.x,
                y,
                x
            );
        }
    }

    function render() {
        boardElement.innerHTML = "";

        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                const cell = document.createElement("button");

                cell.className = "chess-cell";

                if ((x + y) % 2) {
                    cell.classList.add("dark");
                }

                if (
                    selected &&
                    selected.y === y &&
                    selected.x === x
                ) {
                    cell.classList.add("selected");
                }

                const piece = board[y][x];

                if (piece) {
                    cell.textContent =
                        pieces[piece];
                }

                cell.addEventListener(
                    "click",
                    () => clickCell(y, x)
                );

                boardElement.appendChild(cell);
            }
        }
    }

    restart.addEventListener("click", start);

    start();

    return function() {};
};