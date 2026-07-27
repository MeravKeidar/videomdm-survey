// Paste this into your Google Apps Script editor.
//
// Replace PASTE_NEW_SHEET_ID_HERE with the ID of a NEW Google Sheet.
// The ID is the long string in the sheet's URL:
//   https://docs.google.com/spreadsheets/d/<THIS_PART>/edit
//
// Do NOT reuse the survey v1 sheet (1oVEKLkUD7q6zdW9oKyrc9mTuddxx4uVdx3Ibrc-S3s8) —
// v2 compares a different set of methods and the columns would be mixed together.

const SPREADSHEET_ID = "1ArAQEkWFaMMz0xWGD4GuVZFJ8P4790GvPsgzj59myB8";

function doPost(e) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
  const data  = JSON.parse(e.postData.contents);

  const row = [new Date().toISOString(), data.completionCode || ""];
  data.answers.forEach(ans => {
    row.push(`methodLeft=${ans.methodLeft}|methodRight=${ans.methodRight}|winner=${ans.winner}|winnerMethod=${ans.winnerMethod}`);
  });

  sheet.appendRow(row);

  return ContentService
    .createTextOutput(JSON.stringify({ status: "ok" }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Run this once manually to add header row
function addHeaders() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
  const headers = ["Timestamp", "Completion Code"];
  for (let i = 0; i < 20; i++) headers.push(`Prompt ${String(i).padStart(2, "0")}`);
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
}
