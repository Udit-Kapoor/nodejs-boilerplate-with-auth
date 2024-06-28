const redisClient = require('../utils/redis');
const hashFn = require('../utils/hash');
const isProd = require('../utils/isProd');

const redisMiddleware = async (req, res, next) => {
  try {
    // hash the url to make a key
    const hash = hashFn(req.url);

    // check for cache hit
    const cache = await readData(hash);
    if (cache) {
      console.log('cache hit');
      return res.send(JSON.parse(cache));
    }

    // if cache misses move to controller
    req.hash = hash;
    console.log('cache miss');
    next();
  } catch (error) {
    console.log(error);
    next();
  }
};

const setRedisCache = async (key, value, expiry, bypass = false) => {
  if (isProd(bypass) && isRedisWorking()) {
    try {
      // write data to the Redis cache
      await redisClient.set(key, JSON.stringify(value), {
        EX: expiry * 60 * 60,
      });
      console.log('cache set');
    } catch (e) {
      console.error(`Failed to cache data for key=${key}`, e);
    }
  }
};

const readRedisCache = async (key) => {
  if (isRedisWorking()) {
    try {
      // read data from Redis cache
      const data = await readData(key);
      if (data) {
        console.log('Got data');
        return JSON.parse(data);
      } else {
        return null;
      }
    } catch (e) {
      console.error(`Failed to cache data for key=${key}`, e);
    }
  }
};

const keepConnectionAlive = async () => {
  const res = await redisClient.ping();
  //   console.log(res);
};

function isRedisWorking() {
  // verify wheter there is an active connection
  // to a Redis server or not
  return !!redisClient?.isOpen;
}

async function readData(key) {
  let cachedValue = undefined;

  if (isRedisWorking()) {
    // try to get the cached response from redis
    cachedValue = await redisClient.get(key);
    if (cachedValue) {
      return cachedValue;
    }
  }

  return null;
}

setInterval(keepConnectionAlive, 30 * 1000);

module.exports = { redisMiddleware, setRedisCache, readRedisCache };
