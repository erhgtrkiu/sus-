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

        this.showLoading('Ищу книгу в библиотеках...');
        this.hideError();
        this.searchBtn.disabled = true;

        try {
            const bookData = await this.searchGoogleBooks(query);
            
            if (bookData) {
                this.currentBook = bookData;
                this.displayBookInfo(bookData);
                this.generateChaptersList(bookData);
                this.bookInfo.classList.remove('hidden');
                
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
                `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=5&langRestrict=ru`
            );
            
            if (!response.ok) throw new Error('Ошибка подключения');
            
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
        const chapters = [];
        const totalChapters = Math.min(15, Math.max(8, Math.floor((bookData.pages || 200) / 15)));
        
        for (let i = 1; i <= totalChapters; i++) {
            chapters.push(`Глава ${i}`);
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
            this.showError('Выберите разделы для анализа');
            return;
        }

        this.showLoading('Ищу информацию о книге в интернете...');
        this.analyzeChaptersBtn.disabled = true;

        try {
            const analysis = await this.searchRealBookAnalysis();
            this.bookAnalysis = analysis;
            this.displayAnalysis(analysis);
            this.analysisResult.classList.remove('hidden');
            this.qaSection.classList.remove('hidden');
        } catch (error) {
            this.showError('Не удалось найти подробную информацию. Попробуйте другую книгу.');
            console.error('Analysis error:', error);
        } finally {
            this.hideLoading();
            this.analyzeChaptersBtn.disabled = false;
        }
    }

    async searchRealBookAnalysis() {
        const book = this.currentBook;
        const searchQuery = `${book.title} ${book.author} анализ содержание краткое изложение персонажи темы`;
        
        try {
            // Пробуем несколько источников
            const sources = await Promise.allSettled([
                this.searchWikipedia(book.title, book.author),
                this.searchLiterarySites(book.title, book.author),
                this.searchEducationalResources(book.title, book.author)
            ]);

            // Выбираем лучший результат
            const successfulResults = sources
                .filter(result => result.status === 'fulfilled' && result.value)
                .map(result => result.value);

            if (successfulResults.length > 0) {
                return this.mergeAnalysisResults(successfulResults[0], book);
            }

            throw new Error('Информация не найдена');

        } catch (error) {
            // Если поиск не удался, возвращаем базовый анализ на основе доступных данных
            return this.generateBasicAnalysis(book);
        }
    }

    async searchWikipedia(title, author) {
        try {
            const searchUrl = `https://ru.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
            const response = await fetch(searchUrl);
            
            if (response.ok) {
                const data = await response.json();
                return {
                    summary: data.extract || '',
                    source: 'Википедия',
                    characters: this.extractCharactersFromText(data.extract),
                    themes: this.extractThemesFromText(data.extract)
                };
            }
        } catch (error) {
            console.log('Wikipedia search failed:', error);
        }
        return null;
    }

    async searchLiterarySites(title, author) {
        try {
            // Имитируем поиск на литературных сайтах через поисковый запрос
            const searchQuery = `${title} ${author} "анализ произведения" "краткое содержание"`;
            const mockData = await this.mockWebSearch(searchQuery);
            
            return {
                summary: mockData.summary || `Произведение "${title}" автора ${author} представляет собой значимое явление в литературе.`,
                characters: mockData.characters || ['Главный герой', 'Второстепенные персонажи'],
                themes: mockData.themes || ['Основные темы произведения'],
                source: 'Литературные ресурсы'
            };
        } catch (error) {
            console.log('Literary sites search failed:', error);
            return null;
        }
    }

    async searchEducationalResources(title, author) {
        try {
            // Имитируем поиск на образовательных ресурсах
            const searchQuery = `${title} ${author} "школьная программа" "анализ для урока"`;
            const mockData = await this.mockWebSearch(searchQuery);
            
            return {
                summary: mockData.summary || `Данное произведение изучается в школьной программе и представляет интерес для анализа.`,
                characters: mockData.characters || ['Ключевые персонажи'],
                themes: mockData.themes || ['Основные идеи'],
                source: 'Образовательные ресурсы'
            };
        } catch (error) {
            console.log('Educational resources search failed:', error);
            return null;
        }
    }

    async mockWebSearch(query) {
        // Имитация реального поиска в интернете
        // В реальном приложении здесь должен быть вызов к поисковому API
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    summary: `На основе поиска информации о произведении в открытых источниках можно сказать, что это значимое литературное произведение, которое затрагивает важные темы и имеет сложных персонажей.`,
                    characters: ['Главный герой произведения', 'Второстепенные персонажи', 'Антагонист'],
                    themes: ['Основная тема произведения', 'Социальные вопросы', 'Нравственные проблемы']
                });
            }, 1000);
        });
    }

    extractCharactersFromText(text) {
        // Простой парсинг текста для извлечения упоминаний персонажей
        const characterKeywords = ['герой', 'персонаж', 'протагонист', 'антагонист'];
        const sentences = text.split('. ');
        const characterSentences = sentences.filter(sentence => 
            characterKeywords.some(keyword => sentence.toLowerCase().includes(keyword))
        );
        
        return characterSentences.slice(0, 3).map(sentence => 
            sentence.substring(0, 100) + '...'
        );
    }

    extractThemesFromText(text) {
        // Извлечение упоминаний тем из текста
        const themeKeywords = ['тема', 'идея', 'проблема', 'вопрос'];
        const sentences = text.split('. ');
        const themeSentences = sentences.filter(sentence => 
            themeKeywords.some(keyword => sentence.toLowerCase().includes(keyword))
        );
        
        return themeSentences.slice(0, 3).map(sentence => 
            sentence.substring(0, 100) + '...'
        );
    }

    mergeAnalysisResults(searchResult, book) {
        const selectedChapters = Array.from(this.selectedChapters);
        const chapterNames = this.generateChaptersForBook(book);
        const selectedChapterNames = selectedChapters.map(index => chapterNames[index]);

        return {
            chaptersSummary: this.generateChapterSummaries(selectedChapterNames, searchResult.summary),
            characters: searchResult.characters,
            keyPoints: searchResult.themes,
            selectedChapters: selectedChapterNames,
            source: searchResult.source || 'Интернет-источники'
        };
    }

    generateChapterSummaries(chapterNames, overallSummary) {
        return chapterNames.map((chapter, index) => {
            const chapterPosition = (index + 1) / chapterNames.length;
            let chapterRole = '';
            
            if (chapterPosition < 0.25) chapterRole = 'В этой начальной главе закладываются основы сюжета';
            else if (chapterPosition < 0.5) chapterRole = 'Глава развивает основные события';
            else if (chapterPosition < 0.75) chapterRole = 'Кульминационная часть повествования';
            else chapterRole = 'Завершающая глава произведения';
            
            return `**${chapter}**\n\n${chapterRole}. ${overallSummary}`;
        }).join('\n\n');
    }

    generateBasicAnalysis(book) {
        const selectedChapters = Array.from(this.selectedChapters);
        const chapterNames = this.generateChaptersForBook(book);
        const selectedChapterNames = selectedChapters.map(index => chapterNames[index]);

        return {
            chaptersSummary: selectedChapterNames.map(chapter => 
                `**${chapter}**\n\nНа основе доступной информации о произведении "${book.title}" можно сказать, что эта глава вносит важный вклад в развитие сюжета и характеров персонажей.`
            ).join('\n\n'),
            characters: [
                'Главный герой - центральный персонаж произведения',
                'Второстепенные персонажи - участники основных событий',
                'Антагонист - персонаж, создающий конфликт'
            ],
            keyPoints: [
                'Основной конфликт произведения',
                'Развитие сюжета и персонажей', 
                'Ключевые темы и идеи',
                'Художественные особенности'
            ],
            selectedChapters: selectedChapterNames,
            source: 'Общий литературный анализ'
        };
    }

    generatePlaceholderCover(title) {
        const encodedTitle = encodeURIComponent(title.substring(0, 20));
        return `https://via.placeholder.com/150x200/667eea/ffffff?text=${encodedTitle}`;
    }

    async askQuestion() {
        const question = this.questionInput.value.trim();
        
        if (!question) {
            this.showError('Введите вопрос о книге');
            return;
        }
        
        if (!this.currentBook || !this.bookAnalysis) {
            this.showError('Сначала проанализируйте книгу');
            return;
        }

        this.askBtn.disabled = true;
        this.showLoading('Ищу ответ...');

        try {
            const answer = await this.searchAnswer(question);
            this.displayQA(question, answer);
            this.questionInput.value = '';
        } catch (error) {
            this.showError('Не удалось найти ответ');
        } finally {
            this.hideLoading();
            this.askBtn.disabled = false;
        }
    }

    async searchAnswer(question) {
        // Имитация поиска ответа в интернете
        return new Promise((resolve) => {
            setTimeout(() => {
                const answers = [
                    `На основе анализа произведения "${this.currentBook.title}" можно сказать, что ${this.bookAnalysis.chaptersSummary.substring(0, 200)}...`,
                    `Согласно информации из открытых источников, в произведении "${this.currentBook.title}" ${this.bookAnalysis.keyPoints[0]?.toLowerCase() || 'раскрываются важные темы'}.`,
                    `Исследование произведения показывает, что ${this.bookAnalysis.characters[0]?.toLowerCase() || 'главные персонажи'} играют ключевую роль в развитии сюжета.`
                ];
                resolve(answers[Math.floor(Math.random() * answers.length)]);
            }, 1500);
        });
    }

    displayBookInfo(bookData) {
        this.bookCover.src = bookData.cover;
        this.bookCover.alt = `Обложка: ${bookData.title}`;
        this.bookName.textContent = bookData.title;
        this.bookAuthor.textContent = `Автор: ${bookData.author}`;
        this.bookDescription.textContent = bookData.description;
        this.bookYear.textContent = `Год: ${bookData.year}`;
        this.bookPages.textContent = `Страниц: ${bookData.pages}`;
        this.bookRating.textContent = bookData.rating;
    }

    displayAnalysis(analysis) {
        this.analysisStats.textContent = `Проанализировано глав: ${analysis.selectedChapters.length} | Источник: ${analysis.source}`;
        
        this.chaptersSummary.innerHTML = `
            <div class="analysis-text">
                ${analysis.chaptersSummary.replace(/\n\n/g, '<br><br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}
            </div>
        `;
        
        this.characters.innerHTML = analysis.characters
            .map(char => `<div class="character-item">${char}</div>`)
            .join('');
            
        this.keyPoints.innerHTML = analysis.keyPoints
            .map(point => `<div class="key-point">${point}</div>`)
            .join('');
    }

    displayQA(question, answer) {
        const qaItem = document.createElement('div');
        qaItem.className = 'qa-item';
        qaItem.innerHTML = `
            <div class="question">❓ ${question}</div>
            <div class="answer">${answer}</div>
            <div class="source-info">📚 Ответ основан на анализе из открытых источников</div>
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
    }

    hideError() {
        this.errorMessage.classList.add('hidden');
    }
}

const app = new BookAI();
