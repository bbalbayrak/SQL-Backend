const dotenv = require('dotenv');

const dotenvResult = dotenv.config();
const fileEnv = dotenvResult.parsed || {};

function getFileEnv(name, fallback) {
  return Object.prototype.hasOwnProperty.call(fileEnv, name) ? fileEnv[name] : fallback;
}

function unquote(value) {
  return String(value).trim().replace(/^['"]|['"]$/g, '');
}

function getFileBoolean(name, fallback = false) {
  return unquote(getFileEnv(name, fallback ? 'true' : 'false')).toLowerCase() === 'true';
}

function getFileNumber(name, fallback) {
  const value = Number(unquote(getFileEnv(name, fallback)));
  return Number.isFinite(value) ? value : fallback;
}

const { Pool } = require('pg');
const {
  recordDbQuery,
  recordDbTransaction,
  updateDbPoolMetrics,
} = require('./database-metrics');

const PRESSURE_MODE = getFileBoolean('DB_PRESSURE_MODE', false);
const ERROR_MODE = getFileBoolean('DB_ERROR_MODE', false);
const ERROR_EVERY = Math.max(1, getFileNumber('DB_ERROR_EVERY', 8));
const POOL_MAX = getFileNumber('DB_POOL_MAX', 5);
const PRESSURE_HOLD_MS = getFileNumber('DB_PRESSURE_HOLD_MS', 8000);

const pool = new Pool({
  host: (process.env.PG_HOST || 'localhost').trim(),
  port: Number(process.env.PG_PORT || 5432),
  database: (process.env.PG_DATABASE || '').trim(),
  user: (process.env.PG_USER || '').trim(),
  password: (process.env.PG_PASSWORD || '').trim(),
  max: POOL_MAX,
});

let jobId = 0;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function updatePoolSnapshot(waitMs = 0) {
  updateDbPoolMetrics({
    active: pool.totalCount - pool.idleCount,
    waitMs,
  });
}

async function measuredQuery(operation, queryText, values = []) {
  const startedAt = Date.now();
  const waitStartedAt = Date.now();
  let client;

  try {
    client = await pool.connect();
    updatePoolSnapshot(Date.now() - waitStartedAt);

    const result = await client.query(queryText, values);
    recordDbQuery({
      durationMs: Date.now() - startedAt,
      success: true,
      operation,
    });

    return result;
  } catch (error) {
    recordDbQuery({
      durationMs: Date.now() - startedAt,
      success: false,
      operation,
    });
    throw error;
  } finally {
    if (client) {
      client.release();
    }

    updatePoolSnapshot(0);
  }
}

async function holdConnection(index) {
  const startedAt = Date.now();
  const waitStartedAt = Date.now();
  let client;

  try {
    client = await pool.connect();
    updatePoolSnapshot(Date.now() - waitStartedAt);
    await client.query('SELECT pg_sleep($1)', [PRESSURE_HOLD_MS / 1000]);
    recordDbQuery({
      durationMs: Date.now() - startedAt,
      success: true,
      operation: `pressure_hold_${index}`,
    });
  } catch (error) {
    recordDbQuery({
      durationMs: Date.now() - startedAt,
      success: false,
      operation: `pressure_hold_${index}`,
    });
    throw error;
  } finally {
    if (client) {
      client.release();
    }

    updatePoolSnapshot(0);
  }
}

async function runConnectionPressure() {
  const holders = Array.from({ length: POOL_MAX }, (_, index) => holdConnection(index + 1));

  await sleep(500);
  updatePoolSnapshot(0);

  const waitStartedAt = Date.now();
  const queuedQuery = measuredQuery('pressure_wait', 'SELECT 1').finally(() => {
    updatePoolSnapshot(0);
  });

  const waitProbe = setInterval(() => {
    updatePoolSnapshot(Date.now() - waitStartedAt);
  }, 1000);

  try {
    await Promise.all([...holders, queuedQuery]);
    recordDbTransaction({ success: true });
  } finally {
    clearInterval(waitProbe);
    updatePoolSnapshot(0);
  }
}

async function setup() {
  await measuredQuery(
    'create_table',
    `CREATE TABLE IF NOT EXISTS qommity_metric_probe (
      id SERIAL PRIMARY KEY,
      label TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
  );
}

async function runIteration() {
  jobId += 1;
  let success = true;

  try {
    await measuredQuery(
      'insert',
      'INSERT INTO qommity_metric_probe(label) VALUES($1)',
      [`probe-${jobId}`],
    );

    await measuredQuery(
      'select',
      'SELECT COUNT(*)::int AS total FROM qommity_metric_probe',
    );

    if (jobId % 3 === 0) {
      await measuredQuery(
        'delete',
        'DELETE FROM qommity_metric_probe WHERE id IN (SELECT id FROM qommity_metric_probe ORDER BY id ASC LIMIT 1)',
      );
    }

    if (PRESSURE_MODE && jobId % 4 === 0) {
      console.log(`[database] pressure start poolMax=${POOL_MAX} holdMs=${PRESSURE_HOLD_MS}`);
      await runConnectionPressure();
      console.log('[database] pressure complete');
    }

    if (ERROR_MODE && ERROR_EVERY > 0 && jobId % ERROR_EVERY === 0) {
      await measuredQuery('test_error', 'SELECT * FROM qommity_missing_table');
    }
  } catch (error) {
    success = false;
    console.log(`[database] iteration=${jobId} error=${error.message}`);
  } finally {
    recordDbTransaction({ success });
    const nextErrorIn = ERROR_MODE ? ERROR_EVERY - (jobId % ERROR_EVERY) : 'off';
    console.log(
      `[database] iteration=${jobId} status=${success ? 'success' : 'failed'} active=${pool.totalCount - pool.idleCount} nextErrorIn=${nextErrorIn}`,
    );
  }
}

async function main() {
  console.log('[database] clean metric simulator started. Press Ctrl+C to stop.');
  console.log(`[database] target=${process.env.PG_USER}@${process.env.PG_HOST}:${process.env.PG_PORT}/${process.env.PG_DATABASE}`);
  console.log(`[database] pressureMode=${PRESSURE_MODE} errorMode=${ERROR_MODE} errorEvery=${ERROR_EVERY} poolMax=${POOL_MAX} holdMs=${PRESSURE_HOLD_MS}`);
  console.log(`[database] intentional DB errors are ${ERROR_MODE ? `enabled every ${ERROR_EVERY} iterations` : 'disabled'}`);

  await setup();

  while (true) {
    await runIteration();
    await sleep(2000);
  }
}

async function shutdown() {
  await pool.end();
}

process.once('SIGINT', () => {
  shutdown().finally(() => process.exit(0));
});

process.once('SIGTERM', () => {
  shutdown().finally(() => process.exit(0));
});

main().catch((error) => {
  console.error('[database] simulator failed', error);
  shutdown().finally(() => process.exit(1));
});





