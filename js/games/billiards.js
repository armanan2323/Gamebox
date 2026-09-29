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
                Потяните от белого шара назад и отпустите
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
    let aimPoint = null;
    let shotPower = 0;
    let moving = false;
    let animationId = null;

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
                const x = startX + row * (ballRadius * 2 + 1);
                const y =
                    startY -
                    row * ballRadius +
                    col * (ballRadius * 2);

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
        aimPoint = null;
        shotPower = 0;
        moving = false;

        updateUI();
        draw();
    }

    function updateUI() {
        turnElement.textContent =
            `Ход игрока ${currentPlayer}`;

        scoreElement.textContent =
            `${score1}:${score2}`;

        powerFill.style.width =
            `${Math.round(shotPower * 100)}%`;
    }

    function getMousePosition(event) {
        const rect = canvas.getBoundingClientRect();

        return {
            x: (event.clientX - rect.left) *
                (canvas.width / rect.width),
            y: (event.clientY - rect.top) *
                (canvas.height / rect.height)
        };
    }

    function getCueBall() {
        return balls[0];
    }

    function startAim(point) {
        const cue = getCueBall();

        if (!cue || !cue.active || moving) {
            return;
        }

        const distance = Math.hypot(
            point.x - cue.x,
            point.y - cue.y
        );

        if (distance > 100) {
            return;
        }

        aiming = true;
        aimPoint = point;
        updateAim();
    }

    function updateAim() {
        if (!aiming || !aimPoint) {
            return;
        }

        const cue = getCueBall();

        const dx = cue.x - aimPoint.x;
        const dy = cue.y - aimPoint.y;

        const distance = Math.hypot(dx, dy);

        shotPower = Math.min(
            distance / 150,
            1
        );

        updateUI();
        draw();
    }

    function releaseAim() {
        if (!aiming) {
            return;
        }

        const cue = getCueBall();

        if (!cue) {
            return;
        }

        const dx = cue.x - aimPoint.x;
        const dy = cue.y - aimPoint.y;

        const distance = Math.hypot(dx, dy);

        if (distance < 10) {
            aiming = false;
            shotPower = 0;
            updateUI();
            draw();
            return;
        }

        const power = Math.min(
            distance / 80,
            1
        );

        cue.vx =
            (dx / distance) *
            power *
            8;

        cue.vy =
            (dy / distance) *
            power *
            8;

        aiming = false;
        aimPoint = null;
        shotPower = 0;
        moving = true;

        statusElement.textContent =
            `Игрок ${currentPlayer} наносит удар`;

        updateUI();
        animate();
    }

    function update() {
        let anyMoving = false;

        for (const ball of balls) {
            if (!ball.active) {
                continue;
            }

            ball.x += ball.vx;
            ball.y += ball.vy;

            ball.vx *= 0.985;
            ball.vy *= 0.985;

            if (
                Math.abs(ball.vx) < 0.02 &&
                Math.abs(ball.vy) < 0.02
            ) {
                ball.vx = 0;
                ball.vy = 0;
            }

            if (
                Math.abs(ball.vx) > 0 ||
                Math.abs(ball.vy) > 0
            ) {
                anyMoving = true;
            }

            handleWalls(ball);
        }

        handleCollisions();
        handlePockets();

        moving = anyMoving;

        if (!moving) {
            finishTurn();
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

        if (ball.x < left) {
            ball.x = left;
            ball.vx *= -0.85;
        }

        if (ball.x > right) {
            ball.x = right;
            ball.vx *= -0.85;
        }

        if (ball.y < top) {
            ball.y = top;
            ball.vy *= -0.85;
        }

        if (ball.y > bottom) {
            ball.y = bottom;
            ball.vy *= -0.85;
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
                    -relativeVelocity;

                a.vx -= impulse * nx;
                a.vy -= impulse * ny;

                b.vx += impulse * nx;
                b.vy += impulse * ny;
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
                        setTimeout(() => {
                            respawnCueBall();
                        }, 500);
                    } else {
                        if (currentPlayer === 1) {
                            score1++;
                        } else {
                            score2++;
                        }
                    }

                    updateUI();
                    break;
                }
            }
        }
    }

    function respawnCueBall() {
        const cue = getCueBall();

        cue.active = true;
        cue.x = table.x + 220;
        cue.y = table.y + table.height / 2;
        cue.vx = 0;
        cue.vy = 0;

        updateUI();
        draw();
    }

    function finishTurn() {
        if (balls.filter(ball => ball.active).length <= 1) {
            statusElement.textContent =
                "Игра окончена";
            return;
        }

        currentPlayer =
            currentPlayer === 1 ? 2 : 1;

        statusElement.textContent =
            `Игрок ${currentPlayer}, ваш ход`;

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

        for (const pocket of pockets) {
            ctx.beginPath();
            ctx.arc(
                pocket[0],
                pocket[1],
                pocketRadius,
                0,
                Math.PI * 2
            );
            ctx.fillStyle = "#050505";
            ctx.fill();
        }
    }

    function drawBalls() {
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
                ctx.font = "8px Arial";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(
                    ball.number,
                    ball.x,
                    ball.y
                );
            }
        }
    }

    function drawAim() {
        if (!aiming || !aimPoint) {
            return;
        }

        const cue = getCueBall();

        ctx.beginPath();
        ctx.moveTo(cue.x, cue.y);
        ctx.lineTo(
            cue.x + (cue.x - aimPoint.x),
            cue.y + (cue.y - aimPoint.y)
        );

        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 8]);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    function draw() {
        drawTable();
        drawBalls();
        drawAim();
    }

    function animate() {
        if (!moving) {
            draw();
            return;
        }

        update();
        draw();

        animationId =
            requestAnimationFrame(animate);
    }

    function pointerDown(event) {
        event.preventDefault();

        const point = getMousePosition(event);
        startAim(point);
    }

    function pointerMove(event) {
        if (!aiming) {
            return;
        }

        event.preventDefault();

        aimPoint = getMousePosition(event);
        updateAim();
    }

    function pointerUp(event) {
        if (!aiming) {
            return;
        }

        event.preventDefault();
        releaseAim();
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
        pointerUp
    );

    restartButton.addEventListener(
        "click",
        reset
    );

    reset();

    return function cleanup() {
        if (animationId) {
            cancelAnimationFrame(animationId);
        }

        canvas.removeEventListener(
            "pointerdown",
            pointerDown
        );

        canvas.removeEventListener(
            "pointermove",
            pointerMove
        );

        canvas.removeEventListener(
            "pointerup",
            pointerUp
        );

        canvas.removeEventListener(
            "pointercancel",
            pointerUp
        );

        restartButton.removeEventListener(
            "click",
            reset
        );
    };
};