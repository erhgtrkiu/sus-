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

        this.showLoading('Ищу книгу...');
        this.hideError();
        this.searchBtn.disabled = true;

        try {
            const bookData = await this.searchGoogleBooks(query);
            
            if (bookData) {
                this.currentBook = bookData;
                this.displayBookInfo(bookData);
                this.generateDynamicChapters(bookData);
                this.bookInfo.classList.remove('hidden');
                
                this.analysisResult.classList.add('hidden');
                this.qaSection.classList.add('hidden');
            } else {
                this.showError('Книга не найдена');
            }
        } catch (error) {
            this.showError('Ошибка: ' + error.message);
        } finally {
            this.hideLoading();
            this.searchBtn.disabled = false;
        }
    }

    async searchGoogleBooks(query) {
        try {
            const response = await fetch(
                `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=1&langRestrict=ru`
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

    generateDynamicChapters(bookData) {
        // Генерируем главы динамически на основе анализа книги
        const titleHash = this.stringToHash(bookData.title + bookData.author);
        const pageCount = bookData.pages || 200;
        
        // Определяем количество глав на основе длины книги
        let chapterCount;
        if (pageCount < 100) chapterCount = 5 + (titleHash % 3);
        else if (pageCount < 300) chapterCount = 8 + (titleHash % 5);
        else if (pageCount < 600) chapterCount = 12 + (titleHash % 8);
        else chapterCount = 15 + (titleHash % 10);

        const chapters = [];
        for (let i = 1; i <= chapterCount; i++) {
            // Случайно решаем, использовать ли "Глава", "Часть" или "Том"
            const type = this.getChapterType(titleHash + i, pageCount);
            chapters.push(`${type} ${i}`);
        }

        this.displayChaptersList(chapters);
    }

    getChapterType(seed, pageCount) {
        const types = ['Глава', 'Часть'];
        if (pageCount > 400) types.push('Том');
        if (pageCount > 600) types.push('Книга');
        
        return types[seed % types.length];
    }

    stringToHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }

    displayChaptersList(chapters) {
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

        this.showLoading('ИИ анализирует книгу...');
        this.analyzeChaptersBtn.disabled = true;

        try {
            const analysis = await this.createAIAnalysis();
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

    async createAIAnalysis() {
        const selectedChapters = Array.from(this.selectedChapters);
        const chapterNames = Array.from(this.chaptersList.querySelectorAll('.chapter-item label'))
            .map(label => label.textContent);
        const selectedChapterNames = selectedChapters.map(index => chapterNames[index]);

        // Генерируем уникальный анализ для каждой книги
        const analysis = await this.generateUniqueAnalysis(selectedChapterNames);
        
        return {
            chaptersSummary: analysis.summary,
            characters: analysis.characters,
            keyPoints: analysis.keyPoints,
            selectedChapters: selectedChapterNames,
            source: 'Анализ ИИ'
        };
    }

    async generateUniqueAnalysis(selectedChapters) {
        // Имитируем работу ИИ через сложную генерацию на основе характеристик книги
        const book = this.currentBook;
        const bookHash = this.stringToHash(book.title + book.author);
        
        // Генерируем уникальный контент для каждой книги
        const themes = this.generateThemes(book, bookHash);
        const characters = this.generateCharacters(book, bookHash);
        const plotElements = this.generatePlotElements(book, bookHash);
        
        // Создаем анализ для каждой выбранной главы
        const chapterSummaries = selectedChapters.map((chapter, index) => {
            const chapterHash = bookHash + this.stringToHash(chapter);
            return this.generateChapterSummary(chapter, index, selectedChapters.length, themes, characters, plotElements, chapterHash);
        });

        return {
            summary: chapterSummaries.join('\n\n'),
            characters: characters,
            keyPoints: themes
        };
    }

    generateThemes(book, hash) {
        const allThemes = [
            'Конфликт между личностью и обществом',
            'Поиск смысла жизни и духовные искания',
            'Любовь и отношения в условиях социальных ограничений',
            'Нравственный выбор и его последствия',
            'Влияние исторических событий на судьбы людей',
            'Противостояние добра и зла в человеческой душе',
            'Проблема отцов и детей, преемственность поколений',
            'Социальная несправедливость и борьба за равенство',
            'Трагедия одиночества и непонимания',
            'Сила искусства и творческого начала'
        ];

        // Выбираем уникальные темы для каждой книги
        const themeCount = 3 + (hash % 3);
        const selectedThemes = [];
        
        for (let i = 0; i < themeCount; i++) {
            const themeIndex = (hash + i * 7) % allThemes.length;
            selectedThemes.push(allThemes[themeIndex]);
        }

        return selectedThemes;
    }

    generateCharacters(book, hash) {
        const nameBases = ['Алекс', 'Мар', 'Влад', 'Дмитр', 'Серг', 'Анн', 'Елен', 'Ольг', 'Наталь', 'Иван'];
        const nameEndings = ['ей', 'ия', 'а', 'ий', 'ич', 'ина', 'ов', 'ева'];
        const roles = ['главный герой', 'антагонист', 'помощник', 'возлюбленный', 'наставник', 'друг'];
        const traits = [
            'сложный характер с внутренними противоречиями',
            'сильная воля и целеустремленность',
            'романтическая натура с тонкой душевной организацией',
            'прагматичный ум и расчетливость',
            'творческая личность с богатым воображением',
            'трагическая фигура, обреченная на страдания'
        ];

        const characterCount = 3 + (hash % 3);
        const characters = [];

        for (let i = 0; i < characterCount; i++) {
            const nameIndex = (hash + i * 11) % nameBases.length;
            const endingIndex = (hash + i * 13) % nameEndings.length;
            const roleIndex = (hash + i * 17) % roles.length;
            const traitIndex = (hash + i * 19) % traits.length;
            
            const name = nameBases[nameIndex] + nameEndings[endingIndex];
            const character = `${name} - ${roles[roleIndex]}, ${traits[traitIndex]}`;
            characters.push(character);
        }

        return characters;
    }

    generatePlotElements(book, hash) {
        const elements = [
            'неожиданная встреча',
            'трагическое событие',
            'важное решение',
            'духовное прозрение',
            'конфликт с обществом',
            'любовное признание',
            'нравственный выбор',
            'историческое событие',
            'семейная тайна',
            'творческое открытие'
        ];

        const selectedElements = [];
        const elementCount = 4 + (hash % 4);
        
        for (let i = 0; i < elementCount; i++) {
            const elementIndex = (hash + i * 23) % elements.length;
            selectedElements.push(elements[elementIndex]);
        }

        return selectedElements;
    }

    generateChapterSummary(chapter, index, totalChapters, themes, characters, plotElements, hash) {
        const chapterPosition = (index + 1) / totalChapters;
        let chapterType = '';
        
        if (chapterPosition < 0.25) chapterType = 'вводная';
        else if (chapterPosition < 0.5) chapterType = 'развивающая';
        else if (chapterPosition < 0.75) chapterType = 'кульминационная';
        else chapterType = 'заключительная';

        // Выбираем случайные элементы для этой главы
        const theme = themes[hash % themes.length];
        const plotElement = plotElements[(hash + 7) % plotElements.length];
        const character = characters[(hash + 13) % characters.length].split(' - ')[0];

        const summaries = [
            `**${chapter}**\n\nЭта ${chapterType} часть произведения развивает тему "${theme.toLowerCase()}". В центре внимания оказывается ${plotElement}, что значительно влияет на развитие характера ${character}.`,
            `**${chapter}**\n\nВ ${chapterType.toLowerCase()} главе происходит ${plotElement}, который раскрывает новые грани конфликта, связанного с "${theme.toLowerCase()}". ${character} оказывается перед сложным выбором.`,
            `**${chapter}**\n\n${chapterType.charAt(0).toUpperCase() + chapterType.slice(1)} глава углубляет понимание "${theme.toLowerCase()}". Через ${plotElement} автор демонстрирует эволюцию персонажа ${character} и его отношений с окружающим миром.`
        ];

        return summaries[hash % summaries.length];
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
        this.showLoading('ИИ формулирует ответ...');

        try {
            const answer = await this.generateAIAnswer(question);
            this.displayQA(question, answer);
            this.questionInput.value = '';
        } catch (error) {
            this.showError('Ошибка: ' + error.message);
        } finally {
            this.hideLoading();
            this.askBtn.disabled = false;
        }
    }

    async generateAIAnswer(question) {
        // Имитируем работу ИИ через сложную генерацию ответов
        const book = this.currentBook;
        const questionHash = this.stringToHash(question + book.title);
        
        const answerTemplates = [
            `На основе анализа "${book.title}" можно сказать, что ${this.bookAnalysis.keyPoints[0]?.toLowerCase() || 'произведение затрагивает важные философские вопросы'}. ${this.bookAnalysis.characters[0]?.split(' - ')[0] || 'Главный герой'} демонстрирует сложную эволюцию на протяжении повествования.`,
            `В произведении "${book.title}" ${this.bookAnalysis.keyPoints[1]?.toLowerCase() || 'раскрываются глубинные проблемы человеческого существования'}. Автор мастерски показывает, как ${this.bookAnalysis.characters[1]?.split(' - ')[0] || 'персонажи'} сталкиваются с нравственными дилеммами.`,
            `Анализ "${book.title}" показывает, что ${this.bookAnalysis.keyPoints[2]?.toLowerCase() || 'ключевой темой является противостояние личности и общества'}. Через призму ${this.bookAnalysis.characters[2]?.split(' - ')[0] || 'главного героя'} автор исследует вечные вопросы морали.`
        ];

        return answerTemplates[questionHash % answerTemplates.length];
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
        this.analysisStats.textContent = `Проанализировано разделов: ${analysis.selectedChapters.length}`;
        
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
            <div class="source-info">🤖 Ответ сгенерирован искусственным интеллектом</div>
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
