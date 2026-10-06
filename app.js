(() => {
    const elements = {
        input: document.querySelector('#json-input'),
        shuffle: document.querySelector('#shuffle-input'),
        auto: document.querySelector('#auto-input'),
        autoSpeed: document.querySelector('#auto-speed'),
        speedField: document.querySelector('#speed-field'),
        speech: document.querySelector('#speech-input'),
        voice: document.querySelector('#voice-select'),
        volume: document.querySelector('#speech-volume'),
        trainerAuto: document.querySelector('#trainer-auto-input'),
        trainerSpeech: document.querySelector('#trainer-speech-input'),
        trainerVoice: document.querySelector('#trainer-voice-select'),
        trainerSpeed: document.querySelector('#trainer-auto-speed'),
        start: document.querySelector('#start-button'),
        reset: document.querySelector('#reset-button'),
        exitTraining: document.querySelector('#exit-training-button'),
        pauseTraining: document.querySelector('#pause-training-button'),
        setup: document.querySelector('#setup-panel'),
        trainer: document.querySelector('#trainer'),
        error: document.querySelector('#error-message'),
        current: document.querySelector('#progress-current'),
        total: document.querySelector('#progress-total'),
        topProgress: document.querySelector('#top-progress'),
        number: document.querySelector('#sentence-number'),
        english: document.querySelector('#sentence-title'),
        translation: document.querySelector('#translation'),
        instruction: document.querySelector('#instruction'),
        next: document.querySelector('#next-button'),
        nextLabel: document.querySelector('#next-label'),
        previous: document.querySelector('#previous-button'),
        progress: document.querySelector('#sentence-progress'),
        progressFill: document.querySelector('#sentence-progress-fill'),
        promptTopics: document.querySelector('#prompt-topics'),
        promptThemes: document.querySelector('#prompt-themes'),
        promptTypes: document.querySelector('#prompt-types'),
        promptLevel: document.querySelector('#prompt-level'),
        promptCount: document.querySelector('#prompt-count'),
        promptRepeat: document.querySelector('#prompt-repeat'),
        generatePrompt: document.querySelector('#generate-prompt-button'),
        promptStatus: document.querySelector('#prompt-status'),
        toast: document.querySelector('#toast'),
        toastMessage: document.querySelector('#toast-message'),
        practiceNav: document.querySelector('#practice-nav'),
        knowledgeNav: document.querySelector('#knowledge-nav'),
        practicePage: document.querySelector('#practice-page'),
        knowledgePage: document.querySelector('#knowledge-page'),
        promptPanel: document.querySelector('#prompt-panel'),
        resumeModal: document.querySelector('#resume-modal'),
        resumeSession: document.querySelector('#resume-session-button'),
        exitSession: document.querySelector('#exit-session-button'),
        completeModal: document.querySelector('#complete-modal'),
        completeRestart: document.querySelector('#complete-restart-button'),
        completeExit: document.querySelector('#complete-exit-button')
    };
    const appLoader = document.querySelector('#app-loader');
    const noteButtons = [...document.querySelectorAll('.notes-nav__item')];
    const notes = [...document.querySelectorAll('[data-note-content]')];

    let sentences = [];
    let currentIndex = 0;
    let isTranslationVisible = false;
    let toastTimer;
    let autoTimer;
    let countdownTimer;
    let progressFrame;
    let speechRunId = 0;
    let isPaused = false;
    const allTensesValue = 'все 12 времён (Simple, Continuous, Perfect, Perfect Continuous)';
    const allThemesValue = 'все темы';
    const storageKey = 'english-trainer-state';
    const questionStorageKey = 'english-trainer-question-session';

    const topicsChoices = new Choices(elements.promptTopics, {
        removeItemButton: true,
        searchEnabled: true,
        searchPlaceholderValue: 'Найти тему...',
        itemSelectText: '',
        shouldSort: false,
        allowHTML: false
    });
    const typesChoices = new Choices(elements.promptTypes, {
        removeItemButton: true,
        searchEnabled: false,
        itemSelectText: '',
        shouldSort: false,
        allowHTML: false
    });
    const themesChoices = new Choices(elements.promptThemes, {
        removeItemButton: true,
        searchEnabled: true,
        searchPlaceholderValue: 'Найти тему...',
        itemSelectText: '',
        shouldSort: false,
        allowHTML: false
    });

    function saveState() {
        const state = {
            json: elements.input.value,
            shuffle: elements.shuffle.checked,
            auto: elements.auto.checked,
            autoSpeed: elements.autoSpeed.value,
            speech: elements.speech.checked,
            voice: elements.voice.value,
            volume: elements.volume.value,
            topics: [...elements.promptTopics.selectedOptions].map((option) => option.value),
            themes: [...elements.promptThemes.selectedOptions].map((option) => option.value),
            types: [...elements.promptTypes.selectedOptions].map((option) => option.value),
            level: elements.promptLevel.value,
            count: elements.promptCount.value,
            repeat: elements.promptRepeat.checked
        };
        sessionStorage.setItem(storageKey, JSON.stringify(state));
    }

    function saveQuestionSession() {
        sessionStorage.setItem(questionStorageKey, JSON.stringify({ sentences, currentIndex, isTranslationVisible }));
    }

    function clearQuestionSession() {
        sessionStorage.removeItem(questionStorageKey);
    }

    function closeCompleteModal() {
        elements.completeModal.hidden = true;
        document.body.classList.remove('modal-open');
    }

    function getQuestionSession() {
        try {
            const stored = sessionStorage.getItem(questionStorageKey);
            if (!stored) return null;
            const session = JSON.parse(stored);
            return Array.isArray(session.sentences) && session.sentences.length > 0 ? session : null;
        } catch {
            clearQuestionSession();
            return null;
        }
    }

    function restoreState() {
        const stored = sessionStorage.getItem(storageKey);
        if (!stored) return;
        try {
            const state = JSON.parse(stored);
            elements.input.value = state.json || '';
            elements.shuffle.checked = Boolean(state.shuffle);
            elements.auto.checked = Boolean(state.auto);
            elements.autoSpeed.value = Math.min(10, Math.max(1, Number(state.autoSpeed) || 5));
            elements.speech.checked = Boolean(state.speech);
            elements.voice.value = state.voice || '';
            elements.volume.value = Math.min(1, Math.max(0, Number(state.volume) || 0.2));
            elements.promptLevel.value = state.level || 'лёгкий';
            elements.promptCount.value = Math.min(250, Math.max(1, Number(state.count) || 100));
            elements.promptRepeat.checked = Boolean(state.repeat);
            if (Array.isArray(state.topics)) {
                topicsChoices.removeActiveItems();
                topicsChoices.setChoiceByValue(state.topics);
            }
            if (Array.isArray(state.types)) {
                typesChoices.removeActiveItems();
                typesChoices.setChoiceByValue(state.types);
            }
            if (Array.isArray(state.themes)) {
                themesChoices.removeActiveItems();
                themesChoices.setChoiceByValue(state.themes.length > 0 ? state.themes : allThemesValue);
            }
        } catch {
            sessionStorage.removeItem(storageKey);
        }
    }

    restoreState();

    function syncPracticeControls() {
        elements.trainerAuto.checked = elements.auto.checked;
        elements.trainerSpeech.checked = elements.speech.checked;
        elements.trainerSpeed.value = elements.autoSpeed.value;
        elements.trainerVoice.value = elements.voice.value;
        updateTrainerControlState();
    }

    function syncSetupControls() {
        elements.auto.checked = elements.trainerAuto.checked;
        elements.speech.checked = elements.trainerSpeech.checked;
        elements.autoSpeed.value = elements.trainerSpeed.value;
        elements.voice.value = elements.trainerVoice.value;
        saveState();
        updateAutoSpeedState();
        updateTrainerControlState();
    }

    function populateVoices() {
        const voices = speechSynthesis.getVoices().filter((voice) => /^en(-|_)/i.test(voice.lang));
        [elements.voice, elements.trainerVoice].forEach((select) => {
            select.innerHTML = '<option value="">English voice</option>';
        });
        voices.forEach((voice) => {
            [elements.voice, elements.trainerVoice].forEach((select) => {
                const option = document.createElement('option');
                option.value = voice.voiceURI;
                option.textContent = `${voice.name} (${voice.lang})`;
                select.append(option);
            });
        });
        const savedVoice = JSON.parse(sessionStorage.getItem(storageKey) || '{}').voice;
        if (savedVoice && voices.some((voice) => voice.voiceURI === savedVoice)) {
            elements.voice.value = savedVoice;
            elements.trainerVoice.value = savedVoice;
        }
    }
    populateVoices();
    speechSynthesis.addEventListener('voiceschanged', populateVoices);

    elements.promptTopics.addEventListener('addItem', (event) => {
        const addedValue = event.detail.value || event.detail.choice?.value;
        if (addedValue === allTensesValue) {
            [...elements.promptTopics.options]
                .filter((option) => /^(Present|Past|Future) /.test(option.value))
                .forEach((option) => topicsChoices.removeActiveItemsByValue(option.value));
        } else if (/^(Present|Past|Future) /.test(addedValue)) {
            topicsChoices.removeActiveItemsByValue(allTensesValue);
        }
        saveState();
    });
    elements.promptTypes.addEventListener('change', saveState);
    elements.promptTopics.addEventListener('removeItem', saveState);
    elements.promptThemes.addEventListener('addItem', (event) => {
        const addedValue = event.detail.value || event.detail.choice?.value;
        const selectedValues = [...elements.promptThemes.selectedOptions].map((option) => option.value);
        const specificThemes = selectedValues.filter((value) => value !== allThemesValue);
        if (addedValue === allThemesValue) {
            specificThemes.forEach((value) => themesChoices.removeActiveItemsByValue(value));
        } else {
            themesChoices.removeActiveItemsByValue(allThemesValue);
        }
        saveState();
    });
    elements.promptThemes.addEventListener('removeItem', () => {
        if (elements.promptThemes.selectedOptions.length === 0) {
            themesChoices.setChoiceByValue(allThemesValue);
        }
        saveState();
    });
    elements.input.addEventListener('input', saveState);
    elements.shuffle.addEventListener('change', saveState);
    elements.auto.addEventListener('change', saveState);
    elements.auto.addEventListener('change', updateAutoSpeedState);
    elements.autoSpeed.addEventListener('input', () => { saveState(); syncPracticeControls(); });
    elements.speech.addEventListener('change', () => { saveState(); syncPracticeControls(); });
    elements.voice.addEventListener('change', () => { saveState(); syncPracticeControls(); });
    elements.volume.addEventListener('input', saveState);
    elements.trainerAuto.addEventListener('change', () => {
        syncSetupControls();
        isPaused = false;
        elements.pauseTraining.textContent = 'Пауза';
        elements.pauseTraining.setAttribute('aria-pressed', 'false');
        if (elements.trainer.hidden) return;
        if (elements.trainerAuto.checked) {
            if (isTranslationVisible) speakCurrentAnswer();
            else speakCurrentPrompt();
            scheduleAutoAdvance();
        } else {
            clearTimeout(autoTimer);
            clearInterval(countdownTimer);
            cancelAnimationFrame(progressFrame);
            elements.progress.hidden = true;
        }
    });
    elements.trainerSpeech.addEventListener('change', () => {
        syncSetupControls();
        if (elements.trainer.hidden) return;
        if (elements.trainerSpeech.checked) {
            if (isTranslationVisible) speakCurrentAnswer();
            else speakCurrentPrompt();
        } else {
            speechRunId += 1;
            speechSynthesis.cancel();
            speechSynthesis.resume();
            elements.english.classList.remove('sentence-card__prompt--speaking');
            elements.translation.classList.remove('sentence-card__answer--speaking');
            elements.translation.querySelectorAll('.speech-text--speaking').forEach((text) => text.classList.remove('speech-text--speaking'));
        }
        if (elements.trainerAuto.checked) scheduleAutoAdvance();
    });
    elements.trainerSpeed.addEventListener('input', syncSetupControls);
    elements.trainerVoice.addEventListener('change', syncSetupControls);
    elements.promptLevel.addEventListener('change', saveState);
    elements.promptCount.addEventListener('input', saveState);
    elements.promptRepeat.addEventListener('change', saveState);

    function getSelectedValues(select) {
        return [...select.selectedOptions].map((option) => option.value).join(', ');
    }

    function speakCurrentAnswer() {
        speechRunId += 1;
        const runId = speechRunId;
        speechSynthesis.cancel();
        elements.english.classList.remove('sentence-card__prompt--speaking');
        elements.translation.classList.remove('sentence-card__answer--speaking');
        if (!elements.speech.checked || !sentences[currentIndex]) return;
        const answer = sentences[currentIndex].en;
        const selectedVoice = speechSynthesis.getVoices().find((voice) => voice.voiceURI === elements.voice.value);
        const parts = [{ text: typeof answer === 'string' ? answer : answer.main, lang: 'en-US' }];
        if (typeof answer !== 'string' && answer.alternative.trim()) {
            parts.push({ text: 'или', lang: 'ru-RU' }, { text: answer.alternative, lang: 'en-US' });
        }
        elements.translation.classList.add('sentence-card__answer--speaking');
        const speakPart = (index) => {
            if (runId !== speechRunId || index >= parts.length) {
                if (runId === speechRunId) {
                    elements.translation.classList.remove('sentence-card__answer--speaking');
                    elements.translation.querySelectorAll('.speech-text--speaking').forEach((text) => text.classList.remove('speech-text--speaking'));
                }
                return;
            }
            const utterance = new SpeechSynthesisUtterance(parts[index].text);
            utterance.lang = parts[index].lang;
            utterance.rate = 0.9;
            utterance.volume = Number(elements.volume.value);
            if (selectedVoice && parts[index].lang === 'en-US') utterance.voice = selectedVoice;
            const target = index === 0
                ? elements.translation.querySelector('.sentence-card__answer-main')
                : index === 2
                    ? elements.translation.querySelector('.sentence-card__answer-alternative')
                    : null;
            elements.translation.querySelectorAll('.speech-text--speaking').forEach((text) => text.classList.remove('speech-text--speaking'));
            if (target) target.classList.add('speech-text--speaking');
            utterance.onend = () => speakPart(index + 1);
            utterance.onerror = () => {
                if (runId === speechRunId) {
                    elements.translation.classList.remove('sentence-card__answer--speaking');
                    elements.translation.querySelectorAll('.speech-text--speaking').forEach((text) => text.classList.remove('speech-text--speaking'));
                }
            };
            speechSynthesis.speak(utterance);
        };
        speakPart(0);
    }

    function speakCurrentPrompt() {
        if (!elements.speech.checked || !sentences[currentIndex]) return;
        speechRunId += 1;
        const runId = speechRunId;
        speechSynthesis.cancel();
        elements.english.classList.remove('sentence-card__prompt--speaking');
        const utterance = new SpeechSynthesisUtterance(sentences[currentIndex].ru);
        utterance.lang = 'ru-RU';
        utterance.rate = 0.9;
        utterance.volume = Math.min(1, Number(elements.volume.value) * 1.6);
        const russianVoice = speechSynthesis.getVoices().find((voice) => /^ru(-|_)/i.test(voice.lang));
        if (russianVoice) utterance.voice = russianVoice;
        elements.english.classList.add('sentence-card__prompt--speaking');
        utterance.onend = () => {
            if (runId === speechRunId) {
                elements.english.classList.remove('sentence-card__prompt--speaking');
            }
        };
        utterance.onerror = () => {
            if (runId === speechRunId) {
                elements.english.classList.remove('sentence-card__prompt--speaking');
            }
        };
        speechSynthesis.speak(utterance);
    }

    function updateAutoSpeedState() {
        const isEnabled = elements.auto.checked;
        elements.autoSpeed.disabled = !isEnabled;
        elements.speedField.classList.toggle('speed-field--disabled', !isEnabled);
        elements.pauseTraining.disabled = !isEnabled;
        elements.trainerAuto.checked = elements.auto.checked;
        elements.trainerSpeed.value = elements.autoSpeed.value;
        updateTrainerControlState();
    }

    function updateTrainerControlState() {
        const autoEnabled = elements.trainerAuto.checked;
        const speechEnabled = elements.trainerSpeech.checked;
        elements.trainerSpeed.disabled = !autoEnabled;
        elements.pauseTraining.disabled = !autoEnabled;
        elements.trainerSpeed.parentElement.classList.toggle('trainer__speed-control--disabled', !autoEnabled);
        elements.trainerVoice.disabled = !speechEnabled;
        elements.volume.disabled = !speechEnabled;
        elements.trainerVoice.classList.toggle('trainer__voice-select--disabled', !speechEnabled);
        elements.volume.closest('.volume-field').classList.toggle('volume-field--disabled', !speechEnabled);
    }

    function buildPrompt() {
        const count = Math.min(250, Math.max(1, Number(elements.promptCount.value) || 100));
        elements.promptCount.value = count;
        const grammar = getSelectedValues(elements.promptTopics) || 'не выбраны';
        const themes = getSelectedValues(elements.promptThemes) || 'не выбраны';
        const types = getSelectedValues(elements.promptTypes) || 'не выбраны';
        const level = elements.promptLevel.value;

        if (elements.promptRepeat.checked) {
            return `Сгенерируй новый набор из ${count} предложений по уже согласованным в этом чате правилам и JSON-формату. Не повторяй предыдущие предложения.

Настройки: времена и конструкции — ${grammar}; темы — ${themes}; типы — ${types}; уровень — ${level}.
Если в предложении указывается конкретное время, свободно используй и меняй ЛЮБОЙ из естественных вариантов: "o'clock" (если в предложении нет указания на часть дня) или "a.m./p.m." ("am/pm").
Верни только валидный JSON-массив ровно из ${count} объектов. В каждом объекте используй формат: { "en": { "main": "Основной английский вариант.", "alternative": "Естественный заметно отличающийся вариант или пустая строка." }, "ru": "Русское предложение." }. Делай alternative только если он действительно естественный и заметно отличается от main; не меняй пару слов формально и не выдумывай второй вариант. Если хорошего альтернативного перевода нет, оставь "alternative": "". Не добавляй нумерацию, заголовки и пояснения.`;
        }

        return `Сгенерируй набор из ${count} предложений для тренажёра перевода с русского на английский.

Настройки пользователя:
- Времена и конструкции: ${grammar}
- Темы: ${themes}
- Типы предложений: ${types}
- Уровень: ${level}

Требования:
1. Равномерно и естественно используй выбранные темы и типы предложений.
2. Пиши сначала русское предложение, затем его точный естественный перевод на английский.
3. Не добавляй нумерацию, пояснения, заголовки и комментарии вне JSON.
4. Верни только валидный JSON-массив ровно из ${count} объектов такого формата:
[
  { "en": { "main": "English sentence.", "alternative": "A meaningfully different natural translation, or an empty string." }, "ru": "Русское предложение." }
]
5. Предложения должны быть самостоятельными, разнообразными и подходить для последовательного показа по одному в приложении.
6. Не используй спорные или неестественные формулировки. Для продвинутого уровня допускай более сложную лексику, но сохраняй понятный контекст.
7. Если в предложении указывается время, свободно используй естественный вариант: "o'clock" или "a.m./p.m." ("am/pm").
8. Делай alternative только если он естественный и заметно отличается от main; иначе оставляй поле alternative пустым.
9. Сгенерируй один набор и не повторяй генерацию автоматически.`;
    }

    async function copyPrompt() {
        const prompt = buildPrompt();
        try {
            await navigator.clipboard.writeText(prompt);
        } catch {
            const helper = document.createElement('textarea');
            helper.value = prompt;
            helper.style.position = 'fixed';
            helper.style.opacity = '0';
            document.body.appendChild(helper);
            helper.select();
            document.execCommand('copy');
            helper.remove();
        }
        elements.promptStatus.textContent = 'Промпт скопирован — можно вставлять в ChatGPT или другой ИИ.';
        showToast('Промпт скопирован в clipboard');
    }

    function showToast(message) {
        clearTimeout(toastTimer);
        elements.toastMessage.textContent = message;
        elements.toast.classList.add('toast--visible');
        toastTimer = setTimeout(() => elements.toast.classList.remove('toast--visible'), 3000);
    }

    function switchPage(page, updateUrl = true) {
        const isPractice = page === 'practice';
        if (!isPractice) {
            clearTimeout(autoTimer);
            clearInterval(countdownTimer);
            cancelAnimationFrame(progressFrame);
            speechSynthesis.cancel();
            speechRunId += 1;
            elements.english.classList.remove('sentence-card__prompt--speaking');
            elements.translation.classList.remove('sentence-card__answer--speaking');
            elements.translation.querySelectorAll('.speech-text--speaking').forEach((text) => text.classList.remove('speech-text--speaking'));
            elements.progress.hidden = true;
        }
        document.documentElement.classList.remove('initial-knowledge');
        elements.practicePage.hidden = !isPractice;
        elements.knowledgePage.hidden = isPractice;
        elements.topProgress.hidden = !isPractice || elements.trainer.hidden;
        elements.practiceNav.classList.toggle('app-nav__item--active', isPractice);
        elements.knowledgeNav.classList.toggle('app-nav__item--active', !isPractice);
        elements.practiceNav.toggleAttribute('aria-current', isPractice);
        elements.knowledgeNav.toggleAttribute('aria-current', !isPractice);
        if (isPractice && !elements.trainer.hidden && sentences.length) {
            if (isTranslationVisible) speakCurrentAnswer();
            else speakCurrentPrompt();
            scheduleAutoAdvance();
        }
        window.scrollTo(0, 0);
        if (updateUrl) {
            const url = new URL(window.location.href);
            url.searchParams.set('page', page);
            window.history.replaceState({}, '', url);
        }
    }

    function switchNote(noteId) {
        noteButtons.forEach((button) => {
            const isActive = button.dataset.note === noteId;
            button.classList.toggle('notes-nav__item--active', isActive);
            button.toggleAttribute('aria-current', isActive);
        });
        notes.forEach((note) => { note.hidden = note.dataset.noteContent !== noteId; });
    }

    function parseInput(value) {
        let parsed;
        try {
            parsed = JSON.parse(value);
        } catch {
            try {
                parsed = JSON.parse(value.replace(/([{,])\s*(en|ru)\s*:/g, '$1"$2":'));
            } catch {
                throw new Error('Не получилось прочитать JSON. Проверь скобки и кавычки.');
            }
        }
        if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('Нужен непустой массив предложений.');
        if (parsed.some((item) => {
            const isNewEnglishFormat = item && item.en && typeof item.en === 'object'
                && typeof item.en.main === 'string'
                && typeof item.en.alternative === 'string';
            return !item || typeof item.ru !== 'string' || (typeof item.en !== 'string' && !isNewEnglishFormat);
        })) {
            throw new Error('У каждого объекта должны быть ru и en: строка или объект с main и alternative.');
        }
        return parsed;
    }

    function render() {
        const sentence = sentences[currentIndex];
        isPaused = false;
        elements.pauseTraining.textContent = 'Пауза';
        elements.pauseTraining.setAttribute('aria-pressed', 'false');
        speechSynthesis.cancel();
        speechRunId += 1;
        elements.english.classList.remove('sentence-card__prompt--speaking');
        elements.translation.classList.remove('sentence-card__answer--speaking');
        isTranslationVisible = false;
        elements.current.textContent = currentIndex + 1;
        elements.total.textContent = sentences.length;
        elements.number.textContent = String(currentIndex + 1).padStart(2, '0');
        elements.english.textContent = sentence.ru;
        elements.translation.textContent = '';
        const mainAnswer = document.createElement('span');
        mainAnswer.className = 'sentence-card__answer-main';
        mainAnswer.textContent = typeof sentence.en === 'string' ? sentence.en : sentence.en.main;
        elements.translation.append(mainAnswer);
        if (typeof sentence.en !== 'string' && sentence.en.alternative.trim()) {
            const separator = document.createElement('span');
            separator.className = 'sentence-card__answer-separator';
            separator.textContent = 'или';
            const alternativeAnswer = document.createElement('span');
            alternativeAnswer.className = 'sentence-card__answer-alternative';
            alternativeAnswer.textContent = sentence.en.alternative;
            elements.translation.append(separator, alternativeAnswer);
        }
        elements.translation.hidden = true;
        elements.instruction.innerHTML = 'Нажми <kbd>→</kbd>, чтобы проверить перевод';
        elements.nextLabel.textContent = 'Показать перевод';
        elements.previous.disabled = currentIndex === 0;
        elements.previous.style.opacity = currentIndex === 0 ? '.45' : '1';
        elements.nextLabel.parentElement.focus();
        saveQuestionSession();
        scheduleAutoAdvance();
        speakCurrentPrompt();
    }

    function getSpeechDurationSeconds() {
        if (!elements.speech.checked || !sentences[currentIndex]) return 0;
        const sentence = sentences[currentIndex];
        const answer = typeof sentence.en === 'string'
            ? { main: sentence.en, alternative: '' }
            : sentence.en;
        const text = isTranslationVisible
            ? `${answer.main}${answer.alternative.trim() ? ` или ${answer.alternative}` : ''}`
            : sentence.ru;
        return Math.max(1.5, text.length / 11.5 / 0.9 + 0.35);
    }

    function scheduleAutoAdvance() {
        clearTimeout(autoTimer);
        clearInterval(countdownTimer);
        cancelAnimationFrame(progressFrame);
        elements.progress.hidden = true;
        elements.progress.classList.remove('sentence-card__progress--urgent');
        if (!elements.auto.checked || elements.trainer.hidden || isPaused) return;
        const speed = Math.min(10, Math.max(1, Number(elements.autoSpeed.value) || 5));
        const translationSeconds = 2 + (speed - 1) * 2;
        const nextSeconds = 2 + (speed - 1);
        const baseSeconds = isTranslationVisible ? nextSeconds : translationSeconds;
        const seconds = Math.max(baseSeconds, getSpeechDurationSeconds());
        elements.progress.hidden = false;
        elements.progressFill.style.width = '100%';
        elements.progress.classList.remove('sentence-card__progress--urgent');
        const duration = seconds * 1000;
        const deadline = performance.now() + duration;
        const updateProgress = () => {
            const remaining = Math.max(0, deadline - performance.now());
            const remainingSeconds = remaining / 1000;
            elements.progressFill.style.width = `${remaining / duration * 100}%`;
            elements.progress.classList.toggle('sentence-card__progress--urgent', remainingSeconds <= 2);
            if (remaining > 0) progressFrame = requestAnimationFrame(updateProgress);
        };
        progressFrame = requestAnimationFrame(updateProgress);
        autoTimer = setTimeout(advance, seconds * 1000);
    }

    function start() {
        try {
            sentences = parseInput(elements.input.value.trim());
            if (elements.shuffle.checked) {
                sentences = [...sentences];
                for (let index = sentences.length - 1; index > 0; index -= 1) {
                    const randomIndex = Math.floor(Math.random() * (index + 1));
                    [sentences[index], sentences[randomIndex]] = [sentences[randomIndex], sentences[index]];
                }
            }
            currentIndex = 0;
            elements.error.hidden = true;
            elements.setup.hidden = true;
            elements.trainer.hidden = false;
            elements.topProgress.hidden = false;
            elements.promptPanel.hidden = true;
            saveState();
            render();
        } catch (error) {
            elements.error.textContent = error.message;
            elements.error.hidden = false;
        }
    }

    function advance() {
        speechRunId += 1;
        speechSynthesis.cancel();
        elements.english.classList.remove('sentence-card__prompt--speaking');
        elements.translation.classList.remove('sentence-card__answer--speaking');
        elements.translation.querySelectorAll('.speech-text--speaking').forEach((text) => text.classList.remove('speech-text--speaking'));
        if (!isTranslationVisible) {
            isTranslationVisible = true;
            elements.translation.hidden = false;
            elements.instruction.textContent = currentIndex === sentences.length - 1 ? 'Набор закончен — нажми «Новый набор»' : 'Нажми →, чтобы перейти дальше';
            elements.nextLabel.textContent = currentIndex === sentences.length - 1 ? 'Завершить' : 'Следующее';
            speakCurrentAnswer();
            saveQuestionSession();
            scheduleAutoAdvance();
            return;
        }
        if (currentIndex === sentences.length - 1) {
            clearQuestionSession();
            clearTimeout(autoTimer);
            cancelAnimationFrame(progressFrame);
            elements.progress.hidden = true;
            elements.completeModal.hidden = false;
            document.body.classList.add('modal-open');
            return;
        }
        currentIndex = currentIndex === sentences.length - 1 ? 0 : currentIndex + 1;
        render();
    }

    elements.start.addEventListener('click', start);
    elements.generatePrompt.addEventListener('click', copyPrompt);
    elements.practiceNav.addEventListener('click', () => switchPage('practice'));
    elements.knowledgeNav.addEventListener('click', () => switchPage('knowledge'));
    noteButtons.forEach((button) => button.addEventListener('click', () => switchNote(button.dataset.note)));

    const initialPage = new URLSearchParams(window.location.search).get('page');
    updateAutoSpeedState();
    syncPracticeControls();
    switchPage(initialPage === 'knowledge' ? 'knowledge' : 'practice', false);
    window.scrollTo(0, 0);
    const savedQuestionSession = getQuestionSession();
    if (savedQuestionSession) {
        elements.resumeModal.hidden = false;
        document.body.classList.add('modal-open');
    }
    elements.resumeSession.addEventListener('click', () => {
        const session = getQuestionSession();
        if (!session) return;
        sentences = session.sentences;
        currentIndex = Math.min(Math.max(Number(session.currentIndex) || 0, 0), sentences.length - 1);
        switchPage('practice');
        elements.setup.hidden = true;
        elements.trainer.hidden = false;
        elements.topProgress.hidden = false;
        elements.promptPanel.hidden = true;
        render();
        if (session.isTranslationVisible) {
            isTranslationVisible = true;
            elements.translation.hidden = false;
            elements.instruction.textContent = currentIndex === sentences.length - 1 ? 'Набор закончен — нажми «Новый набор»' : 'Нажми →, чтобы перейти дальше';
            elements.nextLabel.textContent = currentIndex === sentences.length - 1 ? 'Завершить' : 'Следующее';
            speakCurrentAnswer();
            saveQuestionSession();
        }
        elements.resumeModal.hidden = true;
        document.body.classList.remove('modal-open');
    });
    elements.exitSession.addEventListener('click', () => {
        clearQuestionSession();
        elements.resumeModal.hidden = true;
        document.body.classList.remove('modal-open');
    });
    elements.completeRestart.addEventListener('click', () => {
        currentIndex = 0;
        closeCompleteModal();
        render();
    });
        elements.completeExit.addEventListener('click', () => {
        clearQuestionSession();
        clearTimeout(autoTimer);
        cancelAnimationFrame(progressFrame);
        elements.progress.hidden = true;
        elements.trainer.hidden = true;
        elements.topProgress.hidden = true;
        elements.setup.hidden = false;
        elements.promptPanel.hidden = false;
        closeCompleteModal();
    });
    setTimeout(() => {
        requestAnimationFrame(() => {
            document.body.classList.remove('is-loading');
            appLoader.classList.add('app-loader--hidden');
        });
    }, 800);
    elements.next.addEventListener('click', advance);
    elements.pauseTraining.addEventListener('click', () => {
        if (!elements.auto.checked) return;
        isPaused = !isPaused;
        elements.pauseTraining.textContent = isPaused ? 'Продолжить' : 'Пауза';
        elements.pauseTraining.setAttribute('aria-pressed', String(isPaused));
        if (isPaused) {
            clearTimeout(autoTimer);
            clearInterval(countdownTimer);
            cancelAnimationFrame(progressFrame);
            speechSynthesis.cancel();
            speechRunId += 1;
            elements.progress.hidden = true;
            elements.english.classList.remove('sentence-card__prompt--speaking');
            elements.translation.classList.remove('sentence-card__answer--speaking');
        } else {
            if (isTranslationVisible) speakCurrentAnswer();
            else speakCurrentPrompt();
            scheduleAutoAdvance();
        }
    });
    elements.previous.addEventListener('click', () => {
        if (currentIndex > 0) { currentIndex -= 1; render(); }
    });
    elements.reset.addEventListener('click', () => {
        clearQuestionSession();
        clearTimeout(autoTimer);
        clearInterval(countdownTimer);
        cancelAnimationFrame(progressFrame);
        speechSynthesis.cancel();
        speechRunId += 1;
        elements.translation.classList.remove('sentence-card__answer--speaking');
        elements.progress.hidden = true;
        elements.progress.classList.remove('sentence-card__progress--urgent');
        elements.trainer.hidden = true;
        elements.topProgress.hidden = true;
        elements.setup.hidden = false;
        elements.promptPanel.hidden = false;
        elements.input.focus();
    });
    elements.exitTraining.addEventListener('click', () => {
        clearQuestionSession();
        clearTimeout(autoTimer);
        clearInterval(countdownTimer);
        cancelAnimationFrame(progressFrame);
        speechSynthesis.cancel();
        elements.progress.hidden = true;
        elements.trainer.hidden = true;
        elements.topProgress.hidden = true;
        elements.setup.hidden = false;
        elements.promptPanel.hidden = false;
        elements.input.focus();
    });
    document.addEventListener('keydown', (event) => {
        if (event.code === 'Space' && !elements.trainer.hidden && elements.auto.checked) {
            event.preventDefault();
            elements.pauseTraining.click();
        }
        if (event.key === 'ArrowRight' && !elements.trainer.hidden) advance();
        if (event.key === 'ArrowLeft' && !elements.trainer.hidden && currentIndex > 0) { currentIndex -= 1; render(); }
    });
})();
