class BookAI {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.currentBook = null;
        this.searchCache = new Map();
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
        this.summaryResult = document.getElementById('summaryResult');
        this.summary = document.getElementById('summary');
        this.characters = document.getElementById('characters');
        this.themes = document.getElementById('themes');
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
            // Ищем книгу в Google Books API
            const bookData = await this.searchGoogleBooks(query);
            
            if (bookData) {
                this.currentBook = bookData;
                this.displayBookInfo(bookData);
                
                // Ищем дополнительную информацию в Wikipedia
                this.loadingText.textContent = 'Ищу информацию в Wikipedia...';
                const wikiData = await this.searchWikipedia(bookData.title, bookData.author);
                
                // Анализируем книгу на основе собранных данных
                this.loadingText.textContent = 'Анализирую собранную информацию...';
                const analysis = await this.analyzeBook(bookData, wikiData);
                
                this.displayAnalysis(analysis);
                this.qaSection.classList.remove('hidden');
            } else {
                this.showError('Книга не найдена. Попробуйте уточнить название и автора');
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
        // Кэширование запросов
        const cacheKey = `google_${query}`;
        if (this.searchCache.has(cacheKey)) {
            return this.searchCache.get(cacheKey);
        }

        try {
            const response = await fetch(
                `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=5&langRestrict=ru`
            );
            
            if (!response.ok) throw new Error('Ошибка Google Books API');
            
            const data = await response.json();
            
            if (!data.items || data.items.length === 0) {
                return null;
            }

            // Выбираем наиболее релевантный результат
            const book = data.items[0].volumeInfo;
            const bookData = {
                title: book.title || 'Неизвестно',
                author: book.authors ? book.authors.join(', ') : 'Автор неизвестен',
                description: book.description || 'Описание отсутствует',
                year: book.publishedDate ? book.publishedDate.substring(0, 4) : 'Неизвестен',
                pages: book.pageCount || 'Неизвестно',
                rating: book.averageRating ? 
                    '⭐'.repeat(Math.round(book.averageRating)) + ` ${book.averageRating}/5` : 
                    'Рейтинг отсутствует',
                cover: book.imageLinks ? 
                    book.imageLinks.thumbnail.replace('http://', 'https://') : 
                    'https://via.placeholder.com/150x200/667eea/white?text=No+Cover',
                genre: book.categories ? book.categories[0] : 'Жанр не указан',
                googleBooksId: data.items[0].id,
                previewLink: book.previewLink
            };

            this.searchCache.set(cacheKey, bookData);
            return bookData;
        } catch (error) {
            console.error('Google Books error:', error);
            return null;
        }
    }

    async searchWikipedia(title, author) {
        const cacheKey = `wiki_${title}_${author}`;
        if (this.searchCache.has(cacheKey)) {
            return this.searchCache.get(cacheKey);
        }

        try {
            // Ищем статью в Wikipedia
            const searchResponse = await fetch(
                `https://ru.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
            );

            if (searchResponse.ok) {
                const wikiData = await searchResponse.json();
                const result = {
                    summary: wikiData.extract || '',
                    url: wikiData.content_urls ? wikiData.content_urls.desktop.page : ''
                };
                this.searchCache.set(cacheKey, result);
                return result;
            }
        } catch (error) {
            console.error('Wikipedia error:', error);
        }

        return { summary: '', url: '' };
    }

    async analyzeBook(bookData, wikiData) {
        // Создаем интеллектуальный анализ на основе собранных данных
        return {
            summary: this.generateSummary(bookData, wikiData),
            characters: this.identifyCharacters(bookData, wikiData),
            themes: this.identifyThemes(bookData, wikiData),
            analysis: this.generateAnalysis(bookData, wikiData)
        };
    }

    generateSummary(bookData, wikiData) {
        if (wikiData.summary) {
            return wikiData.summary;
        }

        if (bookData.description && bookData.description.length > 100) {
            return bookData.description;
        }

        // Генерируем базовое описание на основе имеющейся информации
        return `"${bookData.title}" ${bookData.author ? `автора ${bookData.author}` : ''} ${
            bookData.year ? `была опубликована в ${bookData.year} году` : ''
        }. ${
            bookData.genre ? `Произведение относится к жанру ${bookData.genre}.` : ''
        } ${bookData.description || 'Информация о содержании книги требует дополнительного изучения.'}`;
    }

    identifyCharacters(bookData, wikiData) {
        // Базовый анализ персонажей для известных книг
        const knownCharacters = this.getKnownCharacters(bookData.title);
        if (knownCharacters.length > 0) {
            return knownCharacters;
        }

        // Для неизвестных книг создаем общее описание
        return [
            'Информация о персонажах требует более глубокого анализа текста',
            'Для точного определения главных героев необходим доступ к полному тексту произведения'
        ];
    }

    identifyThemes(bookData, wikiData) {
        const knownThemes = this.getKnownThemes(bookData.title);
        if (knownThemes.length > 0) {
            return knownThemes;
        }

        // Анализ тем на основе жанра и описания
        const themes = [];
        if (bookData.genre) {
            themes.push(`Жанровые особенности: ${bookData.genre}`);
        }
        if (bookData.description) {
            if (bookData.description.toLowerCase().includes('любов')) {
                themes.push('Тема любви и отношений');
            }
            if (bookData.description.toLowerCase().includes('войн')) {
                themes.push('Военная тематика');
            }
            if (bookData.description.toLowerCase().includes('общест')) {
                themes.push('Социальные вопросы');
            }
        }

        return themes.length > 0 ? themes : ['Основные темы произведения требуют изучения полного текста'];
    }

    generateAnalysis(bookData, wikiData) {
        let analysis = '';

        if (wikiData.summary) {
            analysis += `На основе информации из Wikipedia: ${wikiData.summary}\n\n`;
        }

        analysis += `Книга "${bookData.title}" ${
            bookData.author ? `автора ${bookData.author}` : ''
        } ${
            bookData.year ? `была создана в ${bookData.year} году` : ''
        }. `;

        if (bookData.genre) {
            analysis += `Произведение относится к жанру ${bookData.genre}, что определяет его основные художественные особенности. `;
        }

        if (bookData.pages && bookData.pages !== 'Неизвестно') {
            analysis += `Объём произведения составляет ${bookData.pages} страниц. `;
        }

        analysis += `Для более детального анализа рекомендуется ознакомиться с полным текстом произведения.`;

        return analysis;
    }

    getKnownCharacters(bookTitle) {
        const lowerTitle = bookTitle.toLowerCase();
        const characters = {
            'преступление и наказание': [
                'Родион Раскольников - главный герой, бывший студент',
                'Соня Мармеладова - дочь чиновника, символ смирения',
                'Порфирий Петрович - следователь',
                'Разумихин - друг Раскольникова'
            ],
            'война и мир': [
                'Пьер Безухов - искатель смысла жизни',
                'Андрей Болконский - аристократ, разочарованный в жизни',
                'Наташа Ростова - жизнерадостная героиня',
                'Николай Ростов - честный офицер'
            ],
            'анна каренина': [
                'Анна Каренина - трагическая героиня',
                'Алексей Вронский - офицер, возлюбленный Анны',
                'Алексей Каренин - муж Анны',
                'Константин Левин - помещик, ищущий смысл жизни'
            ]
        };

        for (const [key, chars] of Object.entries(characters)) {
            if (lowerTitle.includes(key)) {
                return chars;
            }
        }

        return [];
    }

    getKnownThemes(bookTitle) {
        const lowerTitle = bookTitle.toLowerCase();
        const themes = {
            'преступление и наказание': [
                'Нравственность и свобода воли',
                'Теория "сверхчеловека"',
                'Страдание и искупление',
                'Социальная несправедливость'
            ],
            'война и мир': [
                'Война и мир как состояния души',
                'Смысл жизни и поиск истины',
                'Любовь и семейные ценности',
                'Роль личности в истории'
            ],
            'анна каренина': [
                'Любовь и супружеская верность',
                'Общественные нормы и личная свобода',
                'Семейное счастье',
                'Религия и нравственность'
            ]
        };

        for (const [key, themeList] of Object.entries(themes)) {
            if (lowerTitle.includes(key)) {
                return themeList;
            }
        }

        return [];
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
        this.showLoading('Ищу ответ в открытых источниках...');

        try {
            const answer = await this.searchAnswer(question);
            this.displayQA(question, answer);
            this.questionInput.value = '';
        } catch (error) {
            this.showError('Ошибка при поиске ответа: ' + error.message);
        } finally {
            this.hideLoading();
            this.askBtn.disabled = false;
        }
    }

    async searchAnswer(question) {
        // Ищем ответ в разных источниках
        const sources = [];
        
        // Поиск в Wikipedia
        try {
            const wikiAnswer = await this.searchWikipediaAnswer(question);
            if (wikiAnswer) sources.push({ source: 'Wikipedia', content: wikiAnswer });
        } catch (error) {
            console.error('Wikipedia search error:', error);
        }

        // Поиск в Google Books
        try {
            const booksAnswer = await this.searchGoogleBooksAnswer(question);
            if (booksAnswer) sources.push({ source: 'Google Books', content: booksAnswer });
        } catch (error) {
            console.error('Google Books search error:', error);
        }

        if (sources.length > 0) {
            const bestAnswer = sources[0];
            return `${bestAnswer.content}\n\n<div class="source-badge">Источник: ${bestAnswer.source}</div>`;
        }

        // Если не нашли в открытых источниках, генерируем ответ на основе имеющейся информации
        return this.generateAnswerFromAvailableData(question);
    }

    async searchWikipediaAnswer(question) {
        const searchQuery = `${this.currentBook.title} ${question}`;
        try {
            const response = await fetch(
                `https://ru.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(this.currentBook.title)}`
            );
            
            if (response.ok) {
                const data = await response.json();
                if (data.extract) {
                    return this.extractRelevantInfo(data.extract, question);
                }
            }
        } catch (error) {
            console.error('Wikipedia answer search error:', error);
        }
        return null;
    }

    async searchGoogleBooksAnswer(question) {
        try {
            const response = await fetch(
                `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(this.currentBook.title + ' ' + question)}&maxResults=3`
            );
            
            if (response.ok) {
                const data = await response.json();
                if (data.items && data.items.length > 0) {
                    const description = data.items[0].volumeInfo.description;
                    if (description) {
                        return this.extractRelevantInfo(description, question);
                    }
                }
            }
        } catch (error) {
            console.error('Google Books answer search error:', error);
        }
        return null;
    }

    extractRelevantInfo(text, question) {
        // Упрощенный алгоритм поиска релевантной информации
        const sentences = text.split('. ');
        const questionWords = question.toLowerCase().split(' ');
        
        for (const sentence of sentences) {
            const lowerSentence = sentence.toLowerCase();
            let relevance = 0;
            
            for (const word of questionWords) {
                if (word.length > 3 && lowerSentence.includes(word)) {
                    relevance++;
                }
            }
            
            if (relevance >= 2) {
                return sentence + '.';
            }
        }
        
        return text.substring(0, 200) + '...';
    }

    generateAnswerFromAvailableData(question) {
        const lowerQuestion = question.toLowerCase();
        const book = this.currentBook;

        if (lowerQuestion.includes('кто автор') || lowerQuestion.includes('кто написал')) {
            return `Автор книги "${book.title}" - ${book.author || 'информация об авторе отсутствует'}.`;
        }

        if (lowerQuestion.includes('когда написана') || lowerQuestion.includes('год публикации')) {
            return `Книга "${book.title}" была опубликована в ${book.year || 'неизвестном'} году.`;
        }

        if (lowerQuestion.includes('о чём книга') || lowerQuestion.includes('сюжет')) {
            return book.description || 'Подробное описание сюжета отсутствует в доступных источниках.';
        }

        if (lowerQuestion.includes('сколько страниц') || lowerQuestion.includes('объём')) {
            return `Объём книги: ${book.pages || 'информация отсутствует'}.`;
        }

        if (lowerQuestion.includes('жанр')) {
            return `Жанр произведения: ${book.genre || 'не указан'}.`;
        }

        return `На основе доступной информации о книге "${book.title}" могу сказать: ${
            book.description ? book.description.substring(0, 150) + '...' : 
            'Для ответа на этот вопрос требуется более детальная информация о произведении.'
        } Рекомендую уточнить вопрос или ознакомиться с полным текстом книги.`;
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
        
        this.analysis.innerHTML = `<p>${analysis.analysis}</p>`;
        
        this.summaryResult.classList.remove('hidden');
    }

    displayQA(question, answer) {
        const qaItem = document.createElement('div');
        qaItem.className = 'qa-item';
        qaItem.innerHTML = `
            <div class="question">❓ ${question}</div>
            <div class="answer">🤖 ${answer}</div>
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
});
