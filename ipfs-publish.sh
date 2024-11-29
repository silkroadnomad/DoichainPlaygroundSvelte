#!/bin/bash

# Run the ipfs add command and capture the output
output=$(ipfs add -r public)

# Extract the CID using awk or cut
cid=$(echo "$output" | tail -n 1 | awk '{print $2}')

# Run the ipfs name publish command with the extracted CID
ipfs name publish --key=doichain-playground $cid

# Update the vercel.json file with the new CID
sed -i '' "s|/ipfs/[^\"}]*|/ipfs/$cid|g" vercel.json

# Get the current version from package.json
version=$(node -p "require('./package.json').version")

# Git commands
git add vercel.json
git commit -m "Update IPFS CID to $cid for version $version"
git tag -a "v$version" -m "Version $version"
git push origin main
git push origin --tags

echo "Changes committed and pushed to GitHub. Tagged as v$version"