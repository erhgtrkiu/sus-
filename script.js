class BookAI {
    constructor() {
        this.currentBook = null;
        this.bookAnalysis = null;
        this.selectedChapters = new Set();
        
        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        this.elements = {};
        const ids = [
            'bookTitle', 'searchBtn', 'analyzeBookBtn', 'loading', 'loadingText',
            'analysisResult', 'bookSummary', 'characters', 'analysis', 'qaSection',
            'questionInput', 'askBtn', 'qaResults', 'errorMessage', 'chaptersList',
            'selectAllBtn', 'deselectAllBtn', 'analyzeChaptersBtn'
        ];
        
        ids.forEach(id => {
            this.elements[id] = document.getElementById(id);
        });
    }

    bindEvents() {
        const bind = (element, event, handler) => {
            if (element) element.addEventListener(event, handler);
        };

        bind(this.elements.searchBtn, 'click', () => this.searchBook());
        bind(this.elements.bookTitleInput, 'keypress', (e) => {
            if (e.key === 'Enter') this.searchBook();
        });
        bind(this.elements.analyzeBookBtn, 'click', () => this.analyzeBook());
        bind(this.elements.askBtn, 'click', () => this.askQuestion());
        bind(this.elements.questionInput, 'keypress', (e) => {
            if (e.key === 'Enter') this.askQuestion();
        });
        bind(this.elements.selectAllBtn, 'click', () => this.selectAllChapters());
        bind(this.elements.deselectAllBtn, 'click', () => this.deselectAllChapters());
        bind(this.elements.analyzeChaptersBtn, 'click', () => this.analyzeSelectedChapters());
    }

    async searchBook() {
        const query = this.elements.bookTitleInput.value.trim();
        if (!query) {
            this.showError('Введите название книги');
            return;
        }

        this.showLoading('ИИ создаёт книгу...');
        
        try {
            const bookData = await this.generateBookFromNothing(query);
            this.currentBook = bookData;
            this.displayBookInfo(bookData);
            this.generateChapters(bookData);
        } catch (error) {
            this.showError('Ошибка: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    async generateBookFromNothing(query) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const seed = this.createSeed(query);
                const rng = this.createRNG(seed);
                
                resolve({
                    title: query,
                    author: this.generateAuthorNameFromLetters(rng),
                    description: this.generateDescriptionFromLetters(rng),
                    year: this.generateYear(rng),
                    pages: this.generatePages(rng),
                    cover: this.generatePlaceholderCover(query)
                });
            }, 1000);
        });
    }

    generateAuthorNameFromLetters(rng) {
        // Генерируем имя и фамилию из букв без шаблонов
        const generateNamePart = (length) => {
            const consonants = 'бвгджзйклмнпрстфхцчшщ';
            const vowels = 'аеиоуыэюя';
            let name = '';
            
            for (let i = 0; i < length; i++) {
                if (i === 0) {
                    name += consonants[Math.floor(rng() * consonants.length)].toUpperCase();
                } else if (i % 2 === 0) {
                    name += vowels[Math.floor(rng() * vowels.length)];
                } else {
                    name += consonants[Math.floor(rng() * consonants.length)];
                }
            }
            return name;
        };

        return generateNamePart(3 + Math.floor(rng() * 3)) + ' ' + 
               generateNamePart(4 + Math.floor(rng() * 3)) + 'ов';
    }

    generateDescriptionFromLetters(rng) {
        const words = [];
        const wordCount = 15 + Math.floor(rng() * 10);
        
        for (let i = 0; i < wordCount; i++) {
            words.push(this.generateWord(rng, 2 + Math.floor(rng() * 6)));
        }
        
        // Собираем предложения
        let description = '';
        let sentenceLength = 0;
        
        for (let i = 0; i < words.length; i++) {
            if (i === 0) {
                description += words[i].charAt(0).toUpperCase() + words[i].slice(1);
            } else {
                description += ' ' + words[i];
            }
            
            sentenceLength++;
            
            if (sentenceLength >= 5 + Math.floor(rng() * 5) && i < words.length - 1) {
                description += '. ';
                sentenceLength = 0;
                if (i < words.length - 1) {
                    description += words[i + 1].charAt(0).toUpperCase() + words[i + 1].slice(1);
                    i++;
                }
            }
        }
        
        return description + '.';
    }

    generateWord(rng, length) {
        const consonants = 'бвгджзйклмнпрстфхцчшщ';
        const vowels = 'аеиоуыэюя';
        let word = '';
        
        for (let i = 0; i < length; i++) {
            if (i % 2 === 0) {
                word += consonants[Math.floor(rng() * consonants.length)];
            } else {
                word += vowels[Math.floor(rng() * vowels.length)];
            }
        }
        
        return word;
    }

    generateYear(rng) {
        return (1500 + Math.floor(rng() * 500)).toString();
    }

    generatePages(rng) {
        return 100 + Math.floor(rng() * 500);
    }

    generateChapters(bookData) {
        if (!this.elements.chaptersList) return;
        
        const seed = this.createSeed(bookData.title + bookData.author);
        const rng = this.createRNG(seed);
        
        const chapterCount = 5 + Math.floor(rng() * 10);
        const chapters = [];
        
        for (let i = 1; i <= chapterCount; i++) {
            chapters.push(this.generateChapterName(rng, i));
        }

        this.displayChaptersList(chapters);
    }

    generateChapterName(rng, number) {
        const types = this.generateWord(rng, 1) + 'лава';
        const descriptionWords = [];
        const wordCount = 2 + Math.floor(rng() * 3);
        
        for (let i = 0; i < wordCount; i++) {
            descriptionWords.push(this.generateWord(rng, 3 + Math.floor(rng() * 4)));
        }
        
        return `${types} ${number}: ${descriptionWords.join(' ')}`;
    }

    async analyzeBook() {
        if (!this.currentBook) {
            this.showError('Сначала найдите книгу');
            return;
        }

        this.showLoading('ИИ анализирует книгу...');
        if (this.elements.analyzeBookBtn) {
            this.elements.analyzeBookBtn.disabled = true;
        }

        try {
            const analysis = await this.createAIAnalysis();
            this.bookAnalysis = analysis;
            this.displayAnalysis(analysis);
            this.elements.analysisResult.classList.remove('hidden');
            this.elements.qaSection.classList.remove('hidden');
        } catch (error) {
            this.showError('Ошибка анализа');
        } finally {
            this.hideLoading();
            if (this.elements.analyzeBookBtn) {
                this.elements.analyzeBookBtn.disabled = false;
            }
        }
    }

    async createAIAnalysis() {
        return new Promise((resolve) => {
            setTimeout(() => {
                const book = this.currentBook;
                const seed = this.createSeed(book.title + book.author);

                resolve({
                    summary: this.generateNovelContent(book, seed),
                    characters: this.generateCharacters(book, seed),
                    analysis: this.generateLiteraryAnalysis(book, seed)
                });
            }, 3000);
        });
    }

    generateNovelContent(book, seed) {
        const rng = this.createRNG(seed);
        const paragraphs = [];
        
        for (let i = 0; i < 3; i++) {
            paragraphs.push(this.generateParagraph(rng, 50 + Math.floor(rng() * 50)));
        }
        
        return `Роман "${book.title}" рассказывает историю, которая начинается с того, что ${paragraphs[0]}\n\n${paragraphs[1]}\n\n${paragraphs[2]}`;
    }

    generateParagraph(rng, wordCount) {
        const words = [];
        for (let i = 0; i < wordCount; i++) {
            words.push(this.generateWord(rng, 2 + Math.floor(rng() * 6)));
        }
        
        let paragraph = '';
        let sentenceLength = 0;
        
        for (let i = 0; i < words.length; i++) {
            if (i === 0) {
                paragraph += words[i].charAt(0).toUpperCase() + words[i].slice(1);
            } else {
                paragraph += ' ' + words[i];
            }
            
            sentenceLength++;
            
            if (sentenceLength >= 7 + Math.floor(rng() * 5) && i < words.length - 1) {
                paragraph += '. ';
                sentenceLength = 0;
                if (i < words.length - 1) {
                    paragraph += words[i + 1].charAt(0).toUpperCase() + words[i + 1].slice(1);
                    i++;
                }
            }
        }
        
        return paragraph + '.';
    }

    generateCharacters(book, seed) {
        const rng = this.createRNG(seed);
        const characters = [];
        const count = 3 + Math.floor(rng() * 3);
        
        for (let i = 0; i < count; i++) {
            const name = this.generateAuthorNameFromLetters(rng);
            const description = this.generateCharacterDescription(rng);
            characters.push(`${name} - ${description}`);
        }
        
        return characters.join('\n');
    }

    generateCharacterDescription(rng) {
        const traits = [];
        const traitCount = 2 + Math.floor(rng() * 2);
        
        for (let i = 0; i < traitCount; i++) {
            traits.push(this.generateTrait(rng));
        }
        
        return traits.join(', ');
    }

    generateTrait(rng) {
        const patterns = [
            () => this.generateWord(rng, 3) + 'ый ' + this.generateWord(rng, 4) + 'ель',
            () => this.generateWord(rng, 2) + 'ый ' + this.generateWord(rng, 3) + 'ик',
            () => this.generateWord(rng, 4) + 'ющий ' + this.generateWord(rng, 3) + 'ство',
            () => this.generateWord(rng, 3) + 'ая ' + this.generateWord(rng, 4) + 'ница'
        ];
        
        return patterns[Math.floor(rng() * patterns.length)]();
    }

    generateLiteraryAnalysis(book, seed) {
        const rng = this.createRNG(seed);
        const analysisPoints = [];
        const pointCount = 4 + Math.floor(rng() * 2);
        
        for (let i = 0; i < pointCount; i++) {
            analysisPoints.push(this.generateAnalysisPoint(rng));
        }
        
        return analysisPoints.join('\n\n');
    }

    generateAnalysisPoint(rng) {
        const structures = [
            () => `Автор использует ${this.generateWord(rng, 3)} ${this.generateWord(rng, 4)} для раскрытия ${this.generateWord(rng, 3)} ${this.generateWord(rng, 4)}`,
            () => `В произведении прослеживается ${this.generateWord(rng, 4)} ${this.generateWord(rng, 3)} как отражение ${this.generateWord(rng, 3)} ${this.generateWord(rng, 4)}`,
            () => `Художественное своеобразие проявляется в ${this.generateWord(rng, 3)} ${this.generateWord(rng, 4)} и ${this.generateWord(rng, 3)} ${this.generateWord(rng, 4)}`
        ];
        
        return structures[Math.floor(rng() * structures.length)]();
    }

    // ... остальные методы (toggleChapter, selectAllChapters и т.д.) остаются без изменений

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
        this.elements.bookName.textContent = bookData.title;
        this.elements.bookAuthor.textContent = `Автор: ${bookData.author}`;
        this.elements.bookDescription.textContent = bookData.description;
        this.elements.bookCover.src = bookData.cover;
        this.elements.bookInfo.classList.remove('hidden');
    }

    displayAnalysis(analysis) {
        this.elements.bookSummary.textContent = analysis.summary;
        this.elements.characters.textContent = analysis.characters;
        this.elements.analysis.textContent = analysis.analysis;
    }

    async askQuestion() {
        const question = this.elements.questionInput.value.trim();
        if (!question) {
            this.showError('Введите вопрос');
            return;
        }
        if (!this.bookAnalysis) {
            this.showError('Сначала проанализируйте книгу');
            return;
        }

        this.showLoading('ИИ думает...');
        this.elements.askBtn.disabled = true;

        try {
            const answer = await this.generateAnswer(question);
            this.displayQA(question, answer);
            this.elements.questionInput.value = '';
        } catch (error) {
            this.showError('Ошибка');
        } finally {
            this.hideLoading();
            this.elements.askBtn.disabled = false;
        }
    }

    async generateAnswer(question) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const seed = this.createSeed(question + this.currentBook.title);
                const rng = this.createRNG(seed);
                resolve(this.generateParagraph(rng, 30 + Math.floor(rng() * 20)));
            }, 2000);
        });
    }

    showLoading(text) {
        this.elements.loadingText.textContent = text;
        this.elements.loading.classList.remove('hidden');
    }

    hideLoading() {
        this.elements.loading.classList.add('hidden');
    }

    showError(message) {
        this.elements.errorMessage.textContent = message;
        this.elements.errorMessage.classList.remove('hidden');
    }

    hideError() {
        this.elements.errorMessage.classList.add('hidden');
    }

    displayQA(question, answer) {
        const qaItem = document.createElement('div');
        qaItem.className = 'qa-item';
        qaItem.innerHTML = `
            <div class="question">❓ ${question}</div>
            <div class="answer">${answer}</div>
            <div class="source-info">🤖 Ответ сгенерирован ИИ из ничего</div>
        `;
        this.elements.qaResults.prepend(qaItem);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new BookAI();
});
