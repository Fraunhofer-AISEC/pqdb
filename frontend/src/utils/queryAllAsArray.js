export default function queryAllAsArray(db, query, params) {
  const stmt = db.prepare(query, params);
  const result = { columns: stmt.getColumnNames(), values: [] };
  while (stmt.step()) {
    result.values.push(stmt.get());
  }
  stmt.free();
  return result;
}
