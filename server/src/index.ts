import { createServer } from 'http';
import { createApp } from './app.js';
import { setupSocketServer } from './socket/index.js';
import { logger } from './utils/logger.js';

const PORT = parseInt(process.env.PORT || '3001', 10);

const app = createApp();
const httpServer = createServer(app);

setupSocketServer(httpServer);

httpServer.listen(PORT, () => {
  logger.info(`Server listening on port ${PORT}`);
});
