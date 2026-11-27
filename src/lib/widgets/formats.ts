// Block formats of the interactive widgets, and their parsers. Kept free of React so the
// widgets, the content validator (scripts/validate-content.ts) and tests can all use them.
import { parseQuantity, type QuantityKind } from './numbers';

// Quiz block format (one or more questions):
//
//   ? Which principle is violated?
//   - A wrong option
//   + The correct option
//   - Another wrong option
//   ! Optional: why the option above is wrong (shown when it is chosen, and for every option once solved).
//   > Explanation shown once the question is answered correctly.

export interface QuizOption {
  text: string;
  correct: boolean;
  reason?: string;
}

export interface QuizQuestion {
  prompt: string;
  options: QuizOption[];
  explanation: string;
}

export const parseQuiz = (source: string): QuizQuestion[] => {
  const questions: QuizQuestion[] = [];
  let current: QuizQuestion | null = null;
  for (const raw of source.split('\n')) {
    const line = raw.trim();
    if (line.startsWith('? ')) {
      current = { prompt: line.slice(2), options: [], explanation: '' };
      questions.push(current);
    } else if (current && (line.startsWith('- ') || line.startsWith('+ '))) {
      current.options.push({ text: line.slice(2), correct: line.startsWith('+') });
    } else if (current && line.startsWith('! ') && current.options.length > 0) {
      const option = current.options[current.options.length - 1];
      option.reason = `${option.reason ?? ''} ${line.slice(2).trim()}`.trim();
    } else if (current && line.startsWith('>')) {
      current.explanation = `${current.explanation} ${line.slice(1).trim()}`.trim();
    }
  }
  return questions.filter((q) => q.options.some((o) => o.correct));
};

// Interactive checklist. In markdown:
//
//   ```checklist title="Evaluation checklist"
//   - Clarified the read/write ratio before choosing a database
//   - [ ] Explained how short codes stay unique
//   ```

export const parseChecklist = (source: string) =>
  source
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith('- '))
    .map((l) => l.replace(/^- (\[[ xX]\] )?/, '').trim())
    .filter(Boolean);

// Numeric estimation drills. In markdown:
//
//   ```drill
//   ? 100 million requests a day. Average requests per second?
//   = 1157/s
//   ~ 1.5
//   > 100M ÷ 86,400 ≈ 1,157/s. Shortcut: ÷ 100K → ~1,000/s.
//   ```
//
// `=` is the reference answer (with a unit when it has one), `~` the accepted factor
// (default 2: anything within ×2 counts — the right order of magnitude and then some),
// `>` the worked solution.

export interface DrillQuestion {
  prompt: string;
  answer: number;
  kind: QuantityKind;
  answerText: string;
  tolerance: number;
  solution: string;
}

export const parseDrills = (source: string): { questions: DrillQuestion[]; errors: string[] } => {
  const questions: DrillQuestion[] = [];
  const errors: string[] = [];
  let current: Partial<DrillQuestion> & { prompt?: string } = {};
  const flush = () => {
    if (!current.prompt) return;
    if (current.answer === undefined || current.kind === undefined)
      errors.push(`No valid "=" answer for: ${current.prompt}`);
    else
      questions.push({
        prompt: current.prompt,
        answer: current.answer,
        kind: current.kind,
        answerText: current.answerText ?? '',
        tolerance: current.tolerance ?? 2,
        solution: current.solution ?? '',
      });
    current = {};
  };
  for (const raw of source.split('\n')) {
    const line = raw.trim();
    if (line.startsWith('? ')) {
      flush();
      current.prompt = line.slice(2).trim();
    } else if (line.startsWith('= ') && current.prompt) {
      const parsed = parseQuantity(line.slice(2));
      if (parsed) {
        current.answer = parsed.value;
        current.kind = parsed.kind;
        current.answerText = line.slice(2).trim();
      }
    } else if (line.startsWith('~ ') && current.prompt) {
      const t = Number(line.slice(2));
      if (Number.isFinite(t) && t > 1) current.tolerance = t;
      else errors.push(`Bad tolerance "${line}" for: ${current.prompt}`);
    } else if (line.startsWith('>') && current.prompt) {
      current.solution = `${current.solution ?? ''} ${line.slice(1).trim()}`.trim();
    }
  }
  flush();
  return { questions, errors };
};
