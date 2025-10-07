// JavaScript код
class BookSummaryApp {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.booksDatabase = this.createBooksDatabase();
    }

    initializeElements() {
        // Поиск и ввод
        this.bookTitleInput = document.getElementById('bookTitle');
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
        this.errorMessage = document.getElementById('errorMessage');
        
        this.selectedChapters = new Set();
    }

    bindEvents() {
        this.searchBtn.addEventListener('click', () => this.searchBook());
        this.bookTitleInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchBook();
        });
        
        this.selectAllBtn.addEventListener('click', () => this.selectAllChapters());
        this.deselectAllBtn.addEventListener('click', () => this.deselectAllChapters());
        this.generateSummaryBtn.addEventListener('click', () => this.generateSummary());
    }

    createBooksDatabase() {
        return {
            'преступление и наказание': {
                title: 'Преступление и наказание',
                author: 'Фёдор Михайлович Достоевский',
                year: 1866,
                rating: '⭐⭐⭐⭐⭐ 4.7/5',
                cover: 'https://via.placeholder.com/140x190/667eea/white?text=Преступление+и+наказание',
                chapters: [
                    'Часть 1 - Подготовка к преступлению',
                    'Часть 2 - После убийства',
                    'Часть 3 - Встреча с Порфирием',
                    'Часть 4 - Душевные терзания',
                    'Часть 5 - Соня Мармеладова',
                    'Часть 6 - Признание',
                    'Эпилог - Возрождение'
                ]
            },
            'война и мир': {
                title: 'Война и мир',
                author: 'Лев Николаевич Толстой',
                year: 1869,
                rating: '⭐⭐⭐⭐⭐ 4.8/5',
                cover: 'https://via.placeholder.com/140x190/764ba2/white?text=Война+и+мир',
                chapters: [
                    'Том 1 - Мирная жизнь',
                    'Том 2 - Война 1805 года',
                    'Том 3 - Бородинское сражение',
                    'Том 4 - Отступление французов',
                    'Эпилог - Судьбы героев'
                ]
            },
            '1984': {
                title: '1984',
                author: 'Джордж Оруэлл',
                year: 1949,
                rating: '⭐⭐⭐⭐⭐ 4.6/5',
                cover: 'https://via.placeholder.com/140x190/28a745/white?text=1984',
                chapters: [
                    'Часть 1 - Жизнь под наблюдением',
                    'Часть 2 - Любовь и сопротивление',
                    'Часть 3 - Пленение и перевоспитание'
                ]
            },
            'мастер и маргарита': {
                title: 'Мастер и Маргарита',
                author: 'Михаил Афанасьевич Булгаков',
                year: 1967,
                rating: '⭐⭐⭐⭐⭐ 4.8/5',
                cover: 'https://via.placeholder.com/140x190/dc3545/white?text=Мастер+и+Маргарита',
                chapters: [
                    'Часть 1 - Появление Воланда',
                    'Часть 2 - История Мастера',
                    'Часть 3 - Бал у Сатаны',
                    'Часть 4 - Развязка'
                ]
            },
            'анна каренина': {
                title: 'Анна Каренина',
                author: 'Лев Николаевич Толстой',
                year: 1877,
                rating: '⭐⭐⭐⭐⭐ 4.7/5',
                cover: 'https://via.placeholder.com/140x190/ff6b6b/white?text=Анна+Каренина',
                chapters: [
                    'Часть 1 - Встреча с Вронским',
                    'Часть 2 - Развитие отношений',
                    'Часть 3 - Разрыв с мужем',
                    'Часть 4 - Жизнь в осуждении',
                    'Часть 5 - Трагический финал'
                ]
            }
        };
    }

    async searchBook() {
        const title = this.bookTitleInput.value.trim();
        
        if (!title) {
            this.showError('Пожалуйста, введите название книги');
            return;
        }

        this.showLoading();
        this.hideError();
        this.searchBtn.disabled = true;

        try {
            // Имитация задержки поиска
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            const bookData = this.findBook(title);
            
            if (bookData) {
                this.displayBookInfo(bookData);
            } else {
                this.showError('Книга не найдена. Попробуйте: "Преступление и наказание", "Война и мир", "1984", "Мастер и Маргарита" или "Анна Каренина"');
            }
        } catch (error) {
            this.showError('Ошибка при поиске книги');
            console.error(error);
        } finally {
            this.hideLoading();
            this.searchBtn.disabled = false;
        }
    }

    findBook(title) {
        const lowerTitle = title.toLowerCase();
        
        // Поиск по ключевым словам
        for (const [key, book] of Object.entries(this.booksDatabase)) {
            if (lowerTitle.includes(key)) {
                return book;
            }
        }
        
        return null;
    }

    displayBookInfo(bookData) {
        this.bookCover.src = bookData.cover;
        this.bookCover.alt = bookData.title;
        this.bookName.textContent = bookData.title;
        this.bookAuthor.textContent = `Автор: ${bookData.author}`;
        this.bookYear.textContent = `Год публикации: ${bookData.year}`;
        this.bookRating.textContent = bookData.rating;
        
        this.generateChaptersList(bookData.chapters);
        this.bookInfo.classList.remove('hidden');
        this.summaryResult.classList.add('hidden');
        
        // Прокрутка к информации о книге
        this.bookInfo.scrollIntoView({ behavior: 'smooth' });
    }

    generateChaptersList(chapters) {
        this.chaptersList.innerHTML = chapters.map((chapter, index) => `
            <div class="chapter-item" onclick="app.toggleChapter(${index})">
                <input type="checkbox" id="chapter-${index}">
                <label for="chapter-${index}">${chapter}</label>
            </div>
        `).join('');
        
        this.selectedChapters.clear();
    }

    toggleChapter(index) {
        if (this.selectedChapters.has(index)) {
            this.selectedChapters.delete(index);
            document.getElementById(`chapter-${index}`).checked = false;
            document.querySelector(`#chapter-${index}`).closest('.chapter-item').classList.remove('selected');
        } else {
            this.selectedChapters.add(index);
            document.getElementById(`chapter-${index}`).checked = true;
            document.querySelector(`#chapter-${index}`).closest('.chapter-item').classList.add('selected');
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
            this.showError('Пожалуйста, выберите хотя бы одну главу для анализа');
            return;
        }

        this.showLoading();
        this.hideError();
        this.generateSummaryBtn.disabled = true;

        try {
            // Имитация работы AI
            await new Promise(resolve => setTimeout(resolve, 2500));
            
            const summaryData = this.generateSummaryContent();
            this.displaySummary(summaryData);
        } catch (error) {
            this.showError('Ошибка при генерации содержания');
            console.error(error);
        } finally {
            this.hideLoading();
            this.generateSummaryBtn.disabled = false;
        }
    }

    generateSummaryContent() {
        const bookTitle = this.bookName.textContent;
        const selectedCount = this.selectedChapters.size;
        const chaptersText = this.getChaptersText(selectedCount);

        // Различное содержание для разных книг
        const summaries = {
            'Преступление и наказание': {
                general: `В выбранных ${chaptersText} романа "Преступление и наказание" Ф.М. Достоевского раскрывается глубокий психологический портрет Родиона Раскольникова. Показана его внутренняя борьба после совершения преступления, муки совести и постепенное движение к духовному возрождению через страдание и признание.`,
                points: [
                    'Душевные терзания и внутренний конфликт Раскольникова',
                    'Теория о "право имеющих" и "тварях дрожащих"',
                    'Знакомство с Соней Мармеладовой и её влияние',
                    'Психологическая дуэль со следователем Порфирием Петровичем',
                    'Путь к раскаянию и духовному очищению'
                ],
                characters: [
                    'Родион Раскольников - бывший студент, создатель теории',
                    'Соня Мармеладова - символ жертвенности и веры',
                    'Порфирий Петрович - проницательный следователь',
                    'Разумихин - верный друг Раскольникова',
                    'Старуха-процентщица - жертва преступления'
                ],
                themes: [
                    'Нравственность и свобода выбора',
                    'Страдание как путь к искуплению',
                    'Индивидуализм против общественных норм',
                    'Роль религии в нравственном возрождении'
                ]
            },
            'Война и мир': {
                general: `В анализируемых ${chaptersText} эпопеи "Война и мир" Л.Н. Толстого представлена масштабная картина русской жизни начала XIX века. Переплетение судеб главных героев с историческими событиями Отечественной войны 1812 года создает грандиозное полотно о человеческой судьбе, любви и поиске смысла жизни.`,
                points: [
                    'Духовные искания Андрея Болконского и Пьера Безухова',
                    'Становление и взросление Наташи Ростовой',
                    'Бородинское сражение как кульминация войны',
                    'Философия истории по Толстому',
                    'Семейные ценности и личное счастье'
                ],
                characters: [
                    'Андрей Болконский - аристократ в поисках славы',
                    'Пьер Безухов - искатель истины и смысла жизни',
                    'Наташа Ростова - воплощение жизненной силы',
                    'Кутузов - народный полководец',
                    'Наполеон - антипод Кутузова'
                ],
                themes: [
                    'Война и мир как состояния человеческой жизни',
                    'Свобода воли и историческая необходимость',
                    'Народ и личность в истории',
                    'Любовь, семья и духовные ценности'
                ]
            },
            '1984': {
                general: `В выбранных ${chaptersText} антиутопии "1984" Джорджа Оруэлла показано тоталитарное общество, где каждый аспект жизни контролируется государством. Роман исследит тему борьбы личности за сохранение человечности в условиях абсолютного контроля и манипуляции сознанием.`,
                points: [
                    'Система тотального контроля "Большого Брата"',
                    'Любовь Уинстона и Джулии как акт сопротивления',
                    'Манипуляция историей и языком',
                    'Пытки и перевоспитание в Министерстве любви',
                    'Три партийных лозунга: "Война - это мир", "Свобода - это рабство", "Незнание - это сила"'
                ],
                characters: [
                    'Уинстон Смит - последний человек старого мира',
                    'Джулия - символ естественных человеческих чувств',
                    'О\'Брайен - воплощение системы',
                    'Большой Брат - символ тотальной власти'
                ],
                themes: [
                    'Тоталитаризм и контроль над сознанием',
                    'Индивидуальность против системы',
                    'Манипуляция правдой и историей',
                    'Разрушение языка и мысли'
                ]
            },
            'default': {
                general: `В анализируемых ${chaptersText} произведения "${bookTitle}" раскрываются основные сюжетные линии и характеры персонажей. Показаны ключевые конфликты, развитие главных героев и основные идеи, которые автор стремился донести до читателя.`,
                points: [
                    'Основной конфликт и его развитие',
                    'Характеры и мотивации главных героев',
                    'Ключевые повороты сюжета',
                    'Кульминация и развязка',
                    'Основные идеи и мораль произведения'
                ],
                characters: [
                    'Главный герой - центральный персонаж произведения',
                    'Антагонист - противник главного героя',
                    'Второстепенные персонажи - помогают раскрыть характер главного героя',
                    'Помощники и союзники главного героя'
                ],
                themes: [
                    'Основные темы, поднимаемые автором',
                    'Нравственные вопросы произведения',
                    'Социальные и философские аспекты',
                    'Актуальность идей для современного читателя'
                ]
            }
        };

        return summaries[bookTitle] || summaries['default'];
    }

    getChaptersText(count) {
        if (count === 1) return 'главе';
        if (count >= 2 && count <= 4) return `${count} главах`;
        return `${count} главах`;
    }

    displaySummary(summaryData) {
        this.generalSummary.innerHTML = `<p>${summaryData.general}</p>`;
        
        this.keyPoints.innerHTML = summaryData.points.map(point => 
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

    showLoading() {
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

// Создаем глобальную переменную для доступа из HTML
let app;

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    app = new BookSummaryApp();
    console.log('BookSummary App запущен!');
});
