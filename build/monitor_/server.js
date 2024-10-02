const restify = require("restify");
const corsMiddleware = require("restify-cors-middleware2");
const axios = require('axios').default;
const yaml = require('js-yaml');
const fs = require('fs');
const { server_config } = require('./config.js');
const { exec } = require('child_process');

const getConfig = () => {
    try {
        const config = yaml.load(fs.readFileSync(server_config.config_file_path, 'utf8'))
        return config ? config : {}
    } catch (e) {
        return {};
    }
}

const getKeyFile = () => {
    try {
        const config = JSON.parse(fs.readFileSync(server_config.private_key_file, 'utf8'))
        return config ? config : {}
    } catch (e) {
        return {};
    }
}

console.log("Monitor starting...");

const server = restify.createServer({
    name: "MONITOR",
    version: "1.0.0"
});

const cors = corsMiddleware({
    preflightMaxAge: 5, //Optional
    origins: [
        /^http:\/\/localhost(:[\d]+)?$/,
        "http://*.dappnode.eth",
        "http://*.my.ava.do"
    ]
});

server.pre(cors.preflight);
server.use(cors.actual);
server.use(restify.plugins.bodyParser());

server.get("/ping", (req, res, next) => {
    res.send(200, "pong");
    next()
});

server.get("/network", (req, res, next) => {
    res.send(200, { "data": server_config.network });
    next()
});

server.get("/isRegistered", (req, res, next) => {
    const config = getConfig();
    res.send(200, { "data": !!config.isRegistered });
    next()
});


server.get("/getBackup", (req, res, next) => {
    const keyfile = getKeyFile();
    const password = fs.readFileSync(server_config.password_file, 'utf8')
    const network = server_config.network;

    const backup = {
        keyfile, password, network
    }

    const jsonString = JSON.stringify(backup);

    // Set the headers to prompt a download in the browser
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="avado-ssv-${network}-backup.json"`);
    res.setHeader('Content-Length', Buffer.byteLength(jsonString));

    // Send the JSON string as a response
    res.write(jsonString);
    res.end();

    return next();
});

server.post("/restoreBackup", (req, res, next) => {
    if (!req.body || !req.body.backup) {
        res.send(400, "not enough parameters");
        return next();
    } else {
        const { keyfile, password, network } = JSON.parse(req.body.backup);
        if (network === server_config.network) {
            console.log("Restoring configuration from a backup")
            fs.writeFileSync(server_config.private_key_file, JSON.stringify(keyfile), 'utf8');
            fs.writeFileSync(server_config.password_file, password, 'utf8');

            // Restart ssvnode
            console.log("Restarting SSVNode")
            const command = "supervisorctl restart ssvnode";
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.error(`exec error: ${error}`);
                    return;
                }
                if (stderr) {
                    console.error(`stderr: ${stderr}`);
                    return;
                }
                console.log(`stdout: ${stdout}`);
            });

            fs.rm(server_config.db_path, { recursive: true, force: true }, err => {
                if (err) {
                    console.error(`Error deleting ${dir}: `, err);
                }
                console.log(`${dir} is deleted!`);
            });

            res.send(200, `Backup is restored`);
        } else {
            console.log("Backup is not correct: wrong network", network)
            res.send(403, `Backup is not  valid: wrong network`);
        }
        return next();
    }
});

server.get("/operatorPublicKey", (req, res, next) => {
    const config = getKeyFile();
    const key = config.publicKey;
    res.send(200, { "data": key });
    next()
});


server.post("/registrationTransaction", (req, res, next) => {
    if (!req.body) {
        res.send(400, "not enough parameters");
        return next();
    } else {
        const hash = req.body.hash;
        console.log("Setting registration hash " + hash)
        const config = getConfig();
        config.RegistrationHash = hash;
        let yamlStr = yaml.dump(config);
        fs.writeFileSync(server_config.config_file_path, yamlStr, 'utf8');
        res.send(200, `Registration transaction hash is stored`);
        return next();
    }
});

server.get("/operators/:id", (req, res, next) => {
    const id = req.params.id;
    if (id) {
        const url = `https://api.ssv.network/api/v4/${server_config.network}/operators/${id}`
        if (server_config.dev)
            console.log(url)
        get(url, res, next)
    }
});

server.get("/operators/owned_by/:address", (req, res, next) => {
    const address = req.params.address;
    if (address) {
        const url = `https://api.ssv.network/api/v4/${server_config.network}/operators/owned_by/${address}`
        if (server_config.dev)
            console.log(url)
        get(url, res, next)
    }
});

server.get("/validators/in_operator/:id", (req, res, next) => {
    const id = req.params.id;
    if (id) {
        const url = `https://api.ssv.network/api/v4/${server_config.network}/validators/in_operator/${id}`
        if (server_config.dev)
            console.log(url)
        get(url, res, next)
    }
});

server.get("/beaconNodeStatus", (req, res, next) => {
    const config = getConfig();
    console.dir(config)
    const beaconNodeAddr = config.eth2.BeaconNodeAddr;
    if (beaconNodeAddr) {
        const url = `${beaconNodeAddr}/eth/v1/node/syncing`
        get(url, res, next)
    } else {
        console.log("Invalid config");
        res.send(200, "Invalid config)")
        next()
    }
});


const get = (url, res, next) => {
    axios.get(url,
        {
            headers: {
                'Content-Type': 'application/json',
            },
        }).then(
            (response) => {
                console.dir(response.data)
                const data = response.data
                res.send(200, { "data": data })
                next();
            }
        ).catch(
            (error) => {
                console.log("Error contacting ", url, error);
                res.send(200, "failed")
                next();
            }
        )
}

const listAllRoutes = (server) => {
    return Object.values(server.router.getRoutes()).map(value =>
        [value.method, value.path]
    );
}

server.get("/", (req, res, next) => {
    const routes = listAllRoutes(server)
        .filter(([method, path]) => path !== "/")
        .map(([method, path]) => `<li><a href="${path}">${path}</a> (${method})</li>`);

    var body = `<html><body><ul>routes: ${routes.join("\n")}</ul></body></html>`;
    res.writeHead(200, {
        'Content-Length': Buffer.byteLength(body),
        'Content-Type': 'text/html'
    });
    res.write(body);
    res.end();
});


server.listen(9999, function () {
    console.log("%s listening at %s", server.name, server.url);
    console.log("Using config %s", server_config.config_file_path);
    // console.dir(getConfig())
});
