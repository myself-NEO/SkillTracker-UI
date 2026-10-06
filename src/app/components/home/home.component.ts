import { Component, ElementRef, HostListener, OnDestroy, AfterViewInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

type Point = { x: number; y: number };
type GameState = 'idle' | 'running' | 'paused' | 'over';

const GRID_SIZE = 20;
const CELL_PX = 20;
const TICK_MS = 110;
const HIGH_SCORE_KEY = 'snake_high_score';

const DIRECTIONS: Record<string, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 }
};

const KEY_TO_DIRECTION: Record<string, string> = {
  ArrowUp: 'up', w: 'up', W: 'up',
  ArrowDown: 'down', s: 'down', S: 'down',
  ArrowLeft: 'left', a: 'left', A: 'left',
  ArrowRight: 'right', d: 'right', D: 'right'
};

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements AfterViewInit, OnDestroy {
  constructor(public authService: AuthService) {}

  @ViewChild('board', { static: true }) boardRef!: ElementRef<HTMLCanvasElement>;

  readonly boardPx = GRID_SIZE * CELL_PX;
  state: GameState = 'idle';
  score = 0;
  highScore = 0;

  private ctx!: CanvasRenderingContext2D;
  private snake: Point[] = [];
  private food: Point = { x: 0, y: 0 };
  private direction: Point = DIRECTIONS['right'];
  // Queued turns so quick key presses within one tick aren't lost or allowed to reverse the snake
  private pendingTurns: Point[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private touchStart: Point | null = null;

  ngAfterViewInit(): void {
    this.ctx = this.boardRef.nativeElement.getContext('2d')!;
    try {
      this.highScore = Number(localStorage.getItem(HIGH_SCORE_KEY)) || 0;
    } catch {
      this.highScore = 0;
    }
    this.resetBoard();
    this.draw();
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(e: KeyboardEvent): void {
    // Let focused buttons handle Space/Enter themselves
    if ((e.target as HTMLElement)?.closest('button, a, input')) {
      return;
    }
    if (e.key === ' ') {
      e.preventDefault();
      this.togglePlay();
      return;
    }
    const dir = KEY_TO_DIRECTION[e.key];
    if (dir) {
      if (this.state === 'running') {
        e.preventDefault();
      }
      this.turn(dir);
    }
  }

  onTouchStart(e: TouchEvent): void {
    const t = e.touches[0];
    this.touchStart = { x: t.clientX, y: t.clientY };
  }

  onTouchEnd(e: TouchEvent): void {
    if (!this.touchStart) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - this.touchStart.x;
    const dy = t.clientY - this.touchStart.y;
    this.touchStart = null;

    if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) {
      this.togglePlay();
      return;
    }
    if (Math.abs(dx) > Math.abs(dy)) {
      this.turn(dx > 0 ? 'right' : 'left');
    } else {
      this.turn(dy > 0 ? 'down' : 'up');
    }
  }

  togglePlay(): void {
    if (this.state === 'running') {
      this.state = 'paused';
      this.stopTimer();
    } else if (this.state === 'paused') {
      this.state = 'running';
      this.startTimer();
    } else {
      this.startGame();
    }
  }

  turn(name: string): void {
    if (this.state === 'idle' || this.state === 'over') {
      this.startGame();
    }
    if (this.state !== 'running') return;

    const next = DIRECTIONS[name];
    const last = this.pendingTurns[this.pendingTurns.length - 1] ?? this.direction;
    const isReverse = next.x === -last.x && next.y === -last.y;
    const isSame = next.x === last.x && next.y === last.y;
    if (!isReverse && !isSame && this.pendingTurns.length < 3) {
      this.pendingTurns.push(next);
    }
  }

  private startGame(): void {
    this.resetBoard();
    this.state = 'running';
    this.startTimer();
  }

  private resetBoard(): void {
    const mid = Math.floor(GRID_SIZE / 2);
    this.snake = [
      { x: mid, y: mid },
      { x: mid - 1, y: mid },
      { x: mid - 2, y: mid }
    ];
    this.direction = DIRECTIONS['right'];
    this.pendingTurns = [];
    this.score = 0;
    this.placeFood();
  }

  private startTimer(): void {
    this.stopTimer();
    this.timer = setInterval(() => this.tick(), TICK_MS);
  }

  private stopTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private tick(): void {
    const queued = this.pendingTurns.shift();
    if (queued) {
      this.direction = queued;
    }

    const head = this.snake[0];
    const next = { x: head.x + this.direction.x, y: head.y + this.direction.y };
    const eating = next.x === this.food.x && next.y === this.food.y;
    // The tail moves out of the way this tick unless the snake is growing
    const body = eating ? this.snake : this.snake.slice(0, -1);

    const hitWall = next.x < 0 || next.y < 0 || next.x >= GRID_SIZE || next.y >= GRID_SIZE;
    const hitSelf = body.some(p => p.x === next.x && p.y === next.y);
    if (hitWall || hitSelf) {
      this.gameOver();
      return;
    }

    this.snake = [next, ...body];
    if (eating) {
      this.score++;
      if (this.snake.length === GRID_SIZE * GRID_SIZE) {
        this.gameOver();
        return;
      }
      this.placeFood();
    }
    this.draw();
  }

  private gameOver(): void {
    this.stopTimer();
    this.state = 'over';
    if (this.score > this.highScore) {
      this.highScore = this.score;
      try {
        localStorage.setItem(HIGH_SCORE_KEY, String(this.highScore));
      } catch {
        // Storage unavailable (e.g. private mode); keep the in-memory high score
      }
    }
    this.draw();
  }

  private placeFood(): void {
    const free: Point[] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        if (!this.snake.some(p => p.x === x && p.y === y)) {
          free.push({ x, y });
        }
      }
    }
    this.food = free[Math.floor(Math.random() * free.length)] ?? { x: -1, y: -1 };
  }

  private draw(): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.boardPx, this.boardPx);

    // Subtle grid
    ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = (x % 2); y < GRID_SIZE; y += 2) {
        ctx.fillRect(x * CELL_PX, y * CELL_PX, CELL_PX, CELL_PX);
      }
    }

    // Food
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(
      this.food.x * CELL_PX + CELL_PX / 2,
      this.food.y * CELL_PX + CELL_PX / 2,
      CELL_PX / 2 - 3,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Snake
    this.snake.forEach((p, i) => {
      ctx.fillStyle = i === 0 ? '#a5b4fc' : '#6366f1';
      ctx.beginPath();
      ctx.roundRect(p.x * CELL_PX + 1, p.y * CELL_PX + 1, CELL_PX - 2, CELL_PX - 2, 5);
      ctx.fill();
    });
  }
}
