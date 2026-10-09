/* VocabMind Pro Core Application Logic */
        const DEFAULT_VOCAB_DATA = [
            { id: '1', word: 'Perseverance', ipa: '/ˌpɜːsɪˈvɪərəns/', pos: 'noun', meaning: 'Sự kiên trì, nhẫn nại', example: 'Great achievements require perseverance.', set: 'IELTS Academic', srsStage: 'learning', interval: 1, easeFactor: 2.5, rep: 1, nextReview: Date.now() },
            { id: '2', word: 'Resilience', ipa: '/rɪˈzɪliəns/', pos: 'noun', meaning: 'Khả năng phục hồi nhanh', example: 'Psychological resilience helps in stressful times.', set: 'IELTS Academic', srsStage: 'review', interval: 3, easeFactor: 2.4, rep: 2, nextReview: Date.now() },
            { id: '3', word: 'Meticulous', ipa: '/məˈtɪkjələs/', pos: 'adj', meaning: 'Tỉ mỉ, cẩn thận từng chi tiết', example: 'She is meticulous about her work.', set: 'IELTS Academic', srsStage: 'mastered', interval: 7, easeFactor: 2.6, rep: 4, nextReview: Date.now() + 86400000 * 3 },
            { id: '4', word: 'Ambiguity', ipa: '/ˌæmbɪˈɡjuːəti/', pos: 'noun', meaning: 'Sự mơ hồ, nhập nhằng', example: 'Avoid ambiguity in formal legal documents.', set: 'TOEIC Essential', srsStage: 'new', interval: 0, easeFactor: 2.5, rep: 0, nextReview: Date.now() },
            { id: '5', word: 'Coherent', ipa: '/kəʊˈhɪərənt/', pos: 'adj', meaning: 'Mạch lạc, chặt chẽ', example: 'The essay was clear and coherent.', set: 'IELTS Academic', srsStage: 'learning', interval: 1, easeFactor: 2.5, rep: 1, nextReview: Date.now() },
            { id: '6', word: 'Pragmatic', ipa: '/præɡˈmætɪk/', pos: 'adj', meaning: 'Thực tế, thực dụng', example: 'We need a pragmatic solution to this problem.', set: 'TOEIC Essential', srsStage: 'review', interval: 2, easeFactor: 2.3, rep: 2, nextReview: Date.now() },
            { id: '7', word: 'Elaborate', ipa: '/ɪˈlæbəreɪt/', pos: 'verb', meaning: 'Giải thích chi tiết', example: 'Could you elaborate on that point?', set: 'Daily Conversation', srsStage: 'new', interval: 0, easeFactor: 2.5, rep: 0, nextReview: Date.now() },
            { id: '8', word: 'Spontaneous', ipa: '/spɒnˈteɪniəs/', pos: 'adj', meaning: 'Tự phát, bộc phát', example: 'The crowd burst into spontaneous applause.', set: 'Daily Conversation', srsStage: 'mastered', interval: 14, easeFactor: 2.7, rep: 5, nextReview: Date.now() + 86400000 * 5 }
        ];

        const DEFAULT_IPA_CORRECTIONS = {
            'Perseverance': ['/ˌpɜː.sɪˈvɪə.rəns/', '/ˌpɜːsɪˈvɪərəns/'],
            'Resilience': ['/rɪˈzɪl.jəns/', '/rɪˈzɪliəns/'],
            'Meticulous': ['/mɪˈtɪk.jə.ləs/', '/məˈtɪkjələs/'],
            'Ambiguity': ['/ˌæm.bɪˈɡjuː.ə.ti/', '/ˌæmbɪˈɡjuːəti/'],
            'Coherent': ['/kəʊˈhɪə.rənt/', '/kəʊˈhɪərənt/'],
            'Pragmatic': ['/præɡˈmæt.ɪk/', '/præɡˈmætɪk/'],
            'Elaborate': ['/ɪˈlæb.ər.ət/', '/ɪˈlæbəreɪt/'],
            'Spontaneous': ['/spɒnˈteɪ.ni.əs/', '/spɒnˈteɪniəs/']
        };

        const VOCAB_IMPORT_HEADERS = {
            word: new Set(['word', 'english', 'english word', 'english term', 'term', 'headword', 'vocabulary', 'tu', 'tu tieng anh', 'tu vung']),
            meaning: new Set(['meaning', 'meaning vietnamese', 'vietnamese', 'vietnamese meaning', 'vietnamese translation', 'translation', 'definition', 'definition vietnamese', 'nghia', 'nghia tieng viet', 'ban dich']),
            ipa: new Set(['ipa', 'ipa pronunciation', 'ipa anh anh', 'phonetic', 'phonetics', 'phonetic transcription', 'pronunciation', 'pronunciation ipa', 'transcription', 'phien am', 'phien am ipa']),
            pos: new Set(['pos', 'part of speech', 'word type', 'tu loai']),
            example: new Set(['example', 'sentence', 'vi du', 'cau vi du']),
            set: new Set(['set', 'deck', 'category', 'bo tu', 'bo tu vung']),
            topic: new Set(['topic', 'theme', 'subject', 'topic group', 'theme group', 'chu de', 'nhom chu de', 'linh vuc'])
        };

        const VOCAB_TOPIC_KEYWORDS = {
            'Học tập & giáo dục': ['education', 'study', 'student', 'school', 'university', 'teach', 'teacher', 'exam', 'lesson', 'lecture', 'curriculum', 'academic', 'knowledge', 'homework', 'education', 'hoc tap', 'giao duc', 'sinh vien', 'hoc sinh', 'truong hoc', 'bai hoc', 'giang day', 'kiem tra', 'thi cu', 'kien thuc'],
            'Công việc & kinh doanh': ['work', 'job', 'career', 'office', 'business', 'company', 'employee', 'employer', 'salary', 'profit', 'finance', 'economy', 'investment', 'customer', 'manager', 'meeting', 'project', 'trade', 'cong viec', 'nghe nghiep', 'kinh doanh', 'cong ty', 'nhan vien', 'luong', 'loi nhuan', 'tai chinh', 'kinh te', 'khach hang', 'quan ly', 'hop dong'],
            'Du lịch & giao thông': ['travel', 'trip', 'journey', 'tourism', 'tourist', 'airport', 'flight', 'hotel', 'train', 'bus', 'taxi', 'ticket', 'passport', 'luggage', 'traffic', 'road', 'station', 'du lich', 'chuyen di', 'san bay', 'chuyen bay', 'khach san', 'tau hoa', 'xe buyt', 've', 'ho chieu', 'hanh ly', 'giao thong', 'duong pho'],
            'Sức khỏe & cảm xúc': ['health', 'healthy', 'illness', 'disease', 'doctor', 'hospital', 'medicine', 'pain', 'stress', 'anxiety', 'emotion', 'feeling', 'mental', 'physical', 'exercise', 'sleep', 'benh', 'suc khoe', 'bac si', 'benh vien', 'thuoc', 'dau don', 'cang thang', 'lo lang', 'cam xuc', 'tam ly', 'the chat', 'tap the duc', 'giac ngu'],
            'Khoa học & công nghệ': ['science', 'scientist', 'technology', 'technical', 'computer', 'internet', 'software', 'hardware', 'digital', 'device', 'data', 'research', 'experiment', 'energy', 'physics', 'biology', 'chemistry', 'artificial intelligence', 'khoa hoc', 'cong nghe', 'may tinh', 'phan mem', 'thiet bi', 'du lieu', 'nghien cuu', 'thi nghiem', 'nang luong', 'vat ly', 'sinh hoc', 'hoa hoc'],
            'Thiên nhiên & môi trường': ['nature', 'environment', 'environmental', 'climate', 'pollution', 'weather', 'animal', 'plant', 'forest', 'ocean', 'river', 'ecosystem', 'species', 'wildlife', 'tree', 'earth', 'natural', 'thien nhien', 'moi truong', 'khi hau', 'o nhiem', 'thoi tiet', 'dong vat', 'thuc vat', 'rung', 'bien', 'song', 'he sinh thai', 'loai', 'hoang da', 'cay', 'trai dat'],
            'Ăn uống & mua sắm': ['food', 'eat', 'drink', 'meal', 'fruit', 'vegetable', 'meat', 'restaurant', 'kitchen', 'cook', 'recipe', 'taste', 'breakfast', 'lunch', 'dinner', 'shop', 'shopping', 'purchase', 'price', 'menu', 'thuc an', 'do an', 'an uong', 'bua an', 'trai cay', 'rau cu', 'thit', 'nha hang', 'nha bep', 'nau an', 'mon an', 'huong vi', 'bua sang', 'bua trua', 'bua toi', 'mua sam', 'gia ca', 'thuc don'],
            'Gia đình & đời sống': ['family', 'home', 'house', 'room', 'household', 'daily', 'routine', 'clothes', 'cleaning', 'sleep', 'wake', 'morning', 'parent', 'child', 'mother', 'father', 'sister', 'brother', 'relative', 'gia dinh', 'nha cua', 'phong', 'hang ngay', 'sinh hoat', 'quan ao', 'don dep', 'buoi sang', 'cha me', 'con cai', 'me', 'bo', 'chi em', 'anh em', 'nguoi than'],
            'Xã hội & giao tiếp': ['communicate', 'communication', 'conversation', 'speak', 'talk', 'listen', 'discuss', 'persuade', 'relationship', 'friend', 'community', 'culture', 'society', 'social', 'polite', 'greet', 'giao tiep', 'tro chuyen', 'noi chuyen', 'lang nghe', 'thao luan', 'thuyet phuc', 'moi quan he', 'ban be', 'cong dong', 'van hoa', 'xa hoi', 'lich su', 'chao hoi'],
            'Kỹ năng & phẩm chất': ['perseverance', 'resilience', 'meticulous', 'ambiguity', 'coherent', 'pragmatic', 'spontaneous', 'patience', 'confidence', 'creative', 'curious', 'honest', 'brave', 'careful', 'ability', 'skill', 'quality', 'behavior', 'attitude', 'character', 'thinking', 'decision', 'problem solving', 'kiên trì', 'nhan nai', 'phuc hoi', 'ti mi', 'mo ho', 'mach lac', 'thuc te', 'tu phat', 'kien nhan', 'tu tin', 'sang tao', 'to mo', 'trung thuc', 'can dam', 'can than', 'ky nang', 'pham chat', 'hanh vi', 'thai do', 'tinh cach', 'tu duy', 'quyet dinh', 'giai quyet van de']
        };
        const VOCAB_TOPIC_LABELS = [...Object.keys(VOCAB_TOPIC_KEYWORDS), 'Khác / cần xem lại'];
        const VOCAB_SET_TO_REMOVE = 'Imported: 1000-tu-vung-tieng-anh-theo-chu-de-thong-dung';
        const VOCAB_SET_REMOVAL_MIGRATION_KEY = 'vm_migration_removed_1000_vocab_set_v1';

        const normalizeTopicText = value => ` ${String(value || '')
            .toLocaleLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, ' ')
            .trim()} `;

        const classifyVocabularyTopic = vocab => {
            const text = normalizeTopicText(`${vocab.word || ''} ${vocab.meaning || ''} ${vocab.example || ''}`);
            let bestTopic = 'Khác / cần xem lại';
            let bestScore = 0;

            Object.entries(VOCAB_TOPIC_KEYWORDS).forEach(([topic, keywords]) => {
                const score = keywords.reduce((total, keyword) => total + Number(text.includes(normalizeTopicText(keyword))), 0);
                if (score > bestScore) {
                    bestScore = score;
                    bestTopic = topic;
                }
            });
            return bestTopic;
        };

        const normalizeImportHeader = header => String(header)
            .toLocaleLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[()[\]{}:-]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        const isIpaTranscription = value => /^\/[^/]+\/$/.test(String(value || '').trim());
        const normalizeIpaTranscription = value => {
            const transcription = String(value || '').trim();
            if (!isIpaTranscription(transcription)) return transcription;
            const segments = transcription.slice(1, -1).trim().split(/\s+/);
            const compacted = segments.reduce((result, segment, index) => {
                if (index === 0) return segment;
                const previous = segments[index - 1];
                const joinsToNeighbor = previous === '.' || segment === '.' || previous.length === 1 || segment.length === 1;
                return `${result}${joinsToNeighbor ? '' : ' '}${segment}`;
            }, '');
            return `/${compacted}/`;
        };

        const normalizeVocabularyFields = vocab => {
            const normalized = { ...vocab };
            const meaning = String(normalized.meaning || '').trim();
            const ipa = normalizeIpaTranscription(normalized.ipa);
            if (isIpaTranscription(meaning) && ipa && !isIpaTranscription(ipa)) {
                normalized.meaning = ipa;
                normalized.ipa = normalizeIpaTranscription(meaning);
            } else {
                normalized.meaning = meaning;
                normalized.ipa = ipa;
            }
            if (normalizeTopicText(normalized.word).trim() === 'tra c light') {
                normalized.word = 'Traffic light';
            }
            normalized.topic = VOCAB_TOPIC_LABELS.includes(String(normalized.topic || '').trim())
                ? String(normalized.topic).trim()
                : classifyVocabularyTopic(normalized);
            return normalized;
        };
        const IMPORTED_VOCAB_REPAIRS = [
            {
                sourceWord: 'phán',
                sourceMeaning: 'trade agreement',
                word: 'Negotiate',
                pos: 'verb',
                meaning: 'Đàm phán',
                example: 'The two countries are trying to negotiate a trade agreement. (Hai quốc gia đang cố gắng đàm phán một thỏa thuận thương mại.)'
            },
            {
                sourceWord: 'nghề',
                sourceMeaning: 'skills relevant to the job market',
                word: 'Vocational',
                pos: 'adjective',
                meaning: 'Dạy nghề',
                example: 'Vocational education equips students with skills relevant to the job market. (Giáo dục nghề nghiệp trang bị cho sinh viên những kỹ năng phù hợp với thị trường lao động.)'
            },
            {
                sourceWord: 'hữu cơ',
                sourceMeaning: 'sử dụng bao bì có',
                word: 'Compostable',
                pos: 'adjective',
                meaning: 'Có thể phân hủy thành phân hữu cơ',
                example: 'Many companies are now using compostable packaging to reduce waste and protect the environment. (Nhiều công ty hiện đang sử dụng bao bì có thể phân hủy để giảm thiểu rác thải và bảo vệ môi trường.)'
            },
            {
                sourceWord: 'nghệ',
                sourceMeaning: 'đồ dùng công nghệ mới giúp cho những công việc hàng',
                word: 'Gadget',
                pos: 'noun',
                meaning: 'Đồ dùng công nghệ',
                example: 'He loves exploring new gadgets that make everyday tasks easier and more enjoyable. (Anh ấy thích khám phá các đồ dùng công nghệ mới giúp cho những công việc hàng ngày trở nên dễ dàng và thú vị hơn.)'
            },
            {
                sourceWord: 'kinh',
                sourceMeaning: 'kinh doanh thúc đẩy sự đổi mới và phát',
                word: 'Entrepreneurship',
                pos: 'noun',
                meaning: 'Tinh thần kinh doanh',
                example: 'Entrepreneurship fosters innovation and drives economic development. (Tinh thần kinh doanh thúc đẩy sự đổi mới và phát triển kinh tế.)'
            },
            {
                sourceWord: 'tài chính',
                sourceMeaning: 'bị buộc tội liên quan đến tiền bạc',
                word: 'White-collar crime',
                pos: 'noun',
                meaning: 'Tội phạm liên quan đến tiền bạc và tài chính',
                example: 'The company executive was charged with multiple white-collar crimes. (Giám đốc điều hành công ty đã bị buộc tội liên quan đến tiền bạc và tài chính.)'
            }
        ];
        const repairImportedVocabulary = vocab => {
            const isIeltsImportedSet = String(vocab.set || '').toLocaleLowerCase().includes('ielts 7.0')
                && String(vocab.set || '').toLocaleLowerCase().includes('imported:');
            if (!isIeltsImportedSet) return vocab;

            const sourceWord = normalizeTopicText(vocab.word).trim();
            const sourceMeaning = normalizeTopicText(vocab.meaning);
            const repair = IMPORTED_VOCAB_REPAIRS.find(item =>
                sourceWord === normalizeTopicText(item.sourceWord).trim()
                && sourceMeaning.includes(normalizeTopicText(item.sourceMeaning).trim())
            );
            if (!repair) return vocab;

            const corrected = { ...vocab, word: repair.word, pos: repair.pos, meaning: repair.meaning, example: repair.example };
            corrected.topic = classifyVocabularyTopic(corrected);
            return corrected;
        };
        const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, character => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[character]);

        const AVATARS = ['🎓', '🦁', '🚀', '🦊', '🦉', '⚡', '🤖', '👑', '🐼', '🐉', '🎨', '🌟'];

        class VocabMindApp {
            constructor() {
                /* Initialize State */
                const savedUser = JSON.parse(localStorage.getItem('vm_user') || 'null') || {};
                this.user = {
                    loggedIn: false,
                    name: typeof savedUser.name === 'string' ? savedUser.name.slice(0, 80) : '',
                    email: '',
                    avatar: AVATARS.includes(savedUser.avatar) ? savedUser.avatar : '🎓',
                    xp: Number.isSafeInteger(savedUser.xp) && savedUser.xp >= 0 ? savedUser.xp : 1240,
                    streak: Number.isSafeInteger(savedUser.streak) && savedUser.streak >= 0 ? savedUser.streak : 5,
                    level: Number.isSafeInteger(savedUser.level) && savedUser.level > 0 ? savedUser.level : 3
                };
                localStorage.setItem('vm_user', JSON.stringify({
                    name: this.user.name,
                    avatar: this.user.avatar,
                    xp: this.user.xp,
                    streak: this.user.streak,
                    level: this.user.level
                }));

                let storedVocabs = JSON.parse(localStorage.getItem('vm_vocabs')) || DEFAULT_VOCAB_DATA;
                let savedSets = JSON.parse(localStorage.getItem('vm_vocab_sets')) || [];
                if (localStorage.getItem(VOCAB_SET_REMOVAL_MIGRATION_KEY) !== 'true') {
                    const isRemovedSet = set => String(set || '').trim().toLocaleLowerCase()
                        === VOCAB_SET_TO_REMOVE.toLocaleLowerCase();
                    storedVocabs = storedVocabs.filter(vocab => !isRemovedSet(vocab.set));
                    savedSets = savedSets.filter(set => !isRemovedSet(set));
                    localStorage.setItem('vm_vocabs', JSON.stringify(storedVocabs));
                    localStorage.setItem('vm_vocab_sets', JSON.stringify(savedSets));
                    localStorage.setItem(VOCAB_SET_REMOVAL_MIGRATION_KEY, 'true');
                }
                let migratedVocabulary = false;
                this.vocabs = storedVocabs.map(vocab => {
                    const repaired = repairImportedVocabulary(vocab);
                    const normalized = normalizeVocabularyFields(repaired);
                    if (normalized.word !== vocab.word || normalized.meaning !== vocab.meaning || normalized.ipa !== vocab.ipa || normalized.topic !== vocab.topic || normalized.example !== vocab.example || normalized.pos !== vocab.pos) {
                        migratedVocabulary = true;
                    }
                    const correction = DEFAULT_IPA_CORRECTIONS[vocab.word];
                    if (correction && normalized.ipa === correction[0]) {
                        normalized.ipa = correction[1];
                        migratedVocabulary = true;
                    }
                    return normalized;
                });
                if (migratedVocabulary) localStorage.setItem('vm_vocabs', JSON.stringify(this.vocabs));
                this.vocabSets = Array.from(new Set([
                    ...this.vocabs.map(v => v.set || 'Mặc định'),
                    ...savedSets
                ].map(set => set.trim()).filter(Boolean)));
                this.selectedIds = new Set();
                this.editingVocabId = null;
                this.currentTab = 'dashboard';
                this.quizMode = 'mcq';
                this.quizFeedbackTimer = null;
                this.flashcardIndex = 0;
                this.isFlipped = false;
                
                // Audio synth settings
                this.ttsVoice = null;
                this.ttsRate = 1.0;

                // Game state
                this.gameTimer = null;
                this.gameTransitionTimer = null;
                this.gameTimeLeft = 30;
                this.gameScore = 0;
                this.gameCombo = 1;
                this.gameRound = 0;
                this.gameSelectedCard = null;
                this.gameMode = 'match';
                this.gameIsRunning = false;
                this.gamePool = [];
                this.gameCurrentQuestion = null;

                // Charts instances
                this.distChart = null;
                this.retentionChart = null;
                this.googleClientId = '';
                this.facebookAppId = '';
                this.googleInitialized = false;
                this.sessionCheckPromise = null;
                this.stateSyncTimer = null;
                this.stateSyncPromise = Promise.resolve();
            }

            playSFX(type) {
                try {
                    const ctx = new (window.AudioContext || window.webkitAudioContext)();
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.connect(gain);
                    gain.connect(ctx.destination);

                    if (type === 'correct') {
                        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
                        osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.15); // E5
                        gain.gain.setValueAtTime(0.3, ctx.currentTime);
                        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
                        osc.start();
                        osc.stop(ctx.currentTime + 0.25);
                    } else if (type === 'wrong') {
                        osc.type = 'sawtooth';
                        osc.frequency.setValueAtTime(180, ctx.currentTime);
                        osc.frequency.linearRampToValueAtTime(110, ctx.currentTime + 0.2);
                        gain.gain.setValueAtTime(0.3, ctx.currentTime);
                        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
                        osc.start();
                        osc.stop(ctx.currentTime + 0.2);
                    } else if (type === 'combo') {
                        osc.type = 'triangle';
                        osc.frequency.setValueAtTime(440, ctx.currentTime);
                        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
                        gain.gain.setValueAtTime(0.4, ctx.currentTime);
                        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
                        osc.start();
                        osc.stop(ctx.currentTime + 0.3);
                    }
                } catch (e) {
                    console.log('Audio Context Error:', e);
                }
            }

            setupActionDelegation() {
                const actions = {
                    switchTab: element => this.switchTab(element.dataset.actionValue),
                    toggleDarkMode: () => this.toggleDarkMode(),
                    openCreateSetModal: () => this.openCreateSetModal(),
                    triggerImport: () => document.getElementById('import-file-input').click(),
                    handleImportFile: (_element, event) => this.handleImportFile(event),
                    openAddWordModal: () => this.openAddWordModal(),
                    renderVocabTable: () => this.renderVocabTable(),
                    selectVocabularySet: () => this.selectVocabularySet(),
                    deleteVocabularySet: () => this.deleteVocabularySet(),
                    editSelectedWord: () => this.editSelectedWord(),
                    bulkDelete: () => this.bulkDelete(),
                    bulkChangeSet: () => this.bulkChangeSet(),
                    clearSelection: () => this.clearSelection(),
                    toggleSelectAll: element => this.toggleSelectAll(element.checked),
                    initFlashcards: () => this.initFlashcards(),
                    flipCard: () => this.flipCard(),
                    speakWord: () => this.speakWord(),
                    stopPropagation: () => {},
                    rateSRS: element => this.rateSRS(element.dataset.actionValue),
                    switchQuizMode: element => this.switchQuizMode(element.dataset.actionValue),
                    startGame: () => this.startGame(),
                    openCookieSettings: () => this.openCookieSettings(),
                    saveCookieConsent: element => this.saveCookieConsent(element.dataset.actionValue),
                    switchAuthTab: element => this.switchAuthTab(element.dataset.actionValue),
                    closeAuthModal: () => this.closeAuthModal(),
                    handleFacebookLogin: () => this.handleFacebookLogin(),
                    handleAuthSubmit: (_element, event) => this.handleAuthSubmit(event),
                    closeSettingsModal: () => this.closeSettingsModal(),
                    updateTTSSettings: () => this.updateTTSSettings(),
                    logout: () => this.logout(),
                    saveSettings: () => this.saveSettings(),
                    saveNewWord: (_element, event) => this.saveNewWord(event),
                    closeAddModal: () => this.closeAddModal(),
                    closeCreateSetModal: () => this.closeCreateSetModal(),
                    createVocabularySet: (_element, event) => this.createVocabularySet(event),
                    openSettingsModal: () => this.openSettingsModal(),
                    openAuthModal: () => this.openAuthModal(),
                    selectAvatar: element => this.selectAvatar(element.dataset.actionValue)
                };

                for (const eventType of ['click', 'change', 'input', 'submit']) {
                    document.addEventListener(eventType, event => {
                        const element = event.target.closest(`[data-action-event="${eventType}"]`);
                        if (!element) return;
                        if (element.dataset.stopPropagation === 'true') event.stopPropagation();
                        if (eventType === 'submit') event.preventDefault();
                        const action = actions[element.dataset.action];
                        if (!action) {
                            console.error(`Unrecognized UI action: ${element.dataset.action}`);
                            return;
                        }
                        action(element, event);
                    }, { capture: true });
                }
            }

            init() {
                this.setupActionDelegation();
                this.setupTheme();
                this.initCookieConsent();
                this.updateHeaderUser();
                this.renderAuthButton();
                this.sessionCheckPromise = this.restoreSession();
                this.initializeSocialAuth();
                this.initTTSVoices();
                this.setupVocabularyTableActions();
                this.setupQuizActions();
                this.setupGameActions();
                this.switchTab('dashboard');
                this.setupMarqueeDragSelection();

                // Speech Synthesis Voice Loading Event
                if ('speechSynthesis' in window) {
                    window.speechSynthesis.onvoiceschanged = () => this.initTTSVoices();
                }
            }

            async restoreSession() {
                try {
                    const response = await fetch('/api/me');
                    const data = await response.json();
                    if (!response.ok) throw new Error(data.message || 'Không thể kiểm tra phiên đăng nhập.');
                    if (data.loggedIn) await this.setAuthenticatedUser(data.user);
                } catch (error) {
                    console.error('Không thể khôi phục phiên đăng nhập:', error);
                }
                this.updateHeaderUser();
                this.renderAuthButton();
            }

            async initializeSocialAuth() {
                try {
                    const response = await fetch('/api/config');
                    const config = await response.json();
                    if (!response.ok) throw new Error('Không thể tải cấu hình đăng nhập.');
                    this.googleClientId = config.googleClientId || '';
                    this.facebookAppId = config.facebookAppId || '';
                } catch (error) {
                    console.error('Không thể tải cấu hình đăng nhập:', error);
                }

                const facebookButton = document.getElementById('facebook-signin-button');
                if (this.facebookAppId) {
                    facebookButton.disabled = false;
                    this.loadFacebookSdk();
                } else {
                    facebookButton.disabled = true;
                    facebookButton.title = 'Chưa cấu hình FACEBOOK_APP_ID trên Render.';
                }

                this.renderGoogleButton();
            }

            renderGoogleButton() {
                const container = document.getElementById('google-signin-button');
                if (!this.googleClientId) {
                    container.innerHTML = '<span class="self-center text-xs text-slate-400">Đăng nhập Google chưa được cấu hình.</span>';
                    return;
                }
                if (!window.google?.accounts?.id) {
                    const script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
                    if (script) script.addEventListener('load', () => this.renderGoogleButton(), { once: true });
                    return;
                }

                if (!this.googleInitialized) {
                    window.google.accounts.id.initialize({
                        client_id: this.googleClientId,
                        callback: response => this.handleGoogleCredentialResponse(response)
                    });
                    this.googleInitialized = true;
                }

                container.replaceChildren();
                window.google.accounts.id.renderButton(container, {
                    type: 'standard',
                    theme: document.documentElement.classList.contains('dark') ? 'filled_black' : 'outline',
                    size: 'medium',
                    text: this.authTab === 'register' ? 'signup_with' : 'continue_with',
                    shape: 'pill',
                    logo_alignment: 'left',
                    width: Math.min(280, container.clientWidth || 280)
                });
            }

            loadFacebookSdk() {
                if (document.getElementById('facebook-jssdk')) return;
                window.fbAsyncInit = () => {
                    window.FB.init({
                        appId: this.facebookAppId,
                        cookie: true,
                        xfbml: false,
                        version: 'v18.0'
                    });
                    window.FB.AppEvents.logPageView();
                    this.sessionCheckPromise.then(() => {
                        if (!this.user.loggedIn && sessionStorage.getItem('skipFacebookAutoLogin') !== 'true') {
                            this.checkFacebookLoginState();
                        }
                    });
                };

                const script = document.createElement('script');
                script.id = 'facebook-jssdk';
                script.async = true;
                script.src = 'https://connect.facebook.net/vi_VN/sdk.js';
                document.head.appendChild(script);
            }

            checkFacebookLoginState() {
                if (!window.FB) return;
                window.FB.getLoginStatus(response => {
                    if (response.status === 'connected' && response.authResponse) {
                        this.authenticateSocialAccount('/api/auth/facebook', {
                            accessToken: response.authResponse.accessToken
                        });
                    }
                });
            }

            handleFacebookLogin() {
                if (!this.facebookAppId) {
                    this.showAuthMessage('Đăng nhập Facebook chưa được cấu hình.', false);
                    return;
                }
                if (!window.FB) {
                    this.showAuthMessage('Facebook đang tải. Vui lòng thử lại sau giây lát.', false);
                    return;
                }

                sessionStorage.removeItem('skipFacebookAutoLogin');
                window.FB.login(response => {
                    if (response.authResponse) this.checkFacebookLoginState();
                    else this.showAuthMessage('Bạn đã hủy đăng nhập Facebook.', false);
                }, { scope: 'public_profile,email' });
            }

            async handleGoogleCredentialResponse(response) {
                await this.authenticateSocialAccount('/api/auth/google', { credential: response.credential });
            }

            async authenticateSocialAccount(endpoint, credentials) {
                try {
                    const response = await fetch(endpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(credentials)
                    });
                    const data = await response.json();
                    if (!response.ok || !data.success) {
                        throw new Error(data.message || 'Không thể đăng nhập bằng tài khoản mạng xã hội.');
                    }
                    await this.setAuthenticatedUser(data.user);
                    this.closeAuthModal();
                    this.showAuthMessage('Đăng nhập thành công.', true);
                } catch (error) {
                    this.showAuthMessage(error.message || 'Đăng nhập thất bại. Vui lòng thử lại.', false);
                }
            }

            async setAuthenticatedUser(user) {
                this.user.loggedIn = true;
                this.user.email = user.email || '';
                this.user.name = user.username || user.name || this.user.email.split('@')[0] || 'Học viên';
                sessionStorage.removeItem('skipFacebookAutoLogin');
                try {
                    await this.loadRemoteState();
                } catch (error) {
                    this.user.loggedIn = false;
                    this.user.email = '';
                    throw error;
                }
                this.updateHeaderUser();
                this.renderAuthButton();
                this.switchTab(this.currentTab);
            }

            async loadRemoteState() {
                const response = await fetch('/api/state');
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || 'Không thể tải dữ liệu học đã lưu.');
                if (!data.state) {
                    await this.syncRemoteState();
                    return;
                }

                this.vocabs = data.state.vocabs;
                this.vocabSets = data.state.vocabSets;
                this.user.name = data.state.profile.name;
                this.user.avatar = AVATARS.includes(data.state.profile.avatar) ? data.state.profile.avatar : '🎓';
                this.user.xp = data.state.profile.xp;
                this.user.streak = data.state.profile.streak;
                this.user.level = data.state.profile.level;
                this.saveLocalState();
            }

            showAuthMessage(message, success) {
                const element = document.getElementById('auth-message');
                element.textContent = message;
                element.className = `rounded-xl px-3 py-2 text-center text-xs font-semibold ${success ? 'bg-duo-green/10 text-duo-green' : 'bg-duo-red/10 text-duo-red'}`;
                element.classList.remove('hidden');
            }

            setupTheme() {
                const savedTheme = localStorage.getItem('vm_theme') || 'light';
                document.documentElement.className = savedTheme;
            }

            initCookieConsent() {
                if (!localStorage.getItem('vm_cookie_consent_v1')) {
                    document.getElementById('cookie-consent-banner').classList.remove('hidden');
                }
            }

            openCookieSettings() {
                document.getElementById('cookie-consent-banner').classList.remove('hidden');
            }

            saveCookieConsent(choice) {
                if (!['all', 'necessary'].includes(choice)) return;
                localStorage.setItem('vm_cookie_consent_v1', JSON.stringify({
                    necessary: true,
                    optional: choice === 'all',
                    savedAt: new Date().toISOString()
                }));
                document.getElementById('cookie-consent-banner').classList.add('hidden');
            }

            toggleDarkMode() {
                const isDark = document.documentElement.classList.contains('dark');
                const newTheme = isDark ? 'light' : 'dark';
                document.documentElement.className = newTheme;
                localStorage.setItem('vm_theme', newTheme);
            }

            saveState() {
                this.saveLocalState();
                if (this.user.loggedIn) {
                    clearTimeout(this.stateSyncTimer);
                    this.stateSyncTimer = setTimeout(() => {
                        this.syncRemoteState().catch(error => {
                            console.error('Không thể đồng bộ dữ liệu học lên tài khoản:', error);
                        });
                    }, 500);
                }
            }

            saveLocalState() {
                localStorage.setItem('vm_vocabs', JSON.stringify(this.vocabs));
                localStorage.setItem('vm_vocab_sets', JSON.stringify(this.vocabSets));
                localStorage.setItem('vm_user', JSON.stringify({
                    name: this.user.name,
                    avatar: this.user.avatar,
                    xp: this.user.xp,
                    streak: this.user.streak,
                    level: this.user.level
                }));
            }

            async syncRemoteState() {
                if (!this.user.loggedIn) return;
                const sync = async () => {
                    if (!this.user.loggedIn) return;
                    const response = await fetch('/api/state', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                        vocabs: this.vocabs,
                        vocabSets: this.vocabSets,
                        profile: {
                            name: this.user.name,
                            avatar: this.user.avatar,
                            xp: this.user.xp,
                            streak: this.user.streak,
                            level: this.user.level
                        }
                        })
                    });
                    const data = await response.json();
                    if (!response.ok || !data.success) {
                        throw new Error(data.message || 'Không thể đồng bộ dữ liệu học.');
                    }
                };
                const pendingSync = this.stateSyncPromise.catch(() => {}).then(sync);
                this.stateSyncPromise = pendingSync;
                return pendingSync;
            }

            addXP(amount) {
                this.user.xp += amount;
                this.user.level = Math.floor(this.user.xp / 400) + 1;
                this.saveState();
                this.updateHeaderUser();
            }

            updateHeaderUser() {
                document.getElementById('header-streak-val').textContent = this.user.streak;
                document.getElementById('header-xp-val').textContent = this.user.xp.toLocaleString();
                document.getElementById('header-level-val').textContent = this.user.level;
                document.getElementById('dash-user-name').textContent = this.user.name || 'Học viên';
            }

            renderAuthButton() {
                const container = document.getElementById('auth-button-container');
                if (this.user.loggedIn) {
                    container.innerHTML = `
                        <button data-action-event="click" data-action="openSettingsModal" class="flex items-center gap-2 px-3 py-1 rounded-2xl bg-notion-card dark:bg-notion-darkCard border border-notion-border dark:border-notion-darkBorder hover:border-duo-blue transition-all">
                            <span class="text-lg">${escapeHTML(this.user.avatar)}</span>
                            <span class="hidden sm:inline font-bold text-xs">${escapeHTML(this.user.name)}</span>
                        </button>
                    `;
                } else {
                    container.innerHTML = `
                        <button data-action-event="click" data-action="openAuthModal" class="px-4 py-1.5 rounded-xl bg-duo-blue hover:bg-duo-blueDark text-white font-bold text-xs shadow-md shadow-duo-blue/20 transition-all">
                            Đăng nhập
                        </button>
                    `;
                }
            }

            switchTab(tabId) {
                this.currentTab = tabId;
                document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
                document.getElementById(`tab-${tabId}`).classList.remove('hidden');

                document.querySelectorAll('.nav-btn').forEach(btn => {
                    btn.classList.remove('bg-duo-blue/10', 'text-duo-blue', 'font-bold');
                });
                const activeNav = document.getElementById(`nav-${tabId}`);
                if (activeNav) activeNav.classList.add('bg-duo-blue/10', 'text-duo-blue', 'font-bold');
                document.querySelectorAll('.mobile-nav-btn').forEach((btn, index) => {
                    btn.classList.toggle('active', ['dashboard', 'vocab', 'flashcard', 'quiz', 'game', 'leaderboard'][index] === tabId);
                });

                if (tabId === 'dashboard') this.renderDashboard();
                if (tabId === 'vocab') this.renderVocabTable();
                if (tabId === 'flashcard') this.initFlashcards();
                if (tabId === 'quiz') this.renderQuizQuestion();
                if (tabId === 'leaderboard') this.renderLeaderboard();
            }

            renderDashboard() {
                const total = this.vocabs.length;
                const mastered = this.vocabs.filter(v => v.srsStage === 'mastered').length;
                const learning = this.vocabs.filter(v => v.srsStage === 'learning').length;
                const review = this.vocabs.filter(v => v.srsStage === 'review').length;
                const newWords = this.vocabs.filter(v => v.srsStage === 'new').length;

                document.getElementById('dash-stat-total').textContent = total;
                document.getElementById('dash-stat-mastered').textContent = mastered;
                document.getElementById('dash-due-count').textContent = `${review + learning} từ vựng`;

                document.getElementById('srs-count-new').textContent = newWords;
                document.getElementById('srs-count-learning').textContent = learning;
                document.getElementById('srs-count-review').textContent = review;
                document.getElementById('srs-count-mastered').textContent = mastered;

                // Render Chart 1: Donut Stage Distribution
                const ctxDist = document.getElementById('srsDistributionChart').getContext('2d');
                if (this.distChart) this.distChart.destroy();
                this.distChart = new Chart(ctxDist, {
                    type: 'doughnut',
                    data: {
                        labels: ['Mới', 'Đang học', 'Ôn tập', 'Thành thạo'],
                        datasets: [{
                            data: [newWords, learning, review, mastered],
                            backgroundColor: ['#94a3b8', '#FF9600', '#1CB0F6', '#58CC02'],
                            borderWidth: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        cutout: '75%'
                    }
                });

                // Render Chart 2: seven-day spaced-repetition forecast
                const ctxRet = document.getElementById('srsRetentionChart').getContext('2d');
                if (this.retentionChart) this.retentionChart.destroy();

                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const forecastDays = Array.from({ length: 7 }, (_, index) => {
                    const start = new Date(today);
                    start.setDate(today.getDate() + index);
                    const end = new Date(start);
                    end.setDate(start.getDate() + 1);
                    return { start, end };
                });
                const forecastLabels = forecastDays.map(({ start }, index) => index === 0
                    ? 'Hôm nay'
                    : start.toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'numeric' }));
                const reviewData = forecastDays.map(({ start, end }, index) => this.vocabs.filter(vocab => {
                    if (vocab.srsStage === 'new') return false;
                    const dueAt = Number(vocab.nextReview);
                    if (!Number.isFinite(dueAt)) return false;
                    return index === 0 ? dueAt < end.getTime() : dueAt >= start.getTime() && dueAt < end.getTime();
                }).length);

                this.retentionChart = new Chart(ctxRet, {
                    type: 'line',
                    data: {
                        labels: forecastLabels,
                        datasets: [{
                            label: 'Từ đến hạn ôn',
                            data: reviewData,
                            borderColor: '#1CB0F6',
                            backgroundColor: 'rgba(28, 176, 246, 0.14)',
                            fill: true,
                            tension: 0.35,
                            pointRadius: 4,
                            pointHoverRadius: 6
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            x: { grid: { display: false } },
                            y: {
                                beginAtZero: true,
                                ticks: { precision: 0 },
                                grid: { color: 'rgba(150, 150, 150, 0.1)' }
                            }
                        }
                    }
                });
            }

            renderVocabTable() {
                const search = document.getElementById('vocab-search-input').value.toLowerCase();
                const setFilter = document.getElementById('vocab-set-filter').value;
                const topicFilter = document.getElementById('vocab-topic-filter').value;
                const srsFilter = document.getElementById('vocab-srs-filter').value;

                // Render Set Filter Options
                const sets = this.getVocabularySets();
                const setSelect = document.getElementById('vocab-set-filter');
                const options = [new Option('Tất cả Bộ từ vựng', 'ALL')];
                sets.forEach(set => options.push(new Option(set, set)));
                setSelect.replaceChildren(...options);
                setSelect.value = setFilter === 'ALL' || sets.includes(setFilter) ? setFilter : 'ALL';
                const setVocabularyCount = setSelect.value === 'ALL'
                    ? 0
                    : this.vocabs.filter(vocab => vocab.set === setSelect.value).length;
                const selectSetButton = document.getElementById('select-vocab-set-button');
                selectSetButton.disabled = setSelect.value === 'ALL' || setVocabularyCount === 0;
                selectSetButton.textContent = `Chọn cả bộ (${setVocabularyCount})`;
                document.getElementById('delete-vocab-set-button').disabled = setSelect.value === 'ALL';

                const topicSelect = document.getElementById('vocab-topic-filter');
                const topicOptions = [new Option('Tất cả Chủ đề', 'ALL')];
                VOCAB_TOPIC_LABELS.forEach(topic => {
                    const count = this.vocabs.filter(vocab => vocab.topic === topic).length;
                    if (count > 0) topicOptions.push(new Option(`${topic} (${count})`, topic));
                });
                topicSelect.replaceChildren(...topicOptions);
                topicSelect.value = topicOptions.some(option => option.value === topicFilter) ? topicFilter : 'ALL';

                const setOptions = document.getElementById('vocab-set-options');
                setOptions.replaceChildren(...sets.map(set => new Option(set, set)));

                const filtered = this.vocabs.filter(v => {
                    const matchSearch = v.word.toLowerCase().includes(search)
                        || v.meaning.toLowerCase().includes(search)
                        || (v.topic || '').toLowerCase().includes(search);
                    const matchSet = setFilter === 'ALL' || v.set === setFilter;
                    const matchTopic = topicFilter === 'ALL' || v.topic === topicFilter;
                    const matchSrs = srsFilter === 'ALL' || v.srsStage === srsFilter;
                    return matchSearch && matchSet && matchTopic && matchSrs;
                });
                const selectAllCheckbox = document.getElementById('select-all-checkbox');
                selectAllCheckbox.checked = this.vocabs.length > 0 && this.vocabs.every(vocab => this.selectedIds.has(vocab.id));
                selectAllCheckbox.indeterminate = !selectAllCheckbox.checked && this.selectedIds.size > 0;

                const groupedTopics = VOCAB_TOPIC_LABELS
                    .map(topic => ({ topic, words: filtered.filter(vocab => vocab.topic === topic) }))
                    .filter(group => group.words.length > 0);
                document.getElementById('vocab-topic-summary').textContent =
                    `${filtered.length} từ trong ${groupedTopics.length} cụm chủ đề`;

                const tbody = document.getElementById('vocab-table-body');
                tbody.innerHTML = groupedTopics.map(group => `
                    <tr class="topic-group-row">
                        <td colspan="10" class="px-4 py-3 bg-blue-50/80 dark:bg-blue-950/30 border-y border-blue-100 dark:border-blue-900/40">
                            <div class="flex items-center justify-between gap-3">
                                <span class="font-extrabold text-blue-800 dark:text-blue-200">${group.topic}</span>
                                <span class="rounded-full bg-white/80 dark:bg-slate-800 px-2.5 py-1 text-[10px] font-bold text-slate-500 dark:text-slate-300">${group.words.length} từ</span>
                            </div>
                        </td>
                    </tr>
                    ${group.words.map(v => {
                    const isChecked = this.selectedIds.has(v.id);
                    let srsBadge = '<span class="px-2 py-0.5 rounded-full bg-slate-400/10 text-slate-500 font-bold">Mới</span>';
                    if (v.srsStage === 'learning') srsBadge = '<span class="px-2 py-0.5 rounded-full bg-duo-orange/10 text-duo-orange font-bold">Đang học</span>';
                    if (v.srsStage === 'review') srsBadge = '<span class="px-2 py-0.5 rounded-full bg-duo-blue/10 text-duo-blue font-bold">Cần ôn</span>';
                    if (v.srsStage === 'mastered') srsBadge = '<span class="px-2 py-0.5 rounded-full bg-duo-green/10 text-duo-green font-bold">Thành thạo</span>';

                    return `
                        <tr class="vocab-row hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${isChecked ? 'bg-duo-blue/10' : ''}" data-id="${escapeHTML(v.id)}">
                            <td class="p-3.5 text-center">
                                <input type="checkbox" data-vocab-action="select" class="row-checkbox rounded border-slate-300 text-duo-blue focus:ring-duo-blue" aria-label="Chọn ${escapeHTML(v.word)}" ${isChecked ? 'checked' : ''}>
                            </td>
                            <td class="p-3.5 font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <span>${escapeHTML(v.word)}</span>
                                <button data-vocab-action="speak" class="text-duo-blue hover:scale-110" aria-label="Phát âm ${escapeHTML(v.word)}"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path></svg></button>
                            </td>
                            <td class="p-3.5 font-mono text-slate-400"><span class="ipa-transcription">${escapeHTML(v.ipa || '-')}</span></td>
                            <td class="p-3.5 uppercase font-semibold text-[10px] text-slate-500">${escapeHTML(v.pos || 'noun')}</td>
                            <td class="p-3.5 font-medium text-duo-green">${escapeHTML(v.meaning)}</td>
                            <td class="p-3.5 text-slate-400 italic max-w-xs truncate" title="${escapeHTML(v.example || '')}">${escapeHTML(v.example || '-')}</td>
                            <td class="p-3.5"><span class="px-2 py-0.5 rounded-lg bg-black/5 dark:bg-white/5 font-semibold text-[11px]">${escapeHTML(v.set || 'Mặc định')}</span></td>
                            <td class="p-2">
                                <select data-vocab-action="topic" class="topic-row-select max-w-44 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[10px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" aria-label="Chủ đề của ${escapeHTML(v.word)}">
                                    ${VOCAB_TOPIC_LABELS.map(topic => `<option value="${escapeHTML(topic)}" ${v.topic === topic ? 'selected' : ''}>${escapeHTML(topic)}</option>`).join('')}
                                </select>
                            </td>
                            <td class="p-3.5">${srsBadge}</td>
                            <td class="p-3.5 text-center space-x-1">
                                <button type="button" data-vocab-action="edit" class="inline-flex items-center gap-1 px-2 py-1 text-duo-blue hover:bg-duo-blue/10 rounded-lg font-bold" aria-label="Chỉnh sửa ${escapeHTML(v.word)}" title="Chỉnh sửa từ vựng">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m16.862 4.487 2.651 2.651M8 16l3.5-.7L20 6.8a1.875 1.875 0 0 0-2.65-2.65l-8.5 8.5L8 16Zm-3 4h14"></path></svg>
                                    <span>Sửa</span>
                                </button>
                                <button type="button" data-vocab-action="delete" class="p-1 text-duo-red hover:bg-duo-red/10 rounded-lg" aria-label="Xóa ${escapeHTML(v.word)}"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a1.995 1.995 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                            </td>
                        </tr>
                    `;
                }).join('')}
                `).join('');

                this.updateFloatingActionBar();
            }

            setupVocabularyTableActions() {
                const tbody = document.getElementById('vocab-table-body');
                tbody.addEventListener('change', event => {
                    const control = event.target.closest('[data-vocab-action]');
                    if (!control) return;
                    const row = control.closest('.vocab-row');
                    if (!row) return;
                    if (control.dataset.vocabAction === 'select') this.toggleSelectRow(row.dataset.id, control.checked);
                    if (control.dataset.vocabAction === 'topic') this.updateVocabularyTopic(row.dataset.id, control.value);
                });
                tbody.addEventListener('click', event => {
                    const button = event.target.closest('button[data-vocab-action]');
                    if (!button) return;
                    const row = button.closest('.vocab-row');
                    if (!row) return;
                    if (button.dataset.vocabAction === 'speak') {
                        const vocab = this.vocabs.find(item => item.id === row.dataset.id);
                        if (vocab) this.speakText(vocab.word);
                    }
                    if (button.dataset.vocabAction === 'edit') this.openEditWordModal(row.dataset.id);
                    if (button.dataset.vocabAction === 'delete') this.deleteWord(row.dataset.id);
                });
            }

            setupQuizActions() {
                const view = document.getElementById('quiz-question-view');
                view.addEventListener('click', event => {
                    const option = event.target.closest('.quiz-option');
                    if (option) {
                        this.checkQuizChoice(option, option.dataset.correct === 'true');
                        return;
                    }
                    const button = event.target.closest('[data-quiz-answer], [data-speak-word]');
                    if (!button) return;
                    if (button.hasAttribute('data-speak-word')) {
                        this.speakText(button.dataset.speakWord);
                        return;
                    }
                    const input = view.querySelector('#quiz-input-text, #quiz-dictation-input');
                    this.checkAnswer(input.value.trim().toLowerCase() === button.dataset.quizAnswer.toLowerCase(), button.dataset.quizAnswer);
                });
            }

            setupGameActions() {
                const game = document.getElementById('tab-game');
                game.addEventListener('click', event => {
                    const modeButton = event.target.closest('[data-game-mode]');
                    if (modeButton) {
                        this.selectGameMode(modeButton.dataset.gameMode);
                        return;
                    }
                    const button = event.target.closest('.game-card[data-id]');
                    if (button) {
                        this.handleGameCardClick(button, button.dataset.id, button.dataset.type);
                        return;
                    }
                    const answerButton = event.target.closest('[data-game-answer]');
                    if (answerButton) this.answerGameQuestion(answerButton.dataset.gameAnswer === 'true');
                });
                game.addEventListener('submit', event => {
                    const form = event.target.closest('[data-game-action="scramble-answer"]');
                    if (!form) return;
                    event.preventDefault();
                    const input = form.querySelector('input[name="game-answer"]');
                    this.answerScramble(input.value);
                });
            }

            /* Marquee Selection Logic */
            setupMarqueeDragSelection() {
                const container = document.getElementById('marquee-container');
                let isDragging = false;
                let startX, startY, marqueeBox;

                container.addEventListener('mousedown', (e) => {
                    if (['INPUT', 'BUTTON', 'SELECT', 'TEXTAREA'].includes(e.target.tagName) || e.target.closest('button, select, textarea')) return;
                    isDragging = true;
                    const rect = container.getBoundingClientRect();
                    startX = e.clientX - rect.left;
                    startY = e.clientY - rect.top;

                    marqueeBox = document.createElement('div');
                    marqueeBox.className = 'marquee-selection-box';
                    marqueeBox.style.left = `${startX}px`;
                    marqueeBox.style.top = `${startY}px`;
                    container.appendChild(marqueeBox);
                });

                container.addEventListener('mousemove', (e) => {
                    if (!isDragging || !marqueeBox) return;
                    const rect = container.getBoundingClientRect();
                    const currentX = e.clientX - rect.left;
                    const currentY = e.clientY - rect.top;

                    const width = Math.abs(currentX - startX);
                    const height = Math.abs(currentY - startY);
                    const left = Math.min(currentX, startX);
                    const top = Math.min(currentY, startY);

                    marqueeBox.style.width = `${width}px`;
                    marqueeBox.style.height = `${height}px`;
                    marqueeBox.style.left = `${left}px`;
                    marqueeBox.style.top = `${top}px`;

                    // Check intersection with table rows
                    const boxRect = marqueeBox.getBoundingClientRect();
                    document.querySelectorAll('.vocab-row').forEach(row => {
                        const rowRect = row.getBoundingClientRect();
                        const id = row.getAttribute('data-id');
                        const isIntersecting = !(boxRect.right < rowRect.left || boxRect.left > rowRect.right || boxRect.bottom < rowRect.top || boxRect.top > rowRect.bottom);
                        if (isIntersecting) {
                            this.selectedIds.add(id);
                        }
                    });
                    this.renderVocabTable();
                });

                window.addEventListener('mouseup', () => {
                    if (isDragging && marqueeBox) {
                        marqueeBox.remove();
                        isDragging = false;
                    }
                });
            }

            toggleSelectRow(id, isChecked) {
                if (isChecked) this.selectedIds.add(id);
                else this.selectedIds.delete(id);
                this.updateFloatingActionBar();
            }

            toggleSelectAll(isChecked) {
                if (isChecked) {
                    this.vocabs.forEach(v => this.selectedIds.add(v.id));
                } else {
                    this.selectedIds.clear();
                }
                this.renderVocabTable();
            }

            selectVocabularySet() {
                const selectedSet = document.getElementById('vocab-set-filter').value;
                if (selectedSet === 'ALL') return;
                this.vocabs.forEach(vocab => {
                    if (vocab.set === selectedSet) this.selectedIds.add(vocab.id);
                });
                this.renderVocabTable();
            }

            deleteVocabularySet() {
                const selectedSet = document.getElementById('vocab-set-filter').value;
                if (selectedSet === 'ALL') return;
                const wordIds = new Set(this.vocabs
                    .filter(vocab => vocab.set === selectedSet)
                    .map(vocab => vocab.id));
                const wordCount = wordIds.size;
                const confirmation = wordCount > 0
                    ? `Xóa bộ "${selectedSet}" và toàn bộ ${wordCount} từ trong bộ này? Thao tác này không thể hoàn tác.`
                    : `Xóa bộ "${selectedSet}"? Thao tác này không thể hoàn tác.`;
                if (!confirm(confirmation)) return;

                this.vocabs = this.vocabs.filter(vocab => !wordIds.has(vocab.id));
                this.vocabSets = this.vocabSets.filter(set => set !== selectedSet);
                this.selectedIds = new Set([...this.selectedIds].filter(id => !wordIds.has(id)));
                this.saveState();
                document.getElementById('vocab-set-filter').value = 'ALL';

                const flashcardSet = document.getElementById('flashcard-set-select');
                if (flashcardSet.value === selectedSet) {
                    flashcardSet.value = 'ALL';
                    this.initFlashcards();
                }
                this.renderVocabTable();
            }

            updateVocabularyTopic(id, topic) {
                const vocab = this.vocabs.find(item => item.id === id);
                if (!vocab || !VOCAB_TOPIC_LABELS.includes(topic)) return;
                vocab.topic = topic;
                this.saveState();
                this.renderVocabTable();
            }

            updateFloatingActionBar() {
                const bar = document.getElementById('floating-action-bar');
                const count = this.selectedIds.size;
                document.getElementById('selected-count').textContent = count;
                const editButton = document.getElementById('edit-selected-vocab-button');
                editButton.disabled = count !== 1;
                editButton.title = count === 1
                    ? 'Chỉnh sửa từ đang chọn'
                    : 'Chọn đúng một từ để chỉnh sửa';
                const selectAllCheckbox = document.getElementById('select-all-checkbox');
                selectAllCheckbox.checked = this.vocabs.length > 0 && this.vocabs.every(vocab => this.selectedIds.has(vocab.id));
                selectAllCheckbox.indeterminate = !selectAllCheckbox.checked && count > 0;
                bar.style.display = count > 0 ? 'flex' : 'none';
            }

            editSelectedWord() {
                if (this.selectedIds.size !== 1) return;
                const [id] = this.selectedIds;
                this.openEditWordModal(id);
            }

            clearSelection() {
                this.selectedIds.clear();
                this.renderVocabTable();
            }

            bulkDelete() {
                if (!confirm(`Bạn có chắc muốn xóa ${this.selectedIds.size} từ đã chọn?`)) return;
                this.vocabs = this.vocabs.filter(v => !this.selectedIds.has(v.id));
                this.selectedIds.clear();
                this.saveState();
                this.renderVocabTable();
            }

            bulkChangeSet() {
                const newSet = prompt('Nhập tên bộ từ vựng mới:')?.trim();
                if (!newSet) return;
                this.vocabs.forEach(v => {
                    if (this.selectedIds.has(v.id)) v.set = newSet;
                });
                if (!this.vocabSets.some(set => set.toLocaleLowerCase() === newSet.toLocaleLowerCase())) {
                    this.vocabSets.push(newSet);
                }
                this.selectedIds.clear();
                this.saveState();
                this.renderVocabTable();
            }

            deleteWord(id) {
                this.vocabs = this.vocabs.filter(v => v.id !== id);
                this.saveState();
                this.renderVocabTable();
            }

            async handleImportFile(e) {
                const file = e.target.files[0];
                if (!file) return;

                try {
                    const buffer = await file.arrayBuffer();
                    const extension = file.name.split('.').pop().toLowerCase();
                    let rows;
                    if (['xlsx', 'xls', 'csv', 'txt'].includes(extension)) {
                        rows = this.extractSpreadsheetRows(buffer);
                    } else if (extension === 'pdf') {
                        rows = await this.extractPdfRows(buffer);
                    } else if (extension === 'docx') {
                        rows = await this.extractWordRows(buffer);
                    } else {
                        throw new Error('Định dạng chưa được hỗ trợ. Hãy chọn XLSX, XLS, CSV, TXT, PDF hoặc DOCX.');
                    }

                    const vocabulary = this.normalizeImportedRows(rows);
                    if (vocabulary.length === 0) {
                        throw new Error('Không tìm thấy cặp từ và nghĩa hợp lệ. Tệp cần có cột Word/English và Meaning/Translation, hoặc mỗi dòng theo dạng “từ | nghĩa”.');
                    }

                    const defaultSet = `Imported: ${file.name.replace(/\.[^.]+$/, '')}`;
                    vocabulary.forEach(item => {
                        const set = item.set || defaultSet;
                        this.vocabs.push({
                            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                            ...item,
                            set,
                            srsStage: 'new',
                            interval: 0,
                            easeFactor: 2.5,
                            rep: 0,
                            nextReview: Date.now()
                        });
                        if (!this.vocabSets.some(existing => existing.toLocaleLowerCase() === set.toLocaleLowerCase())) {
                            this.vocabSets.push(set);
                        }
                    });

                    this.saveState();
                    this.renderVocabTable();
                    if (this.currentTab === 'flashcard') this.initFlashcards();
                    alert(`Đã nhập ${vocabulary.length} từ vựng từ "${file.name}".`);
                } catch (error) {
                    console.error('Không thể nhập tệp từ vựng:', error);
                    alert(error.message || 'Không thể đọc tệp. Hãy kiểm tra định dạng và nội dung rồi thử lại.');
                } finally {
                    e.target.value = '';
                }
            }

            extractSpreadsheetRows(buffer) {
                const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                if (!firstSheet) return [];
                return XLSX.utils.sheet_to_json(firstSheet, { defval: '' });
            }

            async extractPdfRows(buffer) {
                if (!window.pdfjsLib) {
                    throw new Error('Không tải được thư viện đọc PDF. Kiểm tra kết nối mạng rồi tải lại trang.');
                }

                window.pdfjsLib.GlobalWorkerOptions.workerSrc =
                    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                const pdf = await window.pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
                const lines = [];
                for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
                    const page = await pdf.getPage(pageNumber);
                    const content = await page.getTextContent();
                    const items = content.items
                        .filter(item => item.str?.trim())
                        .map(item => ({ text: item.str.trim(), x: item.transform[4], y: item.transform[5], width: item.width }))
                        .sort((a, b) => b.y - a.y || a.x - b.x);

                    let currentLine = null;
                    for (const item of items) {
                        if (!currentLine || Math.abs(currentLine.y - item.y) > 3) {
                            if (currentLine) lines.push(currentLine.parts.join(''));
                            currentLine = { y: item.y, lastX: item.x + item.width, parts: [item.text] };
                            continue;
                        }
                        const gap = item.x - currentLine.lastX;
                        currentLine.parts.push(gap > 24 ? `\t${item.text}` : ` ${item.text}`);
                        currentLine.lastX = item.x + item.width;
                    }
                    if (currentLine) lines.push(currentLine.parts.join(''));
                }
                return this.parseDelimitedVocabularyText(lines.join('\n'));
            }

            async extractWordRows(buffer) {
                if (!window.mammoth) {
                    throw new Error('Không tải được thư viện đọc Word. Kiểm tra kết nối mạng rồi tải lại trang.');
                }

                const result = await window.mammoth.convertToHtml({ arrayBuffer: buffer });
                const documentContent = new DOMParser().parseFromString(result.value, 'text/html');
                const rows = [];

                documentContent.querySelectorAll('table').forEach(table => {
                    const tableRows = [...table.querySelectorAll('tr')]
                        .map(row => [...row.querySelectorAll('th, td')].map(cell => cell.innerText.trim()));
                    rows.push(...this.tableRowsToObjects(tableRows));
                });

                const paragraphs = [...documentContent.querySelectorAll('p')]
                    .map(paragraph => paragraph.innerText.trim())
                    .filter(Boolean);
                rows.push(...this.parseDelimitedVocabularyText(paragraphs.join('\n')));
                return rows;
            }

            tableRowsToObjects(tableRows) {
                if (tableRows.length === 0) return [];
                const headers = tableRows[0].map(normalizeImportHeader);
                const findHeaderIndex = key => headers.findIndex(header => VOCAB_IMPORT_HEADERS[key].has(header));
                const wordIndex = findHeaderIndex('word');
                const meaningIndex = findHeaderIndex('meaning');
                const rows = [];

                if (wordIndex !== -1 && meaningIndex !== -1) {
                    const columnMap = {
                        word: wordIndex,
                        meaning: meaningIndex,
                        ipa: findHeaderIndex('ipa'),
                        pos: findHeaderIndex('pos'),
                        example: findHeaderIndex('example'),
                        set: findHeaderIndex('set'),
                        topic: findHeaderIndex('topic')
                    };
                    tableRows.slice(1).forEach(cells => {
                        const row = {};
                        Object.entries(columnMap).forEach(([key, index]) => {
                            if (index >= 0) row[key] = cells[index] || '';
                        });
                        rows.push(row);
                    });
                    return rows;
                }

                return tableRows.map(cells => ({
                    word: cells[0] || '',
                    meaning: cells[1] || '',
                    ipa: cells[2] || '',
                    example: cells[3] || ''
                }));
            }

            parseDelimitedVocabularyText(text) {
                const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
                if (lines.length === 0) return [];

                const splitLine = line => {
                    if (line.includes('\t')) return line.split('\t').map(cell => cell.trim());
                    if (line.includes('|')) return line.split('|').map(cell => cell.trim());
                    const cells = line.split(/\s+[–—-]\s+|\s{2,}/).map(cell => cell.trim());
                    return cells.length > 1 ? cells : [line.trim()];
                };
                return this.tableRowsToObjects(lines.map(splitLine));
            }

            normalizeImportedRows(rows) {
                const result = [];

                rows.forEach(row => {
                    if (Array.isArray(row)) row = Object.fromEntries(row.map(([key, value]) => [String(key).toLocaleLowerCase().trim(), value]));
                    const entries = Object.fromEntries(Object.entries(row).map(([key, value]) => [normalizeImportHeader(key), value]));
                    const findValue = type => {
                        const key = Object.keys(entries).find(candidate => VOCAB_IMPORT_HEADERS[type].has(candidate));
                        return key ? entries[key] : '';
                    };
                    const word = String(findValue('word') || '').trim();
                    const meaning = String(findValue('meaning') || '').trim();
                    if (!word || !meaning) return;

                    result.push(normalizeVocabularyFields({
                        word,
                        meaning,
                        ipa: String(findValue('ipa') || '').trim(),
                        pos: String(findValue('pos') || 'noun').trim(),
                        example: String(findValue('example') || '').trim(),
                        set: String(findValue('set') || '').trim(),
                        topic: String(findValue('topic') || '').trim()
                    }));
                });
                return result;
            }

            initFlashcards() {
                const select = document.getElementById('flashcard-set-select');
                const selectedSet = select.value || 'ALL';
                const sets = this.getVocabularySets();
                const options = [new Option(`Tất cả Bộ từ (${this.vocabs.length})`, 'ALL')];
                sets.forEach(set => options.push(new Option(set, set)));
                select.replaceChildren(...options);
                select.value = sets.includes(selectedSet) ? selectedSet : 'ALL';

                this.flashcardIndex = 0;
                this.isFlipped = false;
                this.renderCurrentCard();
            }

            getFlashcardPool() {
                const selectedSet = document.getElementById('flashcard-set-select').value;
                if (selectedSet === 'ALL') return this.vocabs;
                return this.vocabs.filter(v => (v.set || 'Mặc định').trim() === selectedSet);
            }

            renderCurrentCard() {
                const cardInner = document.getElementById('flashcard-inner');
                cardInner.classList.remove('rotate-y-180');
                this.isFlipped = false;

                const pool = this.getFlashcardPool();
                document.getElementById('card-total-count').textContent = pool.length;
                if (pool.length === 0) {
                    document.getElementById('card-current-idx').textContent = '0';
                    document.getElementById('card-word-text').textContent = 'Bộ từ chưa có từ vựng';
                    document.getElementById('card-ipa-text').textContent = '';
                    document.getElementById('card-pos-badge').textContent = '';
                    document.getElementById('card-example-text').textContent = '';
                    document.getElementById('card-meaning-text').textContent = 'Hãy thêm từ vào bộ này trong Kho Từ Vựng.';
                    document.getElementById('card-example-vn-text').textContent = '';
                    return;
                }

                document.getElementById('card-current-idx').textContent = this.flashcardIndex + 1;
                const card = pool[this.flashcardIndex % pool.length];

                document.getElementById('card-word-text').textContent = card.word;
                document.getElementById('card-ipa-text').textContent = card.ipa || '';
                document.getElementById('card-pos-badge').textContent = card.pos || 'noun';
                document.getElementById('card-example-text').textContent = card.example ? `"${card.example}"` : '';
                document.getElementById('card-meaning-text').textContent = card.meaning;
                document.getElementById('card-example-vn-text').textContent = card.example ? `Ví dụ: ${card.example}` : '';
            }

            flipCard() {
                const cardInner = document.getElementById('flashcard-inner');
                this.isFlipped = !this.isFlipped;
                if (this.isFlipped) cardInner.classList.add('rotate-y-180');
                else cardInner.classList.remove('rotate-y-180');
            }

            rateSRS(quality) {
                const pool = this.getFlashcardPool();
                if (pool.length === 0) return;
                const card = pool[this.flashcardIndex % pool.length];

                // SM-2 Spaced Repetition Algorithm Logic
                if (quality === 'again') {
                    card.srsStage = 'learning';
                    card.interval = 1;
                } else if (quality === 'hard') {
                    card.srsStage = 'learning';
                    card.interval = 1;
                } else if (quality === 'good') {
                    card.srsStage = 'review';
                    card.interval = 3;
                } else if (quality === 'easy') {
                    card.srsStage = 'mastered';
                    card.interval = 7;
                } else {
                    return;
                }

                const intervalMilliseconds = quality === 'again'
                    ? 30 * 1000
                    : card.interval * 24 * 60 * 60 * 1000;
                card.nextReview = Date.now() + intervalMilliseconds;
                this.addXP(15);
                this.saveState();
                this.flashcardIndex++;
                this.renderCurrentCard();
            }

            switchQuizMode(mode) {
                if (this.quizFeedbackTimer) clearTimeout(this.quizFeedbackTimer);
                this.quizFeedbackTimer = null;
                this.quizMode = mode;
                document.querySelectorAll('.quiz-tab-btn').forEach(btn => btn.classList.remove('bg-duo-blue', 'text-white'));
                document.getElementById(`quiz-mode-${mode}`).classList.add('bg-duo-blue', 'text-white');
                this.renderQuizQuestion();
            }

            getQuizVocabulary() {
                return this.vocabs
                    .map(vocab => ({ ...vocab, meaning: String(vocab.meaning || '').trim() }))
                    .filter(vocab => vocab.word?.trim() && vocab.meaning && !isIpaTranscription(vocab.meaning));
            }

            renderQuizQuestion() {
                const view = document.getElementById('quiz-question-view');
                const vocabWithMeanings = this.getQuizVocabulary();
                const wordPool = this.vocabs.filter(vocab => vocab.word?.trim());
                const uniqueMeanings = [...new Set(vocabWithMeanings.map(vocab => vocab.meaning))];

                if (this.quizMode === 'mcq' && uniqueMeanings.length < 4) {
                    view.innerHTML = `<div class="text-center py-8 font-bold text-slate-400">Cần ít nhất 4 nghĩa tiếng Việt khác nhau để làm trắc nghiệm. Hãy kiểm tra cột Nghĩa trong Kho Từ Vựng.</div>`;
                    return;
                }
                if (this.quizMode === 'fill' && vocabWithMeanings.length === 0) {
                    view.innerHTML = `<div class="text-center py-8 font-bold text-slate-400">Chưa có từ nào với nghĩa tiếng Việt hợp lệ. Hãy kiểm tra cột Nghĩa trong Kho Từ Vựng.</div>`;
                    return;
                }
                if (this.quizMode === 'listen' && wordPool.length === 0) {
                    view.innerHTML = `<div class="text-center py-8 font-bold text-slate-400">Chưa có từ vựng để luyện nghe.</div>`;
                    return;
                }

                const targetPool = this.quizMode === 'listen' ? wordPool : vocabWithMeanings;
                const target = targetPool[Math.floor(Math.random() * targetPool.length)];

                if (this.quizMode === 'mcq') {
                    const options = [
                        target.meaning,
                        ...uniqueMeanings.filter(meaning => meaning !== target.meaning)
                            .sort(() => Math.random() - 0.5)
                            .slice(0, 3)
                    ];
                    options.sort(() => Math.random() - 0.5);

                    view.innerHTML = `
                        <div class="text-center space-y-2">
                            <span class="text-xs font-bold text-duo-blue uppercase">Chọn nghĩa chính xác của từ:</span>
                            <h2 class="text-3xl font-black">${escapeHTML(target.word)}</h2>
                            <p class="text-xs text-slate-400 font-mono">${escapeHTML(target.ipa || '')}</p>
                        </div>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
                            ${options.map(opt => `
                                <button data-correct="${opt === target.meaning}" class="quiz-option p-4 rounded-2xl bg-notion-bg dark:bg-notion-darkBg border border-notion-border dark:border-notion-darkBorder hover:border-duo-blue font-bold text-left text-sm transition-all">
                                    ${escapeHTML(opt)}
                                </button>
                            `).join('')}
                        </div>
                    `;
                } else if (this.quizMode === 'fill') {
                    const maskedExample = target.example ? target.example.replace(new RegExp(target.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '_____') : `Sự lựa chọn chính xác cho: "${target.meaning}" là _____`;
                    view.innerHTML = `
                        <div class="text-center space-y-4">
                            <span class="text-xs font-bold text-duo-purple uppercase">Điền từ thích hợp vào khoảng trống:</span>
                            <p class="text-lg font-bold italic text-slate-700 dark:text-slate-200">"${escapeHTML(maskedExample)}"</p>
                            <p class="text-xs text-duo-green font-bold">Gợi ý nghĩa: ${escapeHTML(target.meaning)}</p>
                            <input type="text" id="quiz-input-text" placeholder="Nhập từ tiếng Anh..." class="w-full max-w-sm px-4 py-3 rounded-2xl bg-notion-bg dark:bg-notion-darkBg border border-notion-border dark:border-notion-darkBorder font-bold text-center text-lg focus:ring-2 focus:ring-duo-blue outline-none">
                            <button data-quiz-answer="${escapeHTML(target.word)}" class="px-8 py-3 rounded-2xl bg-duo-blue text-white font-bold text-sm shadow-md">XÁC NHẬN</button>
                        </div>
                    `;
                } else if (this.quizMode === 'listen') {
                    view.innerHTML = `
                        <div class="text-center space-y-4">
                            <span class="text-xs font-bold text-duo-orange uppercase">Luyện Nghe & Gõ Lại Từ:</span>
                            <div>
                                <button data-speak-word="${escapeHTML(target.word)}" class="p-5 rounded-full bg-duo-orange/10 text-duo-orange hover:scale-110 transition-transform shadow-lg">
                                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path></svg>
                                </button>
                            </div>
                            <input type="text" id="quiz-dictation-input" placeholder="Gõ từ bạn nghe được..." class="w-full max-w-sm px-4 py-3 rounded-2xl bg-notion-bg dark:bg-notion-darkBg border border-notion-border dark:border-notion-darkBorder font-bold text-center text-lg focus:ring-2 focus:ring-duo-orange outline-none">
                            <div>
                                <button data-quiz-answer="${escapeHTML(target.word)}" class="px-8 py-3 rounded-2xl bg-duo-orange text-white font-bold text-sm shadow-md">KIỂM TRA</button>
                            </div>
                        </div>
                    `;
                }
            }

            checkQuizChoice(button, isCorrect) {
                const options = [...document.querySelectorAll('.quiz-option')];
                options.forEach(option => { option.disabled = true; });

                if (isCorrect) {
                    button.classList.add('is-correct');
                    button.style.setProperty('background-color', '#58CC02', 'important');
                    button.style.setProperty('border-color', '#58CC02', 'important');
                    button.style.setProperty('color', '#FFFFFF', 'important');
                    this.playSFX('correct');
                    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
                    this.addXP(20);
                    const score = document.getElementById('quiz-score-text');
                    const currentScore = Number(score.textContent.match(/\d+/)?.[0] || 0);
                    score.textContent = `Đúng: ${currentScore + 1}`;
                    this.quizFeedbackTimer = setTimeout(() => {
                        this.quizFeedbackTimer = null;
                        this.renderQuizQuestion();
                    }, 700);
                    return;
                }

                button.classList.add('is-wrong');
                button.style.setProperty('background-color', '#FF4B4B', 'important');
                button.style.setProperty('border-color', '#FF4B4B', 'important');
                button.style.setProperty('color', '#FFFFFF', 'important');
                this.playSFX('wrong');
                this.quizFeedbackTimer = setTimeout(() => {
                    button.classList.remove('is-wrong');
                    button.style.removeProperty('background-color');
                    button.style.removeProperty('border-color');
                    button.style.removeProperty('color');
                    options.forEach(option => { option.disabled = false; });
                    this.quizFeedbackTimer = null;
                }, 650);
            }

            checkAnswer(isCorrect, targetWord) {
                if (isCorrect) {
                    this.playSFX('correct');
                    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
                    this.addXP(20);
                    alert(`🎉 CHÍNH XÁC! +20 XP`);
                } else {
                    this.playSFX('wrong');
                    alert(`❌ SAI RỒI! Đáp án đúng là: "${targetWord}"`);
                }
                this.renderQuizQuestion();
            }

            selectGameMode(mode) {
                if (this.gameIsRunning || !['match', 'scramble', 'truth'].includes(mode)) return;
                this.gameMode = mode;
                this.gameCurrentQuestion = null;
                this.gamePool = [];
                document.querySelectorAll('[data-game-mode]').forEach(button => {
                    button.setAttribute('aria-pressed', String(button.dataset.gameMode === mode));
                });
                const copy = {
                    match: ['⚡ Ghép từ tính giờ', 'Nối cặp từ Anh - Việt chính xác trước khi hết thời gian!', 'BẮT ĐẦU GHÉP CẶP (30s)'],
                    scramble: ['🔤 Xáo chữ tính giờ', 'Dựa vào nghĩa tiếng Việt để giải mã từ tiếng Anh.', 'BẮT ĐẦU XÁO CHỮ (30s)'],
                    truth: ['⚡ Đúng hay sai', 'Xác định nhanh nghĩa có khớp với từ tiếng Anh không.', 'BẮT ĐẦU THỬ THÁCH (30s)']
                }[mode];
                document.getElementById('game-title').textContent = copy[0];
                document.getElementById('game-description').textContent = copy[1];
                document.getElementById('game-start-button').textContent = copy[2];
                document.getElementById('game-board-container').replaceChildren();
            }

            shuffleItems(items) {
                const shuffled = [...items];
                for (let index = shuffled.length - 1; index > 0; index--) {
                    const swapIndex = Math.floor(Math.random() * (index + 1));
                    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
                }
                return shuffled;
            }

            startGame() {
                if (this.gameTimer) clearInterval(this.gameTimer);
                if (this.gameTransitionTimer) clearTimeout(this.gameTransitionTimer);
                this.gameTimer = null;
                this.gameTransitionTimer = null;
                this.gameScore = 0;
                this.gameCombo = 1;
                this.gameTimeLeft = 30;
                this.gameSelectedCard = null;
                this.gameRound = 0;
                this.gameCurrentQuestion = null;
                const vocabulary = this.getQuizVocabulary();
                this.gamePool = this.shuffleItems(this.gameMode === 'scramble'
                    ? vocabulary.filter(item => /[a-z]/i.test(item.word))
                    : vocabulary);
                if (this.gameMode === 'truth') {
                    const seenMeanings = new Set();
                    this.gamePool = this.gamePool.filter(item => {
                        const meaning = item.meaning.toLocaleLowerCase();
                        if (seenMeanings.has(meaning)) return false;
                        seenMeanings.add(meaning);
                        return true;
                    });
                }

                document.getElementById('game-score-text').textContent = '0';
                document.getElementById('game-combo-text').textContent = 'x1';
                document.getElementById('game-timer-num').textContent = '30s';
                document.getElementById('game-timer-bar').style.width = '100%';

                if (this.gamePool.length === 0 || (this.gameMode === 'truth' && this.gamePool.length < 2)) {
                    const message = this.gameMode === 'truth'
                        ? 'Cần ít nhất hai cặp từ - nghĩa khác nhau để chơi Đúng hay sai.'
                        : this.gameMode === 'scramble'
                            ? 'Chưa có từ tiếng Anh hợp lệ để chơi Xáo chữ.'
                            : 'Chưa có từ nào với nghĩa tiếng Việt hợp lệ để ghép.';
                    alert(`${message} Hãy kiểm tra dữ liệu trong Kho Từ Vựng.`);
                    return;
                }
                if (!this.renderGameRound()) return;
                this.gameIsRunning = true;
                document.getElementById('game-mode-selector').classList.add('hidden');
                document.getElementById('game-start-screen').classList.add('hidden');

                this.gameTimer = setInterval(() => {
                    this.gameTimeLeft--;
                    document.getElementById('game-timer-num').textContent = `${this.gameTimeLeft}s`;
                    document.getElementById('game-timer-bar').style.width = `${(this.gameTimeLeft / 30) * 100}%`;

                    if (this.gameTimeLeft <= 0) {
                        clearInterval(this.gameTimer);
                        this.endGame();
                    }
                }, 1000);
            }

            renderGameRound() {
                if (this.gameMode === 'match') return this.renderGameCards();
                if (this.gameMode === 'scramble') return this.renderScrambleRound();
                if (this.gameMode === 'truth') return this.renderTruthRound();
                return false;
            }

            renderGameCards() {
                const pool = this.shuffleItems(this.gamePool).slice(0, 5);
                const board = document.getElementById('game-board-container');
                if (pool.length === 0) {
                    board.innerHTML = `<p class="col-span-2 self-center text-center text-sm font-bold text-slate-400">Chưa có cặp từ Anh - Việt hợp lệ. Hãy kiểm tra cột Nghĩa trong Kho Từ Vựng.</p>`;
                    return false;
                }

                const engList = this.shuffleItems(pool.map(v => ({ id: v.id, text: v.word, type: 'eng' })));
                const vnList = this.shuffleItems(pool.map(v => ({ id: v.id, text: v.meaning, type: 'vn' })));

                board.innerHTML = `
                    <div class="space-y-3">
                        ${engList.map(item => `
                            <button data-id="${escapeHTML(item.id)}" data-type="eng" class="game-card w-full p-4 rounded-2xl bg-notion-bg dark:bg-notion-darkBg border border-notion-border dark:border-notion-darkBorder hover:border-duo-orange transition-all text-left font-bold text-sm">
                                ${escapeHTML(item.text)}
                            </button>
                        `).join('')}
                    </div>
                    <div class="space-y-3">
                        ${vnList.map(item => `
                            <button data-id="${escapeHTML(item.id)}" data-type="vn" class="game-card w-full p-4 rounded-2xl bg-notion-bg dark:bg-notion-darkBg border border-notion-border dark:border-notion-darkBorder hover:border-duo-orange transition-all text-left font-bold text-sm">
                                ${escapeHTML(item.text)}
                            </button>
                        `).join('')}
                    </div>
                `;
                return true;
            }

            renderScrambleRound() {
                const board = document.getElementById('game-board-container');
                const item = this.gamePool[this.gameRound % this.gamePool.length];
                const letters = [...item.word.toLocaleLowerCase().replace(/[^a-z]/g, '')];
                if (!letters.length) return false;
                let scrambled = this.shuffleItems(letters);
                if (scrambled.join('') === letters.join('') && letters.length > 1) {
                    scrambled = [...scrambled.slice(1), scrambled[0]];
                }
                this.gameCurrentQuestion = { item, answer: letters.join('') };
                board.innerHTML = `
                    <div class="col-span-2 mx-auto w-full max-w-xl space-y-6 self-center rounded-2xl border border-notion-border bg-notion-bg p-5 dark:border-notion-darkBorder dark:bg-notion-darkBg sm:p-8">
                        <p class="text-xs font-bold uppercase tracking-wider text-duo-blue">Nghĩa của từ</p>
                        <h3 class="text-xl font-black sm:text-2xl">${escapeHTML(item.meaning)}</h3>
                        <p class="rounded-xl bg-white/70 px-3 py-4 font-mono text-xl font-black tracking-[0.35em] text-duo-purple dark:bg-white/5">${escapeHTML(scrambled.join(' '))}</p>
                        <form data-game-action="scramble-answer" class="flex flex-col gap-2 sm:flex-row">
                            <input name="game-answer" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Nhập từ tiếng Anh đã xáo chữ" placeholder="Nhập từ tiếng Anh..." class="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold dark:border-slate-600 dark:bg-slate-900">
                            <button type="submit" class="rounded-xl bg-duo-blue px-5 py-3 text-sm font-black text-white hover:bg-duo-blueDark">Kiểm tra</button>
                        </form>
                        <p id="game-question-feedback" class="min-h-5 text-sm font-bold" aria-live="polite"></p>
                    </div>
                `;
                board.querySelector('input[name="game-answer"]').focus();
                return true;
            }

            renderTruthRound() {
                const board = document.getElementById('game-board-container');
                const item = this.gamePool[this.gameRound % this.gamePool.length];
                const isCorrect = Math.random() >= 0.35;
                const distractors = this.gamePool.filter(vocab => vocab.id !== item.id);
                const displayedMeaning = isCorrect
                    ? item.meaning
                    : this.shuffleItems(distractors)[0].meaning;
                this.gameCurrentQuestion = { item, isCorrect };
                board.innerHTML = `
                    <div class="col-span-2 mx-auto w-full max-w-xl space-y-6 self-center rounded-2xl border border-notion-border bg-notion-bg p-5 dark:border-notion-darkBorder dark:bg-notion-darkBg sm:p-8">
                        <p class="text-xs font-bold uppercase tracking-wider text-duo-blue">Từ này có nghĩa là</p>
                        <h3 class="text-2xl font-black sm:text-3xl">${escapeHTML(item.word)}</h3>
                        <p class="rounded-xl bg-white/70 px-4 py-5 text-lg font-bold text-duo-purple dark:bg-white/5">${escapeHTML(displayedMeaning)}</p>
                        <div class="grid grid-cols-2 gap-3">
                            <button type="button" data-game-answer="true" class="rounded-xl bg-duo-green px-4 py-3 font-black text-white hover:bg-duo-greenDark">Đúng</button>
                            <button type="button" data-game-answer="false" class="rounded-xl bg-duo-red px-4 py-3 font-black text-white hover:brightness-95">Sai</button>
                        </div>
                        <p id="game-question-feedback" class="min-h-5 text-sm font-bold" aria-live="polite"></p>
                    </div>
                `;
                return true;
            }

            answerScramble(answer) {
                if (!this.gameIsRunning || this.gameMode !== 'scramble' || !this.gameCurrentQuestion) return;
                const normalizedAnswer = String(answer).toLocaleLowerCase().replace(/[^a-z]/g, '');
                const feedback = document.getElementById('game-question-feedback');
                if (normalizedAnswer !== this.gameCurrentQuestion.answer) {
                    this.playSFX('wrong');
                    this.gameCombo = 1;
                    document.getElementById('game-combo-text').textContent = 'x1';
                    feedback.textContent = 'Chưa đúng, thử lại nhé!';
                    feedback.className = 'min-h-5 text-sm font-bold text-duo-red';
                    document.querySelector('input[name="game-answer"]')?.focus();
                    return;
                }
                this.resolveGameAnswer(true);
            }

            answerGameQuestion(answer) {
                if (!this.gameIsRunning || this.gameMode !== 'truth' || !this.gameCurrentQuestion) return;
                this.resolveGameAnswer(answer === this.gameCurrentQuestion.isCorrect);
            }

            resolveGameAnswer(isCorrect) {
                const feedback = document.getElementById('game-question-feedback');
                if (isCorrect) {
                    this.registerGameMatch();
                    if (feedback) {
                        feedback.textContent = 'Chính xác! +100 điểm';
                        feedback.className = 'min-h-5 text-sm font-bold text-duo-green';
                    }
                } else {
                    this.playSFX('wrong');
                    this.gameCombo = 1;
                    document.getElementById('game-combo-text').textContent = 'x1';
                    if (feedback) {
                        feedback.textContent = 'Chưa chính xác, lượt tiếp theo nhé!';
                        feedback.className = 'min-h-5 text-sm font-bold text-duo-red';
                    }
                }
                this.gameCurrentQuestion = null;
                this.gameRound++;
                this.gameTransitionTimer = setTimeout(() => {
                    this.gameTransitionTimer = null;
                    if (this.gameIsRunning) this.renderGameRound();
                }, 450);
            }

            registerGameMatch() {
                this.playSFX('correct');
                this.gameScore += 100 * this.gameCombo;
                this.gameCombo++;
                if (this.gameCombo > 2) this.playSFX('combo');
                document.getElementById('game-score-text').textContent = this.gameScore;
                document.getElementById('game-combo-text').textContent = `x${this.gameCombo}`;
            }

            handleGameCardClick(btn, id, type) {
                if (!this.gameIsRunning || this.gameMode !== 'match') return;
                if (btn.classList.contains('bg-duo-green')) return;

                if (!this.gameSelectedCard) {
                    this.gameSelectedCard = { btn, id, type };
                    btn.classList.add('is-selected');
                } else {
                    if (this.gameSelectedCard.type === type) {
                        this.gameSelectedCard.btn.classList.remove('is-selected');
                        if (this.gameSelectedCard.btn === btn) {
                            this.gameSelectedCard = null;
                            return;
                        }
                        this.gameSelectedCard = { btn, id, type };
                        btn.classList.add('is-selected');
                        return;
                    }

                    if (this.gameSelectedCard.id === id) {
                        // MATCH SUCCESS
                        this.registerGameMatch();
                        [btn, this.gameSelectedCard.btn].forEach(card => {
                            card.classList.remove('is-selected', 'is-wrong');
                            card.classList.add('bg-duo-green', 'is-matched');
                        });

                        this.gameSelectedCard = null;
                        this.gameRound++;

                        // Check if all cards cleared
                        if (document.querySelectorAll('.game-card:not(.bg-duo-green)').length === 0) {
                            this.gameTransitionTimer = setTimeout(() => {
                                this.gameTransitionTimer = null;
                                if (this.gameIsRunning) this.renderGameCards();
                            }, 400);
                        }
                    } else {
                        this.playSFX('wrong');
                        this.gameCombo = 1;
                        document.getElementById('game-combo-text').textContent = 'x1';
                        const firstBtn = this.gameSelectedCard.btn;
                        [firstBtn, btn].forEach(card => {
                            card.classList.remove('is-selected');
                            card.classList.add('is-wrong');
                        });
                        this.gameSelectedCard = null;
                        setTimeout(() => {
                            [firstBtn, btn].forEach(card => card.classList.remove('is-wrong'));
                        }, 650);
                    }
                }
            }

            endGame() {
                if (!this.gameIsRunning) return;
                this.gameIsRunning = false;
                if (this.gameTimer) clearInterval(this.gameTimer);
                if (this.gameTransitionTimer) clearTimeout(this.gameTransitionTimer);
                this.gameTimer = null;
                this.gameTransitionTimer = null;
                confetti({ particleCount: 100, spread: 80 });
                this.addXP(Math.floor(this.gameScore / 10));
                alert(`🏁 Hết giờ!\nTổng điểm: ${this.gameScore}\nBạn nhận được: +${Math.floor(this.gameScore / 10)} XP`);
                document.getElementById('game-mode-selector').classList.remove('hidden');
                document.getElementById('game-start-screen').classList.remove('hidden');
            }

            renderLeaderboard() {
                const mockLeaders = [
                    { rank: 1, name: 'Minh Anh (IELTS 8.0)', avatar: '👑', xp: 4850, streak: 24 },
                    { rank: 2, name: 'Hoàng Nam', avatar: '🦁', xp: 3920, streak: 18 },
                    { rank: 3, name: 'Trần Bảo', avatar: '🚀', xp: 3100, streak: 14 },
                    { rank: 4, name: this.user.name, avatar: this.user.avatar, xp: this.user.xp, streak: this.user.streak },
                    { rank: 5, name: 'Thùy Trang', avatar: '🦊', xp: 1100, streak: 4 },
                    { rank: 6, name: 'Đức Huy', avatar: '🤖', xp: 950, streak: 3 }
                ].sort((a, b) => b.xp - a.xp);

                // Top 3 Podium
                const podium = document.getElementById('leaderboard-podium');
                podium.innerHTML = `
                    <div class="text-center space-y-1 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                        <div class="text-2xl sm:text-3xl">🥈</div>
                        <div class="text-xs font-black truncate">${escapeHTML(mockLeaders[1]?.name || 'Nam')}</div>
                        <div class="text-[10px] text-amber-500 font-bold">${mockLeaders[1]?.xp || 0} XP</div>
                    </div>
                    <div class="text-center space-y-1 p-4 rounded-2xl bg-duo-yellow/20 border border-duo-yellow scale-105 shadow-lg">
                        <div class="text-3xl sm:text-4xl">👑</div>
                        <div class="text-xs font-black truncate">${escapeHTML(mockLeaders[0]?.name || 'Minh Anh')}</div>
                        <div class="text-xs text-duo-yellow font-black">${mockLeaders[0]?.xp || 0} XP</div>
                    </div>
                    <div class="text-center space-y-1 p-3 rounded-2xl bg-orange-500/10 border border-orange-500/30">
                        <div class="text-2xl sm:text-3xl">🥉</div>
                        <div class="text-xs font-black truncate">${escapeHTML(mockLeaders[2]?.name || 'Bảo')}</div>
                        <div class="text-[10px] text-orange-500 font-bold">${mockLeaders[2]?.xp || 0} XP</div>
                    </div>
                `;

                // Rank list 4-10
                const list = document.getElementById('leaderboard-list');
                list.innerHTML = mockLeaders.slice(3).map((item, idx) => `
                    <div class="flex items-center justify-between p-3 rounded-2xl bg-notion-bg dark:bg-notion-darkBg border border-notion-border dark:border-notion-darkBorder text-xs font-bold">
                        <div class="flex items-center gap-3">
                            <span class="w-6 text-slate-400 font-mono">#${idx + 4}</span>
                            <span class="text-base">${escapeHTML(item.avatar)}</span>
                            <span>${escapeHTML(item.name)}</span>
                        </div>
                        <div class="flex items-center gap-4">
                            <span class="text-duo-orange">🔥 ${item.streak} ngày</span>
                            <span class="text-amber-500">${item.xp} XP</span>
                        </div>
                    </div>
                `).join('');
            }

            initTTSVoices() {
                if (!('speechSynthesis' in window)) return;
                const voices = window.speechSynthesis.getVoices();
                const select = document.getElementById('tts-voice-select');
                if (!select) return;

                const enVoices = voices.filter(v => v.lang.startsWith('en'));
                select.innerHTML = enVoices.map((v, i) => `<option value="${i}">${escapeHTML(v.name)} (${escapeHTML(v.lang)})</option>`).join('');
            }

            updateTTSSettings() {
                const select = document.getElementById('tts-voice-select');
                const rateSelect = document.getElementById('tts-rate-select');
                const voices = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('en'));
                this.ttsVoice = voices[select.value] || null;
                this.ttsRate = parseFloat(rateSelect.value) || 1.0;
            }

            speakText(text) {
                if (!('speechSynthesis' in window)) return;
                window.speechSynthesis.cancel();
                const utter = new SpeechSynthesisUtterance(text);
                if (this.ttsVoice) utter.voice = this.ttsVoice;
                utter.rate = this.ttsRate;
                window.speechSynthesis.speak(utter);
            }

            speakWord() {
                const text = document.getElementById('card-word-text').textContent;
                this.speakText(text);
            }

            openAuthModal() {
                this.switchAuthTab('login');
                document.getElementById('auth-message').classList.add('hidden');
                document.getElementById('auth-modal').classList.remove('hidden');
                this.renderGoogleButton();
            }

            closeAuthModal() { document.getElementById('auth-modal').classList.add('hidden'); }

            switchAuthTab(type) {
                this.authTab = type;
                const form = document.getElementById('auth-form');
                const registerHelp = document.getElementById('auth-register-help');
                const subtitle = document.getElementById('auth-subtitle');
                const isRegister = type === 'register';
                form.classList.toggle('hidden', isRegister);
                registerHelp.classList.toggle('hidden', !isRegister);
                subtitle.textContent = isRegister
                    ? 'Tạo tài khoản miễn phí bằng Google hoặc Facebook.'
                    : 'Đăng nhập bằng Google, Facebook hoặc email và mật khẩu.';
                document.getElementById('facebook-signin-label').textContent = isRegister
                    ? 'Đăng ký bằng Facebook'
                    : 'Tiếp tục với Facebook';

                if (type === 'login') {
                    document.getElementById('auth-tab-login').className = "text-lg font-black text-duo-blue border-b-2 border-duo-blue pb-1";
                    document.getElementById('auth-tab-register').className = "text-lg font-black text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 pb-1";
                } else {
                    document.getElementById('auth-tab-register').className = "text-lg font-black text-duo-blue border-b-2 border-duo-blue pb-1";
                    document.getElementById('auth-tab-login').className = "text-lg font-black text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 pb-1";
                }
                this.renderGoogleButton();
            }

            async handleAuthSubmit(e) {
                e.preventDefault();
                try {
                    const response = await fetch('/api/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            username: document.getElementById('auth-email-input').value.trim(),
                            password: document.getElementById('auth-pass-input').value
                        })
                    });
                    const data = await response.json();
                    if (!response.ok || !data.success) {
                        throw new Error(data.message || 'Email hoặc mật khẩu không chính xác.');
                    }
                    await this.setAuthenticatedUser(data.user);
                    this.closeAuthModal();
                    this.showAuthMessage('Đăng nhập thành công.', true);
                } catch (error) {
                    this.showAuthMessage(error.message || 'Không thể đăng nhập. Vui lòng thử lại.', false);
                }
            }

            openSettingsModal() {
                document.getElementById('settings-modal').classList.remove('hidden');
                document.getElementById('settings-name-input').value = this.user.name;

                const grid = document.getElementById('avatar-picker-grid');
                grid.innerHTML = AVATARS.map(av => `
                    <button data-action-event="click" data-action="selectAvatar" data-action-value="${av}" class="p-2 rounded-xl text-2xl hover:bg-black/5 dark:hover:bg-white/5 border ${this.user.avatar === av ? 'border-duo-blue bg-duo-blue/10' : 'border-transparent'}">
                        ${av}
                    </button>
                `).join('');
            }

            closeSettingsModal() { document.getElementById('settings-modal').classList.add('hidden'); }

            selectAvatar(av) {
                this.user.avatar = av;
                this.openSettingsModal();
            }

            saveSettings() {
                this.user.name = document.getElementById('settings-name-input').value.trim().slice(0, 80);
                this.saveState();
                this.updateHeaderUser();
                this.renderAuthButton();
                this.closeSettingsModal();
            }

            async logout() {
                try {
                    clearTimeout(this.stateSyncTimer);
                    await this.syncRemoteState();
                    const response = await fetch('/api/logout', { method: 'POST' });
                    if (!response.ok) throw new Error('Không thể đăng xuất. Vui lòng thử lại.');
                    this.user.loggedIn = false;
                    this.user.name = '';
                    this.user.email = '';
                    sessionStorage.setItem('skipFacebookAutoLogin', 'true');
                    this.saveState();
                    this.renderAuthButton();
                    this.updateHeaderUser();
                    this.closeSettingsModal();
                } catch (error) {
                    alert(error.message || 'Không thể đăng xuất. Vui lòng thử lại.');
                }
            }

            openAddWordModal() {
                this.editingVocabId = null;
                document.getElementById('word-edit-form').reset();
                document.getElementById('word-modal-title').textContent = 'Thêm Từ Mới Vào Kho';
                document.getElementById('word-modal-submit').textContent = 'Lưu Từ';
                document.getElementById('add-topic-input').value = 'AUTO';
                document.getElementById('add-set-input').value = '';
                document.getElementById('add-pos-input').querySelectorAll('[data-custom-pos]').forEach(option => option.remove());
                document.getElementById('add-modal').classList.remove('hidden');
                document.getElementById('add-word-input').focus();
            }

            openEditWordModal(id) {
                const vocab = this.vocabs.find(item => item.id === id);
                if (!vocab) return;

                this.editingVocabId = id;
                document.getElementById('add-word-input').value = vocab.word || '';
                document.getElementById('add-ipa-input').value = vocab.ipa || '';
                document.getElementById('add-meaning-input').value = vocab.meaning || '';
                document.getElementById('add-example-input').value = vocab.example || '';
                document.getElementById('add-set-input').value = vocab.set || 'Mặc định';

                const posSelect = document.getElementById('add-pos-input');
                posSelect.querySelectorAll('[data-custom-pos]').forEach(option => option.remove());
                const pos = vocab.pos || 'noun';
                if (![...posSelect.options].some(option => option.value === pos)) {
                    posSelect.add(new Option(pos, pos));
                    posSelect.lastElementChild.dataset.customPos = 'true';
                }
                posSelect.value = pos;

                const topicSelect = document.getElementById('add-topic-input');
                topicSelect.value = VOCAB_TOPIC_LABELS.includes(vocab.topic) ? vocab.topic : 'AUTO';
                document.getElementById('word-modal-title').textContent = 'Chỉnh Sửa Từ Vựng';
                document.getElementById('word-modal-submit').textContent = 'Lưu Thay Đổi';
                document.getElementById('add-modal').classList.remove('hidden');
                document.getElementById('add-word-input').focus();
            }

            closeAddModal() {
                document.getElementById('add-modal').classList.add('hidden');
                this.editingVocabId = null;
            }

            getVocabularySets() {
                return Array.from(new Set([
                    ...this.vocabSets,
                    ...this.vocabs.map(v => v.set || 'Mặc định')
                ].map(set => set.trim()).filter(Boolean)));
            }

            openCreateSetModal() {
                document.getElementById('new-set-name').value = '';
                document.getElementById('create-set-message').classList.add('hidden');
                document.getElementById('create-set-modal').classList.remove('hidden');
                document.getElementById('new-set-name').focus();
            }

            closeCreateSetModal() {
                document.getElementById('create-set-modal').classList.add('hidden');
            }

            createVocabularySet(event) {
                event.preventDefault();
                const input = document.getElementById('new-set-name');
                const name = input.value.trim();
                const message = document.getElementById('create-set-message');
                if (!name) {
                    message.textContent = 'Vui lòng nhập tên bộ từ.';
                    message.className = 'rounded-xl px-3 py-2 text-xs font-semibold bg-duo-red/10 text-duo-red';
                    return;
                }

                const existing = this.getVocabularySets().find(set => set.toLocaleLowerCase() === name.toLocaleLowerCase());
                if (existing) {
                    message.textContent = `Bộ "${existing}" đã tồn tại.`;
                    message.className = 'rounded-xl px-3 py-2 text-xs font-semibold bg-duo-red/10 text-duo-red';
                    return;
                }

                this.vocabSets.push(name);
                this.saveState();
                this.renderVocabTable();
                const vocabFilter = document.getElementById('vocab-set-filter');
                vocabFilter.value = name;
                this.renderVocabTable();
                document.getElementById('add-set-input').value = name;

                const flashcardSelect = document.getElementById('flashcard-set-select');
                if (this.currentTab === 'flashcard') {
                    this.initFlashcards();
                    flashcardSelect.value = name;
                    this.renderCurrentCard();
                }
                this.closeCreateSetModal();
            }

            saveNewWord(e) {
                e.preventDefault();
                const word = document.getElementById('add-word-input').value.trim();
                const ipa = document.getElementById('add-ipa-input').value.trim();
                const pos = document.getElementById('add-pos-input').value;
                const meaning = document.getElementById('add-meaning-input').value.trim();
                const example = document.getElementById('add-example-input').value.trim();
                const set = document.getElementById('add-set-input').value.trim() || 'Mặc định';
                const selectedTopic = document.getElementById('add-topic-input').value;
                if (!this.vocabSets.some(existing => existing.toLocaleLowerCase() === set.toLocaleLowerCase())) {
                    this.vocabSets.push(set);
                }

                const editableFields = {
                    word, ipa, pos, meaning, example, set,
                    topic: selectedTopic === 'AUTO' ? '' : selectedTopic
                };
                if (this.editingVocabId) {
                    const index = this.vocabs.findIndex(vocab => vocab.id === this.editingVocabId);
                    if (index === -1) {
                        this.closeAddModal();
                        alert('Không tìm thấy từ vựng cần chỉnh sửa. Hãy tải lại kho từ và thử lại.');
                        return;
                    }
                    this.vocabs[index] = normalizeVocabularyFields({
                        ...this.vocabs[index],
                        ...editableFields
                    });
                } else {
                    this.vocabs.push(normalizeVocabularyFields({
                        id: Date.now().toString(),
                        ...editableFields,
                        srsStage: 'new',
                        interval: 0,
                        easeFactor: 2.5,
                        rep: 0,
                        nextReview: Date.now()
                    }));
                }

                this.saveState();
                this.closeAddModal();
                this.renderVocabTable();
                if (this.currentTab === 'flashcard') this.initFlashcards();
            }
        }

        let app;
        window.onload = function() {
            app = new VocabMindApp();
            app.init();
        };
    