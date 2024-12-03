FROM mcr.microsoft.com/playwright:v1.49.0-noble
RUN apt update && apt install -y telnet vim git net-tools iputils-ping curl wget
USER root

RUN mkdir /playground
COPY . /playground
WORKDIR /playground

RUN yarn install --frozen-lockfile
RUN yarn run build
RUN npx @playwright/test install
RUN npx playwright install-deps
RUN npx playwright test
#RUN sleep infinity
