window.createDoodleJump = function(root) {
    root.innerHTML = `
        <div class="game-box">
            <div class="game-toolbar">
                <strong>
                    Счёт: <span class="doodle-score">0</span>
                </strong>

                <button class="game-button doodle-restart">
                    Заново
                </button>
            </div>

            <canvas
                class="game-canvas doodle-canvas"
                width="400"
                height="600"
            ></canvas>

            <div class="mobile-controls">
                <button data-dir="left">←</button>
                <button data-dir="right">→</button>
            </div>

            <p class="game-status doodle-status">
                Стрелки или кнопки для движения.
            </p>
        </div>
    `;

    const canvas =
        root.querySelector(".doodle-canvas");

    const ctx = canvas.getContext("2d");

    const scoreElement =
        root.querySelector(".doodle-score");

    const status =
        root.querySelector(".doodle-status");

    const restart =
        root.querySelector(".doodle-restart");

    const controls =
        root.querySelectorAll(".mobile-controls button");

    let player;
    let platforms;
    let keys;
    let score;
    let animation;
    let running;

    function start() {
        cancelAnimationFrame(animation);

        player = {
            x: 180,
            y: 500,
            width: 28,
            height: 28,
            vx: 0,
            vy: -10
        };

        platforms = [
            {
                x: 150,
                y: 560,
                width: 100,
                height: 12
            }
        ];

        for (let i = 0; i < 12; i++) {
            platforms.push({
                x: Math.random() * 300,
                y: 520 - i * 70,
                width: 80,
                height: 12
            });
        }

        keys = {};
        score = 0;
        running = true;

        scoreElement.textContent = score;

        status.textContent =
            "Стрелки или кнопки для движения.";

        loop();
    }

    function update() {
        if (!running) return;

        if (keys.ArrowLeft || keys.KeyA) {
            player.vx = -4;
        } else if (
            keys.ArrowRight ||
            keys.KeyD
        ) {
            player.vx = 4;
        } else {
            player.vx *= 0.8;
        }

        player.x += player.vx;

        if (player.x < -player.width) {
            player.x = canvas.width;
        }

        if (player.x > canvas.width) {
            player.x = -player.width;
        }

        const oldBottom =
            player.y + player.height;

        player.vy += 0.4;
        player.y += player.vy;

        if (player.vy > 0) {
            platforms.forEach(platform => {
                const newBottom =
                    player.y + player.height;

                if (
                    oldBottom <= platform.y &&
                    newBottom >= platform.y &&
                    player.x + player.width >
                        platform.x &&
                    player.x <
                        platform.x + platform.width
                ) {
                    player.y =
                        platform.y -
                        player.height;

                    player.vy = -10;

                    score++;

                    scoreElement.textContent =
                        score;
                }
            });
        }

        if (player.y < 220) {
            const shift = 220 - player.y;

            player.y = 220;

            platforms.forEach(platform => {
                platform.y += shift;
            });

            platforms = platforms.filter(
                platform =>
                    platform.y < canvas.height + 30
            );

            while (platforms.length < 13) {
                const highest = Math.min(
                    ...platforms.map(
                        platform => platform.y
                    )
                );

                platforms.push({
                    x: Math.random() * 300,
                    y: highest - 70,
                    width: 80,
                    height: 12
                });
            }
        }

        if (player.y > canvas.height + 50) {
            running = false;

            status.textContent =
                "Игра окончена. Нажми «Заново».";
        }
    }

    function draw() {
        ctx.fillStyle = "#e4e8e2";

        ctx.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        ctx.fillStyle = "#606960";

        platforms.forEach(platform => {
            ctx.fillRect(
                platform.x,
                platform.y,
                platform.width,
                platform.height
            );
        });

        ctx.fillStyle = "#171917";

        ctx.fillRect(
            player.x,
            player.y,
            player.width,
            player.height
        );
    }

    function loop() {
        update();
        draw();

        animation =
            requestAnimationFrame(loop);
    }

    function keydown(event) {
        keys[event.code] = true;

        if (
            [
                "ArrowLeft",
                "ArrowRight"
            ].includes(event.code)
        ) {
            event.preventDefault();
        }
    }

    function keyup(event) {
        keys[event.code] = false;
    }

    controls.forEach(button => {
        button.addEventListener(
            "pointerdown",
            event => {
                event.preventDefault();

                keys[
                    button.dataset.dir === "left"
                        ? "ArrowLeft"
                        : "ArrowRight"
                ] = true;
            }
        );

        button.addEventListener(
            "pointerup",
            () => {
                keys[
                    button.dataset.dir === "left"
                        ? "ArrowLeft"
                        : "ArrowRight"
                ] = false;
            }
        );

        button.addEventListener(
            "pointercancel",
            () => {
                keys[
                    button.dataset.dir === "left"
                        ? "ArrowLeft"
                        : "ArrowRight"
                ] = false;
            }
        );
    });

    restart.addEventListener("click", start);

    document.addEventListener("keydown", keydown);
    document.addEventListener("keyup", keyup);

    start();

    return function() {
        cancelAnimationFrame(animation);
        document.removeEventListener("keydown", keydown);
        document.removeEventListener("keyup", keyup);
    };
};