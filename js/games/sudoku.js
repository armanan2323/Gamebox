window.createSudoku = function(root) {
    root.innerHTML = `
        <div class="game-box">
            <div class="game-toolbar">
                <strong>Sudoku</strong>

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
                Выбери клетку и число.
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

    let solution;
    let puzzle;
    let selected = null;

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

        return rows.map(r =>
            cols.map(c => base[r][c])
        );
    }

    function shuffleGroups() {
        const groups = [
            [0,1,2],
            [3,4,5],
            [6,7,8]
        ];

        groups.forEach(group => {
            for (let i = group.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [group[i], group[j]] =
                    [group[j], group[i]];
            }
        });

        const order = [];

        groups.forEach(group => {
            order.push(...group);
        });

        return order;
    }

    function start() {
        solution = createSolution();

        puzzle = solution.map(row => [...row]);

        const cells = Array.from(
            { length: 81 },
            (_, i) => i
        );

        cells.sort(() => Math.random() - 0.5);

        cells.slice(0, 45).forEach(index => {
            const y = Math.floor(index / 9);
            const x = index % 9;

            puzzle[y][x] = 0;
        });

        selected = null;

        status.textContent =
            "Выбери клетку и число.";

        render();
    }

    function selectCell(y, x) {
        if (solution[y][x] === puzzle[y][x]) {
            selected = null;
            return;
        }

        selected = { y, x };
        render();
    }

    function setNumber(number) {
        if (!selected) return;

        const { y, x } = selected;

        if (number === 0) {
            puzzle[y][x] = 0;
        } else {
            puzzle[y][x] = number;
        }

        if (isSolved()) {
            status.textContent =
                "Победа! Судоку решено.";
        }

        render();
    }

    function isSolved() {
        for (let y = 0; y < 9; y++) {
            for (let x = 0; x < 9; x++) {
                if (
                    puzzle[y][x] !== solution[y][x]
                ) {
                    return false;
                }
            }
        }

        return true;
    }

    function render() {
        boardElement.innerHTML = "";

        for (let y = 0; y < 9; y++) {
            for (let x = 0; x < 9; x++) {
                const cell = document.createElement("button");

                cell.className = "sudoku-cell";

                if (x === 2 || x === 5) {
                    cell.classList.add("border-right");
                }

                if (y === 2 || y === 5) {
                    cell.classList.add("border-bottom");
                }

                if (
                    selected &&
                    selected.y === y &&
                    selected.x === x
                ) {
                    cell.classList.add("selected");
                }

                if (puzzle[y][x]) {
                    cell.textContent = puzzle[y][x];

                    if (
                        puzzle[y][x] === solution[y][x] &&
                        solution[y][x] === puzzle[y][x]
                    ) {
                        if (
                            !isOriginal(y, x)
                        ) {
                            cell.classList.add("user");
                        }
                    }
                }

                cell.addEventListener(
                    "click",
                    () => selectCell(y, x)
                );

                boardElement.appendChild(cell);
            }
        }
    }

    function isOriginal(y, x) {
        return false;
    }

    pad.forEach(button => {
        button.addEventListener("click", () => {
            setNumber(
                Number(button.dataset.number)
            );
        });
    });

    restart.addEventListener("click", start);

    start();

    return function() {};
};