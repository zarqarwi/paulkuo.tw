#!/bin/bash
export PATH=/usr/local/bin:/usr/bin:/bin
cd "$(dirname "$0")/worker"
npx wrangler deploy 2>&1
