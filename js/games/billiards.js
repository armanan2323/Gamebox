window.createBilliards = function(root) {
    root.innerHTML = `
        <div class="game-box billiards-game">
            <div class="game-toolbar">
                <strong>Бильярд</strong>
                <button class="game-button billiards-restart">Заново</button>
            </div>

            <div class="billiards-info">
                <span class="billiards-turn">Ход игрока 1</span>
                <span class="billiards-score">1:0</span>
            </div>

            <canvas class="billiards-canvas" width="900" height="500"></canvas>

            <div class="billiards-power">
                Сила удара
                <div class="billiards-power-bar">
                    <div class="billiards-power-fill"></div>
                </div>
            </div>

            <p class="game-status billiards-status">
                Нажмите в любом месте стола, потяните назад (как рогатку) и отпустите.
                Забили шар - бьёте ещё раз.
            </p>
        </div>
    `;

    const canvas = root.querySelector(".billiards-canvas");
    const ctx = canvas.getContext("2d");
    const restartButton = root.querySelector(".billiards-restart");
    const turnElement = root.querySelector(".billiards-turn");
    const scoreElement = root.querySelector(".billiards-score");
    const statusElement = root.querySelector(".billiards-status");
    const powerFill = root.querySelector(".billiards-power-fill");

    const W = canvas.width;
    const H = canvas.height;

    const table = {
        x: 45,
        y: 45,
        width: 810,
        height: 410
    };

    const ballRadius = 11;
    const pocketRadius = 22;

    let balls = [];
    let currentPlayer = 1;
    let score1 = 0;
    let score2 = 0;
    let aiming = false;
    let aimStart = null;
    let aimPoint = null;
    let aimPointer = null;
    let shotPower = 0;
    let moving = false;
    let gameOver = false;
    let pocketedThisShot = 0;
    let cueFoul = false;
    let collisionSoundTime = 0;

    const MAX_DRAG = 160;
    const MAX_SPEED = 13;

    const pockets = [
        [table.x, table.y],
        [table.x + table.width / 2, table.y],
        [table.x + table.width, table.y],
        [table.x, table.y + table.height],
        [table.x + table.width / 2, table.y + table.height],
        [table.x + table.width, table.y + table.height]
    ];

    function createBall(x, y, color, number = 0) {
        return {
            x,
            y,
            vx: 0,
            vy: 0,
            color,
            number,
            active: true
        };
    }

    function reset() {
        loop.stop();

        balls = [];

        balls.push(
            createBall(
                table.x + 220,
                table.y + table.height / 2,
                "#fff"
            )
        );

        const colors = [
            "#f5c542",
            "#4287f5",
            "#e53935",
            "#9b59b6",
            "#f39c12",
            "#2ecc71",
            "#e67e22",
            "#3498db",
            "#e74c3c"
        ];

        const startX = table.x + 590;
        const startY = table.y + table.height / 2;

        let index = 0;

        for (let row = 0; row < 5; row++) {
            for (let col = 0; col <= row; col++) {
                const x = startX + row * (ballRadius * 2 * 0.88);
                const y =
                    startY -
                    row * (ballRadius + 0.5) +
                    col * (ballRadius * 2 + 1);

                balls.push(
                    createBall(
                        x,
                        y,
                        colors[index % colors.length],
                        index + 1
                    )
                );

                index++;
            }
        }

        currentPlayer = 1;
        score1 = 0;
        score2 = 0;
        aiming = false;
        aimStart = null;
        aimPoint = null;
        aimPointer = null;
        shotPower = 0;
        moving = false;
        gameOver = false;

        statusElement.textContent =
            "Нажмите в любом месте стола, потяните назад и отпустите. Забили шар - бьёте ещё раз.";

        updateUI();
        draw();
    }

    function updateUI() {
        turnElement.textContent = gameOver
            ? "Игра окончена"
            : `Ход: ${GameBox.name(currentPlayer)}`;

        scoreElement.textContent =
            `${score1}:${score2}`;

        powerFill.style.width =
            `${Math.round(shotPower * 100)}%`;
    }

    function getCueBall() {
        return balls[0];
    }

    // Направление удара: от точки, куда оттянули палец, к точке нажатия.
    function aimVector() {
        if (!aimStart || !aimPoint) return null;

        const dx = aimStart.x - aimPoint.x;
        const dy = aimStart.y - aimPoint.y;
        const distance = Math.hypot(dx, dy);

        if (distance < 6) return null;

        return {
            nx: dx / distance,
            ny: dy / distance,
            power: Math.min(distance / MAX_DRAG, 1)
        };
    }

    function startAim(point, pointerId) {
        const cue = getCueBall();

        if (!cue || !cue.active || moving || gameOver) {
            return;
        }

        aiming = true;
        aimStart = point;
        aimPoint = point;
        aimPointer = pointerId;
        shotPower = 0;

        updateUI();
        draw();
    }

    function updateAim(point) {
        if (!aiming) return;

        aimPoint = point;

        const vector = aimVector();
        shotPower = vector ? vector.power : 0;

        updateUI();
        draw();
    }

    function releaseAim() {
        if (!aiming) {
            return;
        }

        const cue = getCueBall();
        const vector = aimVector();

        aiming = false;
        aimPointer = null;

        if (!cue || !vector || vector.power < 0.05) {
            aimStart = null;
            aimPoint = null;
            shotPower = 0;
            updateUI();
            draw();
            return;
        }

        cue.vx = vector.nx * vector.power * MAX_SPEED;
        cue.vy = vector.ny * vector.power * MAX_SPEED;

        aimStart = null;
        aimPoint = null;
        shotPower = 0;
        moving = true;
        pocketedThisShot = 0;
        cueFoul = false;

        statusElement.textContent =
            `${GameBox.name(currentPlayer)} наносит удар`;

        GameBox.sound("hit");

        updateUI();
        loop.start();
    }

    const SUBSTEPS = 4;

    function step() {
        if (!moving) return false;

        // Несколько подшагов за кадр - быстрые шары не пролетают друг сквозь друга.
        for (let i = 0; i < SUBSTEPS; i++) {
            for (const ball of balls) {
                if (!ball.active) continue;

                ball.x += ball.vx / SUBSTEPS;
                ball.y += ball.vy / SUBSTEPS;

                handleWalls(ball);
            }

            handleCollisions();
            handlePockets();
        }

        let anyMoving = false;

        for (const ball of balls) {
            if (!ball.active) continue;

            ball.vx *= 0.985;
            ball.vy *= 0.985;

            if (Math.hypot(ball.vx, ball.vy) < 0.04) {
                ball.vx = 0;
                ball.vy = 0;
            } else {
                anyMoving = true;
            }
        }

        moving = anyMoving;

        if (!moving) {
            loop.stop();
            finishTurn();
            return false;
        }
    }

    function handleWalls(ball) {
        const left = table.x + ballRadius;
        const right =
            table.x +
            table.width -
            ballRadius;

        const top = table.y + ballRadius;
        const bottom =
            table.y +
            table.height -
            ballRadius;

        let hit = false;

        if (ball.x < left) {
            ball.x = left;
            ball.vx = Math.abs(ball.vx) * 0.85;
            hit = true;
        }

        if (ball.x > right) {
            ball.x = right;
            ball.vx = -Math.abs(ball.vx) * 0.85;
            hit = true;
        }

        if (ball.y < top) {
            ball.y = top;
            ball.vy = Math.abs(ball.vy) * 0.85;
            hit = true;
        }

        if (ball.y > bottom) {
            ball.y = bottom;
            ball.vy = -Math.abs(ball.vy) * 0.85;
            hit = true;
        }

        if (hit && Math.hypot(ball.vx, ball.vy) > 2) {
            collisionSound();
        }
    }

    function collisionSound() {
        const now = performance.now();

        if (now - collisionSoundTime > 60) {
            collisionSoundTime = now;
            GameBox.sound("move");
        }
    }

    function handleCollisions() {
        for (let i = 0; i < balls.length; i++) {
            const a = balls[i];

            if (!a.active) {
                continue;
            }

            for (let j = i + 1; j < balls.length; j++) {
                const b = balls[j];

                if (!b.active) {
                    continue;
                }

                const dx = b.x - a.x;
                const dy = b.y - a.y;

                const distance = Math.hypot(dx, dy);
                const minDistance =
                    ballRadius * 2;

                if (
                    distance === 0 ||
                    distance >= minDistance
                ) {
                    continue;
                }

                const nx = dx / distance;
                const ny = dy / distance;

                const overlap =
                    minDistance - distance;

                a.x -= nx * overlap / 2;
                a.y -= ny * overlap / 2;

                b.x += nx * overlap / 2;
                b.y += ny * overlap / 2;

                const relativeVelocity =
                    (b.vx - a.vx) * nx +
                    (b.vy - a.vy) * ny;

                if (relativeVelocity > 0) {
                    continue;
                }

                const impulse =
                    -relativeVelocity * 0.97;

                a.vx -= impulse * nx;
                a.vy -= impulse * ny;

                b.vx += impulse * nx;
                b.vy += impulse * ny;

                if (impulse > 0.6) collisionSound();
            }
        }
    }

    function handlePockets() {
        for (const ball of balls) {
            if (!ball.active) {
                continue;
            }

            for (const pocket of pockets) {
                const distance = Math.hypot(
                    ball.x - pocket[0],
                    ball.y - pocket[1]
                );

                if (distance < pocketRadius) {
                    ball.active = false;
                    ball.vx = 0;
                    ball.vy = 0;

                    if (ball === getCueBall()) {
                        cueFoul = true;
                        GameBox.sound("error");
                    } else {
                        pocketedThisShot++;

                        if (currentPlayer === 1) {
                            score1++;
                        } else {
                            score2++;
                        }

                        GameBox.sound("eat");
                    }

                    updateUI();
                    break;
                }
            }
        }
    }

    // Ставим биток на исходную точку или ближайшую свободную.
    function respawnCueBall() {
        const cue = getCueBall();

        const baseX = table.x + 220;
        const baseY = table.y + table.height / 2;

        let x = baseX;
        let y = baseY;

        for (let attempt = 0; attempt < 60; attempt++) {
            const free = balls.every(ball =>
                ball === cue ||
                !ball.active ||
                Math.hypot(ball.x - x, ball.y - y) > ballRadius * 2 + 2
            );

            if (free) break;

            x = baseX + (Math.random() - 0.5) * 160;
            y = baseY + (Math.random() - 0.5) * 300;
        }

        cue.active = true;
        cue.x = x;
        cue.y = y;
        cue.vx = 0;
        cue.vy = 0;
    }

    function finishTurn() {
        if (cueFoul) {
            respawnCueBall();
        }

        const left = balls.filter(ball => ball !== getCueBall() && ball.active).length;

        if (left === 0) {
            gameOver = true;

            let text;

            if (score1 === score2) {
                text = "Игра окончена - ничья!";
                GameBox.sound("error");
            } else {
                const winner = score1 > score2 ? 1 : 2;
                text = `Игра окончена! Победил ${GameBox.name(winner)}`;
                GameBox.sound("win");
                GameBox.vibrate(150);
                GameBox.win(GameBox.name(winner));
            }

            statusElement.textContent = text;
            updateUI();
            draw();
            return;
        }

        if (pocketedThisShot > 0 && !cueFoul) {
            statusElement.textContent =
                `Шар забит! ${GameBox.name(currentPlayer)} бьёт ещё раз`;
        } else {
            currentPlayer =
                currentPlayer === 1 ? 2 : 1;

            statusElement.textContent = cueFoul
                ? `Фол: биток в лузе. Ход: ${GameBox.name(currentPlayer)}`
                : `${GameBox.name(currentPlayer)}, ваш ход`;
        }

        updateUI();
        draw();
    }

    function drawTable() {
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, W, H);

        ctx.fillStyle = "#5b321c";
        ctx.fillRect(
            table.x - 25,
            table.y - 25,
            table.width + 50,
            table.height + 50
        );

        ctx.fillStyle = "#126b3a";
        ctx.fillRect(
            table.x,
            table.y,
            table.width,
            table.height
        );

        ctx.fillStyle = "#050505";
        ctx.beginPath();

        for (const pocket of pockets) {
            ctx.moveTo(pocket[0] + pocketRadius, pocket[1]);
            ctx.arc(
                pocket[0],
                pocket[1],
                pocketRadius,
                0,
                Math.PI * 2
            );
        }

        ctx.fill();
    }

    function drawBalls() {
        ctx.font = "bold 9px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        for (const ball of balls) {
            if (!ball.active) {
                continue;
            }

            ctx.beginPath();
            ctx.arc(
                ball.x,
                ball.y,
                ballRadius,
                0,
                Math.PI * 2
            );

            ctx.fillStyle = ball.color;
            ctx.fill();

            ctx.strokeStyle = "#222";
            ctx.lineWidth = 1;
            ctx.stroke();

            if (ball.number) {
                ctx.fillStyle = "#fff";
                ctx.fillText(
                    ball.number,
                    ball.x,
                    ball.y + 0.5
                );
            }
        }
    }

    function drawAim() {
        if (!aiming) {
            return;
        }

        const vector = aimVector();

        if (!vector) return;

        const cue = getCueBall();
        const length = 80 + vector.power * 260;

        ctx.beginPath();
        ctx.moveTo(cue.x, cue.y);
        ctx.lineTo(
            cue.x + vector.nx * length,
            cue.y + vector.ny * length
        );

        ctx.strokeStyle = "rgba(255, 255, 255, .85)";
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 8]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Кий позади битка.
        const back = ballRadius + 8 + vector.power * 50;

        ctx.beginPath();
        ctx.moveTo(cue.x - vector.nx * back, cue.y - vector.ny * back);
        ctx.lineTo(cue.x - vector.nx * (back + 160), cue.y - vector.ny * (back + 160));
        ctx.strokeStyle = "#d9b27c";
        ctx.lineWidth = 6;
        ctx.lineCap = "round";
        ctx.stroke();
        ctx.lineCap = "butt";
    }

    function draw() {
        drawTable();
        drawBalls();
        drawAim();
    }

    const loop = GameBox.loop(step, draw);

    function pointerDown(event) {
        event.preventDefault();

        if (aiming) return;

        try {
            canvas.setPointerCapture(event.pointerId);
        } catch (error) {}

        startAim(GameBox.point(canvas, event), event.pointerId);
    }

    function pointerMove(event) {
        if (!aiming || event.pointerId !== aimPointer) {
            return;
        }

        event.preventDefault();

        updateAim(GameBox.point(canvas, event));
    }

    function pointerUp(event) {
        if (!aiming || event.pointerId !== aimPointer) {
            return;
        }

        event.preventDefault();
        releaseAim();
    }

    function pointerCancel(event) {
        if (event.pointerId !== aimPointer) return;

        aiming = false;
        aimPointer = null;
        aimStart = null;
        aimPoint = null;
        shotPower = 0;

        updateUI();
        draw();
    }

    canvas.addEventListener(
        "pointerdown",
        pointerDown
    );

    canvas.addEventListener(
        "pointermove",
        pointerMove
    );

    canvas.addEventListener(
        "pointerup",
        pointerUp
    );

    canvas.addEventListener(
        "pointercancel",
        pointerCancel
    );

    restartButton.addEventListener(
        "click",
        reset
    );

    reset();

    return function cleanup() {
        loop.stop();
    };
};