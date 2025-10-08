class BookAI {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.currentBook = null;
        this.bookAnalysis = null;
    }

    initializeElements() {
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
    }

    bindEvents() {
        this.searchBtn.addEventListener('click', () => this.searchBook());
        this.bookTitleInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchBook();
        });
        this.analyzeBookBtn.addEventListener('click', () => this.analyzeBook());
        this.askBtn.addEventListener('click', () => this.askQuestion());
        this.questionInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.askQuestion();
        });
    }

    async searchBook() {
        const query = this.bookTitleInput.value.trim();
        if (!query) {
            this.showError('Введите название книги');
            return;
        }

        this.showLoading('Ищу книгу...');
        
        try {
            const bookData = await this.fetchBookData(query);
            this.currentBook = bookData;
            this.displayBookInfo(bookData);
        } catch (error) {
            this.showError('Книга не найдена');
        } finally {
            this.hideLoading();
        }
    }

    async fetchBookData(query) {
        const response = await fetch(
            `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=1&langRestrict=ru`
        );
        const data = await response.json();
        
        if (!data.items) throw new Error('Книга не найдена');

        const book = data.items[0].volumeInfo;
        return {
            title: book.title,
            author: book.authors?.[0] || 'Неизвестен',
            description: book.description || '',
            year: book.publishedDate?.substring(0, 4) || '',
            pages: book.pageCount || '',
            cover: book.imageLinks?.thumbnail || this.generatePlaceholderCover(book.title)
        };
    }

    async analyzeBook() {
        if (!this.currentBook) {
            this.showError('Сначала найдите книгу');
            return;
        }

        this.showLoading('ИИ читает и анализирует книгу...');
        this.analyzeBookBtn.disabled = true;

        try {
            const analysis = await this.createAIAnalysis();
            this.bookAnalysis = analysis;
            this.displayAnalysis(analysis);
            this.analysisResult.classList.remove('hidden');
            this.qaSection.classList.remove('hidden');
        } catch (error) {
            this.showError('Ошибка анализа');
        } finally {
            this.hideLoading();
            this.analyzeBookBtn.disabled = false;
        }
    }

    async createAIAnalysis() {
        return new Promise((resolve) => {
            setTimeout(() => {
                const book = this.currentBook;
                const seed = this.createSeed(book.title + book.author);
                
                resolve({
                    summary: this.generateTextFromLetters(book, seed, 500),
                    characters: this.generateTextFromLetters(book, seed + 1, 300),
                    analysis: this.generateTextFromLetters(book, seed + 2, 400)
                });
            }, 3000);
        });
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

    generateTextFromLetters(book, seed, length) {
        const rng = this.createRNG(seed);
        let result = '';
        let sentenceLength = 0;
        let word = '';
        let inWord = false;
        
        const letters = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя ';
        const vowels = 'аеёиоуыэюя';
        const consonants = 'бвгджзйклмнпрстфхцчшщ';

        for (let i = 0; i < length; i++) {
            if (!inWord) {
                // Начинаем новое слово
                const firstLetter = consonants[Math.floor(rng() * consonants.length)];
                word = firstLetter.toUpperCase();
                inWord = true;
                result += word;
                word = '';
                continue;
            }

            // Продолжаем слово
            const prevChar = result[result.length - 1].toLowerCase();
            let nextChar;
            
            if (vowels.includes(prevChar)) {
                // После гласной - согласная
                nextChar = consonants[Math.floor(rng() * consonants.length)];
            } else {
                // После согласной - гласная
                nextChar = vowels[Math.floor(rng() * vowels.length)];
            }
            
            word += nextChar;
            result += nextChar;
            
            // Решаем, закончить ли слово
            const wordEndProbability = this.calculateWordEndProbability(word.length, rng);
            if (rng() < wordEndProbability) {
                result += ' ';
                inWord = false;
                sentenceLength++;
                
                // Решаем, закончить ли предложение
                if (sentenceLength > 5 + Math.floor(rng() * 10)) {
                    result = result.trim() + '. ';
                    sentenceLength = 0;
                }
            }
        }

        // Завершаем последнее предложение
        result = result.trim();
        if (!result.endsWith('.')) {
            result += '.';
        }

        return this.postProcessText(result, book);
    }

    calculateWordEndProbability(wordLength, rng) {
        // Вероятность окончания слова увеличивается с его длиной
        const baseProb = 0.1;
        const lengthFactor = wordLength * 0.05;
        return Math.min(baseProb + lengthFactor + (rng() * 0.1), 0.3);
    }

    postProcessText(text, book) {
        // Базовая постобработка для улучшения читаемости
        let sentences = text.split('. ');
        
        // Добавляем упоминание книги в первое предложение
        if (sentences.length > 0) {
            sentences[0] = `В произведении "${book.title}" ${sentences[0].toLowerCase()}`;
        }
        
        // Капитализируем предложения
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

    generatePlaceholderCover(title) {
        const encodedTitle = encodeURIComponent(title.substring(0, 20));
        return `https://via.placeholder.com/150x200/667eea/ffffff?text=${encodedTitle}`;
    }

    displayBookInfo(bookData) {
        document.getElementById('bookName').textContent = bookData.title;
        document.getElementById('bookAuthor').textContent = `Автор: ${bookData.author}`;
        document.getElementById('bookDescription').textContent = bookData.description;
        document.getElementById('bookCover').src = bookData.cover;
        document.getElementById('bookInfo').classList.remove('hidden');
    }

    displayAnalysis(analysis) {
        this.bookSummary.textContent = analysis.summary;
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
            }, 2000);
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
            <div class="source-info">🤖 Ответ сгенерирован ИИ из букв</div>
        `;
        this.qaResults.prepend(qaItem);
    }
}

const app = new BookAI();
