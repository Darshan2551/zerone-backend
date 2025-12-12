const fs = require("fs");
const path = require("path");

function appendRowToCSV(eventKey, headers, payload) {
  const csvDir = path.join(__dirname, "csv");
  if (!fs.existsSync(csvDir)) fs.mkdirSync(csvDir);

  const filePath = path.join(csvDir, `${eventKey}.csv`);

  // Convert payload into a row matching headers
  const row = headers
    .map((h) => `"${(payload[h] || "").toString().replace(/"/g, '""')}"`)
    .join(",");

  // If file doesn’t exist → write header first
  if (!fs.existsSync(filePath)) {
    const headerRow = headers.join(",") + "\n";
    fs.writeFileSync(filePath, headerRow + row + "\n");
  } else {
    fs.appendFileSync(filePath, row + "\n");
  }

  return filePath;
}

module.exports = appendRowToCSV;
