const redis = require('redis');

const DEFAULT_TTL = process.env.REDIS_TTL ? parseInt(process.env.REDIS_TTL) : 3600; 

function createRedisClient(url, options = {}) {
  const client = redis.createClient({
    url,
    password: process.env.REDIS_PASSWORD,
    retry_strategy: function(options) {
      if (options.error && options.error.code === 'ECONNREFUSED') {
        return new Error('O servidor Redis recusou a conexão');
      }
      if (options.total_retry_time > 1000 * 60 * 60) {
        return new Error('Tempo de retry esgotado');
      }
      if (options.attempt > 10) {
        return undefined; 
      }
      return Math.min(options.attempt * 100, 3000); // Backoff exponencial
    },
    ...options
  });
  
  client.on('error', (err) => console.error('Redis Client Error', err));
  
  return client;
}

const generalClient = createRedisClient(process.env.REDIS_URL);
const pubClient = generalClient.duplicate();
const subClient = generalClient.duplicate(); 
const persistClient = redis.createClient({ 
  url: process.env.REDIS_URL,
  password: process.env.REDIS_PASSWORD,
  database: 1 
});

(async () => {
  await generalClient.connect();
  await pubClient.connect();
  await subClient.connect();
  await persistClient.connect();
  console.log('Redis conectado');
})();

[generalClient, pubClient, persistClient, subClient].forEach(client => {
  client.on('error', err => console.error('Redis Client Error', err));
});

// Helpers para gerenciamento de cache
const setCache = async (key, data, ttl = DEFAULT_TTL) => {
  const stringData = typeof data === 'string' ? data : JSON.stringify(data);
  await generalClient.set(key, stringData, { EX: ttl });
};

const getCache = async (key) => {
  const data = await generalClient.get(key);
  if (data === null) return null;
  try {
    return JSON.parse(data);
  } catch {
    return data;
  }
};

const delCache = async (key) => {
  await generalClient.del(key);
};

const clearCache = async () => {
  await generalClient.flushAll();
};

const cacheAside = async (key, fetchDataFn, ttl = DEFAULT_TTL, type = 'string') => {
  if (type === 'list') {
    const listData = await generalClient.lRange(key, 0, -1);
    if (listData.length > 0) return listData.map(JSON.parse);
    
    const freshData = await fetchDataFn();
    if (freshData) {
      const pipeline = generalClient.multi();
      pipeline.del(key);
      freshData.forEach(item => pipeline.lPush(key, JSON.stringify(item)));
      pipeline.expire(key, ttl);
      await pipeline.exec();
    }
    return freshData;
  }

  const cachedData = await getCache(key);
  if (cachedData !== null) return cachedData;
  
  const freshData = await fetchDataFn();
  if (freshData !== null && freshData !== undefined) {
    await setCache(key, freshData, ttl);
  }
  return freshData;
};

const writeThrough = async (key, data, writeFn, ttl = DEFAULT_TTL) => {
  await writeFn(data); 
  await setCache(key, data, ttl); 
};

module.exports = {
  generalClient,
  pubClient,
  subClient,
  persistClient,
  DEFAULT_TTL,
  setCache,
  getCache,
  delCache,
  clearCache,
  cacheAside,
  writeThrough
};
