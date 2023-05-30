import fs from 'fs';
import fastify from 'fastify';
import gracefulShutdown from 'fastify-graceful-shutdown';
import { allowedRegistries, blockedTags, disableEmptyTag } from './config.js';
import { applyRules, log } from './operations.js';

const options = {
  ca: fs.readFileSync('certs/ca.crt'),
  cert: fs.readFileSync('certs/server.crt'),
  key: fs.readFileSync('certs/server.key')
};

export const app = fastify({ https: options });
app.register(gracefulShutdown);

app.post('/', async (req, res) => {
  if (req.body.request === undefined || req.body.request.uid === undefined) {
    res.status(400).send();
    return;
  }
  var response = await applyRules(
    allowedRegistries,
    blockedTags,
    disableEmptyTag,
    req.body
  );
  res.send(response);
});

log('ImageGate is ready!');

app.listen('3000', '0.0.0.0', (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
});
