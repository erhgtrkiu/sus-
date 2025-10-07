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
                this.showError('Книга не найдена. Попробуйте: "Преступление и наказание", "Война и мир", "Капитанская дочка"');
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
        // Для школьной программы делаем стандартные разделы
        return [
            'Введение и экспозиция',
            'Завязка сюжета', 
            'Развитие действия',
            'Кульминация',
            'Развязка',
            'Заключение'
        ];
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

        // Создаем качественный анализ для школьной программы
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

        // Анализ для популярных школьных произведений
        if (bookTitle.includes('преступление') && bookTitle.includes('наказание')) {
            analysis = this.analyzeCrimeAndPunishment(selectedChapters);
        } else if (bookTitle.includes('война') && bookTitle.includes('мир')) {
            analysis = this.analyzeWarAndPeace(selectedChapters);
        } else if (bookTitle.includes('капитанская') && bookTitle.includes('дочка')) {
            analysis = this.analyzeCaptainsDaughter(selectedChapters);
        } else if (bookTitle.includes('герой') && bookTitle.includes('времени')) {
            analysis = this.analyzeHeroOfOurTime(selectedChapters);
        } else if (bookTitle.includes('отцы') && bookTitle.includes('дети')) {
            analysis = this.analyzeFathersAndSons(selectedChapters);
        } else if (bookTitle.includes('евгений') && bookTitle.includes('онегин')) {
            analysis = this.analyzeEugeneOnegin(selectedChapters);
        } else {
            analysis = this.generateGeneralAnalysis(selectedChapters);
        }

        return analysis;
    }

    analyzeCrimeAndPunishment(selectedChapters) {
        const characters = [
            'Родион Раскольников - бывший студент, создатель теории о "сверхчеловеке"',
            'Соня Мармеладова - дочь чиновника, символ христианского смирения',
            'Порфирий Петрович - следователь, разгадавший преступление',
            'Дмитрий Разумихин - друг Раскольникова, противоположность ему',
            'Аркадий Свидригайлов - циничный помещик, двойник Раскольникова',
            'Катерина Ивановна - жена Мармеладова, трагическая фигура'
        ];

        const keyPoints = [
            'Теория Раскольникова о "тварях дрожащих" и "право имеющих"',
            'Убийство старухи-процентщицы - проверка теории',
            'Душевные муки и болезнь после преступления',
            'Роль Сони Мармеладовой в духовном возрождении',
            'Признание и суд над Раскольниковым',
            'Ссылка в Сибирь как путь к искуплению'
        ];

        const summary = this.generateChapterSummary(selectedChapters, [
            'Знакомство с Раскольниковым и его теорией. Петербург 1860-х годов.',
            'Подготовка к преступлению. Социальные условия толкают на убийство.',
            'Совершение преступления и первые последствия. Психологические терзания.',
            'Расследование Порфирия Петровича. Психологическая дуэль.',
            'Встреча с Соней Мармеладовой. Христианские ценности vs нигилизм.',
            'Признание и наказание. Духовное перерождение героя.'
        ]);

        return { summary, characters: characters.slice(0, 4), keyPoints: keyPoints.slice(0, 4) };
    }

    analyzeCaptainsDaughter(selectedChapters) {
        const characters = [
            'Пётр Гринёв - молодой дворянин, главный герой',
            'Маша Миронова - капитанская дочка, возлюбленная Гринёва',
            'Емельян Пугачёв - предводитель восстания, сложный персонаж',
            'Алексей Швабрин - антагонист, предатель',
            'Капитан Миронов - комендант Белогорской крепости',
            'Савельич - верный слуга Гринёва'
        ];

        const keyPoints = [
            'Восстание Пугачёва 1773-1775 годов',
            'Честь и долг русского офицера',
            'Любовь в условиях исторических потрясений',
            'Народный характер восстания',
            'Проблема милосердия и справедливости',
            'Историческая достоверность событий'
        ];

        const summary = this.generateChapterSummary(selectedChapters, [
            'Детство Гринёва. Отправление на службу. Встреча с Пугачёвым.',
            'Прибытие в Белогорскую крепость. Знакомство с Машей Мироновой.',
            'Начало восстания. Осада и падение крепости.',
            'Встречи с Пугачёвым. Проблема милосердия и благодарности.',
            'Спасение Маши. Противостояние со Швабриным.',
            'Арест Гринёва. Суд и оправдание. Счастливый финал.'
        ]);

        return { summary, characters: characters.slice(0, 4), keyPoints: keyPoints.slice(0, 4) };
    }

    analyzeWarAndPeace(selectedChapters) {
        const characters = [
            'Пьер Безухов - искатель смысла жизни, незаконнорожденный сын графа',
            'Андрей Болконский - аристократ, разочарованный в светской жизни',
            'Наташа Ростова - жизнерадостная девушка, символ русской души',
            'Николай Ростов - честный офицер, представитель старого дворянства',
            'Кутузов - главнокомандующий, выразитель народной мудрости',
            'Наполеон - антипод Кутузова, олицетворение индивидуализма'
        ];

        const keyPoints = [
            'Отечественная война 1812 года как народная война',
            'Семья Ростовых vs семья Болконских',
            'Духовные искания Пьера Безухова',
            'Философия истории Толстого',
            'Бородинское сражение - кульминация романа',
            'Мысль семейная в произведении'
        ];

        const summary = this.generateChapterSummary(selectedChapters, [
            'Светское общество Петербурга 1805 года. Знакомство с главными героями.',
            'Война 1805 года. Шенграбен и Аустерлиц. Ранение Болконского.',
            'Мирная жизнь. Сватовство, браки, семейные отношения.',
            '1812 год. Наполеон в России. Бородинское сражение.',
            'Пожар Москвы. Партизанская война. Отступление французов.',
            'Послевоенная жизнь. Духовное обновление героев.'
        ]);

        return { summary, characters: characters.slice(0, 4), keyPoints: keyPoints.slice(0, 4) };
    }

    analyzeHeroOfOurTime(selectedChapters) {
        const characters = [
            'Григорий Печорин - "лишний человек", главный герой',
            'Бэла - черкесская княжна, первая жертва Печорина',
            'Максим Максимыч - штабс-капитан, рассказчик',
            'Княжна Мэри - светская девушка, объект игры Печорина',
            'Вера - единственная женщина, которую любил Печорин',
            'Грушницкий - юнкер, пародия на романтического героя'
        ];

        const keyPoints = [
            'Печорин как "лишний человек" 1830-х годов',
            'Психологический портрет поколения',
            'Любовь как игра и эксперимент',
            'Проблема счастья и смысла жизни',
            'Композиция романа (повести в разном порядке)',
            'Романтизм vs реализм в произведении'
        ];

        const summary = this.generateChapterSummary(selectedChapters, [
            '"Бэла" - история похищения черкесской княжны. Трагический финал.',
            '"Максим Максимыч" - встреча через несколько лет. Холодность Печорина.',
            '"Тамань" - опасное приключение с контрабандистами.',
            '"Княжна Мэри" - светский роман в Пятигорске. Дуэль с Грушницким.',
            '"Фаталист" - философские размышления о судьбе.',
            'Образ Печорина как диагноз эпохи.'
        ]);

        return { summary, characters: characters.slice(0, 4), keyPoints: keyPoints.slice(0, 4) };
    }

    generateChapterSummary(selectedChapters, allSummaries) {
        return selectedChapters.map(chapter => {
            const index = this.generateChaptersForBook(this.currentBook).indexOf(chapter);
            return `**${chapter}**\n\n${allSummaries[index] || allSummaries[0]}`;
        }).join('\n\n');
    }

    generateGeneralAnalysis(selectedChapters) {
        return {
            summary: selectedChapters.map(chapter => 
                `**${chapter}**\n\nВ этом разделе раскрываются основные события произведения, характеры героев и ключевые идеи автора.`
            ).join('\n\n'),
            characters: [
                'Главный герой - центральный персонаж произведения',
                'Второстепенные персонажи - помогают раскрыть основной конфликт',
                'Антагонист - противник главного героя'
            ],
            keyPoints: [
                'Основной конфликт произведения',
                'Развитие сюжета и характеров',
                'Ключевые идеи и темы',
                'Художественные особенности'
            ]
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
            return this.bookAnalysis.chaptersSummary;
        }

        if (lowerQuestion.includes('персонаж') || lowerQuestion.includes('герой')) {
            return '**Главные персонажи:**\n\n' + this.bookAnalysis.characters.map(char => `• ${char}`).join('\n');
        }

        if (lowerQuestion.includes('тема') || lowerQuestion.includes('идея') || lowerQuestion.includes('проблем')) {
            return '**Ключевые темы:**\n\n' + this.bookAnalysis.keyPoints.map(point => `• ${point}`).join('\n');
        }

        if (lowerQuestion.includes('автор')) {
            return `Автор: **${this.currentBook.author}**\nГод написания: ${this.currentBook.year || 'неизвестен'}\nЖанр: ${this.currentBook.genre || 'не указан'}`;
        }

        if (lowerQuestion.includes('анализ') || lowerQuestion.includes('мысль')) {
            return `**Анализ произведения "${this.currentBook.title}":**\n\n${this.bookAnalysis.chaptersSummary.substring(0, 300)}...`;
        }

        return `На вопрос о книге "${this.currentBook.title}": ${this.bookAnalysis.chaptersSummary.substring(0, 200)}...\n\nДля более точного ответа задайте конкретный вопрос о сюжете, персонажах или темах.`;
    }

    displayBookInfo(bookData) {
        this.bookCover.src = bookData.cover;
        this.bookCover.alt = bookData.title;
        this.bookName.textContent = bookData.title;
        this.bookAuthor.textContent = `Автор: ${bookData.author}`;
        this.bookDescription.textContent = bookData.description || 'Классическое произведение русской литературы';
        this.bookYear.textContent = `Год: ${bookData.year}`;
        this.bookPages.textContent = `Страниц: ${bookData.pages}`;
        this.bookRating.textContent = bookData.rating;
    }

    displayAnalysis(analysis) {
        this.chaptersSummary.innerHTML = `<div class="analysis-text">${analysis.chaptersSummary.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</div>`;
        
        this.characters.innerHTML = analysis.characters.map(character => 
            `<div class="character-item">${character}</div>`
        ).join('');
        
        this.keyPoints.innerHTML = analysis.keyPoints.map(point => 
            `<div class="key-point">${point}</div>`
        ).join('');
        
        this.analysisStats.textContent = `Анализ для урока литературы | Разделов: ${analysis.selectedChapters.length}`;
    }

    displayQA(question, answer) {
        const qaItem = document.createElement('div');
        qaItem.className = 'qa-item';
        qaItem.innerHTML = `
            <div class="question">❓ ${question}</div>
            <div class="answer">${answer.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</div>
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
    console.log('BookAI для школьников запущен!');
});
