/**
 * =====================================================
 * SATYAM MALL INVENTORY - GOOGLE APPS SCRIPT
 * =====================================================
 *
 * SETUP INSTRUCTIONS:
 * 1. Create a new Google Sheet
 * 2. Go to Extensions > Apps Script
 * 3. Delete all existing code
 * 4. Copy-paste this entire code
 * 5. Click "Run" > "setupSheets" (first time only)
 * 6. Authorize the script when prompted
 * 7. Deploy > New Deployment > Web App
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 8. Copy the Web App URL and paste in app Settings
 *
 * =====================================================
 */

// ==================== SETUP FUNCTION ====================
// Run this ONCE to create sheets with proper headers

function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // -------- Create/Setup Inventory Sheet --------
  let invSheet = ss.getSheetByName('Inventory');
  if (!invSheet) {
    invSheet = ss.insertSheet('Inventory');
  } else {
    invSheet.clear();
  }

  // Inventory Headers
  const invHeaders = ['ID', 'Name', 'Category', 'Quantity', 'Unit', 'MinLevel'];
  invSheet.getRange(1, 1, 1, invHeaders.length).setValues([invHeaders]);
  invSheet.getRange(1, 1, 1, invHeaders.length).setFontWeight('bold').setBackground('#0ea5e9').setFontColor('white');

  // Format columns
  invSheet.setColumnWidth(1, 50);   // ID
  invSheet.setColumnWidth(2, 200);  // Name
  invSheet.setColumnWidth(3, 120);  // Category
  invSheet.setColumnWidth(4, 80);   // Quantity
  invSheet.setColumnWidth(5, 80);   // Unit
  invSheet.setColumnWidth(6, 80);   // MinLevel

  // -------- Create/Setup Transactions Sheet --------
  let transSheet = ss.getSheetByName('Transactions');
  if (!transSheet) {
    transSheet = ss.insertSheet('Transactions');
  } else {
    transSheet.clear();
  }

  // Transaction Headers
  const transHeaders = ['Date', 'Type', 'ItemName', 'Quantity', 'Unit', 'Location', 'PersonName', 'Notes'];
  transSheet.getRange(1, 1, 1, transHeaders.length).setValues([transHeaders]);
  transSheet.getRange(1, 1, 1, transHeaders.length).setFontWeight('bold').setBackground('#22c55e').setFontColor('white');

  // Format columns
  transSheet.setColumnWidth(1, 150);  // Date
  transSheet.setColumnWidth(2, 80);   // Type
  transSheet.setColumnWidth(3, 200);  // ItemName
  transSheet.setColumnWidth(4, 80);   // Quantity
  transSheet.setColumnWidth(5, 80);   // Unit
  transSheet.setColumnWidth(6, 120);  // Location
  transSheet.setColumnWidth(7, 150);  // PersonName
  transSheet.setColumnWidth(8, 200);  // Notes

  // Format date column
  transSheet.getRange('A:A').setNumberFormat('dd-mmm-yyyy hh:mm');

  // Delete default Sheet1 if exists
  const sheet1 = ss.getSheetByName('Sheet1');
  if (sheet1 && ss.getSheets().length > 1) {
    ss.deleteSheet(sheet1);
  }

  // Show success message
  SpreadsheetApp.getUi().alert(
    'Setup Complete!',
    'Inventory and Transactions sheets have been created.\n\nNext Steps:\n1. Click Deploy > New Deployment\n2. Select Web App\n3. Set "Who has access" to "Anyone"\n4. Copy the URL and paste in your app Settings',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}


// ==================== API FUNCTIONS ====================

// Handle GET requests - Fetch data
function doGet(e) {
  try {
    const sheetName = e.parameter.sheet || 'Inventory';
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      return createJsonResponse({ error: 'Sheet not found: ' + sheetName });
    }

    const data = sheet.getDataRange().getValues();

    if (data.length === 0) {
      return createJsonResponse([]);
    }

    const headers = data[0].map(h => String(h).toLowerCase().replace(/\s+/g, ''));
    const rows = data.slice(1);

    const result = rows.map((row, index) => {
      const obj = {};
      headers.forEach((header, i) => {
        let value = row[i];
        // Convert dates to ISO string
        if (value instanceof Date) {
          value = value.toISOString();
        }
        obj[header] = value;
      });
      // Add row index for reference
      obj._rowIndex = index + 2;
      return obj;
    });

    return createJsonResponse(result);

  } catch (error) {
    return createJsonResponse({ error: error.toString() });
  }
}

// Handle POST requests - Add/Update data
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // -------- Add Transaction --------
    if (body.action === 'addTransaction') {
      const tSheet = ss.getSheetByName('Transactions');
      const iSheet = ss.getSheetByName('Inventory');

      if (!tSheet || !iSheet) {
        return createJsonResponse({ status: 'error', message: 'Sheets not found. Run setupSheets first.' });
      }

      // Add transaction row
      const transactionRow = [
        new Date(),
        body.type || '',
        body.itemName || '',
        Number(body.quantity) || 0,
        body.unit || '',
        body.location || '',
        body.personName || '',
        body.notes || ''
      ];
      tSheet.appendRow(transactionRow);

      // Update inventory quantity
      const invData = iSheet.getDataRange().getValues();
      let itemFound = false;

      for (let i = 1; i < invData.length; i++) {
        const itemName = String(invData[i][1]).trim().toLowerCase();
        const searchName = String(body.itemName).trim().toLowerCase();

        if (itemName === searchName) {
          const currentQty = Number(invData[i][3]) || 0;
          const changeQty = Number(body.quantity) || 0;

          let newQty;
          if (body.type === 'RECEIVE') {
            newQty = currentQty + changeQty;
          } else {
            newQty = currentQty - changeQty;
          }

          // Prevent negative quantity
          if (newQty < 0) newQty = 0;

          iSheet.getRange(i + 1, 4).setValue(newQty);
          itemFound = true;
          break;
        }
      }

      // If receiving new item that doesn't exist, add it
      if (!itemFound && body.type === 'RECEIVE') {
        const newId = invData.length;
        const newRow = [
          newId,
          body.itemName,
          body.category || 'Others',
          Number(body.quantity) || 0,
          body.unit || 'pcs',
          Number(body.minLevel) || 5
        ];
        iSheet.appendRow(newRow);
      }

      return createJsonResponse({ status: 'success', message: 'Transaction recorded' });
    }

    // -------- Update Inventory Quantity --------
    if (body.action === 'updateInventory') {
      const iSheet = ss.getSheetByName('Inventory');

      if (!iSheet) {
        return createJsonResponse({ status: 'error', message: 'Inventory sheet not found' });
      }

      const data = iSheet.getDataRange().getValues();

      for (let i = 1; i < data.length; i++) {
        const itemName = String(data[i][1]).trim().toLowerCase();
        const searchName = String(body.itemName).trim().toLowerCase();

        if (itemName === searchName) {
          iSheet.getRange(i + 1, 4).setValue(Number(body.newQuantity));
          return createJsonResponse({ status: 'success', message: 'Quantity updated' });
        }
      }

      return createJsonResponse({ status: 'error', message: 'Item not found: ' + body.itemName });
    }

    // -------- Add New Inventory Item --------
    if (body.action === 'addInventoryItem') {
      const iSheet = ss.getSheetByName('Inventory');

      if (!iSheet) {
        return createJsonResponse({ status: 'error', message: 'Inventory sheet not found' });
      }

      const data = iSheet.getDataRange().getValues();
      const newId = data.length;

      const newRow = [
        newId,
        body.name || '',
        body.category || 'Others',
        Number(body.quantity) || 0,
        body.unit || 'pcs',
        Number(body.minLevel) || 5
      ];

      iSheet.appendRow(newRow);
      return createJsonResponse({ status: 'success', message: 'Item added', id: newId });
    }

    // -------- Delete Inventory Item --------
    if (body.action === 'deleteInventoryItem') {
      const iSheet = ss.getSheetByName('Inventory');

      if (!iSheet) {
        return createJsonResponse({ status: 'error', message: 'Inventory sheet not found' });
      }

      const data = iSheet.getDataRange().getValues();

      for (let i = 1; i < data.length; i++) {
        const itemName = String(data[i][1]).trim().toLowerCase();
        const searchName = String(body.itemName).trim().toLowerCase();

        if (itemName === searchName) {
          iSheet.deleteRow(i + 1);
          return createJsonResponse({ status: 'success', message: 'Item deleted' });
        }
      }

      return createJsonResponse({ status: 'error', message: 'Item not found' });
    }

    // -------- Upload File to Google Drive --------
    if (body.action === 'uploadFile') {
      try {
        const fileName = body.fileName || 'upload_' + Date.now();
        const mimeType = body.mimeType || 'application/octet-stream';
        const fileData = body.fileData; // Base64 encoded
        const folderId = body.folderId;

        if (!fileData) {
          return createJsonResponse({ status: 'error', message: 'No file data provided' });
        }

        // Decode base64 data
        const decodedData = Utilities.base64Decode(fileData);
        const blob = Utilities.newBlob(decodedData, mimeType, fileName);

        // Get folder or use root
        let folder;
        if (folderId) {
          try {
            folder = DriveApp.getFolderById(folderId);
          } catch (folderError) {
            // If folder not found, use root
            folder = DriveApp.getRootFolder();
          }
        } else {
          folder = DriveApp.getRootFolder();
        }

        // Create file in folder
        const file = folder.createFile(blob);

        // Set file to be viewable by anyone with link
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

        const fileUrl = file.getUrl();
        const fileId = file.getId();

        return createJsonResponse({
          status: 'success',
          message: 'File uploaded successfully',
          fileUrl: fileUrl,
          fileId: fileId,
          fileName: fileName
        });

      } catch (uploadError) {
        return createJsonResponse({ status: 'error', message: 'Upload failed: ' + uploadError.toString() });
      }
    }

    return createJsonResponse({ status: 'error', message: 'Unknown action: ' + body.action });

  } catch (error) {
    return createJsonResponse({ status: 'error', message: error.toString() });
  }
}

// Helper function to create JSON response with CORS headers
function createJsonResponse(data) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}


// ==================== TEST FUNCTION ====================
// Run this to test if everything is working

function testSetup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const invSheet = ss.getSheetByName('Inventory');
  const transSheet = ss.getSheetByName('Transactions');

  let message = 'Test Results:\n\n';

  if (invSheet) {
    const invCount = invSheet.getLastRow() - 1;
    message += 'Inventory Sheet: Found (' + invCount + ' items)\n';
  } else {
    message += 'Inventory Sheet: Not Found\n';
  }

  if (transSheet) {
    const transCount = transSheet.getLastRow() - 1;
    message += 'Transactions Sheet: Found (' + transCount + ' records)\n';
  } else {
    message += 'Transactions Sheet: Not Found\n';
  }

  message += '\nIf any sheet is missing, run setupSheets() first.';

  SpreadsheetApp.getUi().alert('Setup Test', message, SpreadsheetApp.getUi().ButtonSet.OK);
}
