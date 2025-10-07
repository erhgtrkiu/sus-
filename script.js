class BookAI {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.currentBook = null;
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
                
                // Анализируем книгу на основе полученных данных
                this.loadingText.textContent = 'Анализирую информацию о книге...';
                const analysis = await this.analyzeBook(bookData);
                
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
                source: 'Google Books'
            };
        } catch (error) {
            console.error('Google Books search error:', error);
            return null;
        }
    }

    generatePlaceholderCover(title) {
        // Создаем placeholder обложку через services
        const encodedTitle = encodeURIComponent(title.substring(0, 20));
        return `https://via.placeholder.com/150x200/667eea/ffffff?text=${encodedTitle}`;
    }

    async analyzeBook(bookData) {
        // Собираем дополнительную информацию из Wikipedia
        const wikiData = await this.searchWikipedia(bookData.title, bookData.author);
        
        return {
            summary: this.generateSummary(bookData, wikiData),
            characters: this.identifyCharacters(bookData, wikiData),
            themes: this.identifyThemes(bookData, wikiData)
        };
    }

    async searchWikipedia(title, author) {
        try {
            // Ищем статью в Wikipedia
            const searchQuery = encodeURIComponent(title + ' ' + author);
            const response = await fetch(
                `https://ru.wikipedia.org/api/rest_v1/page/summary/${searchQuery}`
            );

            if (response.ok) {
                const data = await response.json();
                return {
                    summary: data.extract || '',
                    url: data.content_urls?.desktop?.page || ''
                };
            }
        } catch (error) {
            console.log('Wikipedia not available, using fallback');
        }

        return { summary: '', url: '' };
    }

    generateSummary(bookData, wikiData) {
        if (wikiData.summary && wikiData.summary.length > 100) {
            return wikiData.summary;
        }

        if (bookData.description && bookData.description.length > 50) {
            return bookData.description;
        }

        // Генерируем базовое описание
        return `"${bookData.title}" - ${
            bookData.author ? `произведение автора ${bookData.author}` : 'литературное произведение'
        }${
            bookData.year ? `, опубликованное в ${bookData.year} году` : ''
        }${
            bookData.genre ? `. Относится к жанру ${bookData.genre.toLowerCase()}` : ''
        }. ${bookData.description || 'Для получения подробной информации о содержании рекомендуется ознакомиться с полным текстом книги.'}`;
    }

    identifyCharacters(bookData, wikiData) {
        // Для известных книг возвращаем информацию о персонажах
        const knownCharacters = this.getKnownCharacters(bookData.title);
        if (knownCharacters.length > 0) {
            return knownCharacters;
        }

        // Для неизвестных книг используем общее описание
        return [
            'Информация о персонажах требует изучения полного текста',
            'Для точного анализа рекомендуется прочитать книгу'
        ];
    }

    identifyThemes(bookData, wikiData) {
        const knownThemes = this.getKnownThemes(bookData.title);
        if (knownThemes.length > 0) {
            return knownThemes;
        }

        // Определяем темы на основе жанра и описания
        const themes = [];
        if (bookData.genre) {
            themes.push(`Жанровые особенности: ${bookData.genre}`);
        }
        if (bookData.description) {
            const desc = bookData.description.toLowerCase();
            if (desc.includes('любов') || desc.includes('роман')) themes.push('Тема любви и отношений');
            if (desc.includes('войн') || desc.includes('сражен')) themes.push('Военная тематика');
            if (desc.includes('общест') || desc.includes('социаль')) themes.push('Социальные вопросы');
            if (desc.includes('приключен')) themes.push('Приключения и путешествия');
            if (desc.includes('детектив') || desc.includes('преступлен')) themes.push('Детективный сюжет');
        }

        return themes.length > 0 ? themes : ['Основные темы произведения'];
    }

    getKnownCharacters(bookTitle) {
        const lowerTitle = bookTitle.toLowerCase();
        const charactersDb = {
            'преступление и наказание': [
                'Родион Раскольников - главный герой, бывший студент',
                'Соня Мармеладова - символ христианского смирения',
                'Порфирий Петрович - следователь',
                'Разумихин - друг Раскольникова'
            ],
            'война и мир': [
                'Пьер Безухов - искатель смысла жизни',
                'Андрей Болконский - аристократ',
                'Наташа Ростова - жизнерадостная героиня',
                'Николай Ростов - честный офицер'
            ],
            'анна каренина': [
                'Анна Каренина - трагическая героиня',
                'Алексей Вронский - офицер',
                'Алексей Каренин - муж Анны',
                'Константин Левин - помещик'
            ],
            'мастер и маргарита': [
                'Мастер - писатель',
                'Маргарита - возлюбленная Мастера',
                'Воланд - сатана',
                'Иешуа Га-Ноцри - философ'
            ]
        };

        for (const [key, chars] of Object.entries(charactersDb)) {
            if (lowerTitle.includes(key)) {
                return chars;
            }
        }

        return [];
    }

    getKnownThemes(bookTitle) {
        const lowerTitle = bookTitle.toLowerCase();
        const themesDb = {
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
                'Нравственные вопросы'
            ],
            'мастер и маргарита': [
                'Борьба добра и зла',
                'Свобода творчества',
                'Любовь и самопожертвование',
                'Сатира на общество'
            ]
        };

        for (const [key, themeList] of Object.entries(themesDb)) {
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

        // Ответы на частые вопросы
        if (lowerQuestion.includes('кто автор') || lowerQuestion.includes('кто написал')) {
            return `Автор книги "${book.title}" - ${book.author || 'информация об авторе отсутствует'}.`;
        }

        if (lowerQuestion.includes('когда') || lowerQuestion.includes('год')) {
            return `Книга была опубликована в ${book.year || 'неизвестном'} году.`;
        }

        if (lowerQuestion.includes('о чём') || lowerQuestion.includes('сюжет')) {
            return book.description || 'Подробное описание сюжета отсутствует в доступных источниках.';
        }

        if (lowerQuestion.includes('сколько страниц') || lowerQuestion.includes('объём')) {
            return `Объём книги: ${book.pages || 'информация отсутствует'}.`;
        }

        if (lowerQuestion.includes('жанр')) {
            return `Жанр произведения: ${book.genre || 'не указан'}.`;
        }

        if (lowerQuestion.includes('персонаж') || lowerQuestion.includes('герой')) {
            const chars = this.getKnownCharacters(book.title);
            if (chars.length > 0) {
                return 'Основные персонажи: ' + chars.join(', ');
            }
            return 'Информация о персонажах требует изучения полного текста книги.';
        }

        // Общий ответ
        return `На основе доступной информации о книге "${book.title}": ${
            book.description ? book.description.substring(0, 200) + '...' : 
            'Для ответа на этот вопрос требуется более детальная информация о произведении.'
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
        
        this.analysisStats.textContent = `Источник: ${this.currentBook.source}`;
        this.analysisResult.classList.remove('hidden');
    }

    displayQA(question, answer) {
        const qaItem = document.createElement('div');
        qaItem.className = 'qa-item';
        qaItem.innerHTML = `
            <div class="question">❓ ${question}</div>
            <div class="answer">🤖 ${answer}</div>
            <div class="source-info">Информация из ${this.currentBook.source}</div>
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
