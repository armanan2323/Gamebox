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

            <div class="mobile-controls" data-slide>
                <button data-dir="left">←</button>
                <button data-dir="right">→</button>
            </div>

            <p class="game-status doodle-status">
                Стрелки или кнопки. На телефоне - касайся левой/правой половины поля.
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
    let height;
    let running;

    const touches = new Map();

    function start() {
        loop.stop();

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
        height = 0;
        running = true;
        touches.clear();

        scoreElement.textContent = score;

        status.textContent =
            "Стрелки или кнопки. На телефоне - касайся левой/правой половины поля.";

        loop.start();
    }

    function touchDirection() {
        let direction = 0;

        touches.forEach(value => {
            direction = value;
        });

        return direction;
    }

    function update() {
        if (!running) return false;

        const touch = touchDirection();

        if (keys.ArrowLeft || keys.KeyA || touch < 0) {
            player.vx = -4.5;
        } else if (
            keys.ArrowRight ||
            keys.KeyD ||
            touch > 0
        ) {
            player.vx = 4.5;
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

                    GameBox.sound("jump");
                }
            });
        }

        if (player.y < 220) {
            const shift = 220 - player.y;

            player.y = 220;

            // Очки - за набранную высоту, а не за повторные прыжки на одной платформе.
            height += shift;

            const newScore = Math.floor(height / 10);

            if (newScore !== score) {
                score = newScore;
                scoreElement.textContent = score;
            }

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

                // С ростом высоты платформы становятся реже и уже.
                const gap = Math.min(105, 70 + score / 40);
                const width = Math.max(55, 80 - score / 100);

                platforms.push({
                    x: Math.random() * (canvas.width - width),
                    y: highest - gap,
                    width,
                    height: 12
                });
            }
        }

        if (player.y > canvas.height + 50) {
            running = false;

            status.textContent =
                `Игра окончена. Счёт: ${score}. Нажми «Заново» или пробел.`;

            GameBox.sound("lose");
            GameBox.vibrate([80, 40, 80]);
            GameBox.submit(score);

            draw();
            loop.stop();

            return false;
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

        ctx.fillStyle = "#3f8f55";

        ctx.fillRect(
            player.x,
            player.y,
            player.width,
            player.height
        );

        ctx.fillStyle = "#fff";
        ctx.fillRect(player.x + 6, player.y + 7, 6, 6);
        ctx.fillRect(player.x + 16, player.y + 7, 6, 6);
        ctx.fillStyle = "#111";
        ctx.fillRect(player.x + 8 + Math.sign(player.vx) * 1.5, player.y + 9, 3, 3);
        ctx.fillRect(player.x + 18 + Math.sign(player.vx) * 1.5, player.y + 9, 3, 3);

        if (!running) {
            ctx.fillStyle = "rgba(0, 0, 0, .55)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#fff";
            ctx.font = "bold 28px Arial";
            ctx.textAlign = "center";
            ctx.fillText(`Счёт: ${score}`, canvas.width / 2, canvas.height / 2);
        }
    }

    const loop = GameBox.loop(update, draw);

    function keydown(event) {
        if (!running && (event.code === "Space" || event.code === "Enter")) {
            event.preventDefault();
            start();
            return;
        }

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
        const key =
            button.dataset.dir === "left"
                ? "ArrowLeft"
                : "ArrowRight";

        GameBox.hold(
            button,
            () => {
                keys[key] = true;
            },
            () => {
                keys[key] = false;
            }
        );
    });

    canvas.addEventListener("pointerdown", event => {
        event.preventDefault();

        if (!running) {
            start();
            return;
        }

        try {
            canvas.setPointerCapture(event.pointerId);
        } catch (error) {}

        const point = GameBox.point(canvas, event);
        touches.set(event.pointerId, point.x < canvas.width / 2 ? -1 : 1);
    });

    canvas.addEventListener("pointermove", event => {
        if (!touches.has(event.pointerId)) return;

        const point = GameBox.point(canvas, event);
        touches.set(event.pointerId, point.x < canvas.width / 2 ? -1 : 1);
    });

    ["pointerup", "pointercancel"].forEach(type => {
        canvas.addEventListener(type, event => {
            touches.delete(event.pointerId);
        });
    });

    function blur() {
        keys = {};
        touches.clear();
    }

    restart.addEventListener("click", start);

    document.addEventListener("keydown", keydown);
    document.addEventListener("keyup", keyup);
    window.addEventListener("blur", blur);

    start();

    return function() {
        loop.stop();
        document.removeEventListener("keydown", keydown);
        document.removeEventListener("keyup", keyup);
        window.removeEventListener("blur", blur);
    };
};