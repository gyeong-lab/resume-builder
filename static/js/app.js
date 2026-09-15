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
    const btnResetForm = document.getElementById("btn-reset-form");

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
            if (profiles.length > 10) profiles = profiles.slice(0, 10); // 최대 10개 보관
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
        savedProfilesSelect.value = ""; // 드롭다운 기본값으로 리셋

        // 불러오기 완료 피드백
        const originalText = btnResetForm.textContent;
        btnResetForm.textContent = "✅ 불러옴!";
        setTimeout(() => {
            btnResetForm.textContent = originalText;
        }, 1500);
    });

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

    // 7. 단일 뷰 내 서식 문서 vs 마크다운 탭 전환
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

    // 8. 버전 탭 렌더링 및 선택 로직
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
    }

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

    function openComparisonView() {
        if (savedVersions.length < 2) return;

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
            selectVersion(savedVersions.length - 1);
        } else {
            openComparisonView();
        }
    });

    // 9. API 호출 헬퍼
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

        // [히스토리 저장] 현재 입력한 프로필 정보를 로컬 스토리지 히스토리에 자동 저장
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
        if (savedVersions.length >= 2) {
            copyText(savedVersions[savedVersions.length - 2].text, copyCol1Btn);
        }
    });

    copyCol2Btn.addEventListener("click", () => {
        if (savedVersions.length >= 1) {
            copyText(savedVersions[savedVersions.length - 1].text, copyCol2Btn);
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
});
