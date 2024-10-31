# syntax=docker/dockerfile:1
# This should be ok to work with latest version of Python 3.8.
# TODO: update to more recent version.
FROM python:3.8

LABEL maintainer="Nico Krause nico.krause@le-space.de"

ENV DEBIAN_FRONTEND=noninteractive
RUN apt update && apt install -y libleveldb-dev

# Clone and install ElectrumX from commit c5d1e802e7a7e98db36fbad79954b3a46b9e03f3.
RUN git clone https://github.com/kyuupichan/electrumx.git \
    && cd electrumx \
    && git checkout 835aa492e9a3563d89d99c35168378d65321b849 \
    && pip3 install .

# Create user and group electrumx with uid:gid = 1000:1000.
# Make it's home /electrumx and leave it read-only.
RUN groupadd -g 1000 electrumx && useradd -d /electrumx -m electrumx -u 1000 -g 1000

# Drop root and use electrumx user.
USER electrumx

# Go to /eletrumx.
WORKDIR /electrumx

# Start ElectrumX server.
ENTRYPOINT ["./electrumx_server"]

#RUN rm -rf /var/lib/apt/lists/*