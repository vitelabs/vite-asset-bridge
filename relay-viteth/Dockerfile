FROM node:14


WORKDIR /app

COPY . ./relay

RUN cd relay && npm install && ./node_modules/.bin/tsc -p . && npm link

ENTRYPOINT ["vabrelay"] 

