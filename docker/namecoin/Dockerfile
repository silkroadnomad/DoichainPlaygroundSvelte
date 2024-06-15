FROM ubuntu:18.04

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

#Install berkeley-db
WORKDIR /tmp/build/bdb
ADD http://download.oracle.com/berkeley-db/db-4.8.30.NC.tar.gz db-4.8.30.NC.tar.gz
RUN echo '12edc0df75bf9abd7f82f821795bcee50f42cb2e5f76a6a281b85732798364ef  db-4.8.30.NC.tar.gz' | sudo sha256sum -c && \
	sudo tar xzvf db-4.8.30.NC.tar.gz && \
	cd db-4.8.30.NC/build_unix/ && \
	sudo ../dist/configure --enable-cxx && \
	#sudo rm /usr/include/db.h && \
	sudo make && \
	sudo make install && \
	sudo ln -s /usr/local/BerkeleyDB.4.8 /usr/include/db4.8 && \
	sudo ln -s /usr/include/db4.8/lib/* /usr/lib && \
    sudo ln -s /usr/include/db4.8/include/* /usr/include

#Install namecoin-core
WORKDIR /home/namecoin
RUN mkdir .namecoin && \
	sudo git clone https://github.com/namecoin/namecoin-core namecoin-core && \
	cd namecoin-core && \
	sudo ./autogen.sh && sudo ./configure --disable-tests  --disable-gui-tests && \
	sudo make && \
	sudo make install


RUN sudo apt-get purge -y dos2unix && \
	sudo rm -rf /var/lib/apt/lists/*



#WORKDIR /home/namecoin
#ENTRYPOINT ["scripts/entrypoint.sh"]

#Start doichain and meteor
#CMD ["scripts/start.sh"]
CMD ["namcoind"]