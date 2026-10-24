import { JsonlOutput } from './ipc/JsonlOutput.js';
import { JsonlInput } from './ipc/JsonlInput.js';
import { WorkerDispatcher } from './ipc/WorkerDispatcher.js';
import { RequestScheduler } from './ipc/RequestScheduler.js';

/** Node worker 入口只组装进程 I/O；协议、队列和运行时分别管理自己的状态。 */
let scheduler: RequestScheduler;

const failPipe = () => {
  if (!scheduler.beginEnding()) {
    return;
  }
  process.stderr.write('Agent IPC buffer exceeded its bound\n');
  process.stdin.destroy();
  // Already-committed checkpoints survive this bounded-memory failure.
  process.exit(1);
};

const writer = new JsonlOutput(process.stdout, failPipe);

const output = (value: unknown) => writer.send(value);

const dispatcher = new WorkerDispatcher(output);

scheduler = new RequestScheduler(dispatcher, output, () =>
  process.stdin.destroy(),
);

const reader = new JsonlInput(
  (message, bytes) => scheduler.accept(message, bytes),
  output,
  failPipe,
);

process.stdin.on('data', (chunk: Buffer) => reader.read(chunk));

process.stdin.on('end', () => {
  void scheduler.close();
});

process.on('SIGTERM', () => {
  void scheduler.close().finally(() => process.exit(0));
});
