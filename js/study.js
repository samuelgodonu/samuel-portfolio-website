import { json } from './data.js';

let cache = null;
export const study = () => (cache ||= json('temperature-study'));

// Straight-line interpolation between the simulated temperatures.
export function at(m, T, t) {
  if (t <= T[0]) return m.values[0];
  if (t >= T[T.length - 1]) return m.values[m.values.length - 1];
  let i = 0; while (t > T[i + 1]) i++;
  const f = (t - T[i]) / (T[i + 1] - T[i]);
  return m.values[i] + f * (m.values[i + 1] - m.values[i]);
}
// Proper minus sign for negative numbers.
export const sgn = (m, v) => (v < 0 ? '−' : '') + Math.abs(v).toFixed(m.decimals);
