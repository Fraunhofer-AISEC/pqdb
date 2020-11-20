export default function detailLink(scheme, flavor) {
  let url = '/detail';
  url += `/${scheme}`;
  if (flavor !== undefined) { url += `/${flavor}`; }

  return url;
}
