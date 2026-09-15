/**
 * ==========================================================
 * AI Resume & Portfolio Builder - 프론트엔드 스크립트 (app.js)
 * 버전 보관, A/B 동시 생성 및 좌우 나란히 비교(Split Compare) 지원
 * ==========================================================
 */

document.addEventListener("DOMContentLoaded", () => {
    // 1. 주요 DOM 요소 참조
    const form = document.getElementById("resume-form");
    const submitBtn = document.getElementById("submit-btn");
    const dualGenCheckbox = document.getElementById("dual-generate");
    const errorBox = document.getElementById("error-box");
    const errorMessage = document.getElementById("error-message");

    // 우측 패널 상태 요소
    const statusPill = document.getElementById("status-pill");
    const versionTabsContainer = document.getElementById("version-tabs-container");
    const versionPills = document.getElementById("version-pills");
    const btnCompareView = document.getElementById("btn-compare-view");

    const viewTabs = document.getElementById("view-tabs");
    const tabPreview = document.getElementById("tab-preview");
    const tabRaw = document.getElementById("tab-raw");

    const placeholderBox = document.getElementById("placeholder-box");
    const loadingBox = document.getElementById("loading");
    const loadingTitle = document.getElementById("loading-title");
    const loadingDesc = document.getElementById("loading-desc");

    // 단일 뷰 및 비교 뷰
    const resultCard = document.getElementById("result-card");
    const renderedContent = document.getElementById("rendered-content");
    const rawContent = document.getElementById("raw-content");

    const compareViewCard = document.getElementById("compare-view-card");
    const col1Title = document.getElementById("col1-title");
    const col1Badge = document.getElementById("col1-badge");
    const col1Content = document.getElementById("col1-content");
    const copyCol1Btn = document.getElementById("copy-col1-btn");

    const col2Title = document.getElementById("col2-title");
    const col2Badge = document.getElementById("col2-badge");
    const col2Content = document.getElementById("col2-content");
    const copyCol2Btn = document.getElementById("copy-col2-btn");

    const copyBtn = document.getElementById("copy-btn");
    const downloadBtn = document.getElementById("download-btn");

    // 생성된 버전 기록 보관 배열 [{ id, title, badge, type, time, text, name }]
    let savedVersions = [];
    let currentVersionIndex = -1;
    let isCompareMode = false;

    // 2. 오류 메시지 헬퍼
    function showError(message) {
        errorMessage.textContent = message;
        errorBox.classList.remove("hidden");
    }

    function hideError() {
        errorMessage.textContent = "";
        errorBox.classList.add("hidden");
    }

    // 3. 마크다운 변환 렌더링 함수
    function renderMarkdown(mdText) {
        if (window.marked && typeof window.marked.parse === "function") {
            return window.marked.parse(mdText);
        }

        return mdText
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/gim, '<em>$1</em>')
            .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
            .replace(/---/gim, '<hr>')
            .replace(/^\* (.*$)/gim, '<li>$1</li>')
            .replace(/\n$/gim, '<br>');
    }

    // 4. 우측 패널 모드 제어 (placeholder | loading | single | compare)
    function setPanelDisplayMode(mode) {
        placeholderBox.classList.add("hidden");
        loadingBox.classList.add("hidden");
        resultCard.classList.add("hidden");
        compareViewCard.classList.add("hidden");

        statusPill.className = "status-pill";

        if (mode === "placeholder") {
            placeholderBox.classList.remove("hidden");
            statusPill.classList.add("ready");
            statusPill.textContent = "대기 중";
            versionTabsContainer.classList.add("hidden");
            viewTabs.classList.add("hidden");
            copyBtn.disabled = true;
            downloadBtn.disabled = true;
        } else if (mode === "loading") {
            loadingBox.classList.remove("hidden");
            statusPill.classList.add("generating");
            statusPill.textContent = "작성 중...";
            versionTabsContainer.classList.add("hidden");
            viewTabs.classList.add("hidden");
            copyBtn.disabled = true;
            downloadBtn.disabled = true;
        } else if (mode === "single") {
            resultCard.classList.remove("hidden");
            statusPill.classList.add("completed");
            statusPill.textContent = "생성 완료";
            versionTabsContainer.classList.remove("hidden");
            viewTabs.classList.remove("hidden");
            copyBtn.disabled = false;
            downloadBtn.disabled = false;
            btnCompareView.classList.remove("active");
            isCompareMode = false;
        } else if (mode === "compare") {
            compareViewCard.classList.remove("hidden");
            statusPill.classList.add("completed");
            statusPill.textContent = "비교 모드";
            versionTabsContainer.classList.remove("hidden");
            viewTabs.classList.add("hidden"); // 비교 모드에선 각각 복사 지원
            copyBtn.disabled = true;
            downloadBtn.disabled = true;
            btnCompareView.classList.add("active");
            isCompareMode = true;
        }
    }

    // 5. 단일 뷰 내 서식 문서 vs 마크다운 탭 전환
    function switchSingleView(type) {
        if (type === "preview") {
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

    tabPreview.addEventListener("click", () => switchSingleView("preview"));
    tabRaw.addEventListener("click", () => switchSingleView("raw"));

    // 6. 버전 탭 렌더링 및 선택 로직
    function updateVersionUI() {
        if (savedVersions.length === 0) {
            setPanelDisplayMode("placeholder");
            return;
        }

        versionPills.innerHTML = "";
        savedVersions.forEach((ver, idx) => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = `version-pill ${idx === currentVersionIndex && !isCompareMode ? "active" : ""}`;
            btn.textContent = `${ver.title} (${ver.badge})`;
            btn.addEventListener("click", () => {
                selectVersion(idx);
            });
            versionPills.appendChild(btn);
        });

        // 2개 이상의 버전이 있을 때만 [나란히 비교] 버튼 활성화
        if (savedVersions.length >= 2) {
            btnCompareView.classList.remove("hidden");
        } else {
            btnCompareView.classList.add("hidden");
        }
    }

    // 특정 버전 보기 선택
    function selectVersion(index) {
        if (index < 0 || index >= savedVersions.length) return;
        currentVersionIndex = index;
        const ver = savedVersions[index];

        renderedContent.innerHTML = renderMarkdown(ver.text);
        rawContent.textContent = ver.text;

        setPanelDisplayMode("single");
        switchSingleView("preview");
        updateVersionUI();
    }

    // 좌우 나란히 비교 뷰 실행
    function openComparisonView() {
        if (savedVersions.length < 2) return;

        // 가장 최근 2개의 버전을 비교 (예: 버전 A vs 버전 B)
        const ver1 = savedVersions[savedVersions.length - 2];
        const ver2 = savedVersions[savedVersions.length - 1];

        col1Title.textContent = ver1.title;
        col1Badge.textContent = ver1.badge;
        col1Badge.className = `mode-badge ${ver1.type === "A" ? "standard" : "expert"}`;
        col1Content.innerHTML = renderMarkdown(ver1.text);

        col2Title.textContent = ver2.title;
        col2Badge.textContent = ver2.badge;
        col2Badge.className = `mode-badge ${ver2.type === "A" ? "standard" : "expert"}`;
        col2Content.innerHTML = renderMarkdown(ver2.text);

        setPanelDisplayMode("compare");
        updateVersionUI();
    }

    btnCompareView.addEventListener("click", () => {
        if (isCompareMode) {
            // 비교 모드에서 다시 최신 단일 뷰로 복귀
            selectVersion(savedVersions.length - 1);
        } else {
            openComparisonView();
        }
    });

    // 7. API 호출 헬퍼
    async function requestGenerate(payload) {
        const response = await fetch("/generate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data.error || "서버 통신 오류가 발생했습니다.");
        }
        return data.result;
    }

    // 8. 폼 제출 이벤트 (생성 실행)
    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        hideError();

        const name = document.getElementById("name").value.trim();
        const jobTitle = document.getElementById("job-title").value.trim();
        const experience = document.getElementById("experience").value.trim();
        const projects = document.getElementById("projects").value.trim();
        const tone = document.getElementById("tone").value;
        const promptType = document.querySelector('input[name="prompt_type"]:checked')?.value || "B";
        const isDual = dualGenCheckbox.checked;

        if (!name || !jobTitle || !experience || !projects) {
            showError("모든 필수 입력값(*)을 입력해 주세요.");
            return;
        }

        setPanelDisplayMode("loading");
        submitBtn.disabled = true;

        const basePayload = {
            name: name,
            job_title: jobTitle,
            experience: experience,
            projects: projects,
            tone: tone
        };

        try {
            if (isDual) {
                // A/B 두 버전 동시 생성
                loadingTitle.textContent = "Prompt A & B 두 버전을 동시 생성하고 있습니다";
                loadingDesc.textContent = "표준형과 STAR 전문가형 이력서를 동시에 완성하여 나란히 비교창을 띄웁니다...";
                submitBtn.querySelector(".btn-text").textContent = "두 버전을 동시 작성 중...";

                const [resultA, resultB] = await Promise.all([
                    requestGenerate({ ...basePayload, prompt_type: "A" }),
                    requestGenerate({ ...basePayload, prompt_type: "B" })
                ]);

                // 저장소에 둘 다 추가
                savedVersions.push({
                    id: savedVersions.length + 1,
                    title: `버전 ${savedVersions.length + 1}`,
                    badge: "표준형 A",
                    type: "A",
                    text: resultA,
                    name: name
                });

                savedVersions.push({
                    id: savedVersions.length + 1,
                    title: `버전 ${savedVersions.length + 1}`,
                    badge: "STAR 전문가형 B",
                    type: "B",
                    text: resultB,
                    name: name
                });

                // 바로 좌우 나란히 비교 뷰 띄우기
                openComparisonView();

            } else {
                // 단일 생성
                loadingTitle.textContent = "Gemini AI가 이력서를 작성하고 있습니다";
                loadingDesc.textContent = "지원 직무에 최적화된 역량 키워드를 분석하여 문장을 다듬는 중입니다...";
                submitBtn.querySelector(".btn-text").textContent = "AI가 작성하고 있습니다...";

                const result = await requestGenerate({ ...basePayload, prompt_type: promptType });

                const badgeText = promptType === "A" ? "표준형 A" : "STAR 전문가형 B";
                savedVersions.push({
                    id: savedVersions.length + 1,
                    title: `버전 ${savedVersions.length + 1}`,
                    badge: badgeText,
                    type: promptType,
                    text: result,
                    name: name
                });

                // 최신 생성 버전 표시
                selectVersion(savedVersions.length - 1);
            }

        } catch (err) {
            console.error(err);
            showError(err.message || "생성 중 오류가 발생했습니다.");
            if (savedVersions.length > 0) {
                selectVersion(savedVersions.length - 1);
            } else {
                setPanelDisplayMode("placeholder");
            }
        } finally {
            submitBtn.disabled = false;
            submitBtn.querySelector(".btn-text").textContent = "이력서 & 포트폴리오 생성하기";
        }
    });

    // 9. 복사 및 다운로드 공통 헬퍼
    async function copyText(text, btnElement) {
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            const original = btnElement.innerHTML;
            btnElement.innerHTML = "<span>✅</span> 복사 완료!";
            setTimeout(() => {
                btnElement.innerHTML = original;
            }, 1800);
        } catch (e) {
            alert("복사에 실패했습니다.");
        }
    }

    // 메인 복사 버튼 (단일 뷰일 때)
    copyBtn.addEventListener("click", () => {
        if (currentVersionIndex >= 0 && savedVersions[currentVersionIndex]) {
            copyText(savedVersions[currentVersionIndex].text, copyBtn);
        }
    });

    // 메인 다운로드 버튼 (단일 뷰일 때)
    downloadBtn.addEventListener("click", () => {
        if (currentVersionIndex < 0 || !savedVersions[currentVersionIndex]) return;
        const ver = savedVersions[currentVersionIndex];
        const fileName = `${ver.name}_이력서_포트폴리오_${ver.title}.md`;

        const blob = new Blob([ver.text], { type: "text/markdown;charset=utf-8;" });
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);
    });

    // 비교 뷰 내부 컬럼 복사 버튼
    copyCol1Btn.addEventListener("click", () => {
        if (savedVersions.length >= 2) {
            copyText(savedVersions[savedVersions.length - 2].text, copyCol1Btn);
        }
    });

    copyCol2Btn.addEventListener("click", () => {
        if (savedVersions.length >= 1) {
            copyText(savedVersions[savedVersions.length - 1].text, copyCol2Btn);
        }
    });
});
