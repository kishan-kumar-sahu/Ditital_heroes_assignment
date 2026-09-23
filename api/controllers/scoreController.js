import { Score, Subscription } from '../models/index.js';

async function active(userId) {
  const sub = await Subscription.findOne({ userId }).lean();
  if (!sub || sub.status !== 'active' || !sub.nextRenewal) return false;

  // Subscription records in this project store the expiry/renewal date
  // in `nextRenewal` (YYYY-MM-DD), not `endDate`.
  // Treat the renewal date as active through the end of that calendar day.
  const renewal = new Date(`${sub.nextRenewal}T23:59:59.999Z`);
  return !Number.isNaN(renewal.getTime()) && renewal >= new Date();
}

export async function list(req, res) {
  if (req.user.role === 'subscriber' && !(await active(req.user.id))) {
    return res.status(403).json({ error: 'Active subscription required' });
  }

  const scores = await Score.find({ userId: req.user.id })
    .sort({ date: -1 })
    .lean();

  res.json({ scores });
}


export async function checkDate(req, res) {
  const date = String(req.query.date || '');

  if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(date)) {
    return res.status(400).json({ error: 'Invalid date', exists: false });
  }

  const existing = await Score.findOne({
    userId: req.user.id,
    date,
  }).select('_id date score').lean();

  return res.json({
    exists: Boolean(existing),
    score: existing || null,
  });
}

export async function create(req, res) {
  if (req.user.role === 'subscriber' && !(await active(req.user.id))) {
    return res.status(403).json({ error: 'Active subscription required' });
  }

  const n = Number(req.body.score);
  const date = req.body.date;

  if (
    !Number.isInteger(n) ||
    n < 1 ||
    n > 45 ||
    !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(date || '')
  ) {
    return res
      .status(400)
      .json({ error: 'Score must be 1–45 and date must be YYYY-MM-DD' });
  }

  const existing = await Score.findOne({ userId: req.user.id, date }).lean();
  if (existing) {
    return res.status(409).json({
      error: 'A score has already been entered for this date. Please choose another date.',
      code: 'DUPLICATE_SCORE_DATE',
    });
  }

  try {
    const s = await Score.create({
      userId: req.user.id,
      score: n,
      date,
    });

    const mine = await Score.find({ userId: req.user.id })
      .sort({ date: -1 })
      .lean();

    for (const old of mine.slice(5)) {
      await Score.findByIdAndDelete(old._id);
    }

    return res.status(201).json({ score: s });
  } catch (error) {
    // Unique index is the final protection against two simultaneous requests.
    if (error?.code === 11000) {
      return res.status(409).json({
        error: 'A score has already been entered for this date. Please choose another date.',
        code: 'DUPLICATE_SCORE_DATE',
      });
    }
    throw error;
  }
}

export async function update(req, res) {
  const s = await Score.findOne({
    _id: req.params.id,
    userId: req.user.id,
  });

  if (!s) {
    return res.status(404).json({ error: 'Score not found' });
  }

  const n = Number(req.body.score);
  const date = req.body.date;

  if (!Number.isInteger(n) || n < 1 || n > 45 || !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(date || '')) {
    return res.status(400).json({ error: 'Invalid score/date' });
  }

  const duplicate = await Score.findOne({
    userId: req.user.id,
    date,
    _id: { $ne: s._id },
  }).lean();

  if (duplicate) {
    return res.status(409).json({
      error: 'Another score already exists for this date. Please choose another date.',
      code: 'DUPLICATE_SCORE_DATE',
    });
  }

  try {
    s.score = n;
    s.date = date;
    await s.save();
    return res.json({ score: s });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        error: 'Another score already exists for this date. Please choose another date.',
        code: 'DUPLICATE_SCORE_DATE',
      });
    }
    throw error;
  }
}

export async function remove(req, res) {
  const s = await Score.findOneAndDelete({
    _id: req.params.id,
    userId: req.user.id,
  });

  res.status(s ? 200 : 404).json(
    s ? { ok: true } : { error: 'Score not found' }
  );
}
