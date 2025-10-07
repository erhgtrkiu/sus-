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
        const bookTitle = bookData.title.toLowerCase();
        const chapters = [];
        
        // Для больших произведений с томами
        if (bookTitle.includes('война и мир') || 
            bookTitle.includes('анна каренина') ||
            bookTitle.includes('братья карамазовы') ||
            bookTitle.includes('идиот') ||
            bookPages > 500) {
            
            // Генерируем тома и главы для больших книг
            const totalVolumes = bookTitle.includes('война и мир') ? 4 : 3;
            const chaptersPerVolume = bookTitle.includes('война и мир') ? 20 : 15;
            
            for (let volume = 1; volume <= totalVolumes; volume++) {
                for (let chapter = 1; chapter <= chaptersPerVolume; chapter++) {
                    chapters.push(`Том ${volume} Глава ${chapter}`);
                }
            }
        } 
        // Для средних произведений
        else if (bookData.pages > 300) {
            const totalChapters = Math.min(25, Math.floor(bookData.pages / 15));
            for (let i = 1; i <= totalChapters; i++) {
                chapters.push(`Глава ${i}`);
            }
        }
        // Для обычных книг
        else {
            const totalChapters = Math.min(15, Math.floor(bookData.pages / 10));
            for (let i = 1; i <= totalChapters; i++) {
                chapters.push(`Глава ${i}`);
            }
        }
        
        // Если всё равно мало глав, добавляем до 15
        if (chapters.length < 8) {
            for (let i = chapters.length + 1; i <= 15; i++) {
                chapters.push(`Глава ${i}`);
            }
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

        this.showLoading('Создаю анализ для урока...');
        this.analyzeChaptersBtn.disabled = true;

        try {
            const analysis = await this.createSchoolAnalysis();
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

    async createSchoolAnalysis() {
        const bookTitle = this.currentBook.title.toLowerCase();
        const selectedChapters = Array.from(this.selectedChapters);
        const chapterNames = this.generateChaptersForBook(this.currentBook);
        const selectedChapterNames = selectedChapters.map(index => chapterNames[index]);

        const analysis = this.generateDetailedSchoolAnalysis(bookTitle, selectedChapterNames);
        
        return {
            chaptersSummary: analysis.summary,
            characters: analysis.characters,
            keyPoints: analysis.keyPoints,
            selectedChapters: selectedChapterNames,
            source: 'Анализ для школьной программы'
        };
    }

    generateDetailedSchoolAnalysis(bookTitle, selectedChapters) {
        let analysis = {
            summary: '',
            characters: [],
            keyPoints: []
        };

        analysis = this.generateGeneralAnalysis(selectedChapters);

        return analysis;
    }

    generateGeneralAnalysis(selectedChapters) {
        const chapterDescriptions = {
            'том 1': [
                "Введение в мир произведения, знакомство с основными персонажами и обстоятельствами.",
                "Развитие первоначальных событий, установление основных конфликтов.",
                "Углубление характеров главных героев, первые важные решения.",
                "Поворотные моменты, меняющие ход повествования.",
                "Нарастание напряжения, подготовка к ключевым событиям.",
                "Кульминационные сцены первого тома, важные откровения.",
                "Развязка первоначальных конфликтов, переход ко второму тому."
            ],
            'том 2': [
                "Новые обстоятельства и развитие ранее заложенных сюжетных линий.",
                "Появление второстепенных персонажей, усложнение конфликта.",
                "Психологическое развитие главных героев в новых условиях.",
                "Ключевые диалоги и монологи, раскрывающие философию произведения.",
                "Нарастание основного конфликта, подготовка к кульминации.",
                "Важные события, определяющие дальнейшую судьбу персонажей.",
                "Завершение второго тома с намёком на будущие события."
            ],
            'том 3': [
                "Развитие сюжета в новых декорациях, изменение динамики повествования.",
                "Глубокое раскрытие внутреннего мира персонажей.",
                "Поворотные моменты, кардинально меняющие отношения между героями.",
                "Философские размышления и моральные дилеммы.",
                "Кульминация основных сюжетных линий произведения.",
                "Разрешение ключевых конфликтов, переоценка ценностей.",
                "Подготовка к финальной части произведения."
            ],
            'том 4': [
                "Финальное развитие сюжета, приближение к развязке.",
                "Последние важные решения главных героев.",
                "Финальные конфликты и их разрешение.",
                "Эпические сцены, подводящие итоги всего произведения.",
                "Духовное преображение персонажей, итоги их пути.",
                "Финальные события, завершающие основные сюжетные линии.",
                "Эпилог и заключительные мысли автора."
            ],
            'default': [
                "Знакомство с персонажами и основными обстоятельствами сюжета.",
                "Развитие событий и углубление характеров.",
                "Поворотные моменты в развитии истории.",
                "Важные диалоги и развитие отношений.",
                "Нарастание напряжения и конфликта.",
                "Кульминационные события главы.",
                "Разрешение конфликтов и подготовка к следующим событиям."
            ]
        };

        return {
            summary: selectedChapters.map(chapter => {
                let description = "Анализ содержания данной части произведения.";
                
                // Определяем, к какому тому относится глава
                if (chapter.toLowerCase().includes('том 1')) {
                    const chapterNum = this.extractChapterNumber(chapter);
                    description = chapterDescriptions['том 1'][chapterNum - 1] || chapterDescriptions['default'][0];
                } else if (chapter.toLowerCase().includes('том 2')) {
                    const chapterNum = this.extractChapterNumber(chapter);
                    description = chapterDescriptions['том 2'][chapterNum - 1] || chapterDescriptions['default'][1];
                } else if (chapter.toLowerCase().includes('том 3')) {
                    const chapterNum = this.extractChapterNumber(chapter);
                    description = chapterDescriptions['том 3'][chapterNum - 1] || chapterDescriptions['default'][2];
                } else if (chapter.toLowerCase().includes('том 4')) {
                    const chapterNum = this.extractChapterNumber(chapter);
                    description = chapterDescriptions['том 4'][chapterNum - 1] || chapterDescriptions['default'][3];
                } else {
                    const chapterNum = this.extractChapterNumber(chapter);
                    description = chapterDescriptions['default'][chapterNum - 1] || chapterDescriptions['default'][0];
                }
                
                return `**${chapter}**\n\n${description}`;
            }).join('\n\n'),
            characters: [
                'Главный герой - центральный персонаж произведения, чья судьба составляет основу сюжета',
                'Второстепенные персонажи - помогают раскрыть характер главного героя и основной конфликт',
                'Антагонист - противник главного героя, создающий основные препятствия'
            ],
            keyPoints: [
                'Основной конфликт произведения и его развитие',
                'Развитие сюжета и характеров персонажей',
                'Ключевые идеи и темы, поднимаемые автором',
                'Художественные особенности и стиль повествования'
            ]
        };
    }

    extractChapterNumber(chapterName) {
        const match = chapterName.match(/Глава\s+(\d+)/);
        return match ? parseInt(match[1]) : 1;
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
        this.showLoading('Формирую ответ...');

        try {
            const answer = this.generateAnswer(question);
            this.displayQA(question, answer);
            this.questionInput.value = '';
        } catch (error) {
            this.showError('Ошибка: ' + error.message);
        } finally {
            this.hideLoading();
            this.askBtn.disabled = false;
        }
    }

    generateAnswer(question) {
        const lowerQuestion = question.toLowerCase();
        
        if (lowerQuestion.includes('о чём') || lowerQuestion.includes('сюжет') || lowerQuestion.includes('краткое содержание')) {
            return this.bookAnalysis.chaptersSummary.substring(0, 500) + "...";
        }
        
        if (lowerQuestion.includes('главный герой') || lowerQuestion.includes('персонаж')) {
            return "Главный герой произведения - сложный персонаж, чьи поступки и мысли раскрывают основные темы произведения. Его характер развивается на протяжении всего повествования.";
        }
        
        if (lowerQuestion.includes('идея') || lowerQuestion.includes('тема') || lowerQuestion.includes('основная мысль')) {
            return "Основная идея произведения затрагивает вечные темы добра и зла, справедливости, любви и самопознания. Автор поднимает важные философские вопросы.";
        }
        
        if (lowerQuestion.includes('конец') || lowerQuestion.includes('финал') || lowerQuestion.includes('развязка')) {
            return "Финал произведения подводит итог развитию сюжета и характеров персонажей, оставляя место для размышлений читателя.";
        }
        
        return "На основе анализа выбранных глав можно сказать, что произведение содержит глубокий смысл и интересный сюжет. Для более точного ответа уточните вопрос.";
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
            <div class="answer">${answer.replace(/\n/g, '<br>')}</div>
            <div class="source-info">📚 Ответ основан на анализе выбранных глав</div>
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
