import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  backupFileName,
  backupSummary,
  makeBackup,
  mergeInterviews,
  mergeNotebook,
  mergeProgress,
  readBackup,
} from '@lib/progress/backup';
import { InterviewsStore } from '../../core/interviews.store';
import { NotebookStore } from '../../core/notebook.store';
import { ProgressStore } from '../../core/progress.store';

const BUTTON =
  'inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold text-fg-soft transition-colors hover:border-border-strong hover:text-fg focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent';

/** Bigger than any real backup; a file this size is something else. */
const MAX_FILE_BYTES = 10 * 1024 * 1024;

/**
 * Downloads everything the learner has (progress, notebook and mock interviews of every topic) as
 * a backup file, or adds a backup to the account: one exported here, or from TheSWEguide
 * (lib/progress/backup.ts). TheSWEguide's BackupControls replaced what the browser had; here
 * nothing in the account is removed.
 */
@Component({
  selector: 'app-backup-controls',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="flex flex-wrap gap-2">
      <button type="button" [class]="button" (click)="exportBackup()">Export backup</button>
      <button type="button" [class]="button" (click)="fileInput.click()">Import backup</button>
      <input
        #fileInput
        type="file"
        accept="application/json,.json"
        class="sr-only"
        tabindex="-1"
        aria-label="Choose a backup file"
        (change)="onFile($event)"
      />
    </div>
    <p role="status" aria-live="polite" [class]="message() ? 'mt-2 text-sm ' + (failed() ? 'text-danger' : 'text-success') : 'sr-only'">
      {{ message() }}
    </p>
  `,
})
export class BackupControlsComponent {
  private readonly progress = inject(ProgressStore);
  private readonly notebook = inject(NotebookStore);
  private readonly interviews = inject(InterviewsStore);

  protected readonly message = signal('');
  protected readonly failed = signal(false);
  protected readonly button = BUTTON;

  protected exportBackup() {
    const now = new Date();
    const backup = makeBackup(
      { progress: this.progress.progress(), notebook: this.notebook.notebook(), interviews: this.interviews.state() },
      now,
    );
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = backupFileName(now);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    this.say('Backup downloaded.');
  }

  protected async onFile(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // choosing the same file again fires another change
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      this.say('That file is too big to be a backup.', true);
      return;
    }
    let text: string;
    try {
      text = await file.text();
    } catch {
      this.say('That file couldn’t be read.', true);
      return;
    }
    const result = readBackup(text);
    if (result.ok === false) {
      this.say(
        result.reason === 'newer'
          ? 'That backup was made by a newer version and can’t be imported.'
          : 'That file isn’t a TheSWEguide or NeoLevelUP backup.',
        true,
      );
      return;
    }
    const { backup } = result;
    const confirmed = window.confirm(
      `Add this backup to your account? It has ${backupSummary(backup)}.\n\n` +
        'Nothing already in your account is removed. Where both have the same item, the more recent one is kept.',
    );
    if (!confirmed) return;
    if (backup.progress) this.progress.replace(mergeProgress(this.progress.progress(), backup.progress));
    if (backup.notebook) this.notebook.replace(mergeNotebook(this.notebook.notebook(), backup.notebook));
    if (backup.interviews) this.interviews.replace(mergeInterviews(this.interviews.state(), backup.interviews));
    this.say('Backup imported. It’s being saved to your account.');
  }

  private say(message: string, failed = false) {
    this.message.set(message);
    this.failed.set(failed);
  }
}
