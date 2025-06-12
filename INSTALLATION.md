# WhatsApp Contact Exporter - Installation Guide

This guide will help you install the WhatsApp Contact Exporter Chrome extension developed by [Lothar Tjipueja](https://github.com/lothartj).

## Installation Steps

### Method 1: Using the packaged ZIP file

1. Unzip the `whatsapp_contact_exporter_v1.0.zip` file to a folder on your computer.
2. Open Google Chrome browser.
3. Type `chrome://extensions/` in the address bar and press Enter.
4. Enable "Developer mode" by toggling the switch in the top-right corner.
5. Click the "Load unpacked" button.
6. Navigate to the folder where you unzipped the extension files and click "Select Folder".
7. The extension should now be installed and visible in your browser toolbar.

### Method 2: Loading the extension directory directly

1. Open Google Chrome browser.
2. Type `chrome://extensions/` in the address bar and press Enter.
3. Enable "Developer mode" by toggling the switch in the top-right corner.
4. Click the "Load unpacked" button.
5. Navigate to the `WAextension` folder and click "Select Folder".
6. The extension should now be installed and visible in your browser toolbar.

## Troubleshooting

### If the extension fails to load with an icon error:

1. Check that the `icon.svg` file exists in the `images` folder.
2. Make sure the `manifest.json` file correctly references the icon file.
3. Try reloading the extension by clicking the refresh icon on the extension card in `chrome://extensions/`.

### If the extension doesn't appear in the toolbar:

1. Click the puzzle piece icon in the Chrome toolbar to see all extensions.
2. Find "WhatsApp Contact Exporter" in the list and click the pin icon to keep it visible in the toolbar.

### If the extension doesn't work with WhatsApp Web:

1. Make sure you are logged into WhatsApp Web at `https://web.whatsapp.com/`.
2. Verify that WhatsApp Web is fully loaded and you can see your chats.
3. If you see a QR code, scan it with your phone to log in.
4. Try refreshing the WhatsApp Web page and then using the extension again.
5. If the extension still doesn't work, try clicking the refresh icon on the extension card in `chrome://extensions/`.
6. For best results, make sure you're using a supported browser (Chrome, Firefox, Edge, Opera, or Safari on macOS 11+).

### If the extension says "Error: Please open WhatsApp Web first":

1. Make sure you're on the correct WhatsApp Web URL: `https://web.whatsapp.com/`.
2. Try clicking the "Open WhatsApp Web" button in the extension popup.
3. After WhatsApp Web loads, log in and then try using the extension again.
4. If you're already on WhatsApp Web, try refreshing the page and then using the extension again.
5. The extension might not be detecting WhatsApp Web correctly. Try reinstalling the extension.

### If no contacts are found:

1. Make sure you are logged into WhatsApp Web and can see your chats.
2. The extension extracts contacts from the "New chat" panel. Try manually clicking the "New chat" button in WhatsApp Web to see if contacts load.
3. Wait a few seconds after WhatsApp Web loads before using the extension.
4. Some older versions of WhatsApp Web may use different HTML structures. Try updating your browser to the latest version.

## Usage

1. Open [WhatsApp Web](https://web.whatsapp.com/) in your Chrome browser.
2. Login to your WhatsApp account by scanning the QR code.
3. Click on the WhatsApp Contact Exporter extension icon in your toolbar.
4. Click the "Extract Contacts" button.
5. Wait for the extraction to complete.
6. Choose your preferred export format (CSV, vCard, or Excel).
7. Save the exported file to your computer.

## Support

If you encounter any issues with the extension, please report them to [Lothar Tjipueja's GitHub repository](https://github.com/lothartj). 