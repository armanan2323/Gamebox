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
                Нажми «Начать» и жди сигнала.
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
    let waiting;

    function start() {
        clearTimeout(timer);

        waiting = true;
        startTime = 0;

        score.textContent = "-";

        target.classList.remove("ready");

        target.textContent = "ЖДИ...";

        status.textContent =
            "Не нажимай раньше времени.";

        timer = setTimeout(() => {
            waiting = false;
            startTime = performance.now();

            target.classList.add("ready");
            target.textContent = "ЖМИ!";

            status.textContent =
                "Нажимай как можно быстрее.";
        }, 1200 + Math.random() * 2500);
    }

    function clickTarget() {
        if (waiting) {
            clearTimeout(timer);

            waiting = false;

            target.classList.remove("ready");
            target.textContent = "РАНО!";

            status.textContent =
                "Ты нажал слишком рано. Попробуй ещё раз.";

            return;
        }

        if (!startTime) return;

        const result =
            Math.round(
                performance.now() - startTime
            );

        score.textContent = `${result} мс`;

        target.classList.remove("ready");
        target.textContent = `${result} мс`;

        status.textContent =
            "Нажми «Начать», чтобы попробовать ещё раз.";

        startTime = 0;
    }

    target.addEventListener(
        "click",
        clickTarget
    );

    restart.addEventListener(
        "click",
        start
    );

    return function() {
        clearTimeout(timer);
    };
};