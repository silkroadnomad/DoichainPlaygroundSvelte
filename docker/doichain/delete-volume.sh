#!/bin/bash

# Define the path to your docker-compose file
COMPOSE_FILE="./docker-compose-regtest.yml"

# Backup the original file
cp "$COMPOSE_FILE" "${COMPOSE_FILE}.bak"

# Remove the line with the conditional volume definition
sed -i '' '".\/.doichain\/:\/home\/doichain\/.doichain\/"/d' "$COMPOSE_FILE"

# Run docker-compose
docker compose -f "$COMPOSE_FILE" up

# Optionally, restore the original file
# mv "${COMPOSE_FILE}.bak" "$COMPOSE_FILE"