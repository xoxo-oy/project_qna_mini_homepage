오버뷰, 테스트 전용 프로토타입 서버 구현

서버 구동 순서

0. 백엔드 서버와 프론트앤드 서버 두 서버를 띄워야 함.

1. backend 폴더에 위치해서 npm i, npx prisma migrate dev, npm run dev 순서로 진행 (포트 3001 추천하지만 상관없음)
2. .env에 DATEBASE_URL, JWT_SECRET, OPENAI_API_KEY 입력.

3. QnA-AI-2 폴더에 위치해서 npm i, npm run dev 순서로 진행 (포트 3002 추천하지만 상관없음)
4. ./services/api.ts 들어가서 API 아이피 주소를 localhost:3001로 바꿔야함.

5. http://localhost:3002 로 접속
