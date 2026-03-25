# 분석 아키텍처 요약

> 작성일: 2026-03-25

---

## 전체 흐름

사용자가 **분석 시작** 버튼을 누르면 TKS 분류와 CCT 분석이 **동시에** 실행된다.

```
[분석 시작 클릭]
        │
        ▼
useAnalysis.analyze()
        │
        ├── POST /api/analyze       ──→  TKS 분류 결과
        └── POST /api/analyze-cct  ──→  CCT 분석 결과
        │         (Promise.allSettled — 병렬 실행)
        ▼
AnalysisSummary 조합 → localStorage 저장 → UI 업데이트
```

CCT가 실패해도 TKS 결과는 정상 표시된다 (non-fatal).
캐시에 `cctAnalysis`가 없으면 구 캐시로 간주해 재분석을 트리거한다.

---

## TKS 분석

### 목적
Noroozi et al. Transactive Knowledge Sharing 루브릭으로 각 발화를 6개 코드 중 하나로 분류.

### 코드
`no_reaction` / `externalization` / `acceptance` / `elicitation` / `integration` / `conflict`

### API: `POST /api/analyze`

```
입력: ChatMessage[]
출력: ClassificationResult[]
```

**처리 흐름:**
1. 메시지마다 직전 `context_window`(=3)개 발화를 컨텍스트로 묶음
2. 모든 메시지를 `Promise.all`로 **병렬** OpenAI 호출
3. 각 호출: system(루브릭 정의) + user(컨텍스트 + 대상 발화) → JSON 응답

**프롬프트 설정:** `src/config/prompts/classification.json`
- `system`: 6개 코드 정의, 경계 사례 주의사항, 출력 포맷
- `user_template`: `{context}`, `{message_id}`, `{speaker}`, `{text}` 플레이스홀더
- `parameters`: model=gpt-4o, temperature=0.2, context_window=3
- `needs_review_threshold`: 0.6 (confidence 미만이면 ⚠️ 표시)

**관련 파일**
- `src/lib/prompts.ts` — `buildClassificationUserPrompt()`
- `src/lib/rubric.ts` — `RUBRIC` 맵 (classification.json에서 로드)
- `src/lib/types.ts` — `ClassificationResult`, `RubricCode`

### 결과물 (`AnalysisSummary`)
| 필드 | 설명 |
|---|---|
| `codeDistribution` | 코드별 발화 수 |
| `cognitiveConflictDensity` | (integration+conflict) / total |
| `interactionQuality` | low / medium / high |
| `insights` | 자동 생성 텍스트 인사이트 |
| `classifiedMessages` | 발화별 코드·신뢰도·근거 |

---

## CCT 분석

### 목적
Traum & Heeman(1997) 기반 4계층 구조로 공동구성적 턴(Co-Constructive Turn)을 탐지.

```
Turn → Episode → Interaction Episode → Co-Constructive Turn
```

### API: `POST /api/analyze-cct`

```
입력: ChatMessage[], topic(string)
출력: CCTAnalysis
```

**처리 흐름:**

```
① mergeTurns()            [서버, 동기]
   동일 화자 연속 메시지 → 1개 Turn으로 병합

② LLM 두 호출 (Promise.all 병렬)
   ├─ classifySubstantive()   → 각 Turn이 실질적 발언인지 판별
   └─ segmentEpisodes()       → 주제별 에피소드 그룹 탐지

③ Turn에 isSubstantive 플래그 적용  [서버, 동기]

④ buildCCTAnalysis()       [src/lib/cct.ts, 순수 함수]
   ├─ 에피소드별 IE 판별 (2인 이상 실질 발언 교환 여부)
   ├─ IE 내 CCT 카운트 (화자 교체 시 양측 모두 실질 발언인지)
   └─ 지표 4개 계산
```

**프롬프트 설정:** `src/config/prompts/cct.json`
- `substantive_system/user_template`: 실질적 발언 판별 기준
- `segmentation_system/user_template`: 주제 전환 기준 및 에피소드 분리
- `parameters`: model=gpt-4o, temperature=0.1

**관련 파일**
- `src/lib/cct.ts` — `mergeTurns()`, `buildCCTAnalysis()` (순수 함수, 외부 의존 없음)
- `src/lib/types.ts` — `Turn`, `Episode`, `CCoTurn`, `CCTAnalysis`

### 결과물 (`CCTAnalysis`)
| 필드 | 설명 |
|---|---|
| `turns` | 병합된 Turn 목록 + isSubstantive 플래그 |
| `episodes` | 주제 에피소드 목록 + IE 여부 + CCT 수 |
| `ccoTurns` | 탐지된 CCT 목록 (소속 에피소드 ID, 구성 메시지 ID) |
| `totalSubstantiveComments` | 실질적 Turn 수 |
| `totalInteractionEpisodes` | IE 에피소드 수 |
| `substantivePerIE` | IE당 실질적 발화 수 (평균) |
| `ccoTurnsPerIE` | **IE당 CCT 수 (핵심 지표)** |

---

## 캐싱

| 키 | 내용 | 무효화 조건 |
|---|---|---|
| `tks_analysis_{scenarioId}` | `AnalysisSummary` 전체 (TKS + CCT 포함) | 재분석 버튼(force=true), 또는 캐시에 `cctAnalysis` 없을 때 |

`cctAnalysis`가 없는 구 캐시는 마운트 시 감지해 자동으로 전체 재분석을 트리거한다.

---

## UI 연결 구조

```
scenario/[id]/page.tsx
  ├── useAnalysis(scenarioId, topic)
  │     └── AnalysisSummary (TKS + CCT 통합)
  │
  ├── <ChatTimeline cctAnalysis={analysis?.cctAnalysis}>
  │     ├── EpisodeHeader (주제 구분선, IE 뱃지, CCT×N 뱃지)
  │     └── ChatMessageItem (CCT 황색 배경, CCT#N 뱃지, 비실질 레이블)
  │
  └── <AnalysisPanel analysis={analysis}>
        ├── 요약 카드 (전체 발화 수)
        ├── CCTCard (에피소드·IE·실질발화·IE당CCT)
        ├── CodeDistributionChart (TKS 막대/원형, 클릭 필터)
        ├── SpeakerDistribution (A/B 발화 스택 바)
        ├── InsightCard (품질·밀도·자동 인사이트)
        ├── RubricExplainer (TKS 코드 아코디언 안내)
        └── CCTExplainer (CCT 계층 아코디언 안내)
```

---

## 파일 목록

| 파일 | 역할 |
|---|---|
| `src/config/prompts/classification.json` | TKS 루브릭 시스템 프롬프트, 코드 정의, 모델 파라미터 |
| `src/config/prompts/cct.json` | CCT 실질성·에피소드 프롬프트, 모델 파라미터 |
| `src/lib/types.ts` | 모든 타입 정의 |
| `src/lib/rubric.ts` | RUBRIC 맵, CODE_ORDER (classification.json에서 로드) |
| `src/lib/prompts.ts` | 프롬프트 빌더 함수들 |
| `src/lib/cct.ts` | CCT 순수 로직 (mergeTurns, buildCCTAnalysis) |
| `src/lib/scenarios.ts` | 5개 샘플 시나리오 데이터 |
| `src/hooks/useAnalysis.ts` | 분석 오케스트레이터 (병렬 실행·캐싱·상태 관리) |
| `src/hooks/useAIChat.ts` | AI 채팅 스트리밍 훅 |
| `src/app/api/analyze/route.ts` | TKS 분류 API |
| `src/app/api/analyze-cct/route.ts` | CCT 분석 API |
| `src/app/api/chat/route.ts` | AI 채팅 스트리밍 API |
