const pgp = require("pg-promise")();
require("dotenv").config();

let databaseMetrics = null;
try {
  databaseMetrics = require("../database-metrics");
} catch {
  databaseMetrics = null;
}

const connection = {
  host: (process.env.APP_PG_HOST || "localhost").trim(),
  port: Number(process.env.APP_PG_PORT || 5432),
  database: (process.env.APP_PG_DATABASE || "deneme2").trim(),
  user: (process.env.APP_PG_USER || "postgres").trim(),
  password: (process.env.APP_PG_PASSWORD || "admin").trim(),
};

const rawDb = pgp(connection);
const QUERY_METHODS = new Set([
  "any",
  "many",
  "manyOrNone",
  "none",
  "one",
  "oneOrNone",
  "query",
  "result",
]);

function inferOperation(args, fallback) {
  const sql = typeof args[0] === "string" ? args[0].trim() : "";
  const [operation] = sql.split(/\s+/);

  return operation ? operation.toLowerCase() : fallback;
}

function recordQuery(args, startedAt, success, fallbackOperation) {
  if (!databaseMetrics) {
    return;
  }

  databaseMetrics.recordDbQuery({
    durationMs: Date.now() - startedAt,
    success,
    operation: inferOperation(args, fallbackOperation),
  });
}

function recordTransaction(success) {
  if (!databaseMetrics) {
    return;
  }

  databaseMetrics.recordDbTransaction({ success });
}

function instrumentDb(dbLike) {
  return new Proxy(dbLike, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver);

      if (typeof value !== "function") {
        return value;
      }

      if (property === "tx") {
        return async (...args) => {
          const startedAt = Date.now();
          const callbackIndex = args.findIndex((arg) => typeof arg === "function");

          if (callbackIndex >= 0) {
            const callback = args[callbackIndex];
            args[callbackIndex] = (transaction) => callback(instrumentDb(transaction));
          }

          try {
            const result = await value.apply(target, args);
            recordTransaction(true);
            recordQuery(["transaction"], startedAt, true, "transaction");
            return result;
          } catch (error) {
            recordTransaction(false);
            recordQuery(["transaction"], startedAt, false, "transaction");
            throw error;
          }
        };
      }

      if (!QUERY_METHODS.has(property)) {
        return value.bind(target);
      }

      return async (...args) => {
        const startedAt = Date.now();

        try {
          const result = await value.apply(target, args);
          recordQuery(args, startedAt, true, property);
          return result;
        } catch (error) {
          recordQuery(args, startedAt, false, property);
          throw error;
        }
      };
    },
  });
}

module.exports = instrumentDb(rawDb);
