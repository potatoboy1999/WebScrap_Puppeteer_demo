const path = require('path');
const XLSX = require('xlsx');

function readMovieIds(filePath) {
  const absolutePath = path.resolve(__dirname, filePath);
  const workbook = XLSX.readFile(absolutePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);

  // Extract the "movie ids" column (case-insensitive match)
  const columnKey = Object.keys(rows[0] || {}).find(
    key => key.toLowerCase().replace(/\s+/g, '') === 'movieids'
  );

  if (!columnKey) {
    throw new Error(
      `Column "movie ids" not found in ${filePath}. Found columns: ${Object.keys(rows[0] || {}).join(', ')}`
    );
  }

  const ids = rows
    .map(row => String(row[columnKey]).trim())
    .filter(id => id && id !== 'undefined');

  console.log(`Read ${ids.length} movie ID(s) from ${filePath}`);
  return ids;
}

module.exports = { readMovieIds };
