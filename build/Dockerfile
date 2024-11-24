ARG UPSTREAM_VERSION

FROM node:18.20.0 AS builder

RUN mkdir ~/.ssh
RUN ssh-keyscan github.com >> ~/.ssh/known_hosts

# build wizard
WORKDIR /usr/src/app/wizard
COPY wizard .
RUN npm i
RUN npm run build

# build monitor
WORKDIR /usr/src/monitor
COPY monitor .
RUN yarn --frozen-lockfile
RUN rm -Rf build && yarn run build
RUN rm -Rf node_modules
RUN yarn --production



FROM --platform=linux/amd64 ssvlabs/ssv-node:${UPSTREAM_VERSION}

RUN apt-get update && apt-get install -y \
    supervisor \
    nginx \
    nodejs \
    curl \
 && rm -rf /var/lib/apt/lists/*

RUN adduser nginx

# download yq
RUN wget https://github.com/mikefarah/yq/releases/latest/download/yq_linux_amd64 -O /usr/local/bin/yq
RUN chmod +x /usr/local/bin/yq

# copy wizard & monitor
COPY --from=builder /usr/src/app/wizard/out /usr/local/wizard
COPY --from=builder /usr/src/monitor /usr/local/monitor

# supervisor, nginx, entrypoint
ADD supervisord.conf /etc/supervisord.conf
ADD nginx.conf /etc/nginx/
ADD startssvnode.sh /
RUN chmod +x /startssvnode.sh

WORKDIR /
ENTRYPOINT ["supervisord", "--nodaemon", "--configuration", "/etc/supervisord.conf"]
