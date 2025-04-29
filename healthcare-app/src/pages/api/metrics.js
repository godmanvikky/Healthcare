
import client from 'prom-client';
import { register } from '../../server/metrics';  // ✅ Relative path, clean import

export default async function handler(req, res) {
  res.setHeader('Content-Type', client.register.contentType); // ✅ Set Content-Type
  const metrics = await register.metrics(); // ✅ Expose all registered metrics
  res.end(metrics);
}

