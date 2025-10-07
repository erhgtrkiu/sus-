class BookSummaryApp {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.initializeApp();
    }

    initializeElements() {
        // Поиск и ввод
        this.bookTitleInput = document.getElementById('bookTitle');
        this.suggestionsContainer = document.getElementById('suggestions');
        this.searchBtn = document.getElementById('searchBtn');
        
        // Информация о книге
        this.bookInfo = document.getElementById('bookInfo');
        this.bookCover = document.getElementById('bookCover');
        this.bookName = document.getElementById('bookName');
        this.bookAuthor = document.getElementById('bookAuthor');
        this.bookYear = document.getElementById('bookYear');
        this.bookRating = document.getElementById('bookRating');
        
        // Главы
        this.chaptersList = document.getElementById('chaptersList');
        this.selectAllBtn = document.getElementById('selectAllBtn');
        this.deselectAllBtn = document.getElementById('deselectAllBtn');
        this.generateSummaryBtn = document.getElementById('generateSummaryBtn');
        
        // Результаты
        this.loading = document.getElementById('loading');
        this.summaryResult = document.getElementById('summaryResult');
        this.generalSummary = document.getElementById('generalSummary');
        this.keyPoints = document.getElementById('keyPoints');
        this.characters = document.getElementById('characters');
        this.themes = document.getElementById('themes');
        this.exportBtn = document.getElementById('exportBtn');
        this.errorMessage = document.getElementById('errorMessage');
        
        this.selectedChapters = new Set();
    }

    bindEvents() {
        this.searchBtn.addEventListener('click', () => this.searchBook());
        this.bookTitleInput.addEventListener('input', () => this.handleInput());
        this.bookTitleInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchBook();
        });
        
        this.selectAllBtn.addEventListener('click', () => this.selectAllChapters());
        this.deselectAllBtn.addEventListener('click', () => this.deselectAllChapters());
        this.generateSummaryBtn.addEventListener('click', () => this.generateSummary());
        this.exportBtn.addEventListener('click', () => this.exportToPDF());
        
        // Закрытие подсказок при клике вне
        document.addEventListener('click', (e) => {
            if (!this.suggestionsContainer.contains(e.target)) {
                this.hideSuggestions();
            }
        });
    }

    initializeApp() {
        // Загрузка популярных книг для подсказок
        this.popularBooks = [
            "Преступление и наказание - Фёдор Достоевский",
            "Война и мир - Лев Толстой",
            "1984 - Джордж Оруэлл",
            "Мастер и Маргарита - Михаил Булгаков",
            "Гарри Поттер и философский камень - Джоан Роулинг",
            "Три товарища - Эрих Мария Ремарк",
            "Маленький принц - Антуан де Сент-Экзюпери",
            "Анна Каренина - Лев Толстой",
            "Сто лет одиночества - Габриэль Гарсиа Маркес",
            "Улисс - Джеймс Джойс"
        ];
    }

    handleInput() {
        const query = this.bookTitleInput.value.trim().toLowerCase();
        
        if (query.length < 2) {
            this.hideSuggestions();
            return;
        }

        const filtered = this.popularBooks.filter(book => 
            book.toLowerCase().includes(query)
        );

        this.showSuggestions(filtered);
    }

    showSuggestions(books) {
        if (books.length === 0) {
            this.hideSuggestions();
            return;
        }

        this.suggestionsContainer.innerHTML = books.map(book => `
            <div class="suggestion-item" onclick="app.selectSuggestion('${book}')">
                ${book}
            </div>
        `).join('');
        
        this.suggestionsContainer.style.display = 'block';
    }

    hideSuggestions() {
        this.suggestionsContainer.style.display = 'none';
    }

    selectSuggestion(bookTitle) {
        this.bookTitleInput.value = bookTitle;
        this.hideSuggestions();
        this.searchBook();
    }

    async searchBook() {
        const title = this.bookTitleInput.value.trim();
        
        if (!title) {
            this.showError('Пожалуйста, введите название книги');
            return;
        }

        this.showLoading();
        this.hideError();

        try {
            // Имитация поиска книги в базе данных
            const bookData = await this.findBookInDatabase(title);
            
            if (bookData) {
                this.displayBookInfo(bookData);
                this.generateChaptersList(bookData.chapters);
            } else {
                this.showError('Книга не найдена. Попробуйте другое название.');
            }
        } catch (error) {
            this.showError('Ошибка при поиске книги: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    async findBookInDatabase(title) {
        // Имитация задержки API
        await new Promise(resolve => setTimeout(resolve, 1000));

        // База данных книг (в реальном приложении здесь был бы вызов API)
        const bookDatabase = {
            'преступление и наказание': {
                title: 'Преступление и наказание',
                author: 'Фёдор Михайлович Достоевский',
                year: 1866,
                rating: '4.5/5',
                cover: 'https://via.placeholder.com/150x200/667eea/white?text=Преступление+и+наказание',
                chapters: ['Часть 1', 'Часть 2', 'Часть 3', 'Часть 4', 'Часть 5', 'Часть 6', 'Эпилог'],
                totalChapters: 7
            },
            'война и мир': {
                title: 'Война и мир',
                author: 'Лев Николаевич Толстой',
                year: 1869,
                rating: '4.8/5',
                cover: 'https://via.placeholder.com/150x200/764ba2/white?text=Война+и+мир',
                chapters: Array.from({length: 15}, (_, i) => `Том ${Math.floor(i/5) + 1}, Глава ${(i % 5) + 1}`),
                totalChapters: 15
            },
            '1984': {
                title: '1984',
                author: 'Джордж Оруэлл',
                year: 1949,
                rating: '4.6/5',
                cover: 'https://via.placeholder.com/150x200/28a745/white?text=1984',
                chapters: ['Часть 1', 'Часть 2', 'Часть 3'],
                totalChapters: 3
            }
        };

        const normalizedTitle = title.toLowerCase();
        return bookDatabase[normalizedTitle] || null;
    }

    displayBookInfo(bookData) {
        this.bookCover.src = bookData.cover;
        this.bookCover.alt = bookData.title;
        this.bookName.textContent = bookData.title;
        this.bookAuthor.textContent = `Автор: ${bookData.author}`;
        this.bookYear.textContent = `Год: ${bookData.year}`;
        this.bookRating.textContent = `Рейтинг: ${bookData.rating}`;
        
        this.bookInfo.classList.remove('hidden');
        this.summaryResult.classList.add('hidden');
    }

    generateChaptersList(chapters) {
        this.chaptersList.innerHTML = chapters.map((chapter, index) => `
            <div class="chapter-item" data-chapter="${index}">
                <input type="checkbox" id="chapter-${index}" onchange="app.toggleChapter(${index})">
                <label for="chapter-${index}">${chapter}</label>
            </div>
        `).join('');
        
        this.selectedChapters.clear();
    }

    toggleChapter(index) {
        const checkbox = document.getElementById(`chapter-${index}`);
        const chapterItem = checkbox.closest('.chapter-item');
        
        if (checkbox.checked) {
            this.selectedChapters.add(index);
            chapterItem.classList.add('selected');
        } else {
            this.selectedChapters.delete(index);
            chapterItem.classList.remove('selected');
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

    async generateSummary() {
        if (this.selectedChapters.size === 0) {
            this.showError('Пожалуйста, выберите хотя бы одну главу');
            return;
        }

        this.showLoading();
        this.hideError();

        try {
            // Имитация вызова AI API для генерации содержания
            const summaryData = await this.generateAISummary();
            this.displaySummary(summaryData);
        } catch (error) {
            this.showError('Ошибка при генерации содержания: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    async generateAISummary() {
        // Имитация работы AI (в реальном приложении здесь был бы вызов GPT-4 или аналогичного API)
        await new Promise(resolve => setTimeout(resolve, 3000));

        const selectedChaptersCount = this.selectedChapters.size;
        const bookTitle = this.bookName.textContent;

        return {
            generalSummary: `Роман "${bookTitle}" представляет собой глубокое философское произведение, исследующее темы морали, справедливости и человеческой природы. В выбранных ${selectedChaptersCount} главах раскрываются ключевые моменты сюжета, показывающие развитие главных персонажей и основные конфликты произведения.`,
            
            keyPoints: [
                'Основной конфликт между главным героем и обществом',
                'Развитие внутренних противоречий персонажа',
                'Ключевые повороты сюжета, влияющие на развязку',
                'Философские размышления автора о предназначении человека',
                'Социальная критика, актуальная и в наше время'
            ],
            
            characters: [
                'Главный герой - сложный персонаж с внутренними противоречиями',
                'Антагонист - представляет общественные нормы и законы',
                'Второстепенные персонажи - отражают разные аспекты общества'
            ],
            
            themes: [
                'Борьба добра и зла в человеческой душе',
                'Вопросы свободы воли и ответственности',
                'Социальная несправедливость и пути её преодоления',
                'Духовное возрождение через страдание'
            ]
        };
    }

    displaySummary(summaryData) {
        this.generalSummary.innerHTML = `<p>${summaryData.generalSummary}</p>`;
        
        this.keyPoints.innerHTML = summaryData.keyPoints.map(point => 
            `<div class="key-point">${point}</div>`
        ).join('');
        
        this.characters.innerHTML = summaryData.characters.map(character => 
            `<div class="character-item">${character}</div>`
        ).join('');
        
        this.themes.innerHTML = summaryData.themes.map(theme => 
            `<div class="theme-item">${theme}</div>`
        ).join('');
        
        this.summaryResult.classList.remove('hidden');
        this.summaryResult.scrollIntoView({ behavior: 'smooth' });
    }

    exportToPDF() {
        // Имитация экспорта в PDF
        alert('Функция экспорта в PDF будет реализована в полной версии приложения');
        // В реальном приложении здесь была бы библиотека типа jsPDF
    }

    showLoading() {
        this.loading.classList.remove('hidden');
        this.searchBtn.disabled = true;
        this.generateSummaryBtn.disabled = true;
    }

    hideLoading() {
        this.loading.classList.add('hidden');
        this.searchBtn.disabled = false;
        this.generateSummaryBtn.disabled = false;
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.classList.remove('hidden');
    }

    hideError() {
        this.errorMessage.classList.add('hidden');
    }
}

// Инициализация приложения
const app = new BookSummaryApp();
