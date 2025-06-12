#!/bin/bash

# WhatsApp Contact Exporter Packaging Script
# Developed by Lothar Tjipueja (https://github.com/lothartj)

# Set version from manifest
VERSION=$(grep -o '"version": "[^"]*"' manifest.json | cut -d'"' -f4)
PACKAGE_NAME="whatsapp_contact_exporter_v$VERSION.zip"

echo "Packaging WhatsApp Contact Exporter v$VERSION..."

# Create zip file
zip -r "$PACKAGE_NAME" \
    manifest.json \
    popup.html \
    css/ \
    js/ \
    lib/ \
    images/icon.svg \
    LICENSE \
    README.md \
    -x "*/.*" \
    -x "images/generate_icons.html" \
    -x "images/icon_creator.html" \
    -x "images/create_icons.js"

echo "Package created: $PACKAGE_NAME"
echo "Done!" 