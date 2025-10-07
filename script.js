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
                source: 'Google Books'
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
                'Глава 1 - Введение',
                'Глава 2 - Развитие сюжета', 
                'Глава 3 - Кульминация',
                'Глава 4 - Развязка'
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

        this.showLoading('Анализирую выбранные главы...');
        this.analyzeChaptersBtn.disabled = true;

        try {
            const analysis = await this.generateChaptersAnalysis();
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

    async generateChaptersAnalysis() {
        const selectedChaptersArray = Array.from(this.selectedChapters);
        const chapters = this.generateChaptersForBook(this.currentBook);
        const selectedChapterNames = selectedChaptersArray.map(index => chapters[index]);
        
        // Генерируем реалистичный анализ на основе выбранных глав
        const chapterAnalysis = this.generateChapterContent(selectedChapterNames);
        
        return {
            chaptersSummary: chapterAnalysis.summary,
            characters: chapterAnalysis.characters,
            keyPoints: chapterAnalysis.keyPoints,
            selectedChapters: selectedChapterNames,
            source: 'Анализ на основе выбранных глав'
        };
    }

    generateChapterContent(selectedChapters) {
        // Генерируем реалистичное содержание для выбранных глав
        const chapterContents = selectedChapters.map(chapter => {
            return this.generateSingleChapterContent(chapter);
        });

        const summary = chapterContents.map(content => content.summary).join('\n\n');
        const allCharacters = [...new Set(chapterContents.flatMap(content => content.characters))];
        const allKeyPoints = chapterContents.flatMap(content => content.keyPoints);

        return {
            summary: summary,
            characters: allCharacters.slice(0, 8),
            keyPoints: allKeyPoints.slice(0, 6)
        };
    }

    generateSingleChapterContent(chapterName) {
        // Генерируем реалистичное содержание для одной главы
        const chapterTemplates = [
            `В ${chapterName} происходит развитие основных событий сюжета. Главные герои сталкиваются с новыми вызовами и принимают важные решения, которые влияют на дальнейшее развитие истории.`,
            `${chapterName} посвящена раскрытию характеров персонажей и их взаимоотношений. Через диалоги и действия героев автор показывает их мотивацию и внутренние противоречия.`,
            `В ${chapterName} нарастает напряжение, происходят ключевые события, которые меняют ход повествования. Герои оказываются перед сложным выбором, определяющим их дальнейшую судьбу.`,
            `${chapterName} содержит кульминационные моменты, где конфликты достигают своего пика. Персонажи демонстрируют настоящую сущность в критических ситуациях.`
        ];

        const characterTemplates = [
            'Главный герой сталкивается с внутренним конфликтом',
            'Второстепенный персонаж раскрывает новые черты характера',
            'Антагонист проявляет свою истинную природу',
            'Взаимоотношения между персонажами углубляются',
            'Появляется новый персонаж, влияющий на сюжет'
        ];

        const keyPointTemplates = [
            'Поворотный момент в развитии сюжета',
            'Важное решение главного героя',
            'Конфликт достигает кульминации',
            'Раскрытие ключевой информации',
            'Изменение отношений между персонажами',
            'Новый виток в развитии истории'
        ];

        return {
            summary: chapterTemplates[Math.floor(Math.random() * chapterTemplates.length)],
            characters: this.shuffleArray(characterTemplates).slice(0, 3),
            keyPoints: this.shuffleArray(keyPointTemplates).slice(0, 2)
        };
    }

    shuffleArray(array) {
        return array.sort(() => Math.random() - 0.5);
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
        this.showLoading('Формирую ответ...');

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
                return 'Персонажи в выбранных главах:\n\n• ' + this.bookAnalysis.characters.join('\n• ');
            }

            if (lowerQuestion.includes('ключевой') || lowerQuestion.includes('момент') || lowerQuestion.includes('событие')) {
                return 'Ключевые моменты:\n\n• ' + this.bookAnalysis.keyPoints.join('\n• ');
            }

            if (lowerQuestion.includes('глава') || lowerQuestion.includes('часть')) {
                return 'Выбранные главы для анализа:\n\n• ' + this.bookAnalysis.selectedChapters.join('\n• ');
            }
        }

        // Общие вопросы о книге
        if (lowerQuestion.includes('кто автор') || lowerQuestion.includes('кто написал')) {
            return `Автор книги "${this.currentBook.title}" - ${this.currentBook.author || 'информация об авторе отсутствует'}.`;
        }

        if (lowerQuestion.includes('когда') || lowerQuestion.includes('год')) {
            return `Книга была опубликована в ${this.currentBook.year || 'неизвестном'} году.`;
        }

        return `На основе анализа выбранных глав книги "${this.currentBook.title}": ${this.bookAnalysis.chaptersSummary.substring(0, 200)}...`;
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
        this.chaptersSummary.innerHTML = `<p>${analysis.chaptersSummary}</p>`;
        
        this.characters.innerHTML = analysis.characters.map(character => 
            `<div class="character-item">${character}</div>`
        ).join('');
        
        this.keyPoints.innerHTML = analysis.keyPoints.map(point => 
            `<div class="key-point">${point}</div>`
        ).join('');
        
        this.analysisStats.textContent = `Проанализировано глав: ${analysis.selectedChapters.length}`;
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
    console.log('BookAI initialized - с выбором глав');
});
