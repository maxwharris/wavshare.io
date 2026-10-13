#!/bin/bash
# Deploy hook for wavshare.io. Runs ON the box (ec2p) in ~/wavshare.io (branch prod), after `git pull`.
# From your Mac, run `deployp` in a checkout of the prod branch: it pushes, pulls on the box, runs this,
# then checks the URLs below. Running it by hand on the box works too. Box conventions: dev-personal/CLAUDE.md
#
# check: https://wavshare.io/
# check: https://wavshare.io/api/health
#
# nginx (sites-available/wavshare.io) serves client/build/ and proxies /api to :5000.
# server/uploads/ (user audio) and the sqlite database live only on the box and are not in git:
# never `git clean` or `git reset --hard` this checkout. Schema changes are applied by hand.

set -e
[ "$(uname)" = Linux ] || { echo "deploy.sh runs on the box. From your Mac: deployp"; exit 1; }
cd "$(dirname "$0")"

# Client (Create React App): build beside the live build/ and swap it in only if the build succeeds.
cd client
rm -rf build.next
npm ci --no-audit --no-fund
BUILD_PATH=build.next npx react-scripts build
rm -rf build.prev && { [ ! -d build ] || mv build build.prev; } && mv build.next build && rm -rf build.prev
cd ..

# Server (TypeScript): compile beside the live dist/ and swap it in only if tsc succeeds.
cd server
rm -rf dist.next
npm ci --no-audit --no-fund
npx prisma generate
npx tsc --outDir dist.next
rm -rf dist.prev && { [ ! -d dist ] || mv dist dist.prev; } && mv dist.next dist && rm -rf dist.prev
cd ..
pm2 restart wavshare-api
pm2 save
