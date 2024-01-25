#!/bin/sh -l

# Compile TypeScript
yarn run all

# Execute the compiled JavaScript with Node
node ./dist/index.js
