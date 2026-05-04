/**
 * iztro-service — HTTP wrapper around the iztro library.
 *
 * POST /chart/solar
 *   Body: { date: "YYYY-M-D", timeIndex: 0-11, gender: "male"|"female" }
 *   Returns: full iztro astrolabe JSON
 *
 * GET /health
 *   Returns: { ok: true }
 */

const express = require('express');
const { astro } = require('iztro');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3001;

app.post('/chart/solar', (req, res) => {
  const { date, timeIndex, gender } = req.body;

  if (!date || timeIndex == null || !gender) {
    return res.status(400).json({ error: 'date, timeIndex, and gender are required' });
  }
  if (!['male', 'female'].includes(gender)) {
    return res.status(400).json({ error: "gender must be 'male' or 'female'" });
  }
  if (typeof timeIndex !== 'number' || timeIndex < 0 || timeIndex > 11) {
    return res.status(400).json({ error: 'timeIndex must be an integer 0–11' });
  }

  try {
    const astrolabe = astro.astrolabeBySolarDate(
      date,
      timeIndex,
      gender,
      true,     // fixLeap
      'zh-CN',  // locale — Vietnamese not supported by iztro; zh-CN used for star names
    );
    res.json(astrolabe);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get('/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`iztro-service listening on :${PORT}`);
});
