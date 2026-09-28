window.createReactionBattle = function(root) {
    root.innerHTML = `
        <div class="game-box reaction-game">
            <div class="game-toolbar">
                <strong>
                    Раунд:
                    <span class="reaction-round">1</span>
                </strong>

                <button class="game-button reaction-restart">
                    Заново
                </button>
            </div>

            <div class="reaction-arena">
                <div class="reaction-player reaction-player-one">
                    <span>Игрок 1</span>
                    <strong class="reaction-score-one">0</strong>
                    <button class="reaction-button reaction-button-one">
                        ЖМИ
                    </button>
                </div>

                <div class="reaction-center">
                    <strong class="reaction-message">
                        Готовы?
                    </strong>

                    <span class="reaction-timer">
                        3
                    </span>
                </div>

                <div class="reaction-player reaction-player-two">
                    <span>Игрок 2</span>
                    <strong class="reaction-score-two">0</strong>
                    <button class="reaction-button reaction-button-two">
                        ЖМИ
                    </button>
                </div>
            </div>

            <p class="game-status reaction-status">
                Нажмите «Старт», когда будете готовы.
            </p>

            <button class="game-button reaction-start">
                Старт
            </button>
        </div>
    `;

    const roundElement =
        root.querySelector(".reaction-round");

    const scoreOneElement =
        root.querySelector(".reaction-score-one");

    const scoreTwoElement =
        root.querySelector(".reaction-score-two");

    const messageElement =
        root.querySelector(".reaction-message");

    const timerElement =
        root.querySelector(".reaction-timer");

    const statusElement =
        root.querySelector(".reaction-status");

    const startButton =
        root.querySelector(".reaction-start");

    const restartButton =
        root.querySelector(".reaction-restart");

    const buttonOne =
        root.querySelector(".reaction-button-one");

    const buttonTwo =
        root.querySelector(".reaction-button-two");

    let scoreOne = 0;
    let scoreTwo = 0;
    let round = 1;

    let active = false;
    let targetTime = null;
    let timeout = null;

    function reset() {
        clearTimeout(timeout);

        scoreOne = 0;
        scoreTwo = 0;
        round = 1;
        active = false;

        scoreOneElement.textContent = "0";
        scoreTwoElement.textContent = "0";
        roundElement.textContent = "1";

        messageElement.textContent =
            "Готовы?";

        timerElement.textContent =
            "3";

        statusElement.textContent =
            "Нажмите «Старт», когда будете готовы.";

        buttonOne.disabled = true;
        buttonTwo.disabled = true;

        startButton.disabled = false;
    }

    function startRound() {
        clearTimeout(timeout);

        active = false;
        targetTime = null;

        buttonOne.disabled = true;
        buttonTwo.disabled = true;

        messageElement.textContent =
            "Приготовьтесь";

        let count = 3;

        timerElement.textContent = count;

        const countdown = () => {
            count--;

            if (count > 0) {
                timerElement.textContent = count;

                timeout = setTimeout(
                    countdown,
                    700
                );

                return;
            }

            timerElement.textContent = "!";

            messageElement.textContent =
                "ЖМИ!";

            const delay =
                600 +
                Math.random() * 2200;

            timeout = setTimeout(
                activate,
                delay
            );
        };

        timeout = setTimeout(
            countdown,
            700
        );
    }

    function activate() {
        active = true;
        targetTime = performance.now();

        buttonOne.disabled = false;
        buttonTwo.disabled = false;

        statusElement.textContent =
            "Кто быстрее нажмёт?";
    }

    function press(player) {
        if (!active) {
            statusElement.textContent =
                "Слишком рано!";

            return;
        }

        active = false;

        const reaction =
            Math.round(
                performance.now() -
                targetTime
            );

        buttonOne.disabled = true;
        buttonTwo.disabled = true;

        if (player === 1) {
            scoreOne++;
            scoreOneElement.textContent =
                scoreOne;

            statusElement.textContent =
                `Игрок 1: ${reaction} мс`;
        } else {
            scoreTwo++;
            scoreTwoElement.textContent =
                scoreTwo;

            statusElement.textContent =
                `Игрок 2: ${reaction} мс`;
        }

        if (
            scoreOne >= 5 ||
            scoreTwo >= 5
        ) {
            const winner =
                scoreOne > scoreTwo
                    ? "Игрок 1"
                    : "Игрок 2";

            messageElement.textContent =
                `${winner} победил!`;

            startButton.disabled = true;

            return;
        }

        round++;

        roundElement.textContent =
            round;

        messageElement.textContent =
            "Раунд окончен";

        timeout = setTimeout(
            startRound,
            1200
        );
    }

    startButton.addEventListener(
        "click",
        startRound
    );

    restartButton.addEventListener(
        "click",
        reset
    );

    buttonOne.addEventListener(
        "click",
        () => press(1)
    );

    buttonTwo.addEventListener(
        "click",
        () => press(2)
    );

    reset();

    return function cleanup() {
        clearTimeout(timeout);

        startButton.removeEventListener(
            "click",
            startRound
        );

        restartButton.removeEventListener(
            "click",
            reset
        );
    };
};