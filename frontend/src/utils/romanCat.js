export default function romanCat(nistCat) {
  const romans = ['ø', 'I', 'II', 'III', 'IV', 'V'];
  if (Number.isInteger(nistCat) && romans[nistCat] !== undefined) return romans[nistCat];
  return nistCat;
}
