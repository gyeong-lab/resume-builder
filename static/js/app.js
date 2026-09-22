/**
 * ==========================================================
 * AI Resume & Portfolio Builder - 프론트엔드 스크립트 (app.js)
 * 자동 임시 저장(Draft), 이전 작성 기록(Profiles) 보관 및 선택,
 * A/B 동시 생성 및 좌우 나란히 비교(Split Compare) 지원
 * ==========================================================
 */

document.addEventListener("DOMContentLoaded", () => {
    // 1. 주요 DOM 요소 참조
    const form = document.getElementById("resume-form");
    const submitBtn = document.getElementById("submit-btn");
    const dualGenCheckbox = document.getElementById("dual-generate");
    const errorBox = document.getElementById("error-box");
    const errorMessage = document.getElementById("error-message");

    // 폼 입력 필드
    const nameInput = document.getElementById("name");
    const jobTitleInput = document.getElementById("job-title");
    const experienceInput = document.getElementById("experience");
    const projectsInput = document.getElementById("projects");
    const toneSelect = document.getElementById("tone");

    // 이전 작성 기록 제어 요소
    const savedProfilesSelect = document.getElementById("saved-profiles-select");
    const btnDeleteProfile = document.getElementById("btn-delete-profile");
    const btnResetForm = document.getElementById("btn-reset-form");
    const saveHistoryToggle = document.getElementById("save-history-toggle");

    // 우측 패널 상태 요소
    const statusPill = document.getElementById("status-pill");
    const versionTabsContainer = document.getElementById("version-tabs-container");
    const versionPills = document.getElementById("version-pills");
    const btnCompareView = document.getElementById("btn-compare-view");

    // 모바일 퀵 네비게이션 제어 요소
    const mBtnForm = document.getElementById("m-btn-form");
    const mBtnResult = document.getElementById("m-btn-result");
    const mResultBadge = document.getElementById("m-result-badge");
    const sectionForm = document.getElementById("section-form");
    const sectionResult = document.getElementById("section-result");

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

    // 좌우 넘김 네비게이션 및 섹션 페이지 제어 요소
    const btnPrevVersionHeader = document.getElementById("btn-prev-version-header");
    const btnNextVersionHeader = document.getElementById("btn-next-version-header");
    const btnPrevVersion = document.getElementById("btn-prev-version");
    const btnNextVersion = document.getElementById("btn-next-version");
    const versionCounterBadge = document.getElementById("version-counter-badge");
    const sectionNavGroup = document.getElementById("section-nav-group");
    const secPills = document.querySelectorAll(".sec-pill");
    const btnPrevSection = document.getElementById("btn-prev-section");
    const btnNextSection = document.getElementById("btn-next-section");

    // 나란히 비교 이력서 선택 드롭다운 및 비교 뷰 모드
    const compareSelect1 = document.getElementById("compare-select-1");
    const compareSelect2 = document.getElementById("compare-select-2");
    const btnComparePreview = document.getElementById("btn-compare-preview");
    const btnCompareRaw = document.getElementById("btn-compare-raw");
    const col1Raw = document.getElementById("col1-raw");
    const col2Raw = document.getElementById("col2-raw");

    // 툴바 내 뷰 모드 전환 버튼 (서식 문서 vs 마크다운)
    const btnViewPreview = document.getElementById("btn-view-preview");
    const btnViewRaw = document.getElementById("btn-view-raw");

    // 생성된 버전 기록 보관 배열 [{ id, title, badge, type, time, text, name }]
    let savedVersions = [];
    let currentVersionIndex = -1;
    let isCompareMode = false;
    let currentSectionMode = "all"; // "all" | "resume" | "portfolio"
    let currentDisplayMode = "preview"; // "preview" | "raw"
    let compareDisplayMode = "preview"; // "preview" | "raw"

    // 2. 오류 메시지 헬퍼
    function showError(message) {
        errorMessage.textContent = message;
        errorBox.classList.remove("hidden");
    }

    function hideError() {
        errorMessage.textContent = "";
        errorBox.classList.add("hidden");
    }

    // 3. 🌟 [기능 1] 실시간 자동 임시 저장 (Auto-Save Draft) 🌟
    function saveDraftToStorage() {
        const promptType = document.querySelector('input[name="prompt_type"]:checked')?.value || "B";
        const draft = {
            name: nameInput.value,
            jobTitle: jobTitleInput.value,
            experience: experienceInput.value,
            projects: projectsInput.value,
            tone: toneSelect.value,
            promptType: promptType,
            dualGen: dualGenCheckbox.checked
        };
        try {
            localStorage.setItem("resume_builder_draft", JSON.stringify(draft));
        } catch (e) {
            console.warn("로컬 스토리지 저장 실패:", e);
        }
    }

    // 폼 입력 시 자동 임시 저장 트리거
    [nameInput, jobTitleInput, experienceInput, projectsInput, toneSelect].forEach(el => {
        el.addEventListener("input", saveDraftToStorage);
        el.addEventListener("change", saveDraftToStorage);
    });
    dualGenCheckbox.addEventListener("change", saveDraftToStorage);
    document.querySelectorAll('input[name="prompt_type"]').forEach(r => {
        r.addEventListener("change", saveDraftToStorage);
    });

    // 페이지 로드 시 임시 저장된 내용 자동 복원
    function restoreDraftFromStorage() {
        try {
            const rawDraft = localStorage.getItem("resume_builder_draft");
            if (rawDraft) {
                const draft = JSON.parse(rawDraft);
                if (draft.name) nameInput.value = draft.name;
                if (draft.jobTitle) jobTitleInput.value = draft.jobTitle;
                if (draft.experience) experienceInput.value = draft.experience;
                if (draft.projects) projectsInput.value = draft.projects;
                if (draft.tone) toneSelect.value = draft.tone;
                if (draft.promptType) {
                    const radio = document.querySelector(`input[name="prompt_type"][value="${draft.promptType}"]`);
                    if (radio) radio.checked = true;
                }
                if (typeof draft.dualGen === "boolean") {
                    dualGenCheckbox.checked = draft.dualGen;
                }
            }
        } catch (e) {
            console.warn("임시 저장 내용 복원 실패:", e);
        }
    }

    // 4. 🌟 [기능 2] 이전 작성 기록(Profiles) 보관 및 드롭다운 선택 🌟
    function getStoredProfiles() {
        try {
            const raw = localStorage.getItem("resume_builder_profiles");
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    function saveProfileHistory(profile) {
        try {
            let profiles = getStoredProfiles();
            // 중복 검사 (이름과 직무가 같으면 기존 것 제거 후 최신으로 등록)
            profiles = profiles.filter(p => !(p.name === profile.name && p.jobTitle === profile.jobTitle));
            profiles.unshift(profile); // 최신 것을 맨 앞으로
            if (profiles.length > 5) profiles = profiles.slice(0, 5); // 과도한 누적 방지 (최대 5개 보관)
            localStorage.setItem("resume_builder_profiles", JSON.stringify(profiles));
            updateProfilesDropdown();
        } catch (e) {
            console.warn("프로필 목록 저장 실패:", e);
        }
    }

    function updateProfilesDropdown() {
        const profiles = getStoredProfiles();
        savedProfilesSelect.innerHTML = "";

        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = profiles.length > 0 ? `📂 이전 작성 기록 (${profiles.length}개)...` : "📂 이전 작성 기록 없음";
        savedProfilesSelect.appendChild(defaultOption);

        profiles.forEach((p, idx) => {
            const opt = document.createElement("option");
            opt.value = idx;
            const timeStr = p.savedAt ? p.savedAt.slice(5, 16) : "";
            opt.textContent = `${p.name} - ${p.jobTitle} ${timeStr ? `(${timeStr})` : ""}`;
            savedProfilesSelect.appendChild(opt);
        });
    }

    // 드롭다운에서 이전 기록 선택 시 폼에 자동 입력
    savedProfilesSelect.addEventListener("change", (e) => {
        const val = e.target.value;
        if (val === "") return;

        const profiles = getStoredProfiles();
        const selected = profiles[parseInt(val, 10)];
        if (!selected) return;

        nameInput.value = selected.name || "";
        jobTitleInput.value = selected.jobTitle || "";
        experienceInput.value = selected.experience || "";
        projectsInput.value = selected.projects || "";
        if (selected.tone) toneSelect.value = selected.tone;
        if (selected.promptType) {
            const radio = document.querySelector(`input[name="prompt_type"][value="${selected.promptType}"]`);
            if (radio) radio.checked = true;
        }

        saveDraftToStorage(); // 불러온 내용도 임시 저장에 동기화

        // 불러오기 완료 피드백
        const originalText = btnResetForm.textContent;
        btnResetForm.textContent = "✅ 불러옴!";
        setTimeout(() => {
            btnResetForm.textContent = originalText;
        }, 1500);
    });

    // 🌟 [기능 추가] 이전 작성 기록 삭제 (선택 기록 삭제 or 전체 삭제) 🌟
    if (btnDeleteProfile) {
        btnDeleteProfile.addEventListener("click", () => {
            const profiles = getStoredProfiles();
            if (profiles.length === 0) {
                alert("삭제할 저장된 작성 기록이 없습니다.");
                return;
            }

            const selectedVal = savedProfilesSelect.value;
            if (selectedVal !== "") {
                const idx = parseInt(selectedVal, 10);
                const target = profiles[idx];
                const label = target ? `"${target.name} (${target.jobTitle})"` : "선택한";
                if (confirm(`${label} 작성 기록을 삭제하시겠습니까?`)) {
                    profiles.splice(idx, 1);
                    localStorage.setItem("resume_builder_profiles", JSON.stringify(profiles));
                    updateProfilesDropdown();
                    savedProfilesSelect.value = "";

                    const orig = btnDeleteProfile.textContent;
                    btnDeleteProfile.textContent = "✅ 삭제됨";
                    setTimeout(() => { btnDeleteProfile.textContent = orig; }, 1500);
                }
            } else {
                if (confirm(`저장된 모든 작성 기록(${profiles.length}개)을 전부 삭제하시겠습니까?`)) {
                    localStorage.removeItem("resume_builder_profiles");
                    updateProfilesDropdown();
                    savedProfilesSelect.value = "";

                    const orig = btnDeleteProfile.textContent;
                    btnDeleteProfile.textContent = "✅ 전체 삭제됨";
                    setTimeout(() => { btnDeleteProfile.textContent = orig; }, 1500);
                }
            }
        });
    }

    // 폼 초기화(비우기) 버튼
    btnResetForm.addEventListener("click", () => {
        if (confirm("입력창의 모든 내용을 지우시겠습니까?")) {
            nameInput.value = "";
            jobTitleInput.value = "";
            experienceInput.value = "";
            projectsInput.value = "";
            toneSelect.selectedIndex = 0;
            const defaultRadio = document.querySelector('input[name="prompt_type"][value="B"]');
            if (defaultRadio) defaultRadio.checked = true;
            dualGenCheckbox.checked = false;
            savedProfilesSelect.value = "";

            try {
                localStorage.removeItem("resume_builder_draft");
            } catch (e) {}

            nameInput.focus();
        }
    });

    // 5. 마크다운 변환 렌더링 함수
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

    // 6. 우측 패널 모드 제어 (placeholder | loading | single | compare)
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
            viewTabs.classList.add("hidden");
            copyBtn.disabled = true;
            downloadBtn.disabled = true;
            btnCompareView.classList.add("active");
            isCompareMode = true;
        }
    }

    // 7. 단일 뷰 및 비교 뷰 내 서식 문서 vs 마크다운 탭 전환
    function switchSingleView(type) {
        currentDisplayMode = type;
        if (type === "preview") {
            if (tabPreview) tabPreview.classList.add("active");
            if (tabRaw) tabRaw.classList.remove("active");
            if (btnViewPreview) btnViewPreview.classList.add("active");
            if (btnViewRaw) btnViewRaw.classList.remove("active");
            renderedContent.classList.remove("hidden");
            rawContent.classList.add("hidden");
        } else {
            if (tabRaw) tabRaw.classList.add("active");
            if (tabPreview) tabPreview.classList.remove("active");
            if (btnViewRaw) btnViewRaw.classList.add("active");
            if (btnViewPreview) btnViewPreview.classList.remove("active");
            rawContent.classList.remove("hidden");
            renderedContent.classList.add("hidden");
        }
    }

    if (tabPreview) tabPreview.addEventListener("click", () => switchSingleView("preview"));
    if (tabRaw) tabRaw.addEventListener("click", () => switchSingleView("raw"));
    if (btnViewPreview) btnViewPreview.addEventListener("click", () => switchSingleView("preview"));
    if (btnViewRaw) btnViewRaw.addEventListener("click", () => switchSingleView("raw"));

    function switchCompareView(type) {
        compareDisplayMode = type;
        if (type === "preview") {
            if (btnComparePreview) btnComparePreview.classList.add("active");
            if (btnCompareRaw) btnCompareRaw.classList.remove("active");
            if (col1Content) col1Content.classList.remove("hidden");
            if (col2Content) col2Content.classList.remove("hidden");
            if (col1Raw) col1Raw.classList.add("hidden");
            if (col2Raw) col2Raw.classList.add("hidden");
        } else {
            if (btnCompareRaw) btnCompareRaw.classList.add("active");
            if (btnComparePreview) btnComparePreview.classList.remove("active");
            if (col1Content) col1Content.classList.add("hidden");
            if (col2Content) col2Content.classList.add("hidden");
            if (col1Raw) col1Raw.classList.remove("hidden");
            if (col2Raw) col2Raw.classList.remove("hidden");
        }
    }

    if (btnComparePreview) btnComparePreview.addEventListener("click", () => switchCompareView("preview"));
    if (btnCompareRaw) btnCompareRaw.addEventListener("click", () => switchCompareView("raw"));

    // 8. 긴 생성 결과 섹션 분할 함수 (이력서 ↔ 포트폴리오 가로 넘기기 지원)
    function splitResumeSections(text) {
        if (!text) return { all: "", resume: "", portfolio: "" };

        // 포트폴리오 섹션 시작 헤더 정규식 탐색
        const portfolioRegex = /(?:^|\n)(?:#{1,3}\s*(?:2[.\s]|\[?포트폴리오\]?|Portfolio).*)/i;
        const portMatch = text.match(portfolioRegex);

        if (portMatch && portMatch.index !== undefined && portMatch.index > 0) {
            const portIndex = portMatch.index;
            const resumePart = text.substring(0, portIndex).trim();
            const portfolioPart = text.substring(portIndex).trim();
            return {
                all: text,
                resume: resumePart,
                portfolio: portfolioPart
            };
        }

        return { all: text, resume: "", portfolio: "" };
    }

    function updateSectionPillsUI() {
        secPills.forEach(pill => {
            if (pill.dataset.section === currentSectionMode) {
                pill.classList.add("active");
            } else {
                pill.classList.remove("active");
            }
        });

        if (btnPrevSection && btnNextSection) {
            btnPrevSection.disabled = (currentSectionMode === "all" || currentSectionMode === "resume");
            btnNextSection.disabled = (currentSectionMode === "portfolio");
        }
    }

    // 9. 버전 탭 및 좌우 넘김 UI 갱신 로직
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

        if (savedVersions.length >= 2) {
            btnCompareView.classList.remove("hidden");
        } else {
            btnCompareView.classList.add("hidden");
        }

        // 좌우 넘김 버튼 활성화/비활성화 상태
        const isFirst = (currentVersionIndex <= 0);
        const isLast = (currentVersionIndex >= savedVersions.length - 1);

        if (btnPrevVersion) btnPrevVersion.disabled = isFirst;
        if (btnNextVersion) btnNextVersion.disabled = isLast;
        if (btnPrevVersionHeader) btnPrevVersionHeader.disabled = isFirst;
        if (btnNextVersionHeader) btnNextVersionHeader.disabled = isLast;

        if (versionCounterBadge) {
            versionCounterBadge.textContent = savedVersions.length > 0
                ? `이력서 ${currentVersionIndex + 1} / ${savedVersions.length}`
                : "이력서 0 / 0";
        }
    }

    function selectVersion(index, sectionMode) {
        if (index < 0 || index >= savedVersions.length) return;
        currentVersionIndex = index;
        if (sectionMode) currentSectionMode = sectionMode;
        const ver = savedVersions[index];

        const sections = splitResumeSections(ver.text);

        // 이력서와 포트폴리오 섹션이 모두 존재할 경우 섹션 네비게이터 노출
        if (sections.portfolio && sections.resume) {
            if (sectionNavGroup) sectionNavGroup.classList.remove("hidden");
            updateSectionPillsUI();
        } else {
            if (sectionNavGroup) sectionNavGroup.classList.add("hidden");
            currentSectionMode = "all";
        }

        let textToDisplay = ver.text;
        if (currentSectionMode === "resume" && sections.resume) {
            textToDisplay = sections.resume;
        } else if (currentSectionMode === "portfolio" && sections.portfolio) {
            textToDisplay = sections.portfolio;
        }

        renderedContent.innerHTML = renderMarkdown(textToDisplay);
        rawContent.textContent = textToDisplay;

        // 화면 상단으로 스크롤 이동
        resultCard.scrollTop = 0;

        setPanelDisplayMode("single");
        switchSingleView(currentDisplayMode);
        updateVersionUI();
    }

    // 결과물(버전) 좌우 넘기기 함수
    function navigateVersion(direction) {
        if (isCompareMode) {
            selectVersion(direction > 0 ? savedVersions.length - 1 : 0);
            return;
        }
        const newIndex = currentVersionIndex + direction;
        if (newIndex >= 0 && newIndex < savedVersions.length) {
            selectVersion(newIndex, currentSectionMode);
        }
    }

    if (btnPrevVersion) btnPrevVersion.addEventListener("click", () => navigateVersion(-1));
    if (btnNextVersion) btnNextVersion.addEventListener("click", () => navigateVersion(1));
    if (btnPrevVersionHeader) btnPrevVersionHeader.addEventListener("click", () => navigateVersion(-1));
    if (btnNextVersionHeader) btnNextVersionHeader.addEventListener("click", () => navigateVersion(1));

    // 섹션 탭 클릭 이벤트 (전체 / 1. 이력서 / 2. 포트폴리오)
    secPills.forEach(pill => {
        pill.addEventListener("click", () => {
            const sec = pill.dataset.section;
            selectVersion(currentVersionIndex, sec);
        });
    });

    if (btnPrevSection) {
        btnPrevSection.addEventListener("click", () => {
            if (currentSectionMode === "portfolio") {
                selectVersion(currentVersionIndex, "resume");
            } else if (currentSectionMode === "resume") {
                selectVersion(currentVersionIndex, "all");
            }
        });
    }

    if (btnNextSection) {
        btnNextSection.addEventListener("click", () => {
            if (currentSectionMode === "all") {
                selectVersion(currentVersionIndex, "resume");
            } else if (currentSectionMode === "resume") {
                selectVersion(currentVersionIndex, "portfolio");
            }
        });
    }

    // 키보드 좌우 방향키로 이력서 넘기기
    window.addEventListener("keydown", (e) => {
        const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : "";
        if (activeTag === "input" || activeTag === "textarea" || activeTag === "select") return;

        if (e.key === "ArrowLeft") {
            navigateVersion(-1);
        } else if (e.key === "ArrowRight") {
            navigateVersion(1);
        }
    });

    // 🌟 [나란히 비교] 내가 선택한 임의의 2개 이력서로 비교하기 🌟
    function renderCompareColumn(colNumber, versionIndex) {
        if (versionIndex < 0 || versionIndex >= savedVersions.length) return;
        const ver = savedVersions[versionIndex];

        if (colNumber === 1) {
            col1Badge.textContent = ver.badge;
            col1Badge.className = `mode-badge ${ver.type === "A" ? "standard" : "expert"}`;
            col1Content.innerHTML = renderMarkdown(ver.text);
            if (col1Raw) col1Raw.textContent = ver.text;
        } else {
            col2Badge.textContent = ver.badge;
            col2Badge.className = `mode-badge ${ver.type === "A" ? "standard" : "expert"}`;
            col2Content.innerHTML = renderMarkdown(ver.text);
            if (col2Raw) col2Raw.textContent = ver.text;
        }
    }

    function populateCompareSelects(leftIdx, rightIdx) {
        if (!compareSelect1 || !compareSelect2) return;

        compareSelect1.innerHTML = "";
        compareSelect2.innerHTML = "";

        savedVersions.forEach((ver, idx) => {
            const opt1 = document.createElement("option");
            opt1.value = idx;
            opt1.textContent = `${ver.title}: ${ver.name} (${ver.badge})`;
            compareSelect1.appendChild(opt1);

            const opt2 = document.createElement("option");
            opt2.value = idx;
            opt2.textContent = `${ver.title}: ${ver.name} (${ver.badge})`;
            compareSelect2.appendChild(opt2);
        });

        compareSelect1.value = leftIdx;
        compareSelect2.value = rightIdx;
    }

    function openComparisonView() {
        if (savedVersions.length < 2) return;

        const leftIndex = savedVersions.length - 2;
        const rightIndex = savedVersions.length - 1;

        populateCompareSelects(leftIndex, rightIndex);
        renderCompareColumn(1, leftIndex);
        renderCompareColumn(2, rightIndex);

        setPanelDisplayMode("compare");
        switchCompareView(compareDisplayMode);
        updateVersionUI();
    }

    if (compareSelect1) {
        compareSelect1.addEventListener("change", (e) => {
            const idx = parseInt(e.target.value, 10);
            renderCompareColumn(1, idx);
        });
    }

    if (compareSelect2) {
        compareSelect2.addEventListener("change", (e) => {
            const idx = parseInt(e.target.value, 10);
            renderCompareColumn(2, idx);
        });
    }

    btnCompareView.addEventListener("click", () => {
        if (isCompareMode) {
            selectVersion(savedVersions.length - 1);
        } else {
            openComparisonView();
        }
    });

    // 9. API 호출 헬퍼
    async function requestGenerate(payload) {
        let response = null;
        try {
            response = await fetch("/generate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });
        } catch (netErr) {
            throw new Error("네트워크 연결 오류가 발생했습니다. 인터넷 연결 상태를 확인해 주세요.");
        }

        // 만약 /generate에서 404/405가 반환될 경우 /api/generate로 한 번 더 폴백 시도
        if (response.status === 404 || response.status === 405) {
            try {
                const fallbackResponse = await fetch("/api/generate", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(payload)
                });
                if (fallbackResponse.ok || fallbackResponse.status === 500) {
                    response = fallbackResponse;
                }
            } catch (e) {
                // 폴백 실패 시 원래 response 유지
            }
        }

        const contentType = response.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
            const errorHtml = await response.text();
            console.error("서버 비정상 응답 (Status " + response.status + "):", errorHtml);
            if (response.status === 504) {
                throw new Error("AI 응답 시간이 초과되었습니다 (504 Gateway Timeout). 생성 모드를 단일 모드로 변경하거나 내용을 조금 간결히 하여 다시 시도해 주세요.");
            } else if (response.status === 500) {
                throw new Error("서버 내부 오류(500)가 발생했습니다. Vercel 설정(Environment Variables)에 GEMINI_API_KEY가 올바르게 등록되어 있는지 확인해 주세요.");
            } else {
                throw new Error(`서버에서 올바르지 않은 응답(HTTP ${response.status})을 반환했습니다. 잠시 후 다시 시도해 주세요.`);
            }
        }

        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data.error || "서버 통신 오류가 발생했습니다.");
        }
        return data.result;
    }

    // 10. 폼 제출 이벤트 (생성 실행)
    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        hideError();

        const name = nameInput.value.trim();
        const jobTitle = jobTitleInput.value.trim();
        const experience = experienceInput.value.trim();
        const projects = projectsInput.value.trim();
        const tone = toneSelect.value;
        const promptType = document.querySelector('input[name="prompt_type"]:checked')?.value || "B";
        const isDual = dualGenCheckbox.checked;

        if (!name || !jobTitle || !experience || !projects) {
            showError("모든 필수 입력값(*)을 입력해 주세요.");
            return;
        }

        // [히스토리 저장] 사용자가 체크박스를 선택했을 때만 기록에 보관 (무분별한 자동 누적 방지)
        if (saveHistoryToggle && saveHistoryToggle.checked) {
            const now = new Date();
            const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            saveProfileHistory({
                name: name,
                jobTitle: jobTitle,
                experience: experience,
                projects: projects,
                tone: tone,
                promptType: promptType,
                savedAt: timeStr
            });
        }

        setPanelDisplayMode("loading");
        submitBtn.disabled = true;

        // 모바일 화면일 경우 로딩 진행 상태를 확인할 수 있도록 결과 패널로 자동 스크롤
        if (window.innerWidth <= 768 && sectionResult) {
            sectionResult.scrollIntoView({ behavior: "smooth", block: "start" });
            if (mBtnResult) {
                mBtnResult.classList.add("active");
                if (mBtnForm) mBtnForm.classList.remove("active");
            }
        }

        const basePayload = {
            name: name,
            job_title: jobTitle,
            experience: experience,
            projects: projects,
            tone: tone
        };

        try {
            if (isDual) {
                loadingTitle.textContent = "Prompt A & B 두 버전을 동시 생성하고 있습니다";
                loadingDesc.textContent = "표준형과 STAR 전문가형 이력서를 동시에 완성하여 나란히 비교창을 띄웁니다...";
                submitBtn.querySelector(".btn-text").textContent = "두 버전을 동시 작성 중...";

                const [resultA, resultB] = await Promise.all([
                    requestGenerate({ ...basePayload, prompt_type: "A" }),
                    requestGenerate({ ...basePayload, prompt_type: "B" })
                ]);

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

                openComparisonView();

                if (mResultBadge) {
                    mResultBadge.classList.remove("hidden");
                }
                if (window.innerWidth <= 768 && sectionResult) {
                    sectionResult.scrollIntoView({ behavior: "smooth", block: "start" });
                }

            } else {
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

                selectVersion(savedVersions.length - 1);

                if (mResultBadge) {
                    mResultBadge.classList.remove("hidden");
                }
                if (window.innerWidth <= 768 && sectionResult) {
                    sectionResult.scrollIntoView({ behavior: "smooth", block: "start" });
                }
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

    // 11. 복사 및 다운로드 공통 헬퍼
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

    copyBtn.addEventListener("click", () => {
        if (currentVersionIndex >= 0 && savedVersions[currentVersionIndex]) {
            copyText(savedVersions[currentVersionIndex].text, copyBtn);
        }
    });

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

    copyCol1Btn.addEventListener("click", () => {
        const idx = compareSelect1 ? parseInt(compareSelect1.value, 10) : 0;
        if (savedVersions[idx]) {
            copyText(savedVersions[idx].text, copyCol1Btn);
        }
    });

    copyCol2Btn.addEventListener("click", () => {
        const idx = compareSelect2 ? parseInt(compareSelect2.value, 10) : 1;
        if (savedVersions[idx]) {
            copyText(savedVersions[idx].text, copyCol2Btn);
        }
    });

    // 12. 모바일 전용 상단 퀵 네비게이션 동작 및 스크롤 동기화
    if (mBtnForm && mBtnResult) {
        mBtnForm.addEventListener("click", () => {
            mBtnForm.classList.add("active");
            mBtnResult.classList.remove("active");
            if (sectionForm) {
                sectionForm.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        });

        mBtnResult.addEventListener("click", () => {
            mBtnResult.classList.add("active");
            mBtnForm.classList.remove("active");
            if (mResultBadge) {
                mResultBadge.classList.add("hidden");
            }
            if (sectionResult) {
                sectionResult.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        });

        // 사용자가 터치로 위아래 스크롤할 때 현재 보고 있는 패널에 맞게 네비 탭 활성화
        if ("IntersectionObserver" in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && entry.intersectionRatio >= 0.2) {
                        if (entry.target.id === "section-form") {
                            mBtnForm.classList.add("active");
                            mBtnResult.classList.remove("active");
                        } else if (entry.target.id === "section-result") {
                            mBtnResult.classList.add("active");
                            mBtnForm.classList.remove("active");
                            if (mResultBadge) {
                                mResultBadge.classList.add("hidden");
                            }
                        }
                    }
                });
            }, { threshold: [0.2] });

            if (sectionForm) observer.observe(sectionForm);
            if (sectionResult) observer.observe(sectionResult);
        }
    }

    // 13. 초기화 실행 (임시 저장 복원 및 이전 기록 드롭다운 채우기)
    restoreDraftFromStorage();
    updateProfilesDropdown();

    // 14. PWA 서비스 워커 등록
    if ("serviceWorker" in navigator) {
        window.addEventListener("load", () => {
            navigator.serviceWorker.register("/sw.js")
                .then(reg => {
                    console.log("PWA Service Worker 등록 성공 (Scope):", reg.scope);
                })
                .catch(err => {
                    console.warn("PWA Service Worker 등록 실패:", err);
                });
        });
    }

    // 15. PWA 설치 배너 및 프롬프트 제어
    initPwaInstall();
});

// ==========================================
// 15. PWA 설치 프롬프트 및 전용 UI 컨트롤러
// ==========================================
let deferredInstallPrompt = null;

function showPwaToast(message) {
    let toast = document.getElementById("pwa-toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "pwa-toast";
        toast.className = "pwa-toast-notification";
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => {
        toast.classList.remove("show");
    }, 3500);
}

function initPwaInstall() {
    const installBanner = document.getElementById("pwa-install-banner");
    const installBtn = document.getElementById("pwa-install-btn");
    const closeBtn = document.getElementById("pwa-close-btn");
    const headerBtn = document.getElementById("pwa-header-btn");
    const iosModal = document.getElementById("pwa-ios-modal");
    const iosCloseBtn = document.getElementById("pwa-ios-close");
    const iosConfirmBtn = document.getElementById("pwa-ios-confirm");

    // 이미 PWA 독립 창(Standalone) 모드로 실행 중인지 확인
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches 
        || window.navigator.standalone === true;

    if (isStandalone) {
        console.log("PWA가 이미 단독 앱(Standalone) 모드로 실행 중입니다.");
        return;
    }

    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    // 배너 노출 처리
    function showInstallUi() {
        const isDismissed = sessionStorage.getItem("pwa_banner_dismissed") === "true";
        if (!isDismissed && installBanner) {
            installBanner.style.display = "block";
        }
        if (headerBtn) {
            headerBtn.style.display = "inline-flex";
        }
    }

    // Chrome, Edge, Android PWA 설치 이벤트 감지
    window.addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault();
        deferredInstallPrompt = e;
        console.log("PWA beforeinstallprompt 이벤트 발생 - 설치 배너 노출");
        showInstallUi();
    });

    // 사이트 진입 후 1.2초 뒤 사용자에게 친절하게 배너 안내 노출
    setTimeout(() => {
        if (!isStandalone) {
            showInstallUi();
        }
    }, 1200);

    // 설치 트리거 실행
    async function triggerInstall() {
        if (deferredInstallPrompt) {
            deferredInstallPrompt.prompt();
            const choiceResult = await deferredInstallPrompt.userChoice;
            console.log("사용자 설치 응답:", choiceResult.outcome);
            if (choiceResult.outcome === "accepted") {
                if (installBanner) installBanner.style.display = "none";
                if (headerBtn) headerBtn.style.display = "none";
                showPwaToast("🎉 AI Resume Builder 앱이 설치되었습니다!");
            }
            deferredInstallPrompt = null;
        } else if (isIos) {
            if (iosModal) iosModal.style.display = "flex";
        } else {
            showPwaToast("💡 브라우저 주소창 우측의 [설치(💻)] 아이콘을 클릭하여 설치하실 수도 있습니다.");
        }
    }

    if (installBtn) {
        installBtn.addEventListener("click", triggerInstall);
    }
    if (headerBtn) {
        headerBtn.addEventListener("click", triggerInstall);
    }

    if (closeBtn) {
        closeBtn.addEventListener("click", () => {
            if (installBanner) installBanner.style.display = "none";
            sessionStorage.setItem("pwa_banner_dismissed", "true");
        });
    }

    if (iosCloseBtn) {
        iosCloseBtn.addEventListener("click", () => {
            if (iosModal) iosModal.style.display = "none";
        });
    }
    if (iosConfirmBtn) {
        iosConfirmBtn.addEventListener("click", () => {
            if (iosModal) iosModal.style.display = "none";
        });
    }

    window.addEventListener("appinstalled", () => {
        console.log("PWA 설치 완료 감지됨");
        if (installBanner) installBanner.style.display = "none";
        if (headerBtn) headerBtn.style.display = "none";
        showPwaToast("🎉 AI Resume Builder 앱 설치가 완료되었습니다!");
    });
}
