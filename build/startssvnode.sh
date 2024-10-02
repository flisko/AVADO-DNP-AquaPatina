#!/bin/sh

echo "Preparing node to start up"

DATA_FOLDER="/data/${NETWORK}"
mkdir -p "${DATA_FOLDER}"

PASSWORD_FILE="${DATA_FOLDER}/password.txt"
PRIVATE_KEY_FILE="${DATA_FOLDER}/encrypted_private_key.json"
CONFIG_FILE=${DATA_FOLDER}/config.yml
DB_FOLDER=${DATA_FOLDER}/db

if [ ! -f ${PRIVATE_KEY_FILE} ]; then
    echo "### Creating initial configuration"

    mkdir -p ${DB_FOLDER}
    touch ${CONFIG_FILE}

    # Generate password
    awk -v n=12 'BEGIN{srand(); while (n--) printf "%c", int(rand()*93+33)}' >${PASSWORD_FILE}

    /go/bin/ssvnode generate-operator-keys -p ${PASSWORD_FILE}
    mv encrypted_private_key.json ${PRIVATE_KEY_FILE}
else
    echo "### Config file already exists"
fi

yq eval --inplace '.KeyStore.PrivateKeyFile = "'${PRIVATE_KEY_FILE}'"' ${CONFIG_FILE}
yq eval --inplace '.KeyStore.PasswordFile = "'${PASSWORD_FILE}'"' ${CONFIG_FILE}
yq eval --inplace '.db.Path = "'${DB_FOLDER}'"' ${CONFIG_FILE}
yq eval --inplace '.ssv.Network = "'${NETWORK}'"' ${CONFIG_FILE}
yq eval --inplace '.eth2.BeaconNodeAddr = "'${BEACONNODEADDR}'"' ${CONFIG_FILE}
yq eval --inplace '.eth1.ETH1Addr = "'${EXECUTIONCLIENTADDR}'"' ${CONFIG_FILE}

yq eval --inplace '.global.LogLevel = "info"' ${CONFIG_FILE}
yq eval --inplace '.global.LogFilePath = "'${DATA_FOLDER}/debug.log'"' ${CONFIG_FILE}
yq eval --inplace '.global.LogFileBackups = 10' ${CONFIG_FILE}
yq eval --inplace '.MetricsAPIPort = 15000' ${CONFIG_FILE}

yq eval --inplace '.ssv.ValidatorOptions.BuilderProposals = true' ${CONFIG_FILE}


echo "---config"
cat ${CONFIG_FILE}
echo "config---"

while true; do
    # Start SSV-Node
    /go/bin/ssvnode start-node -c ${CONFIG_FILE}
    echo "WARN: ssvnode exited! - Will retry in 60s"
    sleep 60
done
