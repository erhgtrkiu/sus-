class BookAI {
    constructor() {
        this.currentBook = null;
        this.bookAnalysis = null;
        this.selectedChapters = new Set();
        
        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        this.elements = {};
        const ids = [
            'bookTitle', 'searchBtn', 'analyzeBookBtn', 'loading', 'loadingText',
            'analysisResult', 'bookSummary', 'characters', 'analysis', 'qaSection',
            'questionInput', 'askBtn', 'qaResults', 'errorMessage', 'chaptersList',
            'selectAllBtn', 'deselectAllBtn', 'analyzeChaptersBtn'
        ];
        
        ids.forEach(id => {
            this.elements[id] = document.getElementById(id);
        });
    }

    bindEvents() {
        const bind = (element, event, handler) => {
            if (element) element.addEventListener(event, handler);
        };

        bind(this.elements.searchBtn, 'click', () => this.searchBook());
        bind(this.elements.bookTitleInput, 'keypress', (e) => {
            if (e.key === 'Enter') this.searchBook();
        });
        bind(this.elements.analyzeBookBtn, 'click', () => this.analyzeBook());
        bind(this.elements.askBtn, 'click', () => this.askQuestion());
        bind(this.elements.questionInput, 'keypress', (e) => {
            if (e.key === 'Enter') this.askQuestion();
        });
        bind(this.elements.selectAllBtn, 'click', () => this.selectAllChapters());
        bind(this.elements.deselectAllBtn, 'click', () => this.deselectAllChapters());
        bind(this.elements.analyzeChaptersBtn, 'click', () => this.analyzeSelectedChapters());
    }

    async searchBook() {
        const query = this.elements.bookTitleInput.value.trim();
        if (!query) {
            this.showError('Введите название книги');
            return;
        }

        this.showLoading('ИИ создаёт книгу...');
        
        try {
            const bookData = await this.generateBookFromNothing(query);
            this.currentBook = bookData;
            this.displayBookInfo(bookData);
            this.generateChaptersFromNothing(bookData);
        } catch (error) {
            this.showError('Ошибка: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    async generateBookFromNothing(query) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const seed = this.createSeed(query);
                const rng = this.createRNG(seed);
                
                resolve({
                    title: query,
                    author: this.generateAuthorFromAtoms(rng),
                    description: this.generateDescriptionFromAtoms(rng),
                    year: (1500 + Math.floor(rng() * 500)).toString(),
                    pages: 100 + Math.floor(rng() * 500),
                    cover: this.generateCoverFromNothing()
                });
            }, 1000);
        });
    }

    generateAuthorFromAtoms(rng) {
        const consonants = 'бвгджзйклмнпрстфхцчшщ';
        const vowels = 'аеиоуыэюя';
        
        const generateName = (minLen, maxLen, rng) => {
            let name = '';
            const length = minLen + Math.floor(rng() * (maxLen - minLen));
            
            for (let i = 0; i < length; i++) {
                if (i === 0) {
                    name += consonants[Math.floor(rng() * consonants.length)].toUpperCase();
                } else {
                    const prevChar = name[name.length - 1].toLowerCase();
                    if (consonants.includes(prevChar)) {
                        name += vowels[Math.floor(rng() * vowels.length)];
                    } else {
                        name += consonants[Math.floor(rng() * consonants.length)];
                    }
                }
            }
            return name;
        };

        return generateName(3, 6, rng) + ' ' + generateName(4, 8, rng);
    }

    generateDescriptionFromAtoms(rng) {
        const generateSentence = (wordCount, rng) => {
            const words = [];
            for (let i = 0; i < wordCount; i++) {
                words.push(this.generateWordFromAtoms(2 + Math.floor(rng() * 5), rng));
            }
            
            let sentence = words[0].charAt(0).toUpperCase() + words[0].slice(1);
            for (let i = 1; i < words.length; i++) {
                sentence += ' ' + words[i];
            }
            return sentence + '.';
        };

        const sentences = [];
        const sentenceCount = 3 + Math.floor(rng() * 2);
        for (let i = 0; i < sentenceCount; i++) {
            sentences.push(generateSentence(5 + Math.floor(rng() * 5), rng));
        }
        
        return sentences.join(' ');
    }

    generateWordFromAtoms(length, rng) {
        const consonants = 'бвгджзйклмнпрстфхцчшщ';
        const vowels = 'аеиоуыэюя';
        let word = '';
        
        for (let i = 0; i < length; i++) {
            if (i === 0) {
                word += consonants[Math.floor(rng() * consonants.length)];
            } else {
                const prevChar = word[word.length - 1];
                if (consonants.includes(prevChar)) {
                    word += vowels[Math.floor(rng() * vowels.length)];
                } else {
                    word += consonants[Math.floor(rng() * consonants.length)];
                }
            }
        }
        return word;
    }

    generateChaptersFromNothing(bookData) {
        if (!this.elements.chaptersList) return;
        
        const seed = this.createSeed(bookData.title + bookData.author);
        const rng = this.createRNG(seed);
        
        const chapters = [];
        const structureType = Math.floor(rng() * 3);
        
        if (structureType === 0) {
            // Только главы
            const count = 5 + Math.floor(rng() * 10);
            for (let i = 1; i <= count; i++) {
                chapters.push(`Глава ${i}`);
            }
        } else if (structureType === 1) {
            // Тома с главами
            const volumes = 2 + Math.floor(rng() * 2);
            for (let v = 1; v <= volumes; v++) {
                chapters.push(`Том ${v}`);
                const chaptersInVolume = 3 + Math.floor(rng() * 5);
                for (let c = 1; c <= chaptersInVolume; c++) {
                    chapters.push(`Глава ${c}`);
                }
            }
        } else {
            // Части
            const parts = 3 + Math.floor(rng() * 4);
            for (let i = 1; i <= parts; i++) {
                chapters.push(`Часть ${i}`);
            }
        }

        this.displayChaptersList(chapters);
    }

    async analyzeBook() {
        if (!this.currentBook) {
            this.showError('Сначала найдите книгу');
            return;
        }

        this.showLoading('ИИ анализирует книгу...');
        if (this.elements.analyzeBookBtn) {
            this.elements.analyzeBookBtn.disabled = true;
        }

        try {
            const analysis = await this.createAnalysisFromNothing();
            this.bookAnalysis = analysis;
            this.displayAnalysis(analysis);
            this.elements.analysisResult.classList.remove('hidden');
            this.elements.qaSection.classList.remove('hidden');
        } catch (error) {
            this.showError('Ошибка анализа');
        } finally {
            this.hideLoading();
            if (this.elements.analyzeBookBtn) {
                this.elements.analyzeBookBtn.disabled = false;
            }
        }
    }

    async createAnalysisFromNothing() {
        return new Promise((resolve) => {
            setTimeout(() => {
                const book = this.currentBook;
                const seed = this.createSeed(book.title + book.author);
                const rng = this.createRNG(seed);

                resolve({
                    summary: this.generateSummaryFromAtoms(book, rng),
                    characters: this.generateCharactersFromAtoms(rng),
                    analysis: this.generateAnalysisFromAtoms(rng)
                });
            }, 3000);
        });
    }

    generateSummaryFromAtoms(book, rng) {
        const paragraphs = [];
        for (let i = 0; i < 3; i++) {
            paragraphs.push(this.generateParagraphFromAtoms(30 + Math.floor(rng() * 20), rng));
        }
        return paragraphs.join('\n\n');
    }

    generateParagraphFromAtoms(wordCount, rng) {
        const words = [];
        for (let i = 0; i < wordCount; i++) {
            words.push(this.generateWordFromAtoms(2 + Math.floor(rng() * 5), rng));
        }
        
        let paragraph = words[0].charAt(0).toUpperCase() + words[0].slice(1);
        let sentenceLength = 1;
        
        for (let i = 1; i < words.length; i++) {
            paragraph += ' ' + words[i];
            sentenceLength++;
            
            if (sentenceLength >= 7 + Math.floor(rng() * 3) && i < words.length - 1) {
                paragraph += '. ' + words[i + 1].charAt(0).toUpperCase() + words[i + 1].slice(1);
                sentenceLength = 0;
                i++;
            }
        }
        
        return paragraph + '.';
    }

    generateCharactersFromAtoms(rng) {
        const characters = [];
        const count = 3 + Math.floor(rng() * 3);
        
        for (let i = 0; i < count; i++) {
            const name = this.generateAuthorFromAtoms(rng);
            const description = this.generateCharacterDescriptionFromAtoms(rng);
            characters.push(`${name} - ${description}`);
        }
        
        return characters.join('\n');
    }

    generateCharacterDescriptionFromAtoms(rng) {
        const traits = [];
        const traitCount = 2 + Math.floor(rng() * 2);
        
        for (let i = 0; i < traitCount; i++) {
            const adj = this.generateWordFromAtoms(3 + Math.floor(rng() * 3), rng);
            const noun = this.generateWordFromAtoms(4 + Math.floor(rng() * 3), rng);
            traits.push(`${adj} ${noun}`);
        }
        
        return traits.join(', ');
    }

    generateAnalysisFromAtoms(rng) {
        const points = [];
        const pointCount = 3 + Math.floor(rng() * 2);
        
        for (let i = 0; i < pointCount; i++) {
            const point = this.generateAnalysisPointFromAtoms(rng);
            points.push(point);
        }
        
        return points.join('\n\n');
    }

    generateAnalysisPointFromAtoms(rng) {
        const structures = [
            () => {
                const subject = this.generateWordFromAtoms(4, rng);
                const verb = this.generateWordFromAtoms(3, rng);
                const object = this.generateWordFromAtoms(5, rng);
                return `${subject.charAt(0).toUpperCase() + subject.slice(1)} ${verb} ${object}`;
            },
            () => {
                const technique = this.generateWordFromAtoms(5, rng);
                const purpose = this.generateWordFromAtoms(4, rng);
                return `Используется ${technique} для ${purpose}`;
            },
            () => {
                const element = this.generateWordFromAtoms(4, rng);
                const effect = this.generateWordFromAtoms(5, rng);
                return `${element.charAt(0).toUpperCase() + element.slice(1)} создаёт ${effect}`;
            }
        ];
        
        return structures[Math.floor(rng() * structures.length)]();
    }

    toggleChapter(index) {
        const checkbox = document.getElementById(`chapter-${index}`);
        if (!checkbox) return;
        
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
        if (!this.elements.chaptersList) return;
        
        const checkboxes = this.elements.chaptersList.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach((checkbox, index) => {
            checkbox.checked = true;
            this.selectedChapters.add(index);
            checkbox.closest('.chapter-item').classList.add('selected');
        });
    }

    deselectAllChapters() {
        if (!this.elements.chaptersList) return;
        
        const checkboxes = this.elements.chaptersList.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach((checkbox, index) => {
            checkbox.checked = false;
            this.selectedChapters.delete(index);
            checkbox.closest('.chapter-item').classList.remove('selected');
        });
    }

    async analyzeSelectedChapters() {
        if (this.selectedChapters.size === 0) {
            this.showError('Выберите главы для анализа');
            return;
        }

        this.showLoading('ИИ анализирует выбранные главы...');
        if (this.elements.analyzeChaptersBtn) {
            this.elements.analyzeChaptersBtn.disabled = true;
        }

        try {
            const analysis = await this.createChapterAnalysis();
            this.bookAnalysis = analysis;
            this.displayAnalysis(analysis);
            this.elements.analysisResult.classList.remove('hidden');
            this.elements.qaSection.classList.remove('hidden');
        } catch (error) {
            this.showError('Ошибка анализа');
        } finally {
            this.hideLoading();
            if (this.elements.analyzeChaptersBtn) {
                this.elements.analyzeChaptersBtn.disabled = false;
            }
        }
    }

    async createChapterAnalysis() {
        return new Promise((resolve) => {
            setTimeout(() => {
                const book = this.currentBook;
                const seed = this.createSeed(book.title + book.author);
                const selectedChapters = Array.from(this.selectedChapters);
                
                let chapterNames = [];
                if (this.elements.chaptersList) {
                    chapterNames = Array.from(this.elements.chaptersList.querySelectorAll('.chapter-item label'))
                        .map(label => label.textContent);
                }
                const selectedChapterNames = selectedChapters.map(index => chapterNames[index] || `Раздел ${index + 1}`);

                resolve({
                    summary: this.generateChapterSummary(book, seed, selectedChapterNames),
                    characters: this.generateCharactersFromAtoms(this.createRNG(seed + 1)),
                    analysis: this.generateAnalysisFromAtoms(this.createRNG(seed + 2)),
                    selectedChapters: selectedChapterNames
                });
            }, 2000);
        });
    }

    generateChapterSummary(book, seed, chapterNames) {
        const rng = this.createRNG(seed);
        let summary = `Анализ выбранных разделов произведения "${book.title}":\n\n`;
        
        chapterNames.forEach((chapterName, index) => {
            const chapterSeed = seed + index * 100;
            const chapterRNG = this.createRNG(chapterSeed);
            const chapterText = this.generateParagraphFromAtoms(20 + Math.floor(chapterRNG() * 10), chapterRNG);
            summary += `**${chapterName}**\n${chapterText}\n\n`;
        });
        
        return summary;
    }

    displayChaptersList(chapters) {
        if (!this.elements.chaptersList) return;
        
        this.elements.chaptersList.innerHTML = chapters.map((chapter, index) => `
            <div class="chapter-item" onclick="app.toggleChapter(${index})">
                <input type="checkbox" id="chapter-${index}">
                <label for="chapter-${index}">${chapter}</label>
            </div>
        `).join('');
        
        this.selectedChapters.clear();
    }

    generateCoverFromNothing() {
        const canvas = document.createElement('canvas');
        canvas.width = 150;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');
        
        // Случайный цвет
        const hue = Math.floor(Math.random() * 360);
        ctx.fillStyle = `hsl(${hue}, 70%, 80%)`;
        ctx.fillRect(0, 0, 150, 200);
        
        // Текст
        ctx.fillStyle = '#2c3e50';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('КНИГА', 75, 100);
        
        return canvas.toDataURL();
    }

    createRNG(seed) {
        return function() {
            seed = (seed * 9301 + 49297) % 233280;
            return seed / 233280;
        };
    }

    createSeed(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }

    displayBookInfo(bookData) {
        this.elements.bookName.textContent = bookData.title;
        this.elements.bookAuthor.textContent = `Автор: ${bookData.author}`;
        this.elements.bookDescription.textContent = bookData.description;
        this.elements.bookCover.src = bookData.cover;
        this.elements.bookInfo.classList.remove('hidden');
    }

    displayAnalysis(analysis) {
        this.elements.bookSummary.innerHTML = analysis.summary.replace(/\n\n/g, '<br><br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        this.elements.characters.textContent = analysis.characters;
        this.elements.analysis.textContent = analysis.analysis;
    }

    async askQuestion() {
        const question = this.elements.questionInput.value.trim();
        if (!question) {
            this.showError('Введите вопрос');
            return;
        }
        if (!this.bookAnalysis) {
            this.showError('Сначала проанализируйте книгу');
            return;
        }

        this.showLoading('ИИ думает...');
        this.elements.askBtn.disabled = true;

        try {
            const answer = await this.generateAnswer(question);
            this.displayQA(question, answer);
            this.elements.questionInput.value = '';
        } catch (error) {
            this.showError('Ошибка');
        } finally {
            this.hideLoading();
            this.elements.askBtn.disabled = false;
        }
    }

    async generateAnswer(question) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const seed = this.createSeed(question + this.currentBook.title);
                const rng = this.createRNG(seed);
                resolve(this.generateParagraphFromAtoms(25 + Math.floor(rng() * 15), rng));
            }, 1500);
        });
    }

    showLoading(text) {
        this.elements.loadingText.textContent = text;
        this.elements.loading.classList.remove('hidden');
    }

    hideLoading() {
        this.elements.loading.classList.add('hidden');
    }

    showError(message) {
        this.elements.errorMessage.textContent = message;
        this.elements.errorMessage.classList.remove('hidden');
    }

    hideError() {
        this.elements.errorMessage.classList.add('hidden');
    }

    displayQA(question, answer) {
        const qaItem = document.createElement('div');
        qaItem.className = 'qa-item';
        qaItem.innerHTML = `
            <div class="question">❓ ${question}</div>
            <div class="answer">${answer}</div>
            <div class="source-info">🤖 Ответ сгенерирован ИИ</div>
        `;
        this.elements.qaResults.prepend(qaItem);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new BookAI();
});
