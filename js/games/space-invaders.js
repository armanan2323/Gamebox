window.createSpaceInvaders = function(root) {
    root.innerHTML = `
        <div class="game-box">
            <div class="game-toolbar">
                <strong>
                    Счёт: <span class="space-score">0</span>
                    · Жизни: <span class="space-lives">3</span>
                </strong>

                <button class="game-button space-restart">
                    Заново
                </button>
            </div>

            <canvas
                class="game-canvas space-canvas"
                width="600"
                height="600"
            ></canvas>

            <div class="mobile-controls">
                <button data-action="left">←</button>
                <button data-action="shoot">●</button>
                <button data-action="right">→</button>
            </div>

            <p class="game-status space-status">
                Стрелки - движение, Space - стрельба.
            </p>
        </div>
    `;

    const canvas = root.querySelector(".space-canvas");
    const ctx = canvas.getContext("2d");

    const scoreElement = root.querySelector(".space-score");
    const livesElement = root.querySelector(".space-lives");
    const status = root.querySelector(".space-status");
    const restart = root.querySelector(".space-restart");
    const controls = root.querySelectorAll(".mobile-controls button");

    let player;
    let enemies;
    let bullets;
    let enemyBullets;
    let keys;
    let score;
    let lives;
    let animation;
    let running;
    let enemyDirection;
    let enemyTimer;

    function start() {
        cancelAnimationFrame(animation);

        player = {
            x: 280,
            y: 540,
            width: 40,
            height: 20,
            speed: 6
        };

        enemies = [];

        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 8; col++) {
                enemies.push({
                    x: 60 + col * 65,
                    y: 50 + row * 45,
                    width: 34,
                    height: 22,
                    alive: true
                });
            }
        }

        bullets = [];
        enemyBullets = [];
        keys = {};

        score = 0;
        lives = 3;
        running = true;
        enemyDirection = 1;
        enemyTimer = 0;

        scoreElement.textContent = score;
        livesElement.textContent = lives;
        status.textContent =
            "Стрелки - движение, Space - стрельба.";

        loop();
    }

    function endGame(text, sound) {
        running = false;
        status.textContent = text;

        GameBox.sound(sound);
        GameBox.submit(score);
    }

    function update() {
        if (!running) return;

        if (keys.ArrowLeft || keys.KeyA) {
            player.x -= player.speed;
        }

        if (keys.ArrowRight || keys.KeyD) {
            player.x += player.speed;
        }

        player.x = Math.max(
            0,
            Math.min(
                canvas.width - player.width,
                player.x
            )
        );

        bullets.forEach(bullet => {
            bullet.y -= 8;
        });

        enemyBullets.forEach(bullet => {
            bullet.y += 4;
        });

        bullets = bullets.filter(
            bullet => bullet.y > -20
        );

        enemyBullets = enemyBullets.filter(
            bullet => bullet.y < canvas.height + 20
        );

        let changeDirection = false;

        enemies.forEach(enemy => {
            if (!enemy.alive) return;

            enemy.x += enemyDirection * 0.35;

            if (
                enemy.x < 10 ||
                enemy.x + enemy.width >
                    canvas.width - 10
            ) {
                changeDirection = true;
            }
        });

        if (changeDirection) {
            enemyDirection *= -1;

            enemies.forEach(enemy => {
                enemy.y += 15;
            });
        }

        enemyTimer++;

        if (enemyTimer > 50) {
            enemyTimer = 0;

            const alive = enemies.filter(
                enemy => enemy.alive
            );

            if (alive.length) {
                const enemy =
                    alive[
                        Math.floor(
                            Math.random() * alive.length
                        )
                    ];

                enemyBullets.push({
                    x: enemy.x + enemy.width / 2,
                    y: enemy.y + enemy.height,
                    width: 4,
                    height: 12
                });
            }
        }

        bullets.forEach(bullet => {
            enemies.forEach(enemy => {
                if (
                    !enemy.alive
                ) {
                    return;
                }

                if (
                    bullet.x <
                        enemy.x + enemy.width &&
                    bullet.x + bullet.width >
                        enemy.x &&
                    bullet.y <
                        enemy.y + enemy.height &&
                    bullet.y + bullet.height >
                        enemy.y
                ) {
                    enemy.alive = false;
                    bullet.y = -100;

                    score += 10;
                    scoreElement.textContent = score;

                    GameBox.sound("explode");
                }
            });
        });

        enemyBullets.forEach(bullet => {
            if (
                bullet.x <
                    player.x + player.width &&
                bullet.x + bullet.width >
                    player.x &&
                bullet.y <
                    player.y + player.height &&
                bullet.y + bullet.height >
                    player.y
            ) {
                bullet.y = canvas.height + 100;

                lives--;
                livesElement.textContent = lives;

                GameBox.sound("hit");
                GameBox.vibrate(120);

                if (lives <= 0) {
                    endGame("Игра окончена. Нажми «Заново».", "lose");
                }
            }
        });

        if (!running) return;

        const alive = enemies.filter(
            enemy => enemy.alive
        );

        if (!alive.length) {
            endGame("Победа! Все враги уничтожены.", "win");
            return;
        }

        if (
            alive.some(
                enemy =>
                    enemy.y + enemy.height >=
                    player.y
            )
        ) {
            endGame("Враги добрались до базы.", "lose");
        }
    }

    function shoot() {
        if (!running) return;

        if (bullets.length > 8) return;

        bullets.push({
            x: player.x + player.width / 2 - 2,
            y: player.y - 10,
            width: 4,
            height: 12
        });

        GameBox.sound("shoot");
    }

    function draw() {
        ctx.fillStyle = "#101310";
        ctx.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        ctx.fillStyle = "#ffffff";

        ctx.fillRect(
            player.x,
            player.y,
            player.width,
            player.height
        );

        enemies.forEach(enemy => {
            if (!enemy.alive) return;

            ctx.fillRect(
                enemy.x,
                enemy.y,
                enemy.width,
                enemy.height
            );
        });

        ctx.fillStyle = "#c7cdc6";

        bullets.forEach(bullet => {
            ctx.fillRect(
                bullet.x,
                bullet.y,
                bullet.width,
                bullet.height
            );
        });

        enemyBullets.forEach(bullet => {
            ctx.fillRect(
                bullet.x,
                bullet.y,
                bullet.width,
                bullet.height
            );
        });
    }

    function loop() {
        update();
        draw();

        animation = requestAnimationFrame(loop);
    }

    function keydown(event) {
        keys[event.code] = true;

        if (
            [
                "ArrowLeft",
                "ArrowRight",
                "Space"
            ].includes(event.code)
        ) {
            event.preventDefault();
        }

        if (event.code === "Space") {
            shoot();
        }
    }

    function keyup(event) {
        keys[event.code] = false;
    }

    controls.forEach(button => {
        const action = button.dataset.action;

        GameBox.hold(button, () => {
            if (!running) return;

            if (action === "left") {
                player.x = Math.max(0, player.x - 35);
            }

            if (action === "right") {
                player.x = Math.min(canvas.width - player.width, player.x + 35);
            }

            if (action === "shoot") {
                shoot();
            }
        }, null, { repeat: 110, delay: 200 });
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
