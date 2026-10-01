window.createSudoku = function(root) {
    root.innerHTML = `
        <div class="game-box">
            <div class="game-toolbar">
                <strong>⏱ <span class="sudoku-time">0:00</span></strong>

                <button class="game-button sudoku-restart">
                    Новая игра
                </button>
            </div>

            <div class="sudoku-board"></div>

            <div class="number-pad">
                ${[1,2,3,4,5,6,7,8,9]
                    .map(n => `<button data-number="${n}">${n}</button>`)
                    .join("")}
                <button data-number="0">⌫</button>
            </div>

            <p class="game-status sudoku-status">
                Выбери клетку и число. Можно вводить с клавиатуры.
            </p>
        </div>
    `;

    const boardElement =
        root.querySelector(".sudoku-board");

    const pad =
        root.querySelectorAll(".number-pad button");

    const status =
        root.querySelector(".sudoku-status");

    const restart =
        root.querySelector(".sudoku-restart");

    const timeElement =
        root.querySelector(".sudoku-time");

    let solution;
    let puzzle;
    let given;
    let selected = null;
    let solved = false;
    let startTime = 0;
    let clockTimer = null;

    const cells = [];

    for (let y = 0; y < 9; y++) {
        for (let x = 0; x < 9; x++) {
            const cell = document.createElement("button");

            cell.className = "sudoku-cell";

            cell.addEventListener("click", () => selectCell(y, x));

            boardElement.appendChild(cell);
            cells.push(cell);
        }
    }

    function shuffle(list) {
        for (let i = list.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [list[i], list[j]] = [list[j], list[i]];
        }

        return list;
    }

    function createSolution() {
        const base = [
            [1,2,3,4,5,6,7,8,9],
            [4,5,6,7,8,9,1,2,3],
            [7,8,9,1,2,3,4,5,6],
            [2,3,4,5,6,7,8,9,1],
            [5,6,7,8,9,1,2,3,4],
            [8,9,1,2,3,4,5,6,7],
            [3,4,5,6,7,8,9,1,2],
            [6,7,8,9,1,2,3,4,5],
            [9,1,2,3,4,5,6,7,8]
        ];

        const rows = shuffleGroups();
        const cols = shuffleGroups();

        // Перестановка цифр делает сетки менее похожими друг на друга.
        const digits = shuffle([1,2,3,4,5,6,7,8,9]);

        return rows.map(r =>
            cols.map(c => digits[base[r][c] - 1])
        );
    }

    function shuffleGroups() {
        const groups = shuffle([
            [0,1,2],
            [3,4,5],
            [6,7,8]
        ]);

        groups.forEach(group => shuffle(group));

        const order = [];

        groups.forEach(group => {
            order.push(...group);
        });

        return order;
    }

    function formatTime(seconds) {
        return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
    }

    function elapsed() {
        return Math.floor((Date.now() - startTime) / 1000);
    }

    function start() {
        solution = createSolution();

        puzzle = solution.map(row => [...row]);

        const indexes = shuffle(
            Array.from({ length: 81 }, (_, i) => i)
        );

        indexes.slice(0, 45).forEach(index => {
            const y = Math.floor(index / 9);
            const x = index % 9;

            puzzle[y][x] = 0;
        });

        given = puzzle.map(row => row.map(Boolean));

        selected = null;
        solved = false;

        startTime = Date.now();
        clearInterval(clockTimer);
        timeElement.textContent = "0:00";
        clockTimer = setInterval(() => {
            if (!solved) timeElement.textContent = formatTime(elapsed());
        }, 1000);

        status.textContent =
            "Выбери клетку и число. Можно вводить с клавиатуры.";

        render();
    }

    function selectCell(y, x) {
        if (solved) return;

        selected = { y, x };
        GameBox.sound("tick");
        render();
    }

    function setNumber(number) {
        if (!selected || solved) return;

        const { y, x } = selected;

        if (given[y][x]) {
            GameBox.sound("error");
            return;
        }

        puzzle[y][x] = number;

        if (number && hasConflict(y, x)) {
            GameBox.sound("error");
            GameBox.vibrate(40);
        } else {
            GameBox.sound(number ? "place" : "move");
        }

        if (isSolved()) {
            solved = true;
            clearInterval(clockTimer);

            const seconds = elapsed();
            timeElement.textContent = formatTime(seconds);

            status.textContent =
                `Победа! Судоку решено за ${formatTime(seconds)}.`;

            selected = null;

            GameBox.sound("win");
            GameBox.vibrate(100);
            GameBox.submit(seconds);
        }

        render();
    }

    function hasConflict(y, x) {
        const value = puzzle[y][x];

        if (!value) return false;

        for (let i = 0; i < 9; i++) {
            if (i !== x && puzzle[y][i] === value) return true;
            if (i !== y && puzzle[i][x] === value) return true;
        }

        const boxY = Math.floor(y / 3) * 3;
        const boxX = Math.floor(x / 3) * 3;

        for (let dy = 0; dy < 3; dy++) {
            for (let dx = 0; dx < 3; dx++) {
                const yy = boxY + dy;
                const xx = boxX + dx;

                if (
                    (yy !== y || xx !== x) &&
                    puzzle[yy][xx] === value
                ) {
                    return true;
                }
            }
        }

        return false;
    }

    // Засчитываем любое корректное решение, а не только «задуманное».
    function isSolved() {
        for (let y = 0; y < 9; y++) {
            for (let x = 0; x < 9; x++) {
                if (!puzzle[y][x] || hasConflict(y, x)) {
                    return false;
                }
            }
        }

        return true;
    }

    function render() {
        const selectedValue =
            selected ? puzzle[selected.y][selected.x] : 0;

        for (let y = 0; y < 9; y++) {
            for (let x = 0; x < 9; x++) {
                const cell = cells[y * 9 + x];
                const value = puzzle[y][x];

                let className = "sudoku-cell";

                if (x === 2 || x === 5) className += " border-right";
                if (y === 2 || y === 5) className += " border-bottom";

                if (given[y][x]) {
                    className += " given";
                } else if (value) {
                    className += " user";
                }

                if (value && hasConflict(y, x)) {
                    className += " error";
                }

                if (selected && selected.y === y && selected.x === x) {
                    className += " selected";
                } else if (selectedValue && value === selectedValue) {
                    className += " same";
                }

                cell.className = className;
                cell.textContent = value || "";
            }
        }
    }

    function keydown(event) {
        if (solved) return;

        if (/^[1-9]$/.test(event.key)) {
            setNumber(Number(event.key));
            return;
        }

        if (
            event.key === "Backspace" ||
            event.key === "Delete" ||
            event.key === "0"
        ) {
            event.preventDefault();
            setNumber(0);
            return;
        }

        const moves = {
            ArrowUp: [-1, 0],
            ArrowDown: [1, 0],
            ArrowLeft: [0, -1],
            ArrowRight: [0, 1]
        };

        const move = moves[event.key];

        if (move) {
            event.preventDefault();

            const current = selected || { y: 0, x: 0 };

            selected = {
                y: (current.y + move[0] + 9) % 9,
                x: (current.x + move[1] + 9) % 9
            };

            render();
        }
    }

    pad.forEach(button => {
        button.addEventListener("click", () => {
            setNumber(
                Number(button.dataset.number)
            );
        });
    });

    restart.addEventListener("click", start);

    document.addEventListener("keydown", keydown);

    start();

    return function() {
        clearInterval(clockTimer);
        document.removeEventListener("keydown", keydown);
    };
};