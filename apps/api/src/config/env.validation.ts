import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().default(3000),
  API_PREFIX: Joi.string().default('api/v1'),
  DATABASE_URL: Joi.string().required(),
  REDIS_URL: Joi.string().uri().default('redis://localhost:6379'),
  GITHUB_TOKEN: Joi.string().allow('', null),
  GITHUB_API_BASE_URL: Joi.string().uri().default('https://api.github.com'),
  GITHUB_TIMEOUT_MS: Joi.number().default(8000),
  GITHUB_RETRY_ATTEMPTS: Joi.number().default(3),
  CACHE_TTL_REPOSITORY_SEARCH_SECONDS: Joi.number().default(300),
  CACHE_TTL_REPOSITORY_DETAILS_SECONDS: Joi.number().default(900),
  CACHE_TTL_DEVELOPER_PROFILE_SECONDS: Joi.number().default(900),
  CACHE_TTL_REPOSITORY_ACTIVITY_SECONDS: Joi.number().default(300),
  CORS_ORIGIN: Joi.string().default('*'),
  THROTTLE_TTL_SECONDS: Joi.number().default(60),
  THROTTLE_LIMIT: Joi.number().default(120),
});
