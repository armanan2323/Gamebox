window.createPacman = function(root) {
    root.innerHTML = `
        <div class="game-box pacman-game">
            <div class="game-toolbar">
                <strong>
                    Счёт: <span class="pacman-score">0</span>
                </strong>

                <strong>
                    Жизни: <span class="pacman-lives">3</span>
                </strong>

                <button class="game-button pacman-restart">
                    Заново
                </button>
            </div>

            <canvas
                class="game-canvas pacman-canvas"
                width="420"
                height="420"
            ></canvas>

            <p class="game-status pacman-status">
                Стрелки или свайпы
            </p>

            <div class="mobile-controls pacman-controls">
                <div class="mobile-dpad">
                    <button class="mobile-control pacman-up">↑</button>

                    <div class="mobile-dpad-middle">
                        <button class="mobile-control pacman-left">←</button>
                        <button class="mobile-control pacman-down">↓</button>
                        <button class="mobile-control pacman-right">→</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    const canvas = root.querySelector(".pacman-canvas");
    const ctx = canvas.getContext("2d");

    const scoreElement = root.querySelector(".pacman-score");
    const livesElement = root.querySelector(".pacman-lives");
    const statusElement = root.querySelector(".pacman-status");
    const restartButton = root.querySelector(".pacman-restart");

    const upButton = root.querySelector(".pacman-up");
    const downButton = root.querySelector(".pacman-down");
    const leftButton = root.querySelector(".pacman-left");
    const rightButton = root.querySelector(".pacman-right");

    const map = [
        "#####################",
        "#.........#.........#",
        "#.###.###.#.###.###.#",
        "#o###.###.#.###.###o#",
        "#...................#",
        "#.###.#.#######.#.###",
        "#.....#...###...#....",
        "#####.###.###.###.###",
        "    #.#.......#.#    ",
        "#####.#.#####.#.#####",
        "     ...........     ",
        "#####.#.#####.#.#####",
        "    #.#.......#.#    ",
        "#####.#.#####.#.#####",
        "#.........#.........#",
        "#.###.###.#.###.###.#",
        "#o..#...........#..o#",
        "###.#.#.#######.#.###",
        "#.....#...###...#....",
        "#.########.########.#",
        "#####################"
    ];

    const TILE = 20;
    const ROWS = map.length;
    const COLS = map[0].length;

    let pacman;
    let ghosts;
    let dots;
    let score;
    let lives;
    let gameOver;
    let timer;

    let nextDirection = { x: 0, y: 0 };
    let direction = { x: 0, y: 0 };

    let touchStartX = 0;
    let touchStartY = 0;

    function createDots() {
        dots = new Set();

        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                const cell = map[row][col];

                if (cell === "." || cell === "o") {
                    dots.add(`${row},${col}`);
                }
            }
        }
    }

    function reset() {
        clearInterval(timer);

        score = 0;
        lives = 3;
        gameOver = false;

        scoreElement.textContent = "0";
        livesElement.textContent = "3";

        createDots();

        pacman = {
            x: 10,
            y: 16
        };

        direction = { x: 0, y: 0 };
        nextDirection = { x: 0, y: 0 };

        ghosts = [
            {
                x: 9,
                y: 10,
                color: "#e53935",
                direction: { x: 1, y: 0 }
            },
            {
                x: 10,
                y: 10,
                color: "#f28bd2",
                direction: { x: -1, y: 0 }
            },
            {
                x: 11,
                y: 10,
                color: "#40bcd8",
                direction: { x: 0, y: 1 }
            },
            {
                x: 10,
                y: 9,
                color: "#f4a742",
                direction: { x: 1, y: 0 }
            }
        ];

        statusElement.textContent =
            "Стрелки или свайпы";

        draw();

        timer = setInterval(update, 150);
    }

    function isWall(x, y) {
        if (x < 0 || x >= COLS || y < 0 || y >= ROWS) {
            return true;
        }

        return map[y][x] === "#";
    }

    function canMove(x, y, dx, dy) {
        return !isWall(
            x + dx,
            y + dy
        );
    }

    function update() {
        if (gameOver) return;

        if (
            canMove(
                pacman.x,
                pacman.y,
                nextDirection.x,
                nextDirection.y
            )
        ) {
            direction = { ...nextDirection };
        }

        if (
            canMove(
                pacman.x,
                pacman.y,
                direction.x,
                direction.y
            )
        ) {
            pacman.x += direction.x;
            pacman.y += direction.y;
        }

        const dotKey =
            `${pacman.y},${pacman.x}`;

        if (dots.has(dotKey)) {
            dots.delete(dotKey);

            if (map[pacman.y][pacman.x] === "o") {
                score += 50;
            } else {
                score += 10;
            }

            scoreElement.textContent = score;
        }

        updateGhosts();
        checkGhostCollision();

        if (dots.size === 0) {
            statusElement.textContent =
                "Уровень пройден!";

            createDots();

            pacman.x = 10;
            pacman.y = 16;
        }

        draw();
    }

    function updateGhosts() {
        ghosts.forEach(ghost => {
            const options = [
                { x: 1, y: 0 },
                { x: -1, y: 0 },
                { x: 0, y: 1 },
                { x: 0, y: -1 }
            ].filter(dir =>
                canMove(
                    ghost.x,
                    ghost.y,
                    dir.x,
                    dir.y
                )
            );

            if (!options.length) return;

            const reverse = {
                x: -ghost.direction.x,
                y: -ghost.direction.y
            };

            const filtered =
                options.filter(
                    dir =>
                        !(
                            dir.x === reverse.x &&
                            dir.y === reverse.y
                        )
                );

            const available =
                filtered.length
                    ? filtered
                    : options;

            let best = available[
                Math.floor(
                    Math.random() *
                    available.length
                )
            ];

            if (Math.random() < 0.55) {
                best = available.reduce(
                    (current, option) => {
                        const currentDistance =
                            Math.abs(
                                ghost.x +
                                    current.x -
                                    pacman.x
                            ) +
                            Math.abs(
                                ghost.y +
                                    current.y -
                                    pacman.y
                            );

                        const optionDistance =
                            Math.abs(
                                ghost.x +
                                    option.x -
                                    pacman.x
                            ) +
                            Math.abs(
                                ghost.y +
                                    option.y -
                                    pacman.y
                            );

                        return optionDistance <
                            currentDistance
                            ? option
                            : current;
                    }
                );
            }

            ghost.direction = best;

            ghost.x += best.x;
            ghost.y += best.y;
        });
    }

    function checkGhostCollision() {
        for (const ghost of ghosts) {
            if (
                ghost.x === pacman.x &&
                ghost.y === pacman.y
            ) {
                lives--;

                livesElement.textContent =
                    lives;

                if (lives <= 0) {
                    gameOver = true;
                    clearInterval(timer);

                    statusElement.textContent =
                        "Pac-Man проиграл. Нажми «Заново».";

                    draw();

                    return;
                }

                pacman.x = 10;
                pacman.y = 16;

                direction = { x: 0, y: 0 };
                nextDirection = { x: 0, y: 0 };
            }
        }
    }

    function draw() {
        ctx.fillStyle = "#000";
        ctx.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                if (map[row][col] === "#") {
                    ctx.strokeStyle = "#204fca";
                    ctx.lineWidth = 2;

                    ctx.strokeRect(
                        col * TILE + 2,
                        row * TILE + 2,
                        TILE - 4,
                        TILE - 4
                    );
                }
            }
        }

        dots.forEach(key => {
            const [row, col] =
                key.split(",").map(Number);

            const big =
                map[row][col] === "o";

            ctx.fillStyle = "#fff";

            ctx.beginPath();

            ctx.arc(
                col * TILE + TILE / 2,
                row * TILE + TILE / 2,
                big ? 5 : 2,
                0,
                Math.PI * 2
            );

            ctx.fill();
        });

        ghosts.forEach(ghost => {
            drawGhost(ghost);
        });

        const px =
            pacman.x * TILE + TILE / 2;

        const py =
            pacman.y * TILE + TILE / 2;

        ctx.fillStyle = "#ffd92f";

        ctx.beginPath();

        ctx.arc(
            px,
            py,
            8,
            0.25 * Math.PI,
            1.75 * Math.PI
        );

        ctx.lineTo(px, py);
        ctx.fill();
    }

    function drawGhost(ghost) {
        const x =
            ghost.x * TILE + TILE / 2;

        const y =
            ghost.y * TILE + TILE / 2;

        ctx.fillStyle = ghost.color;

        ctx.beginPath();

        ctx.arc(
            x,
            y - 2,
            8,
            Math.PI,
            0
        );

        ctx.lineTo(x + 8, y + 8);
        ctx.lineTo(x + 4, y + 5);
        ctx.lineTo(x, y + 8);
        ctx.lineTo(x - 4, y + 5);
        ctx.lineTo(x - 8, y + 8);
        ctx.closePath();

        ctx.fill();

        ctx.fillStyle = "#fff";

        ctx.beginPath();
        ctx.arc(x - 3, y - 3, 2.5, 0, Math.PI * 2);
        ctx.arc(x + 3, y - 3, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#222";

        ctx.beginPath();
        ctx.arc(x - 3, y - 3, 1, 0, Math.PI * 2);
        ctx.arc(x + 3, y - 3, 1, 0, Math.PI * 2);
        ctx.fill();
    }

    function setDirection(x, y) {
        nextDirection = { x, y };
    }

    function keyDown(event) {
        if (
            event.key === "ArrowUp" ||
            event.key.toLowerCase() === "w"
        ) {
            setDirection(0, -1);
            event.preventDefault();
        }

        if (
            event.key === "ArrowDown" ||
            event.key.toLowerCase() === "s"
        ) {
            setDirection(0, 1);
            event.preventDefault();
        }

        if (
            event.key === "ArrowLeft" ||
            event.key.toLowerCase() === "a"
        ) {
            setDirection(-1, 0);
            event.preventDefault();
        }

        if (
            event.key === "ArrowRight" ||
            event.key.toLowerCase() === "d"
        ) {
            setDirection(1, 0);
            event.preventDefault();
        }
    }

    function touchStart(event) {
        if (!event.touches.length) return;

        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;

        event.preventDefault();
    }

    function touchEnd(event) {
        if (!event.changedTouches.length) return;

        const touch = event.changedTouches[0];

        const dx =
            touch.clientX - touchStartX;

        const dy =
            touch.clientY - touchStartY;

        if (
            Math.abs(dx) < 25 &&
            Math.abs(dy) < 25
        ) {
            return;
        }

        if (Math.abs(dx) > Math.abs(dy)) {
            setDirection(dx > 0 ? 1 : -1, 0);
        } else {
            setDirection(0, dy > 0 ? 1 : -1);
        }

        event.preventDefault();
    }

    function buttonHandler(button, x, y) {
        const handler = event => {
            event.preventDefault();
            setDirection(x, y);
        };

        button.addEventListener("pointerdown", handler);

        return handler;
    }

    const handlers = [
        [upButton, buttonHandler(upButton, 0, -1)],
        [downButton, buttonHandler(downButton, 0, 1)],
        [leftButton, buttonHandler(leftButton, -1, 0)],
        [rightButton, buttonHandler(rightButton, 1, 0)]
    ];

    canvas.addEventListener(
        "touchstart",
        touchStart,
        { passive: false }
    );

    canvas.addEventListener(
        "touchend",
        touchEnd,
        { passive: false }
    );

    document.addEventListener("keydown", keyDown);

    restartButton.addEventListener("click", reset);

    reset();

    return function cleanup() {
        clearInterval(timer);

        document.removeEventListener("keydown", keyDown);
        restartButton.removeEventListener("click", reset);

        canvas.removeEventListener("touchstart", touchStart);
        canvas.removeEventListener("touchend", touchEnd);

        handlers.forEach(([button, handler]) => {
            button.removeEventListener(
                "pointerdown",
                handler
            );
        });
    };
};