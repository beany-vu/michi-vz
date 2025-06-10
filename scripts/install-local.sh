#!/bin/bash

# Script to install michi-vz locally in another project
# Usage: ./scripts/install-local.sh /path/to/your/other/project

if [ -z "$1" ]; then
    echo "Usage: $0 <target-project-path>"
    echo "Example: $0 ../my-other-project"
    exit 1
fi

TARGET_PROJECT="$1"
TARGET_NODE_MODULES="$TARGET_PROJECT/node_modules/michi-vz"

# Build the library
echo "Building michi-vz..."
npm run build

# Create node_modules directory if it doesn't exist
mkdir -p "$TARGET_PROJECT/node_modules"

# Remove old version if exists
if [ -d "$TARGET_NODE_MODULES" ]; then
    echo "Removing old version..."
    rm -rf "$TARGET_NODE_MODULES"
fi

# Create the package directory
mkdir -p "$TARGET_NODE_MODULES"

# Copy only necessary files
echo "Copying files to $TARGET_NODE_MODULES..."
cp -r dist "$TARGET_NODE_MODULES/"
cp package.json "$TARGET_NODE_MODULES/"
cp README.md "$TARGET_NODE_MODULES/" 2>/dev/null || true

echo "✅ Successfully installed michi-vz to $TARGET_PROJECT"
echo ""
echo "You can now import it in your project:"
echo "import { GapChart, MichiVzProvider } from 'michi-vz';"