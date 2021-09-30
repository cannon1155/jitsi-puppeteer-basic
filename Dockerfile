# syntax=docker/dockerfile:1

FROM node:latest
RUN apt-get update
WORKDIR /puppeteer
RUN apt-get install -y \
    fonts-liberation \
    gconf-service \
    libappindicator1 \
    libasound2 \
    libatk1.0-0 \
    libcairo2 \
    libcups2 \
    libfontconfig1 \
    libgbm-dev \
    libgdk-pixbuf2.0-0 \
    libgtk-3-0 \
    libicu-dev \
    libjpeg-dev \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libpng-dev \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    xdg-utils
# inherits node base image to build off and installs deps

ENV NODE_ENV=production
# improves performance

COPY ["package.json", "package-lock.json*", "./"]
# copies from local into docker image
RUN npm ci
RUN chmod -R o+rwx node_modules/puppeteer/.local-chromium
# installs puppeteer, and gives it permissions to run chromium's binary

RUN npm install --production
# installs node dependencies

COPY . .
# moves files into image

CMD [ "npm", "run", "start" ]
# runs image

