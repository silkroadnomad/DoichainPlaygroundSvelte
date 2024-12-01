# syntax=docker/dockerfile:1
# This should be ok to work with latest version of Python 3.8.
# TODO: update to more recent version.
FROM python:3.8

LABEL maintainer="Nico Krause nico.krause@le-space.de"

ENV DEBIAN_FRONTEND=noninteractive
RUN apt update && apt install -y libleveldb-dev sudo

# Clone and install ElectrumX from commit c5d1e802e7a7e98db36fbad79954b3a46b9e03f3.
RUN git clone https://github.com/Doichain/electrumx.git\
    && cd electrumx \
    && pip3 install .

RUN adduser --disabled-password --gecos '' electrumx && \
	adduser electrumx sudo && \
	echo '%sudo ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers && \
	mkdir -p certs
# Create user and group electrumx with uid:gid = 1000:1000.
# Make it's home /electrumx and leave it read-only.

# Drop root and use electrumx user.
USER electrumx

# Go to /eletrumx.
WORKDIR /electrumx

# Start ElectrumX server.
ENTRYPOINT ["./electrumx_server"]

# Safely remove the apt lists if they exist
RUN [ -d /var/lib/apt/lists ] && rm -rf /var/lib/apt/lists/* || true