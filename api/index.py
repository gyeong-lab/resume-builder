import os
import sys

# Vercel Serverless 실행 환경에서 프로젝트 루트 경로를 sys.path에 등록
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app

# Vercel은 이 파일 내의 WSGI 'app' 객체를 진입점으로 사용합니다.
