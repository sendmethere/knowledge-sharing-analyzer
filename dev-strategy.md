# Dev Strategy: Co-Constructive Turn (CCT) 측정 구현

> 작성일: 2026-03-25
> 대상 프로젝트: knowledge-sharing-chat
> 참조: `co-constructive-turn.md` (Traum & Heeman, 1997 기반 정의)

---

## 1. 이론적 개념 계층 구조

`co-constructive-turn.md`에 정의된 측정 단위는 4계층 구조다.
각 계층이 상위 계층의 조건을 만족해야 아래로 진행한다.

```
Turn (발화 순서)
  └─ Episode (에피소드)
        └─ Interaction Episode (상호작용 에피소드)
              └─ Co-Constructive Turn (공동구성적 턴)
```

### Turn
단일 화자의 **연속 발화 단위** (Traum & Heeman, 1997).
A가 메시지 3개를 연속 보내면 1개의 Turn으로 묶는다.
→ 현재 `ChatMessage[]`를 화자 연속성 기준으로 병합해야 함.

### Substantive Comment (실질적 발언)
학습 자료의 개념에 관련된 질문이나 설명.
**정확성 무관, 관련성만 판단.**
"Yes", "Umm", "Maybe", "ㅇㅇ", "맞아", "ㅎㅎ" 같은 단순 반응은 **비실질적**.

### Episode
동일 주제에 대한 연속 발화 묶음.
- 최소 1개의 substantive comment 포함 필수
- 주제가 바뀌면 새 에피소드 (A→B→A면 3개 에피소드)

### Interaction Episode
에피소드의 하위 유형.
- 에피소드 내에서 **서로 다른 2명 이상**이 각각 최소 1개의 substantive comment를 **연속적으로 교환**

### Co-Constructive Turn
Interaction Episode의 특수한 하위 유형.
- **화자 교체(change in speaker)** 발생
- 교체 전후 **두 화자 모두** substantive comment 포함

---

## 2. 측정 지표 (종속변수)

`co-constructive-turn.md`에 명시된 4개 지표를 앱에 구현한다.

| 지표 | 설명 | 현재 구현 |
|---|---|---|
| Substantive comment 총 빈도 | 전체 발화 중 실질적 발언 수 | ✗ |
| Interaction Episode 총 빈도 | 상호작용 에피소드 수 | ✗ |
| IE당 Substantive comment 수 | 에피소드 질 측정 | ✗ |
| IE당 CCT 수 | 핵심 지표 | ✗ |

---

## 3. 알고리즘 파이프라인

```
ChatMessage[]
    │
    ▼
① Turn 병합
    단일 화자 연속 메시지 → 1개 Turn으로 묶기
    출력: Turn[] = { speaker, messages: ChatMessage[], isSubstantive?: boolean }
    │
    ▼
② Substantive Comment 분류 (LLM 1회 호출)
    Turn별로 실질적/비실질적 판별
    시나리오의 topic을 컨텍스트로 제공
    출력: Turn[] + isSubstantive: boolean
    │
    ▼
③ Episode 세그멘테이션 (LLM 1회 호출)
    주제 연속성 기준으로 Turn들을 에피소드로 묶기
    출력: Episode[] = { turns: Turn[], hasSubs: boolean }
    │
    ▼
④ Interaction Episode 판별 (클라이언트 사이드, 무비용)
    에피소드 내 2인 이상 substantive comment 교환 여부
    출력: InteractionEpisode[] ⊆ Episode[]
    │
    ▼
⑤ CCT 계산 (클라이언트 사이드, 무비용)
    IE 내 화자 교체 지점에서 양측 모두 substantive인지 확인
    출력: CCoTurn[]
    │
    ▼
AnalysisSummary 업데이트
```

**핵심 설계 원칙:**
- LLM 호출은 ②, ③ 두 단계뿐 (비용 최소화)
- ④, ⑤는 순수 클라이언트 로직 (결정론적)
- ②와 ③은 `Promise.all`로 병렬 실행 가능

---

## 4. LLM 호출 설계

### ② Substantive Comment 분류

**전략:** 모든 Turn을 배치로 한 번에 분류 (1 API call)

```json
// POST /api/analyze-cct 내부
request: {
  "turns": [{ "id": "t1", "speaker": "A", "text": "합친 텍스트" }, ...],
  "topic": "Agentic AI 연구 주제 논의"
}

response: {
  "results": [{ "turnId": "t1", "isSubstantive": true, "reason": "..." }, ...]
}
```

프롬프트 파일: `src/config/prompts/cct.json` → `substantive_system`, `substantive_user_template`

### ③ Episode 세그멘테이션

**전략:** Turn 목록 + 각 Turn의 substantive 여부를 입력으로 주제 변환 지점 탐지 (1 API call)

```json
request: {
  "turns": [{ "id": "t1", "isSubstantive": true, "text": "..." }, ...]
}

response: {
  "episodes": [
    { "turnIds": ["t1", "t2", "t3"], "topicLabel": "learning analytics 소개" },
    { "turnIds": ["t4", "t5"], "topicLabel": "agentic AI 전환" },
    ...
  ]
}
```

프롬프트 파일: `src/config/prompts/cct.json` → `segmentation_system`, `segmentation_user_template`

---

## 5. 데이터 모델

### 신규 타입 (`src/lib/types.ts` 추가)

```typescript
export interface Turn {
  id: string;                    // "turn-1", "turn-2", ...
  speaker: "A" | "B";
  messageIds: string[];          // 1개 이상의 ChatMessage ID
  combinedText: string;          // 병합된 텍스트
  isSubstantive?: boolean;       // ② 이후 채워짐
  substantiveReason?: string;
}

export interface Episode {
  id: string;                    // "ep-1", "ep-2", ...
  topicLabel: string;
  turns: Turn[];
  isInteractionEpisode: boolean; // ④에서 판별
  ccoTurnCount: number;          // ⑤에서 집계
}

export interface CCoTurn {
  id: string;                    // "cct-1", "cct-2", ...
  episodeId: string;
  turnIds: [string, string];     // 교체 전후 두 Turn ID
  messageIds: string[];          // 관련 메시지 ID (UI 하이라이트용)
}

export interface CCTAnalysis {
  turns: Turn[];
  episodes: Episode[];
  ccoTurns: CCoTurn[];
  // 4개 종속변수
  totalSubstantiveComments: number;
  totalInteractionEpisodes: number;
  substantivePerIE: number;      // 평균
  ccoTurnsPerIE: number;         // 평균 — 핵심 지표
}
```

### `AnalysisSummary` 확장

```typescript
export interface AnalysisSummary {
  // ... 기존 필드 유지 (하위 호환) ...
  cctAnalysis?: CCTAnalysis;     // 선택적 — CCT 분석 실행 시에만 채워짐
}
```

캐시 키: `tks_cct_{scenarioId}` (TKS 캐시와 분리)

---

## 6. 프롬프트 모듈: `src/config/prompts/cct.json`

```json
{
  "substantive_system": "당신은 학습 대화 분석 전문가입니다. 각 발화가 학습 주제와 관련된 실질적 발언(substantive comment)인지 판단합니다.\n\n실질적 발언: 학습 자료의 개념에 관련된 질문이나 설명. 정확성 무관, 관련성만 판단.\n비실질적 발언: 단순 동의('ㅇㅇ', '맞아', 'ㅎㅎ'), 감탄사, 주제와 무관한 잡담.\n\nJSON 배열로 응답하시오.",

  "substantive_user_template": "학습 주제: {topic}\n\n다음 발화 목록의 실질적 여부를 판단하시오:\n{turns_json}\n\n형식: [{\"turnId\": \"...\", \"isSubstantive\": true/false, \"reason\": \"한 줄 근거\"}]",

  "segmentation_system": "당신은 학습 대화의 주제 흐름을 분석하는 전문가입니다. 연속된 발화를 동일 주제 단위(에피소드)로 묶습니다.\n\n에피소드 분리 기준: 주제가 명확하게 전환될 때. 단순 관점 변화는 분리 안 함.\n최소 1개의 실질적 발언 포함 에피소드만 출력.\n\nJSON으로 응답하시오.",

  "segmentation_user_template": "다음 발화들을 주제별 에피소드로 묶으시오:\n{turns_json}\n\n형식: [{\"turnIds\": [...], \"topicLabel\": \"주제 요약 10자 이내\"}]",

  "parameters": {
    "model": "gpt-4o",
    "temperature": 0.1
  }
}
```

---

## 7. API 설계: `POST /api/analyze-cct`

```
Request:
{
  scenarioId: string,
  messages: ChatMessage[],
  topic: string           // 시나리오의 topic 필드
}

Response:
{
  cctAnalysis: CCTAnalysis
}
```

**내부 처리 흐름:**

```typescript
// 1. Turn 병합 (동기, 무비용)
const turns = mergeTurns(messages);

// 2. LLM 두 호출 병렬 실행
const [substantiveResults, episodeResults] = await Promise.all([
  classifySubstantive(openai, turns, topic),
  segmentEpisodes(openai, turns, topic)
]);

// 3. Turn에 isSubstantive 적용
const enrichedTurns = applySubstantive(turns, substantiveResults);

// 4. Episode에 Turn 결합 (동기)
const episodes = buildEpisodes(episodeResults, enrichedTurns);

// 5. Interaction Episode 판별 (동기)
const withIE = detectInteractionEpisodes(episodes);

// 6. CCT 계산 (동기)
const { ccoTurns, ...metrics } = countCCTs(withIE);

return { cctAnalysis: { turns: enrichedTurns, episodes: withIE, ccoTurns, ...metrics } };
```

**예상 API 호출 수:** LLM 2회 고정 (발화 수에 무관)
**예상 응답 시간:** ~5–10초 (현재 TKS 분류의 1/5 이하)

---

## 8. UI 통합 계획

### 8-1. AnalysisPanel — CCT 지표 카드

TKS 분석 완료 후 "CCT 분석" 버튼 노출. 완료 후 아래 카드 추가:

```
┌─ Co-Constructive Turn 분석 ─────────────────┐
│  Substantive 발화    28 / 40 (70%)          │
│  Interaction Episode  6개                    │
│  IE당 Substantive    4.7개                  │
│  IE당 CCT            2.3개  ← 핵심 지표      │
│                                              │
│  [에피소드 보기 ▾]                           │
└──────────────────────────────────────────────┘
```

### 8-2. ChatTimeline — CCT 하이라이트

CCT에 포함된 메시지에 좌측 컬러 보더 표시 + CCT 번호 배지:

```
│ ┃ [A] 발화 텍스트 A        (substantive)
│ ┃ [B] 발화 텍스트 B        (substantive)  CCT #2
│    [A] "ㅎㅎ 맞아"         (non-substantive)
```

구현: `ChatMessageItem`에 `cctId?: string`, `isSubstantive?: boolean` prop 추가.

### 8-3. Episode 드릴다운 뷰 (선택적, Phase 3)

AnalysisPanel 에피소드 아코디언:
- 에피소드별 확장 → 포함 Turn 목록 + IE 여부 + CCT 개수

---

## 9. 구현 단계

### Phase 1 — 코어 로직 (백엔드 없음 우선)
- [ ] `src/lib/cct.ts` — `mergeTurns()`, `detectInteractionEpisodes()`, `countCCTs()` 구현
- [ ] `src/lib/types.ts` — `Turn`, `Episode`, `CCoTurn`, `CCTAnalysis` 타입 추가
- [ ] 단위 테스트: 선영·태상 시나리오로 수동 검증

### Phase 2 — LLM 파이프라인
- [ ] `src/config/prompts/cct.json` 작성
- [ ] `src/lib/prompts.ts` — `buildSubstantivePrompt()`, `buildSegmentationPrompt()` 추가
- [ ] `src/app/api/analyze-cct/route.ts` 구현
- [ ] `src/hooks/useCCTAnalysis.ts` — 캐싱(`tks_cct_{id}`) + 상태 관리

### Phase 3 — UI 연결
- [ ] `AnalysisPanel` — CCT 지표 카드 + 분석 버튼
- [ ] `ChatMessageItem` / `ChatTimeline` — CCT 하이라이트

### Phase 4 — AI 채팅 통합
- [ ] `buildAIChatSystemPrompt()`에 CCT 데이터 포함
- [ ] "몇 번째 에피소드에서 가장 많은 CCT가 발생했나요?" 질문 지원

---

## 10. 설계 결정 및 트레이드오프

| 결정 | 선택 | 이유 |
|---|---|---|
| LLM 호출 수 | 2회 고정 | 발화 수 무관 → 예측 가능한 비용 |
| Substantive + Segmentation 병렬 | 가능 (독립적 입력) | 응답 속도 2배 향상 |
| CCT 계산 클라이언트 사이드 | 규칙 기반 | 정의가 명확하여 LLM 불필요 |
| Turn 병합 규칙 | 동일 화자 연속 → 1 Turn | Traum & Heeman 정의 준수 |
| 에피소드 경계 판단 | LLM | 주제 연속성은 의미론적 판단 필요 |
| 캐시 분리 | `tks_cct_{id}` | TKS 재분석 시 CCT 캐시 무효화 독립 제어 |

---

## 11. 미결 연구 질문

1. **Turn 병합 기준:** 동일 화자 연속 메시지 사이 시간 간격 고려? (현재 카카오톡 데이터는 타임스탬프 있음)
2. **Substantive 판별 기준 보정:** 학습 주제가 바뀌면 프롬프트도 조정해야 하나? → `classification.json`처럼 시나리오별 힌트 필드 고려
3. **에피소드 최소 길이:** Turn 1개짜리 에피소드 허용? (정의상 허용되지만 IE가 되려면 2인 필요)
4. **Kappa 검증:** `co-constructive-turn.md`의 코더 간 일치도(Kappa > .90) 기준을 앱에서 어떻게 간접 검증할 것인가? → 선영·태상 실제 대화로 수동 코딩 후 LLM 결과와 비교 필요
