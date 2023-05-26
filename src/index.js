import fastify from 'fastify';
import gracefulShutdown from 'fastify-graceful-shutdown';

export const app = fastify({ logger: true });
app.register(gracefulShutdown);

app.get('/', async (req, res) => {
  res.send('Hello!');
});
app.get('/healthz', async (req, res) => {
  res.send('OK');
});

app.listen('3000', '0.0.0.0', (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
});
