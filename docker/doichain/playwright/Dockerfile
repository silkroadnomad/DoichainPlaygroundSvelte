FROM mcr.microsoft.com/playwright:v1.49.0-noble

USER root

RUN mkdir /tests
COPY ./files /tests
WORKDIR /tests

RUN ls -l && yarn install --frozen-lockfile
RUN npx @playwright/test install
RUN npx playwright install-deps
RUN npx playwright test tests/playground.spec.ts
