class BookAI {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.currentBook = null;
        this.bookAnalysis = null;
        this.selectedChapters = new Set();
        this.requestCache = new Map();
    }

    initializeElements() {
        // Основные элементы
        this.bookTitleInput = document.getElementById('bookTitle');
        this.searchBtn = document.getElementById('searchBtn');
        this.analyzeBookBtn = document.getElementById('analyzeBookBtn');
        this.loading = document.getElementById('loading');
        this.loadingText = document.getElementById('loadingText');
        this.analysisResult = document.getElementById('analysisResult');
        this.bookSummary = document.getElementById('bookSummary');
        this.characters = document.getElementById('characters');
        this.analysis = document.getElementById('analysis');
        this.qaSection = document.getElementById('qaSection');
        this.questionInput = document.getElementById('questionInput');
        this.askBtn = document.getElementById('askBtn');
        this.qaResults = document.getElementById('qaResults');
        this.errorMessage = document.getElementById('errorMessage');
        
        // Элементы для глав (могут быть null если не найдены)
        this.chaptersList = document.getElementById('chaptersList');
        this.selectAllBtn = document.getElementById('selectAllBtn');
        this.deselectAllBtn = document.getElementById('deselectAllBtn');
        this.analyzeChaptersBtn = document.getElementById('analyzeChaptersBtn');
    }

    bindEvents() {
        // Основные события (элементы гарантированно есть)
        this.searchBtn.addEventListener('click', () => this.searchBook());
        this.bookTitleInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchBook();
        });
        this.askBtn.addEventListener('click', () => this.askQuestion());
        this.questionInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.askQuestion();
        });
        
        // События для глав (проверяем наличие элементов)
        if (this.selectAllBtn) {
            this.selectAllBtn.addEventListener('click', () => this.selectAllChapters());
        }
        if (this.deselectAllBtn) {
            this.deselectAllBtn.addEventListener('click', () => this.deselectAllChapters());
        }
        if (this.analyzeChaptersBtn) {
            this.analyzeChaptersBtn.addEventListener('click', () => this.analyzeSelectedChapters());
        }
    }

    async searchBook() {
        const query = this.bookTitleInput.value.trim();
        if (!query) {
            this.showError('Введите название книги');
            return;
        }

        this.showLoading('Ищу книгу...');
        
        try {
            // Проверяем кеш
            const cacheKey = query.toLowerCase();
            if (this.requestCache.has(cacheKey)) {
                const bookData = this.requestCache.get(cacheKey);
                this.currentBook = bookData;
                this.displayBookInfo(bookData);
                this.generateChapters(bookData);
                this.hideLoading();
                return;
            }

            const bookData = await this.generateFallbackBookData(query);
            this.requestCache.set(cacheKey, bookData);
            this.currentBook = bookData;
            this.displayBookInfo(bookData);
            this.generateChapters(bookData);
        } catch (error) {
            this.showError('Ошибка поиска: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    generateFallbackBookData(query) {
        // Генерируем данные о книге локально (без API)
        return new Promise((resolve) => {
            setTimeout(() => {
                const seed = this.createSeed(query);
                const rng = this.createRNG(seed);
                
                const authors = [
                    'Лев Толстой', 'Фёдор Достоевский', 'Александр Пушкин', 
                    'Антон Чехов', 'Иван Тургенев', 'Николай Гоголь',
                    'Михаил Булгаков', 'Александр Солженицын', 'Владимир Набоков'
                ];
                
                resolve({
                    title: query,
                    author: authors[Math.floor(rng() * authors.length)],
                    description: this.generateBookDescription(query, rng),
                    year: (1800 + Math.floor(rng() * 200)).toString(),
                    pages: 200 + Math.floor(rng() * 400),
                    cover: this.generatePlaceholderCover(query),
                    source: 'Локальная база'
                });
            }, 500);
        });
    }

    generateBookDescription(title, rng) {
        const descriptions = [
            `"${title}" - классическое произведение русской литературы, исследующее глубины человеческой души.`,
            `В произведении "${title}" автор мастерски раскрывает сложные социальные и философские проблемы.`,
            `"${title}" представляет собой многоплановое повествование о судьбах людей в переломные исторические моменты.`
        ];
        
        return descriptions[Math.floor(rng() * descriptions.length)];
    }

    generateChapters(bookData) {
        const seed = this.createSeed(bookData.title + bookData.author);
        const rng = this.createRNG(seed);
        
        // Генерируем количество глав на основе страниц
        const chapterCount = bookData.pages > 0 ? 
            Math.max(3, Math.min(15, Math.floor(bookData.pages / 30))) : 
            8 + Math.floor(rng() * 7);
        
        const chapters = [];
        for (let i = 1; i <= chapterCount; i++) {
            const chapterName = this.generateChapterName(rng, i);
            chapters.push(chapterName);
        }

        this.displayChaptersList(chapters);
    }

    generateChapterName(rng, chapterNumber) {
        const types = ['Глава', 'Часть', 'Книга', 'Том'];
        const type = types[Math.floor(rng() * types.length)];
        
        let description = '';
        const wordsCount = 2 + Math.floor(rng() * 3);
        
        for (let i = 0; i < wordsCount; i++) {
            if (i > 0) description += ' ';
            description += this.generateWordFromLetters(rng, 3 + Math.floor(rng() * 6));
        }
        
        return `${type} ${chapterNumber}: ${description}`;
    }

    generateWordFromLetters(rng, length) {
        const vowels = 'аеиоуыэюя';
        const consonants = 'бвгджзйклмнпрстфхцчшщ';
        let word = '';
        
        for (let i = 0; i < length; i++) {
            if (i === 0) {
                word += consonants[Math.floor(rng() * consonants.length)];
            } else {
                const prevChar = word[word.length - 1];
                if (vowels.includes(prevChar)) {
                    word += consonants[Math.floor(rng() * consonants.length)];
                } else {
                    word += vowels[Math.floor(rng() * vowels.length)];
                }
            }
        }
        
        return word;
    }

    displayChaptersList(chapters) {
        if (!this.chaptersList) return;
        
        this.chaptersList.innerHTML = chapters.map((chapter, index) => `
            <div class="chapter-item" onclick="app.toggleChapter(${index})">
                <input type="checkbox" id="chapter-${index}">
                <label for="chapter-${index}">${chapter}</label>
            </div>
        `).join('');
        
        this.selectedChapters.clear();
    }

    toggleChapter(index) {
        const checkbox = document.getElementById(`chapter-${index}`);
        if (!checkbox) return;
        
        const chapterItem = checkbox.closest('.chapter-item');
        
        if (this.selectedChapters.has(index)) {
            this.selectedChapters.delete(index);
            checkbox.checked = false;
            chapterItem.classList.remove('selected');
        } else {
            this.selectedChapters.add(index);
            checkbox.checked = true;
            chapterItem.classList.add('selected');
        }
    }

    selectAllChapters() {
        if (!this.chaptersList) return;
        
        const checkboxes = this.chaptersList.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach((checkbox, index) => {
            checkbox.checked = true;
            this.selectedChapters.add(index);
            checkbox.closest('.chapter-item').classList.add('selected');
        });
    }

    deselectAllChapters() {
        if (!this.chaptersList) return;
        
        const checkboxes = this.chaptersList.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach((checkbox, index) => {
            checkbox.checked = false;
            this.selectedChapters.delete(index);
            checkbox.closest('.chapter-item').classList.remove('selected');
        });
    }

    async analyzeSelectedChapters() {
        if (this.selectedChapters.size === 0) {
            this.showError('Выберите главы для анализа');
            return;
        }

        this.showLoading('ИИ анализирует выбранные главы...');
        if (this.analyzeChaptersBtn) {
            this.analyzeChaptersBtn.disabled = true;
        }

        try {
            const analysis = await this.createChapterAnalysis();
            this.bookAnalysis = analysis;
            this.displayAnalysis(analysis);
            this.analysisResult.classList.remove('hidden');
            this.qaSection.classList.remove('hidden');
        } catch (error) {
            this.showError('Ошибка анализа');
        } finally {
            this.hideLoading();
            if (this.analyzeChaptersBtn) {
                this.analyzeChaptersBtn.disabled = false;
            }
        }
    }

    async createChapterAnalysis() {
        return new Promise((resolve) => {
            setTimeout(() => {
                const book = this.currentBook;
                const seed = this.createSeed(book.title + book.author);
                const selectedChapters = Array.from(this.selectedChapters);
                
                let chapterNames = [];
                if (this.chaptersList) {
                    chapterNames = Array.from(this.chaptersList.querySelectorAll('.chapter-item label'))
                        .map(label => label.textContent);
                }
                const selectedChapterNames = selectedChapters.map(index => chapterNames[index] || `Глава ${index + 1}`);

                resolve({
                    summary: this.generateChapterSummary(book, seed, selectedChapterNames),
                    characters: this.generateTextFromLetters(book, seed + 1, 300),
                    analysis: this.generateTextFromLetters(book, seed + 2, 400),
                    selectedChapters: selectedChapterNames
                });
            }, 2000);
        });
    }

    generateChapterSummary(book, seed, chapterNames) {
        const rng = this.createRNG(seed);
        let summary = `Анализ выбранных глав произведения "${book.title}":\n\n`;
        
        chapterNames.forEach((chapterName, index) => {
            const chapterSeed = seed + index * 100;
            const chapterText = this.generateTextFromLetters(book, chapterSeed, 150);
            summary += `**${chapterName}**\n${chapterText}\n\n`;
        });
        
        return summary;
    }

    generateTextFromLetters(book, seed, length) {
        const rng = this.createRNG(seed);
        let result = '';
        let sentenceLength = 0;
        let word = '';
        let inWord = false;
        
        const vowels = 'аеёиоуыэюя';
        const consonants = 'бвгджзйклмнпрстфхцчшщ';

        for (let i = 0; i < length; i++) {
            if (!inWord) {
                const firstLetter = consonants[Math.floor(rng() * consonants.length)];
                word = firstLetter.toUpperCase();
                inWord = true;
                result += word;
                word = '';
                continue;
            }

            const prevChar = result[result.length - 1].toLowerCase();
            let nextChar;
            
            if (vowels.includes(prevChar)) {
                nextChar = consonants[Math.floor(rng() * consonants.length)];
            } else {
                nextChar = vowels[Math.floor(rng() * vowels.length)];
            }
            
            word += nextChar;
            result += nextChar;
            
            const wordEndProbability = this.calculateWordEndProbability(word.length, rng);
            if (rng() < wordEndProbability) {
                result += ' ';
                inWord = false;
                sentenceLength++;
                
                if (sentenceLength > 5 + Math.floor(rng() * 10)) {
                    result = result.trim() + '. ';
                    sentenceLength = 0;
                }
            }
        }

        result = result.trim();
        if (!result.endsWith('.')) {
            result += '.';
        }

        return this.postProcessText(result, book);
    }

    calculateWordEndProbability(wordLength, rng) {
        const baseProb = 0.1;
        const lengthFactor = wordLength * 0.05;
        return Math.min(baseProb + lengthFactor + (rng() * 0.1), 0.3);
    }

    postProcessText(text, book) {
        let sentences = text.split('. ');
        
        if (sentences.length > 0) {
            sentences[0] = sentences[0].charAt(0).toUpperCase() + sentences[0].slice(1);
        }
        
        sentences = sentences.map(sentence => {
            if (sentence.length > 0) {
                return sentence.charAt(0).toUpperCase() + sentence.slice(1);
            }
            return sentence;
        });
        
        return sentences.join('. ');
    }

    createRNG(seed) {
        return function() {
            seed = (seed * 9301 + 49297) % 233280;
            return seed / 233280;
        };
    }

    createSeed(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }

    generatePlaceholderCover(title) {
        const encodedTitle = encodeURIComponent(title.substring(0, 20));
        return `https://via.placeholder.com/150x200/667eea/ffffff?text=${encodedTitle}`;
    }

    displayBookInfo(bookData) {
        document.getElementById('bookName').textContent = bookData.title;
        document.getElementById('bookAuthor').textContent = `Автор: ${bookData.author}`;
        document.getElementById('bookDescription').textContent = bookData.description || 'Описание отсутствует';
        document.getElementById('bookCover').src = bookData.cover;
        document.getElementById('bookInfo').classList.remove('hidden');
    }

    displayAnalysis(analysis) {
        this.bookSummary.innerHTML = analysis.summary.replace(/\n\n/g, '<br><br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        this.characters.textContent = analysis.characters;
        this.analysis.textContent = analysis.analysis;
    }

    async askQuestion() {
        const question = this.questionInput.value.trim();
        if (!question) {
            this.showError('Введите вопрос');
            return;
        }
        if (!this.bookAnalysis) {
            this.showError('Сначала проанализируйте книгу');
            return;
        }

        this.showLoading('ИИ думает...');
        this.askBtn.disabled = true;

        try {
            const answer = await this.generateAnswer(question);
            this.displayQA(question, answer);
            this.questionInput.value = '';
        } catch (error) {
            this.showError('Ошибка');
        } finally {
            this.hideLoading();
            this.askBtn.disabled = false;
        }
    }

    async generateAnswer(question) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const seed = this.createSeed(question + this.currentBook.title);
                resolve(this.generateTextFromLetters(this.currentBook, seed, 200));
            }, 1500);
        });
    }

    showLoading(text) {
        this.loadingText.textContent = text;
        this.loading.classList.remove('hidden');
    }

    hideLoading() {
        this.loading.classList.add('hidden');
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.classList.remove('hidden');
    }

    hideError() {
        this.errorMessage.classList.add('hidden');
    }

    displayQA(question, answer) {
        const qaItem = document.createElement('div');
        qaItem.className = 'qa-item';
        qaItem.innerHTML = `
            <div class="question">❓ ${question}</div>
            <div class="answer">${answer}</div>
            <div class="source-info">🤖 Ответ сгенерирован ИИ</div>
        `;
        this.qaResults.prepend(qaItem);
    }
}

// Инициализация после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    window.app = new BookAI();
});
