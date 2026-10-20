/**
 * Rate Limiter Distribuído com Redis para Edge Functions do Domus
 *
 * Substitui a implementação in-memory atual por uma solução distribuída
 * que funciona entre múltiplas instâncias do Supabase Edge Functions.
 */

import { Redis } from 'npm:@upstash/redis@1.22.1';

export interface RateLimitConfig {
  windowMs: number;      // Janela em milissegundos
  maxRequests: number;   // Máximo de requisições por janela
  keyPrefix?: string;    // Prefixo para chaves Redis
  skipFailedRequests?: boolean; // Não contar requisições com erro
  message?: string;      // Mensagem de erro personalizada
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;         // Timestamp de reset
  retryAfter?: number;   // Segundos para tentar novamente
  message?: string;
}

export class RedisRateLimiter {
  private redis: Redis;
  private defaultConfig: RateLimitConfig;

  constructor(redisUrl: string, redisToken: string, defaultConfig?: Partial<RateLimitConfig>) {
    this.redis = new Redis({
      url: redisUrl,
      token: redisToken,
      automaticDeserialization: false,
    });

    this.defaultConfig = {
      windowMs: 60 * 1000, // 1 minuto
      maxRequests: 60,     // 60 requisições por minuto
      keyPrefix: 'domus:rl',
      skipFailedRequests: false,
      message: 'Muitas requisições. Tente novamente mais tarde.',
      ...defaultConfig,
    };
  }

  /**
   * Gera uma chave única para rate limiting baseada em:
   * - IP do cliente
   * - User ID (se autenticado)
   * - Endpoint específico
   * - Organização (org_id)
   */
  private generateKey(
    identifier: string,
    endpoint?: string,
    orgId?: string
  ): string {
    const parts = [this.defaultConfig.keyPrefix];

    if (orgId) {
      parts.push(`org:${orgId}`);
    }

    parts.push(identifier);

    if (endpoint) {
      // Normaliza endpoint para formato de chave
      const normalizedEndpoint = endpoint
        .replace(/[^a-zA-Z0-9]/g, ':')
        .toLowerCase();
      parts.push(`endpoint:${normalizedEndpoint}`);
    }

    return parts.join(':');
  }

  /**
   * Implementa rate limiting usando algoritmo de token bucket distribuído
   */
  async checkRateLimit(
    identifier: string,
    config?: Partial<RateLimitConfig>,
    endpoint?: string,
    orgId?: string
  ): Promise<RateLimitResult> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const key = this.generateKey(identifier, endpoint, orgId);
    const now = Date.now();
    const windowStart = now - finalConfig.windowMs;

    try {
      // Usa script Lua para operação atômica no Redis
      const luaScript = `
        local key = KEYS[1]
        local now = tonumber(ARGV[1])
        local windowStart = tonumber(ARGV[2])
        local maxRequests = tonumber(ARGV[3])
        local windowMs = tonumber(ARGV[4])

        -- Remove requisições fora da janela
        redis.call('ZREMRANGEBYSCORE', key, 0, windowStart)

        -- Conta requisições na janela atual
        local requestCount = redis.call('ZCARD', key)

        if requestCount >= maxRequests then
          -- Está limitado, retorna tempo até o reset
          local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')[2]
          local resetTime = tonumber(oldest) + windowMs
          local retryAfter = math.ceil((resetTime - now) / 1000)

          return {
            0,  -- success: false
            maxRequests,
            math.max(0, maxRequests - requestCount),
            resetTime,
            retryAfter
          }
        else
          -- Adiciona nova requisição
          redis.call('ZADD', key, now, now .. ':' .. math.random())
          -- Expira a chave após a janela
          redis.call('EXPIRE', key, math.ceil(windowMs / 1000) + 1)

          return {
            1,  -- success: true
            maxRequests,
            math.max(0, maxRequests - requestCount - 1),
            now + windowMs,
            0   -- retryAfter: 0
          }
        end
      `;

      const result = await this.redis.eval(
        luaScript,
        [key],
        [
          now.toString(),
          windowStart.toString(),
          finalConfig.maxRequests.toString(),
          finalConfig.windowMs.toString(),
        ]
      );

      if (Array.isArray(result) && result.length >= 5) {
        const [success, limit, remaining, reset, retryAfter] = result.map(Number);

        return {
          success: success === 1,
          limit,
          remaining,
          reset,
          retryAfter: retryAfter > 0 ? retryAfter : undefined,
          message: success === 0 ? finalConfig.message : undefined,
        };
      }

      // Fallback se o script Lua falhar
      return await this.fallbackRateLimit(key, finalConfig, now, windowStart);

    } catch (error) {
      console.error('Redis rate limiting error:', error);

      // Fallback para rate limiting in-memory local se Redis falhar
      return {
        success: true, // Permite requisição para não quebrar o sistema
        limit: finalConfig.maxRequests,
        remaining: finalConfig.maxRequests - 1,
        reset: now + finalConfig.windowMs,
        message: 'Rate limiting temporariamente desabilitado',
      };
    }
  }

  /**
   * Implementação fallback usando operações Redis básicas
   */
  private async fallbackRateLimit(
    key: string,
    config: RateLimitConfig,
    now: number,
    windowStart: number
  ): Promise<RateLimitResult> {
    // Implementação simplificada sem Lua
    const requestsKey = `${key}:requests`;
    const counterKey = `${key}:counter`;

    // Usa pipeline para múltiplas operações
    const pipeline = this.redis.pipeline();

    // Adiciona timestamp atual
    pipeline.zadd(requestsKey, { score: now, member: `${now}:${Math.random()}` });

    // Remove timestamps antigos
    pipeline.zremrangebyscore(requestsKey, 0, windowStart);

    // Conta requisições
    pipeline.zcard(requestsKey);

    // Expira a chave
    pipeline.expire(requestsKey, Math.ceil(config.windowMs / 1000) + 1);

    const results = await pipeline.exec();

    if (results && results.length >= 3) {
      const requestCount = results[2] as number;

      if (requestCount > config.maxRequests) {
        // Está limitado - pega o timestamp mais antigo
        const oldestResult = await this.redis.zrange(requestsKey, 0, 0, { withScores: true });
        const oldestTimestamp = oldestResult && oldestResult[1] ? Number(oldestResult[1]) : now;
        const resetTime = oldestTimestamp + config.windowMs;
        const retryAfter = Math.ceil((resetTime - now) / 1000);

        return {
          success: false,
          limit: config.maxRequests,
          remaining: 0,
          reset: resetTime,
          retryAfter,
          message: config.message,
        };
      }
    }

    return {
      success: true,
      limit: config.maxRequests,
      remaining: Math.max(0, config.maxRequests - (results?.[2] as number || 0)),
      reset: now + config.windowMs,
    };
  }

  /**
   * Rate limiting por organização (multi-tenant)
   */
  async checkOrgRateLimit(
    orgId: string,
    endpoint: string,
    config?: Partial<RateLimitConfig>
  ): Promise<RateLimitResult> {
    const orgConfig = {
      windowMs: 60 * 1000, // 1 minuto por padrão para organizações
      maxRequests: 100,    // 100 requisições por minuto por organização
      ...config,
    };

    return this.checkRateLimit(`org:${orgId}`, orgConfig, endpoint, orgId);
  }

  /**
   * Rate limiting por usuário
   */
  async checkUserRateLimit(
    userId: string,
    endpoint: string,
    config?: Partial<RateLimitConfig>
  ): Promise<RateLimitResult> {
    const userConfig = {
      windowMs: 60 * 1000, // 1 minuto
      maxRequests: 30,     // 30 requisições por minuto por usuário
      ...config,
    };

    return this.checkRateLimit(`user:${userId}`, userConfig, endpoint);
  }

  /**
   * Rate limiting por IP (para endpoints públicos)
   */
  async checkIPRateLimit(
    ip: string,
    endpoint: string,
    config?: Partial<RateLimitConfig>
  ): Promise<RateLimitResult> {
    const ipConfig = {
      windowMs: 60 * 1000, // 1 minuto
      maxRequests: 10,     // 10 requisições por minuto por IP
      ...config,
    };

    return this.checkRateLimit(`ip:${ip}`, ipConfig, endpoint);
  }

  /**
   * Limpa rate limiting para uma chave específica
   */
  async resetRateLimit(identifier: string, endpoint?: string, orgId?: string): Promise<void> {
    const key = this.generateKey(identifier, endpoint, orgId);
    await this.redis.del(key);
    await this.redis.del(`${key}:requests`);
    await this.redis.del(`${key}:counter`);
  }

  /**
   * Obtém estatísticas de rate limiting
   */
  async getRateLimitStats(
    identifier: string,
    endpoint?: string,
    orgId?: string
  ): Promise<{
    totalRequests: number;
    windowStart: number;
    windowEnd: number;
    limit: number;
  }> {
    const key = this.generateKey(identifier, endpoint, orgId);
    const requestsKey = `${key}:requests`;
    const now = Date.now();
    const windowStart = now - this.defaultConfig.windowMs;

    const requestCount = await this.redis.zcount(requestsKey, windowStart, now);

    return {
      totalRequests: requestCount,
      windowStart,
      windowEnd: now,
      limit: this.defaultConfig.maxRequests,
    };
  }
}

/**
 * Factory para criar rate limiter baseado em ambiente
 */
export function createRateLimiter(): RedisRateLimiter | null {
  const redisUrl = Deno.env.get('UPSTASH_REDIS_URL');
  const redisToken = Deno.env.get('UPSTASH_REDIS_TOKEN');

  if (!redisUrl || !redisToken) {
    console.warn('Redis credentials not found. Rate limiting will use in-memory fallback.');
    return null;
  }

  try {
    return new RedisRateLimiter(redisUrl, redisToken, {
      keyPrefix: 'domus:prod:rl',
      windowMs: 60 * 1000,
      maxRequests: 60,
    });
  } catch (error) {
    console.error('Failed to create Redis rate limiter:', error);
    return null;
  }
}

/**
 * Rate Limiter em memória (fallback quando Redis não está disponível)
 */
export class MemoryRateLimiter {
  private store = new Map<string, { count: number; resetTime: number }>();
  private cleanupInterval: number | null = null;

  constructor(
    private defaultConfig: RateLimitConfig = {
      windowMs: 60 * 1000,
      maxRequests: 60,
      keyPrefix: 'domus:mem:rl',
      skipFailedRequests: false,
      message: 'Muitas requisições. Tente novamente mais tarde.',
    }
  ) {
    // Limpa entradas antigas a cada 5 minutos
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000) as unknown as number;
  }

  private generateKey(identifier: string, endpoint?: string, orgId?: string): string {
    const parts = [this.defaultConfig.keyPrefix];
    if (orgId) parts.push(`org:${orgId}`);
    parts.push(identifier);
    if (endpoint) parts.push(`endpoint:${endpoint}`);
    return parts.join(':');
  }

  async checkRateLimit(
    identifier: string,
    config?: Partial<RateLimitConfig>,
    endpoint?: string,
    orgId?: string
  ): Promise<RateLimitResult> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const key = this.generateKey(identifier, endpoint, orgId);
    const now = Date.now();

    const entry = this.store.get(key);

    if (!entry) {
      this.store.set(key, { count: 1, resetTime: now + finalConfig.windowMs });
      return {
        success: true,
        limit: finalConfig.maxRequests,
        remaining: finalConfig.maxRequests - 1,
        reset: now + finalConfig.windowMs,
      };
    }

    if (now > entry.resetTime) {
      // Reset window
      this.store.set(key, { count: 1, resetTime: now + finalConfig.windowMs });
      return {
        success: true,
        limit: finalConfig.maxRequests,
        remaining: finalConfig.maxRequests - 1,
        reset: now + finalConfig.windowMs,
      };
    }

    if (entry.count >= finalConfig.maxRequests) {
      return {
        success: false,
        limit: finalConfig.maxRequests,
        remaining: 0,
        reset: entry.resetTime,
        retryAfter: Math.ceil((entry.resetTime - now) / 1000),
        message: finalConfig.message,
      };
    }

    // Increment count
    this.store.set(key, { count: entry.count + 1, resetTime: entry.resetTime });

    return {
      success: true,
      limit: finalConfig.maxRequests,
      remaining: finalConfig.maxRequests - entry.count - 1,
      reset: entry.resetTime,
    };
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime + 300000) { // 5 minutos após expiração
        this.store.delete(key);
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }
}

/**
 * Wrapper unificado que usa Redis se disponível, caso contrário memory
 */
export class HybridRateLimiter {
  private redisLimiter: RedisRateLimiter | null;
  private memoryLimiter: MemoryRateLimiter;

  constructor() {
    this.redisLimiter = createRateLimiter();
    this.memoryLimiter = new MemoryRateLimiter();
  }

  async checkRateLimit(
    identifier: string,
    config?: Partial<RateLimitConfig>,
    endpoint?: string,
    orgId?: string
  ): Promise<RateLimitResult> {
    if (this.redisLimiter) {
      try {
        return await this.redisLimiter.checkRateLimit(identifier, config, endpoint, orgId);
      } catch (error) {
        console.warn('Redis rate limiting failed, falling back to memory:', error);
      }
    }

    return this.memoryLimiter.checkRateLimit(identifier, config, endpoint, orgId);
  }

  async checkOrgRateLimit(
    orgId: string,
    endpoint: string,
    config?: Partial<RateLimitConfig>
  ): Promise<RateLimitResult> {
    if (this.redisLimiter) {
      try {
        return await this.redisLimiter.checkOrgRateLimit(orgId, endpoint, config);
      } catch (error) {
        console.warn('Redis org rate limiting failed:', error);
      }
    }

    return this.memoryLimiter.checkRateLimit(`org:${orgId}`, config, endpoint, orgId);
  }

  destroy(): void {
    this.memoryLimiter.destroy();
  }
}

// Exporta instância singleton para uso em edge functions
let globalRateLimiter: HybridRateLimiter | null = null;

export function getRateLimiter(): HybridRateLimiter {
  if (!globalRateLimiter) {
    globalRateLimiter = new HybridRateLimiter();
  }
  return globalRateLimiter;
}