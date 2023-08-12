"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const memcached = require("memcached");
const KEY = `account1/balance`;
const DEFAULT_BALANCE = 100;
const MAX_EXPIRATION = 60 * 60 * 24 * 30;
const memcachedClient = new memcached(
  `${process.env.ENDPOINT}:${process.env.PORT}`
);

exports.resetMemcached = async function () {
  // Record the start time
  const startTime = Date.now();
  const ret = new Promise((resolve, reject) => {
    memcachedClient.set(KEY, DEFAULT_BALANCE, MAX_EXPIRATION, (err) => {
      if (err) {
        reject({
          statusCode: 500,
          body: JSON.stringify(err),
        });
      } else {
        resolve({
          statusCode: 200,
          body: "OK",
        });
      }
    });
  });

  // Calculate the elapsed time
  const endTime = Date.now();
  const executionTime = endTime - startTime;

  console.log(`[Memcached-reset] execution time: ${executionTime} ms`);

  return ret;
};
