# Architecture Overview

## 1. Modules
- `index.html`: Single entry document.
- `style.css`: Visual styles + report theming.
- `constants.js`: Static constants, thresholds, RNG utility, labels.
- `questions.js`: Raw questionnaire definitions + reverse flag.
- `knowledge.js`: Symptom/advice knowledge base + combo rules.
- `app.js`: State machine, rendering, scoring, classification, report generation, debug actions.

## 2. State Flow
```
state: {
  currentIndex,    // 当前题组序号
  answers: { key: number[] },
  finished: false,
  mode: 'sequential' | 'random',
  order: [],        // 体质显示顺序
  user: { name, gender, age }
}
```
- `ensureOrder()` sets order depending on mode.
- `renderCurrent()` builds UI for active constitution using gender-filtered question list.
- Navigation updates `currentIndex`; completion triggers `calculateScores()` → `classify()` → `showResult()`.

## 3. Gender Filtering
Centralized in `getFilteredQuestions(c, gender)` to avoid prior duplication. Prevents mismatched lengths for 湿热体质 (带下 / 阴囊)。

## 4. Scoring
- Transforms raw 1–5 Likert to constitution score using standard conversion formula (see `calculateScores()`).
- Reverse items (平和) invert direction before aggregation.

## 5. Classification Logic
- Pinghe requires: pingheScore ≥ 60 AND all other computed scores < 40.
- Main: score ≥ 40.
- Tendency: 30 ≤ score ≤ 39.
- Additional safeguard: Pinghe cannot be main if other constitutions uns cored (prevents false positives under partial data).

## 6. Report Generation
`buildProfessionalReport(...)` constructs an HTML report:
- Basic info
- Overall summary
- Scores table
- Intelligent advice blocks (combos + targeted suggestions)
- Timestamp + ID

## 7. Report ID System
Daily sequential counter → multi-stage 5-character token. Algorithm documented in `REPORT_ID.md`.

## 8. Debug Panel
Hidden via key sequence; actions simulate fill patterns, presets, or adjust ID. Useful for regression and demo.

## 9. Extensibility Points
- i18n: Extract static Chinese strings to separate locale map.
- Persistence: Introduce optional LocalStorage with clear reset.
- Testing: Add Jest DOM tests for classification boundaries & filtering integrity.

## 10. Non-Goals
- Server-side storage
- Medical decision support

## 11. Security Notes
- Escape user-entered strings.
- Keep logic deterministic to ease code audit.

## 12. Future Improvements
- Service Worker for offline
- Light/dark theme toggle
- PDF export print stylesheet.
