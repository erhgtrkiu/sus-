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
            this.searchGoogleAnalysis.bind(this)
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
            // Пробуем разные варианты поиска в Wikipedia
            const searchVariants = [
                bookData.title,
                `${bookData.title} (роман)`,
                `${bookData.title} ${bookData.author}`
            ];

            for (const variant of searchVariants) {
                try {
                    const response = await fetch(
                        `https://ru.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(variant)}`
                    );

                    if (response.ok) {
                        const data = await response.json();
                        if (data.extract && data.extract.length > 100) {
                            return {
                                summary: data.extract,
                                characters: this.extractCharactersFromText(data.extract),
                                themes: this.extractThemesFromText(data.extract),
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

    async searchGoogleAnalysis(bookData) {
        try {
            // Используем Google Books description как анализ
            if (bookData.description && bookData.description.length > 200) {
                return {
                    summary: bookData.description,
                    characters: this.extractCharactersFromText(bookData.description),
                    themes: this.extractThemesFromText(bookData.description),
                    source: 'Google Books'
                };
            }
        } catch (error) {
            console.log('Google analysis not available');
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
            .map(([name]) => `${name} - упоминается в описании`);

        return topNames.length > 0 ? topNames : ['Персонажи не указаны в найденном анализе'];
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
            'жизн': 'Проблемы жизни',
            'преступлен': 'Преступление и наказание',
            'духов': 'Духовные искания',
            'философ': 'Философские вопросы'
        };

        for (const [keyword, theme] of Object.entries(themeKeywords)) {
            if (lowerText.includes(keyword)) {
                themes.push(theme);
            }
        }

        return themes.length > 0 ? themes.slice(0, 5) : ['Основные темы произведения'];
    }

    isCommonWord(word) {
        const commonWords = [
            'это', 'что', 'как', 'так', 'вот', 'был', 'сказал', 'глава', 'книга', 
            'роман', 'автор', 'который', 'очень', 'после', 'тогда', 'потом', 'может'
        ];
        return commonWords.includes(word.toLowerCase());
    }

    generateBasicAnalysis(bookData) {
        // Для популярных книг предоставляем более детальный анализ
        const popularBooksAnalysis = this.getPopularBooksAnalysis(bookData.title);
        if (popularBooksAnalysis) {
            return popularBooksAnalysis;
        }

        // Базовый анализ для остальных книг
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

    getPopularBooksAnalysis(title) {
        const lowerTitle = title.toLowerCase();
        const analysisDatabase = {
            'преступление и наказание': {
                summary: `Роман Фёдора Достоевского рассказывает о бывшем студенте Родионе Раскольникове, который создаёт теорию о "право имеющих" личностях. Чтобы доказать свою теорию, он убивает старуху-процентщицу, но затем мучается угрызениями совести. Через встречи с Соней Мармеладовой и следователем Порфирием Петровичем он приходит к осознанию своей ошибки и признаётся в преступлении.`,
                characters: [
                    'Родион Раскольников - главный герой, создатель теории о "сверхчеловеке"',
                    'Соня Мармеладова - символ христианского смирения и жертвенности',
                    'Порфирий Петрович - проницательный следователь',
                    'Дмитрий Разумихин - друг Раскольникова',
                    'Аркадий Свидригайлов - циничный аристократ'
                ],
                themes: [
                    'Нравственность и свобода воли',
                    'Теория "сверхчеловека" и её последствия',
                    'Страдание как путь к искуплению',
                    'Социальная несправедливость',
                    'Роль религии в нравственном выборе'
                ],
                source: 'Литературный анализ'
            },
            'война и мир': {
                summary: `Эпопея Льва Толстого охватывает период наполеоновских войн и рассказывает о судьбах нескольких дворянских семей. Основные сюжетные линии связаны с духовными исканиями Пьера Безухова, военной карьерой Андрея Болконского и взрослением Наташи Ростовой. Роман сочетает глубокий психологический анализ с философскими размышлениями о истории и смысле жизни.`,
                characters: [
                    'Пьер Безухов - искатель смысла жизни',
                    'Андрей Болконский - аристократ, разочарованный в светской жизни',
                    'Наташа Ростова - жизнерадостная и эмоциональная героиня',
                    'Николай Ростов - честный офицер',
                    'Марья Болконская - религиозная и добрая девушка'
                ],
                themes: [
                    'Война и мир как состояния человеческой души',
                    'Смысл жизни и поиск истины',
                    'Любовь и семейные ценности',
                    'Роль личности в истории',
                    'Свобода воли и предопределение'
                ],
                source: 'Литературный анализ'
            },
            'мастер и маргарита': {
                summary: `Роман Михаила Булгакова состоит из двух переплетающихся сюжетных линий: истории визита дьявола (Воланда) в Москву 1930-х годов и романа о Понтии Пилате, написанного Мастером. Произведение сочетает сатиру на советское общество с глубокими философскими размышлениями о добре и зле, любви и творчестве.`,
                characters: [
                    'Мастер - писатель, автор романа о Понтии Пилате',
                    'Маргарита - возлюбленная Мастера',
                    'Воланд - сатана в человеческом облике',
                    'Иешуа Га-Ноцри - философ, прообраз Христа',
                    'Понтий Пилат - римский прокуратор'
                ],
                themes: [
                    'Борьба добра и зла',
                    'Свобода творчества и цензура',
                    'Любовь и самопожертвование',
                    'Справедливость и возмездие',
                    'Сатира на общественные пороки'
                ],
                source: 'Литературный анализ'
            }
        };

        for (const [key, analysis] of Object.entries(analysisDatabase)) {
            if (lowerTitle.includes(key)) {
                return analysis;
            }
        }

        return null;
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
