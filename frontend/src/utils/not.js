export default function not(a, b) {
  return a.filter((value) => b.indexOf(value) === -1);
}
