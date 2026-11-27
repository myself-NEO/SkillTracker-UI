import { ChangeDetectionStrategy, Component, computed, input, linkedSignal, signal } from '@angular/core';
import {
  DEFAULT_INPUTS,
  estimate,
  type EstimateInputs,
  INPUT_FIELDS,
  type OutputGroup,
  parsePreset,
} from '@lib/widgets/estimate';
import { formatBytes, formatCount, parseQuantity } from '@lib/widgets/numbers';
import { onRadioGroupKeyDown } from '../ui/radio-group';
import { uniqueId } from './page';

// The capacity estimator (```estimator blocks, and the /hld/estimator page), ported from
// TheSWEguide's Estimator.tsx. Inputs accept "10M", "1.5 KB", "3"; every figure updates with the
// working shown. In Markdown:
//
//   ```estimator title="URL shortener"
//   requestsPerDay = 100M
//   readsPerWrite = 10
//   writeBytes = 500 B
//   ```

export type EstimatorValues = Record<string, string>;

const GROUPS: { group: OutputGroup; label: string }[] = [
  { group: 'traffic', label: 'Traffic' },
  { group: 'storage', label: 'Storage' },
  { group: 'bandwidth', label: 'Bandwidth' },
  { group: 'memory', label: 'Memory' },
  { group: 'servers', label: 'Servers' },
];

const toText = (inputs: EstimateInputs): EstimatorValues => {
  const values: EstimatorValues = { mode: inputs.mode };
  for (const field of INPUT_FIELDS) {
    const value = inputs[field.key];
    values[field.key] = field.bytes ? formatBytes(value) : formatCount(value);
  }
  return values;
};

/** Text values → numbers; fields that don't parse fall back to the preset and are reported. */
const fromText = (values: EstimatorValues, fallback: EstimateInputs) => {
  const inputs: EstimateInputs = {
    ...fallback,
    mode: values['mode'] === 'users' ? 'users' : values['mode'] === 'requests' ? 'requests' : fallback.mode,
  };
  const invalid = new Set<string>();
  for (const field of INPUT_FIELDS) {
    const text = values[field.key];
    if (text === undefined) continue;
    const parsed = parseQuantity(text.replace(/%$/, '').replace(/:1$/, ''), field.bytes ? 'bytes' : undefined);
    if (!parsed || parsed.value < 0) invalid.add(field.key);
    else inputs[field.key] = parsed.value;
  }
  return { inputs, invalid };
};

@Component({
  selector: 'app-estimator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  templateUrl: './estimator.component.html',
})
export class EstimatorComponent {
  /** Shown after "Capacity estimator · ". */
  readonly title = input<string>();
  /** Body of an ```estimator block. */
  readonly preset = input<string>();

  protected readonly id = uniqueId('estimator');
  protected readonly modes = [
    { value: 'requests', label: 'Requests per day' },
    { value: 'users', label: 'Users × requests' },
  ] as const;
  protected readonly groups = GROUPS;

  private readonly presetInputs = computed(() => {
    const preset = this.preset();
    return preset ? parsePreset(preset).inputs : DEFAULT_INPUTS;
  });
  private readonly initial = computed(() => toText(this.presetInputs()));
  /** The learner's text, starting from the preset (and back to it if the preset changes). */
  protected readonly values = linkedSignal(() => this.initial());
  protected readonly showWorking = signal(true);

  private readonly parsed = computed(() => fromText(this.values(), this.presetInputs()));
  protected readonly mode = computed(() => this.parsed().inputs.mode);
  protected readonly invalid = computed(() => this.parsed().invalid);
  protected readonly fields = computed(() =>
    INPUT_FIELDS.filter((field) => !field.modes || field.modes.includes(this.mode())),
  );
  private readonly result = computed(() => estimate(this.parsed().inputs));
  protected readonly outputs = computed(() =>
    GROUPS.map(({ group, label }) => ({ label, items: this.result().outputs.filter((output) => output.group === group) })),
  );

  protected readonly onRadioGroupKeyDown = onRadioGroupKeyDown;

  protected set(key: string, value: string) {
    this.values.update((values) => ({ ...values, [key]: value }));
  }

  protected reset() {
    this.values.set(this.initial());
  }
}
