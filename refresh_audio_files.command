#!/bin/bash
cd "$(dirname "$0")"

echo "const audioFiles = [" > assets/audioFiles.js

# Only include files (skip subdirs), sorted by natural order
find audio -type f -maxdepth 1 -name "*.mp3" -print | sed 's|^audio/||' | sort | awk '{printf("  \"%s\",\n", $0)}' >> assets/audioFiles.js

echo "];" >> assets/audioFiles.js

echo "assets/audioFiles.js generated."
