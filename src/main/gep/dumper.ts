import { app } from 'electron';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Raw GEP event log (M0).
 *
 * Writes every event and info update exactly as GEP delivered it, one JSON
 * object per line. The point is a fixture: capture one real match, then
 * develop teamfight segmentation, impact scoring and matchup analysis
 * against the file instead of launching the game over and over.
 *
 * Two rules this file exists to enforce:
 *
 * 1. GEP carries NO timestamps. We stamp on arrival, so the write path
 *    must not block — everything is appended to an open stream, never
 *    read-modify-write.
 * 2. Payloads are stored verbatim. roster_XX and kill_feed arrive as JSON
 *    *strings*; parsing them is the analysis layer's job, and a fixture
 *    that has already been interpreted cannot be re-interpreted when the
 *    parser turns out to be wrong.
 *
 * The file contains other players' BattleTags, so it stays in userData and
 * is never written into the repo.
 */

export type DumpKind = 'meta' | 'info' | 'event';

export interface DumpLine {
  /** Wall clock on arrival, epoch ms. */
  t: number;
  /** Milliseconds since match_start, or null outside a match. */
  rel: number | null;
  kind: DumpKind;
  gameId?: number;
  payload: unknown;
}

export interface DumpFileInfo {
  name: string;
  path: string;
  bytes: number;
  lines: number;
  startedAt: number;
}

function dumpDir(): string {
  return path.join(app.getPath('userData'), 'gep-dumps');
}

function stamp(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}` +
    `-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
  );
}

export class EventDumper {
  private stream: fs.WriteStream | null = null;
  private filePath: string | null = null;
  private startedAt = 0;
  private lineCount = 0;
  private matchStartedAt: number | null = null;

  get isOpen(): boolean {
    return this.stream !== null;
  }

  get directory(): string {
    return dumpDir();
  }

  get current(): DumpFileInfo | null {
    if (!this.filePath) return null;
    return {
      name: path.basename(this.filePath),
      path: this.filePath,
      bytes: this.bytesWritten,
      lines: this.lineCount,
      startedAt: this.startedAt,
    };
  }

  private bytesWritten = 0;

  open(gameId: number, note = ''): void {
    if (this.stream) return;

    const dir = dumpDir();
    fs.mkdirSync(dir, { recursive: true });

    this.startedAt = Date.now();
    this.filePath = path.join(dir, `ow-${stamp(new Date(this.startedAt))}.jsonl`);
    this.stream = fs.createWriteStream(this.filePath, { flags: 'a' });
    this.lineCount = 0;
    this.bytesWritten = 0;
    this.matchStartedAt = null;

    this.write({
      t: this.startedAt,
      rel: null,
      kind: 'meta',
      gameId,
      payload: {
        note,
        app: app.getVersion(),
        electron: process.versions.electron,
        platform: process.platform,
        // So a fixture read months later says which contract produced it.
        format: 'statswatch-gep-dump/1',
      },
    });
  }

  /** Called when match_start / match_end arrive, so `rel` means something. */
  markMatchStart(at: number): void {
    this.matchStartedAt = at;
  }

  markMatchEnd(): void {
    this.matchStartedAt = null;
  }

  record(kind: Exclude<DumpKind, 'meta'>, gameId: number, payload: unknown): void {
    const t = Date.now();
    this.write({
      t,
      rel: this.matchStartedAt === null ? null : t - this.matchStartedAt,
      kind,
      gameId,
      payload,
    });
  }

  private write(line: DumpLine): void {
    if (!this.stream) return;
    const text = JSON.stringify(line) + '\n';
    this.stream.write(text);
    this.lineCount += 1;
    this.bytesWritten += Buffer.byteLength(text);
  }

  close(): void {
    if (!this.stream) return;
    this.stream.end();
    this.stream = null;
    this.matchStartedAt = null;
  }

  /** Dumps on disk, newest first. */
  list(): DumpFileInfo[] {
    const dir = dumpDir();
    if (!fs.existsSync(dir)) return [];

    return fs
      .readdirSync(dir)
      .filter((f) => f.endsWith('.jsonl'))
      .map((name) => {
        const full = path.join(dir, name);
        const st = fs.statSync(full);
        return {
          name,
          path: full,
          bytes: st.size,
          // Counting lines means reading the file; for the list view the
          // byte size is enough and the active file reports its own count.
          lines: -1,
          startedAt: st.birthtimeMs || st.mtimeMs,
        };
      })
      .sort((a, b) => b.startedAt - a.startedAt);
  }
}

export const dumper = new EventDumper();
