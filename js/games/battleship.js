window.createBattleship = function(root) {
    root.innerHTML = `
        <div class="game-box battleship-game">
            <div class="game-toolbar">
                <strong class="battleship-title">Морской бой</strong>
                <button class="game-button battleship-restart">
                    Заново
                </button>
            </div>

            <div class="battleship-info">
                <span class="battleship-player">
                    🔴 Игрок 1
                </span>

                <span class="battleship-phase">
                    Расстановка
                </span>
            </div>

            <div class="battleship-setup">
                <p class="battleship-instruction">
                    Расставьте корабли на своём поле.
                </p>

                <div class="battleship-ships"></div>

                <div class="battleship-board-wrap">
                    <div class="battleship-board"></div>
                </div>

                <button class="game-button battleship-ready">
                    Готово
                </button>
            </div>

            <div class="battleship-cover hidden">
                <div class="battleship-cover-box">
                    <strong>Передайте устройство другому игроку</strong>
                    <p>
                        Когда будете готовы, нажмите продолжить.
                    </p>

                    <button class="game-button battleship-continue">
                        Продолжить
                    </button>
                </div>
            </div>

            <div class="battleship-gameplay hidden">
                <p class="battleship-instruction">
                    Стреляйте по полю противника.
                </p>

                <div class="battleship-target-wrap">
                    <div class="battleship-target-title">
                        Поле противника
                    </div>

                    <div class="battleship-target-board"></div>
                </div>

                <p class="game-status battleship-status">
                    Ваш ход
                </p>
            </div>
        </div>
    `;

    const boardElement =
        root.querySelector(".battleship-board");

    const targetBoardElement =
        root.querySelector(".battleship-target-board");

    const shipsElement =
        root.querySelector(".battleship-ships");

    const playerElement =
        root.querySelector(".battleship-player");

    const phaseElement =
        root.querySelector(".battleship-phase");

    const instructionElement =
        root.querySelector(".battleship-instruction");

    const statusElement =
        root.querySelector(".battleship-status");

    const setupElement =
        root.querySelector(".battleship-setup");

    const gameplayElement =
        root.querySelector(".battleship-gameplay");

    const coverElement =
        root.querySelector(".battleship-cover");

    const readyButton =
        root.querySelector(".battleship-ready");

    const continueButton =
        root.querySelector(".battleship-continue");

    const restartButton =
        root.querySelector(".battleship-restart");

    const SIZE = 8;

    const SHIPS = [
        {
            name: "Линкор",
            size: 4
        },
        {
            name: "Крейсер",
            size: 3
        },
        {
            name: "Эсминец",
            size: 2
        }
    ];

    let players;
    let currentPlayer;
    let setupPlayer;
    let selectedShip;
    let rotation;

    function createEmptyBoard() {
        return Array.from(
            { length: SIZE },
            () => Array(SIZE).fill(null)
        );
    }

    function createPlayer(number) {
        return {
            number,
            board: createEmptyBoard(),
            shots: Array.from(
                { length: SIZE },
                () => Array(SIZE).fill(null)
            ),
            ships: []
        };
    }

    function reset() {
        players = {
            1: createPlayer(1),
            2: createPlayer(2)
        };

        currentPlayer = 1;
        setupPlayer = 1;
        selectedShip = 0;
        rotation = "horizontal";

        setupElement.classList.remove("hidden");
        gameplayElement.classList.add("hidden");
        coverElement.classList.add("hidden");

        renderSetup();

        statusElement.textContent = "";
    }

    function renderSetup() {
        const player = players[setupPlayer];

        playerElement.textContent =
            setupPlayer === 1
                ? "🔴 Игрок 1"
                : "🔵 Игрок 2";

        phaseElement.textContent =
            `Расстановка ${setupPlayer}/2`;

        instructionElement.textContent =
            "Выберите корабль и нажмите на поле.";

        renderShipButtons(player);
        renderSetupBoard(player);

        readyButton.disabled =
            player.ships.length !== SHIPS.length;
    }

    function renderShipButtons(player) {
        shipsElement.innerHTML = "";

        SHIPS.forEach((ship, index) => {
            const button =
                document.createElement("button");

            button.className = "battleship-ship-button";

            const placed =
                player.ships.some(
                    placedShip =>
                        placedShip.type === index
                );

            if (placed) {
                button.classList.add("placed");
            }

            if (selectedShip === index) {
                button.classList.add("selected");
            }

            button.innerHTML = `
                <strong>${ship.name}</strong>
                <span>${ship.size} клетки</span>
            `;

            button.addEventListener(
                "click",
                () => {
                    if (placed) return;

                    selectedShip = index;

                    renderSetup();
                }
            );

            shipsElement.appendChild(button);
        });

        const rotateButton =
            document.createElement("button");

        rotateButton.className =
            "battleship-rotate";

        rotateButton.textContent =
            rotation === "horizontal"
                ? "↔ Горизонтально"
                : "↕ Вертикально";

        rotateButton.addEventListener(
            "click",
            () => {
                rotation =
                    rotation === "horizontal"
                        ? "vertical"
                        : "horizontal";

                renderSetup();
            }
        );

        shipsElement.appendChild(rotateButton);
    }

    function renderSetupBoard(player) {
        boardElement.innerHTML = "";

        for (let row = 0; row < SIZE; row++) {
            for (let col = 0; col < SIZE; col++) {
                const cell =
                    document.createElement("button");

                cell.className = "battle-cell";

                const value =
                    player.board[row][col];

                if (value === "ship") {
                    cell.classList.add(
                        setupPlayer === 1
                            ? "player-red"
                            : "player-blue"
                    );

                    cell.textContent = "■";
                }

                cell.addEventListener(
                    "click",
                    () => placeShip(row, col)
                );

                boardElement.appendChild(cell);
            }
        }
    }

    function placeShip(row, col) {
        const player = players[setupPlayer];

        if (selectedShip === null) return;

        const ship = SHIPS[selectedShip];

        if (
            player.ships.some(
                existing =>
                    existing.type === selectedShip
            )
        ) {
            return;
        }

        const cells = [];

        for (let i = 0; i < ship.size; i++) {
            const targetRow =
                rotation === "horizontal"
                    ? row
                    : row + i;

            const targetCol =
                rotation === "horizontal"
                    ? col + i
                    : col;

            if (
                targetRow >= SIZE ||
                targetCol >= SIZE
            ) {
                return;
            }

            if (
                player.board[targetRow][targetCol]
            ) {
                return;
            }

            cells.push({
                row: targetRow,
                col: targetCol
            });
        }

        for (const cell of cells) {
            player.board[cell.row][cell.col] =
                "ship";
        }

        player.ships.push({
            type: selectedShip,
            cells,
            hits: 0
        });

        selectedShip = null;

        renderSetup();
    }

    function nextSetupPlayer() {
        if (setupPlayer === 1) {
            setupPlayer = 2;
            selectedShip = 0;
            rotation = "horizontal";

            setupElement.classList.add("hidden");
            coverElement.classList.remove("hidden");

            playerElement.textContent =
                "🔵 Игрок 2";

            phaseElement.textContent =
                "Передача устройства";

            return;
        }

        startBattle();
    }

    function startBattle() {
        currentPlayer = 1;

        setupElement.classList.add("hidden");
        coverElement.classList.add("hidden");
        gameplayElement.classList.remove("hidden");

        renderBattle();

        statusElement.textContent =
            "Ваш ход. Выберите клетку.";
    }

    function renderBattle() {
        const enemy =
            players[currentPlayer === 1 ? 2 : 1];

        playerElement.textContent =
            currentPlayer === 1
                ? "🔴 Игрок 1"
                : "🔵 Игрок 2";

        phaseElement.textContent =
            "Бой";

        targetBoardElement.innerHTML = "";

        const shots =
            players[currentPlayer].shots;

        for (let row = 0; row < SIZE; row++) {
            for (let col = 0; col < SIZE; col++) {
                const cell =
                    document.createElement("button");

                cell.className = "battle-cell";

                const shot =
                    shots[row][col];

                if (shot === "hit") {
                    cell.classList.add("hit");
                    cell.textContent = "✕";
                }

                if (shot === "miss") {
                    cell.classList.add("miss");
                    cell.textContent = "•";
                }

                if (!shot) {
                    cell.addEventListener(
                        "click",
                        () => shoot(row, col)
                    );
                }

                targetBoardElement.appendChild(cell);
            }
        }
    }

    function shoot(row, col) {
        const attacker =
            players[currentPlayer];

        const defender =
            players[currentPlayer === 1 ? 2 : 1];

        if (attacker.shots[row][col]) {
            return;
        }

        if (defender.board[row][col] === "ship") {
            attacker.shots[row][col] = "hit";

            const ship =
                defender.ships.find(
                    currentShip =>
                        currentShip.cells.some(
                            cell =>
                                cell.row === row &&
                                cell.col === col
                        )
                );

            if (ship) {
                ship.hits++;
            }

            if (allShipsDestroyed(defender)) {
                renderBattle();

                statusElement.textContent =
                    currentPlayer === 1
                        ? "🔴 Игрок 1 победил!"
                        : "🔵 Игрок 2 победил!";

                gameOver = true;

                return;
            }

            statusElement.textContent =
                "Попадание! Ход переходит другому игроку.";

        } else {
            attacker.shots[row][col] = "miss";

            statusElement.textContent =
                "Промах.";
        }

        renderBattle();

        setTimeout(
            () => switchTurn(),
            600
        );
    }

    function switchTurn() {
        if (gameOver) return;

        currentPlayer =
            currentPlayer === 1
                ? 2
                : 1;

        coverElement.classList.remove("hidden");
        gameplayElement.classList.add("hidden");

        statusElement.textContent = "";

        const nextPlayer =
            currentPlayer === 1
                ? "🔴 Игрок 1"
                : "🔵 Игрок 2";

        coverElement.querySelector(
            "strong"
        ).textContent =
            `${nextPlayer}, передайте устройство`;

        phaseElement.textContent =
            "Передача устройства";
    }

    function allShipsDestroyed(player) {
        return player.ships.every(
            ship =>
                ship.hits >= ship.cells.length
        );
    }

    readyButton.addEventListener(
        "click",
        () => {
            if (
                players[setupPlayer].ships.length !==
                SHIPS.length
            ) {
                return;
            }

            nextSetupPlayer();
        }
    );

    continueButton.addEventListener(
        "click",
        () => {
            if (setupPlayer === 2) {
                setupElement.classList.remove(
                    "hidden"
                );

                coverElement.classList.add(
                    "hidden"
                );

                renderSetup();

                return;
            }

            coverElement.classList.add(
                "hidden"
            );

            gameplayElement.classList.remove(
                "hidden"
            );

            renderBattle();
        }
    );

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