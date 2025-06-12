/**
 * WhatsApp Contact Exporter - Content Script
 * Developed by Lothar Tjipueja (https://github.com/lothartj)
 */

let isExtracting = false;
let contacts = [];
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'ping') {
    sendResponse({ success: true });
    return true;
  }
  if (request.action === 'manualHelp') {
    try {
      const newChatButton = document.querySelector('[data-testid="chat-icon"], [data-icon="chat"], [title="New chat"]') ||
                            document.querySelector('span[data-icon="chat"]') ||
                            document.querySelector('button[title="New chat"]') ||
                            document.querySelector('[aria-label="New chat"]');
      if (newChatButton) {
        newChatButton.click();
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: "Couldn't find new chat button" });
      }
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
    return true;
  }
  if (request.action === 'extractContacts') {
    extractContacts()
      .then(result => {
        sendResponse({ success: true, contacts: result });
      })
      .catch(error => {
        console.error('Extraction error:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
});

/**
 * Extract contacts from WhatsApp Web
 * @returns {Promise<Array>} - Promise resolving to an array of contact objects
 */
async function extractContacts() {
  if (isExtracting) {
    throw new Error('Extraction already in progress');
  }
  if (!isWhatsAppWebOpen()) {
    throw new Error('Please open WhatsApp Web first');
  }
  isExtracting = true;
  contacts = [];
  try {
    console.log('Starting contact extraction');
    const isContactsPanelOpen = checkIfContactsPanelIsOpen();
    if (!isContactsPanelOpen) {
      console.log('Contacts panel not open, attempting to open it');
      await openContactsPanel();
    } else {
      console.log('Contacts panel already open');
    }
    await waitForContactsToLoad();
    contacts = await scrapeContacts();
    if (!isContactsPanelOpen) {
      closeContactsPanel();
    }
    isExtracting = false;
    return contacts;
  } catch (error) {
    isExtracting = false;
    throw error;
  }
}

/**
 * Check if WhatsApp Web is open
 * @returns {boolean}
 */
function isWhatsAppWebOpen() {
  const isCorrectDomain = window.location.hostname === 'web.whatsapp.com';
  const hasChatList = document.querySelector('[data-testid="chat-list"]') !== null;
  const hasAppWrapper = document.querySelector('#app') !== null;
  const hasMainPanel = document.querySelector('#main') !== null || document.querySelector('.app') !== null;
  const hasQrCode = document.querySelector('[data-testid="qrcode"]') !== null ||
                   document.querySelector('.landing-wrapper') !== null;
  if (isCorrectDomain && hasQrCode) {
    throw new Error('Please scan the QR code to log into WhatsApp Web first');
  }
  return isCorrectDomain && (hasChatList || hasAppWrapper || hasMainPanel);
}

/**
 * Check if contacts panel is already open
 * @returns {boolean}
 */
function checkIfContactsPanelIsOpen() {
  const contactsPanel = document.querySelector('[data-testid="contact-list-wrapper"]') ||
                        document.querySelector('div[data-animate-modal-body="true"]') ||
                        document.querySelector('div[data-animate-modal-popup="true"]') ||
                        document.querySelector('span[data-icon="x"]') ||
                        document.querySelector('span[data-icon="back"]');
  return contactsPanel !== null;
}

/**
 * Close the contacts panel if it's open
 */
function closeContactsPanel() {
  try {
    const closeButton = document.querySelector('span[data-icon="x"]') ||
                        document.querySelector('span[data-icon="back"]');
    if (closeButton) {
      closeButton.click();
    }
  } catch (error) {
    console.error('Error closing contacts panel:', error);
  }
}

/**
 * Open the contacts panel
 * @returns {Promise<void>}
 */
async function openContactsPanel() {
  const newChatButton = document.querySelector('[data-testid="chat-icon"], [data-icon="chat"], [title="New chat"]') ||
                        document.querySelector('span[data-icon="chat"]') ||
                        document.querySelector('button[title="New chat"]') ||
                        document.querySelector('[aria-label="New chat"]');
  if (!newChatButton) {
    throw new Error('Could not find the "New chat" button. Make sure you are logged into WhatsApp Web.');
  }
  newChatButton.click();
  console.log('Clicked new chat button');
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const maxAttempts = 10;
    const checkInterval = setInterval(() => {
      attempts++;
      const contactsPanel = document.querySelector('[data-testid="contact-list-wrapper"]') || 
                            document.querySelector('div[data-animate-modal-body="true"]') ||
                            document.querySelector('div[data-animate-modal-popup="true"]') ||
                            document.querySelector('[aria-label="Search contacts text field"]');
      if (contactsPanel) {
        console.log('Contacts panel found');
        clearInterval(checkInterval);
        resolve();
        return;
      }
      const contactItems = document.querySelectorAll('[data-testid="contact-list-item"], [data-testid="cell-frame-container"]');
      if (contactItems && contactItems.length > 0) {
        console.log('Contact items found directly');
        clearInterval(checkInterval);
        resolve();
        return;
      }
      if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        const possibleContacts = document.querySelectorAll('div[role="row"], div[role="listitem"]');
        if (possibleContacts && possibleContacts.length > 0) {
          console.log('Found possible contacts using fallback selectors');
          resolve();
          return;
        }
        const searchBar = document.querySelector('input[type="search"], [placeholder*="Search"], [data-testid*="search"]');
        if (searchBar) {
          console.log('Found search bar, assuming we are in contacts view');
          resolve();
          return;
        }
        reject(new Error('Timeout waiting for contacts panel to open. Try opening the New Chat panel manually first.'));
      }
    }, 500);
  });
}

/**
 * Wait for contacts to load
 * @returns {Promise<void>}
 */
async function waitForContactsToLoad() {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const maxAttempts = 20;
    const checkInterval = setInterval(() => {
      attempts++;
      const contactItems = document.querySelectorAll(
        '[data-testid="contact-list-item"], ' +
        '[data-testid="cell-frame-container"], ' +
        'div[role="row"], ' +
        'div[role="listitem"], ' +
        '.ggj6brxn, ' +
        '.infinite-list-item'
      );
      if (contactItems && contactItems.length > 0) {
        console.log(`Found ${contactItems.length} contact items`);
        clearInterval(checkInterval);
        resolve();
        return;
      }
      if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        const listItems = document.querySelectorAll('div[role="listitem"], div[tabindex="0"]');
        if (listItems && listItems.length > 0) {
          console.log(`Found ${listItems.length} potential list items as fallback`);
          resolve();
          return;
        }
        const noContactsMessage = document.querySelector('div:contains("No contacts found"), div:contains("No results found")');
        if (noContactsMessage) {
          console.log('No contacts found message detected');
          resolve();
          return;
        }
        reject(new Error('Timeout waiting for contacts to load. WhatsApp Web may have changed its structure.'));
      }
    }, 500);
  });
}

/**
 * Check if an item is a group rather than a contact
 * @param {Element} item - The DOM element to check
 * @returns {boolean} - True if the item is a group
 */
function isGroupItem(item) {
  const groupIndicators = [
    item.querySelector('[data-icon="group"], [data-testid="group"], [title*="Group"]'),
    item.querySelector('[data-testid="group-participants"], [title*="participants"]'),
    item.textContent.includes('participants') || item.textContent.includes(' group'),
    item.dataset && item.dataset.id && item.dataset.id.includes('-'),
    item.querySelector('[data-icon="community"]')
  ];
  return groupIndicators.some(indicator => indicator);
}

/**
 * Extract phone number using more advanced methods
 * @param {Element} i
 * @param {string} name
 * @param {string} status
 * @returns {string}
 */
function extractPhoneNumber(item, name, status) {
  let phoneNumber = ''
  if (status && /[\d+\s()-]/.test(status)) 
    const matches = status.match(/(?:\+\d{1,3})?[\s.-]?\(?\d{1,4}\)?[\s.-]?\d{1,4}[\s.-]?\d{1,9}/);
    if (matches) {
      phoneNumber = matches[0];
    }
  }

  if (!phoneNumber && item.dataset && item.dataset.id) {
    const idParts = item.dataset.id.split('@');
    if (idParts.length > 0 && /^\d+$/.test(idParts[0])) {
      phoneNumber = idParts[0];
    }
  }

  if (!phoneNumber) {
    const jidElement = item.querySelector('[data-jid]');
    if (jidElement && jidElement.dataset.jid) {
      const jidParts = jidElement.dataset.jid.split('@');
      if (jidParts.length > 0 && /^\d+$/.test(jidParts[0])) {
        phoneNumber = jidParts[0];
      }
    }
  }

  if (!phoneNumber) {
    const allElements = [item, ...Array.from(item.querySelectorAll('*'))];

    for (const element of allElements) {

      for (const attr of element.attributes) {
        const attrValue = attr.value;
        if (/^\d{10,15}(@|$)/.test(attrValue)) {
          phoneNumber = attrValue.split('@')[0];
          break;
        }
      }
      if (phoneNumber) break;


      if (element.id && /^\d{10,15}/.test(element.id)) {
        phoneNumber = element.id.match(/\d{10,15}/)[0];
        break;
      }

      if (element.tagName === 'A' && element.href && element.href.startsWith('tel:')) {
        phoneNumber = element.href.substring(4);
        break;
      }
    }
  }

  if (!phoneNumber) {
    const titleElements = item.querySelectorAll('[title]');
    for (const el of titleElements) {
      const title = el.getAttribute('title');
      if (title && /\d{10,15}/.test(title)) {
        const match = title.match(/\d{10,15}/);
        if (match) {
          phoneNumber = match[0];
          break;
        }
      }
    }
  }

  if (!phoneNumber && /\+?\d{10,15}/.test(name)) {
    const match = name.match(/\+?\d{10,15}/);
    if (match) {
      phoneNumber = match[0];
    }
  }

  if (phoneNumber) {

    phoneNumber = phoneNumber.replace(/^(\+?)/, '$1').replace(/[^\d+]/g, '');

    if (phoneNumber.length > 15 && !phoneNumber.startsWith('+')) {
      phoneNumber = phoneNumber.substring(0, 15);
    }
  }

  return phoneNumber;
}

/**
 * Scrape contacts from the contacts panel
 * @returns {Promise<Array>} - Promise resolving to an array of contact objects
 */
async function scrapeContacts() {
  const contactsList = [];

  const contactItems = document.querySelectorAll(
    '[data-testid="contact-list-item"], ' +
    '[data-testid="cell-frame-container"], ' +
    'div[role="row"], ' +
    'div[role="listitem"], ' +
    '.ggj6brxn, ' +
    '.infinite-list-item'
  );

  console.log(`Attempting to scrape ${contactItems.length} contact items`);

  if (!contactItems || contactItems.length === 0) {

    const fallbackItems = document.querySelectorAll('div[tabindex="0"], div[role="button"]');
    console.log(`Using fallback: found ${fallbackItems.length} potential clickable items`);

    if (fallbackItems.length === 0) {
      throw new Error('No contacts found. Make sure you have contacts in WhatsApp and are logged in.');
    }
  }

  for (const item of contactItems) {
    try {

      if (isGroupItem(item)) {
        console.log('Skipping group item');
        continue;
      }

      const nameElement = item.querySelector(
        '[data-testid="contact-list-item-title"], ' +
        '[data-testid="cell-frame-title"], ' +
        '.ggj6brxn, ' +
        '.infinite-list-item span, ' +
        'span[dir="auto"], ' +
        'div[title], ' +
        'div[role="gridcell"]:first-child'
      );

      if (!nameElement) continue;

      const name = nameElement.textContent.trim() || nameElement.title || '';

      const statusElement = item.querySelector(
        '[data-testid="contact-list-item-status"], ' +
        '[data-testid="cell-frame-secondary"], ' +
        '.ggj6brxn ~ div, ' +
        '.infinite-list-item div:not(:first-child), ' +
        'span[dir="auto"]:not(:first-child), ' +
        'div[role="gridcell"]:not(:first-child)'
      );
      const status = statusElement ? statusElement.textContent.trim() : '';

      const phoneNumber = extractPhoneNumber(item, name, status);

      if (name) {
        contactsList.push({
          name,
          phoneNumber,
          status
        });
      }
    } catch (error) {
      console.error('Error processing contact:', error);
    }
  }

  if (contactsList.length === 0) {
    console.warn('No contacts were extracted. WhatsApp Web may have changed its structure.');
  } else {
    console.log(`Successfully extracted ${contactsList.length} contacts`);
  }

  return contactsList;
}

// Let the popup know the content script is ready
chrome.runtime.sendMessage({ action: 'contentScriptReady' });