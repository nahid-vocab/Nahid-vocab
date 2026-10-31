// @ts-nocheck
let vocabularyData = [];
let currentFlashcardData = [];
let currentCardIndex = 0;
let quizScore = 0;
let currentFlashcardStatus = null;

// ================= অডিও প্লে করার ফাংশন (ব্রিটিশ উচ্চারণ) =================
function playAudio(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-GB';
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
    } else {
        alert("আপনার ব্রাউজারে অডিও সাপোর্ট করছে না।");
    }
}

// ================= থিম পরিবর্তন =================
function toggleThemeMenu() {
    const menu = document.getElementById('themeMenu');
    menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex';
    menu.style.flexDirection = 'column';
}

function setTheme(themeName) {
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem('appTheme', themeName);
    document.getElementById('themeMenu').style.display = 'none';
}

function loadTheme() {
    const savedTheme = localStorage.getItem('appTheme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

// --- পেজ পরিবর্তন ---
function switchTab(tabName) {
    const screens = {
        home: document.getElementById('homeScreen'),
        words: document.getElementById('wordsScreen'),
        flashcard: document.getElementById('flashcardScreen'),
        quiz: document.getElementById('quizScreen')
    };
    const navs = {
        home: document.getElementById('navHome'),
        words: document.getElementById('navWords'),
        flashcard: document.getElementById('navFlashcard'),
        quiz: document.getElementById('navQuiz')
    };

    Object.values(screens).forEach(screen => screen.style.display = 'none');
    Object.values(navs).forEach(nav => nav.classList.remove('active'));

    screens[tabName].style.display = 'block';
    navs[tabName].classList.add('active');

    document.getElementById('themeMenu').style.display = 'none';

    if (tabName === 'flashcard') loadFlashcard();
    if (tabName === 'quiz') startQuiz();
    if (tabName === 'home') updateHomeStats();
    if (tabName === 'words') displayWords(vocabularyData); 
}

// ১. ডেটা লোড
async function loadData() {
    try {
        const response = await fetch('data.json');
        vocabularyData = await response.json();
        currentFlashcardData = vocabularyData;
        displayWords(vocabularyData);
        updateHomeStats();
    } catch (error) {
        document.getElementById('wordList').innerHTML = "<p style='text-align:center; color:red;'>ডেটা লোড করতে সমস্যা হচ্ছে!</p>";
    }
}

// হোম স্ক্রিন আপডেট
function updateHomeStats() {
    let checkedWords = JSON.parse(localStorage.getItem('checkedWords')) || [];
    
    document.getElementById('totalLearned').innerText = checkedWords.length;

    const levels = ['A1', 'A2', 'B1', 'B2', 'C1'];
    levels.forEach(level => {
        const totalInLevel = vocabularyData.filter(item => item.level === level).length;
        const checkedInLevel = vocabularyData.filter(item => item.level === level && checkedWords.includes(item.id)).length;

        const countElement = document.getElementById(`count${level}`);
        const progressElement = document.getElementById(`prog${level}`);

        if (countElement && progressElement) {
            countElement.innerText = `${checkedInLevel}/${totalInLevel}`;
            let percentage = totalInLevel === 0 ? 0 : (checkedInLevel / totalInLevel) * 100;
            progressElement.style.width = `${percentage}%`;
        }
    });
}

// হোম থেকে ফিল্টার
function filterAndGo(level, status) {
    switchTab('words');
    let checkedWords = JSON.parse(localStorage.getItem('checkedWords')) || [];
    let filtered = [];
    if (status === 'learned') {
        filtered = vocabularyData.filter(item => item.level === level && checkedWords.includes(item.id));
    } else {
        filtered = vocabularyData.filter(item => item.level === level && !checkedWords.includes(item.id));
    }
    displayWords(filtered);
    const filterButtons = document.querySelectorAll('.alphabet-filter button');
    filterButtons.forEach(btn => btn.classList.remove('active'));
}

// ২. শব্দের তালিকা তৈরি
function displayWords(data) {
    const listContainer = document.getElementById('wordList');
    listContainer.innerHTML = '';

    if (data.length === 0) {
        listContainer.innerHTML = "<p style='text-align:center; color:#8b93a5; margin-top:20px;'>কোনো শব্দ পাওয়া যায়নি!</p>";
        return;
    }

    let checkedWords = JSON.parse(localStorage.getItem('checkedWords')) || [];

    data.forEach(item => {
        const card = document.createElement('div');
        card.className = 'word-card';

        let levelColor = '#2a3457';
        if (item.level === 'A1') levelColor = '#1e4d3a';
        if (item.level === 'A2') levelColor = '#1e3a4d';
        if (item.level === 'B1') levelColor = '#4d3a1e';
        if (item.level === 'B2') levelColor = '#4a2c2a';
        if (item.level === 'C1') levelColor = '#3a1e4d';

        const isChecked = checkedWords.includes(item.id);
        const checkIcon = isChecked ? 'check_box' : 'check_box_outline_blank';
        const checkColor = isChecked ? '#fbc02d' : '#8b93a5';

        const engSentence = item.english_sentence || "Example not available.";
        const banSentence = item.bangla_sentence || "উদাহরণ পাওয়া যায়নি।";
        const formatWords = (wordData) => Array.isArray(wordData) ? wordData.join(', ') : (wordData || "N/A");

        card.innerHTML = `
            <div class="card-header">
                <div class="word-info">
                    <span class="word-number">#${item.id}</span>
                    <div class="word-title-row">
                        <h3>${item.english}</h3>
                        <div class="tags">
                            <span class="level" style="background-color: ${levelColor}; color: #fff;">${item.level || 'A1'}</span>
                            <span class="pos">${item.pos}</span>
                        </div>
                    </div>
                    <button class="audio-btn" onclick="playAudio('${item.english}')"><span class="material-icons-round">volume_up</span> Pronounce</button>
                </div>
                <div class="checkbox" data-id="${item.id}" onclick="toggleCheck(this, ${item.id})">
                    <span class="material-icons-round" style="color: ${checkColor}">${checkIcon}</span>
                </div>
            </div>

            <div class="bangla-meaning">${item.bangla}</div>

            <button class="learn-more-btn" onclick="toggleDetails(this)">
                <span class="material-icons-round info-icon">info</span>
                <span class="btn-title">আরও জানুন</span>
                <span class="sub-text">উদাহরণ, সমার্থক শব্দ</span>
                <span class="material-icons-round arrow">chevron_right</span>
            </button>

            <div class="card-details">
                <p class="en-sentence">🇬🇧 ${engSentence}</p>
                <p class="bn-sentence">🇧🇩 ${banSentence}</p>
                <div class="extra-info">
                    <p><span class="highlight">সমার্থক শব্দ:</span> ${formatWords(item.synonyms)}</p>
                    <p><span class="highlight">বিপরীত শব্দ:</span> ${formatWords(item.antonyms)}</p>
                </div>
            </div>
        `;
        listContainer.appendChild(card);
    });
}

function toggleDetails(button) {
    const details = button.nextElementSibling;
    const arrow = button.querySelector('.arrow');
    if (details.style.display === 'block') {
        details.style.display = 'none';
        arrow.style.transform = 'rotate(0deg)';
    } else {
        details.style.display = 'block';
        arrow.style.transform = 'rotate(90deg)';
    }
}

// ৩. সার্চ
document.getElementById('searchInput').addEventListener('input', function(e) {
    const query = e.target.value.toLowerCase();
    const filteredData = vocabularyData.filter(item =>
        item.english.toLowerCase().includes(query) || item.bangla.includes(query) || item.id.toString().includes(query)
    );
    displayWords(filteredData);
});

// ৪. লেভেল ফিল্টার
function filterByLevel(level, btnElement) {
    const filterButtons = document.querySelectorAll('.alphabet-filter button');
    filterButtons.forEach(btn => btn.classList.remove('active'));
    btnElement.classList.add('active');

    if (level === 'All') {
        currentFlashcardData = vocabularyData;
    } else {
        currentFlashcardData = vocabularyData.filter(item => item.level === level);
    }
    displayWords(currentFlashcardData);
    
    // ফিল্টার চেঞ্জ করলে কার্ড শুরু থেকে দেখাবে
    currentCardIndex = 0;
    localStorage.setItem('lastFlashcardIndex', 0);
}

// ৫. চেকবক্স
function toggleCheck(element, wordId) {
    const icon = element.querySelector('.material-icons-round');
    let checkedWords = JSON.parse(localStorage.getItem('checkedWords')) || [];
    if (icon.innerText === 'check_box_outline_blank') {
        icon.innerText = 'check_box';
        icon.style.color = '#fbc02d';
        if (!checkedWords.includes(wordId)) checkedWords.push(wordId);
    } else {
        icon.innerText = 'check_box_outline_blank';
        icon.style.color = '#8b93a5';
        checkedWords = checkedWords.filter(id => id !== wordId);
    }
    localStorage.setItem('checkedWords', JSON.stringify(checkedWords));
    updateHomeStats();
}

// ================= ফ্ল্যাশকার্ড =================
function loadFlashcard() {
    if (currentFlashcardData.length === 0) currentFlashcardData = vocabularyData;
    if (currentFlashcardData.length === 0) return;

    // সেভ করা কার্ড ইন্ডেক্স লোড করা (নতুন যোগ করা অংশ)
    let savedIndex = localStorage.getItem('lastFlashcardIndex');
    if (savedIndex !== null && currentFlashcardData.length > 0) {
        currentCardIndex = parseInt(savedIndex);
        if (currentCardIndex >= currentFlashcardData.length) currentCardIndex = 0;
    }

    document.getElementById('flashcard').classList.remove('flipped');
    const currentWord = currentFlashcardData[currentCardIndex];

    document.getElementById('fcEnglish').innerText = currentWord.english;
    document.getElementById('fcBangla').innerText = currentWord.bangla;
    document.getElementById('fcSentence').innerText = currentWord.english_sentence || "";
    document.getElementById('fcBanglaSentence').innerText = currentWord.bangla_sentence || "";

    document.getElementById('btnLearned').classList.remove('active-status');
    document.getElementById('btnNotLearned').classList.remove('active-status');
    
    const iconNotLearned = document.getElementById('iconNotLearned');
    const iconLearned = document.getElementById('iconLearned');
    if(iconNotLearned) iconNotLearned.classList.remove('show');
    if(iconLearned) iconLearned.classList.remove('show');

    let checkedWords = JSON.parse(localStorage.getItem('checkedWords')) || [];
    if (checkedWords.includes(currentWord.id)) {
        document.getElementById('btnLearned').classList.add('active-status');
        currentFlashcardStatus = true;
        if(iconLearned) iconLearned.classList.add('show'); 
    } else {
        document.getElementById('btnNotLearned').classList.add('active-status');
        currentFlashcardStatus = false;
    }
}

function flipCard() {
    document.getElementById('flashcard').classList.toggle('flipped');
}

function toggleFlashcardStatus(isLearned) {
    currentFlashcardStatus = isLearned;
    
    const iconNotLearned = document.getElementById('iconNotLearned');
    const iconLearned = document.getElementById('iconLearned');

    if (isLearned) {
        document.getElementById('btnLearned').classList.add('active-status');
        document.getElementById('btnNotLearned').classList.remove('active-status');
        if(iconLearned) iconLearned.classList.add('show');
        if(iconNotLearned) iconNotLearned.classList.remove('show');
    } else {
        document.getElementById('btnNotLearned').classList.add('active-status');
        document.getElementById('btnLearned').classList.remove('active-status');
        if(iconNotLearned) iconNotLearned.classList.add('show');
        if(iconLearned) iconLearned.classList.remove('show');
    }

    if (currentFlashcardData.length > 0) {
        const currentWord = currentFlashcardData[currentCardIndex];
        let checkedWords = JSON.parse(localStorage.getItem('checkedWords')) || [];

        if (isLearned === true) {
            if (!checkedWords.includes(currentWord.id)) checkedWords.push(currentWord.id);
        } else if (isLearned === false) {
            checkedWords = checkedWords.filter(id => id !== currentWord.id);
        }

        localStorage.setItem('checkedWords', JSON.stringify(checkedWords));
        
        if(typeof updateHomeStats === 'function') {
            updateHomeStats();
        }
    }
}

function saveFlashcardStatusAndMove() {
    if (currentFlashcardData.length === 0) return;

    const currentWord = currentFlashcardData[currentCardIndex];
    let checkedWords = JSON.parse(localStorage.getItem('checkedWords')) || [];

    if (currentFlashcardStatus === true) {
        if (!checkedWords.includes(currentWord.id)) checkedWords.push(currentWord.id);
    } else if (currentFlashcardStatus === false) {
        checkedWords = checkedWords.filter(id => id !== currentWord.id);
    }

    localStorage.setItem('checkedWords', JSON.stringify(checkedWords));
    updateHomeStats();
}

function nextCard() {
    saveFlashcardStatusAndMove();
    if (currentCardIndex < currentFlashcardData.length - 1) currentCardIndex++;
    else currentCardIndex = 0;
    
    // পরবর্তী কার্ডে গেলে ইন্ডেক্স সেভ করা (নতুন যোগ করা অংশ)
    localStorage.setItem('lastFlashcardIndex', currentCardIndex);
    loadFlashcard();
}

function prevCard() {
    saveFlashcardStatusAndMove();
    if (currentCardIndex > 0) currentCardIndex--;
    
    // পূর্ববর্তী কার্ডে গেলে ইন্ডেক্স সেভ করা (নতুন যোগ করা অংশ)
    localStorage.setItem('lastFlashcardIndex', currentCardIndex);
    loadFlashcard();
}

// ================= কুইজ =================
function startQuiz() {
    if (vocabularyData.length < 4) {
        document.getElementById('quizWord').innerText = "কুইজের জন্য আরও ডেটা দরকার!";
        return;
    }

    document.getElementById('nextQuizBtn').style.display = 'none';
    const optionsContainer = document.getElementById('optionsContainer');
    optionsContainer.innerHTML = '';

    const randomIndex = Math.floor(Math.random() * vocabularyData.length);
    const correctWord = vocabularyData[randomIndex];

    let wrongOptions = [];
    while (wrongOptions.length < 3) {
        const randIdx = Math.floor(Math.random() * vocabularyData.length);
        const wrongWord = vocabularyData[randIdx];
        if (wrongWord.id !== correctWord.id && !wrongOptions.includes(wrongWord.bangla)) {
            wrongOptions.push(wrongWord.bangla);
        }
    }

    let allOptions = [correctWord.bangla, ...wrongOptions];
    allOptions.sort(() => Math.random() - 0.5);

    document.getElementById('quizWord').innerText = correctWord.english;

    allOptions.forEach(option => {
        const btn = document.createElement('button');
        btn.className = 'option-btn glass-effect';
        btn.innerText = option;
        btn.onclick = () => checkAnswer(btn, option, correctWord.bangla);
        optionsContainer.appendChild(btn);
    });
}

function checkAnswer(selectedBtn, selectedOption, correctOption) {
    const allBtns = document.querySelectorAll('.option-btn');
    allBtns.forEach(btn => btn.style.pointerEvents = 'none');

    if (selectedOption === correctOption) {
        selectedBtn.classList.add('correct');
        quizScore += 10;
        document.getElementById('score').innerText = quizScore;
    } else {
        selectedBtn.classList.add('wrong');
        allBtns.forEach(btn => {
            if (btn.innerText === correctOption) btn.classList.add('correct');
        });
    }
    document.getElementById('nextQuizBtn').style.display = 'block';
}

function nextQuiz() { startQuiz(); }

// অ্যাপ চালু
window.onload = function() {
    loadTheme();
    loadData();
    switchTab('home');
};
