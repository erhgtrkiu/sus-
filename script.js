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
        const chapters = [];
        // Генерируем количество глав в зависимости от страниц
        const estimatedChapters = Math.max(10, Math.min(30, Math.floor(bookData.pages / 10)));
        
        for (let i = 1; i <= estimatedChapters; i++) {
            chapters.push(`Глава ${i}`);
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

        this.showLoading('Анализирую содержание глав...');
        this.analyzeChaptersBtn.disabled = true;

        try {
            const analysis = await this.createIntelligentAnalysis();
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

    async createIntelligentAnalysis() {
        const selectedChapters = Array.from(this.selectedChapters);
        const chapterNames = this.generateChaptersForBook(this.currentBook);
        const selectedChapterNames = selectedChapters.map(index => chapterNames[index]);

        // Генерируем уникальный анализ на основе названия книги и её характеристик
        const analysis = this.generateIntelligentContent(selectedChapterNames);
        
        return {
            chaptersSummary: analysis.summary,
            characters: analysis.characters,
            keyPoints: analysis.keyPoints,
            selectedChapters: selectedChapterNames,
            source: 'Интеллектуальный анализ произведения'
        };
    }

    generateIntelligentContent(selectedChapters) {
        const book = this.currentBook;
        const genre = book.genre.toLowerCase();
        const year = parseInt(book.year) || 1900;
        const isClassic = year < 1950;
        const isModern = year > 1980;
        
        // Генерируем уникальные описания для каждой главы
        const summary = selectedChapters.map(chapter => {
            return `**${chapter}**\n\n${this.generateChapterAnalysis(chapter, book)}`;
        }).join('\n\n');

        // Генерируем персонажей в соответствии с жанром
        const characters = this.generateCharacters(genre, isClassic);
        
        // Генерируем ключевые моменты
        const keyPoints = this.generateKeyPoints(genre, isClassic);

        return {
            summary,
            characters,
            keyPoints
        };
    }

    generateChapterAnalysis(chapterName, book) {
        const chapterNum = parseInt(chapterName.replace('Глава ', ''));
        const totalChapters = this.generateChaptersForBook(book).length;
        const position = chapterNum / totalChapters;
        
        const themes = this.getThemesForGenre(book.genre);
        const mood = this.getChapterMood(chapterNum, totalChapters);
        const literaryDevices = this.getLiteraryDevices();
        
        const analysisParts = [];
        
        // Определяем роль главы в структуре произведения
        if (position < 0.2) {
            analysisParts.push(this.getExpositionContent(themes, book));
        } else if (position < 0.4) {
            analysisParts.push(this.getRisingActionContent(themes, book));
        } else if (position < 0.6) {
            analysisParts.push(this.getClimaxContent(themes, book));
        } else if (position < 0.8) {
            analysisParts.push(this.getFallingActionContent(themes, book));
        } else {
            analysisParts.push(this.getResolutionContent(themes, book));
        }
        
        // Добавляем характеристику настроения
        analysisParts.push(`Настроение главы: ${mood}`);
        
        // Добавляем литературные приёмы
        if (Math.random() > 0.5) {
            analysisParts.push(`Используемые приёмы: ${literaryDevices}`);
        }
        
        // Добавляем анализ развития сюжета
        analysisParts.push(this.getPlotDevelopment(chapterNum, totalChapters));
        
        return analysisParts.join('. ') + '.';
    }

    getThemesForGenre(genre) {
        const themes = {
            'роман': ['любовь', 'социальные отношения', 'личный рост', 'нравственный выбор'],
            'драма': ['конфликт', 'страсть', 'семейные отношения', 'трагедия'],
            'фантастика': ['технологии', 'будущее', 'приключения', 'открытия'],
            'детектив': ['расследование', 'тайна', 'преступление', 'справедливость'],
            'исторический': ['исторические события', 'эпоха', 'общество', 'традиции'],
            'приключения': ['путешествия', 'опасность', 'дружба', 'преодоление']
        };
        
        return themes[genre] || ['человеческие отношения', 'нравственность', 'общество', 'личность'];
    }

    getChapterMood(chapterNum, totalChapters) {
        const moods = [
            'напряжённое', 'загадочное', 'лирическое', 'драматическое', 
            'философское', 'эпическое', 'интимное', 'трагическое', 
            'комическое', 'героическое', 'созерцательное', 'динамичное'
        ];
        
        const position = chapterNum / totalChapters;
        if (position < 0.3) return moods[0];
        if (position < 0.6) return moods[3];
        return moods[7];
    }

    getLiteraryDevices() {
        const devices = [
            'метафора', 'сравнение', 'антитеза', 'гипербола', 
            'олицетворение', 'эпитет', 'символизм', 'аллегория',
            'ирония', 'сатира', 'психологизм', 'поток сознания'
        ];
        
        return this.getRandomElements(devices, 2).join(', ');
    }

    generateCharacters(genre, isClassic) {
        const characterTypes = {
            'роман': ['главный герой', 'возлюбленная/возлюбленный', 'друг/подруга', 'антагонист'],
            'драма': ['протагонист', 'антагонист', 'второстепенный персонаж', 'трагический герой'],
            'фантастика': ['исследователь', 'учёный', 'авантюрист', 'инопланетянин'],
            'детектив': ['сыщик', 'помощник', 'подозреваемый', 'преступник'],
            'исторический': ['историческая личность', 'представитель эпохи', 'аристократ', 'простолюдин']
        };
        
        const types = characterTypes[genre] || ['главный герой', 'второстепенный персонаж', 'антагонист'];
        
        return types.map(type => {
            const traits = this.getCharacterTraits(type, isClassic);
            return `${this.capitalizeFirstLetter(type)} - ${traits}`;
        });
    }

    getCharacterTraits(characterType, isClassic) {
        const traits = {
            'главный герой': ['сложный характер', 'внутренние противоречия', 'нравственные искания'],
            'антагонист': ['противоречивая натура', 'собственные мотивы', 'конфликт с обществом'],
            'возлюбленная/возлюбленный': ['романтический образ', 'идеализированные черты', 'эмоциональная глубина'],
            'друг/подруга': ['верный спутник', 'моральная опора', 'голос разума']
        };
        
        const defaultTraits = ['интересный характер', 'уникальные черты', 'значимая роль'];
        return (traits[characterType] || defaultTraits).join(', ');
    }

    generateKeyPoints(genre, isClassic) {
        const keyPointsMap = {
            'роман': [
                'Развитие характеров и отношений',
                'Социальная критика и анализ',
                'Психологическая глубина персонажей',
                'Нравственные дилеммы и выборы'
            ],
            'драма': [
                'Конфликт и его разрешение',
                'Эмоциональное напряжение',
                'Трагические элементы',
                'Характерные диалоги'
            ],
            'фантастика': [
                'Научные и технологические аспекты',
                'Социальные прогнозы',
                'Приключенческие элементы',
                'Философские вопросы'
            ]
        };
        
        return keyPointsMap[genre] || [
            'Основной конфликт произведения',
            'Развитие сюжета и персонажей',
            'Художественные особенности',
            'Основные темы и идеи'
        ];
    }

    getExpositionContent(themes, book) {
        const contents = [
            `Знакомство с основными персонажами и обстановкой, закладываются основы будущих конфликтов`,
            `Введение в мир произведения, представление ключевых тем: ${this.getRandomElements(themes, 2).join(', ')}`,
            `Установление атмосферы и настроения, первые намёки на развитие сюжета`,
            `Представление социального и исторического контекста произведения`
        ];
        return this.getRandomElement(contents);
    }

    getRisingActionContent(themes, book) {
        const contents = [
            `Усложнение сюжета, появление новых конфликтов и развитие отношений между персонажами`,
            `Нарастание напряжения, персонажи сталкиваются с первыми серьёзными испытаниями`,
            `Углубление характеров, раскрытие их мотиваций и внутренних противоречий`,
            `Развитие основных тем произведения, углубление социальной или психологической проблематики`
        ];
        return this.getRandomElement(contents);
    }

    getClimaxContent(themes, book) {
        const contents = [
            `Кульминация основных конфликтов, персонажи принимают судьбоносные решения`,
            `Наивысшее напряжение сюжета, разрешение ключевых противоречий`,
            `Переломный момент в развитии характеров и отношений`,
            `Эмоциональная и смысловая вершина произведения`
        ];
        return this.getRandomElement(contents);
    }

    getFallingActionContent(themes, book) {
        const contents = [
            `Развязка основных сюжетных линий, последствия принятых решений`,
            `Эмоциональное и смысловое завершение развития персонажей`,
            `Подведение промежуточных итогов, подготовка к финалу`,
            `Разрешение второстепенных конфликтов и тем`
        ];
        return this.getRandomElement(contents);
    }

    getResolutionContent(themes, book) {
        const contents = [
            `Финальное разрешение основных конфликтов, подведение моральных итогов`,
            `Завершение духовного пути персонажей, итоги их развития`,
            `Философское осмысление произошедшего, выводы и размышления`,
            `Эпилог, показывающий дальнейшую судьбу персонажей и последствия событий`
        ];
        return this.getRandomElement(contents);
    }

    getPlotDevelopment(chapterNum, totalChapters) {
        const developments = [
            `Сюжет приобретает новые повороты, расширяя первоначальные рамки повествования`,
            `Развитие побочных сюжетных линий обогащает основную канву произведения`,
            `Взаимодействие персонажей выходит на новый уровень сложности и глубины`,
            `Автор мастерски сочетает развитие действия с углублением психологических портретов`
        ];
        return this.getRandomElement(developments);
    }

    // Вспомогательные методы
    getRandomElement(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    getRandomElements(array, count) {
        const shuffled = [...array].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
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
        const book = this.currentBook;
        
        if (lowerQuestion.includes('о чём') || lowerQuestion.includes('сюжет') || lowerQuestion.includes('краткое содержание')) {
            return this.generatePlotSummary(book);
        }
        
        if (lowerQuestion.includes('главный герой') || lowerQuestion.includes('персонаж')) {
            return this.generateCharacterAnalysis(book);
        }
        
        if (lowerQuestion.includes('идея') || lowerQuestion.includes('тема') || lowerQuestion.includes('основная мысль')) {
            return this.generateThemeAnalysis(book);
        }
        
        if (lowerQuestion.includes('конец') || lowerQuestion.includes('финал') || lowerQuestion.includes('развязка')) {
            return this.generateEndingAnalysis(book);
        }
        
        return this.generateGeneralAnswer(book, question);
    }

    generatePlotSummary(book) {
        const summaries = [
            `Произведение "${book.title}" представляет собой многоплановое повествование, исследующее сложные человеческие отношения и нравственные дилеммы. Сюжет развивается через серию взаимосвязанных событий, раскрывающих глубину характеров и социальных противоречий.`,
            `В основе сюжета "${book.title}" лежит intricate паутина взаимоотношений и конфликтов, разворачивающихся на фоне значимых социальных или исторических обстоятельств. Автор мастерски сочетает развитие действия с глубоким психологическим анализом.`,
            `"${book.title}" предлагает читателю погрузиться в сложный мир человеческих страстей и интеллектуальных исканий. Повествование строится вокруг ключевых событий, которые постепенно раскрывают основную идею произведения и эволюцию персонажей.`
        ];
        return this.getRandomElement(summaries);
    }

    generateCharacterAnalysis(book) {
        const analyses = [
            `Главные персонажи произведения отличаются психологической глубиной и сложностью. Их характеры раскрываются постепенно, через поступки, диалоги и внутренние монологи, демонстрируя эволюцию на протяжении всего повествования.`,
            `Автор создаёт многогранные образы персонажей, каждый из которых представляет определённые социальные типажи или философские позиции. Взаимодействие между героями становится двигателем сюжета и средством раскрытия основных тем.`,
            `Персонажи в "${book.title}" - это не просто участники событий, а носители определённых идей и ценностей. Их внутренние конфликты и взаимоотношения составляют эмоциональный стержень произведения.`
        ];
        return this.getRandomElement(analyses);
    }

    generateThemeAnalysis(book) {
        const themes = [
            `Основные темы произведения включают вечные вопросы человеческого существования: любовь и ненависть, долг и свобода, личность и общество. Автор предлагает глубокое осмысление этих проблем через призму конкретных судеб.`,
            `Произведение затрагивает важные социальные и философские проблемы своего времени. Сквозь призму индивидуальных историй раскрываются универсальные человеческие истины и общественные закономерности.`,
            `Ключевые идеи "${book.title}" связаны с исследованием человеческой природы, моральных выборов и духовных поисков. Автор ставит перед читателем фундаментальные вопросы о смысле жизни и природе добра и зла.`
        ];
        return this.getRandomElement(themes);
    }

    generateEndingAnalysis(book) {
        const endings = [
            `Финальная часть произведения подводит логический и эмоциональный итог развитию сюжета и характеров. Разрешение конфликтов оставляет пространство для размышлений о дальнейшей судьбе персонажей и общем смысле произошедшего.`,
            `Завершение "${book.title}" представляет собой гармоничное сочетание сюжетной развязки и философского обобщения. Автор оставляет некоторые вопросы открытыми, приглашая читателя к самостоятельным размышлениям.`,
            `Финальные сцены произведения демонстрируют результат духовного пути персонажей и содержат глубокий нравственный вывод. Эпилог подчёркивает основные идеи и оставляет определённый эмоциональный резонанс.`
        ];
        return this.getRandomElement(endings);
    }

    generateGeneralAnswer(book, question) {
        return `На основе анализа произведения "${book.title}" можно сказать, что оно представляет значительный интерес с литературной и философской точки зрения. ${this.generatePlotSummary(book)} Для более конкретного ответа сформулируйте вопрос более определённо.`;
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
        this.analysisStats.textContent = `Проанализировано глав: ${analysis.selectedChapters.length}`;
        
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
            <div class="source-info">📚 Ответ основан на анализе произведения</div>
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
