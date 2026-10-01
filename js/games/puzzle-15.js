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

            <div class="mobile-controls">
                <div class="mobile-dpad ">
                    <button class="mobile-control" data-dir="up" aria-label="Вверх">↑</button>

                    <div class="mobile-dpad-middle">
                        <button class="mobile-control" data-dir="left" aria-label="Влево">←</button>
                        <button class="mobile-control" data-dir="down" aria-label="Вниз">↓</button>
                        <button class="mobile-control" data-dir="right" aria-label="Вправо">→</button>
                    </div>
                </div>
            </div>

            <p class="game-status puzzle15-status">
                Собери числа от 1 до 15. Нажимай на плитки, свайпай или используй стрелки.
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
    let solved;

    const cells = Array.from({ length: 16 }, (_, index) => {
        const cell = document.createElement("button");

        cell.className = "puzzle15-cell";
        cell.addEventListener("click", () => move(index));

        boardElement.appendChild(cell);

        return cell;
    });

    function start() {
        board = [
            1,2,3,4,
            5,6,7,8,
            9,10,11,12,
            13,14,15,0
        ];

        moves = 0;
        solved = false;

        // Перемешиваем реальными ходами - головоломка всегда решаема.
        let previous = -1;

        do {
            for (let i = 0; i < 300; i++) {
                const empty = board.indexOf(0);

                const neighbors = getNeighbors(empty)
                    .filter(index => index !== previous);

                const target =
                    neighbors[
                        Math.floor(
                            Math.random() *
                            neighbors.length
                        )
                    ];

                [board[empty], board[target]] =
                    [board[target], board[empty]];

                previous = empty;
            }
        } while (isSolved());

        movesElement.textContent = moves;
        status.textContent =
            "Собери числа от 1 до 15. Нажимай на плитки, свайпай или используй стрелки.";

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

    // Можно нажать на любую плитку в одном ряду/столбце с пустой клеткой:
    // сдвинется вся линия.
    function move(index) {
        if (solved || !board[index]) return;

        const empty = board.indexOf(0);

        const sameRow = Math.floor(index / 4) === Math.floor(empty / 4);
        const sameCol = index % 4 === empty % 4;

        if (!sameRow && !sameCol) {
            GameBox.sound("error");
            return;
        }

        const step = sameRow
            ? (index > empty ? 1 : -1)
            : (index > empty ? 4 : -4);

        let current = empty;

        while (current !== index) {
            const next = current + step;

            board[current] = board[next];
            board[next] = 0;

            current = next;
            moves++;
        }

        movesElement.textContent = moves;

        GameBox.sound("move");

        if (isSolved()) {
            solved = true;

            status.textContent =
                `Победа! Ходов: ${moves}`;

            GameBox.sound("win");
            GameBox.vibrate(100);
            GameBox.submit(moves);
        }

        render();
    }

    function slide(direction) {
        const empty = board.indexOf(0);
        const row = Math.floor(empty / 4);
        const col = empty % 4;

        // Плитка двигается в сторону свайпа/стрелки - в пустую клетку.
        const sources = {
            left: col < 3 ? empty + 1 : -1,
            right: col > 0 ? empty - 1 : -1,
            up: row < 3 ? empty + 4 : -1,
            down: row > 0 ? empty - 4 : -1
        };

        const source = sources[direction];

        if (source >= 0) move(source);
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
        board.forEach((value, index) => {
            const cell = cells[index];

            cell.textContent = value || "";
            cell.style.visibility = value ? "visible" : "hidden";
        });
    }

    function keydown(event) {
        const keys = {
            ArrowLeft: "left",
            ArrowRight: "right",
            ArrowUp: "up",
            ArrowDown: "down"
        };

        if (keys[event.key]) {
            event.preventDefault();
            slide(keys[event.key]);
        }
    }

    GameBox.swipe(boardElement, slide, { distance: 24 });

    root.querySelectorAll(".mobile-dpad .mobile-control").forEach(button => {
        GameBox.hold(button, () => slide(button.dataset.dir));
    });

    restart.addEventListener("click", start);
    document.addEventListener("keydown", keydown);

    start();

    return function() {
        document.removeEventListener("keydown", keydown);
    };
};