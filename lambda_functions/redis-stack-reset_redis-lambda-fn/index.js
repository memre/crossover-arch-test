"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redis = require("redis");
const KEY = `account1/balance`;
const DEFAULT_BALANCE = 100;

exports.resetRedis = async function () {
  // Record the start time
  const startTime = Date.now();
  const redisClient = await getRedisClient();

  const ret = new Promise((resolve, reject) => {
    redisClient.set(KEY, String(DEFAULT_BALANCE), (err, res) => {
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

  const result = await ret;
  await disconnectRedis(redisClient);

  // Calculate the elapsed time
  const endTime = Date.now();
  const executionTime = endTime - startTime;

  console.log(`[Redis-reset] execution time: ${executionTime} ms`);

  return result;
};

async function getRedisClient() {
  return new Promise((resolve, reject) => {
    try {
      const client = new redis.RedisClient({
        host: process.env.ENDPOINT,
        port: parseInt(process.env.PORT || "6379"),
      });
      client.on("ready", () => {
        console.log("redis client ready");
        resolve(client);
      });
    } catch (error) {
      reject(error);
    }
  });
}

async function disconnectRedis(client) {
  return new Promise((resolve, reject) => {
    client.quit((error, res) => {
      if (error) {
        reject(error);
      } else if (res == "OK") {
        console.log("redis client disconnected");
        resolve(res);
      } else {
        reject("unknown error closing redis connection.");
      }
    });
  });
}
