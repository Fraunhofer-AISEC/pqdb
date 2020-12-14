import not from './not';

export default function union(a, b) {
  return [...a, ...not(b, a)];
}
