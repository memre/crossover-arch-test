"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redis = require("redis");
const util = require("util");
const KEY = `account1/balance`;

exports.chargeRequestRedis = async function (event) {
  // Record the start time
  const startTime = Date.now();
  const redisClient = await getRedisClient();

  var remainingBalance = await getBalanceRedis(redisClient, KEY);
  const charges = getCharges(event.serviceType, event.unit);
  const isAuthorized = authorizeRequest(remainingBalance, charges);

  if (!isAuthorized) {
    return {
      statusCode: 403,
      body: JSON.stringify({
        remainingBalance,
        isAuthorized,
        charges: 0,
      }),
    };
  }

  remainingBalance = await chargeRedis(redisClient, KEY, charges);

  await disconnectRedis(redisClient);

  // Calculate the elapsed time
  const endTime = Date.now();
  const executionTime = endTime - startTime;

  console.log(`[Redis-charge] execution time: ${executionTime} ms`);

  return {
    statusCode: 200,
    body: JSON.stringify({
      remainingBalance,
      charges,
      isAuthorized,
    }),
  };
};

function getCharges(serviceType, unit) {
  const chargeMap = {
    voice: unit, // assume 1 mins of voice call is 1$
    sms: unit, // assume 1 sms is 1$
    data: unit, // assume 1 mb of data is 1$
  };

  // if unit is not defined, assume it was 1$
  return chargeMap[serviceType] || unit;
}

async function getBalanceRedis(redisClient, key) {
  const res = await util
    .promisify(redisClient.get)
    .bind(redisClient)
    .call(redisClient, key);
  return parseInt(res || "0");
}

async function chargeRedis(redisClient, key, charges) {
  return util
    .promisify(redisClient.decrby)
    .bind(redisClient)
    .call(redisClient, key, charges);
}

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
      } else if (res === "OK") {
        console.log("redis client disconnected");
        resolve(res);
      } else {
        reject("unknown error closing redis connection.");
      }
    });
  });
}

function authorizeRequest(remainingBalance, charges) {
  return remainingBalance >= charges;
}