FROM ubuntu:18.04

ARG KOMODO_VER=master
ENV KOMODO_VER $KOMODO_VER

#Setup run vars
ENV CONFIRM_ADDRESS ""
ENV CONNECTION_NODE 5.9.154.226
ENV DAPP_URL http://localhost:3000
ENV NODE_PORT 8338
ENV NODE_PORT_TESTNET 18338
ENV NODE_PORT_REGTEST 18445
ENV REGTEST false
ENV TESTNET false
ENV RPC_ALLOW_IP 172.17.0.0/16
ENV RPC_PASSWORD ""
ENV RPC_PORT 8339
ENV RPC_PORT_TESTNET 18339
ENV RPC_PORT_REGTEST 18332
ENV RPC_USER admin

#Install dependencies
RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y \
	autoconf \
	apt-utils \
	bsdmainutils \
	build-essential \
	curl \
	jq \
	vim \
	jq \
	bc \
#	bsdtar \
	dos2unix \
	git \
	libboost-all-dev \
	libevent-dev \
	libssl-dev \
	libtool \
	locales \
	pkg-config \
	sudo \
	&& rm -rf /var/lib/apt/lists/*

#RUN export tar='bsdtar'


#Install locales
RUN locale-gen ${OS_LOCALE}

ENV OS_LOCALE en_US.UTF-8
ENV LANG ${OS_LOCALE}
ENV LANGUAGE en_US:en
#ENV LC_ALL ${OS_LOCALE}

#Set user
WORKDIR /
RUN adduser --disabled-password --gecos '' komodo && \
	adduser komodo sudo && \
	echo '%sudo ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers
USER komodo

#Install komodo-core
WORKDIR /home/komodo
RUN mkdir .komodo && \
    sudo git clone https://github.com/KomodoPlatform/komodo.git komodo-core && \
    cd komodo-core && \
    sudo ./zcutil/fetch-params.sh && \
    sudo ./zcutil/build.sh -j$(nproc) && \
    sudo make install

RUN sudo apt-get purge -y dos2unix && \
	sudo rm -rf /var/lib/apt/lists/*

#Create komodo data dir
WORKDIR /home/komodo
RUN mkdir data && \
    mkdir scripts && \
    cd data && \
    mkdir komodo && \
    sudo rm -rf /home/komodo/.komodo && \
    sudo ln -s /home/komodo/data/komodo /home/komodo/.komodo

#Run entrypoint
WORKDIR /home/komodo
#Start komodod
CMD ["/usr/local/bin/komodod", "-daemon=0"]

#Expose ports
EXPOSE $NODE_PORT $RPC_PORT $RPC_PORT_REGTEST
