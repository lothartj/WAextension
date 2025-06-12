/**
 * WhatsApp Contact Exporter - Content Script
 * Developed by Lothar Tjipueja (https://github.com/lothartj)
 */

// Global variables
let isExtracting = false;
let contacts = [];

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'ping') {
    // Just respond to let the popup know we're here
    sendResponse({ success: true });
    return true;
  }
  
  if (request.action === 'manualHelp') {
    // Manually open the new chat button to help user
    try {
      // Try multiple selectors for the "New chat" button
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
    return true; // Required for async sendResponse
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
    
    // Check if contacts panel is already open
    const isContactsPanelOpen = checkIfContactsPanelIsOpen();
    
    // If not open, try to open it
    if (!isContactsPanelOpen) {
      console.log('Contacts panel not open, attempting to open it');
      await openContactsPanel();
    } else {
      console.log('Contacts panel already open');
    }
    
    // Wait for contacts to load
    await waitForContactsToLoad();
    
    // Extract contacts
    contacts = await scrapeContacts();
    
    // If we opened the contacts panel, close it to be polite
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
  // Check multiple conditions to detect WhatsApp Web
  const isCorrectDomain = window.location.hostname === 'web.whatsapp.com';
  
  // Check for common WhatsApp Web elements
  const hasChatList = document.querySelector('[data-testid="chat-list"]') !== null;
  const hasAppWrapper = document.querySelector('#app') !== null;
  const hasMainPanel = document.querySelector('#main') !== null || document.querySelector('.app') !== null;
  
  // Check if QR code is present (means not logged in yet)
  const hasQrCode = document.querySelector('[data-testid="qrcode"]') !== null || 
                   document.querySelector('.landing-wrapper') !== null;
  
  // If we're on the correct domain but seeing a QR code, user needs to log in
  if (isCorrectDomain && hasQrCode) {
    throw new Error('Please scan the QR code to log into WhatsApp Web first');
  }
  
  // Consider WhatsApp Web open if we're on the correct domain and ANY of the app elements are present
  return isCorrectDomain && (hasChatList || hasAppWrapper || hasMainPanel);
}

/**
 * Check if contacts panel is already open
 * @returns {boolean}
 */
function checkIfContactsPanelIsOpen() {
  // Try multiple selectors that might indicate an open contacts panel
  const contactsPanel = document.querySelector('[data-testid="contact-list-wrapper"]') || 
                        document.querySelector('div[data-animate-modal-body="true"]') ||
                        document.querySelector('div[data-animate-modal-popup="true"]') ||
                        document.querySelector('span[data-icon="x"]') || // X close button in panels
                        document.querySelector('span[data-icon="back"]'); // Back button in panels
  
  return contactsPanel !== null;
}

/**
 * Close the contacts panel if it's open
 */
function closeContactsPanel() {
  try {
    // Try to find the close or back button
    const closeButton = document.querySelector('span[data-icon="x"]') || 
                        document.querySelector('span[data-icon="back"]');
    
    if (closeButton) {
      closeButton.click();
    }
  } catch (error) {
    console.error('Error closing contacts panel:', error);
    // Not critical if this fails, so we just log the error
  }
}

/**
 * Open the contacts panel
 * @returns {Promise<void>}
 */
async function openContactsPanel() {
  // Try multiple selectors for the "New chat" button
  const newChatButton = document.querySelector('[data-testid="chat-icon"], [data-icon="chat"], [title="New chat"]') ||
                        document.querySelector('span[data-icon="chat"]') ||
                        document.querySelector('button[title="New chat"]') ||
                        document.querySelector('[aria-label="New chat"]');
  
  if (!newChatButton) {
    throw new Error('Could not find the "New chat" button. Make sure you are logged into WhatsApp Web.');
  }
  
  // Click the button
  newChatButton.click();
  console.log('Clicked new chat button');
  
  // Wait for the contacts panel to open
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const maxAttempts = 10; // Try for 5 seconds (10 * 500ms)
    
    const checkInterval = setInterval(() => {
      attempts++;
      
      // Try multiple selectors for the contacts panel
      const contactsPanel = document.querySelector('[data-testid="contact-list-wrapper"]') || 
                            document.querySelector('div[data-animate-modal-body="true"]') ||
                            document.querySelector('div[data-animate-modal-popup="true"]') ||
                            document.querySelector('[aria-label="Search contacts text field"]'); // Search field in contacts panel
      
      if (contactsPanel) {
        console.log('Contacts panel found');
        clearInterval(checkInterval);
        resolve();
        return;
      }
      
      // Check if we can see any contacts already - maybe the panel opened but with a different structure
      const contactItems = document.querySelectorAll('[data-testid="contact-list-item"], [data-testid="cell-frame-container"]');
      if (contactItems && contactItems.length > 0) {
        console.log('Contact items found directly');
        clearInterval(checkInterval);
        resolve();
        return;
      }
      
      // If we've tried too many times, try a different approach or give up
      if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        
        // As a last resort, look for ANY elements that might be contacts
        const possibleContacts = document.querySelectorAll('div[role="row"], div[role="listitem"]');
        if (possibleContacts && possibleContacts.length > 0) {
          console.log('Found possible contacts using fallback selectors');
          resolve();
          return;
        }
        
        // Look for search bar - if it exists, we might be in the contacts view
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
    const maxAttempts = 20; // Try for 10 seconds (20 * 500ms)
    
    const checkInterval = setInterval(() => {
      attempts++;
      
      // Try multiple selectors for contact items
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
      
      // If we've tried too many times, try a different approach before giving up
      if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        
        // As a last resort, try to find ANY clickable elements that might be contacts
        const listItems = document.querySelectorAll('div[role="listitem"], div[tabindex="0"]');
        if (listItems && listItems.length > 0) {
          console.log(`Found ${listItems.length} potential list items as fallback`);
          resolve();
          return;
        }
        
        // Check if there's a "No contacts found" message, which is a valid state
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
  // Look for group indicators in the item
  const groupIndicators = [
    // Look for group icon
    item.querySelector('[data-icon="group"], [data-testid="group"], [title*="Group"]'),
    // Look for multiple participant indicators
    item.querySelector('[data-testid="group-participants"], [title*="participants"]'),
    // Look for text containing participants
    item.textContent.includes('participants') || item.textContent.includes(' group'),
    // Check for group chat pattern in data attributes
    item.dataset && item.dataset.id && item.dataset.id.includes('-'),
    // Check for community indicators
    item.querySelector('[data-icon="community"]')
  ];
  
  // If any indicator is true/exists, it's likely a group
  return groupIndicators.some(indicator => indicator);
}

/**
 * Extract phone number using more advanced methods
 * @param {Element} item - The contact DOM element
 * @param {string} name - The contact name
 * @param {string} status - The contact status
 * @returns {string} - The extracted phone number or empty string if not found
 */
function extractPhoneNumber(item, name, status) {
  let phoneNumber = '';
  
  // Method 1: Try to extract from status if it contains numbers
  if (status && /[\d+\s()-]/.test(status)) {
    // Try to extract a phone number-like pattern from the status
    const matches = status.match(/(?:\+\d{1,3})?[\s.-]?\(?\d{1,4}\)?[\s.-]?\d{1,4}[\s.-]?\d{1,9}/);
    if (matches) {
      phoneNumber = matches[0];
    }
  }
  
  // Method 2: Try to get from the chat ID
  if (!phoneNumber && item.dataset && item.dataset.id) {
    const idParts = item.dataset.id.split('@');
    if (idParts.length > 0 && /^\d+$/.test(idParts[0])) {
      phoneNumber = idParts[0];
    }
  }
  
  // Method 3: Try to get it from the jid attribute
  if (!phoneNumber) {
    const jidElement = item.querySelector('[data-jid]');
    if (jidElement && jidElement.dataset.jid) {
      const jidParts = jidElement.dataset.jid.split('@');
      if (jidParts.length > 0 && /^\d+$/.test(jidParts[0])) {
        phoneNumber = jidParts[0];
      }
    }
  }
  
  // Method 4: Search in all attributes for phone number patterns
  if (!phoneNumber) {
    const allElements = [item, ...Array.from(item.querySelectorAll('*'))];
    
    for (const element of allElements) {
      // Check all attributes
      for (const attr of element.attributes) {
        const attrValue = attr.value;
        if (/^\d{10,15}(@|$)/.test(attrValue)) {
          phoneNumber = attrValue.split('@')[0];
          break;
        }
      }
      if (phoneNumber) break;
      
      // Check element ID and class for potential phone numbers
      if (element.id && /^\d{10,15}/.test(element.id)) {
        phoneNumber = element.id.match(/\d{10,15}/)[0];
        break;
      }
      
      // Check href attributes for tel: links
      if (element.tagName === 'A' && element.href && element.href.startsWith('tel:')) {
        phoneNumber = element.href.substring(4);
        break;
      }
    }
  }
  
  // Method 5: Try to extract from title attributes
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
  
  // Method 6: Check if the name itself contains a phone number
  if (!phoneNumber && /\+?\d{10,15}/.test(name)) {
    const match = name.match(/\+?\d{10,15}/);
    if (match) {
      phoneNumber = match[0];
    }
  }
  
  // Format the phone number if found
  if (phoneNumber) {
    // Remove any non-digit characters except leading +
    phoneNumber = phoneNumber.replace(/^(\+?)/, '$1').replace(/[^\d+]/g, '');
    
    // Ensure we don't have extra long numbers (data IDs, etc.)
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
  
  // Try multiple selectors for contact items with broader coverage
  const contactItems = document.querySelectorAll(
    '[data-testid="contact-list-item"], ' +
    '[data-testid="cell-frame-container"], ' +
    'div[role="row"], ' +
    'div[role="listitem"], ' +
    '.ggj6brxn, ' + 
    '.infinite-list-item'
  );
  
  console.log(`Attempting to scrape ${contactItems.length} contact items`);
  
  // If we couldn't find any contacts, try a fallback approach
  if (!contactItems || contactItems.length === 0) {
    // Try to find any elements that might be clickable and contain contact info
    const fallbackItems = document.querySelectorAll('div[tabindex="0"], div[role="button"]');
    console.log(`Using fallback: found ${fallbackItems.length} potential clickable items`);
    
    if (fallbackItems.length === 0) {
      throw new Error('No contacts found. Make sure you have contacts in WhatsApp and are logged in.');
    }
  }
  
  for (const item of contactItems) {
    try {
      // Skip groups - check for group indicators
      if (isGroupItem(item)) {
        console.log('Skipping group item');
        continue;
      }
      
      // Get contact name - try multiple selectors with broader coverage
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
      
      // Get contact number/status (may not be available for all contacts)
      const statusElement = item.querySelector(
        '[data-testid="contact-list-item-status"], ' +
        '[data-testid="cell-frame-secondary"], ' +
        '.ggj6brxn ~ div, ' +
        '.infinite-list-item div:not(:first-child), ' +
        'span[dir="auto"]:not(:first-child), ' +
        'div[role="gridcell"]:not(:first-child)'
      );
      const status = statusElement ? statusElement.textContent.trim() : '';
      
      // Extract phone number using the dedicated function
      const phoneNumber = extractPhoneNumber(item, name, status);
      
      // If we have a name and it's not a group, add the contact
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