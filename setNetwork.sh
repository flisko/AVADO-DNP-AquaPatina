#!/bin/bash

NETWORK=$1

case ${NETWORK} in
"mainnet" | "holesky" | "ssv") ;;
*)
  echo "Invalid network"
  exit
  ;;
esac

for file in \
  docker-compose.yml \
  dappnode_package.json \
  avatar.png; do
  BASENAME=build/${file%.*}
  EXT=${file##*.}
  echo $BASENAME
  echo $EXT
  echo $file
  rm -f $file
  ln ${BASENAME}-${NETWORK}.${EXT} $file
done

ln -f build/wizard/config-${NETWORK}.js build/wizard/config.js

