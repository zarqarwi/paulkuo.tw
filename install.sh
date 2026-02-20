#!/bin/bash
export PATH=/usr/local/bin:/opt/homebrew/bin:/Users/apple/.nvm/versions/node/v22.14.0/bin:$PATH
export npm_config_cache=/tmp/npm-cache-paul
cd /Users/apple/Desktop/01_專案進行中/paulkuo-astro
npm install 2>&1
echo "EXIT_CODE=$?"
