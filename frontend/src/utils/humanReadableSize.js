export default function humanReadableSize(size, baseUnit) {
  if (!Number.isFinite(size)) return '';
  const i = (size === 0) ? 0 : Math.floor(Math.log(size) / Math.log(1000));
  return `${(size / 1000 ** i).toFixed(2) * 1} ${['', 'k', 'M', 'G', 'T'][i]}${baseUnit}`;
}
