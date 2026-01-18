FROM node:16

ARG UID=1000
ARG GID=1000

RUN groupadd -g ${GID} app \
 && useradd -m -u ${UID} -g ${GID} app

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

USER app

EXPOSE 3000
CMD ["npm", "run", "dev"]
