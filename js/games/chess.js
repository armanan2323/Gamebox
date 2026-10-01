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
    let castling;
    let enPassant;
    let lastMove;
    let legalTargets = [];

    const cells = [];

    for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
            const cell = document.createElement("button");

            cell.className = "chess-cell";
            cell.addEventListener("click", () => clickCell(y, x));

            boardElement.appendChild(cell);
            cells.push(cell);
        }
    }

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
        legalTargets = [];
        lastMove = null;
        enPassant = null;

        castling = {
            wK: true, wQ: true,
            bK: true, bQ: true
        };

        status.textContent = `Ход белых · ${GameBox.name(1)}`;
        info.textContent =
            "Нажми на фигуру, затем на подсвеченную клетку.";

        render();
    }

    function color(piece) {
        return piece ? piece[0] : null;
    }

    function type(piece) {
        return piece ? piece[1] : null;
    }

    function enemyOf(side) {
        return side === "w" ? "b" : "w";
    }

    function inside(y, x) {
        return y >= 0 && y < 8 && x >= 0 && x < 8;
    }

    // Атакует ли сторона side клетку (y, x).
    function isAttacked(y, x, side) {
        const pawnDir = side === "w" ? 1 : -1;

        for (const dx of [-1, 1]) {
            const py = y + pawnDir;
            const px = x + dx;

            if (inside(py, px) && board[py][px] === side + "P") return true;
        }

        const knight = [[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]];

        for (const [dy, dx] of knight) {
            if (inside(y + dy, x + dx) && board[y + dy][x + dx] === side + "N") return true;
        }

        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if ((dy || dx) && inside(y + dy, x + dx) && board[y + dy][x + dx] === side + "K") {
                    return true;
                }
            }
        }

        const lines = [
            [[0,1],[0,-1],[1,0],[-1,0]], ["R", "Q"],
            [[1,1],[1,-1],[-1,1],[-1,-1]], ["B", "Q"]
        ];

        for (let i = 0; i < lines.length; i += 2) {
            for (const [dy, dx] of lines[i]) {
                let yy = y + dy;
                let xx = x + dx;

                while (inside(yy, xx)) {
                    const piece = board[yy][xx];

                    if (piece) {
                        if (color(piece) === side && lines[i + 1].includes(type(piece))) {
                            return true;
                        }

                        break;
                    }

                    yy += dy;
                    xx += dx;
                }
            }
        }

        return false;
    }

    function findKing(side) {
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                if (board[y][x] === side + "K") return { y, x };
            }
        }

        return null;
    }

    function inCheck(side) {
        const king = findKing(side);
        return king ? isAttacked(king.y, king.x, enemyOf(side)) : false;
    }

    // Ходы фигуры без учёта шаха своему королю.
    function pseudoMoves(fromY, fromX) {
        const piece = board[fromY][fromX];
        const side = color(piece);
        const t = type(piece);
        const moves = [];

        const add = (y, x, extra = {}) => {
            if (!inside(y, x)) return false;

            const target = board[y][x];

            if (target && color(target) === side) return false;

            moves.push({ y, x, ...extra });

            return !target;
        };

        if (t === "P") {
            const dir = side === "w" ? -1 : 1;
            const startRow = side === "w" ? 6 : 1;

            if (inside(fromY + dir, fromX) && !board[fromY + dir][fromX]) {
                moves.push({ y: fromY + dir, x: fromX });

                if (fromY === startRow && !board[fromY + dir * 2][fromX]) {
                    moves.push({ y: fromY + dir * 2, x: fromX, double: true });
                }
            }

            for (const dx of [-1, 1]) {
                const y = fromY + dir;
                const x = fromX + dx;

                if (!inside(y, x)) continue;

                const target = board[y][x];

                if (target && color(target) !== side) {
                    moves.push({ y, x });
                }

                if (enPassant && enPassant.y === y && enPassant.x === x) {
                    moves.push({ y, x, enPassant: true });
                }
            }

            return moves;
        }

        if (t === "N") {
            [[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]]
                .forEach(([dy, dx]) => add(fromY + dy, fromX + dx));

            return moves;
        }

        if (t === "K") {
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dy || dx) add(fromY + dy, fromX + dx);
                }
            }

            const row = side === "w" ? 7 : 0;
            const enemy = enemyOf(side);

            if (fromY === row && fromX === 4 && !isAttacked(row, 4, enemy)) {
                if (
                    castling[side + "K"] &&
                    !board[row][5] && !board[row][6] &&
                    board[row][7] === side + "R" &&
                    !isAttacked(row, 5, enemy) &&
                    !isAttacked(row, 6, enemy)
                ) {
                    moves.push({ y: row, x: 6, castle: "K" });
                }

                if (
                    castling[side + "Q"] &&
                    !board[row][3] && !board[row][2] && !board[row][1] &&
                    board[row][0] === side + "R" &&
                    !isAttacked(row, 3, enemy) &&
                    !isAttacked(row, 2, enemy)
                ) {
                    moves.push({ y: row, x: 2, castle: "Q" });
                }
            }

            return moves;
        }

        const directions = [];

        if (t === "R" || t === "Q") directions.push([0,1],[0,-1],[1,0],[-1,0]);
        if (t === "B" || t === "Q") directions.push([1,1],[1,-1],[-1,1],[-1,-1]);

        directions.forEach(([dy, dx]) => {
            let y = fromY + dy;
            let x = fromX + dx;

            while (add(y, x)) {
                y += dy;
                x += dx;
            }
        });

        return moves;
    }

    function applyMove(fromY, fromX, move) {
        const piece = board[fromY][fromX];
        const captured = move.enPassant
            ? board[fromY][move.x]
            : board[move.y][move.x];

        board[move.y][move.x] = piece;
        board[fromY][fromX] = null;

        if (move.enPassant) {
            board[fromY][move.x] = null;
        }

        if (move.castle) {
            const row = move.y;

            if (move.castle === "K") {
                board[row][5] = board[row][7];
                board[row][7] = null;
            } else {
                board[row][3] = board[row][0];
                board[row][0] = null;
            }
        }

        if (type(piece) === "P" && (move.y === 0 || move.y === 7)) {
            board[move.y][move.x] = color(piece) + "Q";
        }

        return captured;
    }

    function legalMoves(fromY, fromX) {
        const piece = board[fromY][fromX];
        const side = color(piece);

        return pseudoMoves(fromY, fromX).filter(move => {
            const saved = board.map(row => [...row]);

            applyMove(fromY, fromX, move);

            const safe = !inCheck(side);

            board = saved;

            return safe;
        });
    }

    function hasAnyMoves(side) {
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                if (color(board[y][x]) === side && legalMoves(y, x).length) {
                    return true;
                }
            }
        }

        return false;
    }

    function move(fromY, fromX, moveData) {
        const piece = board[fromY][fromX];
        const side = color(piece);

        const captured = applyMove(fromY, fromX, moveData);

        // Права на рокировку теряются после хода короля или ладьи.
        if (type(piece) === "K") {
            castling[side + "K"] = false;
            castling[side + "Q"] = false;
        }

        [[7, 0, "wQ"], [7, 7, "wK"], [0, 0, "bQ"], [0, 7, "bK"]].forEach(([y, x, right]) => {
            if (
                (fromY === y && fromX === x) ||
                (moveData.y === y && moveData.x === x)
            ) {
                castling[right] = false;
            }
        });

        enPassant = moveData.double
            ? { y: (fromY + moveData.y) / 2, x: fromX }
            : null;

        lastMove = { fromY, fromX, toY: moveData.y, toX: moveData.x };
        selected = null;
        legalTargets = [];

        turn = enemyOf(turn);

        const check = inCheck(turn);
        const canMove = hasAnyMoves(turn);
        const sideName = turn === "w" ? "белых" : "чёрных";
        const playerNumber = turn === "w" ? 1 : 2;

        if (!canMove) {
            gameOver = true;

            if (check) {
                const winnerNumber = playerNumber === 1 ? 2 : 1;
                const winnerName = winnerNumber === 1 ? "Белые" : "Чёрные";

                status.textContent = `Мат! ${winnerName} победили`;
                info.textContent = `${GameBox.name(winnerNumber)} выигрывает партию.`;

                GameBox.sound("win");
                GameBox.vibrate(150);
                GameBox.win(GameBox.name(winnerNumber));
            } else {
                status.textContent = "Пат - ничья";
                info.textContent = "Ходов нет, но короля не атакуют.";

                GameBox.sound("error");
            }
        } else if (onlyKings()) {
            gameOver = true;
            status.textContent = "Ничья";
            info.textContent = "На доске остались только короли.";
        } else {
            status.textContent = `Ход ${sideName} · ${GameBox.name(playerNumber)}`;
            info.textContent = check
                ? "Шах! Защитите короля."
                : "Нажми на фигуру, затем на подсвеченную клетку.";

            if (check) {
                GameBox.sound("error");
                GameBox.vibrate(60);
            } else {
                GameBox.sound(captured ? "hit" : "place");
            }
        }

        render();
    }

    function onlyKings() {
        return board.every(row => row.every(piece => !piece || type(piece) === "K"));
    }

    function selectPiece(y, x) {
        selected = { y, x };
        legalTargets = legalMoves(y, x);

        GameBox.sound("tick");

        if (!legalTargets.length) {
            info.textContent = "У этой фигуры нет допустимых ходов.";
        }

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
                selectPiece(y, x);
            }

            return;
        }

        if (
            selected.y === y &&
            selected.x === x
        ) {
            selected = null;
            legalTargets = [];
            render();
            return;
        }

        if (
            piece &&
            color(piece) === turn
        ) {
            selectPiece(y, x);
            return;
        }

        const target = legalTargets.find(item => item.y === y && item.x === x);

        if (target) {
            move(selected.y, selected.x, target);
        } else {
            GameBox.sound("error");
        }
    }

    function render() {
        const king = inCheck(turn) ? findKing(turn) : null;

        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                const cell = cells[y * 8 + x];

                let className = "chess-cell";

                if ((x + y) % 2) className += " dark";

                if (
                    lastMove &&
                    ((lastMove.fromY === y && lastMove.fromX === x) ||
                     (lastMove.toY === y && lastMove.toX === x))
                ) {
                    className += " last";
                }

                if (
                    selected &&
                    selected.y === y &&
                    selected.x === x
                ) {
                    className += " selected";
                }

                const target = legalTargets.find(item => item.y === y && item.x === x);

                if (target) {
                    className += board[y][x] || target.enPassant ? " capture" : " move";
                }

                if (king && king.y === y && king.x === x) {
                    className += " check";
                }

                cell.className = className;

                const piece = board[y][x];
                cell.textContent = piece ? pieces[piece] : "";
            }
        }
    }

    restart.addEventListener("click", start);

    start();

    return function() {};
};