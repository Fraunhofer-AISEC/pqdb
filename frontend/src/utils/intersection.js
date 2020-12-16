export default function intersection(a, b) {
  return a.filter((value) => b.indexOf(value) !== -1);
}
