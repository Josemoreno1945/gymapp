// ============================================================
// SmartParser — NeonBench
// Parses workout strings like: "3x12@80kg", "4 X 10 100LB", "2x15 60"
// Returns: { sets, reps, weight, unit, volume, error }
// ============================================================

const LIMITS = {
  sets:   { min: 1, max: 100 },
  reps:   { min: 1, max: 500 },
  weight: { min: 0, max: 2000 }, // kg or lbs
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Parse a raw workout input string into structured data.
 * @param {string} raw - User input
 * @param {'kg'|'lbs'} unit - Active unit
 * @returns {{ sets:number, reps:number, weight:number, unit:string, volume:number, raw:string, error:string|null }}
 */
export function parseWorkout(raw, unit = 'kg') {
  if (!raw || !raw.trim()) {
    return { sets: null, reps: null, weight: null, unit, volume: null, raw, error: null };
  }

  const input = raw.trim();
  let sets = null, reps = null, weight = null;
  const errors = [];

  // ─── Pattern A: "3x12@80kg" or "3X12@80lb" or "3x12@80lbs" ────────────────
  const patternA = /^(\d+(?:\.\d+)?)\s*[xX×]\s*(\d+(?:\.\d+)?)\s*[@#]?\s*(\d+(?:\.\d+)?)\s*(kg|lb|lbs|KG|LB|LBS)?$/i;

  // ─── Pattern B: "3x12 80" or "3 x 12 80" (weight last, no @ symbol) ────────
  const patternB = /^(\d+(?:\.\d+)?)\s*[xX×]\s*(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s*(kg|lb|lbs|KG|LB|LBS)?$/i;

  // ─── Pattern C: "3x12" — no weight ─────────────────────────────────────────
  const patternC = /^(\d+(?:\.\d+)?)\s*[xX×]\s*(\d+(?:\.\d+)?)$/i;

  // ─── Pattern D: "80kg 3x12" — weight first ──────────────────────────────────
  const patternD = /^(\d+(?:\.\d+)?)\s*(kg|lb|lbs)?\s+(\d+(?:\.\d+)?)\s*[xX×]\s*(\d+(?:\.\d+)?)$/i;

  let match;

  if ((match = patternA.exec(input))) {
    sets   = parseFloat(match[1]);
    reps   = parseFloat(match[2]);
    weight = parseFloat(match[3]);
    if (match[4]) unit = /lb/i.test(match[4]) ? 'lbs' : 'kg';
  } else if ((match = patternB.exec(input))) {
    sets   = parseFloat(match[1]);
    reps   = parseFloat(match[2]);
    weight = parseFloat(match[3]);
    if (match[4]) unit = /lb/i.test(match[4]) ? 'lbs' : 'kg';
  } else if ((match = patternC.exec(input))) {
    sets   = parseFloat(match[1]);
    reps   = parseFloat(match[2]);
    weight = 0;
  } else if ((match = patternD.exec(input))) {
    weight = parseFloat(match[1]);
    if (match[2]) unit = /lb/i.test(match[2]) ? 'lbs' : 'kg';
    sets   = parseFloat(match[3]);
    reps   = parseFloat(match[4]);
  } else {
    return {
      sets: null, reps: null, weight: null, unit, volume: null, raw,
      error: 'Formato no reconocido. Prueba: 3x12@80kg',
    };
  }

  // ─── Sanitization & clamping ────────────────────────────────────────────────
  const rawSets   = sets;
  const rawReps   = reps;
  const rawWeight = weight;

  sets   = clamp(Math.round(sets),   LIMITS.sets.min,   LIMITS.sets.max);
  reps   = clamp(Math.round(reps),   LIMITS.reps.min,   LIMITS.reps.max);
  weight = clamp(weight,             LIMITS.weight.min,  LIMITS.weight.max);

  if (rawSets   !== sets)   errors.push(`Series limitadas a ${LIMITS.sets.max}`);
  if (rawReps   !== reps)   errors.push(`Reps limitadas a ${LIMITS.reps.max}`);
  if (rawWeight !== weight) errors.push(`Peso limitado a ${LIMITS.weight.max}${unit}`);

  const volume = parseFloat((sets * reps * weight).toFixed(2));

  return {
    sets, reps, weight, unit, volume, raw,
    error: errors.length ? errors.join(' · ') : null,
  };
}

/**
 * Convert weight between kg and lbs.
 */
export function convertWeight(value, fromUnit, toUnit) {
  if (fromUnit === toUnit) return value;
  if (fromUnit === 'kg' && toUnit === 'lbs') return parseFloat((value * 2.20462).toFixed(2));
  if (fromUnit === 'lbs' && toUnit === 'kg') return parseFloat((value / 2.20462).toFixed(2));
  return value;
}
