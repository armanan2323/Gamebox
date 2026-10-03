window.createBoxing = function(root) {
    function pad(player) {
        return `
            <div class="duo-pad box-pad duo-pad-${player}" data-player="${player}">
                <div class="box-pad-row">
                    <button class="mobile-control" data-key="left" aria-label="Влево">←</button>
                    <button class="mobile-control" data-key="block" aria-label="Блок">🛡</button>
                    <button class="mobile-control" data-key="right" aria-label="Вправо">→</button>
                </div>
                <div class="box-pad-row">
                    <button class="duo-action" data-key="light">Лёгкий</button>
                    <button class="duo-action duo-fire" data-key="heavy">Сильный</button>
                </div>
            </div>
        `;
    }

    root.innerHTML = `
        <div class="game-box boxing-game">
            <div class="game-toolbar">
                <strong class="duo-score">
                    <span class="duo-name-1"></span>
                    <span class="duo-score-1">0</span>
                    :
                    <span class="duo-score-2">0</span>
                    <span class="duo-name-2"></span>
                </strong>

                <div class="toolbar-actions">
                    <button class="game-button box-rematch">Реванш</button>
                </div>
            </div>

            <canvas class="game-canvas boxing-canvas" width="640" height="360"></canvas>

            <p class="game-status boxing-status">
                Синий: A/D, W - блок, F/G - удары · Красный: ←/→, ↑ - блок, K/L - удары
            </p>

            <div class="mobile-controls duo-controls">
                ${pad(1)}
                ${pad(2)}
            </div>
        </div>
    `;

    const canvas = root.querySelector(".boxing-canvas");
    const ctx = canvas.getContext("2d");
    const status = root.querySelector(".boxing-status");
    const rematchButton = root.querySelector(".box-rematch");
    const scoreElements = [null, root.querySelector(".duo-score-1"), root.querySelector(".duo-score-2")];

    root.querySelector(".duo-name-1").textContent = GameBox.name(1);
    root.querySelector(".duo-name-2").textContent = GameBox.name(2);

    const W = canvas.width;
    const H = canvas.height;
    const FLOOR = 300;
    const ROUND_TIME = 60;
    const MAX_HP = 100;
    const MOVE_SPEED = 210;
    const MIN_DISTANCE = 64;

    const ATTACKS = {
        light: { windup: 0.07, active: 0.08, recover: 0.17, damage: 6, reach: 64, push: 90, stun: 0.22, chip: 0.25 },
        heavy: { windup: 0.28, active: 0.1, recover: 0.38, damage: 15, reach: 76, push: 240, stun: 0.42, chip: 0.35 }
    };

    const KEYS = {
        KeyA: [1, "left"], KeyD: [1, "right"], KeyW: [1, "block"], KeyF: [1, "light"], KeyG: [1, "heavy"],
        ArrowLeft: [2, "left"], ArrowRight: [2, "right"], ArrowUp: [2, "block"], KeyK: [2, "light"], KeyL: [2, "heavy"]
    };

    const COLORS = [
        null,
        { main: "#3f8ff5", dark: "#245fae", glove: "#2f6fd0" },
        { main: "#e54848", dark: "#a42c2c", glove: "#c43232" }
    ];

    let fighters;
    let timeLeft;
    let finished;
    let winner;
    let wins = [0, 0, 0];
    let finishedFor = 0;

    const input = [null, emptyInput(), emptyInput()];

    function emptyInput() {
        return { left: false, right: false, block: false };
    }

    function createFighter(player) {
        return {
            player,
            x: player === 1 ? 200 : 440,
            vx: 0,
            hp: MAX_HP,
            shownHp: MAX_HP,
            state: "idle",
            timer: 0,
            attack: null,
            attackHit: false,
            flash: 0,
            walk: 0,
            fall: 0
        };
    }

    function startMatch() {
        fighters = [null, createFighter(1), createFighter(2)];
        timeLeft = ROUND_TIME;
        finished = false;
        finishedFor = 0;
        winner = 0;

        input[1] = emptyInput();
        input[2] = emptyInput();

        status.textContent =
            "Синий: A/D, W - блок, F/G - удары · Красный: ←/→, ↑ - блок, K/L - удары";

        GameBox.sound("go");

        loop.start();
    }

    function opponent(fighter) {
        return fighters[fighter.player === 1 ? 2 : 1];
    }

    function facing(fighter) {
        return opponent(fighter).x > fighter.x ? 1 : -1;
    }

    function startAttack(player, kind) {
        if (finished) return;

        const fighter = fighters[player];

        // Удар можно начать только из свободного состояния - это и есть задержка между ударами.
        if (fighter.state !== "idle") return;

        fighter.state = "windup";
        fighter.attack = kind;
        fighter.timer = ATTACKS[kind].windup;
        fighter.attackHit = false;
    }

    function tryHit(attacker) {
        const attack = ATTACKS[attacker.attack];
        const defender = opponent(attacker);
        const distance = Math.abs(defender.x - attacker.x);

        if (finished || attacker.attackHit || distance > attack.reach + 20) return;

        attacker.attackHit = true;

        const blocking = defender.state === "block";
        const dir = facing(attacker);

        if (blocking) {
            defender.hp = Math.max(0, defender.hp - attack.damage * attack.chip);
            defender.vx = dir * attack.push * 0.5;
            defender.flash = 0.08;

            GameBox.sound("move");
        } else {
            defender.hp = Math.max(0, defender.hp - attack.damage);
            defender.vx = dir * attack.push;
            defender.flash = 0.18;

            // Попадание сбивает чужой замах.
            defender.state = "hit";
            defender.timer = attack.stun;
            defender.attack = null;

            GameBox.sound(attacker.attack === "heavy" ? "explode" : "hit");
            GameBox.vibrate(attacker.attack === "heavy" ? 60 : 25);
        }

        if (defender.hp <= 0) {
            finish(attacker.player);
        }
    }

    function finish(winnerPlayer) {
        finished = true;
        winner = winnerPlayer;

        if (winner) {
            wins[winner]++;
            scoreElements[winner].textContent = wins[winner];

            const loser = fighters[winner === 1 ? 2 : 1];

            if (loser.hp <= 0) {
                loser.state = "ko";
            }

            GameBox.win(GameBox.name(winner));
            GameBox.sound("win");

            status.textContent = `${GameBox.name(winner)} побеждает! Нажми «Реванш».`;
        } else {
            GameBox.sound("error");
            status.textContent = "Ничья! Нажми «Реванш».";
        }
    }

    function updateFighter(fighter, dt) {
        const control = input[fighter.player];
        const other = opponent(fighter);

        fighter.flash = Math.max(0, fighter.flash - dt);
        fighter.shownHp += (fighter.hp - fighter.shownHp) * Math.min(1, dt * 6);

        if (fighter.state === "ko") {
            fighter.fall = Math.min(1, fighter.fall + dt * 3);
            return;
        }

        if (fighter.state === "windup" || fighter.state === "active" || fighter.state === "recover" || fighter.state === "hit") {
            fighter.timer -= dt;

            if (fighter.state === "active") tryHit(fighter);

            if (fighter.timer <= 0) {
                if (fighter.state === "windup") {
                    fighter.state = "active";
                    fighter.timer = ATTACKS[fighter.attack].active;
                } else if (fighter.state === "active") {
                    fighter.state = "recover";
                    fighter.timer = ATTACKS[fighter.attack].recover;
                } else {
                    fighter.state = "idle";
                    fighter.attack = null;
                }
            }
        }

        if (!finished && (fighter.state === "idle" || fighter.state === "block")) {
            fighter.state = control.block ? "block" : "idle";
        }

        let move = 0;

        if (!finished && fighter.state === "idle") {
            move = (control.right ? 1 : 0) - (control.left ? 1 : 0);
        }

        const slow = fighter.state === "windup" || fighter.state === "active" ? 0.25 : 1;

        fighter.x += (move * MOVE_SPEED * slow + fighter.vx) * dt;
        fighter.vx *= Math.pow(0.0015, dt);

        if (move) {
            fighter.walk += dt * 10;
        }

        fighter.x = Math.max(50, Math.min(W - 50, fighter.x));

        // Бойцы не проходят друг сквозь друга.
        const gap = other.x - fighter.x;

        if (Math.abs(gap) < MIN_DISTANCE) {
            const push = (MIN_DISTANCE - Math.abs(gap)) / 2;
            const dir = Math.sign(gap) || (fighter.player === 1 ? 1 : -1);

            fighter.x -= dir * push;
            other.x += dir * push;

            fighter.x = Math.max(50, Math.min(W - 50, fighter.x));
            other.x = Math.max(50, Math.min(W - 50, other.x));
        }
    }

    function step() {
        const dt = 1 / 60;

        updateFighter(fighters[1], dt);
        updateFighter(fighters[2], dt);

        // После конца боя даём доиграть анимации и останавливаем цикл.
        if (finished) {
            finishedFor += dt;

            if (finishedFor > 1.5) {
                loop.stop();
                draw();
                return false;
            }

            return;
        }

        if (!finished) {
            timeLeft -= dt;

            if (timeLeft <= 0) {
                timeLeft = 0;

                const hp1 = fighters[1].hp;
                const hp2 = fighters[2].hp;

                finish(hp1 === hp2 ? 0 : hp1 > hp2 ? 1 : 2);
            }
        }
    }

    function punchExtension(fighter) {
        if (!fighter.attack) return 0;

        const attack = ATTACKS[fighter.attack];

        if (fighter.state === "windup") return -0.25 * (1 - fighter.timer / attack.windup);
        if (fighter.state === "active") return 1;
        if (fighter.state === "recover") return fighter.timer / attack.recover;

        return 0;
    }

    function drawFighter(fighter) {
        const color = COLORS[fighter.player];
        const dir = facing(fighter);
        const hit = fighter.state === "hit";
        const lean = hit ? -dir * 8 : 0;
        const bob = fighter.state === "idle" ? Math.sin(fighter.walk) * 2 : 0;

        ctx.save();
        ctx.translate(fighter.x, FLOOR);

        if (fighter.state === "ko") {
            ctx.rotate(-dir * fighter.fall * Math.PI / 2);
        }

        // Ноги
        ctx.strokeStyle = "#e9c39b";
        ctx.lineWidth = 9;
        ctx.lineCap = "round";

        const stride = Math.sin(fighter.walk) * 8;

        ctx.beginPath();
        ctx.moveTo(-8, -60);
        ctx.lineTo(-12 + stride, 0);
        ctx.moveTo(8, -60);
        ctx.lineTo(12 - stride, 0);
        ctx.stroke();

        // Трусы и торс
        ctx.fillStyle = color.dark;
        ctx.fillRect(-17 + lean * 0.3, -78, 34, 22);

        ctx.fillStyle = fighter.flash > 0 ? "#fff" : "#f0caa3";
        ctx.fillRect(-15 + lean * 0.5, -122 + bob, 30, 46);

        // Голова
        ctx.beginPath();
        ctx.arc(lean, -138 + bob, 15, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = color.main;
        ctx.fillRect(lean - 15, -150 + bob, 30, 6);

        // Перчатки
        const extend = punchExtension(fighter);
        const heavy = fighter.attack === "heavy";
        const blocking = fighter.state === "block";

        let frontX = dir * 22;
        let frontY = -112 + bob;
        let backX = dir * 6;
        let backY = -118 + bob;

        if (blocking) {
            frontX = dir * 16;
            frontY = -136 + bob;
            backX = dir * 10;
            backY = -128 + bob;
        } else if (extend) {
            const reach = heavy ? 56 : 46;

            frontX = dir * (22 + reach * Math.max(0, extend)) + dir * extend * (extend < 0 ? 30 : 0);
            frontY = heavy ? -116 - extend * 10 : -126;
        }

        ctx.strokeStyle = "#f0caa3";
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(dir * 6 + lean * 0.5, -114 + bob);
        ctx.lineTo(frontX + lean * 0.5, frontY);
        ctx.stroke();

        ctx.fillStyle = color.glove;

        ctx.beginPath();
        ctx.arc(backX + lean * 0.5, backY, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(frontX + lean * 0.5, frontY, heavy && extend > 0 ? 13 : 11, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    function drawHpBar(fighter, x, alignRight) {
        const width = 230;
        const color = COLORS[fighter.player];
        const ratio = fighter.hp / MAX_HP;
        const shown = fighter.shownHp / MAX_HP;

        ctx.fillStyle = "#2a2a2a";
        ctx.fillRect(x, 20, width, 16);

        ctx.fillStyle = "#e8d27a";
        const shownWidth = width * shown;
        ctx.fillRect(alignRight ? x + width - shownWidth : x, 20, shownWidth, 16);

        ctx.fillStyle = ratio > 0.3 ? color.main : "#ff6b6b";
        const hpWidth = width * ratio;
        ctx.fillRect(alignRight ? x + width - hpWidth : x, 20, hpWidth, 16);

        ctx.fillStyle = "#fff";
        ctx.font = "bold 13px Arial";
        ctx.textAlign = alignRight ? "right" : "left";
        ctx.fillText(
            `${GameBox.name(fighter.player)} · ${Math.ceil(fighter.hp)}`,
            alignRight ? x + width : x,
            54
        );
    }

    function draw() {
        ctx.fillStyle = "#111";
        ctx.fillRect(0, 0, W, H);

        // Ринг
        ctx.fillStyle = "#2a3d5c";
        ctx.fillRect(0, FLOOR, W, H - FLOOR);

        ctx.fillStyle = "#34507a";
        ctx.fillRect(0, FLOOR, W, 6);

        ctx.strokeStyle = "#8b2f2f";
        ctx.lineWidth = 3;

        [190, 215, 240].forEach(y => {
            ctx.beginPath();
            ctx.moveTo(12, y);
            ctx.lineTo(W - 12, y);
            ctx.stroke();
        });

        ctx.fillStyle = "#cfcfcf";
        ctx.fillRect(8, 180, 8, FLOOR - 180);
        ctx.fillRect(W - 16, 180, 8, FLOOR - 180);

        // Тени
        ctx.fillStyle = "rgba(0, 0, 0, .35)";

        [fighters[1], fighters[2]].forEach(fighter => {
            ctx.beginPath();
            ctx.ellipse(fighter.x, FLOOR + 4, 28, 6, 0, 0, Math.PI * 2);
            ctx.fill();
        });

        drawFighter(fighters[1]);
        drawFighter(fighters[2]);

        drawHpBar(fighters[1], 20, false);
        drawHpBar(fighters[2], W - 250, true);

        ctx.fillStyle = timeLeft < 10 ? "#ff8a80" : "#fff";
        ctx.font = "bold 26px Arial";
        ctx.textAlign = "center";
        ctx.fillText(Math.ceil(timeLeft), W / 2, 38);

        if (finished) {
            ctx.fillStyle = "rgba(0, 0, 0, .6)";
            ctx.fillRect(0, H / 2 - 70, W, 110);

            ctx.textAlign = "center";
            ctx.fillStyle = winner ? COLORS[winner].main : "#fff";
            ctx.font = "bold 34px Arial";
            ctx.fillText(
                winner ? `${GameBox.name(winner)} побеждает!` : "Ничья",
                W / 2,
                H / 2 - 20
            );

            ctx.fillStyle = "#ddd";
            ctx.font = "16px Arial";
            ctx.fillText("Нажми «Реванш» или R", W / 2, H / 2 + 14);
        }
    }

    const loop = GameBox.loop(step, draw);

    function keyDown(event) {
        if (event.code === "KeyR" && finished) {
            startMatch();
            return;
        }

        const binding = KEYS[event.code];

        if (!binding) return;

        event.preventDefault();

        const [player, action] = binding;

        if (action === "light" || action === "heavy") {
            if (!event.repeat) startAttack(player, action);
            return;
        }

        input[player][action] = true;
    }

    function keyUp(event) {
        const binding = KEYS[event.code];

        if (!binding) return;

        const [player, action] = binding;

        if (action in input[player]) {
            input[player][action] = false;
        }
    }

    function releaseAll() {
        input[1] = emptyInput();
        input[2] = emptyInput();
    }

    root.querySelectorAll(".box-pad").forEach(padElement => {
        const player = Number(padElement.dataset.player);

        padElement.querySelectorAll("[data-key]").forEach(button => {
            const action = button.dataset.key;

            if (action === "light" || action === "heavy") {
                GameBox.hold(button, () => startAttack(player, action));
                return;
            }

            GameBox.hold(
                button,
                () => {
                    input[player][action] = true;
                },
                () => {
                    input[player][action] = false;
                }
            );
        });
    });

    rematchButton.addEventListener("click", startMatch);

    document.addEventListener("keydown", keyDown);
    document.addEventListener("keyup", keyUp);
    window.addEventListener("blur", releaseAll);

    startMatch();

    return function cleanup() {
        loop.stop();
        releaseAll();

        document.removeEventListener("keydown", keyDown);
        document.removeEventListener("keyup", keyUp);
        window.removeEventListener("blur", releaseAll);
    };
};
