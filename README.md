# TKS Chat Analyzer

> **Transactive Knowledge Sharing** 채팅 분석 도구
> Noroozi et al. 루브릭 기반 협력학습 대화 자동 분류 + AI 심화 분석

## 개요

초등학교 수업 맥락에서 학습자 간 채팅 대화를 분석하여 **Transactive Knowledge Sharing** 유형을 자동 분류하는 Next.js 웹 애플리케이션입니다.

### 핵심 루브릭 (Noroozi et al.)

| 코드 | 한국어 | 설명 |
|------|--------|------|
| No Reaction | 무반응 | 이전 발화를 참조하지 않는 무반응 또는 형식적 답변 |
| Externalization | 외재화 | 이전 메시지 없이 자신의 지식을 독립적으로 서술 |
| Acceptance | 수용 | 수정 없이 이전 발화에 동의 |
| Elicitation | 유도 | 파트너의 반응을 요청하거나 질문 |
| Integration | 통합 | 파트너 관점을 채택하여 새로운 종합 생성 |
| Conflict | 갈등 | 이전 발화를 거부·대체·수정 (rejection / replacement / amendment) |

---

## 기술 스택

- **Framework**: Next.js 14+ (App Router)
- **UI**: shadcn/ui + Tailwind CSS
- **Icons**: Lucide React
- **AI**: OpenAI API (gpt-4o)
- **언어**: TypeScript
- **배포**: Netlify

---

## 빠른 시작

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

```bash
cp .env.local.example .env.local
```

`.env.local` 파일에 OpenAI API 키를 입력하세요:

```
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

---

## 주요 기능

### 시나리오 선택
- 4가지 토론 시나리오 제공 (과학윤리, 다문화사회, 가정역할분담)
- 각 시나리오별 20여 개 학습자 채팅 메시지

### 채팅 분석
- OpenAI GPT-4o로 각 발화를 루브릭 코드로 자동 분류
- 신뢰도 점수 및 분류 근거 제공
- 낮은 신뢰도 발화 자동 플래그 (⚠️)

### 분석 결과 시각화
- 코드별 분포 차트
- 인지적 갈등 밀도 지표
- 상호작용 품질 평가 (기초 / 발전 중 / 우수)

### AI 대화
- 분석 결과를 바탕으로 교육 전문가 AI와 심화 대화
- 스트리밍 응답 지원

---

## LLM 프롬프트 모듈화 (Fine-tuning 가이드)

LLM에게 전송되는 모든 메시지와 판단 기준은 JSON 파일로 분리되어 있어 코드 변경 없이 수정할 수 있습니다.

### 설정 파일 위치

```
src/config/prompts/
├── classification.json   # 분류 시스템 프롬프트 + 루브릭 기준
└── ai-chat.json          # AI 대화 시스템 프롬프트
```

### `classification.json` 구조

```json
{
  "system": "...",              // 분류 LLM 시스템 프롬프트 (수정 가능)
  "user_template": "...",       // 사용자 메시지 템플릿
  "parameters": {
    "model": "gpt-4o",          // 모델 변경 가능
    "temperature": 0.2,         // 일관성 vs 창의성 조절
    "context_window": 3         // 맥락으로 제공할 이전 발화 수
  },
  "rubric_codes": {             // 각 코드의 색상/설명 (UI + 프롬프트 동기화)
    "no_reaction": { ... },
    ...
  },
  "needs_review_threshold": 0.6 // 이 값 미만이면 ⚠️ 표시
}
```

### 프롬프트 수정 예시

분류 기준을 바꾸고 싶다면 `src/config/prompts/classification.json`의 `system` 필드를 수정하세요. TypeScript 코드는 건드릴 필요가 없습니다.

온도를 높이면 (`temperature: 0.5`) 더 다양한 분류 결과를 얻을 수 있고, 낮추면 (`temperature: 0.1`) 더 일관된 결과를 얻습니다.

---

## 프로젝트 구조

```
src/
├── app/
│   ├── page.tsx                    # 시나리오 선택 화면
│   ├── scenario/[id]/
│   │   ├── page.tsx                # 채팅 기록 열람 + 분석 화면
│   │   └── loading.tsx
│   └── api/
│       ├── analyze/route.ts        # 채팅 분석 API
│       └── chat/route.ts           # AI 대화 API (스트리밍)
├── components/
│   ├── scenario/                   # 시나리오 카드
│   ├── chat/                       # 채팅 메시지 + 루브릭 배지
│   ├── analysis/                   # 분석 결과 패널 + 차트
│   └── ai-chat/                    # AI 대화 드로어
├── config/
│   └── prompts/
│       ├── classification.json     # 분류 LLM 설정 (fine-tuning 가능)
│       └── ai-chat.json            # 대화 LLM 설정 (fine-tuning 가능)
├── lib/
│   ├── types.ts                    # 공통 타입
│   ├── rubric.ts                   # 루브릭 정의 (JSON에서 로드)
│   ├── prompts.ts                  # 프롬프트 빌더 (JSON에서 로드)
│   └── scenarios.ts                # 시나리오 데이터
└── hooks/
    ├── useAnalysis.ts              # 분석 상태 관리
    └── useAIChat.ts                # AI 대화 상태 관리
```

---

## Netlify 배포

### 자동 배포 (권장)

1. GitHub에 저장소 push
2. [Netlify](https://netlify.com) → "Add new site" → GitHub 연결
3. Build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
4. Environment variables에 `OPENAI_API_KEY` 추가

### 수동 배포

```bash
npm run build
netlify deploy --prod
```

### 환경 변수 (Netlify 대시보드)

| 변수명 | 설명 |
|--------|------|
| `OPENAI_API_KEY` | OpenAI API 키 (필수) |

---

## 참고 문헌

- Noroozi, O., Weinberger, A., Biemans, H. J. A., Mulder, M., & Chizari, M. (2012). Argumentation-Based Computer Supported Collaborative Learning (ABCSCL). *Educational Research Review*, 7(2), 79–106.

---

## 라이선스

MIT
