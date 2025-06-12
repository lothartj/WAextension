# WhatsApp Contact Exporter - Documentation

This document provides an overview of the WhatsApp Contact Exporter Chrome extension developed by [Lothar Tjipueja](https://github.com/lothartj).

## Project Structure

```
WAextension/
├── css/
│   └── popup.css           # Styles for the popup UI
├── images/
│   ├── icon.svg            # SVG icon used for the extension
│   ├── icon_creator.html   # Tool to generate PNG icons if needed
│   └── generate_icons.html # Alternative tool for icon generation
├── js/
│   ├── content.js          # Content script that extracts contacts from WhatsApp Web
│   └── popup.js            # Script for the popup UI and export functionality
├── lib/
│   ├── FileSaver.min.js    # Library for saving files
│   └── xlsx.full.min.js    # Library for Excel file generation
├── DOCUMENTATION.md        # This file
├── LICENSE                 # MIT License
├── manifest.json           # Extension manifest
├── package.sh              # Packaging script
├── popup.html              # Popup UI HTML
└── README.md               # Project readme
```

## How It Works

The extension works by injecting a content script into the WhatsApp Web page that can extract contacts from the DOM. Here's how the different components work together:

1. **Content Script (content.js)**: Runs in the context of the WhatsApp Web page and extracts contacts by:
   - Opening the contacts panel
   - Waiting for contacts to load
   - Scraping contact information from the DOM
   - Sending the extracted contacts back to the popup

2. **Popup (popup.html, popup.js)**: Provides the user interface and export functionality:
   - Allows users to initiate contact extraction
   - Displays a preview of extracted contacts
   - Provides options to export contacts in different formats
   - Handles the export process

3. **Libraries**:
   - **xlsx.full.min.js**: Used to generate Excel files
   - **FileSaver.min.js**: Used to save generated files

## Contact Extraction Process

The extension extracts contacts through the following steps:

1. User clicks the "Extract Contacts" button in the popup
2. The popup sends a message to the content script
3. The content script opens the contacts panel in WhatsApp Web
4. The content script waits for contacts to load
5. The content script extracts contact information (name, status, and phone number if available)
6. The extracted contacts are sent back to the popup
7. The popup displays a preview of the contacts and enables export options

## Export Formats

The extension supports exporting contacts in three formats:

1. **CSV**: A simple comma-separated values file that can be opened in spreadsheet applications
2. **vCard**: A standard format for contact information that can be imported into most contact managers
3. **Excel**: A Microsoft Excel file (.xlsx) for more advanced spreadsheet functionality

## Limitations

- Phone numbers may not be available for all contacts due to how WhatsApp Web structures its data
- The extension can only extract contacts that are visible in the WhatsApp Web interface
- The extension needs to be run each time the user wants to update their contact list

## Future Improvements

Potential improvements for future versions:

- Add ability to extract profile pictures
- Improve phone number extraction accuracy
- Add ability to extract contacts from specific groups
- Add search and filter functionality for extracted contacts
- Add dark mode support
- Add multilingual support

## Credits

Developed by [Lothar Tjipueja](https://github.com/lothartj) 