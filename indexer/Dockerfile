FROM node:14-alpine


WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN ./node_modules/.bin/tsc -p . || echo "tsc -p ."

RUN npm link

ENTRYPOINT ["vabindexer"] 

