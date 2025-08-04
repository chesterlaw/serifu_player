#!/bin/bash
cd "$(dirname "$0")"

echo "const audioFiles = [" > audioFiles.js

# Only include files (skip subdirs), sorted by natural order
find audio -type f -maxdepth 1 -name "*.mp3" -print | sed 's|^audio/||' | sort | awk '{printf("  \"%s\",\n", $0)}' >> audioFiles.js

echo "];" >> audioFiles.js

echo "audioFiles.js generated."
