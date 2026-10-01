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
                    <span class="reaction-name-one">Игрок 1</span>
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
                    <span class="reaction-name-two">Игрок 2</span>
                    <strong class="reaction-score-two">0</strong>
                    <button class="reaction-button reaction-button-two">
                        ЖМИ
                    </button>
                </div>
            </div>

            <p class="game-status reaction-status">
                Нажмите «Старт». Клавиши: игрок 1 - A, игрок 2 - L. Фальстарт - очко сопернику.
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
    let waiting = false;
    let finished = false;
    let targetTime = null;
    let timeout = null;

    const playerOneBox = root.querySelector(".reaction-player-one");
    const playerTwoBox = root.querySelector(".reaction-player-two");

    root.querySelector(".reaction-name-one").textContent = GameBox.name(1);
    root.querySelector(".reaction-name-two").textContent = GameBox.name(2);

    function reset() {
        clearTimeout(timeout);

        scoreOne = 0;
        scoreTwo = 0;
        round = 1;
        active = false;
        waiting = false;
        finished = false;

        playerOneBox.classList.remove("winner");
        playerTwoBox.classList.remove("winner");

        scoreOneElement.textContent = "0";
        scoreTwoElement.textContent = "0";
        roundElement.textContent = "1";

        messageElement.textContent =
            "Готовы?";

        timerElement.textContent =
            "3";

        statusElement.textContent =
            "Нажмите «Старт». Клавиши: игрок 1 - A, игрок 2 - L. Фальстарт - очко сопернику.";

        buttonOne.disabled = true;
        buttonTwo.disabled = true;

        startButton.disabled = false;
    }

    function startRound() {
        if (finished) return;

        clearTimeout(timeout);

        active = false;
        waiting = false;
        targetTime = null;

        buttonOne.disabled = true;
        buttonTwo.disabled = true;
        startButton.disabled = true;

        messageElement.textContent =
            "Приготовьтесь";

        statusElement.textContent = `Раунд ${round}. До 5 побед.`;

        let count = 3;

        timerElement.textContent = count;
        GameBox.sound("tick");

        const countdown = () => {
            count--;

            if (count > 0) {
                timerElement.textContent = count;
                GameBox.sound("tick");

                timeout = setTimeout(
                    countdown,
                    700
                );

                return;
            }

            // Ждём случайное время. Кнопки уже активны - за фальстарт штраф.
            timerElement.textContent = "…";

            messageElement.textContent =
                "Ждите...";

            waiting = true;
            buttonOne.disabled = false;
            buttonTwo.disabled = false;

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
        waiting = false;
        active = true;
        targetTime = performance.now();

        timerElement.textContent = "!";
        messageElement.textContent = "ЖМИ!";

        GameBox.sound("go");

        statusElement.textContent =
            "Кто быстрее нажмёт?";
    }

    function addPoint(player) {
        if (player === 1) {
            scoreOne++;
            scoreOneElement.textContent = scoreOne;
        } else {
            scoreTwo++;
            scoreTwoElement.textContent = scoreTwo;
        }
    }

    function press(player) {
        if (finished) return;

        if (waiting) {
            // Фальстарт: очко получает соперник.
            clearTimeout(timeout);
            waiting = false;

            buttonOne.disabled = true;
            buttonTwo.disabled = true;

            const other = player === 1 ? 2 : 1;

            addPoint(other);

            statusElement.textContent =
                `Фальстарт! ${GameBox.name(player)} нажал раньше. Очко - ${GameBox.name(other)}.`;

            messageElement.textContent = "Рано!";
            timerElement.textContent = "✕";

            GameBox.sound("error");
            GameBox.vibrate(80);

            nextRound();
            return;
        }

        if (!active) {
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

        addPoint(player);

        statusElement.textContent =
            `${GameBox.name(player)}: ${reaction} мс`;

        GameBox.sound("score");

        nextRound();
    }

    function nextRound() {
        if (
            scoreOne >= 5 ||
            scoreTwo >= 5
        ) {
            const winnerNumber = scoreOne > scoreTwo ? 1 : 2;
            const winner = GameBox.name(winnerNumber);

            finished = true;

            messageElement.textContent =
                `${winner} победил!`;

            (winnerNumber === 1 ? playerOneBox : playerTwoBox)
                .classList.add("winner");

            startButton.disabled = true;

            GameBox.sound("win");
            GameBox.vibrate(150);
            GameBox.win(winner);

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

    // pointerdown вместо click: оба игрока могут жать одновременно (мультитач)
    // и нет задержки нажатия на телефоне.
    [[buttonOne, 1], [buttonTwo, 2]].forEach(([button, player]) => {
        button.addEventListener("pointerdown", event => {
            event.preventDefault();
            press(player);
        });

        button.addEventListener("contextmenu", event => event.preventDefault());
    });

    function keydown(event) {
        if (event.repeat) return;

        if (event.code === "KeyA") press(1);
        if (event.code === "KeyL") press(2);
    }

    document.addEventListener("keydown", keydown);

    reset();

    return function cleanup() {
        clearTimeout(timeout);
        document.removeEventListener("keydown", keydown);

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