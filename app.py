import os
import logging
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
from google import genai

# 1. 환경변수 로드 (.env 파일에서 GEMINI_API_KEY 읽기)
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

# 2. 로깅 설정 (요청, 응답, 오류를 터미널에 명확히 출력)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

# 3. Flask 앱 생성
app = Flask(__name__)

# 4. Gemini API 클라이언트 초기화
if not api_key:
    logger.warning("경고: GEMINI_API_KEY가 .env 파일에 설정되지 않았습니다.")
    client = None
else:
    client = genai.Client(api_key=api_key)

# 5. 메인 홈 화면 라우트
@app.route("/")
def index():
    return render_template("index.html")

# 6. 이력서 및 포트폴리오 생성 API 라우트
@app.route("/generate", methods=["POST"])
def generate():
    try:
        # 클라이언트에서 전송한 JSON 데이터 수신
        data = request.get_json()
        if not data:
            logger.warning("[검증 실패] 요청 데이터가 비어 있습니다.")
            return jsonify({
                "success": False,
                "error": "요청 데이터가 전달되지 않았습니다. 입력을 확인해 주세요."
            }), 400

        name = data.get("name", "").strip()
        job_title = data.get("job_title", "").strip()
        experience = data.get("experience", "").strip()
        projects = data.get("projects", "").strip()
        tone = data.get("tone", "전문적이고 신뢰감 있는").strip()
        prompt_type = data.get("prompt_type", "A").strip()

        # Backend 입력 검증 (필수 입력값 누락 체크)
        if not name:
            return jsonify({"success": False, "error": "이름을 입력해 주세요."}), 400
        if not job_title:
            return jsonify({"success": False, "error": "지원 직무를 입력해 주세요."}), 400
        if not experience:
            return jsonify({"success": False, "error": "경력 사항을 입력해 주세요."}), 400
        if not projects:
            return jsonify({"success": False, "error": "주요 프로젝트 내용을 입력해 주세요."}), 400

        logger.info(f"[요청 수신] 이름: {name}, 지원 직무: {job_title}, 프롬프트 모드: {prompt_type}, 톤: {tone}")

        # API 키 검증
        if not client:
            logger.error("[오류] Gemini API 클라이언트가 초기화되지 않았습니다. .env 파일을 확인하세요.")
            return jsonify({
                "success": False,
                "error": "서버에 Gemini API 키가 설정되지 않았습니다. .env 파일을 확인해 주세요."
            }), 500

        # Prompt 엔지니어링: Prompt A(일반) vs Prompt B(전문가)
        if prompt_type == "B":
            # Prompt B: 전문가 모드 (STAR 기법, 구체적 성과 수치화, 심층 역량 분석)
            system_instruction = (
                "당신은 글로벌 테크 기업의 시니어 테크니컬 리크루터이자 포트폴리오 컨설턴트입니다. "
                "지원자의 경험을 분석하여 채용 담당자의 시선을 사로잡는 강력한 이력서와 포트폴리오 초안을 작성하세요. "
                "STAR(Situation, Task, Action, Result) 기법을 적극 활용하고, 직무 역량을 증명할 수 있는 설득력 있는 표현을 사용하세요."
            )
            prompt_content = f"""
다음 지원자 정보를 바탕으로 전문적이고 완성도 높은 [이력서(Resume)]와 [포트폴리오(Portfolio)] 초안을 Markdown 형식으로 작성해 주세요.

## 지원자 정보
- 이름: {name}
- 지원 직무: {job_title}
- 주요 경력: {experience}
- 수행 프로젝트: {projects}
- 희망 어조/톤: {tone} (전문가적 깊이와 자신감 강조)

## 작성 가이드라인 (전문가 모드 B)
1. **이력서 (Resume)**
   - 프로필 요약 (Executive Summary): 3~4줄로 지원자의 핵심 가치 정의
   - 핵심 직무 역량 (Key Skills): 기술, 도구, 협업 능력 등을 항목화
   - 상세 경력 사항 (Professional Experience): STAR 기법을 적용하여 역할, 기여도, 성과를 명확히 작성
2. **포트폴리오 (Portfolio)**
   - 프로젝트 개요 및 문제 정의 (Problem Statement)
   - 기술적 해결 과정 및 핵심 기능 (Solution & Tech Stack)
   - 프로젝트 성과 및 배운 점 (Impact & Retrospective)
3. 형식: 가독성이 뛰어난 깔끔한 마크다운(Markdown) 문서로 구성해 주세요.
"""
        else:
            # Prompt A: 일반 모드 (가독성 높은 표준 이력서 및 직관적인 포트폴리오)
            system_instruction = (
                "당신은 친절하고 전문적인 커리어 코치입니다. "
                "지원자의 기본 정보를 바탕으로 정갈하고 명확하며 읽기 쉬운 표준 이력서와 포트폴리오 초안을 작성하세요."
            )
            prompt_content = f"""
다음 지원자 정보를 바탕으로 읽기 쉽고 정갈한 [이력서(Resume)]와 [포트폴리오(Portfolio)] 초안을 Markdown 형식으로 작성해 주세요.

## 지원자 정보
- 이름: {name}
- 지원 직무: {job_title}
- 주요 경력: {experience}
- 수행 프로젝트: {projects}
- 희망 어조/톤: {tone}

## 작성 가이드라인 (일반 모드 A)
1. **이력서 (Resume)**
   - 한 줄 소개 및 기본 인적사항
   - 보유 기술 및 주요 강점
   - 경력 요약 및 담당 업무
2. **포트폴리오 (Portfolio)**
   - 프로젝트 소개 및 담당 역할
   - 주요 기능 및 사용 기술
3. 형식: 지원자가 바로 복사하거나 수정하여 활용할 수 있도록 Markdown 양식으로 정돈해 주세요.
"""

        # Gemini API 호출
        full_prompt = f"{system_instruction}\n\n{prompt_content}"
        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=full_prompt
        )

        generated_text = response.text
        if not generated_text:
            logger.error("[오류] Gemini 응답 결과가 비어 있습니다.")
            return jsonify({
                "success": False,
                "error": "AI 응답을 생성하지 못했습니다. 다시 시도해 주세요."
            }), 500

        logger.info(f"[응답 성공] {name}님의 이력서/포트폴리오 생성 완료 (길이: {len(generated_text)}자)")

        return jsonify({
            "success": True,
            "result": generated_text
        })

    except Exception as e:
        logger.error(f"[서버 오류 발생] {str(e)}", exc_info=True)
        return jsonify({
            "success": False,
            "error": f"서버 처리 중 오류가 발생했습니다: {str(e)}"
        }), 500

# 7. 서버 실행 진입점
if __name__ == "__main__":
    logger.info("Flask 서버를 시작합니다. http://127.0.0.1:5000 에 접속하세요.")
    app.run(host="127.0.0.1", port=5000, debug=True)
