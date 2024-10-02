

const dev = false;

const network = process.env["NETWORK"];
console.log(`network=${network}`);

exports.server_config = {
    monitor_url: dev ? "http://localhost:9999" : "http://ssv.my.ava.do:9999",
    config_file_path: `/data/${network}/config.yaml`,
    private_key_file: `/data/${network}/encrypted_private_key.json`,
    password_file: `/data/${network}/password.txt`,
    db_path: `/data/${network}/db`,
    network,
    dev
}

