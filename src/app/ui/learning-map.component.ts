import { ChangeDetectionStrategy, Component } from '@angular/core';

// The hub's illustration: a map of the four topics as clusters of nodes, with one learning path
// drawn through all of them. Decorative; it animates only when motion is allowed (styles.css).

type Point = [number, number];

const NODES: Record<string, Point> = {
  J1: [70, 80],
  J2: [150, 52],
  J3: [128, 138],
  D1: [330, 64],
  D2: [430, 96],
  D3: [372, 156],
  L1: [92, 262],
  L2: [178, 300],
  L3: [62, 336],
  H1: [344, 248],
  H2: [448, 276],
  H3: [382, 330],
};

const TOPIC_COLOR: Record<string, string> = { J: 'var(--java)', D: 'var(--dsa)', L: 'var(--lld)', H: 'var(--hld)' };

const EDGES = [
  'J1J2', 'J2J3', 'J1J3', 'D1D2', 'D2D3', 'D1D3', 'L1L2', 'L2L3', 'L1L3',
  'H1H2', 'H2H3', 'H1H3', 'J2D1', 'J3L1', 'D3H1', 'L2H1', 'J3D3', 'H3L2',
];

const ROUTE = ['J1', 'J2', 'D1', 'D2', 'D3', 'H1', 'H2', 'H3', 'L2', 'L1', 'J3'];

const LABELS = [
  { text: 'JAVA', x: 52, y: 32, color: 'var(--java)' },
  { text: 'DSA', x: 404, y: 46, color: 'var(--dsa)' },
  { text: 'LLD', x: 40, y: 376, color: 'var(--lld)' },
  { text: 'HLD', x: 424, y: 370, color: 'var(--hld)' },
];

/** Use on an svg: `<svg appLearningMap class="w-full max-w-lg">`. */
@Component({
  selector: 'svg[appLearningMap]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { viewBox: '0 0 500 390', role: 'presentation', 'aria-hidden': 'true' },
  template: `
    <svg:g stroke="var(--border-strong)" stroke-width="1.5">
      @for (edge of edges; track edge.id) {
        <svg:line [attr.x1]="edge.from[0]" [attr.y1]="edge.from[1]" [attr.x2]="edge.to[0]" [attr.y2]="edge.to[1]" />
      }
    </svg:g>
    <svg:path
      class="learning-map-route"
      [attr.d]="route"
      pathLength="1"
      fill="none"
      stroke="var(--fg)"
      stroke-opacity="0.55"
      stroke-width="2.5"
      stroke-linejoin="round"
      stroke-linecap="round"
    />
    @for (node of nodes; track node.id) {
      @if (node.hub) {
        <svg:circle [attr.cx]="node.x" [attr.cy]="node.y" r="10" [attr.fill]="node.color" />
      } @else {
        <svg:circle
          [attr.cx]="node.x"
          [attr.cy]="node.y"
          r="7"
          fill="var(--surface)"
          [attr.stroke]="node.color"
          stroke-width="2.5"
        />
      }
    }
    <svg:circle class="learning-map-traveller" r="5" fill="var(--fg)" opacity="0">
      <svg:animate attributeName="opacity" from="0" to="1" begin="2.6s" dur="0.4s" fill="freeze" />
      <svg:animateMotion dur="14s" begin="2.6s" repeatCount="indefinite" [attr.path]="route" />
    </svg:circle>
    @for (label of labels; track label.text) {
      <svg:text
        [attr.x]="label.x"
        [attr.y]="label.y"
        [attr.fill]="label.color"
        font-family="var(--font-mono)"
        font-size="13"
        font-weight="600"
        letter-spacing="0.12em"
      >
        {{ label.text }}
      </svg:text>
    }
  `,
})
export class LearningMapComponent {
  protected readonly edges = EDGES.map((id) => ({ id, from: NODES[id.slice(0, 2)], to: NODES[id.slice(2)] }));
  protected readonly route = `M${ROUTE.map((id) => NODES[id].join(' ')).join(' L')}`;
  protected readonly nodes = Object.entries(NODES).map(([id, [x, y]]) => ({
    id,
    x,
    y,
    color: TOPIC_COLOR[id[0]],
    hub: id.endsWith('1'),
  }));
  protected readonly labels = LABELS;
}
