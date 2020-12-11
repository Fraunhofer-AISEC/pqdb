export default function queryAll(db, query, params) {
  const stmt = db.prepare(query, params);
  const result = [];
  while (stmt.step()) {
    result.push(stmt.getAsObject());
  }
  stmt.free();
  return result;
}
