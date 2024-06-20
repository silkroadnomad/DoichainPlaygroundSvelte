FROM ubuntu:22.04

RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y \
    build-essential libtool autotools-dev automake pkg-config bsdmainutils python3  libevent-dev libboost-dev \
	autoconf \
	apt-utils \
	bsdmainutils \
	curl \
	jq \
	vim \
	jq \
	bc \
	dos2unix \
	git \
	libboost-all-dev \
	libssl-dev \
	locales \
	sudo \
	&& rm -rf /var/lib/apt/lists/*

RUN locale-gen ${OS_LOCALE}

ENV OS_LOCALE en_US.UTF-8
ENV LANG ${OS_LOCALE}
ENV LANGUAGE en_US:en

WORKDIR /
RUN adduser --disabled-password --gecos '' namecoin && \
	adduser namecoin sudo && \
	echo '%sudo ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers \

USER namecoin
ADD entrypoint.sh /

WORKDIR /home/namecoin
RUN mkdir .namecoin && \
	sudo git clone https://github.com/namecoin/namecoin-core namecoin-core && \
	cd namecoin-core && \
	sudo ./autogen.sh && sudo ./configure --disable-wallet --disable-tests  --disable-gui-tests && \
	sudo make && \
	sudo make install

RUN sudo apt-get purge -y dos2unix && \
	sudo rm -rf /var/lib/apt/lists/*
ENTRYPOINT  ["./entrypoint.sh"]
EXPOSE 8334 8336
CMD ["/usr/local/bin/namecoind"]