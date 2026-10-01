window.create2048 = function(root) {
    root.innerHTML = `
        <div class="game-box">
            <div class="game-toolbar">
                <strong>Счёт: <span class="game2048-score">0</span></strong>
                <button class="game-button game2048-restart">Заново</button>
            </div>

            <div class="grid-2048"></div>

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

            <p class="game-status game2048-status">
                Соединяй одинаковые числа.
            </p>
        </div>
    `;

    const boardElement = root.querySelector(".grid-2048");
    const scoreElement = root.querySelector(".game2048-score");
    const status = root.querySelector(".game2048-status");
    const restart = root.querySelector(".game2048-restart");

    let board;
    let score;
    let gameOver;
    let reached2048;
    let newTile = -1;
    let merged = false;

    const tiles = Array.from({ length: 16 }, () => {
        const tile = document.createElement("div");
        tile.className = "tile-2048";
        boardElement.appendChild(tile);
        return tile;
    });

    function start() {
        board = Array(16).fill(0);
        score = 0;
        gameOver = false;
        reached2048 = false;

        addTile();
        addTile();

        scoreElement.textContent = score;
        status.textContent = "Соединяй одинаковые числа.";

        render();
    }

    function addTile() {
        const empty = board
            .map((value, index) => value === 0 ? index : null)
            .filter(index => index !== null);

        if (!empty.length) return;

        const index =
            empty[Math.floor(Math.random() * empty.length)];

        board[index] = Math.random() < 0.9 ? 2 : 4;
        newTile = index;
    }

    function move(direction) {
        if (gameOver) return;

        const old = [...board];
        merged = false;

        if (direction === "left") {
            for (let y = 0; y < 4; y++) {
                const row = board.slice(y * 4, y * 4 + 4);
                const result = mergeLine(row);

                for (let x = 0; x < 4; x++) {
                    board[y * 4 + x] = result[x];
                }
            }
        }

        if (direction === "right") {
            for (let y = 0; y < 4; y++) {
                const row = board
                    .slice(y * 4, y * 4 + 4)
                    .reverse();

                const result = mergeLine(row).reverse();

                for (let x = 0; x < 4; x++) {
                    board[y * 4 + x] = result[x];
                }
            }
        }

        if (direction === "up") {
            for (let x = 0; x < 4; x++) {
                const line = [];

                for (let y = 0; y < 4; y++) {
                    line.push(board[y * 4 + x]);
                }

                const result = mergeLine(line);

                for (let y = 0; y < 4; y++) {
                    board[y * 4 + x] = result[y];
                }
            }
        }

        if (direction === "down") {
            for (let x = 0; x < 4; x++) {
                const line = [];

                for (let y = 0; y < 4; y++) {
                    line.push(board[y * 4 + x]);
                }

                const result = mergeLine(line.reverse()).reverse();

                for (let y = 0; y < 4; y++) {
                    board[y * 4 + x] = result[y];
                }
            }
        }

        const changed = board.some((value, index) => value !== old[index]);

        if (!changed) return;

        addTile();
        render();

        GameBox.sound(merged ? "eat" : "move");

        if (!reached2048 && board.includes(2048)) {
            reached2048 = true;
            status.textContent = "Ты собрал 2048! Можно играть дальше.";
            GameBox.sound("win");
        }

        if (!canMove()) {
            gameOver = true;
            status.textContent = `Ходов больше нет. Счёт: ${score}. Нажми «Заново».`;

            GameBox.sound("lose");
            GameBox.vibrate([80, 40, 80]);
            GameBox.submit(score);
        }
    }

    function mergeLine(line) {
        const values = line.filter(Boolean);
        const result = [];

        for (let i = 0; i < values.length; i++) {
            if (
                values[i] === values[i + 1]
            ) {
                const value = values[i] * 2;

                result.push(value);
                score += value;
                merged = true;

                i++;
            } else {
                result.push(values[i]);
            }
        }

        while (result.length < 4) {
            result.push(0);
        }

        return result;
    }

    function canMove() {
        if (board.includes(0)) return true;

        for (let y = 0; y < 4; y++) {
            for (let x = 0; x < 4; x++) {
                const value = board[y * 4 + x];

                if (
                    x < 3 &&
                    value === board[y * 4 + x + 1]
                ) {
                    return true;
                }

                if (
                    y < 3 &&
                    value === board[(y + 1) * 4 + x]
                ) {
                    return true;
                }
            }
        }

        return false;
    }

    function render() {
        board.forEach((value, index) => {
            const tile = tiles[index];

            tile.textContent = value || "";

            if (value) {
                tile.dataset.value = value;
            } else {
                delete tile.dataset.value;
            }

            tile.classList.remove("new");

            if (index === newTile) {
                void tile.offsetWidth;
                tile.classList.add("new");
            }
        });

        newTile = -1;
        scoreElement.textContent = score;
    }

    function keydown(event) {
        const keys = {
            ArrowLeft: "left",
            ArrowRight: "right",
            ArrowUp: "up",
            ArrowDown: "down",
            KeyA: "left",
            KeyD: "right",
            KeyW: "up",
            KeyS: "down"
        };

        if (keys[event.code]) {
            event.preventDefault();
            move(keys[event.code]);
        }
    }

    let startX = 0;
    let startY = 0;

    function touchStart(event) {
        if (!event.touches.length) return;

        const touch = event.touches[0];

        startX = touch.clientX;
        startY = touch.clientY;
    }

    function touchEnd(event) {
        if (!event.changedTouches.length) return;

        const touch = event.changedTouches[0];

        const dx = touch.clientX - startX;
        const dy = touch.clientY - startY;

        if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) {
            return;
        }

        if (Math.abs(dx) > Math.abs(dy)) {
            move(dx > 0 ? "right" : "left");
        } else {
            move(dy > 0 ? "down" : "up");
        }
    }

    root.querySelectorAll(".mobile-dpad .mobile-control").forEach(button => {
        GameBox.hold(button, () => move(button.dataset.dir));
    });

    restart.addEventListener("click", start);

    document.addEventListener("keydown", keydown);

    boardElement.addEventListener(
        "touchstart",
        touchStart,
        { passive: true }
    );

    boardElement.addEventListener(
        "touchend",
        touchEnd,
        { passive: true }
    );

    function touchMove(event) {
        event.preventDefault();
    }

    // Свайп по полю не должен прокручивать страницу.
    boardElement.addEventListener(
        "touchmove",
        touchMove,
        { passive: false }
    );

    start();

    return function() {
        document.removeEventListener("keydown", keydown);
        boardElement.removeEventListener("touchstart", touchStart);
        boardElement.removeEventListener("touchend", touchEnd);
        boardElement.removeEventListener("touchmove", touchMove);
    };
};