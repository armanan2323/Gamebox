window.createAimTrainer = function(root) {
    root.innerHTML = `
        <div class="game-box aim-game">
            <div class="mode-switch aim-modes">
                <button class="mode-button active" data-mode="classic">Classic</button>
                <button class="mode-button" data-mode="time">Time Attack</button>
                <button class="mode-button" data-mode="precision">Precision</button>
                <button class="mode-button" data-mode="reaction">Reaction</button>
            </div>

            <div class="aim-hud">
                <div><span>Счёт</span><strong class="aim-score">0</strong></div>
                <div><span>Попадания</span><strong class="aim-hits">0</strong></div>
                <div><span>Промахи</span><strong class="aim-misses">0</strong></div>
                <div><span>Точность</span><strong class="aim-accuracy">-</strong></div>
                <div><span>Реакция</span><strong class="aim-reaction">-</strong></div>
                <div><span class="aim-progress-label">Цели</span><strong class="aim-progress">30</strong></div>
            </div>

            <canvas class="game-canvas aim-canvas" width="640" height="520"></canvas>

            <div class="aim-footer">
                <p class="game-status aim-status">Нажми на поле, чтобы начать.</p>
                <button class="game-button aim-start">Старт</button>
            </div>

            <p class="game-status aim-best"></p>
        </div>
    `;

    const canvas = root.querySelector(".aim-canvas");
    const ctx = canvas.getContext("2d");
    const modeButtons = root.querySelectorAll(".aim-modes .mode-button");
    const startButton = root.querySelector(".aim-start");
    const status = root.querySelector(".aim-status");
    const bestElement = root.querySelector(".aim-best");

    const hud = {
        score: root.querySelector(".aim-score"),
        hits: root.querySelector(".aim-hits"),
        misses: root.querySelector(".aim-misses"),
        accuracy: root.querySelector(".aim-accuracy"),
        reaction: root.querySelector(".aim-reaction"),
        progress: root.querySelector(".aim-progress"),
        progressLabel: root.querySelector(".aim-progress-label")
    };

    const W = canvas.width;
    const H = canvas.height;
    const STORAGE_KEY = "gamebox:aim:best";

    const MODES = {
        classic: {
            title: "Classic",
            hint: "30 целей подряд - как можно быстрее.",
            targets: 30
        },
        time: {
            title: "Time Attack",
            hint: "30 секунд. Мишени исчезают сами - успей нажать.",
            duration: 30
        },
        precision: {
            title: "Precision",
            hint: "Маленькие мишени. 5 промахов - и конец.",
            lives: 5,
            targets: 40
        },
        reaction: {
            title: "Reaction",
            hint: "Жди появления мишени и жми сразу. 10 попыток.",
            rounds: 10
        }
    };

    let mode = "classic";
    let state = "idle";
    let clock = 0;
    let score;
    let hits;
    let misses;
    let combo;
    let bestCombo;
    let reactions;
    let targets;
    let effects;
    let spawned;
    let waitUntil;
    let finishInfo = "";
    let lastTarget = null;

    function loadBest() {
        try {
            const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
            return value && typeof value === "object" ? value : {};
        } catch (error) {
            return {};
        }
    }

    function saveBest(best) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(best));
        } catch (error) {}
    }

    function renderBest() {
        const best = loadBest();
        const parts = [];

        parts.push(`Рекорд ${MODES[mode].title}: ${best.scores && best.scores[mode] ? best.scores[mode] : "-"}`);
        parts.push(`Лучшая точность: ${best.accuracy ? best.accuracy + "%" : "-"}`);
        parts.push(`Лучшая реакция: ${best.reaction ? best.reaction + " мс" : "-"}`);

        bestElement.textContent = parts.join(" · ");
    }

    function accuracy() {
        const total = hits + misses;
        return total ? Math.round(hits / total * 100) : 0;
    }

    function averageReaction() {
        if (!reactions.length) return 0;
        return Math.round(reactions.reduce((sum, value) => sum + value, 0) / reactions.length);
    }

    function updateHud() {
        hud.score.textContent = score;
        hud.hits.textContent = hits;
        hud.misses.textContent = misses;
        hud.accuracy.textContent = hits + misses ? `${accuracy()}%` : "-";
        hud.reaction.textContent = reactions.length ? `${averageReaction()} мс` : "-";

        const config = MODES[mode];

        if (mode === "classic") {
            hud.progressLabel.textContent = "Цели";
            hud.progress.textContent = Math.max(0, config.targets - hits);
        } else if (mode === "time") {
            hud.progressLabel.textContent = "Время";
            hud.progress.textContent = Math.max(0, Math.ceil(config.duration - clock));
        } else if (mode === "precision") {
            hud.progressLabel.textContent = "Жизни";
            hud.progress.textContent = Math.max(0, config.lives - misses);
        } else {
            hud.progressLabel.textContent = "Попытки";
            hud.progress.textContent = Math.max(0, config.rounds - spawned + (targets.length ? 1 : 0));
        }
    }

    function resetStats() {
        clock = 0;
        score = 0;
        hits = 0;
        misses = 0;
        combo = 0;
        bestCombo = 0;
        reactions = [];
        targets = [];
        effects = [];
        spawned = 0;
        waitUntil = 0;
    }

    function setMode(newMode) {
        if (state === "running") finish(true);

        mode = newMode;

        modeButtons.forEach(button => {
            button.classList.toggle("active", button.dataset.mode === mode);
        });

        state = "idle";
        resetStats();
        updateHud();
        renderBest();

        status.textContent = `${MODES[mode].hint} Нажми на поле или «Старт».`;
        startButton.textContent = "Старт";

        draw();
    }

    function start() {
        resetStats();
        state = "running";
        startButton.textContent = "Заново";
        status.textContent = MODES[mode].hint;

        if (mode === "reaction") {
            scheduleReaction();
        } else {
            spawnTarget();
        }

        updateHud();
        loop.start();
    }

    // Сложность растёт с каждым попаданием: мишени меньше и живут меньше.
    function difficulty() {
        if (mode === "classic") return hits / MODES.classic.targets;
        if (mode === "time") return Math.min(1, hits / 35);
        if (mode === "precision") return Math.min(1, hits / MODES.precision.targets);
        return 0;
    }

    function targetRadius() {
        const level = difficulty();

        if (mode === "precision") return Math.round(20 - level * 9 + Math.random() * 3);
        if (mode === "reaction") return 42;

        const base = 38 - level * 18;
        return Math.round(base * (0.8 + Math.random() * 0.4));
    }

    function spawnTarget() {
        const radius = targetRadius();
        const margin = radius + 8;
        const previous = lastTarget || { x: W / 2, y: H / 2 };

        let x;
        let y;
        let attempts = 0;

        // Новая мишень не появляется прямо на месте прошлой.
        do {
            x = margin + Math.random() * (W - margin * 2);
            y = margin + Math.random() * (H - margin * 2);
            attempts++;
        } while (Math.hypot(x - previous.x, y - previous.y) < 120 && attempts < 20);

        const life = mode === "time" ? Math.max(0.75, 1.7 - difficulty() * 0.9) : 0;

        targets = [{ x, y, radius, born: clock, bornAt: performance.now(), life }];
        spawned++;
    }

    function scheduleReaction() {
        targets = [];
        waitUntil = clock + 0.8 + Math.random() * 1.9;
    }

    function addEffect(x, y, color, text) {
        effects.push({ x, y, color, text, born: clock });
    }

    function hit(target) {
        // Реакция считается по реальному времени нажатия, а не по шагам цикла.
        const reaction = Math.round(performance.now() - target.bornAt);

        hits++;
        combo++;
        bestCombo = Math.max(bestCombo, combo);
        reactions.push(reaction);

        const speedBonus = Math.max(0, 700 - reaction) / 7;
        const sizeBonus = Math.max(0, 40 - target.radius) * 2;
        const multiplier = 1 + Math.min(combo, 20) * 0.05;
        const points = Math.round((100 + speedBonus + sizeBonus) * multiplier);

        score += points;

        addEffect(target.x, target.y, "#7ee08f", `+${points}`);

        GameBox.sound(combo > 1 && combo % 5 === 0 ? "eat" : "score");

        lastTarget = target;
        targets = [];

        if (mode === "classic" && hits >= MODES.classic.targets) {
            finish();
        } else if (mode === "precision" && hits >= MODES.precision.targets) {
            finish();
        } else if (mode === "reaction") {
            if (spawned >= MODES.reaction.rounds) {
                finish();
            } else {
                status.textContent = `${reaction} мс`;
                scheduleReaction();
            }
        } else {
            spawnTarget();
        }
    }

    function miss(x, y, text) {
        misses++;
        combo = 0;

        addEffect(x, y, "#ff8a80", text || "мимо");

        GameBox.sound("error");
        GameBox.vibrate(30);

        if (mode === "precision" && misses >= MODES.precision.lives) {
            finish();
        }
    }

    function finish(silent) {
        if (state !== "running") return;

        state = "finished";
        targets = [];
        loop.stop();

        startButton.textContent = "Ещё раз";

        const acc = accuracy();
        const avg = averageReaction();

        // В Classic быстрее - лучше, поэтому за оставшееся время дают бонус.
        if (mode === "classic" && hits >= MODES.classic.targets) {
            score += Math.max(0, Math.round((60 - clock) * 50));
        }

        updateHud();

        finishInfo =
            `Счёт ${score} · Точность ${hits + misses ? acc + "%" : "-"} · ` +
            `Реакция ${avg ? avg + " мс" : "-"} · Комбо ${bestCombo}`;

        if (silent) {
            draw();
            return;
        }

        const best = loadBest();
        const records = [];

        best.scores = best.scores || {};

        if (score > (best.scores[mode] || 0)) {
            best.scores[mode] = score;
            records.push("счёт");
        }

        if (hits >= 10 && acc > (best.accuracy || 0)) {
            best.accuracy = acc;
            records.push("точность");
        }

        if (reactions.length >= 5 && avg && (!best.reaction || avg < best.reaction)) {
            best.reaction = avg;
            records.push("реакция");
        }

        saveBest(best);
        renderBest();

        status.textContent = records.length
            ? `Готово! Новый рекорд: ${records.join(", ")}.`
            : "Готово! Нажми на поле, чтобы сыграть ещё.";

        GameBox.sound(records.length ? "win" : "score");
        GameBox.submit(score);

        draw();
    }

    function step() {
        const dt = 1 / 60;

        clock += dt;

        if (mode === "time") {
            if (clock >= MODES.time.duration) {
                finish();
                return false;
            }

            const target = targets[0];

            if (target && clock - target.born > target.life) {
                miss(target.x, target.y, "не успел");
                spawnTarget();
            }
        }

        if (mode === "reaction" && !targets.length && waitUntil && clock >= waitUntil) {
            waitUntil = 0;

            const radius = targetRadius();

            targets = [{
                x: radius + 20 + Math.random() * (W - radius * 2 - 40),
                y: radius + 20 + Math.random() * (H - radius * 2 - 40),
                radius,
                born: clock,
                bornAt: performance.now(),
                life: 0
            }];

            spawned++;
            GameBox.sound("go");
        }

        effects = effects.filter(effect => clock - effect.born < 0.6);

        updateHud();
    }

    function drawTarget(target) {
        const age = clock - target.born;
        const pop = Math.min(1, age / 0.08);
        let radius = target.radius * (0.6 + pop * 0.4);

        if (target.life) {
            radius *= 1 - Math.max(0, (age / target.life) - 0.6) * 0.6;
        }

        const rings = ["#e54848", "#fff", "#e54848", "#fff"];

        rings.forEach((color, index) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(target.x, target.y, radius * (1 - index * 0.24), 0, Math.PI * 2);
            ctx.fill();
        });

        if (target.life) {
            const left = Math.max(0, 1 - age / target.life);

            ctx.strokeStyle = "rgba(255, 255, 255, .7)";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(target.x, target.y, radius + 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * left);
            ctx.stroke();
        }
    }

    function draw() {
        ctx.fillStyle = "#121512";
        ctx.fillRect(0, 0, W, H);

        ctx.strokeStyle = "#1c211c";
        ctx.lineWidth = 1;
        ctx.beginPath();

        for (let x = 40; x < W; x += 40) {
            ctx.moveTo(x + 0.5, 0);
            ctx.lineTo(x + 0.5, H);
        }

        for (let y = 40; y < H; y += 40) {
            ctx.moveTo(0, y + 0.5);
            ctx.lineTo(W, y + 0.5);
        }

        ctx.stroke();

        targets.forEach(drawTarget);

        effects.forEach(effect => {
            const age = (clock - effect.born) / 0.6;

            ctx.globalAlpha = 1 - age;
            ctx.strokeStyle = effect.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, 10 + age * 30, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = effect.color;
            ctx.font = "bold 16px Arial";
            ctx.textAlign = "center";
            ctx.fillText(effect.text, effect.x, effect.y - 20 - age * 20);
        });

        ctx.globalAlpha = 1;

        if (state === "running" && combo >= 3) {
            ctx.fillStyle = "#ffd54f";
            ctx.font = "bold 18px Arial";
            ctx.textAlign = "left";
            ctx.fillText(`Комбо x${combo}`, 14, 28);
        }

        if (state === "running" && mode === "reaction" && !targets.length) {
            ctx.fillStyle = "#9aa39a";
            ctx.font = "bold 26px Arial";
            ctx.textAlign = "center";
            ctx.fillText("Жди...", W / 2, H / 2);
        }

        if (state !== "running") {
            ctx.fillStyle = "rgba(0, 0, 0, .55)";
            ctx.fillRect(0, 0, W, H);

            ctx.fillStyle = "#fff";
            ctx.textAlign = "center";
            ctx.font = "bold 30px Arial";
            ctx.fillText(
                state === "finished" ? "Результат" : MODES[mode].title,
                W / 2,
                H / 2 - 30
            );

            ctx.font = "16px Arial";
            ctx.fillStyle = "#ddd";
            ctx.fillText(
                state === "finished" ? finishInfo : MODES[mode].hint,
                W / 2,
                H / 2 + 6
            );

            ctx.fillStyle = "#9aa39a";
            ctx.fillText("Нажми, чтобы начать", W / 2, H / 2 + 38);
        }
    }

    const loop = GameBox.loop(step, draw);

    function pointerDown(event) {
        event.preventDefault();

        if (state !== "running") {
            start();
            return;
        }

        const point = GameBox.point(canvas, event);

        // На сенсорном экране палец толще курсора - даём запас
        // в экранных пикселях, независимо от масштаба поля.
        const scale = canvas.width / canvas.getBoundingClientRect().width;
        const tolerance = (event.pointerType === "touch" ? 12 : 2) * scale;

        const target = targets.find(item =>
            Math.hypot(item.x - point.x, item.y - point.y) <= item.radius + tolerance
        );

        if (target) {
            hit(target);
        } else if (mode === "reaction" && !targets.length) {
            miss(point.x, point.y, "рано");
            status.textContent = "Рано! Дождись мишени.";
            scheduleReaction();
        } else {
            miss(point.x, point.y);
        }

        updateHud();
        draw();
    }

    canvas.addEventListener("pointerdown", pointerDown);
    canvas.addEventListener("contextmenu", event => event.preventDefault());

    startButton.addEventListener("click", () => {
        if (state === "running") finish(true);
        start();
    });

    modeButtons.forEach(button => {
        button.addEventListener("click", () => setMode(button.dataset.mode));
    });

    function keyDown(event) {
        if ((event.code === "Space" || event.code === "Enter") && state !== "running") {
            event.preventDefault();
            start();
        }
    }

    document.addEventListener("keydown", keyDown);

    setMode("classic");

    return function cleanup() {
        loop.stop();
        document.removeEventListener("keydown", keyDown);
    };
};
