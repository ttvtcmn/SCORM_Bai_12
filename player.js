const DEFAULT_FALLBACK_LESSON = {
    title: "Vật Lý K-12: Khái Niệm Lực & Quán Tính",
    slides: [
        {
            slide_number: 1,
            title: "1. Khái Niệm Về Lực Trong Đời Sống",
            content: "Lực là tác dụng đẩy, kéo của vật này lên vật khác.\nĐơn vị đo của lực trong hệ SI là Niutơn (N).\nLực là đại lượng vectơ có phương, chiều và độ lớn: $$\\vec{F} = m \\cdot \\vec{a}$$",
            narration: "Chào các em. Trong bài học này, chúng ta cùng tìm hiểu về Lực và Quán tính.",
            interaction: null
        },
        {
            slide_number: 2,
            title: "2. Định Luật I Newton & Quán Tính",
            content: "Nếu một vật không chịu tác dụng của lực nào hoặc chịu tác dụng của các lực cân bằng:\n- Vật đang đứng yên sẽ tiếp tục đứng yên.\n- Vật đang chuyển động sẽ tiếp tục chuyển động thẳng đều.",
            narration: "Quán tính là tính chất của mọi vật có xu hướng bảo toàn vận tốc của nó.",
            interaction: null
        },
        {
            slide_number: 3,
            title: "Câu Hỏi 1: Luyện Tập Hiểu Bài",
            content: "Đơn vị đo chuẩn của lực trong hệ đo lường quốc tế (SI) là gì?",
            narration: "Bây giờ các em hãy chọn đáp án đúng nhất trên màn hình nhé.",
            interaction: {
                type: "single_choice",
                data: {
                    question: "Đơn vị đo chuẩn của lực trong hệ SI là gì?",
                    options: ["Niutơn (N)", "Kilôgam (kg)", "Mét trên giây (m/s)", "Jun (J)"],
                    correct_index: 0,
                    explanation: "Đơn vị chuẩn của lực là Niutơn (N)."
                }
            }
        }
    ]
};

class InteractivePlayer {
    constructor() {
        this.data = null;
        this.currentSlideIndex = 0;
        this.totalScore = 0;
        this.maxScore = 100;
        this.audioElement = new Audio();
        this.isPlaying = false;
        this.isAutoPlay = false;
        this.autoPlayTimer = null;
        
        this.dom = {
            title: document.getElementById('lesson-title'),
            score: document.getElementById('score-value'),
            progressBar: document.getElementById('progress-bar'),
            stage: document.getElementById('player-stage'),
            btnPrev: document.getElementById('btn-prev'),
            btnNext: document.getElementById('btn-next'),
            btnPlay: document.getElementById('btn-play'),
            btnAutoPlay: document.getElementById('btn-auto-play'),
            aiModal: document.getElementById('ai-tutor-modal'),
            aiResponse: document.getElementById('ai-response-text'),
            aiInput: document.getElementById('ai-question-input')
        };
    }

    async init() {
        window.scormBridge.init();
        
        // 1. Thử nạp từ API dự án hiện tại của máy chủ với cache-buster
        try {
            const cacheBuster = `t=${Date.now()}`;
            const res = await fetch(`api/current-project?${cacheBuster}`, { cache: 'no-store' });
            if (res.ok) {
                const json = await res.json();
                if (json && json.success && json.project && json.project.slides && json.project.slides.length > 0) {
                    this.data = json.project;
                }
            }
        } catch (e) {
            // Có thể chạy offline file:/// hoặc gói SCORM tĩnh độc lập
        }

        // 2. Thử nạp từ data.json kèm cache-buster nếu chưa có dữ liệu
        if (!this.data || !this.data.slides || this.data.slides.length === 0) {
            try {
                const cacheBuster = `t=${Date.now()}`;
                const res = await fetch(`data.json?${cacheBuster}`, { cache: 'no-store' });
                if (res.ok) {
                    const json = await res.json();
                    if (json && json.slides && json.slides.length > 0) {
                        this.data = json;
                    }
                }
            } catch (e) {
                console.warn("Không tải được data.json qua mạng:", e);
            }
        }

        // 3. Kiểm tra localStorage (preview_project do Studio vừa lưu):
        // Nếu localStorage có dữ liệu và mới hơn hoặc bằng dữ liệu hiện tại, ưu tiên dùng localStorage
        try {
            const previewData = localStorage.getItem('preview_project');
            if (previewData) {
                const parsed = JSON.parse(previewData);
                if (parsed && parsed.slides && parsed.slides.length > 0) {
                    if (!this.data || (parsed.updatedAt && (!this.data.updatedAt || parsed.updatedAt >= this.data.updatedAt))) {
                        this.data = parsed;
                    }
                }
            }
        } catch (e) {
            console.warn("Lỗi đọc preview_project từ localStorage:", e);
        }

        // 4. Dự phòng dữ liệu offline nhúng sẵn
        if (!this.data || !this.data.slides || this.data.slides.length === 0) {
            this.data = window.FALLBACK_DATA || DEFAULT_FALLBACK_LESSON;
        }

        this.dom.title.textContent = this.data.title || "Bài giảng E-Learning";
        this.project = this.data;
        this.setupEventListeners();
        this.renderSlide(0);
    }

    setupEventListeners() {
        this.dom.btnPrev.addEventListener('click', () => this.prevSlide());
        this.dom.btnNext.addEventListener('click', () => this.nextSlide());
        this.dom.btnPlay.addEventListener('click', () => this.toggleAudio());

        if (this.dom.btnAutoPlay) {
            this.dom.btnAutoPlay.addEventListener('click', () => this.toggleAutoPlay());
        }

        this.audioElement.addEventListener('ended', () => {
            this.isPlaying = false;
            this.dom.btnPlay.textContent = '▶';
            if (this.isAutoPlay) {
                this.scheduleNextSlide(1500);
            }
        });

        // Đóng mở AI Tutor
        document.getElementById('btn-ai-tutor').addEventListener('click', () => {
            const isVisible = this.dom.aiModal.style.display === 'flex';
            this.dom.aiModal.style.display = isVisible ? 'none' : 'flex';
        });

        document.getElementById('btn-ai-close').addEventListener('click', () => {
            this.dom.aiModal.style.display = 'none';
        });

        document.getElementById('btn-ai-send').addEventListener('click', () => this.handleAskAITutor());
        this.dom.aiInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleAskAITutor();
        });
    }

    toggleAutoPlay() {
        this.isAutoPlay = !this.isAutoPlay;
        if (this.dom.btnAutoPlay) {
            if (this.isAutoPlay) {
                this.dom.btnAutoPlay.classList.add('active');
                this.dom.btnAutoPlay.innerHTML = '⏸ Tự chạy: BẬT';
                this.scheduleNextSlide(6000);
            } else {
                this.dom.btnAutoPlay.classList.remove('active');
                this.dom.btnAutoPlay.innerHTML = '⏩ Tự chạy: Tắt';
                this.clearAutoPlayTimer();
            }
        }
    }

    scheduleNextSlide(delayMs = 5000) {
        this.clearAutoPlayTimer();
        if (!this.isAutoPlay) return;
        this.autoPlayTimer = setTimeout(() => {
            if (this.currentSlideIndex < this.data.slides.length - 1) {
                this.nextSlide();
            }
        }, delayMs);
    }

    clearAutoPlayTimer() {
        if (this.autoPlayTimer) {
            clearTimeout(this.autoPlayTimer);
            this.autoPlayTimer = null;
        }
    }

    renderSlide(index) {
        if (!this.data.slides || index < 0 || index >= this.data.slides.length) return;
        this.clearAutoPlayTimer();
        this.currentSlideIndex = index;

        const slide = this.data.slides[index];
        const total = this.data.slides.length;

        // Cập nhật Progress Bar
        const percent = ((index + 1) / total) * 100;
        this.dom.progressBar.style.width = `${percent}%`;

        // Cập nhật Nút Điều hướng
        this.dom.btnPrev.disabled = (index === 0);
        this.dom.btnNext.textContent = (index === total - 1) ? 'Hoàn thành ✔' : 'Tiếp theo ▶';

        // Xử lý hình ảnh slide (hỗ trợ cả slide.image và slide.images)
        let mediaHtml = '';
        const imgUrl = slide.image || (slide.images && slide.images.length > 0 ? slide.images[0] : null);
        if (imgUrl) {
            mediaHtml = `
                <div class="slide-media-wrap">
                    <img src="${imgUrl}" class="slide-media" alt="${slide.title || 'Hình ảnh slide'}">
                </div>
            `;
        }

        // Xử lý hiển thị PowerPoint nguyên bản 100%
        const pptImg = slide.slide_image || slide.image;
        const hasPptImage = pptImg && (typeof pptImg === 'string') && (
            pptImg.startsWith('data:image') || 
            pptImg.includes('.png') || 
            pptImg.includes('.jpg') || 
            pptImg.includes('.jpeg') || 
            pptImg.startsWith('images/')
        );
        const hasInteraction = slide.interaction && slide.interaction.type && slide.interaction.type !== 'none';

        if (hasPptImage) {
            this.dom.stage.innerHTML = `
                <div class="slide-screen-container">
                    <div class="slide-ppt-wrapper">
                        <img src="${pptImg}" class="slide-ppt-image" alt="${slide.title || 'Slide PowerPoint'}">
                    </div>
                    ${hasInteraction ? `
                        <div class="interactive-stage-card">
                            <div class="interactive-header-pill">🎯 BÀI TẬP TƯƠNG TÁC</div>
                            ${slide.title ? `<h3 style="margin: 0 0 8px 0; font-size: 1.2rem; color: #1e1b4b;">${slide.title}</h3>` : ''}
                            ${slide.content ? `<div style="margin-bottom: 12px; color: #475569; font-size: 0.95rem;">${slide.content}</div>` : ''}
                            <div id="interactive-container" class="interactive-overlay"></div>
                        </div>
                    ` : ''}
                </div>
            `;
        } else {
            // Render Stage với dạng thẻ lý thuyết
            this.dom.stage.innerHTML = `
                <div class="slide-content-card">
                    <h2 class="slide-title">${slide.title || `Phần ${index + 1}`}</h2>
                    <div class="slide-body">${slide.content || ''}</div>
                    ${mediaHtml}
                    ${hasInteraction ? '<div id="interactive-container" class="interactive-overlay"></div>' : ''}
                </div>
            `;
        }

        // Render Tương tác (nếu có)
        if (hasInteraction) {
            this.renderInteraction(slide.interaction);
        }

        // Cập nhật trạng thái hiển thị của nút Trợ lý AI Tutor theo cài đặt của bài giảng
        const project = this.data || this.project || {};
        let isAiEnabled = true;
        if (project && project.enable_ai_tutor !== undefined && project.enable_ai_tutor !== null) {
            isAiEnabled = (project.enable_ai_tutor === true || project.enable_ai_tutor === 'true' || project.enable_ai_tutor === 1);
        } else if (slide && slide.enable_ai_tutor !== undefined && slide.enable_ai_tutor !== null) {
            isAiEnabled = (slide.enable_ai_tutor === true || slide.enable_ai_tutor === 'true' || slide.enable_ai_tutor === 1);
        }

        const btnAiTutor = document.getElementById('btn-ai-tutor');
        if (btnAiTutor) {
            btnAiTutor.style.display = isAiEnabled ? 'flex' : 'none';
        }
        if (!isAiEnabled && this.dom.aiModal) {
            this.dom.aiModal.style.display = 'none';
        }

        // Tự động render công thức toán học KaTeX trên toàn bộ slide
        this.renderMathInElement(this.dom.stage);

        // Tự động phát âm thanh nếu có file âm thanh
        if (slide.audio) {
            this.audioElement.src = slide.audio;
            this.audioElement.play().then(() => {
                this.isPlaying = true;
                this.dom.btnPlay.textContent = '⏸';
            }).catch(() => {
                this.isPlaying = false;
                this.dom.btnPlay.textContent = '▶';
                if (this.isAutoPlay) {
                    this.scheduleNextSlide(slide.interaction ? 10000 : 6000);
                }
            });
        } else {
            this.audioElement.pause();
            this.isPlaying = false;
            this.dom.btnPlay.textContent = '▶';
            if (this.isAutoPlay) {
                this.scheduleNextSlide(slide.interaction ? 10000 : 6000);
            }
        }

        // Báo cáo tiến trình về SCORM
        if (index === total - 1) {
            window.scormBridge.setStatus('completed');
        } else {
            window.scormBridge.setStatus('incomplete');
        }
    }

    renderInteraction(interaction) {
        const container = document.getElementById('interactive-container');
        if (!container || !interaction) return;

        const type = interaction.type;
        const data = interaction.data || {};

        if (type === 'quiz' || type === 'single_choice') {
            this.renderQuiz(container, data);
        } else if (type === 'multi_choice') {
            if (typeof this.renderMultiChoice === 'function') {
                this.renderMultiChoice(container, data);
            } else {
                console.warn("renderMultiChoice chưa sẵn sàng trên InteractivePlayer");
            }
        } else if (type === 'true_false') {
            if (typeof this.renderTrueFalse === 'function') {
                this.renderTrueFalse(container, data);
            } else {
                console.warn("renderTrueFalse chưa sẵn sàng trên InteractivePlayer");
            }
        } else if (type === 'ordering') {
            if (typeof this.renderOrdering === 'function') {
                this.renderOrdering(container, data);
            } else {
                console.warn("renderOrdering chưa sẵn sàng trên InteractivePlayer");
            }
        } else if (type === 'drag_drop') {
            if (typeof this.renderDragDrop === 'function') {
                this.renderDragDrop(container, data);
            } else {
                console.warn("renderDragDrop chưa sẵn sàng trên InteractivePlayer");
            }
        } else if (type === 'flashcard') {
            this.renderFlashcard(container, data);
        } else if (type === 'lucky_wheel') {
            this.renderLuckyWheel(container, data);
        } else if (type === 'matching') {
            if (typeof this.renderMatching === 'function') {
                this.renderMatching(container, data);
            } else {
                console.warn("renderMatching chưa sẵn sàng trên InteractivePlayer");
            }
        } else if (type === 'crossword' && typeof this.renderCrossword === 'function') {
            this.renderCrossword(container, data);
        }

        // Chèn ảnh minh họa bài tập tương tác (nếu có) với kích thước thực và góc xoay
        const interImg = (this.currentSlide && this.currentSlide.interaction_image) || (interaction && interaction.image);
        if (interImg && interImg.url && container) {
            const scale = (interImg.scale !== undefined) ? interImg.scale : 1.0;
            const rot = (interImg.rotate !== undefined) ? interImg.rotate : 0;
            const scalePct = Math.round(scale * 100);
            const isZoomed = scale > 1.0;

            const frameStyle = isZoomed
                ? 'display: inline-flex; align-items: center; justify-content: center; width: 100%; max-width: 100%; max-height: 420px; overflow: hidden; border-radius: 10px; border: 1.5px solid #cbd5e1; background: #ffffff; box-shadow: 0 4px 14px rgba(0,0,0,0.08); position: relative;'
                : `display: inline-block; width: ${scalePct}%; max-width: 100%; overflow: hidden; border-radius: 10px; border: 1.5px solid #cbd5e1; background: #ffffff; box-shadow: 0 4px 14px rgba(0,0,0,0.08); position: relative; line-height: 0;`;

            const imgStyle = isZoomed
                ? `display: block; width: ${scalePct}%; max-width: none; height: auto; border-radius: 6px;`
                : 'display: block; width: 100%; height: auto; border-radius: 6px;';

            const imgWrapper = document.createElement('div');
            imgWrapper.className = 'interactive-stage-image-box';
            imgWrapper.style.cssText = 'text-align: center; margin: 12px auto; max-width: 100%;';
            imgWrapper.innerHTML = `
                <div class="interactive-image-frame" style="${frameStyle}">
                    <div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; transform: rotate(${rot}deg); transition: transform 0.2s ease;">
                        <img src="${interImg.url}" alt="Minh họa bài tập" style="${imgStyle}">
                    </div>
                </div>
            `;
            container.insertBefore(imgWrapper, container.firstChild);
        }

        // Tự động render công thức toán học nếu có KaTeX
        if (typeof this.renderMathInElement === 'function') {
            this.renderMathInElement(this.dom.stage);
        }
    }

    renderQuiz(container, quiz) {
        let optionsHtml = '';
        quiz.options.forEach((opt, idx) => {
            optionsHtml += `<button class="quiz-btn" onclick="player.checkQuiz(${idx}, ${quiz.correct_index}, '${escape(quiz.explanation || '')}')">${String.fromCharCode(65 + idx)}. ${opt}</button>`;
        });

        container.innerHTML = `
            <div class="quiz-box">
                <div class="quiz-question">❓ ${quiz.question}</div>
                <div class="quiz-options">${optionsHtml}</div>
                <div id="quiz-feedback" style="margin-top: 12px; font-size: 0.95rem; font-weight: 600;"></div>
            </div>
        `;
        this.renderMathInElement(container);
    }

    checkQuiz(chosenIndex, correctIndex, explanation) {
        const feedback = document.getElementById('quiz-feedback');
        const buttons = document.querySelectorAll('.quiz-btn');
        buttons.forEach(b => b.disabled = true);

        if (chosenIndex === correctIndex) {
            buttons[chosenIndex].classList.add('correct');
            feedback.style.color = '#10b981';
            feedback.innerHTML = `🎉 Chính xác! +20 Điểm. ${unescape(explanation)}`;
            this.addScore(20);
        } else {
            buttons[chosenIndex].classList.add('wrong');
            buttons[correctIndex].classList.add('correct');
            feedback.style.color = '#ef4444';
            feedback.innerHTML = `❌ Chưa chính xác. ${unescape(explanation)}`;
        }
        this.renderMathInElement(feedback);

        if (this.isAutoPlay) {
            this.scheduleNextSlide(2500);
        }
    }

    renderFlashcard(container, card) {
        container.innerHTML = `
            <div class="flashcard-wrapper" onclick="this.querySelector('.flashcard-inner').classList.toggle('flipped')">
                <div class="flashcard-inner">
                    <div class="flashcard-face flashcard-front">
                        <h3>💡 ${card.front}</h3>
                        <p style="margin-top: 10px; font-size: 0.85rem; opacity: 0.9;">(Bấm để lật thẻ xem giải thích)</p>
                    </div>
                    <div class="flashcard-face flashcard-back">
                        <p style="font-size: 1.05rem; line-height: 1.6;">${card.back}</p>
                    </div>
                </div>
            </div>
        `;
        this.renderMathInElement(container);
    }

    renderLuckyWheel(container, data) {
        container.innerHTML = `
            <div class="wheel-container">
                <div style="font-weight: 700; color: #4338ca;">🎡 VÒNG QUAY MAY MẮN</div>
                <canvas id="wheel-canvas" width="220" height="220" class="wheel-canvas"></canvas>
                <button class="btn-nav" id="btn-spin" onclick="player.spinWheel()">Quay ngay!</button>
                <div id="wheel-result" style="font-weight: 600; color: #1e1b4b;"></div>
            </div>
        `;
        this.drawWheel(data.sectors || ["+10đ", "Thử thách", "+30đ", "May mắn"]);
    }

    drawWheel(sectors) {
        const canvas = document.getElementById('wheel-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const numSectors = sectors.length;
        const arc = (2 * Math.PI) / numSectors;
        const colors = ['#4f46e5', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6'];

        ctx.clearRect(0, 0, 220, 220);
        sectors.forEach((sec, i) => {
            ctx.beginPath();
            ctx.fillStyle = colors[i % colors.length];
            ctx.moveTo(110, 110);
            ctx.arc(110, 110, 100, i * arc, (i + 1) * arc);
            ctx.fill();

            // Text
            ctx.save();
            ctx.fillStyle = "white";
            ctx.font = "bold 12px sans-serif";
            ctx.translate(110, 110);
            ctx.rotate(i * arc + arc / 2);
            ctx.textAlign = "right";
            ctx.fillText(sec, 90, 4);
            ctx.restore();
        });
    }

    spinWheel() {
        const canvas = document.getElementById('wheel-canvas');
        const btn = document.getElementById('btn-spin');
        if (!canvas || !btn) return;
        btn.disabled = true;

        const deg = 1440 + Math.floor(Math.random() * 360);
        canvas.style.transition = 'transform 3s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
        canvas.style.transform = `rotate(${deg}deg)`;

        setTimeout(() => {
            document.getElementById('wheel-result').textContent = '🎉 Chúc mừng em đã nhận được phần thưởng may mắn!';
            this.addScore(15);
        }, 3100);
    }

    addScore(points) {
        this.totalScore = Math.min(100, this.totalScore + points);
        this.dom.score.textContent = this.totalScore;
        window.scormBridge.setScore(this.totalScore, this.maxScore);
    }

    toggleAudio() {
        if (this.isPlaying) {
            this.audioElement.pause();
            this.isPlaying = false;
            this.dom.btnPlay.textContent = '▶';
        } else {
            this.audioElement.play().then(() => {
                this.isPlaying = true;
                this.dom.btnPlay.textContent = '⏸';
            });
        }
    }

    nextSlide() {
        if (this.currentSlideIndex < this.data.slides.length - 1) {
            this.renderSlide(this.currentSlideIndex + 1);
        } else {
            alert('🎉 Chúc mừng em đã hoàn thành toàn bộ bài học!');
            window.scormBridge.setStatus('passed');
            window.scormBridge.finish();
        }
    }

    prevSlide() {
        if (this.currentSlideIndex > 0) {
            this.renderSlide(this.currentSlideIndex - 1);
        }
    }

    handleAskAITutor() {
        const query = this.dom.aiInput.value.trim();
        if (!query) return;

        const currentSlide = this.data.slides[this.currentSlideIndex];
        this.dom.aiResponse.innerHTML = '<em>Thầy/Cô AI đang suy nghĩ câu trả lời...</em>';
        this.dom.aiInput.value = '';

        // Tự động phân tích ngữ cảnh slide
        setTimeout(() => {
            const context = currentSlide.title || "bài học";
            this.dom.aiResponse.innerHTML = `<strong>Thầy/Cô AI:</strong> Về câu hỏi <em>"${query}"</em>: Trong bài học <strong>${context}</strong>, kiến thức này giúp em hiểu sâu hơn về bản chất bài học. Em hãy kết hợp nội dung slide và thực hành để nắm vững nhé! Chúc em học tốt!`;
            this.renderMathInElement(this.dom.aiResponse);
        }, 600);
    }

    renderMathInElement(el) {
        const target = el || this.dom.stage || document.body;
        const doRender = () => {
            if (typeof window.renderMathInElement === 'function') {
                try {
                    window.renderMathInElement(target, {
                        delimiters: [
                            {left: '$$', right: '$$', display: true},
                            {left: '$', right: '$', display: false},
                            {left: '\\(', right: '\\)', display: false},
                            {left: '\\[', right: '\\]', display: true}
                        ],
                        throwOnError: false
                    });
                } catch (err) {
                    console.warn("Lỗi render KaTeX:", err);
                }
            }
        };

        if (typeof window.renderMathInElement === 'function') {
            doRender();
        } else {
            setTimeout(doRender, 150);
            setTimeout(doRender, 600);
        }
    }
}

// Đăng ký toàn cục để các script mở rộng (widgets_more.js) có thể kế thừa prototype
window.InteractivePlayer = InteractivePlayer;
if (typeof window.initInteractiveWidgets === 'function') {
    window.initInteractiveWidgets(InteractivePlayer);
}

const player = new InteractivePlayer();
window.player = player;
window.addEventListener('DOMContentLoaded', () => player.init());
