import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '');
const reportDirectory = path.join(repositoryRoot, 'reports', 'tests');
const temporaryReport = path.join(tmpdir(), `cel-position-junit-${process.pid}.xml`);

const run = spawnSync(process.execPath, [
  '--disable-warning=ExperimentalWarning',
  '--test',
  '--test-reporter=junit',
  `--test-reporter-destination=${temporaryReport}`,
  '--test-reporter=spec',
  '--test-reporter-destination=stdout',
  'tests/**/*.test.js',
], { cwd: repositoryRoot, encoding: 'utf8' });

process.stdout.write(run.stdout ?? '');
process.stderr.write(run.stderr ?? '');

const rawReport = readFileSync(temporaryReport, 'utf8');
rmSync(temporaryReport);

const sanitizedReport = rawReport
  .replaceAll(repositoryRoot, '.')
  .replace(/hostname="[^"]*"/g, 'hostname="redacted"');

const readCount = (label) => Number(rawReport.match(new RegExp(`<!-- ${label} (\\d+) -->`))?.[1] ?? 0);

const summary = {
  generatedAt: new Date().toISOString(),
  command: 'npm run test:report',
  nodeVersion: process.version,
  platform: process.platform,
  tests: readCount('tests'),
  passed: readCount('pass'),
  failed: readCount('fail'),
  skipped: readCount('skipped'),
  cancelled: readCount('cancelled'),
  exitCode: run.status,
};

mkdirSync(reportDirectory, { recursive: true });
writeFileSync(path.join(reportDirectory, 'junit.xml'), sanitizedReport);
writeFileSync(path.join(reportDirectory, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);

process.exit(run.status ?? 1);
