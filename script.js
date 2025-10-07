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
        
        this.bookInfo = document.getElementById('bookInfo');
        this.bookCover = document.getElementById('bookCover');
        this.bookName = document.getElementById('bookName');
        this.bookAuthor = document.getElementById('bookAuthor');
        this.bookDescription = document.getElementById('bookDescription');
        this.bookYear = document.getElementById('bookYear');
        this.bookPages = document.getElementById('bookPages');
        this.bookRating = document.getElementById('bookRating');
        
        this.loading = document.getElementById('loading');
        this.loadingText = document.getElementById('loadingText');
        this.analysisResult = document.getElementById('analysisResult');
        this.analysisStats = document.getElementById('analysisStats');
        this.summary = document.getElementById('summary');
        this.characters = document.getElementById('characters');
        this.themes = document.getElementById('themes');
        this.chapters = document.getElementById('chapters');
        
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
            // Ищем книгу через Google Books API
            const bookData = await this.searchGoogleBooks(query);
            
            if (bookData) {
                this.currentBook = bookData;
                this.displayBookInfo(bookData);
                
                // Ищем анализ книги в интернете
                this.loadingText.textContent = 'Ищу анализ книги в интернете...';
                const analysis = await this.searchBookAnalysis(bookData);
                this.bookAnalysis = analysis;
                
                this.displayAnalysis(analysis);
                this.qaSection.classList.remove('hidden');
            } else {
                this.showError('Книга не найдена. Попробуйте другое название или уточните автора');
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
            
            if (!response.ok) {
                throw new Error('Ошибка подключения к Google Books');
            }
            
            const data = await response.json();
            
            if (!data.items || data.items.length === 0) {
                return null;
            }

            // Выбираем наиболее релевантный результат
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
                isbn: bookInfo.industryIdentifiers ? bookInfo.industryIdentifiers[0]?.identifier : null,
                preview: bookInfo.previewLink,
                source: 'Google Books',
                id: bookItem.id
            };
        } catch (error) {
            console.error('Google Books search error:', error);
            return null;
        }
    }

    async searchBookAnalysis(bookData) {
        // Ищем анализ книги в разных источниках
        const analysisSources = [
            this.searchWikipediaAnalysis.bind(this),
            this.searchSummaryAnalysis.bind(this),
            this.searchCharactersAnalysis.bind(this)
        ];

        let bestAnalysis = null;

        for (const source of analysisSources) {
            try {
                const analysis = await source(bookData);
                if (analysis && this.isGoodAnalysis(analysis)) {
                    bestAnalysis = analysis;
                    break;
                }
            } catch (error) {
                console.warn(`Analysis source failed:`, error);
                continue;
            }
        }

        // Если не нашли хороший анализ, создаем базовый
        if (!bestAnalysis) {
            bestAnalysis = this.generateBasicAnalysis(bookData);
        }

        return bestAnalysis;
    }

    async searchWikipediaAnalysis(bookData) {
        try {
            // Пробуем разные варианты поиска в Wikipedia
            const searchVariants = [
                bookData.title,
                `${bookData.title} (роман)`,
                `${bookData.title} ${bookData.author}`,
                encodeURIComponent(bookData.title)
            ];

            for (const variant of searchVariants) {
                try {
                    const response = await fetch(
                        `https://ru.wikipedia.org/api/rest_v1/page/summary/${variant}`
                    );

                    if (response.ok) {
                        const data = await response.json();
                        if (data.extract && data.extract.length > 100) {
                            return {
                                summary: data.extract,
                                characters: this.extractCharactersFromText(data.extract),
                                themes: this.extractThemesFromText(data.extract),
                                chapters: this.generateChaptersFromAnalysis(data.extract),
                                source: 'Wikipedia'
                            };
                        }
                    }
                } catch (error) {
                    continue;
                }
            }
        } catch (error) {
            console.log('Wikipedia analysis not available');
        }
        return null;
    }

    async searchSummaryAnalysis(bookData) {
        try {
            // Используем Google Books description как основу для анализа
            if (bookData.description && bookData.description.length > 200) {
                return {
                    summary: bookData.description,
                    characters: this.extractCharactersFromText(bookData.description),
                    themes: this.extractThemesFromText(bookData.description),
                    chapters: this.generateChaptersFromBook(bookData),
                    source: 'Google Books + AI анализ'
                };
            }
        } catch (error) {
            console.log('Summary analysis not available');
        }
        return null;
    }

    async searchCharactersAnalysis(bookData) {
        try {
            // Ищем информацию о персонажах через дополнительные запросы
            const characterQuery = `${bookData.title} персонажи главные герои`;
            const response = await fetch(
                `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(characterQuery)}&maxResults=3`
            );

            if (response.ok) {
                const data = await response.json();
                if (data.items && data.items.length > 0) {
                    // Анализируем описания найденных книг для извлечения информации о персонажах
                    let allText = '';
                    data.items.forEach(item => {
                        if (item.volumeInfo.description) {
                            allText += item.volumeInfo.description + ' ';
                        }
                    });

                    if (allText.length > 0) {
                        return {
                            summary: bookData.description || 'Описание доступно в полном анализе',
                            characters: this.extractCharactersFromText(allText),
                            themes: this.extractThemesFromText(allText),
                            chapters: this.generateChaptersFromBook(bookData),
                            source: 'Сборный анализ из Google Books'
                        };
                    }
                }
            }
        } catch (error) {
            console.log('Characters analysis not available');
        }
        return null;
    }

    extractCharactersFromText(text) {
        if (!text || text.length < 50) {
            return ['Информация о персонажах требует более детального анализа'];
        }

        // Ищем имена собственные в тексте (русские имена с заглавной буквы)
        const words = text.split(/\s+/);
        const potentialNames = words.filter(word => 
            word.length > 2 && 
            /[А-Я][а-я]+/.test(word) &&
            !this.isCommonWord(word)
        );

        const nameCount = {};
        potentialNames.forEach(name => {
            // Убираем знаки препинания
            const cleanName = name.replace(/[.,!?;:()]/g, '');
            if (cleanName.length > 2) {
                nameCount[cleanName] = (nameCount[cleanName] || 0) + 1;
            }
        });

        const topNames = Object.entries(nameCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([name, count]) => `${name} (упоминается ${count} раз)`);

        return topNames.length > 0 ? topNames : ['Персонажи не обнаружены в доступном анализе'];
    }

    extractThemesFromText(text) {
        if (!text || text.length < 50) {
            return ['Основные темы произведения'];
        }

        const themes = [];
        const lowerText = text.toLowerCase();

        const themeKeywords = {
            'любов': 'Тема любви и отношений',
            'войн': 'Военная тематика',
            'общест': 'Социальные вопросы',
            'нравствен': 'Нравственные проблемы',
            'религи': 'Религиозные темы',
            'семь': 'Семейные отношения',
            'власт': 'Тема власти',
            'свобод': 'Свобода и выбор',
            'смерт': 'Тема смерти',
            'жизн': 'Проблемы жизни',
            'преступлен': 'Преступление и наказание',
            'духов': 'Духовные искания',
            'философ': 'Философские вопросы',
            'психолог': 'Психологический анализ',
            'истори': 'Исторический контекст'
        };

        for (const [keyword, theme] of Object.entries(themeKeywords)) {
            if (lowerText.includes(keyword)) {
                themes.push(theme);
            }
        }

        // Убираем дубликаты
        const uniqueThemes = [...new Set(themes)];

        return uniqueThemes.length > 0 ? uniqueThemes.slice(0, 6) : ['Основные темы произведения'];
    }

    generateChaptersFromAnalysis(text) {
        // Генерируем предполагаемую структуру глав на основе анализа
        const chapters = [];
        
        if (text.includes('часть') || text.includes('глава')) {
            chapters.push('Введение и завязка сюжета');
            chapters.push('Развитие основных событий');
            chapters.push('Кульминация произведения');
            chapters.push('Развязка и заключение');
        } else {
            chapters.push('Основная сюжетная линия');
            chapters.push('Развитие персонажей');
            chapters.push('Ключевые события');
            chapters.push('Финальная часть');
        }

        return chapters.map((chapter, index) => `${index + 1}. ${chapter}`);
    }

    generateChaptersFromBook(bookData) {
        // Создаем структуру глав на основе информации о книге
        const chapters = [];
        const pageCount = bookData.pages;
        
        if (pageCount && pageCount > 100) {
            const chapterCount = Math.min(Math.floor(pageCount / 20), 10);
            for (let i = 1; i <= chapterCount; i++) {
                chapters.push(`Глава ${i}`);
            }
        } else {
            chapters.push('Часть 1 - Введение');
            chapters.push('Часть 2 - Основное содержание');
            chapters.push('Часть 3 - Заключение');
        }

        return chapters;
    }

    isCommonWord(word) {
        const commonWords = [
            'это', 'что', 'как', 'так', 'вот', 'был', 'сказал', 'глава', 'книга', 
            'роман', 'автор', 'который', 'очень', 'после', 'тогда', 'потом', 'может',
            'будет', 'есть', 'или', 'но', 'если', 'когда', 'где', 'чем', 'том'
        ];
        return commonWords.includes(word.toLowerCase());
    }

    isGoodAnalysis(analysis) {
        return analysis.summary && analysis.summary.length > 100;
    }

    generateBasicAnalysis(bookData) {
        return {
            summary: bookData.description || `"${bookData.title}" - ${
                bookData.author ? `произведение автора ${bookData.author}` : 'литературное произведение'
            }${
                bookData.year ? `, опубликованное в ${bookData.year} году` : ''
            }${
                bookData.genre ? `. Относится к жанру ${bookData.genre.toLowerCase()}` : ''
            }. Для получения детального анализа с кратким содержанием, описанием персонажей и основных тем рекомендуется найти специализированный анализ произведения.`,
            characters: ['Для получения информации о персонажах необходим детальный анализ произведения'],
            themes: ['Основные темы требуют изучения полного содержания книги'],
            chapters: this.generateChaptersFromBook(bookData),
            source: 'Базовый анализ на основе метаданных'
        };
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
        
        if (!this.currentBook) {
            this.showError('Сначала найдите книгу');
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
        const book = this.currentBook;

        // Сначала проверяем наш анализ
        if (this.bookAnalysis) {
            if (lowerQuestion.includes('о чём') || lowerQuestion.includes('сюжет') || lowerQuestion.includes('краткое содержание')) {
                return this.bookAnalysis.summary;
            }

            if (lowerQuestion.includes('персонаж') || lowerQuestion.includes('герой')) {
                if (this.bookAnalysis.characters && this.bookAnalysis.characters.length > 0) {
                    return 'Основные персонажи:\n\n• ' + this.bookAnalysis.characters.join('\n• ');
                }
            }

            if (lowerQuestion.includes('тема') || lowerQuestion.includes('идея')) {
                if (this.bookAnalysis.themes && this.bookAnalysis.themes.length > 0) {
                    return 'Основные темы:\n\n• ' + this.bookAnalysis.themes.join('\n• ');
                }
            }

            if (lowerQuestion.includes('глава') || lowerQuestion.includes('часть') || lowerQuestion.includes('структура')) {
                if (this.bookAnalysis.chapters && this.bookAnalysis.chapters.length > 0) {
                    return 'Структура книги:\n\n• ' + this.bookAnalysis.chapters.join('\n• ');
                }
            }
        }

        // Общие вопросы о книге
        if (lowerQuestion.includes('кто автор') || lowerQuestion.includes('кто написал')) {
            return `Автор книги "${book.title}" - ${book.author || 'информация об авторе отсутствует'}.`;
        }

        if (lowerQuestion.includes('когда') || lowerQuestion.includes('год')) {
            return `Книга была опубликована в ${book.year || 'неизвестном'} году.`;
        }

        if (lowerQuestion.includes('сколько страниц') || lowerQuestion.includes('объём')) {
            return `Объём книги: ${book.pages || 'информация отсутствует'}.`;
        }

        if (lowerQuestion.includes('жанр')) {
            return `Жанр произведения: ${book.genre || 'не указан'}.`;
        }

        // Если не нашли ответ в анализе
        return `На основе найденной информации о книге "${book.title}": ${
            this.bookAnalysis?.summary ? 
            this.bookAnalysis.summary.substring(0, 300) + '...' : 
            'Для ответа на этот вопрос требуется более детальный анализ произведения.'
        }`;
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
        
        this.bookInfo.classList.remove('hidden');
    }

    displayAnalysis(analysis) {
        this.summary.innerHTML = `<p>${analysis.summary}</p>`;
        
        this.characters.innerHTML = analysis.characters.map(character => 
            `<div class="character-item">${character}</div>`
        ).join('');
        
        this.themes.innerHTML = analysis.themes.map(theme => 
            `<div class="theme-item">${theme}</div>`
        ).join('');
        
        this.chapters.innerHTML = analysis.chapters.map(chapter => 
            `<div class="chapter-item">${chapter}</div>`
        ).join('');
        
        this.analysisStats.textContent = `Источник анализа: ${analysis.source}`;
        this.analysisResult.classList.remove('hidden');
    }

    displayQA(question, answer) {
        const qaItem = document.createElement('div');
        qaItem.className = 'qa-item';
        qaItem.innerHTML = `
            <div class="question">❓ ${question}</div>
            <div class="answer">🤖 ${answer}</div>
            <div class="source-info">На основе анализа из ${this.bookAnalysis?.source || 'разных источников'}</div>
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
    console.log('BookAI initialized - реальный поиск анализа книг');
});
