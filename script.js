document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing...');
    const app = document.getElementById('app');
    const mobileMessage = document.getElementById('mobile-message');
    const textToTypeEl = document.getElementById('text-to-type');
    const inputBox = document.getElementById('input-box');
    const timerEl = document.getElementById('timer');
    const wpmEl = document.getElementById('wpm');
    const accuracyEl = document.getElementById('accuracy');
    const restartBtn = document.getElementById('restart-btn');
    const textContainer = document.getElementById('text-to-type-container');
    const gameModeSelection = document.getElementById('game-mode-selection');
    const startGameBtn = document.getElementById('start-game-btn');
    if (!app || !textToTypeEl || !inputBox || !timerEl || !wpmEl || !accuracyEl || !restartBtn) {
        console.error('Missing required elements');
        return;
    }
 
    console.log('All elements found');
    const cursor = document.createElement('div');
    cursor.className = 'cursor';
    textContainer.appendChild(cursor);
    let TEST_DURATION = 30;
    let timer;
    let timeRemaining = TEST_DURATION;
    let gameStarted = false;
    let currentWordIndex = 0;
    let correctChars = 0;
    let totalTypedChars = 0;
    let correctlyTypedWords = 0;
    let gameMode = 'time';
    let targetWords = 25;
    let selectedTime = 30;
 
    // Speed history functions
    function saveSpeedToHistory(wpm, accuracy, gameMode, setting) {
        const history = getSpeedHistory();
        const newEntry = {
            wpm: wpm,
            accuracy: accuracy,
            gameMode: gameMode,
            setting: setting,
            timestamp: new Date().toISOString(),
            date: new Date().toLocaleDateString('ku-Arab-IQ')
        };
 
        history.unshift(newEntry);
 
        // Keep only last 50 entries
        if (history.length > 50) {
            history.splice(50);
        }
 
        localStorage.setItem('typingSpeedHistory', JSON.stringify(history));
        console.log('Speed saved to history:', newEntry);
    }
 
    function getSpeedHistory() {
        const history = localStorage.getItem('typingSpeedHistory');
        return history ? JSON.parse(history) : [];
    }
 
    function getPersonalBest() {
        const history = getSpeedHistory();
        if (history.length === 0) return null;
 
        return history.reduce((best, current) => {
            return current.wpm > best.wpm ? current : best;
        });
    }
 
    function showSpeedHistory() {
        const history = getSpeedHistory();
        const personalBest = getPersonalBest();
 
        if (history.length === 0) {
            alert('هێشتا هیچ مێژوویەکت نییە! تاقیکردنەوەیەک بکە بۆ دەستپێکردن.');
            return;
        }
 
        // Create history display
        const historyHtml = `
            <div class="speed-history">
                <h3>مێژووی خێرایی نووسینت</h3>
                ${personalBest ? `<div class="personal-best">باشترینت: ${personalBest.wpm} وشە/خولەک (${personalBest.date})</div>` : ''}
                <div class="history-list">
                    ${history.slice(0, 10).map(entry => `
                        <div class="history-item">
                            <span class="wpm">${entry.wpm} WPM</span>
                            <span class="accuracy">${entry.accuracy}%</span>
                            <span class="mode">${entry.gameMode === 'time' ? entry.setting + ' چرکە' : entry.setting + ' وشە'}</span>
                            <span class="date">${entry.date}</span>
                        </div>
                    `).join('')}
                </div>
                <button onclick="closeSpeedHistory()">داخستن</button>
            </div>
        `;
 
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'overlay';
        overlay.onclick = closeSpeedHistory;
 
        // Create history container
        const historyContainer = document.createElement('div');
        historyContainer.className = 'history-container';
        historyContainer.innerHTML = historyHtml;
 
        document.body.appendChild(overlay);
        document.body.appendChild(historyContainer);
    }
 
    function closeSpeedHistory() {
        const overlay = document.querySelector('.overlay');
        const historyContainer = document.querySelector('.history-container');
        if (overlay) overlay.remove();
        if (historyContainer) historyContainer.remove();
    }
    const kurdishWords = [
        "کوردستان", "هەولێر", "سلێمانی", "ژیان", "ئازادی", "سەربەستی", "ڕێگا", "کتێب",
        "قەڵەم", "خوێندن", "زانست", "هونەر", "مۆسیقا", "ئاواز", "چیرۆک", "ڕۆمان", "ئاسمان",
        "زەوی", "چیا", "دەریا", "ڕووبار", "باخچە", "گوڵ", "درەخت", "هاوین", "پاییز",
        "زستان", "بەهار", "ڕۆژ", "شەو", "ئەستێرە", "مانگ", "خۆر", "باران", "بەفر",
        "کۆمپیوتەر", "ئینتەرنێت", "بەرنامە", "دیزاین", "ماڵپەڕ", "تەکنەلۆژیا", "سروشت",
        "مرۆڤ", "منداڵ", "خێزان", "هاوڕێ", "خۆشەویستی", "ڕێزگرتن", "یارمەتی", "هیوا",
        "داهاتوو", "ڕابردوو", "ئێستا", "کات", "خێرا", "هێواش", "گەورە", "بچووک", "جوان",
        "ناشرین", "باش", "خراپ", "ڕاستی", "درۆ", "هەست", "بیرکردنەوە", "خەون", "ئامانج"
    ];
 
    // Device check
    function checkDevice() {
        if (window.innerWidth <= 768) {
            app.classList.add('hidden');
            mobileMessage.classList.remove('hidden');
        } else {
            app.classList.remove('hidden');
            mobileMessage.classList.add('hidden');
        }
    }
 
    function setupGameModeSelection() {
        const modeOptions = document.querySelectorAll('.mode-option');
        const settingOptions = document.querySelectorAll('.setting-option');
 
        modeOptions.forEach(option => {
            option.addEventListener('click', function() {
                modeOptions.forEach(m => m.classList.remove('selected'));
                this.classList.add('selected');
 
                gameMode = this.dataset.mode;
                updateStartButton();
            });
        });
 
        settingOptions.forEach(option => {
            option.addEventListener('click', function() {
                const parentMode = this.closest('.mode-option');
                if (!parentMode.classList.contains('selected')) return;
 
                const siblings = parentMode.querySelectorAll('.setting-option');
                siblings.forEach(s => s.classList.remove('selected'));
                this.classList.add('selected');
 
                if (gameMode === 'time') {
                    selectedTime = parseInt(this.dataset.time);
                } else if (gameMode === 'words') {
                    targetWords = parseInt(this.dataset.words);
                }
 
                updateStartButton();
            });
        });
 
        startGameBtn.addEventListener('click', function() {
            if (gameMode === 'time') {
                TEST_DURATION = selectedTime;
            } else {
                TEST_DURATION = 999999; // Very large number for word mode
            }
 
            timeRemaining = TEST_DURATION;
            timerEl.textContent = gameMode === 'time' ? selectedTime : '∞';
            gameModeSelection.style.display = 'none';
            app.classList.remove('hidden');
            resetGame();
        });
 
        modeOptions[0].classList.add('selected');
        modeOptions[0].querySelector('.setting-option[data-time="30"]').classList.add('selected');
        updateStartButton();
    }
 
    function updateStartButton() {
        const hasMode = document.querySelector('.mode-option.selected');
        const hasSetting = document.querySelector('.setting-option.selected');
 
        if (hasMode && hasSetting) {
            startGameBtn.disabled = false;
        } else {
            startGameBtn.disabled = true;
        }
    }
 
    // Generate words with character-level highlighting
    function generateWords() {
        console.log('Generating words...');
        textToTypeEl.innerHTML = '';
 
        // For word mode, use targetWords; for time mode, generate reasonable amount based on time
        let wordCount;
        if (gameMode === 'words') {
            wordCount = targetWords;
        } else {
            // Generate words based on time: ~2 words per second for average typing speed
            wordCount = Math.min(selectedTime * 2, 50); // Max 50 words to avoid overflow
        }
        const wordsToDisplay = [];
        for (let i = 0; i < wordCount; i++) {
            const randomIndex = Math.floor(Math.random() * kurdishWords.length);
            wordsToDisplay.push(kurdishWords[randomIndex]);
        }
 
        wordsToDisplay.forEach(wordStr => {
            const wordEl = document.createElement('div');
            wordEl.className = 'word';
            for (let i = 0; i < wordStr.length; i++) {
                const charSpan = document.createElement('span');
                charSpan.className = 'char pending';
                charSpan.textContent = wordStr[i];
                wordEl.appendChild(charSpan);
            }
 
            textToTypeEl.appendChild(wordEl);
        });
 
        console.log('Generated', textToTypeEl.children.length, 'words');
        const firstWord = textToTypeEl.querySelector('.word');
        if (firstWord) {
            firstWord.classList.add('active');
            const firstChar = firstWord.querySelector('.char');
            if (firstChar) {
                firstChar.classList.remove('pending');
                firstChar.classList.add('current');
            }
        }
 
        moveCursor();
    }
 
    // Generate more words for time mode when all words are completed
    function generateMoreWords() {
        console.log('Generating more words for time mode...');
 
        // Generate 10 more words
        const wordsToDisplay = [];
        for (let i = 0; i < 10; i++) {
            const randomIndex = Math.floor(Math.random() * kurdishWords.length);
            wordsToDisplay.push(kurdishWords[randomIndex]);
        }
 
        wordsToDisplay.forEach(wordStr => {
            const wordEl = document.createElement('div');
            wordEl.className = 'word';
            for (let i = 0; i < wordStr.length; i++) {
                const charSpan = document.createElement('span');
                charSpan.className = 'char pending';
                charSpan.textContent = wordStr[i];
                wordEl.appendChild(charSpan);
            }
            textToTypeEl.appendChild(wordEl);
        });
 
        // Move to the first new word
        const words = textToTypeEl.querySelectorAll('.word');
        if (words[currentWordIndex]) {
            words[currentWordIndex].classList.add('active');
            const firstChar = words[currentWordIndex].querySelector('.char');
            if (firstChar) {
                firstChar.classList.remove('pending');
                firstChar.classList.add('current');
            }
        }
 
        moveCursor();
        console.log('Generated', 10, 'more words');
    }
 
    function moveCursor() {
        const words = textToTypeEl.querySelectorAll('.word');
        if (currentWordIndex >= words.length) {
            cursor.style.display = 'none';
            return;
        }
 
        const currentWord = words[currentWordIndex];
        const currentChar = currentWord.querySelector('.char.current');
 
        if (currentChar) {
            const charRect = currentChar.getBoundingClientRect();
            const containerRect = textContainer.getBoundingClientRect();
            cursor.style.top = (charRect.top - containerRect.top + 2) + 'px';
            cursor.style.left = (charRect.left - containerRect.left) + 'px';
            cursor.style.right = 'auto';
            cursor.style.display = 'block';
        } else {
            cursor.style.display = 'none';
        }
    }
 
    function startGame() {
        if (gameStarted) return;
        gameStarted = true;
        console.log('Game started');
 
        timer = setInterval(() => {
            timeRemaining--;
            timerEl.textContent = timeRemaining;
            updateWPM();
 
            if (timeRemaining <= 0) {
                endGame();
            }
        }, 1000);
    }
 
    function endGame() {
        clearInterval(timer);
        inputBox.disabled = true;
        gameStarted = false;
        cursor.style.display = 'none';
 
        // Show completion message for time mode
        if (gameMode === 'time') {
            showCompletionMessage();
        }
 
        console.log('Game ended');
    }
 
    function showCompletionMessage() {
        clearInterval(timer);
        inputBox.disabled = true;
        gameStarted = false;
        cursor.style.display = 'none';
 
        const elapsedMinutes = (TEST_DURATION - timeRemaining) / 60;
        const wpm = Math.round(correctlyTypedWords / elapsedMinutes);
 
        // Calculate accuracy by counting correct characters from DOM
        const correctCharsCount = document.querySelectorAll('.char.correct').length;
        const totalCharsCount = document.querySelectorAll('.char').length;
        const accuracy = Math.round((correctCharsCount / Math.max(1, totalCharsCount)) * 100);
 
        // Save to history
        const setting = gameMode === 'time' ? selectedTime : targetWords;
        saveSpeedToHistory(wpm, accuracy, gameMode, setting);
 
        // Check if this is a personal best
        const personalBest = getPersonalBest();
        const isNewRecord = personalBest && personalBest.wpm === wpm && personalBest.timestamp === getSpeedHistory()[0].timestamp;
 
        const overlay = document.createElement('div');
        overlay.className = 'overlay';
        const message = document.createElement('div');
        message.className = 'completion-message';
        message.innerHTML = `
            <h2>تەواو بوو!</h2>
            ${isNewRecord ? '<div style="color: #4ade80; font-weight: bold; margin-bottom: 10px;">🏆 ڕیکۆردی نوێ!</div>' : ''}
            <p>خێرایی نووسینت (وشە ڕاستەکان):</p>
            <p style="color: #aafffc; font-size: 1.5rem; font-weight: bold;">${wpm} وشە لە خولەکێکدا</p>
            <p style="color: #cccccc; font-size: 0.9rem; margin-top: 10px;">
                ${correctlyTypedWords} لە ${currentWordIndex} وشە بە درووستی نووسراون
            </p>
            <p style="color: #888; font-size: 0.8rem;">
                وردی: ${accuracy}%
            </p>
            <div style="margin-top: 20px;">
                <button onclick="returnToModeSelection()" style="margin-right: 10px;">هەڵبژاردنی نوێ</button>
                <button onclick="showSpeedHistory()" style="margin-right: 10px;">مێژوو</button>
                <button onclick="location.reload()">دووبارە دەستپێکردنەوە</button>
            </div>
        `;
 
        document.body.appendChild(overlay);
        document.body.appendChild(message);
 
        console.log('Completion message shown - Correct WPM:', wpm, 'Correct words:', correctlyTypedWords, 'Total words:', currentWordIndex);
    }
 
    function resetGame() {
        console.log('Resetting game...');
        clearInterval(timer);
        timeRemaining = TEST_DURATION;
        gameStarted = false;
        currentWordIndex = 0;
        correctChars = 0;
        totalTypedChars = 0;
        correctlyTypedWords = 0;
        const existingOverlay = document.querySelector('.overlay');
        const existingMessage = document.querySelector('.completion-message');
        if (existingOverlay) existingOverlay.remove();
        if (existingMessage) existingMessage.remove();
 
        timerEl.textContent = gameMode === 'time' ? selectedTime : '∞';
        wpmEl.textContent = "0";
        accuracyEl.textContent = "100%";
        inputBox.value = '';
        inputBox.disabled = false;
        cursor.style.display = 'block';
 
        generateWords();
        inputBox.focus();
        console.log('Game reset complete');
    }
 
    function returnToModeSelection() {
        gameModeSelection.style.display = 'block';
        app.classList.add('hidden');
        const existingOverlay = document.querySelector('.overlay');
        const existingMessage = document.querySelector('.completion-message');
        if (existingOverlay) existingOverlay.remove();
        if (existingMessage) existingMessage.remove();
    }
 
    function handleInput() {
        if (!gameStarted && timeRemaining > 0) {
            startGame();
        }
        if (timeRemaining <= 0) return;
 
        const words = textToTypeEl.querySelectorAll('.word');
        const currentWord = words[currentWordIndex];
        if (!currentWord) return;
 
        const typedValue = inputBox.value;
        const target = currentWord.textContent;
        const chars = currentWord.querySelectorAll('.char');
 
        totalTypedChars++;
 
        // Update character states
        for (let i = 0; i < chars.length; i++) {
            const char = chars[i];
 
            if (i < typedValue.length) {
                // Character has been typed
                if (typedValue[i] === target[i]) {
                    char.className = 'char correct';
                } else {
                    char.className = 'char incorrect';
                }
            } else if (i === typedValue.length) {
                char.className = 'char current';
            } else {
                char.className = 'char pending';
            }
        }
 
        if (gameMode === 'words' && typedValue === target && currentWordIndex === words.length - 1) {
            for (let i = 0; i < chars.length; i++) {
                chars[i].className = 'char correct';
            }
 
            currentWord.classList.add('completed-correct');
            correctlyTypedWords++;
            showCompletionMessage();
            return;
        }
 
        if (inputBox.value.endsWith(' ')) {
            const finalTyped = inputBox.value.trim();
            const wordWasCorrect = finalTyped === target;
 
            if (wordWasCorrect) {
                for (let i = finalTyped.length; i < chars.length; i++) {
                    chars[i].className = 'char correct';
                }
                currentWord.classList.add('completed-correct');
                correctlyTypedWords++;
            }
            currentWord.classList.remove('active');
            currentWordIndex++;
 
            if (currentWordIndex < words.length) {
                const nextWord = words[currentWordIndex];
                nextWord.classList.add('active');
                const nextChars = nextWord.querySelectorAll('.char');
                if (nextChars.length > 0) {
                    nextChars[0].className = 'char current';
                    for (let i = 1; i < nextChars.length; i++) {
                        nextChars[i].className = 'char pending';
                    }
                }
 
                inputBox.value = '';
            } else {
                if (gameMode === 'words') {
                    showCompletionMessage();
                } else {
                    // In time mode, generate more words when all are completed
                    generateMoreWords();
                }
            }
        }
 
        updateAccuracy();
        moveCursor();
    }
 
    // Update WPM
    function updateWPM() {
        const elapsedMinutes = (TEST_DURATION - timeRemaining) / 60;
        if (elapsedMinutes > 0) {
            // Count only correctly typed words
            const wpm = Math.round(correctlyTypedWords / elapsedMinutes);
            wpmEl.textContent = isFinite(wpm) ? wpm : 0;
        }
    }
 
    // Update accuracy based on characters
    function updateAccuracy() {
        if (totalTypedChars === 0) {
            accuracyEl.textContent = "100%";
            return;
        }
 
        const correctChars = document.querySelectorAll('.char.correct').length;
        const totalChars = document.querySelectorAll('.char').length;
        const attemptedChars = Math.max(1, correctChars + document.querySelectorAll('.char.incorrect').length);
 
        const accPercent = Math.round((correctChars / attemptedChars) * 100);
        accuracyEl.textContent = accPercent + "%";
    }
 
    window.addEventListener('load', function() {
        console.log('Window loaded');
        checkDevice();
        setupGameModeSelection();
    });
 
    window.addEventListener('resize', checkDevice);
    inputBox.addEventListener('input', handleInput);
    restartBtn.addEventListener('click', resetGame);
    document.body.addEventListener('click', function() {
        if (!app.classList.contains('hidden')) {
            inputBox.focus();
        }
    });
 
    console.log('Event listeners attached');
 
    // Make history functions globally accessible
    window.showSpeedHistory = showSpeedHistory;
    window.closeSpeedHistory = closeSpeedHistory;
});