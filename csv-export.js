const fs = require('fs');
const path = require('path');
const { createObjectCsvWriter } = require('csv-writer');

async function exportToCsv(data, outputFile) {
  if (!data.length) {
    console.log('No data to export.');
    return;
  }

  const outputDir = path.join(path.dirname(process.execPath), 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  const filePath = path.join(outputDir, outputFile);

  // Auto-detect columns from object keys
  const headers = Object.keys(data[0]).map(key => ({ id: key, title: key }));

  const csvWriter = createObjectCsvWriter({
    path: filePath,
    header: headers,
  });

  await csvWriter.writeRecords(data);
  console.log(`CSV exported: ${filePath} (${data.length} rows)`);
}

module.exports = { exportToCsv };
