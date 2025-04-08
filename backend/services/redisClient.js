const redis = require('redis');

const DEFAULT_TTL = process.env.REDIS_TTL ? parseInt(process.env.REDIS_TTL) : 3600; 

let initialized = false;
let generalClient;
let pubClient;
let subClient;
let persistClient;

async function initializeRedisClients() {
    if (initialized) {
        console.log('Redis clients already initialized');
        return;
    }

    try {
        generalClient = redis.createClient({
            url: process.env.REDIS_URL,
            socket: {
                reconnectStrategy: (retries) => {
                    if (retries > 10) {
                        console.error('Máximo de tentativas de reconexão Redis atingido');
                        return new Error('Máximo de tentativas de reconexão Redis atingido');
                    }
                    const delay = Math.min(Math.pow(2, retries) * 100, 3000);
                    const jitter = Math.random() * 100;
                    return delay + jitter;
                }
            }
        });

        pubClient = generalClient.duplicate();
        subClient = generalClient.duplicate();
        persistClient = redis.createClient({
            url: process.env.REDIS_URL,
            password: process.env.REDIS_PASSWORD,
            database: 1,
            socket: {
                reconnectStrategy: (retries) => {
                    if (retries > 10) {
                        console.error('Máximo de tentativas de reconexão Redis atingido');
                        return new Error('Máximo de tentativas de reconexão Redis atingido');
                    }
                    const delay = Math.min(Math.pow(2, retries) * 100, 3000);
                    const jitter = Math.random() * 100;
                    return delay + jitter;
                }
            }
        });

        await Promise.all([
            generalClient.connect(),
            pubClient.connect(),
            subClient.connect(),
            persistClient.connect()
        ]);

        console.log('Todos os clientes Redis conectados com sucesso');
        initialized = true;

        [generalClient, pubClient, persistClient, subClient].forEach(client => {
            client.on('error', err => {
                console.error('Redis Client Error', err);
                //  circuit breaker logic 
            });

            client.on('connect', () => {
                console.log('Redis Client: conexão estabelecida');
            });

            client.on('reconnecting', () => {
                console.log('Redis Client: tentando reconectar...');
            });
        });

    } catch (err) {
        console.error('Erro ao inicializar clientes Redis:', err);
        throw err;
    }
}

initializeRedisClients().catch(err => {
    console.error('Erro ao inicializar Redis:', err);
});

module.exports = {
    generalClient,
    pubClient,
    subClient,
    persistClient,
    DEFAULT_TTL,
    setCache: async (key, data, ttl = DEFAULT_TTL) => {
        const stringData = typeof data === 'string' ? data : JSON.stringify(data);
        await generalClient.set(key, stringData, { EX: ttl });
    },
    getCache: async (key) => {
        const data = await generalClient.get(key);
        if (data === null) return null;
        try {
            return JSON.parse(data);
        } catch {
            return data;
        }
    },
    delCache: async (key) => {
        await generalClient.del(key);
    },
    clearCache: async () => {
        await generalClient.flushDb();
    },
    cacheAside: async (key, fetchDataFn, ttl = DEFAULT_TTL, type = 'string') => {
        try {
            if (type === 'list') {
                const listData = await generalClient.lRange(key, 0, -1);
                if (listData.length > 0) return listData.map(item => {
                    try { return JSON.parse(item); } catch { return item; }
                });
                
                const freshData = await fetchDataFn();
                if (freshData && Array.isArray(freshData) && freshData.length > 0) {
                    const pipeline = generalClient.multi();
                    pipeline.del(key);
                    freshData.forEach(item => pipeline.lPush(key, JSON.stringify(item)));
                    pipeline.expire(key, ttl);
                    await pipeline.exec();
                }
                return freshData;
            }
            
            if (type === 'hash') {
                const cachedHash = await generalClient.hGetAll(key);
                if (Object.keys(cachedHash).length > 0) return cachedHash;
                
                const freshData = await fetchDataFn();
                if (freshData && typeof freshData === 'object') {
                    await generalClient.hSet(key, freshData);
                    await generalClient.expire(key, ttl);
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
        } catch (error) {
            console.error(`Erro em cacheAside para chave ${key}:`, error);
            return await fetchDataFn();
        }
    },
    writeThrough: async (key, data, writeFn, ttl = DEFAULT_TTL) => {
        try {
            await writeFn(data);
            await setCache(key, data, ttl);
            return true;
        } catch (error) {
            console.error(`Erro em writeThrough para chave ${key}:`, error);
            return false;
        }
    },
    acquireLock: async (lockName, ttl = 30) => {
        const lockValue = Date.now().toString();
        const acquired = await generalClient.set(`lock:${lockName}`, lockValue, {
            NX: true,
            EX: ttl
        });
        return acquired ? lockValue : null;
    },
    releaseLock: async (lockName, lockValue) => {
        const script = `
            if redis.call("get", KEYS[1]) == ARGV[1] then
                return redis.call("del", KEYS[1])
            else
                return 0
            end
        `;
        
        return await generalClient.eval(
            script,
            {
                keys: [`lock:${lockName}`],
                arguments: [lockValue]
            }
        );
    }
};