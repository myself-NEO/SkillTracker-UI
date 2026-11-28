import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import type { ScriptPhase } from '@content/hld/interview';
import { HLD_GUIDE, HLD_KIT, type HldScript, hldPhaseLabel, hldPhaseReference } from '@lib/interview/mock';
import { DebouncedSave } from '../../../notebook/debounced-save';
import { EstimatorComponent } from '../../../widgets/estimator.component';
import { DiagramEditorComponent } from './editors';
import { MockAttempt } from './mock-attempt';
import {
  DRAFT_DELAY_MS,
  type MockChoice,
  MockChoicesComponent,
  MockCoverageComponent,
  MockDraftComponent,
  MockHintsComponent,
  MockReferenceComponent,
  MockWrittenPhaseComponent,
} from './mock-parts';

const PLACEHOLDERS = {
  requirements: 'Functional\n- Users can …\n\nNon-functional\n- p99 latency < … ms for …\n- … availability; consistency: …\n- Scale: …',
  estimation: 'Peak ~… RPS → …\nStorage ~… over … years → …\nRead-heavy (… : 1) → …',
  api: 'POST /v1/…\n  body: { … }\n  → 201 { … }\n\nGET /v1/…/{id}\n  → 200 …',
  'data-model': 'Entity (store): fields — PK …, index on …, partition by …',
  architecture: '1. Write path: client → LB → service → …\n2. Read path: …',
  deep: 'Option 1 (simple): … falls short because …\nOption 2: …\nChoice: … because …',
  bottlenecks: '- If … fails: detected by …, mitigated by …\n- Hot spot: …',
  tradeoffs: 'Summary: …\nChose … over … because …\nNext: …',
};

/**
 * One phase of an HLD mock interview, after the clarifying questions and before the
 * self-evaluation (ported from TheSWEguide's hldKit.tsx). Each is the learner's draft, hints, and
 * the breakdown's sections for the phase as the reference.
 */
@Component({
  selector: 'app-hld-phase',
  imports: [
    MockWrittenPhaseComponent,
    MockCoverageComponent,
    MockDraftComponent,
    MockHintsComponent,
    MockReferenceComponent,
    MockChoicesComponent,
    EstimatorComponent,
    DiagramEditorComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    @switch (phase()) {
      @case ('requirements') {
        <app-mock-written-phase
          draftKey="requirements"
          label="Functional and non-functional requirements"
          [placeholder]="placeholders.requirements"
          [rows]="10"
          [hints]="hints('requirements')"
          [referenceLabel]="referenceLabel('requirements')"
          [reference]="reference('requirements')"
        >
          <div after>
            <app-mock-coverage
              title="Functional requirements"
              prefix="fr"
              [items]="script().functional"
              [text]="drafts()['requirements'] ?? ''"
              [mentions]="mentions"
            />
            <app-mock-coverage
              title="Non-functional requirements"
              prefix="nfr"
              [items]="script().nonFunctional"
              [text]="drafts()['requirements'] ?? ''"
              [mentions]="mentions"
            />
          </div>
        </app-mock-written-phase>
      }
      @case ('estimation') {
        <app-mock-written-phase
          draftKey="estimation"
          label="What do the numbers mean for the design?"
          [placeholder]="placeholders.estimation"
          [rows]="6"
          [hints]="hints('estimation')"
          [referenceLabel]="referenceLabel('estimation')"
          [reference]="reference('estimation')"
        >
          <div class="rounded-xl border border-accent/30 bg-surface p-4">
            <p class="mb-3 text-xs font-semibold tracking-wider text-accent uppercase">
              🧮 Estimation workspace · prefilled from the interviewer’s answers where possible
            </p>
            <app-estimator
              [bare]="true"
              [preset]="script().estimatorPreset"
              [values]="estimate()"
              (valuesChange)="attempt.setEstimate($event)"
            />
          </div>
        </app-mock-written-phase>
      }
      @case ('api') {
        <app-mock-written-phase
          draftKey="api"
          label="Your API"
          [placeholder]="placeholders.api"
          [rows]="10"
          [hints]="hints('api')"
          [referenceLabel]="referenceLabel('api')"
          [reference]="reference('api')"
        />
      }
      @case ('data-model') {
        <app-mock-written-phase
          draftKey="data-model"
          label="Entities, keys, stores, indexes and partitioning"
          [placeholder]="placeholders['data-model']"
          [rows]="8"
          [hints]="hints('data-model')"
          [referenceLabel]="referenceLabel('data-model')"
          [reference]="reference('data-model')"
        />
      }
      @case ('architecture') {
        <div class="space-y-5">
          <app-diagram-editor [value]="diagram()" (valueChange)="onDiagram($event)" label="Your architecture (Mermaid)" />
          <app-mock-draft
            draftKey="architecture"
            label="Walk through the main request flows"
            [placeholder]="placeholders.architecture"
            [rows]="6"
          />
          <app-mock-hints hintKey="architecture" [hints]="hints('architecture')" />
          <div class="flex flex-col gap-3">
            <app-mock-reference revealKey="architecture" label="initial design and request flows" [markdown]="reference('architecture')" />
            <app-mock-reference
              revealKey="final-architecture"
              label="final architecture"
              [markdown]="script().sections['Final architecture'] ?? ''"
            />
          </div>
        </div>
      }
      @case ('deep-dives') {
        <div class="space-y-5">
          <app-mock-choices
            [choices]="deepDives()"
            legend="Choose two or three deep dives"
            help="At senior level, pick them yourself from the non-functional requirements before the interviewer does."
            emptyText="Pick at least one deep dive to work on."
            keyPrefix="deep"
            draftLabel="Your approach: options, the one you choose, and why"
            [draftPlaceholder]="placeholders.deep"
            [draftRows]="6"
          />
          <app-mock-hints hintKey="deep-dives" [hints]="hints('deep-dives')" />
        </div>
      }
      @case ('bottlenecks') {
        <app-mock-written-phase
          draftKey="bottlenecks"
          label="Bottlenecks and failure scenarios"
          [placeholder]="placeholders.bottlenecks"
          [rows]="8"
          [hints]="hints('bottlenecks')"
          [referenceLabel]="referenceLabel('bottlenecks')"
          [reference]="reference('bottlenecks')"
        />
      }
      @case ('tradeoffs') {
        <app-mock-written-phase
          draftKey="tradeoffs"
          label="Summary, trade-offs and alternatives"
          [placeholder]="placeholders.tradeoffs"
          [rows]="8"
          [hints]="hints('tradeoffs')"
          [referenceLabel]="referenceLabel('tradeoffs')"
          [reference]="reference('tradeoffs')"
        />
      }
    }
  `,
})
export class HldPhaseComponent {
  protected readonly attempt = inject(MockAttempt);
  private readonly saves = new DebouncedSave(DRAFT_DELAY_MS);

  readonly phase = input.required<string>();

  protected readonly placeholders = PLACEHOLDERS;
  protected readonly mentions = HLD_KIT.matcher.mentions;
  protected readonly script = computed(() => this.attempt.script() as HldScript);
  protected readonly drafts = computed(() => this.attempt.current().drafts);
  protected readonly deepDives = computed((): MockChoice[] =>
    this.script().deepDives.map((dive) => ({ title: dive.title, detail: dive.section, body: dive.body })),
  );
  /** The estimator's inputs as the learner left them (stored values are text, or numbers from older versions). */
  protected readonly estimate = computed(() => {
    const values = this.attempt.current().estimate;
    return values && Object.fromEntries(Object.entries(values).map(([key, value]) => [key, String(value)]));
  });
  /** What the learner drew; until they type, the saved diagram. */
  private readonly typed = signal<string | null>(null);
  protected readonly diagram = computed(() => this.typed() ?? this.attempt.current().diagram ?? '');

  protected hints(phase: ScriptPhase) {
    return this.script().hints[phase] ?? HLD_GUIDE[phase].hints;
  }

  protected referenceLabel(phase: ScriptPhase) {
    return hldPhaseLabel(this.script(), phase);
  }

  protected reference(phase: ScriptPhase) {
    return hldPhaseReference(this.script(), phase);
  }

  protected onDiagram(source: string) {
    this.typed.set(source);
    this.saves.queue('diagram', () => this.attempt.setDiagram(source));
  }
}
