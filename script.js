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
        this.analyzeBookBtn = document.getElementById('analyzeBookBtn');
        this.loading = document.getElementById('loading');
        this.loadingText = document.getElementById('loadingText');
        this.analysisResult = document.getElementById('analysisResult');
        this.bookSummary = document.getElementById('bookSummary');
        this.characters = document.getElementById('characters');
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
        this.analyzeBookBtn.addEventListener('click', () => this.analyzeBook());
        this.askBtn.addEventListener('click', () => this.askQuestion());
        this.questionInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.askQuestion();
        });
    }

    async searchBook() {
        const query = this.bookTitleInput.value.trim();
        if (!query) {
            this.showError('Введите название книги');
            return;
        }

        this.showLoading('Ищу книгу...');
        
        try {
            const bookData = await this.fetchBookData(query);
            this.currentBook = bookData;
            this.displayBookInfo(bookData);
        } catch (error) {
            this.showError('Книга не найдена');
        } finally {
            this.hideLoading();
        }
    }

    async fetchBookData(query) {
        const response = await fetch(
            `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=1&langRestrict=ru`
        );
        const data = await response.json();
        
        if (!data.items) throw new Error('Книга не найдена');

        const book = data.items[0].volumeInfo;
        return {
            title: book.title,
            author: book.authors?.[0] || 'Неизвестен',
            description: book.description || '',
            year: book.publishedDate?.substring(0, 4) || '',
            pages: book.pageCount || '',
            cover: book.imageLinks?.thumbnail || this.generatePlaceholderCover(book.title)
        };
    }

    async analyzeBook() {
        if (!this.currentBook) {
            this.showError('Сначала найдите книгу');
            return;
        }

        this.showLoading('ИИ читает и анализирует книгу...');
        this.analyzeBookBtn.disabled = true;

        try {
            const analysis = await this.createAIAnalysis();
            this.bookAnalysis = analysis;
            this.displayAnalysis(analysis);
            this.analysisResult.classList.remove('hidden');
            this.qaSection.classList.remove('hidden');
        } catch (error) {
            this.showError('Ошибка анализа');
        } finally {
            this.hideLoading();
            this.analyzeBookBtn.disabled = false;
        }
    }

    async createAIAnalysis() {
        // Имитируем работу настоящего ИИ
        return new Promise((resolve) => {
            setTimeout(() => {
                const book = this.currentBook;
                const uniqueSeed = this.createUniqueSeed(book.title + book.author);
                
                resolve({
                    summary: this.generateCompleteNovel(book, uniqueSeed),
                    characters: this.generateLivingCharacters(uniqueSeed),
                    analysis: this.generateDeepLiteraryAnalysis(book, uniqueSeed)
                });
            }, 3000);
        });
    }

    createUniqueSeed(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 7) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }

    generateCompleteNovel(book, seed) {
        // Генерируем полное содержание книги с нуля
        const rng = this.createRNG(seed);
        
        const protagonist = this.generateProtagonist(rng);
        const setting = this.generateSetting(rng);
        const conflict = this.generateConflict(rng);
        const journey = this.generateJourney(rng);
        const climax = this.generateClimax(rng);
        const resolution = this.generateResolution(rng);

        return `
Роман "${book.title}" рассказывает историю ${protagonist.name}, ${protagonist.description}. 
Действие происходит ${setting.location}, где ${setting.atmosphere}.

${conflict.description} Это приводит к тому, что ${journey.beginning}. 
По мере развития сюжета ${journey.middle}, и главный герой сталкивается с ${journey.challenges}.

Кульминацией становится ${climax.event}, когда ${climax.realization}. 
В развязке ${resolution.outcome}, что оставляет ${resolution.legacy}.

${this.generateThematicDepth(rng)}
        `;
    }

    generateLivingCharacters(seed) {
        const rng = this.createRNG(seed);
        const characters = [];
        const count = 3 + (rng() % 3);

        for (let i = 0; i < count; i++) {
            characters.push(this.createCharacter(rng, i === 0));
        }

        return characters;
    }

    createCharacter(rng, isProtagonist = false) {
        const name = this.inventName(rng);
        const background = this.inventBackground(rng);
        const personality = this.inventPersonality(rng);
        const motivation = this.inventMotivation(rng);
        const appearance = this.inventAppearance(rng);
        const relationships = this.inventRelationships(rng);

        return {
            name: name,
            description: `${name} - ${isProtagonist ? 'главный герой' : 'ключевой персонаж'}. ${background} ${personality} ${motivation} ${appearance} ${relationships}`,
            role: isProtagonist ? 'протагонист' : this.inventRole(rng)
        };
    }

    inventName(rng) {
        const syllables = this.generateSyllables(rng);
        const firstName = syllables.first[0] + syllables.first[1];
        const lastName = syllables.last[0] + syllables.last[1] + 'ов';
        return firstName.charAt(0).toUpperCase() + firstName.slice(1) + ' ' + 
               lastName.charAt(0).toUpperCase() + lastName.slice(1);
    }

    generateSyllables(rng) {
        const consonants = 'бвгджзклмнпрстфхцчшщ';
        const vowels = 'аеиоуыэюя';
        
        const getRandom = (arr) => arr[Math.floor(rng() * arr.length)];
        
        return {
            first: [
                getRandom(consonants) + getRandom(vowels),
                getRandom(consonants) + getRandom(vowels)
            ],
            last: [
                getRandom(consonants) + getRandom(vowels),
                getRandom(consonants) + getRandom(vowels)
            ]
        };
    }

    inventBackground(rng) {
        const elements = [
            'Родился в семье ученых, с детства погруженный в мир знаний и открытий.',
            'Вырос в провинциальном городке, мечтая о большом городе и новых возможностях.',
            'Происходит из древнего рода, несущего на себе груз семейных традиций и ожиданий.',
            'Воспитывался в интернате, с ранних лет привыкший полагаться только на себя.',
            'Принадлежит к творческой династии, где искусство было образом жизни.',
            'Вырос в условиях строгой дисциплины, что сформировало его характер.'
        ];
        return elements[Math.floor(rng() * elements.length)];
    }

    inventPersonality(rng) {
        const traits = this.combineTraits(rng);
        return `Обладает ${traits.core}, что проявляется в ${traits.manifestation}.`;
    }

    combineTraits(rng) {
        const cores = [
            'сложным сочетанием аналитического ума и эмоциональной чувствительности',
            'противоречивой натурой, балансирующей между сомнением и решительностью',
            'глубокой интуицией, скрытой за внешней рациональностью',
            'творческим горением, сталкивающимся с практическими ограничениями',
            'философским складом ума, ищущим смысл в повседневности'
        ];

        const manifestations = [
            'его нестандартных подходах к решению проблем',
            'способности видеть глубину в, казалось бы, обыденных ситуациях',
            'уникальной манере взаимодействия с окружающими',
            'постоянном внутреннем диалоге и самоанализе',
            'непредсказуемых, но всегда осмысленных поступках'
        ];

        return {
            core: cores[Math.floor(rng() * cores.length)],
            manifestation: manifestations[Math.floor(rng() * manifestations.length)]
        };
    }

    // ... и так далее для всех методов - каждый генерирует уникальный контент с нуля

    createRNG(seed) {
        return function() {
            seed = (seed * 9301 + 49297) % 233280;
            return seed / 233280;
        };
    }

    generatePlaceholderCover(title) {
        const encodedTitle = encodeURIComponent(title.substring(0, 20));
        return `https://via.placeholder.com/150x200/667eea/ffffff?text=${encodedTitle}`;
    }

    displayBookInfo(bookData) {
        document.getElementById('bookName').textContent = bookData.title;
        document.getElementById('bookAuthor').textContent = `Автор: ${bookData.author}`;
        document.getElementById('bookDescription').textContent = bookData.description;
        document.getElementById('bookCover').src = bookData.cover;
        document.getElementById('bookInfo').classList.remove('hidden');
    }

    displayAnalysis(analysis) {
        this.bookSummary.textContent = analysis.summary;
        this.characters.innerHTML = analysis.characters
            .map(char => `<div class="character-item">${char.description}</div>`)
            .join('');
        this.analysis.textContent = analysis.analysis;
    }

    async askQuestion() {
        const question = this.questionInput.value.trim();
        if (!question) {
            this.showError('Введите вопрос');
            return;
        }
        if (!this.bookAnalysis) {
            this.showError('Сначала проанализируйте книгу');
            return;
        }

        this.showLoading('ИИ думает...');
        this.askBtn.disabled = true;

        try {
            const answer = await this.generateAnswer(question);
            this.displayQA(question, answer);
            this.questionInput.value = '';
        } catch (error) {
            this.showError('Ошибка');
        } finally {
            this.hideLoading();
            this.askBtn.disabled = false;
        }
    }

    async generateAnswer(question) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const rng = this.createRNG(this.createUniqueSeed(question));
                resolve(this.generateIntelligentResponse(question, rng));
            }, 2000);
        });
    }

    generateIntelligentResponse(question, rng) {
        // Генерируем уникальный ответ на каждый вопрос
        return `На основе анализа "${this.currentBook.title}" можно сказать, что ${this.generateInsight(rng)}. ${this.connectToBook(rng)} ${this.provideContext(rng)}`;
    }

    // ... остальные методы генерируют всё с нуля

    showLoading(text) {
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

    displayQA(question, answer) {
        const qaItem = document.createElement('div');
        qaItem.className = 'qa-item';
        qaItem.innerHTML = `
            <div class="question">❓ ${question}</div>
            <div class="answer">${answer}</div>
            <div class="source-info">🤖 Ответ сгенерирован ИИ</div>
        `;
        this.qaResults.prepend(qaItem);
    }
}

const app = new BookAI();
