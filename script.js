class BookAI {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.currentBook = null;
        this.selectedChapters = new Set();
        this.bookAnalysis = null;
    }

    initializeElements() {
        this.bookTitleInput = document.getElementById('bookTitle');
        this.searchBtn = document.getElementById('searchBtn');
        
        this.bookInfo = document.getElementById('bookInfo');
        this.bookCover = document.getElementById('bookCover');
        this.bookName = document.getElementById('bookName');
        this.bookAuthor = document.getElementById('bookAuthor');
        this.bookDescription = document.getElementById('bookDescription');
        this.bookYear = document.getElementById('bookYear');
        this.bookPages = document.getElementById('bookPages');
        this.bookRating = document.getElementById('bookRating');
        
        this.chaptersList = document.getElementById('chaptersList');
        this.selectAllBtn = document.getElementById('selectAllBtn');
        this.deselectAllBtn = document.getElementById('deselectAllBtn');
        this.analyzeChaptersBtn = document.getElementById('analyzeChaptersBtn');
        
        this.loading = document.getElementById('loading');
        this.loadingText = document.getElementById('loadingText');
        this.analysisResult = document.getElementById('analysisResult');
        this.analysisStats = document.getElementById('analysisStats');
        this.chaptersSummary = document.getElementById('chaptersSummary');
        this.characters = document.getElementById('characters');
        this.keyPoints = document.getElementById('keyPoints');
        
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
        
        this.selectAllBtn.addEventListener('click', () => this.selectAllChapters());
        this.deselectAllBtn.addEventListener('click', () => this.deselectAllChapters());
        this.analyzeChaptersBtn.addEventListener('click', () => this.analyzeSelectedChapters());
        
        this.askBtn.addEventListener('click', () => this.askQuestion());
        this.questionInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.askQuestion();
        });
    }

    async searchBook() {
        const query = this.bookTitleInput.value.trim();
        
        if (!query) {
            this.showError('Пожалуйста, введите название книги');
            return;
        }

        this.showLoading('Ищу книгу в Google Books...');
        this.hideError();
        this.searchBtn.disabled = true;

        try {
            const bookData = await this.searchGoogleBooks(query);
            
            if (bookData) {
                this.currentBook = bookData;
                this.displayBookInfo(bookData);
                this.generateChaptersList(bookData);
                this.bookInfo.classList.remove('hidden');
                
                // Скрываем предыдущие результаты
                this.analysisResult.classList.add('hidden');
                this.qaSection.classList.add('hidden');
            } else {
                this.showError('Книга не найдена. Попробуйте другое название');
            }
        } catch (error) {
            this.showError('Ошибка при поиске: ' + error.message);
            console.error(error);
        } finally {
            this.hideLoading();
            this.searchBtn.disabled = false;
        }
    }

    async searchGoogleBooks(query) {
        try {
            const response = await fetch(
                `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=5`
            );
            
            if (!response.ok) throw new Error('Ошибка подключения к Google Books');
            
            const data = await response.json();
            if (!data.items || data.items.length === 0) return null;

            const bookItem = data.items[0];
            const bookInfo = bookItem.volumeInfo;

            return {
                title: bookInfo.title || 'Неизвестно',
                author: bookInfo.authors ? bookInfo.authors.join(', ') : 'Автор неизвестен',
                description: bookInfo.description || 'Описание отсутствует',
                year: bookInfo.publishedDate ? bookInfo.publishedDate.substring(0, 4) : 'Неизвестен',
                pages: bookInfo.pageCount || 'Неизвестно',
                rating: bookInfo.averageRating ? `⭐ ${bookInfo.averageRating}/5` : 'Без рейтинга',
                cover: bookInfo.imageLinks ? 
                    bookInfo.imageLinks.thumbnail.replace('http://', 'https://') : 
                    this.generatePlaceholderCover(bookInfo.title),
                genre: bookInfo.categories ? bookInfo.categories[0] : 'Жанр не указан',
                source: 'Google Books',
                id: bookItem.id
            };
        } catch (error) {
            console.error('Google Books error:', error);
            return null;
        }
    }

    generateChaptersList(bookData) {
        const chapters = this.generateChaptersForBook(bookData);
        this.chaptersList.innerHTML = chapters.map((chapter, index) => `
            <div class="chapter-item" onclick="app.toggleChapter(${index})">
                <input type="checkbox" id="chapter-${index}">
                <label for="chapter-${index}">${chapter}</label>
            </div>
        `).join('');
        
        this.selectedChapters.clear();
    }

    generateChaptersForBook(bookData) {
        const pageCount = bookData.pages;
        let chapters = [];
        
        if (pageCount && pageCount > 50) {
            const chapterCount = Math.min(Math.floor(pageCount / 25), 12);
            for (let i = 1; i <= chapterCount; i++) {
                chapters.push(`Глава ${i}`);
            }
        } else {
            chapters = [
                'Глава 1 - Введение и завязка',
                'Глава 2 - Развитие сюжета', 
                'Глава 3 - Кульминация событий',
                'Глава 4 - Развязка и заключение'
            ];
        }
        
        return chapters;
    }

    toggleChapter(index) {
        const checkbox = document.getElementById(`chapter-${index}`);
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
        const checkboxes = this.chaptersList.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach((checkbox, index) => {
            checkbox.checked = true;
            this.selectedChapters.add(index);
            checkbox.closest('.chapter-item').classList.add('selected');
        });
    }

    deselectAllChapters() {
        const checkboxes = this.chaptersList.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach((checkbox, index) => {
            checkbox.checked = false;
            this.selectedChapters.delete(index);
            checkbox.closest('.chapter-item').classList.remove('selected');
        });
    }

    async analyzeSelectedChapters() {
        if (this.selectedChapters.size === 0) {
            this.showError('Пожалуйста, выберите хотя бы одну главу');
            return;
        }

        this.showLoading('Ищу информацию о книге в интернете...');
        this.analyzeChaptersBtn.disabled = true;

        try {
            const analysis = await this.searchBookAnalysis();
            this.bookAnalysis = analysis;
            this.displayAnalysis(analysis);
            this.analysisResult.classList.remove('hidden');
            this.qaSection.classList.remove('hidden');
        } catch (error) {
            this.showError('Ошибка анализа: ' + error.message);
        } finally {
            this.hideLoading();
            this.analyzeChaptersBtn.disabled = false;
        }
    }

    async searchBookAnalysis() {
        // Ищем информацию о книге в разных источниках
        const searchPromises = [
            this.searchBookSummary(),
            this.searchBookCharacters(),
            this.searchBookThemes()
        ];

        const results = await Promise.allSettled(searchPromises);
        
        const summary = results[0].status === 'fulfilled' ? results[0].value : null;
        const characters = results[1].status === 'fulfilled' ? results[1].value : null;
        const keyPoints = results[2].status === 'fulfilled' ? results[2].value : null;

        const selectedChaptersArray = Array.from(this.selectedChapters);
        const chapters = this.generateChaptersForBook(this.currentBook);
        const selectedChapterNames = selectedChaptersArray.map(index => chapters[index]);

        return {
            chaptersSummary: summary || this.generateFallbackSummary(selectedChapterNames),
            characters: characters || this.generateFallbackCharacters(),
            keyPoints: keyPoints || this.generateFallbackKeyPoints(selectedChapterNames),
            selectedChapters: selectedChapterNames,
            source: 'Сборный анализ из открытых источников'
        };
    }

    async searchBookSummary() {
        try {
            // Используем описание из Google Books
            if (this.currentBook.description && this.currentBook.description.length > 100) {
                return this.currentBook.description;
            }

            // Ищем дополнительные источники через поиск
            const searchQuery = `${this.currentBook.title} ${this.currentBook.author} краткое содержание`;
            const searchResults = await this.searchWeb(searchQuery);
            
            if (searchResults && searchResults.length > 0) {
                return searchResults[0].snippet || 'Информация о содержании найдена в поиске';
            }

            return null;
        } catch (error) {
            console.log('Summary search failed:', error);
            return null;
        }
    }

    async searchBookCharacters() {
        try {
            const searchQuery = `${this.currentBook.title} ${this.currentBook.author} персонажи герои`;
            const searchResults = await this.searchWeb(searchQuery);
            
            if (searchResults && searchResults.length > 0) {
                // Извлекаем имена из сниппетов поиска
                const characters = this.extractCharactersFromSearchResults(searchResults);
                return characters.length > 0 ? characters : null;
            }

            return null;
        } catch (error) {
            console.log('Characters search failed:', error);
            return null;
        }
    }

    async searchBookThemes() {
        try {
            const searchQuery = `${this.currentBook.title} ${this.currentBook.author} темы идеи анализ`;
            const searchResults = await this.searchWeb(searchQuery);
            
            if (searchResults && searchResults.length > 0) {
                const themes = this.extractThemesFromSearchResults(searchResults);
                return themes.length > 0 ? themes : null;
            }

            return null;
        } catch (error) {
            console.log('Themes search failed:', error);
            return null;
        }
    }

    async searchWeb(query) {
        try {
            // Используем Google Custom Search API или аналогичный сервис
            // Для демонстрации используем Google Books как fallback
            const response = await fetch(
                `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=3`
            );
            
            if (response.ok) {
                const data = await response.json();
                if (data.items && data.items.length > 0) {
                    return data.items.map(item => ({
                        title: item.volumeInfo.title,
                        snippet: item.volumeInfo.description,
                        link: item.volumeInfo.infoLink
                    }));
                }
            }
            return null;
        } catch (error) {
            console.log('Web search failed:', error);
            return null;
        }
    }

    extractCharactersFromSearchResults(results) {
        const characters = new Set();
        
        results.forEach(result => {
            if (result.snippet) {
                // Простой алгоритм извлечения имен собственных
                const words = result.snippet.split(/\s+/);
                words.forEach(word => {
                    if (word.length > 2 && /[А-Я][а-я]+/.test(word)) {
                        const cleanWord = word.replace(/[.,!?;:()]/g, '');
                        if (cleanWord.length > 2 && !this.isCommonWord(cleanWord)) {
                            characters.add(cleanWord);
                        }
                    }
                });
            }
        });

        return Array.from(characters).slice(0, 6).map(char => `${char} - упоминается в описании`);
    }

    extractThemesFromSearchResults(results) {
        const themes = new Set();
        const themeKeywords = {
            'любов': 'Тема любви и отношений',
            'войн': 'Военная тематика',
            'общест': 'Социальные вопросы',
            'нравствен': 'Нравственные проблемы',
            'религи': 'Религиозные темы',
            'семь': 'Семейные отношения',
            'власт': 'Тема власти',
            'свобод': 'Свобода и выбор'
        };

        results.forEach(result => {
            if (result.snippet) {
                const lowerSnippet = result.snippet.toLowerCase();
                for (const [keyword, theme] of Object.entries(themeKeywords)) {
                    if (lowerSnippet.includes(keyword)) {
                        themes.add(theme);
                    }
                }
            }
        });

        return Array.from(themes).slice(0, 4);
    }

    generateFallbackSummary(selectedChapters) {
        return `На основе информации о книге "${this.currentBook.title}" автора ${this.currentBook.author}. 
        
Выбраны главы: ${selectedChapters.join(', ')}. 

${this.currentBook.description || 'Для получения детального содержания выбранных глав рекомендуется ознакомиться с полным текстом произведения или найти специализированный анализ.'}`;
    }

    generateFallbackCharacters() {
        return [
            'Информация о персонажах требует изучения полного текста',
            'Рекомендуется найти анализ персонажей в литературных источниках'
        ];
    }

    generateFallbackKeyPoints(selectedChapters) {
        return [
            `Анализ ${selectedChapters.length} выбранных глав`,
            'Ключевые события развития сюжета',
            'Характеристика основных персонажей',
            'Основные конфликты и их развитие'
        ];
    }

    isCommonWord(word) {
        const commonWords = [
            'это', 'что', 'как', 'так', 'вот', 'был', 'сказал', 'глава', 'книга', 
            'роман', 'автор', 'который', 'очень', 'после', 'тогда', 'потом'
        ];
        return commonWords.includes(word.toLowerCase());
    }

    generatePlaceholderCover(title) {
        const encodedTitle = encodeURIComponent(title.substring(0, 20));
        return `https://via.placeholder.com/150x200/667eea/ffffff?text=${encodedTitle}`;
    }

    async askQuestion() {
        const question = this.questionInput.value.trim();
        
        if (!question) {
            this.showError('Пожалуйста, введите вопрос');
            return;
        }
        
        if (!this.currentBook || !this.bookAnalysis) {
            this.showError('Сначала проанализируйте главы книги');
            return;
        }

        this.askBtn.disabled = true;
        this.showLoading('Ищу ответ...');

        try {
            const answer = await this.generateAnswer(question);
            this.displayQA(question, answer);
            this.questionInput.value = '';
        } catch (error) {
            this.showError('Ошибка: ' + error.message);
        } finally {
            this.hideLoading();
            this.askBtn.disabled = false;
        }
    }

    async generateAnswer(question) {
        const lowerQuestion = question.toLowerCase();
        
        if (this.bookAnalysis) {
            if (lowerQuestion.includes('содержание') || lowerQuestion.includes('о чём') || lowerQuestion.includes('сюжет')) {
                return this.bookAnalysis.chaptersSummary;
            }

            if (lowerQuestion.includes('персонаж') || lowerQuestion.includes('герой')) {
                return 'Персонажи:\n\n• ' + this.bookAnalysis.characters.join('\n• ');
            }

            if (lowerQuestion.includes('ключевой') || lowerQuestion.includes('момент') || lowerQuestion.includes('событие')) {
                return 'Ключевые аспекты:\n\n• ' + this.bookAnalysis.keyPoints.join('\n• ');
            }

            if (lowerQuestion.includes('глава') || lowerQuestion.includes('часть')) {
                return 'Выбранные главы:\n\n• ' + this.bookAnalysis.selectedChapters.join('\n• ');
            }
        }

        // Общие вопросы о книге
        if (lowerQuestion.includes('кто автор') || lowerQuestion.includes('кто написал')) {
            return `Автор книги "${this.currentBook.title}" - ${this.currentBook.author || 'информация об авторе отсутствует'}.`;
        }

        if (lowerQuestion.includes('когда') || lowerQuestion.includes('год')) {
            return `Книга была опубликована в ${this.currentBook.year || 'неизвестном'} году.`;
        }

        if (lowerQuestion.includes('сколько страниц') || lowerQuestion.includes('объём')) {
            return `Объём книги: ${this.currentBook.pages || 'информация отсутствует'}.`;
        }

        return `На основе анализа книги "${this.currentBook.title}": ${this.bookAnalysis.chaptersSummary.substring(0, 200)}...`;
    }

    displayBookInfo(bookData) {
        this.bookCover.src = bookData.cover;
        this.bookCover.alt = bookData.title;
        this.bookName.textContent = bookData.title;
        this.bookAuthor.textContent = `Автор: ${bookData.author}`;
        this.bookDescription.textContent = bookData.description;
        this.bookYear.textContent = `Год: ${bookData.year}`;
        this.bookPages.textContent = `Страниц: ${bookData.pages}`;
        this.bookRating.textContent = bookData.rating;
    }

    displayAnalysis(analysis) {
        if (this.chaptersSummary) {
            this.chaptersSummary.innerHTML = `<p>${analysis.chaptersSummary}</p>`;
        }
        
        if (this.characters) {
            this.characters.innerHTML = analysis.characters.map(character => 
                `<div class="character-item">${character}</div>`
            ).join('');
        }
        
        if (this.keyPoints) {
            this.keyPoints.innerHTML = analysis.keyPoints.map(point => 
                `<div class="key-point">${point}</div>`
            ).join('');
        }
        
        if (this.analysisStats) {
            this.analysisStats.textContent = `Проанализировано глав: ${analysis.selectedChapters.length} | Источник: ${analysis.source}`;
        }
    }

    displayQA(question, answer) {
        const qaItem = document.createElement('div');
        qaItem.className = 'qa-item';
        qaItem.innerHTML = `
            <div class="question">❓ ${question}</div>
            <div class="answer">🤖 ${answer}</div>
            <div class="source-info">Ответ на основе анализа ${this.bookAnalysis.selectedChapters.length} глав</div>
        `;
        
        this.qaResults.prepend(qaItem);
    }

    showLoading(text = 'Загрузка...') {
        this.loadingText.textContent = text;
        this.loading.classList.remove('hidden');
    }

    hideLoading() {
        this.loading.classList.add('hidden');
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.classList.remove('hidden');
        this.errorMessage.scrollIntoView({ behavior: 'smooth' });
    }

    hideError() {
        this.errorMessage.classList.add('hidden');
    }
}

// Инициализация приложения
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new BookAI();
    console.log('BookAI initialized - реальный поиск анализа');
});
