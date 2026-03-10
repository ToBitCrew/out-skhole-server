# OutSkhole 백엔드

- 백엔드: NodeJS
- DBMS: MariaDB

| **항목**         | **제안**                         |
| ---------------- | -------------------------------- |
| 실시간 채팅      | Socket.io (Node.js랑 궁합 좋음)  |
| 이미지 업로드    | AWS S3 or Cloudinary (무료 플랜) |
| 학교 이메일 인증 | Nodemailer + OTP                 |
| 검색 기능        | MariaDB FULLTEXT 인덱스          |

## 설치한 패키지 목록

express # 웹 프레임워크
mysql2 # MariaDB 연결
dotenv # 환경변수
cors # CORS 설정
jsonwebtoken # JWT 인증
bcrypt # 비밀번호 암호화
nodemon # 개발용 자동재시작(옵션 -D)
