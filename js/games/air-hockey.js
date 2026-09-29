window.createAirHockey = function(root) {
    root.innerHTML = `
        <div class="game-box air-hockey-game">
            <div class="game-toolbar">
                <strong>Аэрохоккей</strong>
                <button class="game-button hockey-restart">Заново</button>
            </div>

            <div class="hockey-score">
                <span class="hockey-blue-score">0</span>
                <span>:</span>
                <span class="hockey-red-score">0</span>
            </div>

            <canvas class="air-hockey-canvas" width="800" height="500"></canvas>

            <p class="game-status hockey-status">
                Синий игрок ходит первым
            </p>
        </div>
    `;

    const canvas = root.querySelector(".air-hockey-canvas");
    const ctx = canvas.getContext("2d");

    const restartButton =
        root.querySelector(".hockey-restart");

    const blueScoreElement =
        root.querySelector(".hockey-blue-score");

    const redScoreElement =
        root.querySelector(".hockey-red-score");

    const statusElement =
        root.querySelector(".hockey-status");

    const W = canvas.width;
    const H = canvas.height;

    const player1 = {
        x: W / 2,
        y: H - 65,
        radius: 30,
        color: "#3f8ff5"
    };

    const player2 = {
        x: W / 2,
        y: 65,
        radius: 30,
        color: "#e54848"
    };

    const puck = {
        x: W / 2,
        y: H / 2,
        radius: 16,
        vx: 3,
        vy: 3,
        maxSpeed: 8
    };

    let scoreBlue = 0;
    let scoreRed = 0;
    let animationId = null;

    let keys = {
        w: false,
        a: false,
        s: false,
        d: false,
        ArrowUp: false,
        ArrowDown: false,
        ArrowLeft: false,
        ArrowRight: false
    };

    function resetPuck(direction = 1) {
        puck.x = W / 2;
        puck.y = H / 2;

        puck.vx =
            (Math.random() > 0.5 ? 1 : -1) * 3;

        puck.vy = 3 * direction;
    }

    function reset() {
        scoreBlue = 0;
        scoreRed = 0;

        player1.x = W / 2;
        player1.y = H - 65;

        player2.x = W / 2;
        player2.y = 65;

        resetPuck(
            Math.random() > 0.5 ? 1 : -1
        );

        updateScore();

        statusElement.textContent =
            "Синий игрок ходит первым";

        if (!animationId) {
            animate();
        }
    }

    function updateScore() {
        blueScoreElement.textContent =
            scoreBlue;

        redScoreElement.textContent =
            scoreRed;
    }

    function clamp(value, min, max) {
        return Math.max(
            min,
            Math.min(max, value)
        );
    }

    function updatePlayer(
        player,
        up,
        down,
        left,
        right
    ) {
        const speed = 5;

        if (keys[up]) {
            player.y -= speed;
        }

        if (keys[down]) {
            player.y += speed;
        }

        if (keys[left]) {
            player.x -= speed;
        }

        if (keys[right]) {
            player.x += speed;
        }

        if (player === player1) {
            player.y = clamp(
                player.y,
                H / 2 + 30,
                H - 30
            );
        } else {
            player.y = clamp(
                player.y,
                30,
                H / 2 - 30
            );
        }

        player.x = clamp(
            player.x,
            player.radius + 10,
            W - player.radius - 10
        );
    }

    function update() {
        updatePlayer(
            player1,
            "w",
            "s",
            "a",
            "d"
        );

        updatePlayer(
            player2,
            "ArrowUp",
            "ArrowDown",
            "ArrowLeft",
            "ArrowRight"
        );

        puck.x += puck.vx;
        puck.y += puck.vy;

        if (
            puck.x - puck.radius < 10 ||
            puck.x + puck.radius > W - 10
        ) {
            puck.vx *= -1;

            puck.x = clamp(
                puck.x,
                puck.radius + 10,
                W - puck.radius - 10
            );
        }

        if (
            puck.y - puck.radius < 10 &&
            puck.y > 0
        ) {
            if (
                puck.x > W / 2 - 80 &&
                puck.x < W / 2 + 80
            ) {
                scoreBlue++;
                updateScore();

                if (scoreBlue >= 7) {
                    statusElement.textContent =
                        "Синий игрок победил!";

                    resetPuck(1);
                    return;
                }

                resetPuck(1);
            } else {
                puck.vy *= -1;
                puck.y = puck.radius + 10;
            }
        }

        if (
            puck.y + puck.radius > H - 10
        ) {
            if (
                puck.x > W / 2 - 80 &&
                puck.x < W / 2 + 80
            ) {
                scoreRed++;
                updateScore();

                if (scoreRed >= 7) {
                    statusElement.textContent =
                        "Красный игрок победил!";

                    resetPuck(-1);
                    return;
                }

                resetPuck(-1);
            } else {
                puck.vy *= -1;
                puck.y =
                    H - puck.radius - 10;
            }
        }

        collideWithPlayer(player1);
        collideWithPlayer(player2);
    }

    function collideWithPlayer(player) {
        const dx = puck.x - player.x;
        const dy = puck.y - player.y;

        const distance =
            Math.hypot(dx, dy);

        const minDistance =
            puck.radius + player.radius;

        if (
            distance === 0 ||
            distance >= minDistance
        ) {
            return;
        }

        const nx = dx / distance;
        const ny = dy / distance;

        puck.x =
            player.x +
            nx * minDistance;

        puck.y =
            player.y +
            ny * minDistance;

        const speed =
            Math.hypot(
                puck.vx,
                puck.vy
            );

        const newSpeed =
            Math.min(
                speed + 0.35,
                puck.maxSpeed
            );

        puck.vx =
            nx * newSpeed;

        puck.vy =
            ny * newSpeed;
    }

    function drawTable() {
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, W, H);

        ctx.strokeStyle = "#333";
        ctx.lineWidth = 4;

        ctx.strokeRect(
            10,
            10,
            W - 20,
            H - 20
        );

        ctx.beginPath();

        ctx.moveTo(10, H / 2);
        ctx.lineTo(W - 10, H / 2);

        ctx.strokeStyle = "#222";
        ctx.stroke();

        ctx.beginPath();

        ctx.arc(
            W / 2,
            H / 2,
            75,
            0,
            Math.PI * 2
        );

        ctx.strokeStyle = "#222";
        ctx.stroke();

        ctx.fillStyle = "#111";

        ctx.fillRect(
            W / 2 - 80,
            0,
            160,
            25
        );

        ctx.fillRect(
            W / 2 - 80,
            H - 25,
            160,
            25
        );
    }

    function drawPlayer(player) {
        ctx.beginPath();

        ctx.arc(
            player.x,
            player.y,
            player.radius,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            player.color;

        ctx.fill();

        ctx.beginPath();

        ctx.arc(
            player.x,
            player.y,
            player.radius - 8,
            0,
            Math.PI * 2
        );

        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    function drawPuck() {
        ctx.beginPath();

        ctx.arc(
            puck.x,
            puck.y,
            puck.radius,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = "#eee";
        ctx.fill();

        ctx.strokeStyle = "#777";
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    function draw() {
        drawTable();
        drawPlayer(player1);
        drawPlayer(player2);
        drawPuck();
    }

    function animate() {
        update();
        draw();

        animationId =
            requestAnimationFrame(animate);
    }

    function keyDown(event) {
        if (
            Object.prototype.hasOwnProperty.call(
                keys,
                event.key
            )
        ) {
            event.preventDefault();
            keys[event.key] = true;
        }
    }

    function keyUp(event) {
        if (
            Object.prototype.hasOwnProperty.call(
                keys,
                event.key
            )
        ) {
            event.preventDefault();
            keys[event.key] = false;
        }
    }

    window.addEventListener(
        "keydown",
        keyDown
    );

    window.addEventListener(
        "keyup",
        keyUp
    );

    restartButton.addEventListener(
        "click",
        reset
    );

    reset();

    return function cleanup() {
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }

        window.removeEventListener(
            "keydown",
            keyDown
        );

        window.removeEventListener(
            "keyup",
            keyUp
        );

        restartButton.removeEventListener(
            "click",
            reset
        );
    };
};