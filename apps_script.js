// Paste this entire file into your Google Apps Script editor.
// See DEPLOY.md for step-by-step instructions.

function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data  = JSON.parse(e.postData.contents);

  // Build a row: timestamp + one cell per prompt answer
  const row = [new Date().toISOString()];
  data.answers.forEach(ans => {
    row.push(`methodLeft=${ans.methodLeft}|methodRight=${ans.methodRight}|winner=${ans.winner}|winnerMethod=${ans.winnerMethod}`);
  });

  sheet.appendRow(row);

  return ContentService
    .createTextOutput(JSON.stringify({ status: "ok" }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Optional: call this once manually to add a header row to the sheet
function addHeaders() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const headers = ["Timestamp"];
  for (let i = 0; i < 20; i++) {
    headers.push(`Prompt ${String(i).padStart(2, "0")}`);
  }
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
}
