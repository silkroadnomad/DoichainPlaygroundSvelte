FROM mcr.microsoft.com/playwright:v1.49.0-noble

USER root

RUN mkdir /playground
COPY ./files /playground
WORKDIR /playground

RUN yarn install --frozen-lockfile
RUN npx @playwright/test install
RUN npx playwright install-deps
RUN ls -l /playground/* && npx playwright test tests/playground.spec.ts
