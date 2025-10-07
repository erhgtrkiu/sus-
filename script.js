class BookAI {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.currentBook = null;
        this.bookAnalysis = null;
    }

    initializeElements() {
        this.bookTitleInput = document.getElementById('bookTitle');
        this.apiKeyInput = document.getElementById('apiKey');
        this.searchBtn = document.getElementById('searchBtn');
        
        this.bookInfo = document.getElementById('bookInfo');
        this.bookCover = document.getElementById('bookCover');
        this.bookName = document.getElementById('bookName');
        this.bookAuthor = document.getElementById('bookAuthor');
        this.bookDescription = document.getElementById('bookDescription');
        this.bookYear = document.getElementById('bookYear');
        this.bookPages = document.getElementById('bookPages');
        this.bookRating = document.getElementById('bookRating');
        
        this.loading = document.getElementById('loading');
        this.loadingText = document.getElementById('loadingText');
        this.summaryResult = document.getElementById('summaryResult');
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
        const apiKey = this.apiKeyInput.value.trim();
        
        if (!query) {
            this.showError('Пожалуйста, введите название книги');
            return;
        }
        
        if (!apiKey) {
            this.showError('Пожалуйста, введите OpenAI API ключ');
            return;
        }

        if (!apiKey.startsWith('sk-')) {
            this.showError('Неверный формат API ключа. Ключ должен начинаться с "sk-"');
            return;
        }

        this.showLoading('Ищем информацию о книге...');
        this.hideError();
        this.searchBtn.disabled = true;

        try {
            // Получаем информацию о книге из Google Books API
            const bookData = await this.getBookInfo(query);
            
            if (bookData) {
                this.currentBook = bookData;
                this.displayBookInfo(bookData);
                
                // Анализируем книгу с помощью AI
                this.loadingText.textContent = 'AI анализирует книгу...';
                this.bookAnalysis = await this.analyzeBookWithAI(bookData, apiKey);
                this.displayAnalysis(this.bookAnalysis);
                
                this.qaSection.classList.remove('hidden');
            } else {
                this.showError('Книга не найдена. Попробуйте уточнить название и автора');
            }
        } catch (error) {
            this.showError('Ошибка: ' + error.message);
            console.error(error);
        } finally {
            this.hideLoading();
            this.searchBtn.disabled = false;
        }
    }

    async getBookInfo(query) {
        const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&langRestrict=ru&maxResults=1`);
        
        if (!response.ok) {
            throw new Error('Ошибка при поиске книги');
        }
        
        const data = await response.json();
        
        if (!data.items || data.items.length === 0) {
            return null;
        }
        
        const book = data.items[0].volumeInfo;
        
        return {
            title: book.title || 'Неизвестно',
            author: book.authors ? book.authors.join(', ') : 'Неизвестен',
            description: book.description || 'Описание отсутствует',
            year: book.publishedDate ? book.publishedDate.substring(0, 4) : 'Неизвестен',
            pages: book.pageCount || 'Неизвестно',
            rating: book.averageRating ? '⭐'.repeat(Math.round(book.averageRating)) + ` ${book.averageRating}/5` : 'Рейтинг отсутствует',
            cover: book.imageLinks ? book.imageLinks.thumbnail : 'https://via.placeholder.com/150x200/667eea/white?text=No+Cover',
            genre: book.categories ? book.categories[0] : 'Неизвестен'
        };
    }

    async analyzeBookWithAI(bookData, apiKey) {
        const prompt = `Проанализируй книгу "${bookData.title}" автора ${bookData.author}. 
        
        Опиши:
        1. Краткое содержание и основной сюжет
        2. Главных персонажей с характеристиками
        3. Основные темы и идеи произведения
        
        Ответ представь в формате JSON:
        {
            "summary": "краткое содержание здесь",
            "characters": ["персонаж 1 с описанием", "персонаж 2 с описанием", ...],
            "themes": ["тема 1", "тема 2", ...]
        }`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 1500,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Ошибка API');
        }

        const data = await response.json();
        const analysisText = data.choices[0].message.content;
        
        try {
            return JSON.parse(analysisText);
        } catch (e) {
            // Если AI не вернул JSON, создаем базовый анализ
            return {
                summary: analysisText,
                characters: ['Информация о персонажах недоступна'],
                themes: ['Информация о темах недоступна']
            };
        }
    }

    async askQuestion() {
        const question = this.questionInput.value.trim();
        const apiKey = this.apiKeyInput.value.trim();
        
        if (!question) {
            this.showError('Пожалуйста, введите вопрос');
            return;
        }
        
        if (!apiKey) {
            this.showError('Пожалуйста, введите API ключ');
            return;
        }
        
        if (!this.currentBook) {
            this.showError('Сначала найдите книгу');
            return;
        }

        this.askBtn.disabled = true;
        this.showLoading('AI обдумывает ответ...');

        try {
            const answer = await this.getAnswerFromAI(question, apiKey);
            this.displayQA(question, answer);
            this.questionInput.value = '';
        } catch (error) {
            this.showError('Ошибка: ' + error.message);
        } finally {
            this.hideLoading();
            this.askBtn.disabled = false;
        }
    }

    async getAnswerFromAI(question, apiKey) {
        const prompt = `Ответь на вопрос о книге "${this.currentBook.title}" автора ${this.currentBook.author}.
        
        Вопрос: ${question}
        
        Ответь подробно и информативно, основываясь на содержании книги.`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 1000,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Ошибка API');
        }

        const data = await response.json();
        return data.choices[0].message.content;
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
        
        this.summaryResult.classList.remove('hidden');
    }

    displayQA(question, answer) {
        const qaItem = document.createElement('div');
        qaItem.className = 'qa-item';
        qaItem.innerHTML = `
            <div class="question">❓ ${question}</div>
            <div class="answer">🤖 ${answer}</div>
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
});
