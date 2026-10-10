/**
 * SCORM 1.2 API Wrapper
 * Tự động tìm kiếm LMS API trong window hoặc window.parent/window.top
 * Hỗ trợ fallback offline (localStorage) khi chạy trực tiếp trên web không có LMS.
 */
class ScormBridge {
    constructor() {
        this.api = this.findLMSAPI(window);
        this.isInitialized = false;
        this.score = 0;
        this.maxScore = 100;
        this.status = "incomplete";
    }

    findLMSAPI(win) {
        let findAttempts = 0;
        const maxAttempts = 10;
        while (win && !win.API && win.parent && win.parent !== win && findAttempts < maxAttempts) {
            findAttempts++;
            win = win.parent;
        }
        return win ? win.API : null;
    }

    init() {
        if (this.api) {
            try {
                const res = this.api.LMSInitialize("");
                this.isInitialized = (res === "true" || res === true);
                console.log("[SCORM] Khởi tạo LMS thành công:", this.isInitialized);
            } catch (e) {
                console.warn("[SCORM] Lỗi khi LMSInitialize:", e);
            }
        } else {
            console.log("[SCORM] Chạy ở chế độ Độc lập (Không có LMS). Dùng LocalStorage fallback.");
            this.isInitialized = true;
        }
    }

    setScore(score, maxScore = 100) {
        this.score = score;
        this.maxScore = maxScore;
        const normalized = Math.min(100, Math.max(0, Math.round((score / maxScore) * 100)));

        if (this.api && this.isInitialized) {
            this.api.LMSSetValue("cmi.core.score.raw", normalized.toString());
            this.api.LMSSetValue("cmi.core.score.min", "0");
            this.api.LMSSetValue("cmi.core.score.max", "100");
            this.commit();
        } else {
            localStorage.setItem("elearning_score", normalized.toString());
        }
    }

    setStatus(status) {
        // 'passed', 'completed', 'failed', 'incomplete'
        this.status = status;
        if (this.api && this.isInitialized) {
            this.api.LMSSetValue("cmi.core.lesson_status", status);
            this.commit();
        } else {
            localStorage.setItem("elearning_status", status);
        }
    }

    commit() {
        if (this.api && this.isInitialized) {
            this.api.LMSCommit("");
        }
    }

    finish() {
        if (this.api && this.isInitialized) {
            this.api.LMSFinish("");
            this.isInitialized = false;
        }
    }
}

window.scormBridge = new ScormBridge();
