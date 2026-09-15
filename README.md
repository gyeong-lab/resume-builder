# 📄 AI Resume & Portfolio Builder
> **Google Gemini 3.5 Flash-Lite 기반 실시간 맞춤형 이력서 & 포트폴리오 생성기**

[![Python Version](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![Framework](https://img.shields.io/badge/Framework-Flask-black.svg)](https://flask.palletsprojects.com/)
[![AI Model](https://img.shields.io/badge/Model-Gemini%203.5%20Flash--Lite-orange.svg)](https://ai.google.dev/)
[![Design](https://img.shields.io/badge/Layout-Wide%201640px%20%26%20Mobile%20Ready-success.svg)](#)

---

## 📌 1. 프로젝트 소개 (Overview)
**AI Resume & Portfolio Builder**는 지원자가 입력한 기본 정보와 경험을 바탕으로 채용 담당자(시니어 테크니컬 리크루터)의 시각에서 경쟁력 있는 **맞춤형 이력서와 포트폴리오를 단 10초 만에 설계**해 주는 풀스택 웹 애플리케이션입니다.

표준형 이력서와 성과 중심(STAR 기법) 전문가형 이력서를 **A/B 듀얼 모드로 동시 생성하여 좌우로 나란히 비교**할 수 있으며, 실시간 임시 저장 기능과 와이드 PC/모바일 최적화 반응형 UI를 완벽 지원합니다.

---

## ✨ 2. 핵심 주요 기능 (Key Features)

### 🎯 1) 심층 역량 분석 및 STAR 기법 프롬프트 엔지니어링
- **표준형 (Prompt A)**: 한눈에 보기 쉬운 구조와 핵심 역량 요약 중심
- **STAR 전문가형 (Prompt B)**: 상황(S), 과제(T), 행동(A), 결과(R)와 수치 성과, 기술적 문제 해결(Troubleshooting) 중심의 심층 포트폴리오 설계
- 톤앤매너 선택(자신감 있고 당당한 / 차분하고 전문적인 / 열정적인 등) 반영

### ⚡ 2) A/B 버전 동시 생성 & 나란히 비교 (Split Comparison)
- 한 번의 클릭으로 Prompt A와 B를 동시 생성
- 결과 화면에서 **좌우 분할(Split Screen) 카드**를 통해 두 버전의 차이점을 한눈에 비교하고 원하는 버전 선택 가능

### 💾 3) 데이터 유실 방지 및 기록 관리 (Auto-Save & History)
- **실시간 자동 임시 저장(Auto-save Draft)**: 입력 중 새로고침을 하거나 창을 닫아도 `localStorage`를 통해 입력값 자동 복원
- **프로필 히스토리 드롭다운**: 이전에 작성했던 지원자 정보를 최대 10개까지 안전하게 보관 및 원클릭 복원
- **초기화(Reset) 지원**: 클릭 한 번으로 입력 폼 전체를 깔끔하게 비우고 새 작업 시작 가능

### 🖥️ 4) 와이드 화면(1640px) 최적화 레이아웃
- 데스크톱 모니터의 넓은 화면을 시원하게 활용하는 **1,640px 울트라 와이드 그리드**
- 좌측 입력 폼(42%)과 우측 결과 패널(58%)의 황금 비율 분할로 가독성 극대화

### 📱 5) 모바일 스마트폰 완벽 연동
- **상단 스티키 퀵 네비게이션**: 화면 상단에 `[✏️ 정보 입력]`과 `[📄 생성 결과]` 탭 고정
- **스크롤 스파이(Scroll-Spy)**: 터치 스크롤 위치에 맞춰 현재 보고 있는 탭 자동 활성화
- **자동 스크롤 & NEW 뱃지**: 생성 요청 시 작성 화면으로 자동 스크롤, 완료 시 알림 뱃지 깜빡임
- **모바일 줌 방지 및 터치 최적화**: 48px 이상의 터치 타깃과 16px 입력 폰트로 편안한 모바일 사용성 제공
- **로컬 네트워크 지원**: `0.0.0.0:5000` 바인딩으로 같은 Wi-Fi에 연결된 스마트폰에서 실시간 접속 가능

### 📋 6) 내보내기 및 편의 도구
- 마크다운 실시간 서식 뷰(`Marked.js`) 및 원본 마크다운(`Raw`) 탭 전환 지원
- 클립보드 원클릭 복사
- 표준 마크다운 문서(`.md`) 파일 즉시 다운로드

---

## 📁 3. 디렉터리 구조 (Directory Structure)

```text
resume-builder/
├── app.py                      # Flask 서버 진입점 및 Gemini API 연동 백엔드
├── requirements.txt            # 파이썬 의존성 패키지 목록
├── .env                        # 환경 변수 (GEMINI_API_KEY - Git 제외)
├── .gitignore                  # Git 추적 제외 설정 파일
├── README.md                   # 프로젝트 공식 문서
├── static/
│   ├── css/
│   │   └── style.css           # 1640px 와이드 레이아웃 & 모바일 반응형 스타일
│   └── js/
│       └── app.js              # 비동기 API 통신, 자동저장, 비교 뷰 로직
└── templates/
    └── index.html              # 시맨틱 웹 표준 기반 메인 HTML 템플릿
```

---

## 🚀 4. 설치 및 실행 방법 (Getting Started)

### 1) 사전 준비
- **Python 3.10 이상** 설치 필수
- [Google AI Studio](https://aistudio.google.com/)에서 발급받은 **Gemini API Key**

### 2) 저장소 이동 및 가상환경 설정
```powershell
# 1. 프로젝트 디렉터리로 이동
cd C:\AI-study\resume-builder

# 2. 가상환경 생성 (최초 1회)
py -m venv venv

# 3. 가상환경 활성화 (Windows PowerShell)
.\venv\Scripts\Activate.ps1
```

### 3) 필수 라이브러리 설치
```powershell
pip install -r requirements.txt
```

### 4) 환경 변수 설정 (`.env`)
프로젝트 루트 디렉터리에 `.env` 파일을 생성하고 발급받은 API 키를 입력합니다:
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### 5) 서버 실행
```powershell
py app.py
```

### 6) 웹 브라우저 접속
- **💻 PC 접속**: [http://127.0.0.1:5000](http://127.0.0.1:5000)
- **📱 스마트폰 접속**: `http://[내_컴퓨터_IP]:5000` (예: `http://10.211.5.31:5000`)
  > *스마트폰과 PC가 동일한 Wi-Fi 공유기에 연결되어 있어야 합니다.*

---

## 🛠️ 5. 기술 스택 (Tech Stack)

| 구분 | 기술 / 라이브러리 | 사용 목적 |
| :--- | :--- | :--- |
| **Backend** | Python 3, Flask | 웹 애플리케이션 서버 구축 및 라우팅 |
| **AI Integration** | `google-genai` SDK | 최신 Gemini 3.5 Flash-Lite 모델 API 연동 |
| **Config** | `python-dotenv` | API Key 및 환경 변수 보안 관리 |
| **Frontend** | HTML5, CSS3, Vanilla JS | 반응형 레이아웃, 실시간 DOM 조작, 로컬 스토리지 연동 |
| **Markdown** | `marked.js` (CDN) | AI 마크다운 텍스트를 실시간 서식 문서로 렌더링 |
| **Typography** | Pretendard | 가독성 높은 현대적인 본문 웹 폰트 |

---

## 📝 6. 라이선스 및 작성자 (Author & License)
- **작성자**: 남경민
- **라이선스**: MIT License
