"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const memcached = require("memcached");
const KEY = `account1/balance`;
const memcachedClient = new memcached(
  `${process.env.ENDPOINT}:${process.env.PORT}`
);

exports.chargeRequestMemcached = async function (event) {
  // Record the start time
  const startTime = Date.now();
  var remainingBalance = await getBalanceMemcached(KEY);
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

  remainingBalance = await chargeMemcached(KEY, charges);

  // Calculate the elapsed time
  const endTime = Date.now();
  const executionTime = endTime - startTime;

  console.log(`[Memcached-charge] execution time: ${executionTime} ms`);

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

function authorizeRequest(remainingBalance, charges) {
  return remainingBalance >= charges;
}

async function getBalanceMemcached(key) {
  return new Promise((resolve, reject) => {
    memcachedClient.get(key, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(Number(data) || 0);
      }
    });
  });
}

async function chargeMemcached(key, charges) {
  return new Promise((resolve, reject) => {
    memcachedClient.decr(key, charges, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(Number(result));
      }
    });
  });
}