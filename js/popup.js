/**
 * WhatsApp Contact Exporter - Popup Script
 * Developed by Lothar Tjipueja (https://github.com/lothartj)
 */
const extractButton = document.getElementById('extract');
const exportCSVButton = document.getElementById('exportCSV');
const exportVCardButton = document.getElementById('exportVCard');
const exportExcelButton = document.getElementById('exportExcel');
const statusElement = document.getElementById('status');
const countElement = document.getElementById('count');
const contactsListElement = document.getElementById('contacts-list')
let contacts = [];
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(['contacts'], result => {
    if (result.contacts && result.contacts.length > 0) {
      contacts = result.contacts;
      updateUI();
    }
  });
  extractButton.addEventListener('click', extractContacts);
  exportCSVButton.addEventListener('click', exportToCSV);
  exportVCardButton.addEventListener('click', exportToVCard);
  exportExcelButton.addEventListener('click', exportToExcel);
  // Check if we're on WhatsApp Web
  checkWhatsAppWebStatus();
});
/**
 * Check if the current tab is WhatsApp Web
 */
function checkWhatsAppWebStatus() {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const tab = tabs[0];
    if (!tab.url.includes('web.whatsapp.com')) {
      statusElement.textContent = 'Please open WhatsApp Web first!';
      statusElement.className = 'status error';
      const openWhatsAppButton = document.createElement('button');
      openWhatsAppButton.textContent = 'Open WhatsApp Web';
      openWhatsAppButton.className = 'btn primary';
      openWhatsAppButton.style.marginTop = '10px';
      openWhatsAppButton.addEventListener('click', () => {
        chrome.tabs.create({ url: 'https://web.whatsapp.com/' });
        window.close();
      });
      statusElement.appendChild(document.createElement('br'));
      statusElement.appendChild(openWhatsAppButton);
    }
  });
}
/**
 * Extract contacts from WhatsApp Web
 */
function extractContacts() {
  statusElement.textContent = 'Extracting contacts...';
  statusElement.className = 'status';
  extractButton.disabled = true;
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const tab = tabs[0];
    if (!tab.url.includes('web.whatsapp.com')) {
      statusElement.innerHTML = 'Please open WhatsApp Web first!<br><br>';
      statusElement.className = 'status error';
      extractButton.disabled = false;
      const openWhatsAppButton = document.createElement('button');
      openWhatsAppButton.textContent = 'Open WhatsApp Web';
      openWhatsAppButton.className = 'btn primary';
      openWhatsAppButton.addEventListener('click', () => {
        chrome.tabs.create({ url: 'https://web.whatsapp.com/' });
        window.close();
      });
      statusElement.appendChild(openWhatsAppButton);
      return;
    }
    chrome.tabs.sendMessage(tab.id, { action: 'ping' }, response => {
      if (chrome.runtime.lastError) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['js/content.js']
        }, () => {
          // Wait a moment for the content script to initialize
          setTimeout(() => {
            sendExtractMessage(tab.id);
          }, 500);
        });
      } else {
        // Content script is already loaded
        sendExtractMessage(tab.id);
      }
    });
  });
}
/**
 * Format a phone number for display
 * @param {string} phoneNumber - The raw phone number
 * @returns {string} - The formatted phone number or a message if not available
 */
function formatPhoneNumberForDisplay(phoneNumber) {
  if (!phoneNumber) return 'No phone number available';
  if (phoneNumber.startsWith('+')) return phoneNumber;
  if (phoneNumber.length === 10) {
    return `(${phoneNumber.substring(0, 3)}) ${phoneNumber.substring(3, 6)}-${phoneNumber.substring(6)}`;
  } else if (phoneNumber.length === 11 && phoneNumber.startsWith('1')) {
    return `+1 (${phoneNumber.substring(1, 4)}) ${phoneNumber.substring(4, 7)}-${phoneNumber.substring(7)}`;
  } else if (phoneNumber.length >= 8 && phoneNumber.length <= 15) {
    return `+${phoneNumber}`;
  }
  return phoneNumber;
/**
 * Send the extract message to the content script
 * @param {number} tabId - The ID of the tab
 */
function sendExtractMessage(tabId) {
  chrome.tabs.sendMessage(tabId, { action: 'extractContacts' }, response => {
    extractButton.disabled = false;
    if (chrome.runtime.lastError) {
      statusElement.textContent = 'Error: Content script not loaded. Please refresh WhatsApp Web.';
      statusElement.className = 'status error';
      const refreshButton = document.createElement('button');
      refreshButton.textContent = 'Refresh WhatsApp Web';
      refreshButton.className = 'btn primary';
      refreshButton.style.marginTop = '10px';
      refreshButton.addEventListener('click', () => {
        chrome.tabs.reload(tabId);
        window.close();
      });
      statusElement.appendChild(document.createElement('br'));
      statusElement.appendChild(refreshButton);
      return;
    }
    if (!response || !response.success) {
      let errorMessage = response?.error || 'Unknown error';
      statusElement.textContent = `Error: ${errorMessage}`;
      statusElement.className = 'status error';
      if (errorMessage.includes('Timeout waiting for contacts panel to open')) {
        const helpText = document.createElement('div');
        helpText.style.marginTop = '10px';
        helpText.style.fontSize = '0.9em';
        helpText.innerHTML = 'Try the following:<br>' +
                            '1. Open WhatsApp Web in another tab<br>' +
                            '2. Click the "New Chat" button manually<br>' +
                            '3. Come back and try again<br>' +
                            '4. Or try refreshing the page';
        statusElement.appendChild(helpText);
        const manualButton = document.createElement('button');
        manualButton.textContent = 'Open New Chat Manually';
        manualButton.className = 'btn primary';
        manualButton.style.marginTop = '10px';
        manualButton.style.marginRight = '5px';
        manualButton.addEventListener('click', () => {
          chrome.tabs.sendMessage(tabId, { action: 'manualHelp' });
          window.close();
        });
        const refreshButton = document.createElement('button');
        refreshButton.textContent = 'Refresh WhatsApp Web';
        refreshButton.className = 'btn primary';
        refreshButton.style.marginTop = '10px';
        refreshButton.addEventListener('click', () => {
          chrome.tabs.reload(tabId);
          window.close();
        });
        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.justifyContent = 'space-between';
        buttonContainer.appendChild(manualButton);
        buttonContainer.appendChild(refreshButton);
        statusElement.appendChild(buttonContainer);
      }
      else if (errorMessage.includes('QR code') || errorMessage.includes('log in')) {
        const refreshButton = document.createElement('button');
        refreshButton.textContent = 'Refresh WhatsApp Web';
        refreshButton.className = 'btn primary';
        refreshButton.style.marginTop = '10px';
        refreshButton.addEventListener('click', () => {
          chrome.tabs.reload(tabId);
          window.close();
        });
        statusElement.appendChild(document.createElement('br'));
        statusElement.appendChild(refreshButton);
      }
      else {
        const refreshButton = document.createElement('button');
        refreshButton.textContent = 'Refresh & Try Again';
        refreshButton.className = 'btn primary';
        refreshButton.style.marginTop = '10px';
        refreshButton.addEventListener('click', () => {
          chrome.tabs.reload(tabId);
          window.close();
        });
        statusElement.appendChild(document.createElement('br'));
        statusElement.appendChild(refreshButton);
      }
      return;
    }
    contacts = response.contacts;
    if (contacts.length === 0) {
      statusElement.textContent = 'No contacts found. Make sure you have contacts in WhatsApp.';
      statusElement.className = 'status error';
      const refreshButton = document.createElement('button');
      refreshButton.textContent = 'Try Again';
      refreshButton.className = 'btn primary';
      refreshButton.style.marginTop = '10px';
      refreshButton.addEventListener('click', () => {
        extractContacts();
      });
      statusElement.appendChild(document.createElement('br'));
      statusElement.appendChild(refreshButton);
      return;
    }
    chrome.storage.local.set({ contacts });
    updateUI();
    statusElement.textContent = `${contacts.length} contacts extracted successfully! (Groups excluded)`;
    statusElement.className = 'status success';
    const phoneNote = document.createElement('div');
    phoneNote.style.fontSize = '0.8em';
    phoneNote.style.marginTop = '5px';
    phoneNote.innerHTML = 'Note: WhatsApp Web does not always expose phone numbers. Some contacts may show as "No phone number available".';
    statusElement.appendChild(phoneNote);
  });
}
/**
 * Update the UI with the extracted contacts
 */
function updateUI() {
  countElement.textContent = `${contacts.length} contacts found (Groups excluded)`;
  const hasContacts = contacts.length > 0;
  exportCSVButton.disabled = !hasContacts;
  exportVCardButton.disabled = !hasContacts;
  exportExcelButton.disabled = !hasContacts;
  contactsListElement.innerHTML = '';
  if (!hasContacts) {
    contactsListElement.innerHTML = '<div class="no-contacts">No contacts extracted yet</div>';
    return;
  }
  const previewContacts = contacts.slice(0, 20);
  previewContacts.forEach(contact => {
    const contactItem = document.createElement('div');
    contactItem.className = 'contact-item';
    const avatar = document.createElement('div');
    avatar.className = 'contact-avatar';
    avatar.textContent = contact.name.charAt(0).toUpperCase();
    const details = document.createElement('div');
    details.className = 'contact-details';
    const name = document.createElement('div');
    name.className = 'contact-name';
    name.textContent = contact.name;
    const number = document.createElement('div');
    number.className = 'contact-number';
    number.textContent = formatPhoneNumberForDisplay(contact.phoneNumber);
    details.appendChild(name);
    details.appendChild(number);
    contactItem.appendChild(avatar);
    contactItem.appendChild(details);
    contactsListElement.appendChild(contactItem);
  });
  if (contacts.length > 20) {
    const moreItem = document.createElement('div');
    moreItem.className = 'contact-item';
    moreItem.style.justifyContent = 'center';
    moreItem.textContent = `+ ${contacts.length - 20} more contacts`;
    contactsListElement.appendChild(moreItem);
  }
}
/**
 * Export contacts to CSV
 */
function exportToCSV() {
  if (contacts.length === 0) return;
  let csv = 'Name,Phone Number,Status\n';
  contacts.forEach(contact => {
    const name = contact.name.replace(/"/g, '""');
    const phoneNumber = contact.phoneNumber.replace(/"/g, '""');
    const status = contact.status.replace(/"/g, '""');
    csv += `"${name}","${phoneNumber}","${status}"\n`;
  });
  downloadFile(csv, 'whatsapp_contacts.csv', 'text/csv');
  statusElement.textContent = 'Contacts exported to CSV!';
  statusElement.className = 'status success';
}
/**
 * Export contacts to vCard format
 */
function exportToVCard() {
  if (contacts.length === 0) return;
  let vCard = '';
  contacts.forEach(contact => {
    vCard += 'BEGIN:VCARD\n';
    vCard += 'VERSION:3.0\n';
    vCard += `FN:${contact.name}\n`;
    if (contact.phoneNumber) {
      vCard += `TEL;TYPE=CELL:${contact.phoneNumber}\n`;
    }
    if (contact.status) {
      vCard += `NOTE:${contact.status}\n`;
    }
    vCard += 'END:VCARD\n';
  })
  downloadFile(vCard, 'whatsapp_contacts.vcf', 'text/vcard');
  statusElement.textContent = 'Contacts exported to vCard!';
  statusElement.className = 'status success';
}
/**
 * Export contacts to Excel format
 */
function exportToExcel() {
  if (contacts.length === 0 || typeof XLSX === 'undefined') return;
  const data = contacts.map(contact => ({
    Name: contact.name,
    'Phone Number': contact.phoneNumber,
    Status: contact.status
  }));
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'WhatsApp Contacts');
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  downloadFile(
    new Blob([excelBuffer], { type: 'application/octet-stream' }),
    'whatsapp_contacts.xlsx',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  statusElement.textContent = 'Contacts exported to Excel!';
  statusElement.className = 'status success';
}
/**
 * Download a file
 * @param {string|Blob} content - File content
 * @param {string} filename - File name
 * @param {string} contentType - Content type
 */
function downloadFile(content, filename, contentType) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  chrome.downloads.download({
    url: url,
    filename: filename,
    saveAs: true
  });
}