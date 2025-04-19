#!/bin/bash
date="$(date --date='yesterday' +'%Y-%m-%d')"
./mmx-daily-overview.js --output=telegram --date=$date
echo "MMX report generated for: $date."
