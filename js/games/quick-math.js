window.createQuickMath = function(root) {
    root.innerHTML = `
        <div class="game-box quick-math-game">
            <div class="game-toolbar">
                <strong>
                    Счёт:
                    <span class="math-score">0</span>
                </strong>

                <strong>
                    Время:
                    <span class="math-time">30</span>
                </strong>

                <button class="game-button math-restart">
                    Заново
                </button>
            </div>

            <div class="quick-math-question">
                <span class="math-number-one">7</span>
                <span class="math-operation">×</span>
                <span class="math-number-two">8</span>
                <span>= ?</span>
            </div>

            <div class="math-answers">
                <button class="math-answer"></button>
                <button class="math-answer"></button>
                <button class="math-answer"></button>
                <button class="math-answer"></button>
            </div>

            <p class="game-status math-status">
                Нажми на правильный ответ (или клавиши 1-4). Ошибка - минус 2 секунды.
            </p>
        </div>
    `;

    const scoreElement =
        root.querySelector(".math-score");

    const timeElement =
        root.querySelector(".math-time");

    const numberOneElement =
        root.querySelector(".math-number-one");

    const operationElement =
        root.querySelector(".math-operation");

    const numberTwoElement =
        root.querySelector(".math-number-two");

    const statusElement =
        root.querySelector(".math-status");

    const answerButtons =
        [...root.querySelectorAll(".math-answer")];

    const restartButton =
        root.querySelector(".math-restart");

    let score = 0;
    let time = 30;
    let answer;
    let timer;
    let running = false;

    function reset() {
        clearInterval(timer);

        score = 0;
        time = 30;
        running = true;

        scoreElement.textContent = "0";
        timeElement.textContent = "30";

        statusElement.textContent =
            "Нажми на правильный ответ (или клавиши 1-4). Ошибка - минус 2 секунды.";

        answerButtons.forEach(
            button => {
                button.disabled = false;
                button.classList.remove("correct", "wrong");
            }
        );

        generateQuestion();

        timer = setInterval(() => {
            time--;

            timeElement.textContent =
                Math.max(0, time);

            if (time <= 5 && time > 0) {
                GameBox.sound("tick");
            }

            if (time <= 0) {
                endGame();
            }
        }, 1000);
    }

    function generateQuestion() {
        const operations = [
            "+",
            "-",
            "×"
        ];

        const operation =
            operations[
                Math.floor(
                    Math.random() *
                    operations.length
                )
            ];

        let a;
        let b;

        if (operation === "×") {
            a =
                Math.floor(
                    Math.random() * 13
                ) + 2;

            b =
                Math.floor(
                    Math.random() * 13
                ) + 2;

            answer = a * b;
        }

        if (operation === "+") {
            a =
                Math.floor(
                    Math.random() * 80
                ) + 10;

            b =
                Math.floor(
                    Math.random() * 80
                ) + 10;

            answer = a + b;
        }

        if (operation === "-") {
            a =
                Math.floor(
                    Math.random() * 80
                ) + 20;

            b =
                Math.floor(
                    Math.random() * a
                );

            answer = a - b;
        }

        numberOneElement.textContent = a;
        numberTwoElement.textContent = b;
        operationElement.textContent = operation;

        const answers = new Set();

        answers.add(answer);

        while (answers.size < 4) {
            const offset =
                Math.floor(
                    Math.random() * 21
                ) - 10;

            if (offset !== 0 && answer + offset >= 0) {
                answers.add(
                    answer + offset
                );
            }
        }

        const shuffled = [...answers];

        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        answerButtons.forEach(
            (button, index) => {
                button.textContent =
                    shuffled[index];

                button.dataset.answer =
                    shuffled[index];
            }
        );
    }

    let flashTimer = null;

    function flash(button, className) {
        clearTimeout(flashTimer);

        answerButtons.forEach(item => item.classList.remove("correct", "wrong"));
        button.classList.add(className);

        flashTimer = setTimeout(() => {
            button.classList.remove(className);
        }, 250);
    }

    function choose(button) {
        if (!running || !button) return;

        const selected =
            Number(
                button.dataset.answer
            );

        if (selected === answer) {
            score++;

            scoreElement.textContent =
                score;

            statusElement.textContent =
                "Правильно!";

            GameBox.sound("score");
            flash(button, "correct");

            generateQuestion();
        } else {
            time = Math.max(0, time - 2);
            timeElement.textContent = time;

            statusElement.textContent =
                `Неверно. Правильный ответ: ${answer}`;

            GameBox.sound("error");
            GameBox.vibrate(60);
            flash(button, "wrong");

            if (time <= 0) {
                endGame();
                return;
            }

            generateQuestion();
        }
    }

    function selectAnswer(event) {
        choose(event.currentTarget);
    }

    function keydown(event) {
        if (/^[1-4]$/.test(event.key)) {
            choose(answerButtons[Number(event.key) - 1]);
        }

        if (!running && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            reset();
        }
    }

    function endGame() {
        running = false;

        clearInterval(timer);

        time = 0;
        timeElement.textContent = "0";

        statusElement.textContent =
            `Время вышло! Результат: ${score}. Enter - ещё раз.`;

        answerButtons.forEach(
            button => {
                button.disabled = true;
            }
        );

        GameBox.sound(score > 0 ? "win" : "lose");
        GameBox.submit(score);
    }

    // pointerdown - мгновенная реакция на телефоне (без задержки click).
    answerButtons.forEach(
        button => {
            button.addEventListener(
                "pointerdown",
                event => {
                    event.preventDefault();
                    selectAnswer(event);
                }
            );

            button.addEventListener(
                "click",
                event => {
                    // Клавиатура (Enter/пробел на кнопке) даёт click без pointerdown.
                    if (event.detail === 0) selectAnswer(event);
                }
            );
        }
    );

    document.addEventListener("keydown", keydown);

    restartButton.addEventListener(
        "click",
        reset
    );

    reset();

    return function cleanup() {
        clearInterval(timer);
        clearTimeout(flashTimer);
        document.removeEventListener("keydown", keydown);

        restartButton.removeEventListener(
            "click",
            reset
        );

        answerButtons.forEach(
            button => {
                button.removeEventListener(
                    "click",
                    selectAnswer
                );
            }
        );
    };
};