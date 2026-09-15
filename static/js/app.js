/**
 * ==========================================================
 * AI Resume & Portfolio Builder - 프론트엔드 스크립트 (app.js)
 * 마크다운 서식 문서 렌더링 & 뷰 모드 전환 (문서 보기 / 원본 보기)
 * ==========================================================
 */

document.addEventListener("DOMContentLoaded", () => {
    // 1. 주요 DOM 요소 참조
    const form = document.getElementById("resume-form");
    const submitBtn = document.getElementById("submit-btn");
    const errorBox = document.getElementById("error-box");
    const errorMessage = document.getElementById("error-message");

    // 우측 패널 및 상태 제어
    const statusPill = document.getElementById("status-pill");
    const viewTabs = document.getElementById("view-tabs");
    const tabPreview = document.getElementById("tab-preview");
    const tabRaw = document.getElementById("tab-raw");

    const placeholderBox = document.getElementById("placeholder-box");
    const loadingBox = document.getElementById("loading");
    const resultCard = document.getElementById("result-card");
    const renderedContent = document.getElementById("rendered-content");
    const rawContent = document.getElementById("raw-content");

    const copyBtn = document.getElementById("copy-btn");
    const downloadBtn = document.getElementById("download-btn");

    // 현재 생성된 원본 마크다운 텍스트 보관 변수
    let currentMarkdownText = "";

    // 2. 오류 메시지 헬퍼
    function showError(message) {
        errorMessage.textContent = message;
        errorBox.classList.remove("hidden");
    }

    function hideError() {
        errorMessage.textContent = "";
        errorBox.classList.add("hidden");
    }

    // 3. 우측 패널 상태 전환 함수
    function setPanelState(state) {
        placeholderBox.classList.add("hidden");
        loadingBox.classList.add("hidden");
        resultCard.classList.add("hidden");

        statusPill.className = "status-pill";

        if (state === "placeholder") {
            placeholderBox.classList.remove("hidden");
            statusPill.classList.add("ready");
            statusPill.textContent = "대기 중";
            viewTabs.classList.add("hidden");
            copyBtn.disabled = true;
            downloadBtn.disabled = true;
        } else if (state === "loading") {
            loadingBox.classList.remove("hidden");
            statusPill.classList.add("generating");
            statusPill.textContent = "작성 중...";
            viewTabs.classList.add("hidden");
            copyBtn.disabled = true;
            downloadBtn.disabled = true;
        } else if (state === "result") {
            resultCard.classList.remove("hidden");
            statusPill.classList.add("completed");
            statusPill.textContent = "생성 완료";
            viewTabs.classList.remove("hidden");
            copyBtn.disabled = false;
            downloadBtn.disabled = false;
            switchView("preview");
        }
    }

    // 4. 서식 보기(Preview) vs 마크다운 원본(Raw) 전환 함수
    function switchView(mode) {
        if (mode === "preview") {
            tabPreview.classList.add("active");
            tabRaw.classList.remove("active");
            renderedContent.classList.remove("hidden");
            rawContent.classList.add("hidden");
        } else {
            tabRaw.classList.add("active");
            tabPreview.classList.remove("active");
            rawContent.classList.remove("hidden");
            renderedContent.classList.add("hidden");
        }
    }

    tabPreview.addEventListener("click", () => switchView("preview"));
    tabRaw.addEventListener("click", () => switchView("raw"));

    // 5. 마크다운 변환 렌더링 헬퍼 (Marked.js 사용 및 오프라인 폴백 지원)
    function renderMarkdown(mdText) {
        if (window.marked && typeof window.marked.parse === "function") {
            return window.marked.parse(mdText);
        }

        // 오프라인/CDN 차단 시 자체 기본 렌더러 동작
        let html = mdText
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/gim, '<em>$1</em>')
            .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
            .replace(/---/gim, '<hr>')
            .replace(/^\* (.*$)/gim, '<li>$1</li>')
            .replace(/\n$/gim, '<br>');
        return html;
    }

    // 6. 폼 제출 이벤트 처리 (생성 요청)
    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        hideError();

        const name = document.getElementById("name").value.trim();
        const jobTitle = document.getElementById("job-title").value.trim();
        const experience = document.getElementById("experience").value.trim();
        const projects = document.getElementById("projects").value.trim();
        const tone = document.getElementById("tone").value;
        const promptType = document.querySelector('input[name="prompt_type"]:checked')?.value || "B";

        if (!name) {
            showError("이름을 입력해 주세요.");
            document.getElementById("name").focus();
            return;
        }
        if (!jobTitle) {
            showError("지원 직무를 입력해 주세요.");
            document.getElementById("job-title").focus();
            return;
        }
        if (!experience) {
            showError("주요 경력 사항을 입력해 주세요.");
            document.getElementById("experience").focus();
            return;
        }
        if (!projects) {
            showError("수행 프로젝트 내용을 입력해 주세요.");
            document.getElementById("projects").focus();
            return;
        }

        setPanelState("loading");
        submitBtn.disabled = true;
        submitBtn.querySelector(".btn-text").textContent = "AI가 작성하고 있습니다...";

        try {
            const response = await fetch("/generate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: name,
                    job_title: jobTitle,
                    experience: experience,
                    projects: projects,
                    tone: tone,
                    prompt_type: promptType
                })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                const errMsg = data.error || "서버와 통신하는 중 문제가 발생했습니다.";
                showError(errMsg);
                setPanelState("placeholder");
                return;
            }

            // 원본 텍스트 보관
            currentMarkdownText = data.result;

            // 서식 HTML 렌더링 & 원본 프리뷰 채우기
            renderedContent.innerHTML = renderMarkdown(currentMarkdownText);
            rawContent.textContent = currentMarkdownText;

            setPanelState("result");

        } catch (error) {
            console.error("통신 에러:", error);
            showError("서버에 연결할 수 없습니다. Flask 서버가 실행 중인지 확인해 주세요.");
            setPanelState("placeholder");
        } finally {
            submitBtn.disabled = false;
            submitBtn.querySelector(".btn-text").textContent = "이력서 & 포트폴리오 생성하기";
        }
    });

    // 7. 복사 버튼 (서식 기호 없는 온전한 텍스트/마크다운 복사)
    copyBtn.addEventListener("click", async () => {
        if (!currentMarkdownText) return;

        try {
            await navigator.clipboard.writeText(currentMarkdownText);
            const originalHtml = copyBtn.innerHTML;
            copyBtn.innerHTML = "<span>✅</span> 복사 완료!";
            setTimeout(() => {
                copyBtn.innerHTML = originalHtml;
            }, 2000);
        } catch (err) {
            console.error("복사 실패:", err);
            alert("클립보드 복사에 실패했습니다. 내용을 직접 드래그하여 복사해 주세요.");
        }
    });

    // 8. 마크다운 다운로드 버튼
    downloadBtn.addEventListener("click", () => {
        if (!currentMarkdownText) return;

        const name = document.getElementById("name").value.trim() || "지원자";
        const fileName = `${name}_이력서_포트폴리오.md`;

        const blob = new Blob([currentMarkdownText], { type: "text/markdown;charset=utf-8;" });
        const downloadUrl = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);
    });
});
