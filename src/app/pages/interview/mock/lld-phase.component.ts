import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import {
  joinSections,
  LLD_GUIDE,
  LLD_KIT,
  type LldScript,
  lldImplementationReference,
  lldSectionsLabel,
  lldSectionsMarkdown,
  lldTypeItems,
  mentionsType,
} from '@lib/interview/mock';
import { DebouncedSave } from '../../../notebook/debounced-save';
import { UmlEditorComponent } from './editors';
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
  requirements:
    'Functional\n1. … (one operation per line)\n\nNon-functional\n- Thread-safe: …\n- … should be swappable\n\nOut of scope: …',
  entities: 'ParkingLot (class): park and unpark; owns the levels\nTicket (record): …\nVehicleType (enum): …',
  classDesign:
    '- Allocation lives in … because …\n- … is an interface because requirement … says it will change\n- Pattern: … — not … because …',
  implementation:
    'public final class ParkingLot {\n    private final List<Level> levels;\n\n    public Ticket park(Vehicle vehicle) {\n        // validate, claim atomically, issue the ticket\n    }\n}',
  edgeCases: 'Edge cases\n- … called twice → …\n- Nothing left → …\n\nConcurrency\n- Shared state: … guarded by …\n\nTests\n- …',
  followUp: 'Add: … implements …\nChange: … (one line in …)\nUntouched: …',
};

/** Breakdown sections the later phases' references are made of. */
const CLASS_DESIGN_EXTRA = ['Design decisions', 'Patterns and principles'];
const EDGE_CASES = ['Edge cases', 'Concurrency'];
const EXTENSIBILITY = ['Common mistakes and alternatives', 'Complexity'];

/**
 * One phase of an LLD mock interview, after the clarifying questions and before the
 * self-evaluation (ported from TheSWEguide's lldKit.tsx): the requirements, the entities, the class
 * diagram, the core flow in Java, edge cases and concurrency, and follow-ups.
 */
@Component({
  selector: 'app-lld-phase',
  imports: [
    MockWrittenPhaseComponent,
    MockCoverageComponent,
    MockDraftComponent,
    MockHintsComponent,
    MockReferenceComponent,
    MockChoicesComponent,
    UmlEditorComponent,
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
          [hints]="guide.requirements.hints"
          referenceLabel="Requirements"
          [reference]="script().sections['Requirements'] ?? ''"
        >
          <div after>
            @for (group of script().requirements; track group.title) {
              <app-mock-coverage
                [title]="group.title"
                [prefix]="'req' + $index"
                [items]="group.items"
                [text]="drafts()['requirements'] ?? ''"
                [mentions]="mentions"
              />
            }
          </div>
        </app-mock-written-phase>
      }
      @case ('entities') {
        <app-mock-written-phase
          draftKey="entities"
          label="Entities, their kind and one responsibility each"
          [placeholder]="placeholders.entities"
          [rows]="8"
          [hints]="script().hints.entities ?? guide.entities.hints"
          [referenceLabel]="modellingLabel()"
          [reference]="modellingReference()"
        >
          <app-mock-coverage
            after
            title="Types in the reference class diagram"
            prefix="types"
            [items]="typeItems()"
            [text]="drafts()['entities'] ?? ''"
            [mentions]="mentionsType"
          />
        </app-mock-written-phase>
      }
      @case ('class-design') {
        <div class="space-y-5">
          <app-uml-editor [value]="diagram()" (valueChange)="onDiagram($event)" label="Your class diagram" />
          <app-mock-draft
            draftKey="class-design"
            label="Key decisions: where each rule lives, the interfaces, the patterns and why"
            [placeholder]="placeholders.classDesign"
            [rows]="6"
          />
          <app-mock-hints hintKey="class-design" [hints]="script().hints['class-design'] ?? guide['class-design'].hints" />
          <app-mock-reference revealKey="class-design" [label]="designLabel()" [markdown]="designReference()" />
        </div>
      }
      @case ('implementation') {
        <app-mock-written-phase
          draftKey="implementation"
          label="Your implementation of the core flow (Java)"
          [placeholder]="placeholders.implementation"
          [rows]="18"
          [hints]="script().hints.implementation ?? guide.implementation.hints"
          [referenceLabel]="implementation().label"
          [reference]="implementation().markdown"
        />
      }
      @case ('edge-cases') {
        <div class="space-y-5">
          <app-mock-draft
            draftKey="edge-cases"
            label="Edge cases, the shared state and how you make it safe, and how you would test it"
            [placeholder]="placeholders.edgeCases"
            [rows]="10"
          />
          <app-mock-hints hintKey="edge-cases" [hints]="guide['edge-cases'].hints" />
          <div class="flex flex-col gap-3">
            <app-mock-reference revealKey="edge-cases" [label]="edgeCasesLabel()" [markdown]="edgeCasesReference()" />
            <app-mock-reference revealKey="tests" label="Tests" [markdown]="script().sections['Tests'] ?? ''" />
          </div>
        </div>
      }
      @case ('extensibility') {
        <div class="space-y-5">
          <app-mock-choices
            [choices]="followUps()"
            legend="Choose one or two follow-ups the interviewer might ask"
            help="Explain the change before opening the answer: what you add, and what stays untouched."
            emptyText="Pick at least one follow-up to work on."
            keyPrefix="follow"
            draftLabel="Your change: the classes you add or modify, and what stays the same"
            [draftPlaceholder]="placeholders.followUp"
            [draftRows]="5"
          />
          <app-mock-hints hintKey="extensibility" [hints]="guide.extensibility.hints" />
          <app-mock-reference revealKey="extensibility" [label]="extensibilityLabel()" [markdown]="extensibilityReference()" />
        </div>
      }
    }
  `,
})
export class LldPhaseComponent {
  private readonly attempt = inject(MockAttempt);
  private readonly saves = new DebouncedSave(DRAFT_DELAY_MS);

  readonly phase = input.required<string>();

  protected readonly placeholders = PLACEHOLDERS;
  protected readonly guide = LLD_GUIDE;
  protected readonly mentions = LLD_KIT.matcher.mentions;
  protected readonly mentionsType = mentionsType;
  protected readonly script = computed(() => this.attempt.script() as LldScript);
  protected readonly drafts = computed(() => this.attempt.current().drafts);
  protected readonly typeItems = computed(() => lldTypeItems(this.script()));
  protected readonly modellingLabel = computed(() => lldSectionsLabel(this.script(), this.script().modelling));
  protected readonly modellingReference = computed(() => lldSectionsMarkdown(this.script(), this.script().modelling));
  protected readonly designLabel = computed(() => lldSectionsLabel(this.script(), this.script().design, CLASS_DESIGN_EXTRA));
  protected readonly designReference = computed(() => lldSectionsMarkdown(this.script(), this.script().design, CLASS_DESIGN_EXTRA));
  protected readonly implementation = computed(() => lldImplementationReference(this.script()));
  protected readonly edgeCasesLabel = computed(() => lldSectionsLabel(this.script(), [], EDGE_CASES));
  protected readonly edgeCasesReference = computed(() => joinSections(this.script().sections, EDGE_CASES));
  protected readonly extensibilityLabel = computed(() => lldSectionsLabel(this.script(), [], EXTENSIBILITY));
  protected readonly extensibilityReference = computed(() => joinSections(this.script().sections, EXTENSIBILITY));
  protected readonly followUps = computed((): MockChoice[] =>
    this.script().followUps.map((followUp) => ({ title: followUp.title, body: followUp.body })),
  );
  /** What the learner drew; until they type, the saved diagram. */
  private readonly typed = signal<string | null>(null);
  protected readonly diagram = computed(() => this.typed() ?? this.attempt.current().diagram ?? '');

  protected onDiagram(source: string) {
    this.typed.set(source);
    this.saves.queue('diagram', () => this.attempt.setDiagram(source));
  }
}
