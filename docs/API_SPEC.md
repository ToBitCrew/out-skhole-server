# CoSkhol API 명세서

> 실제 SQL 스키마(`out_skhole.sql`) 기반  
> 작성일: 2026-06-11 | 상태: 초안 (검토 필요)
> 수정일: 2026-06-16 | 상태: 라우트 Swagger 기준으로 갱신

---

## 목차

1. [개요](#1-개요)
2. [인증 (Auth)](#2-인증-auth)
3. [사용자 (Users)](#3-사용자-users)
4. [게시글 (Posts)](#4-게시글-posts)
5. [DM / 채팅 (Chat)](#5-dm--채팅-chat)
6. [학교 · 학과 조회 (Schools)](#6-학교--학과-조회-schools)
7. [카테고리 조회 (Categories)](#7-카테고리-조회-categories)
8. [부록: 확인 필요 사항](#8-부록-확인-필요-사항)

---

## 1. 개요

### Base URL

```
개발: http://localhost:3000/api/v1
운영: https://api.coskhole.com/v1   (추후 확정)
```

### 인증 방식

| 수준           | 설명                                            |
| -------------- | ----------------------------------------------- |
| 없음 (공개)    | 토큰 불필요                                     |
| JWT 필요       | `Authorization: Bearer <accessToken>` 헤더 필수 |
| JWT + 학교인증 | JWT 검증 후 `UserTB.permission >= 3` 추가 확인  |

- Access Token 유효기간: **1시간**
- Refresh Token 유효기간: **14일** (HttpOnly Cookie)

### 공통 응답 포맷

```json
// 성공
{
  "success": true,
  "data": { ... }
}

// 목록 성공 (페이지네이션)
{
  "success": true,
  "data": {
    "items": [ ... ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "hasNext": true
    }
  }
}

// 실패
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "사람이 읽을 수 있는 오류 설명"
  }
}
```

### 공통 에러 코드

| HTTP | code                | 설명                      |
| ---- | ------------------- | ------------------------- |
| 400  | `VALIDATION_ERROR`  | 요청 파라미터 유효성 오류 |
| 401  | `UNAUTHORIZED`      | 토큰 없음 또는 만료       |
| 403  | `FORBIDDEN`         | 권한 없음                 |
| 404  | `NOT_FOUND`         | 리소스 없음               |
| 409  | `CONFLICT`          | 중복 데이터 충돌          |
| 429  | `TOO_MANY_REQUESTS` | 요청 횟수 초과            |
| 500  | `INTERNAL_ERROR`    | 서버 내부 오류            |

### 회원 권한 등급 (`UserTB.permission`)

오타 수정 완료 ~~> ⚠️ 컬럼명 오타 주의: DB 컬럼 이름이 `permisson` (permission 아님)~~

| 값  | 설명             |
| --- | ---------------- |
| 0   | 비회원           |
| 1   | 일반 (기본 가입) |
| 2   | 본인인증 완료    |
| 3   | 학교인증 완료    |
| 8   | 운영자           |
| 9   | 관리자           |

---

## 2. 인증 (Auth)

### POST /auth/register — 회원가입

- 인증 수준: **없음**
- 관련 테이블: `UserTB`, `UserAuthTB`, `UserContactTB`
- 비고: 가입 시 `UserTB.permission = 1`, 이메일을 `UserContactTB`에 함께 저장

**Request Body**

| 필드      | 타입   | 필수 | 설명                                      |
| --------- | ------ | ---- | ----------------------------------------- |
| handle_nm | string | ✅   | 아이디 (영문·숫자·언더스코어, 4~20자)     |
| nick_nm   | string | ✅   | 닉네임 (2~20자)                           |
| password  | string | ✅   | 비밀번호 (8자 이상, bcrypt 저장)          |
| email     | string | ✅   | 이메일 (`UserContactTB.contact_type = 0`) |
| school_cd | string | ✅   | 학교 코드 (`School.school_cd`, CHAR(7))   |
| dept_cd   | string | ✅   | 학과 코드 (`SchoolDept.dept_cd`, CHAR(7)) |

**응답**

| 상태 | code               | 설명                  |
| ---- | ------------------ | --------------------- |
| 201  | —                  | 회원가입 성공         |
| 409  | `HANDLE_DUPLICATE` | 이미 사용 중인 아이디 |
| 409  | `EMAIL_DUPLICATE`  | 이미 등록된 이메일    |
| 400  | `VALIDATION_ERROR` | 유효성 검사 실패      |

```json
// 201 성공
{
  "success": true,
  "data": {
    "uid": 42,
    "handle_nm": "water_eagle",
    "nick_nm": "물수리"
  }
}
```

---

### POST /auth/login — 로그인

- 인증 수준: **없음**
- 관련 테이블: `UserTB`, `UserAuthTB`, `UserDeviceTB`, `UserPunishTB`
- 비고: `UserDeviceTB.uid`가 PK이므로 유저 1명당 기기 1개만 저장 (upsert)

**Request Body**

| 필드     | 타입   | 필수 | 설명                                           |
| -------- | ------ | ---- | ---------------------------------------------- |
| contact  | string | ✅   | 이메일 (type 0) 또는 전화번호 (type 1)         |
| password | string | ✅   | 비밀번호                                       |
| device   | string | ✅   | User-Agent 또는 디바이스 식별자                |
| location | string |      | 접속 위치 (선택, IP 기반 지오코딩 등)          |

**응답**

| 상태 | code                  | 설명                                         |
| ---- | --------------------- | -------------------------------------------- |
| 200  | —                     | 로그인 성공                                  |
| 401  | `INVALID_CREDENTIALS` | 이메일/전화번호 또는 비밀번호 불일치         |
| 403  | `ACCOUNT_SUSPENDED`   | 현재 활성 제재 존재 (`UserPunishTB` 기간 내) |
| 403  | `ACCOUNT_INACTIVE`    | 탈퇴 계정 (`UserTB.active = false`)          |

```json
// 200 성공
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "user": {
      "uid": 42,
      "nick_nm": "물수리",
      "handle_nm": "water_eagle",
      "profile_img": "https://...",
      "permission": 1
    }
  }
}
// refreshToken은 HttpOnly Cookie로 발급
```

---

### POST /auth/logout — 로그아웃

- 인증 수준: **JWT 필요**

**응답**

| 상태 | 설명                                   |
| ---- | -------------------------------------- |
| 200  | 로그아웃 성공 (refreshToken 쿠키 삭제) |

---

### POST /auth/refresh — Access Token 갱신

- 인증 수준: **없음** (refreshToken 쿠키 자동 전송)

**응답**

| 상태 | code                    | 설명                |
| ---- | ----------------------- | ------------------- |
| 200  | —                       | 새 accessToken 발급 |
| 401  | `REFRESH_TOKEN_EXPIRED` | Refresh Token 만료  |

```json
{
  "success": true,
  "data": { "accessToken": "eyJ..." }
}
```

---

### POST /auth/otp/send — 이메일 인증 코드 발송

- 인증 수준: **없음** (회원가입 전 이메일 인증) 또는 **JWT 필요** (학교 이메일 인증)
- 비고: 코드는 DB가 아닌 서버 메모리/Redis에 임시 저장 (유효기간 5분 권장)
  - `UserAuthOtpTB`는 **가입 후 2FA 앱 등록용** 테이블로, 이메일 OTP와 별도임

**Request Body**

| 필드    | 타입   | 필수 | 설명                                           |
| ------- | ------ | ---- | ---------------------------------------------- |
| email   | string | ✅   | 인증할 이메일 주소                             |
| purpose | string | ✅   | `"register"` \| `"school"` \| `"find_account"` |

**응답**

| 상태 | code                | 설명               |
| ---- | ------------------- | ------------------ |
| 200  | —                   | 발송 성공          |
| 429  | `TOO_MANY_REQUESTS` | 5분 내 재발송 불가 |

---

### POST /auth/otp/verify — 이메일 인증 코드 확인

- 인증 수준: **없음**

**Request Body**

| 필드    | 타입   | 필수 | 설명                                           |
| ------- | ------ | ---- | ---------------------------------------------- |
| email   | string | ✅   | 인증한 이메일                                  |
| otp     | string | ✅   | 수신한 6자리 코드                              |
| purpose | string | ✅   | `"register"` \| `"school"` \| `"find_account"` |

**응답**

| 상태 | code          | 설명                            |
| ---- | ------------- | ------------------------------- |
| 200  | —             | 인증 성공 (임시 검증 토큰 반환) |
| 400  | `INVALID_OTP` | 코드 불일치 또는 만료           |

```json
{
  "success": true,
  "data": { "verifyToken": "tmp_verify_..." }
}
```

---

### POST /auth/school/verify — 학교(대학) 인증

- 인증 수준: **JWT 필요** (permission >= 1)
- 관련 테이블: `UserUnivTB`
- 비고: 프로토타입 단계에서는 `application/json` 수신. 학생증 파일 업로드는 추후 multer + S3 연동 예정

**Request Body (application/json)**

| 필드               | 타입   | 필수 | 설명                                            |
| ------------------ | ------ | ---- | ----------------------------------------------- |
| school_mail        | string | ✅   | 학교 이메일 (`UserUnivTB.school_mail`)          |
| email_verify_token | string | ✅   | `/auth/otp/verify` 에서 받은 임시 토큰          |
| school_cd          | string | ✅   | 학교 코드 (`School.school_cd CHAR(7)`)          |
| department         | string | ✅   | 학부명 (`UserUnivTB.department`)                |
| school_major_id    | number | ✅   | 학과 ID (`UserUnivTB.school_major_id SMALLINT`) |
| grade              | number | ✅   | 학년 1~6 (`UserUnivTB.grade`)                   |

**응답**

| 상태 | code               | 설명                                           |
| ---- | ------------------ | ---------------------------------------------- |
| 200  | —                  | 학교 인증 성공 (`permission` → 3으로 업데이트) |
| 409  | `ALREADY_VERIFIED` | 이미 인증된 계정                               |

---

### POST /auth/identity/verify — 본인 인증 (NICE API)

- 인증 수준: **JWT 필요** (permission >= 1)
- 관련 테이블: `UserVerifyTB`
- 비고: 외부 본인확인 기관(NICE 등) 연동. `verify_ci` UNIQUE → 동일인 중복 계정 방지

**Request Body**

| 필드         | 타입   | 필수 | 설명                                  |
| ------------ | ------ | ---- | ------------------------------------- |
| verify_token | string | ✅   | 본인확인 기관에서 받은 인증 결과 토큰 |

**응답**

| 상태 | code                 | 설명                                                |
| ---- | -------------------- | --------------------------------------------------- |
| 200  | —                    | 본인 인증 성공 (`permission` → 2 이상으로 업데이트) |
| 409  | `IDENTITY_DUPLICATE` | 이미 다른 계정에 등록된 CI값                        |

---

## 3. 사용자 (Users)

### GET /users/me — 내 프로필 조회

- 인증 수준: **JWT 필요**
- 관련 테이블: `UserTB`, `UserUnivTB`, `UserVerifyTB`, `SchoolDept`, `School`

**응답 (200)**

```json
{
  "success": true,
  "data": {
    "uid": 42,
    "nick_nm": "물수리",
    "handle_nm": "water_eagle",
    "profile_img": "https://...",
    "profile_banner": "https://...",
    "permission": 3,
    "school_cd": "0000063",
    "school_nm": "OO대학교",
    "dept_cd": "0245926",
    "dept_nm": "컴퓨터공학과",
    "is_univ_verified": true,
    "is_identity_verified": false,
    "active": true
  }
}
```

---

### PATCH /users/me — 내 프로필 수정

- 인증 수준: **JWT 필요**
- 관련 테이블: `UserTB`

**Request Body (모두 선택)**

| 필드           | 타입   | 설명              |
| -------------- | ------ | ----------------- |
| nick_nm        | string | 닉네임 (2~20자)   |
| profile_img    | string | 프로필 이미지 URL |
| profile_banner | string | 배너 이미지 URL   |

**응답**

| 상태 | code             | 설명        |
| ---- | ---------------- | ----------- |
| 200  | —                | 수정 성공   |
| 409  | `NICK_DUPLICATE` | 닉네임 중복 |

---

### GET /users/:uid — 타 유저 프로필 조회

- 인증 수준: **JWT 필요**
- 관련 테이블: `UserTB`, `SchoolDept`, `School`

**Path Parameter**

| 파라미터 | 설명           |
| -------- | -------------- |
| uid      | 조회할 유저 ID |

**응답 (200)**

```json
{
  "success": true,
  "data": {
    "uid": 10,
    "nick_nm": "홍길동",
    "handle_nm": "gildong",
    "profile_img": "https://...",
    "profile_banner": "https://...",
    "school_nm": "OO대학교",
    "dept_nm": "컴퓨터공학과",
    "permission": 1
  }
}
```

---

### GET /users/me/contacts — 내 연락처 목록

- 인증 수준: **JWT 필요**
- 관련 테이블: `UserContactTB`

**응답 (200)**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "contact_id": 1,
        "contact": "user@example.com",
        "contact_type": 0,
        "contact_nm": "기본 이메일"
      }
    ]
  }
}
```

> `contact_type`: `0` 이메일, `1` 전화번호

---

### POST /users/me/contacts — 연락처 추가

- 인증 수준: **JWT 필요**
- 관련 테이블: `UserContactTB`

**Request Body**

| 필드         | 타입   | 필수 | 설명                            |
| ------------ | ------ | ---- | ------------------------------- |
| contact      | string | ✅   | 이메일 또는 전화번호            |
| contact_type | number | ✅   | `0`: 이메일, `1`: 전화번호      |
| contact_nm   | string | ✅   | 연락처 이름 (예: "학교 이메일") |

**응답**

| 상태 | code                | 설명               |
| ---- | ------------------- | ------------------ |
| 201  | —                   | 추가 성공          |
| 409  | `CONTACT_DUPLICATE` | 이미 등록된 연락처 |

---

### DELETE /users/me/contacts/:contactId — 연락처 삭제

- 인증 수준: **JWT 필요**

**응답 (200)**: `{ "success": true }`

---

### DELETE /users/me — 회원 탈퇴

- 인증 수준: **JWT 필요**
- 비고: `UserTB.active = false` (soft delete)

**응답**

| 상태 | 설명                         |
| ---- | ---------------------------- |
| 200  | 탈퇴 성공 (`active` → false) |

---

## 4. 게시글 (Posts)

### 게시글 타입 (`post_type`)

| 값  | 설명                                |
| --- | ----------------------------------- |
| 0   | 비공개 (임시저장)                   |
| 1   | 일반 게시글                         |
| 2   | 공지 (관리자/운영자만 작성)         |
| 3   | 질문 게시글 (`PostQuestionTB` 연결) |
| 4   | 마켓 게시글 (`PostSaleTB` 연결)     |

### 게시글 상태 (`post_status`)

| 값  | 설명                       |
| --- | -------------------------- |
| 0   | 관리자 게시글 (admin 전용) |
| 1   | 비공개 (기본)              |
| 2   | 공개 (공개 상태)           |
| 3   | 삭제됨 (soft delete)       |
| 4   | 정지됨 (신고·제재)         |

### 댓글 구조

> 별도 댓글 테이블 없음. `PostTB.post_id_top` 으로 계층 구현:
>
> - 최상위 게시글: `post_id_top = 0` (또는 자기 자신 `post_id`)
> - 댓글/대댓글: `post_id_top` = 부모 게시글 ID

---

### GET /posts — 게시글 목록

- 인증 수준: **JWT 필요**
- 관련 테이블: `PostTB`, `PostSubCategoryTB`, `PostTagMapTB`, `PostTagTB`

**Query Parameters**

| 파라미터   | 타입   | 필수 | 설명                                 |
| ---------- | ------ | ---- | ------------------------------------ |
| page       | number |      | 페이지 (기본값: 1)                   |
| limit      | number |      | 개수 (기본값: 20, 최대: 50)          |
| post_type  | number |      | 게시글 타입 (2=일반, 3=질문, 4=마켓) |
| sub_cat_cd | number |      | 서브 카테고리 ID (`EduSubCategory`)  |
| school_cd  | string |      | 학교 코드 필터 (작성자 학교 기준)    |

**응답 (200)**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "post_id": 1,
        "post_type": 3,
        "post_status": 2,
        "post_title": "중간고사 공부 어떻게 해요?",
        "write_dt": "2026-06-11T09:00:00Z",
        "like_cnt": 12,
        "bookmark_cnt": 3,
        "comment_cnt": 5,
        "author": {
          "uid": 42,
          "nick_nm": "물수리",
          "profile_img": "https://..."
        },
        "tags": ["중간고사", "공부법"]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 85,
      "hasNext": true
    }
  }
}
```

---

### GET /posts/search — 게시글 검색

- 인증 수준: **JWT 필요**
- 관련 테이블: `PostTB`, `PostTagMapTB`, `PostTagTB`

**Query Parameters**

| 파라미터     | 타입   | 필수 | 설명                       |
| ------------ | ------ | ---- | -------------------------- |
| q            | string | ✅   | 검색어 (제목·내용·태그)    |
| page         | number |      | 페이지                     |
| limit        | number |      | 개수                       |
| post_type    | number |      | 게시글 타입 필터           |
| major_cat_cd | string |      | 전공 대분류 필터 (CHAR(1)) |
| mid_cat_cd   | number |      | 전공 중분류 필터           |

**응답**: 목록 응답과 동일한 구조

---

### GET /posts/tags/autocomplete — 태그 자동완성

- 인증 수준: **JWT 필요**
- 관련 테이블: `PostTagTB`

**Query Parameters**

| 파라미터 | 타입   | 필수 | 설명              |
| -------- | ------ | ---- | ----------------- |
| q        | string | ✅   | 태그 접두사 검색  |
| limit    | number |      | 결과 수 (기본 10) |

**응답 (200)**

```json
{
  "success": true,
  "data": {
    "items": [{ "tag_name": "중간고사", "use_cnt": 42 }]
  }
}
```

---

### GET /posts/:postId — 게시글 상세

- 인증 수준: **JWT 필요**
- 관련 테이블: `PostTB`, `PostQuestionTB`, `PostSaleTB`, `PostAssetTB`, `PostTagMapTB`

**응답 (200)**

```json
{
  "success": true,
  "data": {
    "post_id": 1,
    "post_ver": 0,
    "post_type": 2,
    "post_status": 1,
    "post_title": "중간고사 공부 어떻게 해요?",
    "post_content": "전체 내용...",
    "write_dt": "2026-06-11T09:00:00Z",
    "edit_dt": "2026-06-11T10:00:00Z",
    "like_cnt": 12,
    "bookmark_cnt": 3,
    "author": {
      "uid": 42,
      "nick_nm": "물수리",
      "profile_img": "https://..."
    },
    "assets": [{ "post_asset_id": 1, "post_asset_url": "https://..." }],
    "tags": ["중간고사", "공부법"],
    "question": null,
    "sale": null
  }
}
```

> `post_type=3` 이면 `question: { archive: false, pii_mask: false }` 포함  
> `post_type=4` 이면 `sale: { item_nm: "전공책", item_type: 0, item_status: 1, price: 5000, sold: false }` 포함

---

### POST /posts — 게시글 작성

- 인증 수준: **JWT 필요** (permission >= 1)
- 관련 테이블: `PostTB`, `PostQuestionTB`, `PostSaleTB`, `PostTagMapTB`, `PostSubCategoryTB`

**Request Body**

| 필드         | 타입     | 필수 | 설명                                                             |
| ------------ | -------- | ---- | ---------------------------------------------------------------- |
| post_title   | string   | ✅   | 제목 (최대 255자)                                                |
| post_content | string   | ✅   | 본문 (TEXT)                                                      |
| post_type    | number   | ✅   | 2=일반, 3=질문, 4=마켓 (0=비공개/임시저장)                       |
| post_status  | number   | ✅   | `0`: 비공개(임시저장), `1`: 기본(공개)                           |
| sub_cat_cd  | number[] |      | 서브 카테고리 ID 목록 (`PostSubCategoryTB`)                      |
| tags         | string[] |      | 태그 목록 최대 5개 (없으면 `PostTagTB` 신규 생성)                |
| question     | object   |      | `post_type=3` 일 때 `{ pii_mask: boolean }`                      |
| sale         | object   |      | `post_type=4` 일 때 `{ item_nm, item_type, item_status, price }` |

**응답**

| 상태 | 설명             |
| ---- | ---------------- |
| 201  | 게시글 작성 성공 |

```json
{
  "success": true,
  "data": { "post_id": 99 }
}
```

---

### PATCH /posts/:postId — 게시글 수정

- 인증 수준: **JWT 필요 (작성자 본인 또는 관리자)**
- 비고: 수정 시 `edit_dt` 자동 갱신

**Request Body** (수정할 필드만 포함)

| 필드         | 타입     | 설명                                               |
| ------------ | -------- | -------------------------------------------------- |
| post_title   | string   | 제목                                               |
| post_content | string   | 본문                                               |
| post_status  | number   | 상태 (0=비공개, 1=공개)                            |
| tags         | string[] | 태그 목록 (기존 전체 교체)                         |
| sale         | object   | 판매 정보 수정 (`sold`, `item_status`, `price` 등) |

**응답**

| 상태 | code        | 설명             |
| ---- | ----------- | ---------------- |
| 200  | —           | 수정 성공        |
| 403  | `FORBIDDEN` | 본인 게시글 아님 |

---

### DELETE /posts/:postId — 게시글 삭제

- 인증 수준: **JWT 필요 (작성자 본인 또는 관리자)**
- 비고: `post_status = 2` (soft delete)

**응답**

| 상태 | code        | 설명                                       |
| ---- | ----------- | ------------------------------------------ |
| 200  | —           | 삭제 성공 (soft delete: `post_status = 2`) |
| 403  | `FORBIDDEN` | 권한 없음                                  |

---

### POST /posts/:postId/assets — 첨부파일 업로드

- 인증 수준: **JWT 필요 (작성자 본인)**
- 관련 테이블: `PostAssetTB`

**Request Body (multipart/form-data)**

| 필드  | 타입   | 설명                              |
| ----- | ------ | --------------------------------- |
| files | file[] | 이미지/파일 (최대 10MB, 최대 5개) |

**응답 (201)**

```json
{
  "success": true,
  "data": [{ "post_asset_id": 5, "post_asset_url": "https://..." }]
}
```

---

### POST /posts/:postId/like — 좋아요

- 인증 수준: **JWT 필요**
- 비고: `PostTB.like_cnt` 카운터만 증가. 유저별 기록 테이블 없음 → 중복 방지 방법 결정 필요

**응답**

| 상태 | code            | 설명                 |
| ---- | --------------- | -------------------- |
| 200  | —               | 좋아요 성공          |
| 409  | `ALREADY_LIKED` | 이미 좋아요한 게시글 |

```json
{
  "success": true,
  "data": { "like_cnt": 13 }
}
```

---

### DELETE /posts/:postId/like — 좋아요 취소

- 인증 수준: **JWT 필요**

**응답 (200)**

```json
{
  "success": true,
  "data": { "like_cnt": 12 }
}
```

---

### POST /posts/:postId/bookmark — 북마크

- 인증 수준: **JWT 필요**
- 비고: `PostTB.bookmark_cnt` 카운터만 증가. 좋아요와 동일하게 유저별 기록 테이블 없음

**응답**

| 상태 | code                 | 설명                 |
| ---- | -------------------- | -------------------- |
| 200  | —                    | 북마크 성공          |
| 409  | `ALREADY_BOOKMARKED` | 이미 북마크한 게시글 |

---

### DELETE /posts/:postId/bookmark — 북마크 취소

- 인증 수준: **JWT 필요**

**응답 (200)**: `{ "success": true }`

---

### GET /posts/:postId/comments — 댓글 목록

- 인증 수준: **JWT 필요**
- 관련 테이블: `PostTB` (`post_id_top = postId` 조건으로 조회)

**Query Parameters**

| 파라미터 | 타입   | 설명               |
| -------- | ------ | ------------------ |
| page     | number | 페이지 (기본값: 1) |
| limit    | number | 개수 (기본값: 20)  |

**응답 (200)**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "post_id": 100,
        "post_id_top": 1,
        "post_content": "저는 이렇게 했어요!",
        "post_status": 1,
        "write_dt": "2026-06-11T11:00:00Z",
        "author": {
          "uid": 10,
          "nick_nm": "홍길동",
          "profile_img": "https://..."
        }
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 5, "hasNext": false }
  }
}
```

---

### POST /posts/:postId/comments — 댓글 작성

- 인증 수준: **JWT 필요**
- 관련 테이블: `PostTB` (새 행 삽입, `post_id_top = postId`)

**Request Body**

| 필드           | 타입   | 필수 | 설명                                   |
| -------------- | ------ | ---- | -------------------------------------- |
| post_content   | string | ✅   | 댓글 내용                              |
| parent_post_id | number |      | 대댓글이면 부모 댓글 ID (기본: postId) |

**응답 (201)**

```json
{
  "success": true,
  "data": { "post_id": 100 }
}
```

---

### DELETE /posts/:postId/comments/:commentId — 댓글 삭제

- 인증 수준: **JWT 필요 (작성자 본인 또는 관리자)**
- 비고: soft delete (`post_status = 2`)

**응답 (200)**: `{ "success": true }`

---

## 5. DM / 채팅 (Chat)

### GET /chats — 채팅방(DM) 목록

- 인증 수준: **JWT 필요**
- 관련 테이블: `ChatRoomTB`, `ChatBlockTB`, `UserTB`

**응답 (200)**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "chat_room_id": 1,
        "last_message": "안녕하세요!",
        "last_message_dt": "2026-06-11T12:00:00Z",
        "unread_cnt": 2,
        "conversation_active": true,
        "partner": {
          "uid": 10,
          "nick_nm": "홍길동",
          "profile_img": "https://..."
        }
      }
    ]
  }
}
```

---

### POST /chats — 채팅방 생성 (또는 기존 방 반환)

- 인증 수준: **JWT 필요**
- 관련 테이블: `ChatRoomTB`
- 비고: `user_a_id`, `user_b_id` 조합으로 기존 방 조회 후 없으면 신규 생성

**Request Body**

| 필드        | 타입   | 필수 | 설명            |
| ----------- | ------ | ---- | --------------- |
| partner_uid | number | ✅   | DM 대상 유저 ID |

**응답**

| 상태 | 설명             |
| ---- | ---------------- |
| 200  | 기존 채팅방 반환 |
| 201  | 새 채팅방 생성   |

```json
{
  "success": true,
  "data": { "chat_room_id": 1 }
}
```

---

### DELETE /chats/:roomId — 채팅방 나가기

- 인증 수준: **JWT 필요 (채팅방 참여자)**
- 관련 테이블: `ChatRoomTB`
- 비고: 양쪽 모두 나갔을 때 `conversation_active = false`

**응답 (200)**: `{ "success": true }`

---

### GET /chats/:roomId/messages — 메시지 목록

- 인증 수준: **JWT 필요 (채팅방 참여자)**
- 관련 테이블: `ChatBlockTB`, `ChatBlockFileTB`
- 비고: cursor 기반 페이지네이션 (무한스크롤)

**Query Parameters**

| 파라미터 | 타입   | 설명                                                    |
| -------- | ------ | ------------------------------------------------------- |
| before   | number | 이 `chat_msg_id` 이전 메시지 로드 (없으면 최신부터)     |
| limit    | number | 개수 (기본값: 30)                                       |

**응답 (200)**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "chat_block_id": 55,
        "sender_id": 42,
        "chat_content": "안녕하세요!",
        "chat_message_type": 0,
        "sent_dt": "2026-06-11T12:00:00Z",
        "is_read": true,
        "del_by_sender": false,
        "del_by_receiver": false,
        "files": []
      }
    ],
    "has_prev": true,
    "next_cursor": 30
  }
}
```

> `chat_message_type`: `0` 텍스트, `1` 이미지, `2` 동영상  
> `files` (from `ChatBlockFileTB`): `[{ chat_block_media_id, chat_file_url, chat_file_type, chat_file_name, chat_file_size, chat_file_mime_type }]`

---

### POST /chats/:roomId/messages — 메시지 전송

- 인증 수준: **JWT 필요 (채팅방 참여자)**
- 관련 테이블: `ChatBlockTB`, `ChatBlockFileTB`

**Request Body (application/json)**

| 필드     | 타입   | 필수 | 설명                                    |
| -------- | ------ | ---- | --------------------------------------- |
| content  | string | ✅   | 메시지 내용                             |
| msg_type | number |      | `0`: 텍스트(기본), `1`: 이미지          |

**응답 (201)**

```json
{
  "success": true,
  "data": {
    "chat_block_id": 56,
    "sent_dt": "2026-06-11T12:05:00Z"
  }
}
```

---

### PATCH /chats/:roomId/messages/read — 메시지 읽음 처리

- 인증 수준: **JWT 필요**
- 비고: 내가 받은 메시지 전체 `is_read = true`

**응답 (200)**: `{ "success": true }`

---

### DELETE /chats/:roomId/messages/:messageId — 메시지 삭제

- 인증 수준: **JWT 필요 (채팅방 참여자)**
- 비고: 발신자이면 `del_by_sender = true`, 수신자이면 `del_by_receiver = true`

**응답 (200)**: `{ "success": true }`

---

## 6. 학교 · 학과 조회 (Schools)

### GET /schools — 학교 검색

- 인증 수준: **없음**
- 관련 테이블: `School`

**Query Parameters**

| 파라미터  | 타입   | 필수 | 설명                             |
| --------- | ------ | ---- | -------------------------------- |
| q         | string |      | 학교명 검색                      |
| region    | string |      | 지역 필터 (예: `"서울"`)         |
| univ_type | string |      | 유형 필터 (대학/전문대학/대학원) |

**응답 (200)**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "school_cd": "0000063",
        "school_nm": "OO대학교",
        "univ_type": "대학",
        "campus_type": "본교",
        "region": "서울"
      }
    ]
  }
}
```

---

### GET /schools/:schoolCd/departments — 학과 목록

- 인증 수준: **없음**
- 관련 테이블: `SchoolDept`

**Query Parameters**

| 파라미터  | 타입    | 설명                        |
| --------- | ------- | --------------------------- |
| q         | string  | 학과명 검색                 |
| is_active | boolean | 운영 중 여부 (기본: `true`) |

**응답 (200)**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "dept_cd": "0245926",
        "dept_nm": "컴퓨터공학과",
        "college_nm": "공과대학",
        "college_cd": "E001",
        "dept_type": "일반과정",
        "degree_type": "학사",
        "day_night": 1,
        "degree_term": "4년",
        "is_active": 1
      }
    ]
  }
}
```

---

## 7. 카테고리 조회 (Categories)

### GET /categories — 전체 카테고리 트리

- 인증 수준: **없음**
- 관련 테이블: `EduMajorCategoryTB`, `EduMidCategoryTB`, `EduSubCategoryTB`

**응답 (200)**

```json
{
  "success": true,
  "data": [
    {
      "major_cat_cd": "01",
      "cat_major_nm": "학습",
      "children": [
        {
          "sub_cat_cd": 1,
          "sub_cat_nm": "스터디모집"
        }
      ]
    }
  ]
}
```

---

## 8. 부록: 확인 필요 사항

### 스키마 불일치 / 설계 이슈

| #   | 항목                                         | SQL 현황                                               | 결정/수정 필요                                               | 수정                                                                       |
| --- | -------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------ | -------------------------------------------------------------------------- |
| 1   | `ChatBlockTB.chat_content` 길이              | `VARCHAR(50)` — 50자 제한                              | 실제 채팅은 50자보다 길 수 있어 `TEXT` 또는 길이 확대 필요   | `VARCHAR(255)` — 255자 제한 설정                                           |
| 2   | `UserUnivTB.school_id` 타입                  | `SMALLINT` — `School.school_cd CHAR(7)` 과 타입 불일치 | FK 없는 별도 필드인지, 아니면 타입 오류인지 확인 필요        | `UserUnivTB.school_id smallint(6)` --> `UserUnivTB.school_cd CHAR(7)` 변경 |
| 3   | `PostTagTB.id` AUTO_INCREMENT 없음           | `id INT NOT NULL` — 수동 관리                          | AUTO_INCREMENT 추가 여부 결정 필요                           | AUTO_INCREMENT 추가                                                        |
| 4   | `UserPunishTB.punish_id` AUTO_INCREMENT 없음 | `punish_id INT NOT NULL`                               | AUTO_INCREMENT 추가 여부 결정 필요                           | AUTO_INCREMENT 추가                                                        |
| 5   | 학생증 이미지 저장 방식                      | `BLOB` (DB 직접 저장)                                  | BLOB은 DB 부하가 큼 → 파일 스토리지(S3 등) + URL로 교체 고려 | `VerifyFileTB` 테이블에 저장 및 파일 스토리지(S3 등) + URL로 교체 설정함   |

### 미결 설계 사항

| #   | 항목                    | 현황                                              | 결정 필요                                             |
| --- | ----------------------- | ------------------------------------------------- | ----------------------------------------------------- |
| 6   | 좋아요·북마크 중복 방지 | 카운터(`like_cnt`)만 있고 유저별 기록 테이블 없음 | 유저별 기록 테이블 추가 또는 Redis Set으로 관리       |
| 7   | 알림 기능               | 알림 테이블 없음                                  | `NotificationTB` 추가 또는 외부 푸시 서비스 방식      |
| 8   | 실시간 채팅             | REST 엔드포인트로 명세                            | DM 전송을 REST로 폴링할지 Socket.io(WebSocket)로 할지 |
| 9   | 파일 저장 위치          | 미정                                              | 로컬 디스크 / AWS S3 / Cloudflare R2 선택 필요        |
| 10  | 학생증 인증 승인 방식   | 미정                                              | 관리자가 수동으로 승인하는지 자동화인지               |

### 프로토타입 제한 사항 (나중에 교체 필요)

| **항목**                | **현재 상태**               | **교체 필요**                |
| ----------------------- | --------------------------- | ---------------------------- |
| 좋아요·북마크 중복 방지 | 인메모리 Map                | DB 테이블 또는 Redis         |
| OTP 저장                | 인메모리 Map                | Redis                        |
| 이메일 발송             | `console.log` 출력          | nodemailer 연동              |
| 파일 업로드             | URL 직접 수신               | multer + S3                  |
| NICE 본인인증           | mock CI/DI                  | 실제 NICE API 연동           |
| `post_id` 등 PK 생성    | `MAX+1` (레이스컨디션 가능) | AUTO_INCREMENT로 스키마 변경 |
