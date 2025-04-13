import dotenv from 'dotenv';
import { cleanEnv, host, num, port, str, testOnly } from 'envalid';

dotenv.config();

const env = cleanEnv(process.env, {
  PORT: port({ default: 3000 }),
  NODE_ENV: str({ choices: ['development', 'production', 'test'], default: 'development' }),
  HOST: host({ devDefault: testOnly("localhost") }),
  CORS_ORIGIN: str({ devDefault: testOnly("http://localhost:3000") }),
  COMMON_RATE_LIMIT_MAX_REQUESTS: num({ devDefault: testOnly(1000) }),
	COMMON_RATE_LIMIT_WINDOW_MS: num({ devDefault: testOnly(1000) }),
  FILE_UPLOADS_DIR: str({ default: 'uploads/' }),
  MAX_FILE_SIZE: num({ default: 10 * 1024 * 1024 }), // Default 10 MB
  ALLOWED_FILE_EXTENSIONS: str({ default: '.zip,.tar,.gz,.tgz,.rar' }),  // Allowed file extensions
});

export default env;
