window.createBattleship = function(root) {
    root.innerHTML = `
        <div class="game-box battleship-game">
            <div class="game-toolbar">
                <strong class="battleship-title">Морской бой</strong>
                <button class="game-button battleship-restart">
                    Заново
                </button>
            </div>

            <div class="mode-switch">
                <button class="mode-button active" data-mode="two">👥 Вдвоём</button>
                <button class="mode-button" data-mode="ai">🤖 Против ИИ</button>
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

    const coverTitle =
        coverElement.querySelector("strong");

    const readyButton =
        root.querySelector(".battleship-ready");

    const continueButton =
        root.querySelector(".battleship-continue");

    const restartButton =
        root.querySelector(".battleship-restart");

    const modeButtons =
        root.querySelectorAll(".mode-button");

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
        },
        {
            name: "Катер",
            size: 2
        }
    ];

    let players;
    let currentPlayer;
    let setupPlayer;
    let selectedShip;
    let rotation;
    let phase;
    let afterCover;
    let gameOver;
    let busy;
    let turnTimer = null;
    let mode = "two";
    let aiTargets = [];

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
            shots: createEmptyBoard(),
            ships: []
        };
    }

    function label(number) {
        if (mode === "ai" && number === 2) return "🤖 ИИ";

        return `${number === 1 ? "🔴" : "🔵"} ${GameBox.name(number)}`;
    }

    function reset() {
        clearTimeout(turnTimer);

        players = {
            1: createPlayer(1),
            2: createPlayer(2)
        };

        currentPlayer = 1;
        setupPlayer = 1;
        selectedShip = 0;
        rotation = "horizontal";
        gameOver = false;
        busy = false;
        aiTargets = [];

        showPhase("setup");
        renderSetup();

        statusElement.textContent = "";
    }

    function showPhase(name) {
        phase = name;

        setupElement.classList.toggle("hidden", name !== "setup");
        coverElement.classList.toggle("hidden", name !== "cover");
        gameplayElement.classList.toggle("hidden", name !== "battle");
    }

    // Экран «передайте устройство» - чтобы соперник не увидел чужое поле.
    function showCover(number, next) {
        afterCover = next;

        coverTitle.textContent =
            `${label(number)}, ваша очередь`;

        playerElement.textContent = label(number);
        phaseElement.textContent = "Передача устройства";

        showPhase("cover");
    }

    function renderSetup() {
        const player = players[setupPlayer];

        playerElement.textContent = label(setupPlayer);

        phaseElement.textContent =
            mode === "ai" ? "Расстановка" : `Расстановка ${setupPlayer}/2`;

        instructionElement.textContent =
            "Выберите корабль и нажмите на поле. Нажатие на корабль убирает его.";

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

                GameBox.sound("rotate");

                renderSetup();
            }
        );

        shipsElement.appendChild(rotateButton);

        const randomButton =
            document.createElement("button");

        randomButton.className = "battleship-random";
        randomButton.textContent = "🎲 Случайно";

        randomButton.addEventListener("click", () => {
            randomPlacement(player);
            selectedShip = null;
            GameBox.sound("place");
            renderSetup();
        });

        shipsElement.appendChild(randomButton);
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

    function shipCells(row, col, size, direction) {
        const cells = [];

        for (let i = 0; i < size; i++) {
            const targetRow = direction === "horizontal" ? row : row + i;
            const targetCol = direction === "horizontal" ? col + i : col;

            if (targetRow >= SIZE || targetCol >= SIZE) return null;

            cells.push({ row: targetRow, col: targetCol });
        }

        return cells;
    }

    // Корабли не могут касаться друг друга (даже углами).
    function canPlace(player, cells) {
        return cells.every(({ row, col }) => {
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const r = row + dy;
                    const c = col + dx;

                    if (
                        r >= 0 && r < SIZE &&
                        c >= 0 && c < SIZE &&
                        player.board[r][c]
                    ) {
                        return false;
                    }
                }
            }

            return true;
        });
    }

    function addShip(player, type, cells) {
        cells.forEach(cell => {
            player.board[cell.row][cell.col] = "ship";
        });

        player.ships.push({
            type,
            cells,
            hits: 0
        });
    }

    function randomPlacement(player) {
        for (let attempt = 0; attempt < 50; attempt++) {
            player.board = createEmptyBoard();
            player.ships = [];

            const ok = SHIPS.every((ship, type) => {
                for (let tries = 0; tries < 200; tries++) {
                    const direction = Math.random() < 0.5 ? "horizontal" : "vertical";
                    const cells = shipCells(
                        Math.floor(Math.random() * SIZE),
                        Math.floor(Math.random() * SIZE),
                        ship.size,
                        direction
                    );

                    if (cells && canPlace(player, cells)) {
                        addShip(player, type, cells);
                        return true;
                    }
                }

                return false;
            });

            if (ok) return;
        }
    }

    function nextUnplaced(player) {
        const index = SHIPS.findIndex((_, type) =>
            !player.ships.some(ship => ship.type === type)
        );

        return index === -1 ? null : index;
    }

    function placeShip(row, col) {
        const player = players[setupPlayer];

        // Нажатие на поставленный корабль убирает его.
        const existing = player.ships.find(ship =>
            ship.cells.some(cell => cell.row === row && cell.col === col)
        );

        if (existing) {
            existing.cells.forEach(cell => {
                player.board[cell.row][cell.col] = null;
            });

            player.ships = player.ships.filter(ship => ship !== existing);
            selectedShip = existing.type;

            GameBox.sound("move");
            renderSetup();
            return;
        }

        if (selectedShip === null) return;

        const ship = SHIPS[selectedShip];

        if (
            player.ships.some(
                item =>
                    item.type === selectedShip
            )
        ) {
            return;
        }

        const cells = shipCells(row, col, ship.size, rotation);

        if (!cells || !canPlace(player, cells)) {
            instructionElement.textContent =
                "Сюда нельзя: корабль выходит за поле или касается другого.";
            GameBox.sound("error");
            return;
        }

        addShip(player, selectedShip, cells);

        selectedShip = nextUnplaced(player);

        GameBox.sound("place");

        renderSetup();
    }

    function finishSetup() {
        if (
            players[setupPlayer].ships.length !==
            SHIPS.length
        ) {
            return;
        }

        if (mode === "ai") {
            randomPlacement(players[2]);
            startBattle();
            return;
        }

        if (setupPlayer === 1) {
            setupPlayer = 2;
            selectedShip = 0;
            rotation = "horizontal";

            showCover(2, () => {
                showPhase("setup");
                renderSetup();
            });

            return;
        }

        showCover(1, startBattle);
    }

    function startBattle() {
        currentPlayer = 1;

        showPhase("battle");
        renderBattle();

        statusElement.textContent =
            "Ваш ход. Выберите клетку. Попадание - ещё один выстрел.";
    }

    function renderBattle() {
        const attacker = players[currentPlayer];
        const defender = players[currentPlayer === 1 ? 2 : 1];

        playerElement.textContent = label(currentPlayer);

        phaseElement.textContent =
            "Бой";

        targetBoardElement.innerHTML = "";

        for (let row = 0; row < SIZE; row++) {
            for (let col = 0; col < SIZE; col++) {
                const cell =
                    document.createElement("button");

                cell.className = "battle-cell";

                const shot =
                    attacker.shots[row][col];

                if (shot === "hit") {
                    cell.classList.add("hit");
                    cell.textContent = "✕";

                    const ship = findShip(defender, row, col);

                    if (ship && ship.hits >= ship.cells.length) {
                        cell.classList.add("sunk");
                    }
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

    function findShip(player, row, col) {
        return player.ships.find(
            ship =>
                ship.cells.some(
                    cell =>
                        cell.row === row &&
                        cell.col === col
                )
        );
    }

    // Возвращает "miss", "hit" или "sunk".
    function fire(attacker, defender, row, col) {
        if (defender.board[row][col] === "ship") {
            attacker.shots[row][col] = "hit";

            const ship = findShip(defender, row, col);

            ship.hits++;

            if (ship.hits >= ship.cells.length) {
                // Клетки вокруг потопленного корабля - заведомые промахи.
                ship.cells.forEach(({ row: r, col: c }) => {
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            const y = r + dy;
                            const x = c + dx;

                            if (
                                y >= 0 && y < SIZE &&
                                x >= 0 && x < SIZE &&
                                !attacker.shots[y][x]
                            ) {
                                attacker.shots[y][x] = "miss";
                            }
                        }
                    }
                });

                return "sunk";
            }

            return "hit";
        }

        attacker.shots[row][col] = "miss";

        return "miss";
    }

    function shoot(row, col) {
        if (phase !== "battle" || busy || gameOver) return;
        if (mode === "ai" && currentPlayer !== 1) return;

        const attacker =
            players[currentPlayer];

        const defender =
            players[currentPlayer === 1 ? 2 : 1];

        if (attacker.shots[row][col]) {
            return;
        }

        const result = fire(attacker, defender, row, col);

        if (result !== "miss" && allShipsDestroyed(defender)) {
            finishGame(currentPlayer);
            return;
        }

        if (result === "sunk") {
            statusElement.textContent = "Корабль потоплен! Стреляйте ещё.";
            GameBox.sound("explode");
            GameBox.vibrate(80);
        } else if (result === "hit") {
            statusElement.textContent = "Попадание! Стреляйте ещё.";
            GameBox.sound("hit");
            GameBox.vibrate(40);
        } else {
            statusElement.textContent = "Промах. Ход переходит сопернику.";
            GameBox.sound("drop");
        }

        renderBattle();

        if (result !== "miss") return;

        busy = true;

        turnTimer = setTimeout(() => {
            busy = false;
            switchTurn();
        }, 800);
    }

    function finishGame(winner) {
        gameOver = true;

        renderBattle();

        statusElement.textContent =
            `${label(winner)} победил!`;

        phaseElement.textContent = "Конец игры";

        if (mode === "ai" && winner === 2) {
            GameBox.sound("lose");
            GameBox.win(GameBox.aiName);
        } else {
            GameBox.sound("win");
            GameBox.win(GameBox.name(winner));
        }

        GameBox.vibrate(150);
    }

    function switchTurn() {
        if (gameOver) return;

        currentPlayer =
            currentPlayer === 1
                ? 2
                : 1;

        statusElement.textContent = "";

        if (mode === "ai") {
            renderBattle();

            if (currentPlayer === 2) {
                statusElement.textContent = "ИИ стреляет...";
                turnTimer = setTimeout(aiTurn, 650);
            } else {
                statusElement.textContent = "Ваш ход.";
            }

            return;
        }

        showCover(currentPlayer, () => {
            showPhase("battle");
            renderBattle();
            statusElement.textContent = "Ваш ход. Выберите клетку.";
        });
    }

    // ИИ: после попадания добивает корабль по соседним клеткам.
    function aiTurn() {
        if (gameOver) return;

        const ai = players[2];
        const human = players[1];

        aiTargets = aiTargets.filter(([r, c]) => !ai.shots[r][c]);

        let target = aiTargets.shift();

        if (!target) {
            const free = [];

            for (let r = 0; r < SIZE; r++) {
                for (let c = 0; c < SIZE; c++) {
                    if (!ai.shots[r][c] && (r + c) % 2 === 0) free.push([r, c]);
                }
            }

            if (!free.length) {
                for (let r = 0; r < SIZE; r++) {
                    for (let c = 0; c < SIZE; c++) {
                        if (!ai.shots[r][c]) free.push([r, c]);
                    }
                }
            }

            target = free[Math.floor(Math.random() * free.length)];
        }

        const [row, col] = target;
        const result = fire(ai, human, row, col);

        if (result === "hit") {
            [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dy, dx]) => {
                const r = row + dy;
                const c = col + dx;

                if (r >= 0 && r < SIZE && c >= 0 && c < SIZE && !ai.shots[r][c]) {
                    aiTargets.push([r, c]);
                }
            });
        }

        if (result === "sunk") {
            aiTargets = [];
        }

        renderBattle();

        if (result !== "miss" && allShipsDestroyed(human)) {
            finishGame(2);
            return;
        }

        if (result === "miss") {
            GameBox.sound("drop");
            statusElement.textContent = "ИИ промахнулся. Ваш ход.";
            turnTimer = setTimeout(switchTurn, 500);
        } else {
            GameBox.sound(result === "sunk" ? "explode" : "hit");
            GameBox.vibrate(60);
            statusElement.textContent =
                result === "sunk" ? "ИИ потопил ваш корабль!" : "ИИ попал!";
            turnTimer = setTimeout(aiTurn, 700);
        }
    }

    function allShipsDestroyed(player) {
        return player.ships.every(
            ship =>
                ship.hits >= ship.cells.length
        );
    }

    readyButton.addEventListener("click", finishSetup);

    continueButton.addEventListener("click", () => {
        if (phase !== "cover" || !afterCover) return;

        const next = afterCover;
        afterCover = null;
        next();
    });

    restartButton.addEventListener(
        "click",
        reset
    );

    modeButtons.forEach(button => {
        button.addEventListener("click", () => {
            mode = button.dataset.mode;

            modeButtons.forEach(item => {
                item.classList.toggle("active", item === button);
            });

            reset();
        });
    });

    reset();

    return function cleanup() {
        clearTimeout(turnTimer);
    };
};