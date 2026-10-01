window.createReaction = function(root) {
    root.innerHTML = `
        <div class="game-box">
            <div class="game-toolbar">
                <strong>
                    Результат:
                    <span class="reaction-score">-</span>
                </strong>

                <button class="game-button reaction-restart">
                    Начать
                </button>
            </div>

            <div class="reaction-area">
                <button class="reaction-target">
                    НАЖМИ
                </button>
            </div>

            <p class="game-status reaction-status">
                Нажми на круг или «Начать» и жди зелёного сигнала. Можно пробелом.
            </p>
        </div>
    `;

    const area =
        root.querySelector(".reaction-area");

    const target =
        root.querySelector(".reaction-target");

    const score =
        root.querySelector(".reaction-score");

    const status =
        root.querySelector(".reaction-status");

    const restart =
        root.querySelector(".reaction-restart");

    let timer;
    let startTime;
    let waiting = false;
    let results = [];

    function start() {
        clearTimeout(timer);

        waiting = true;
        startTime = 0;

        target.classList.remove("ready", "early");

        target.textContent = "ЖДИ...";

        status.textContent =
            "Не нажимай раньше времени.";

        timer = setTimeout(() => {
            waiting = false;
            startTime = performance.now();

            target.classList.add("ready");
            target.textContent = "ЖМИ!";

            GameBox.sound("go");

            status.textContent =
                "Нажимай как можно быстрее.";
        }, 1200 + Math.random() * 2500);
    }

    // pointerdown срабатывает сразу при касании - без задержки click на телефонах.
    function clickTarget(event) {
        if (event) event.preventDefault();

        if (waiting) {
            clearTimeout(timer);

            waiting = false;

            target.classList.remove("ready");
            target.classList.add("early");
            target.textContent = "РАНО!";

            status.textContent =
                "Ты нажал слишком рано. Нажми на круг, чтобы попробовать ещё раз.";

            GameBox.sound("error");
            GameBox.vibrate(80);

            return;
        }

        if (!startTime) {
            start();
            return;
        }

        const result =
            Math.round(
                performance.now() - startTime
            );

        results.push(result);

        const average = Math.round(
            results.reduce((sum, value) => sum + value, 0) / results.length
        );

        score.textContent = `${result} мс`;

        target.classList.remove("ready");
        target.textContent = `${result} мс`;

        status.textContent =
            `Среднее за ${results.length}: ${average} мс. Нажми на круг, чтобы попробовать ещё раз.`;

        GameBox.sound("score");
        GameBox.submit(result);

        startTime = 0;
    }

    function keydown(event) {
        if (event.code === "Space" || event.code === "Enter") {
            event.preventDefault();

            if (!event.repeat) clickTarget();
        }
    }

    target.addEventListener(
        "pointerdown",
        clickTarget
    );

    target.addEventListener("contextmenu", event => event.preventDefault());

    document.addEventListener("keydown", keydown);

    restart.addEventListener(
        "click",
        start
    );

    return function() {
        clearTimeout(timer);
        document.removeEventListener("keydown", keydown);
    };
};