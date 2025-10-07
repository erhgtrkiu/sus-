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
        this.bookSource = document.getElementById('bookSource');
        
        this.loading = document.getElementById('loading');
        this.loadingText = document.getElementById('loadingText');
        this.analysisResult = document.getElementById('analysisResult');
        this.analysisStats = document.getElementById('analysisStats');
        this.summary = document.getElementById('summary');
        this.characters = document.getElementById('characters');
        this.themes = document.getElementById('themes');
        
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
            this.searchLitResAnalysis.bind(this),
            this.searchMyBookAnalysis.bind(this),
            this.searchLivelibAnalysis.bind(this)
        ];

        for (const source of analysisSources) {
            try {
                const analysis = await source(bookData);
                if (analysis && analysis.summary) {
                    return analysis;
                }
            } catch (error) {
                console.warn(`Analysis source failed:`, error);
            }
        }

        // Если не нашли анализ, создаем базовый на основе описания
        return this.generateBasicAnalysis(bookData);
    }

    async searchWikipediaAnalysis(bookData) {
        try {
            const searchQuery = encodeURIComponent(`${bookData.title} ${bookData.author} анализ содержание`);
            const response = await fetch(
                `https://ru.wikipedia.org/api/rest_v1/page/summary/${searchQuery}`
            );

            if (response.ok) {
                const data = await response.json();
                if (data.extract && data.extract.length > 200) {
                    return {
                        summary: data.extract,
                        characters: this.extractCharactersFromText(data.extract),
                        themes: this.extractThemesFromText(data.extract),
                        source: 'Wikipedia'
                    };
                }
            }
        } catch (error) {
            console.log('Wikipedia analysis not available');
        }
        return null;
    }

    async searchLitResAnalysis(bookData) {
        try {
            // Ищем информацию через поиск Литрес
            const searchQuery = encodeURIComponent(`${bookData.title} ${bookData.author} анализ краткое содержание`);
            const response = await fetch(
                `https://www.googleapis.com/customsearch/v1?key=AIzaSyCl0nY7dKZ0Q9QY9QY9QY9QY9QY9QY9QY9Q&cx=017576662512468239146:omuauf_lfve&q=${searchQuery}`
            );

            if (response.ok) {
                const data = await response.json();
                if (data.items && data.items.length > 0) {
                    // Берем первый результат поиска
                    const firstResult = data.items[0];
                    return {
                        summary: firstResult.snippet || 'Анализ найден в поиске',
                        characters: ['Информация о персонажах доступна в полном анализе'],
                        themes: ['Основные темы произведения'],
                        source: 'Поиск Google',
                        url: firstResult.link
                    };
                }
            }
        } catch (error) {
            console.log('LitRes search not available');
        }
        return null;
    }

    async searchMyBookAnalysis(bookData) {
        try {
            // Пытаемся найти анализ через MyBook или другие ресурсы
            const searchQuery = encodeURIComponent(`${bookData.title} анализ сюжет персонажи`);
            const response = await fetch(
                `https://api.allorigins.win/get?url=${encodeURIComponent(`https://mybook.ru/search/books/?q=${searchQuery}`)}`
            );

            if (response.ok) {
                const data = await response.json();
                if (data.contents) {
                    return {
                        summary: 'Анализ книги доступен на MyBook',
                        characters: ['Персонажи описаны в полном анализе'],
                        themes: ['Темы произведения раскрыты в детальном разборе'],
                        source: 'MyBook',
                        url: `https://mybook.ru/search/books/?q=${searchQuery}`
                    };
                }
            }
        } catch (error) {
            console.log('MyBook search not available');
        }
        return null;
    }

    async searchLivelibAnalysis(bookData) {
        try {
            // Поиск через LiveLib
            const searchQuery = encodeURIComponent(`${bookData.title} ${bookData.author} рецензия анализ`);
            const response = await fetch(
                `https://www.livelib.ru/find/${searchQuery}`
            );

            if (response.ok) {
                return {
                    summary: 'Рецензии и анализ доступны на LiveLib',
                    characters: ['Характеристики персонажей в рецензиях'],
                    themes: ['Тематический анализ в обзорах'],
                    source: 'LiveLib',
                    url: `https://www.livelib.ru/find/${searchQuery}`
                };
            }
        } catch (error) {
            console.log('LiveLib search not available');
        }
        return null;
    }

    extractCharactersFromText(text) {
        // Простой алгоритм извлечения упомянутых имен
        const words = text.split(/\s+/);
        const potentialNames = words.filter(word => 
            word.length > 2 && 
            /[А-Я][а-я]+/.test(word) &&
            !this.isCommonWord(word)
        );

        const nameCount = {};
        potentialNames.forEach(name => {
            nameCount[name] = (nameCount[name] || 0) + 1;
        });

        const topNames = Object.entries(nameCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([name]) => name);

        return topNames.length > 0 ? 
            topNames.map(name => `${name} - упоминается в анализе`) : 
            ['Персонажи не указаны в найденном анализе'];
    }

    extractThemesFromText(text) {
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
            'жизн': 'Проблемы жизни'
        };

        for (const [keyword, theme] of Object.entries(themeKeywords)) {
            if (lowerText.includes(keyword)) {
                themes.push(theme);
            }
        }

        return themes.length > 0 ? themes : ['Основные темы произведения'];
    }

    isCommonWord(word) {
        const commonWords = ['это', 'что', 'как', 'так', 'вот', 'был', 'сказал', 'глава', 'книга', 'роман', 'автор'];
        return commonWords.includes(word.toLowerCase());
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
        this.showLoading('Ищу ответ в найденных анализах...');

        try {
            const answer = await this.searchAnswer(question);
            this.displayQA(question, answer);
            this.questionInput.value = '';
        } catch (error) {
            this.showError('Ошибка: ' + error.message);
        } finally {
            this.hideLoading();
            this.askBtn.disabled = false;
        }
    }

    async searchAnswer(question) {
        const lowerQuestion = question.toLowerCase();
        const book = this.currentBook;

        // Сначала проверяем наш анализ
        if (this.bookAnalysis) {
            if (lowerQuestion.includes('о чём') || lowerQuestion.includes('сюжет') || lowerQuestion.includes('краткое содержание')) {
                return this.bookAnalysis.summary;
            }

            if (lowerQuestion.includes('персонаж') || lowerQuestion.includes('герой')) {
                return 'Основные персонажи: ' + this.bookAnalysis.characters.join(', ');
            }

            if (lowerQuestion.includes('тема') || lowerQuestion.includes('идея')) {
                return 'Основные темы: ' + this.bookAnalysis.themes.join(', ');
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
            this.bookAnalysis?.summary ? this.bookAnalysis.summary.substring(0, 300) + '...' : 
            'Для ответа на этот вопрос требуется более детальный анализ произведения. Рекомендую поискать рецензии и анализы на литературных сайтах.'
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
        this.bookSource.textContent = bookData.source;
        
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
    console.log('BookAI initialized');
});
