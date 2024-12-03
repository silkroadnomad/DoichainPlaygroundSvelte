FROM mcr.microsoft.com/playwright:v1.49.0-noble

USER root

RUN mkdir /tests
# COPY . /tests
WORKDIR /tests

RUN npm install 
RUN npx @playwright/test install
RUN npx playwright install-deps
RUN npx playwright test
