const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'OutSkhole API',
      version: '1.0.0',
      description: '대학교 커뮤니티 서비스 API 문서',
    },
    servers: [{ url: 'http://localhost:3000/api/v1', description: '로컬 개발 서버' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: '로그인 후 발급된 accessToken을 입력하세요',
        },
      },
      schemas: {
        Pagination: {
          type: 'object',
          properties: {
            page:    { type: 'integer', example: 1 },
            limit:   { type: 'integer', example: 20 },
            total:   { type: 'integer', example: 100 },
            hasNext: { type: 'boolean', example: true },
          },
        },
        Author: {
          type: 'object',
          properties: {
            uid:         { type: 'integer', example: 1 },
            nick_nm:     { type: 'string',  example: '홍길동' },
            profile_img: { type: 'string',  nullable: true, example: 'https://cdn.example.com/img.jpg' },
          },
        },
        PostListItem: {
          type: 'object',
          properties: {
            post_id:      { type: 'integer', example: 1 },
            post_type:    { type: 'integer', example: 1, description: '1: 일반, 2: 공지, 3: 질문, 4: 중고거래' },
            post_status:  { type: 'integer', example: 1 },
            post_title:   { type: 'string',  example: '공지사항 제목입니다' },
            write_dt:     { type: 'string',  format: 'date-time' },
            like_cnt:     { type: 'integer', example: 5 },
            bookmark_cnt: { type: 'integer', example: 2 },
            comment_cnt:  { type: 'integer', example: 3 },
            author:       { $ref: '#/components/schemas/Author' },
            tags:         { type: 'array', items: { type: 'string' }, example: ['태그1', '태그2'] },
          },
        },
        PostDetail: {
          allOf: [
            { $ref: '#/components/schemas/PostListItem' },
            {
              type: 'object',
              properties: {
                post_ver:     { type: 'integer', example: 1 },
                post_content: { type: 'string',  example: '게시글 본문 내용입니다.' },
                edit_dt:      { type: 'string',  format: 'date-time', nullable: true },
                assets: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      post_asset_id:  { type: 'integer', example: 1 },
                      post_asset_url: { type: 'string',  example: 'https://cdn.example.com/file.jpg' },
                    },
                  },
                },
                question: {
                  type: 'object',
                  nullable: true,
                  properties: {
                    archive:  { type: 'boolean', example: false },
                    pii_mask: { type: 'boolean', example: false },
                  },
                },
                sale: {
                  type: 'object',
                  nullable: true,
                  properties: {
                    item_nm:     { type: 'string',  example: '아이폰 14' },
                    item_type:   { type: 'integer', example: 1 },
                    item_status: { type: 'integer', example: 1 },
                    price:       { type: 'integer', example: 500000 },
                    sold:        { type: 'boolean', example: false },
                  },
                },
              },
            },
          ],
        },
        Comment: {
          type: 'object',
          properties: {
            post_id:      { type: 'integer', example: 10 },
            post_id_top:  { type: 'integer', example: 1 },
            post_content: { type: 'string',  example: '댓글 내용입니다.' },
            post_status:  { type: 'integer', example: 1 },
            write_dt:     { type: 'string',  format: 'date-time' },
            author:       { $ref: '#/components/schemas/Author' },
          },
        },
        UserProfile: {
          type: 'object',
          properties: {
            uid:                  { type: 'integer', example: 1 },
            nick_nm:              { type: 'string',  example: '홍길동' },
            handle_nm:            { type: 'string',  example: 'honggildong' },
            profile_img:          { type: 'string',  nullable: true },
            profile_banner:       { type: 'string',  nullable: true },
            permission:           { type: 'integer', example: 3 },
            school_cd:            { type: 'string',  example: '7010417' },
            school_nm:            { type: 'string',  example: '서울대학교' },
            dept_cd:              { type: 'string',  example: '001' },
            dept_nm:              { type: 'string',  example: '컴퓨터공학과' },
            is_univ_verified:     { type: 'boolean', example: true },
            is_identity_verified: { type: 'boolean', example: false },
            active:               { type: 'boolean', example: true },
          },
        },
        UserPublic: {
          type: 'object',
          properties: {
            uid:            { type: 'integer', example: 1 },
            nick_nm:        { type: 'string',  example: '홍길동' },
            handle_nm:      { type: 'string',  example: 'honggildong' },
            profile_img:    { type: 'string',  nullable: true },
            profile_banner: { type: 'string',  nullable: true },
            school_nm:      { type: 'string',  example: '서울대학교' },
            dept_nm:        { type: 'string',  example: '컴퓨터공학과' },
            permission:     { type: 'integer', example: 3 },
          },
        },
        Contact: {
          type: 'object',
          properties: {
            contact_id:   { type: 'integer', example: 1 },
            contact:      { type: 'string',  example: 'user@example.com' },
            contact_type: { type: 'integer', example: 0, description: '0: 이메일, 1: 전화번호' },
            contact_nm:   { type: 'string',  example: '기본 이메일' },
          },
        },
        ChatRoom: {
          type: 'object',
          properties: {
            chat_room_id:  { type: 'integer', example: 1 },
            partner:       { $ref: '#/components/schemas/Author' },
            last_message:  { type: 'string',  nullable: true, example: '안녕하세요!' },
            unread_cnt:    { type: 'integer', example: 3 },
            updated_at:    { type: 'string',  format: 'date-time' },
          },
        },
        Message: {
          type: 'object',
          properties: {
            chat_msg_id:  { type: 'integer', example: 1 },
            chat_room_id: { type: 'integer', example: 1 },
            sender_uid:   { type: 'integer', example: 1 },
            content:      { type: 'string',  example: '안녕하세요!' },
            msg_type:     { type: 'integer', example: 0, description: '0: 텍스트' },
            created_at:   { type: 'string',  format: 'date-time' },
          },
        },
        School: {
          type: 'object',
          properties: {
            school_cd: { type: 'string', example: '7010417' },
            school_nm: { type: 'string', example: '서울대학교' },
          },
        },
        Department: {
          type: 'object',
          properties: {
            dept_cd: { type: 'string', example: '001' },
            dept_nm: { type: 'string', example: '컴퓨터공학과' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string',  example: '오류 메시지' },
            code:    { type: 'string',  example: 'ERROR_CODE' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

module.exports = swaggerJsdoc(options);
