FROM ubuntu:24.04

ARG NAMECOIN_VER=master
ENV NAMECOIN_VER $NAMECOIN_VER

ENV NODE_PORT 8334
ENV NODE_PORT_TESTNET 18334
ENV NODE_PORT_REGTEST 18334
ENV REGTEST false
ENV TESTNET false
ENV RPC_ALLOW_IP 172.17.0.0/16
ENV RPC_PASSWORD ""
ENV RPC_PORT 8336
ENV RPC_PORT_TESTNET 18336
ENV RPC_PORT_REGTEST 18336
ENV RPC_USER admin

#Install dependencies
RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y \
	autoconf \
    cmake \
	apt-utils \
	bsdmainutils \
	build-essential \
	curl \
	jq \
	vim \
	jq \
	bc \
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

#Install locales
RUN locale-gen ${OS_LOCALE}

ENV OS_LOCALE en_US.UTF-8
ENV LANG ${OS_LOCALE}
ENV LANGUAGE en_US:en

#Set user
WORKDIR /
RUN adduser --disabled-password --gecos '' namecoin && \
	adduser namecoin sudo && \
	echo '%sudo ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers
USER namecoin

#Install namecoin-core
WORKDIR /home/namecoin
RUN mkdir .namecoin && \
	sudo git clone --branch $NAMECOIN_VER https://github.com/namecoin/namecoin-core namecoin-core && \
	cd namecoin-core && \
	sudo ./autogen.sh && \
    sudo make -C depends NO_QT=1 NO_USDT=1 && \
    export CXXFLAGS="-I$(pwd)/depends/x86_64-pc-linux-gnu/include $CXXFLAGS" && \
    export BDB_CFLAGS="/home/namecoin/namecoin-core/depends/x86_64-pc-linux-gnu" && \
    sudo ./configure CPPFLAGS="-I$(pwd)/depends/x86_64-pc-linux-gnu/include" LDFLAGS="-L$(pwd)/depends/x86_64-pc-linux-gnu/lib" && \
	sudo make && \
	sudo make install

#Copy start scripts
WORKDIR /home/namecoin/scripts/
COPY entrypoint.sh entrypoint.sh

RUN sudo dos2unix \
	entrypoint.sh && \
	sudo chmod +x \
	entrypoint.sh && \
	sudo apt-get purge -y dos2unix && \
	sudo rm -rf /var/lib/apt/lists/*

#Create data dir
WORKDIR /home/namecoin
RUN mkdir data && \
	cd data && \
	mkdir namecoin &&\
	sudo rm -rf /home/namecoin/.namecoin && \
	sudo ln -s /home/namecoin/data/namecoin /home/namecoin/.namecoin

#Run entrypoint
WORKDIR /home/namecoin
ENTRYPOINT ["scripts/entrypoint.sh"]

#Start namecoin and meteor
CMD ["/usr/local/bin/namecoind"]

#Expose ports
EXPOSE $NODE_PORT $RPC_PORT $RPC_PORT_REGTEST