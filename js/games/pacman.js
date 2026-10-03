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
    let level;
    let gameOver;
    let timer;
    let tick;
    let frightened;
    let ghostCombo;

    let nextDirection = { x: 0, y: 0 };
    let direction = { x: 0, y: 0 };
    let facing = { x: 1, y: 0 };

    let touchStartX = 0;
    let touchStartY = 0;

    const START = { x: 10, y: 16 };

    const GHOST_STARTS = [
        { x: 9, y: 10, color: "#e53935", direction: { x: -1, y: 0 } },
        { x: 11, y: 10, color: "#f28bd2", direction: { x: 1, y: 0 } },
        { x: 7, y: 10, color: "#40bcd8", direction: { x: 0, y: -1 } },
        { x: 10, y: 8, color: "#f4a742", direction: { x: 1, y: 0 } }
    ];

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

    function resetPositions() {
        pacman = { ...START };

        direction = { x: 0, y: 0 };
        nextDirection = { x: 0, y: 0 };
        facing = { x: 1, y: 0 };

        ghosts = GHOST_STARTS.map(ghost => ({
            ...ghost,
            direction: { ...ghost.direction },
            eaten: false
        }));

        frightened = 0;
    }

    function reset() {
        clearInterval(timer);

        score = 0;
        lives = 3;
        level = 1;
        tick = 0;
        gameOver = false;

        scoreElement.textContent = "0";
        livesElement.textContent = "3";

        createDots();
        resetPositions();

        statusElement.textContent =
            "Стрелки, свайпы или кнопки";

        draw();

        startTimer();
    }

    function startTimer() {
        clearInterval(timer);
        timer = setInterval(update, Math.max(95, 150 - (level - 1) * 10));
    }

    function wrapX(x) {
        return (x + COLS) % COLS;
    }

    function isWall(x, y) {
        if (y < 0 || y >= ROWS) {
            return true;
        }

        return map[y][wrapX(x)] === "#";
    }

    function canMove(x, y, dx, dy) {
        return !isWall(
            x + dx,
            y + dy
        );
    }

    function update() {
        if (gameOver || document.hidden) return;

        tick++;

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
            (direction.x || direction.y) &&
            canMove(
                pacman.x,
                pacman.y,
                direction.x,
                direction.y
            )
        ) {
            pacman.x = wrapX(pacman.x + direction.x);
            pacman.y += direction.y;
            facing = { ...direction };
        }

        const dotKey =
            `${pacman.y},${pacman.x}`;

        if (dots.has(dotKey)) {
            dots.delete(dotKey);

            if (map[pacman.y][pacman.x] === "o") {
                score += 50;
                frightened = Math.max(20, 45 - level * 4);
                ghostCombo = 0;

                ghosts.forEach(ghost => {
                    ghost.eaten = false;
                    ghost.direction = {
                        x: -ghost.direction.x,
                        y: -ghost.direction.y
                    };
                });

                GameBox.sound("power");
            } else {
                score += 10;

                if (tick % 2 === 0) GameBox.sound("tick");
            }

            scoreElement.textContent = score;
        }

        // Проверяем столкновение до и после хода призраков,
        // чтобы Pac-Man не «проходил сквозь» встречного призрака.
        if (checkGhostCollision()) {
            draw();
            return;
        }

        if (frightened > 0) {
            frightened--;
        }

        updateGhosts();

        if (checkGhostCollision()) {
            draw();
            return;
        }

        if (dots.size === 0) {
            level++;

            statusElement.textContent =
                `Уровень ${level}!`;

            GameBox.sound("win");

            createDots();
            resetPositions();
            startTimer();
        }

        draw();
    }

    function updateGhosts() {
        ghosts.forEach(ghost => {
            // Испуганные призраки двигаются в два раза медленнее.
            if (frightened > 0 && !ghost.eaten && tick % 2) return;

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

            const scared = frightened > 0 && !ghost.eaten;
            const chase = Math.min(0.8, 0.5 + level * 0.05);

            if (Math.random() < chase) {
                const distance = option =>
                    Math.abs(ghost.x + option.x - pacman.x) +
                    Math.abs(ghost.y + option.y - pacman.y);

                best = available.reduce((current, option) => {
                    const better = scared
                        ? distance(option) > distance(current)
                        : distance(option) < distance(current);

                    return better ? option : current;
                });
            }

            ghost.direction = best;

            ghost.x = wrapX(ghost.x + best.x);
            ghost.y += best.y;
        });
    }

    function checkGhostCollision() {
        for (const ghost of ghosts) {
            if (
                ghost.x !== pacman.x ||
                ghost.y !== pacman.y
            ) {
                continue;
            }

            if (frightened > 0 && !ghost.eaten) {
                ghostCombo++;

                const points = 200 * Math.pow(2, ghostCombo - 1);

                score += points;
                scoreElement.textContent = score;

                const start = GHOST_STARTS[ghosts.indexOf(ghost)];

                ghost.x = start.x;
                ghost.y = start.y;
                ghost.eaten = true;

                statusElement.textContent = `Призрак съеден! +${points}`;

                GameBox.sound("score");
                continue;
            }

            lives--;

            livesElement.textContent =
                lives;

            GameBox.vibrate([80, 40, 80]);

            if (lives <= 0) {
                gameOver = true;
                clearInterval(timer);

                statusElement.textContent =
                    `Pac-Man проиграл. Счёт: ${score}. Нажми «Заново».`;

                GameBox.sound("lose");
                GameBox.submit(score);

                return true;
            }

            GameBox.sound("explode");

            statusElement.textContent =
                `Осталось жизней: ${lives}`;

            resetPositions();

            return true;
        }

        return false;
    }

    function draw() {
        ctx.fillStyle = "#000";
        ctx.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        ctx.strokeStyle = "#204fca";
        ctx.lineWidth = 2;
        ctx.beginPath();

        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                if (map[row][col] === "#") {
                    ctx.rect(
                        col * TILE + 2,
                        row * TILE + 2,
                        TILE - 4,
                        TILE - 4
                    );
                }
            }
        }

        ctx.stroke();

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

        const angle = Math.atan2(facing.y, facing.x);
        const mouth = tick % 2 ? 0.25 : 0.08;

        ctx.fillStyle = "#ffd92f";

        ctx.beginPath();

        ctx.arc(
            px,
            py,
            8,
            angle + mouth * Math.PI,
            angle + (2 - mouth) * Math.PI
        );

        ctx.lineTo(px, py);
        ctx.fill();

        if (gameOver) {
            ctx.fillStyle = "rgba(0, 0, 0, .6)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = "#fff";
            ctx.font = "bold 28px Arial";
            ctx.textAlign = "center";
            ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
        }
    }

    function drawGhost(ghost) {
        const x =
            ghost.x * TILE + TILE / 2;

        const y =
            ghost.y * TILE + TILE / 2;

        const scared = frightened > 0 && !ghost.eaten;

        ctx.fillStyle = scared
            ? (frightened < 8 && frightened % 2 ? "#fff" : "#2340d8")
            : ghost.color;

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
        if (gameOver && (event.key === " " || event.key === "Enter")) {
            event.preventDefault();
            reset();
            return;
        }

        if (
            event.key === "ArrowUp" ||
            GameBox.key(event) === "w"
        ) {
            setDirection(0, -1);
            event.preventDefault();
        }

        if (
            event.key === "ArrowDown" ||
            GameBox.key(event) === "s"
        ) {
            setDirection(0, 1);
            event.preventDefault();
        }

        if (
            event.key === "ArrowLeft" ||
            GameBox.key(event) === "a"
        ) {
            setDirection(-1, 0);
            event.preventDefault();
        }

        if (
            event.key === "ArrowRight" ||
            GameBox.key(event) === "d"
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

    function touchMove(event) {
        event.preventDefault();

        if (!event.touches.length) return;

        const touch = event.touches[0];
        const dx = touch.clientX - touchStartX;
        const dy = touch.clientY - touchStartY;

        if (Math.max(Math.abs(dx), Math.abs(dy)) < 22) return;

        if (Math.abs(dx) > Math.abs(dy)) {
            setDirection(dx > 0 ? 1 : -1, 0);
        } else {
            setDirection(0, dy > 0 ? 1 : -1);
        }

        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
    }

    function touchEnd(event) {
        if (!event.changedTouches.length) return;

        const touch = event.changedTouches[0];

        const dx =
            touch.clientX - touchStartX;

        const dy =
            touch.clientY - touchStartY;

        if (
            Math.abs(dx) < 22 &&
            Math.abs(dy) < 22
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
        const handler = () => setDirection(x, y);

        GameBox.hold(button, handler);

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
        "touchmove",
        touchMove,
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
        canvas.removeEventListener("touchmove", touchMove);
        canvas.removeEventListener("touchend", touchEnd);

        handlers.forEach(([button, handler]) => {
            button.removeEventListener(
                "pointerdown",
                handler
            );
        });
    };
};