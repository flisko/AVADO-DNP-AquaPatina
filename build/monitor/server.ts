import * as restify from "restify";
import corsMiddleware from "restify-cors-middleware2"
import { SupervisorCtl } from "./SupervisorCtl";
import { server_config } from "./server_config";
import { rest_url, validatorAPI, getAvadoPackageName, getTokenPathInContainer, getAvadoExecutionClientPackageName, client_url, ws_url } from "./urls";
import { DappManagerHelper } from "./DappManagerHelper";
import { readFileSync } from "fs";
import AdmZip from 'adm-zip';
import cache from "memory-cache";
import { SSV } from './ssv';
import { SSVAPI } from './ssv-api';
import { BackupRestore } from './backup-restore';

import cron from 'node-cron';

const autobahn = require('autobahn');
const exec = require("child_process").exec;
const fs = require('fs');
const path = require("path");
const jsonfile = require('jsonfile')
const { ethers } = require("ethers");

const supported_beacon_chain_clients = ["teku"];
const supported_execution_clients = ["nethermind", "geth"];
const supported_mev_clients = ["mevboost"];

console.log("Monitor starting...");

const server = restify.createServer({
    ...server_config.https_options,
    name: "MONITOR",
    version: "1.0.0"
});

const cors = corsMiddleware({
    preflightMaxAge: 5, //Optional
    origins: [
        /^http:\/\/localhost(:[\d]+)?$/,
        "http://*.my.ava.do"
    ]
});

server.pre(cors.preflight);
server.use(cors.actual);
server.use(restify.plugins.bodyParser());

// attach endpoints of modules to the server
SSV.attach(server);
SSVAPI.attach(server);
BackupRestore.attach(server);


// generic endpoints
server.get("/ping", (req: restify.Request, res: restify.Response, next: restify.Next) => {
    res.send(200, "pong");
    next()
});

server.get("/network", (req: restify.Request, res: restify.Response, next: restify.Next) => {
    res.send(200, { data: server_config.network });
    next()
});

server.get("/name", (req: restify.Request, res: restify.Response, next: restify.Next) => {
    res.send(200, server_config.name);
    next()
});

server.get("/config", (req: restify.Request, res: restify.Response, next: restify.Next) => {
    res.send(200, server_config);
    next()
});

const supervisorCtl = new SupervisorCtl(`localhost`, 5555, '/RPC2') || null;

const restart = async () => {
    await Promise.all([
        supervisorCtl.callMethod('supervisor.stopProcess', ["stader-node", true]),
    ])
    return Promise.all([
        supervisorCtl.callMethod('supervisor.startProcess', ["stader-node", true]),
    ])
}

server.post("/service/restart", (req: restify.Request, res: restify.Response, next: restify.Next) => {
    restart().then((result) => {
        res.send(200, "restarted");
        return next()
    }).catch((error) => {
        res.send(500, "failed")
        return next();
    })
});

server.post("/service/stop", (req: restify.Request, res: restify.Response, next: restify.Next) => {
    const method = 'supervisor.stopProcess'
    Promise.all([
        supervisorCtl.callMethod(method, ["stader-node"]),
    ]).then(result => {
        res.send(200, "stopped");
        next()
    }).catch(err => {
        res.send(200, "failed")
        next();
    })
});

server.post("/service/start", (req: restify.Request, res: restify.Response, next: restify.Next) => {
    const method = 'supervisor.startProcess'
    Promise.all([
        supervisorCtl.callMethod(method, ["stader-node"]),
    ]).then(result => {
        res.send(200, "started");
        next()
    }).catch(err => {
        res.send(200, "failed")
        next();
    })
});

server.get("/service/status", (req: restify.Request, res: restify.Response, next: restify.Next) => {
    const method = 'supervisor.getAllProcessInfo'
    supervisorCtl.callMethod(method, [])
        .then((value: any) => {
            res.send(200, value);
            next()
        }).catch((_error: any) => {
            res.send(500, "failed")
            next();
        });
});

// server.get("/wallet/pk", (req: restify.Request, res: restify.Response, next: restify.Next) => {

//     // Function to read mnemonic from file
//     function readMnemonicFromFile(filePath: string) {
//         return fs.readFileSync(filePath, 'utf8').trim();
//     }


//     async function deriveWallet() {
//         // Path to the mnemonic file
//         const mnemonicFilePath = path.join('/.stader/data/mnemonic');

//         // Read the mnemonic from the file
//         const mnemonic = readMnemonicFromFile(mnemonicFilePath);

//         // Derive the wallet from the mnemonic
//         const wallet = ethers.Wallet.fromMnemonic(mnemonic);

//         // // Display the wallet address and private key
//         // console.log(`Address: ${wallet.address}`);
//         // console.log(`Private Key: ${wallet.privateKey}`);

//         return wallet.privateKey;
//     }

//     deriveWallet().then(((pk: string) => {
//         res.send(200, pk);
//         next()
//     }))

// });

let wampSession: any = null;
{
    const url = "ws://wamp.my.ava.do:8080/ws";
    const realm = "dappnode_admin";

    const connection = new autobahn.Connection({ url, realm });
    connection.onopen = (session: any) => {
        console.log("CONNECTED to \nurl: " + url + " \nrealm: " + realm);
        wampSession = session;
        checkConfig();
    };
    connection.open();
}

const getPackages = async () => {
    if (!wampSession) {
        console.log("No WAMP session found, exiting");
        return [];
    }
    const dappManagerHelper = new DappManagerHelper(server_config.packageName, wampSession);
    const packages = await dappManagerHelper.getPackages();

    return packages || [];

}
const getEnvs = async (packageName: string) => {
    if (!wampSession) {
        console.log("No WAMP session found, exiting");
        return [];
    }
    const dappManagerHelper = new DappManagerHelper(packageName, wampSession);
    const envs = await dappManagerHelper.getEnvs();
    return envs || [];
}

const writeEnv = async (packageName: string, key: string, value: string) => {
    if (!wampSession) {
        console.log("No WAMP session found, exiting");
        return [];
    }
    const dappManagerHelper = new DappManagerHelper(packageName, wampSession);
    const envs = await dappManagerHelper.writeEnv(key, value, true);
    return envs || [];
}

const getInstalledBCClients = async () => {
    if (!wampSession) {
        console.log("No WAMP session found, exiting");
        return null;
    }
    const dappManagerHelper = new DappManagerHelper(server_config.packageName, wampSession);
    const packages = await dappManagerHelper.getPackages();

    const installed_clients = supported_beacon_chain_clients
        .filter(client => (packages.includes(getAvadoPackageName(client, "beaconchain"))
            && packages.includes(getAvadoPackageName(client, "validator")))
        )
        .map(client => ({
            name: client,
            url: `http://${client_url(client)}`,
            validatorAPI: `http://${client_url(client)}:9999/keymanager`
        }))
    return installed_clients;
}

// const getInstalledELClients = async () => {
//     if (!wampSession) {
//         console.log("No WAMP session found, exiting");
//         return null;
//     }
//     const dappManagerHelper = new DappManagerHelper(server_config.packageName, wampSession);
//     const packages = await dappManagerHelper.getPackages();

//     const installed_clients = supported_execution_clients
//         .filter(client => (packages.includes(getAvadoPackageName(client))
//         )
//         .map(client => ({
//             name: client,
//             url: `http://${client_url(client)}`,
//             validatorAPI: `http://${client_url(client)}:9999/keymanager`
//         }))
//     return installed_clients;
// }

server.get("/avado-params", async (req: restify.Request, res: restify.Response, next: restify.Next) => {
    const dappManagerHelper = new DappManagerHelper(server_config.packageName, wampSession);
    const params = await dappManagerHelper.getParams();
    res.send(200, params);
    next();
});

// server.get("/bc-clients", async (req: restify.Request, res: restify.Response, next: restify.Next) => {
//     res.send(200, await getInstalledBCClients())
//     next();
// })

// server.get("/ec-clients", async (req: restify.Request, res: restify.Response, next: restify.Next) => {
//     const dappManagerHelper = new DappManagerHelper(server_config.packageName, wampSession);
//     const packages = await dappManagerHelper.getPackages();
//     console.log(`Packages`, packages);
//     console.log("/ec-clients packages", JSON.stringify(packages, null, 2))
//     const installed_clients = supported_execution_clients.filter(client => {
//         const name = getAvadoExecutionClientPackageName(client);
//         const isin = packages.includes(name);
//         console.log(`${name} is installed: ${isin}`);
//         return isin;
//     });

//     res.send(200, installed_clients.map(client => ({
//         name: client,
//         api: rest_url(client),
//         ws: ws_url(client),
//         url: `http://${client_url(client)}`
//     })))
//     next();
// })

// server.post("/stader-api", (req, res, next) => {
//     if (!req.body) {
//         res.send(400, "not enough parameters");
//         return next();
//     } else {
//         staderCommand(`api ${req.body.command}`).then((stdout) => {
//             res.send(200, stdout);
//             return next();
//         }).catch((e) => {
//             res.send(500, e);
//             return next();
//         })
//     }
// });


// server.post("/stader-any", (req, res, next) => {
//     if (!req.body) {
//         res.send(400, "not enough parameters");
//         return next();
//     } else {
//         staderCommand(req.body.command).then((stdout) => {
//             res.send(200, stdout);
//             return next();
//         }).catch((e) => {
//             res.send(500, e);
//             return next();
//         })
//     }
// });

// const staderCommand = (command: string) => {
//     const cmd = `/go/bin/stader ${command}`;
//     console.log(`Running ${cmd}`);

//     const executionPromise = execute(cmd, {
//         cwd: '/.stader'
//     });

//     executionPromise.then((result) => {
//         const data = JSON.parse(result);
//         if (command.includes("wallet init") && "mnemonic" in data) {
//             // store mnemonic to file
//             fs.writeFile("/.stader/data/mnemonic", data.mnemonic, (err: any) => console.log(err ? err : "Saved mnemoic"));
//         }
//         if ("txHash" in data) {
//             if (data.txHash !== "0x0000000000000000000000000000000000000000000000000000000000000000")
//                 storeTxHash(data.txHash);
//         }
//     }).catch(e => console.error)

//     return executionPromise;
// }

// const execute = (cmd: string, opts: object) => {
//     return new Promise<string>((resolve, reject) => {
//         const child = exec(cmd, opts, (error: Error, stdout: string | Buffer, stderr: string | Buffer) => {
//             if (error) {
//                 console.log(`error: ${error.message}`);
//                 return reject(error.message);
//             }
//             if (stderr) {
//                 console.log(`error: ${stderr}`);
//                 return reject(stderr);
//             }
//             return resolve(stdout.toString());

//         });
//         child.stdout.on('data', (data: any) => console.log(data.toString()));
//     });
// }

// const storeTxHash = (txHash: string) => {
//     const transactionsFile = "/.stader/data/transactions.json";
//     console.log(`Store hash ${txHash} to ${transactionsFile}`);
//     try {
//         const data = (fs.existsSync(transactionsFile)) ? jsonfile.readFileSync(transactionsFile) : { transactions: [] };
//         data.transactions.push(txHash);
//         jsonfile.writeFileSync(transactionsFile, data);
//     } catch (e) {
//         console.error(e)
//     }
// }


// //backup
// const backupFileName = "stader-backup.zip";
// server.get("/" + backupFileName, (req: restify.Request, res: restify.Response, next: restify.Next) => {
//     res.setHeader("Content-Disposition", "attachment; " + backupFileName);
//     res.setHeader("Content-Type", "application/zip");

//     const zip = new AdmZip();
//     zip.addLocalFolder("/.stader/", ".stader");
//     zip.toBuffer(
//         (buffer: Buffer) => {
//             res.setHeader("Content-Length", buffer.length);
//             res.end(buffer, "binary");
//             next();
//         }
//     )
// });


// function copyDir(sourceDir: string, targetDir: string) {
//     // Create the target directory if it doesn't exist
//     if (!fs.existsSync(targetDir)) {
//         fs.mkdirSync(targetDir);
//     }

//     // Get all files and subdirectories in the source directory
//     const files = fs.readdirSync(sourceDir);

//     files.forEach((file: File) => {
//         const sourcePath = path.join(sourceDir, file);
//         const targetPath = path.join(targetDir, file);

//         // Get the stats of the current file or directory
//         const stats = fs.statSync(sourcePath);

//         if (stats.isFile()) {
//             // If it's a file, copy it to the target directory
//             fs.copyFileSync(sourcePath, targetPath);
//         } else if (stats.isDirectory()) {
//             // If it's a directory, recursively copy it to the target directory
//             copyDir(sourcePath, targetPath);
//         }
//     });
// }



// function listFilesRecursive(directory: string): string[] {
//     const files: string[] = [];

//     function traverseDirectory(currentDir: string) {
//         const items = fs.readdirSync(currentDir);

//         items.forEach((item: File) => {
//             const itemPath = path.join(currentDir, item);
//             const stats = fs.statSync(itemPath);

//             if (stats.isFile()) {
//                 const filePath = path.join(currentDir, item);
//                 files.push(filePath);
//             } else if (stats.isDirectory()) {
//                 traverseDirectory(itemPath);
//             }
//         });
//     }

//     traverseDirectory(directory);

//     return files;
// }



// const DATADIR = "/.stader"
// const TMPDIR = "/tmp/restore"

// server.post('/restore-backup', async (req: restify.Request, res: restify.Response, next: restify.Next) => {
//     console.log("======================");
//     console.log("upload backup zip file");
//     const backupFile = req?.files?.backupFile;
//     if (!backupFile) {
//         res.send(400, 'Backup file is missing');
//         next();
//         return
//     }

//     const zipfilePath = "/tmp/backup.zip";
//     fs.renameSync(backupFile.path, zipfilePath, (err: any) => { if (err) console.log('ERROR: ' + err) });
//     console.log("received backup file " + backupFile.name);
//     try {

//         function getRootFolderName(zipPath: string): string | null {
//             const zip = new AdmZip(zipPath);
//             const zipEntries = zip.getEntries();

//             let dirName = null;
//             for (const entry of zipEntries) {
//                 if (entry.entryName.split('/').length > 1) {
//                     dirName = entry.entryName.split('/')[0];
//                 }
//             }
//             return dirName;
//         }

//         const rootFolder = getRootFolderName(zipfilePath);
//         if (rootFolder) {
//             console.log('ZIP contains single root folder:', rootFolder);
//             // delete existing data folder (if it exists)
//             // console.log(`clearing DATA dir: ${DATADIR}`);
//             // fs.rmSync(DATADIR, { recursive: true, force: true /* ignore if not exists */ });
//             console.log(`clearing TMP dir : ${TMPDIR}`);
//             fs.rmSync(TMPDIR, { recursive: true, force: true /* ignore if not exists */ });
//             console.log(`opening ZIPfile "${zipfilePath}"`);
//             const zip = new AdmZip(zipfilePath);
//             console.log(`exctract ZIPfile to ${TMPDIR}`);
//             await zip.extractAllTo(/*target path*/ TMPDIR, /*overwrite*/ true);

//             const sourceFolder = `${TMPDIR}/${rootFolder}`;
//             console.log(`copy ${sourceFolder} to ${DATADIR}`);
//             copyDir(sourceFolder, DATADIR);
//             console.log(`clearing TMP dir : ${TMPDIR}`);
//             fs.rmSync(TMPDIR, { recursive: true, force: true /* ignore if not exists */ });
//             console.log(`remove ZIP file: ${zipfilePath}`);
//             fs.rmSync(zipfilePath);

//             console.log(`list of files in ${DATADIR} after restore`)
//             const files = listFilesRecursive(DATADIR);
//             console.log(files);

//             console.log("======================");

//             console.log(`restart Stader`);
//             restart();

//             res.send({
//                 code: 200,
//                 message: `Successfully restored backup. Please wait 1 minute and reload this page.`,
//             });
//             return next();

//         } else {
//             // invalid ZIP file
//             // zipfile does not have a single root folder..

//             res.send({
//                 code: 500,
//                 message: `Invalid ZIP file (file should contain exactly 1 folder).`,
//             });
//             return next();
//         }


//     } catch (e) {
//         console.dir(e);
//         console.log(e);
//         res.send({
//             code: 500,
//             message: e,
//         });
//         return next();
//     }
// });


// //restore
// server.post('/restore-backup', (req, res, next) => {
//     console.log("upload backup zip file");
//     if (req.files.file) {
//         const file = req.files.file;
//         req.info = file.name;
//         const zipfilePath = "/tmp/" + file.name;
//         fs.renameSync(file.path, zipfilePath, (err) => { if (err) console.log('ERROR: ' + err) });
//         console.log("received backup file " + file.name);
//         try {
//             validateZipFile(zipfilePath);

//             // delete existing data folder (if it exists)
//             fs.rmSync("/.stader/data", { recursive: true, force: true /* ignore if not exists */ });

//             // unzip
//             const zip = new AdmZip(zipfilePath);
//             zip.extractAllTo("/.stader/", /*overwrite*/ true);

//             res.send({
//                 code: 200,
//                 message: "Successfully uploaded the Stader backup. Click restart to complete the restore.",
//             });
//             return next();
//         } catch (e) {
//             console.dir(e);
//             console.log(e);
//             res.send({
//                 code: 400,
//                 message: e.message,
//             });
//             return next();
//         }
//     }

//     function validateZipFile(zipfilePath) {
//         console.log("Validating " + zipfilePath);
//         const zip = new AdmZip(zipfilePath);
//         const zipEntries = zip.getEntries();

//         checkFileExistsInZipFile(zipEntries, "data/password")
//         checkFileExistsInZipFile(zipEntries, "data/mnemonic")
//         checkFileExistsInZipFile(zipEntries, "data/wallet")
//         checkFileExistsInZipFile(zipEntries, "data/validators/prysm-non-hd/direct/accounts/all-accounts.keystore.json")
//         checkFileExistsInZipFile(zipEntries, "data/validators/prysm-non-hd/direct/accounts/secret")
//         checkFileExistsInZipFile(zipEntries, "data/validators/prysm-non-hd/direct/keymanageropts.json")
//     }

//     function checkFileExistsInZipFile(zipEntries, expectedPath) {
//         const containsFile = zipEntries.some((entry) => entry.entryName == expectedPath);
//         if (!containsFile)
//             throw {message:`Invalid backup file. The zip file must contain "${expectedPath}"`}
//     }
// });

// // server.get("/runningValidatorInfos", async (req: restify.Request, res: restify.Response, next: restify.Next) => {
// //     const clients = (await getInstalledBCClients())
// //     if (clients.length == 0 || clients[0].name !== "teku") {
// //         res.send(500, "Missing or unsupported Beacon chain client");
// //         return next()
// //     }

// //     const keymanagerUrl = clients[0].validatorAPI;
// //     const restApiUrl = clients[0].validatorAPI.replace("keymanager", "rest");
// //     console.log(`fetching ${keymanagerUrl}`);
// //     const fetchFromKeyManager = async (path: string): Promise<any[]> => JSON.parse(await (await fetch(`${keymanagerUrl}${path}`)).text()).data
// //     // const restApiUrl = `http://teku-prater.my.ava.do:9999/rest`
// //     console.log(`fetching ${restApiUrl}`);
// //     const fetchFromRestAPi = async (path: string): Promise<any[]> => JSON.parse(await (await fetch(`${restApiUrl}${path}`)).text()).data

// //     const validators = (await fetchFromKeyManager("/eth/v1/keystores")).map((v: any) => v.validating_pubkey)
// //     const getValidatorData = async (pubKey: string) => await fetchFromRestAPi(`/eth/v1/beacon/states/head/validators/${pubKey}`)
// //     const getFeeRecipient = async (pubKey: string) => await fetchFromKeyManager(`/eth/v1/validator/${pubKey}/feerecipient`)

// //     const result = await Promise.all(validators.map(async (pubkey: string) => {
// //         const data = await getValidatorData(pubkey)
// //         const recipient = await getFeeRecipient(pubkey)
// //         return { pubkey: pubkey, data: data, recipient: recipient }
// //     }))

// //     res.send(200, result);
// //     next()
// // });

// // get keyStoreFile
// const getValidatorKeystore = (pubkey: string) => {
//     try {
//         return fs.readFileSync(`/.stader/data/validators/teku/keys/${pubkey}.json`, 'utf8').trim();
//     } catch (err) {
//         console.error(err);
//     }
// }

// const getValidatorPassword = (pubkey: string) => {
//     try {
//         return fs.readFileSync(`/.stader/data/validators/teku/passwords/${pubkey}.txt`, 'utf8').trim();
//     } catch (err) {
//         console.error(err);
//     }
// }

// server.post("/importValidator", async (req: restify.Request, res: restify.Response, next: restify.Next) => {
//     if (!req.body) {
//         res.send(400, "not enough parameters");
//         return next();
//     } else {
//         const pubkey = req.body.pubkey

//         console.log(`Importing validator ${pubkey}`)

//         // create message
//         const message = {
//             keystores: [getValidatorKeystore(pubkey)],
//             passwords: [getValidatorPassword(pubkey)]
//         }

//         const clients = (await getInstalledBCClients())
//         if (clients.length == 0 || clients[0].name !== "teku") {
//             res.send(500, "Missing or unsupported Beacon chain client");
//             return next()
//         }

//         const keymanagerUrl = `${clients[0].validatorAPI}/eth/v1/keystores`;
//         postToKeyManager(keymanagerUrl, JSON.stringify(message), res, next);

//     }
// });

// server.get("/getFeeRecipient", (req: restify.Request, res: restify.Response, next: restify.Next) => {
//     try {
//         const result = fs.readFileSync(`/.stader/data/validators/stader-fee-recipient.txt`, 'utf8').trim();
//         res.send(200, result);
//         return next()
//     } catch (err) {
//         console.error(err);
//         res.send(400, err);
//         return next();
//     }
// })

// server.get("/transactions", (req: restify.Request, res: restify.Response, next: restify.Next) => {
//     try {
//         const result = JSON.parse(fs.readFileSync(`/.stader/data/transactions.json`, 'utf8'))
//         res.send(200, result);
//         return next()
//     } catch (err) {
//         const result = { transactions: [] }
//         res.send(200, result);
//         return next()
//     }
// })

// server.get("/sdprice", (req: restify.Request, res: restify.Response, next: restify.Next) => {
//     const price = cache.get("sdprice");
//     if (price) {
//         console.log(`SD/ETH price is cached ${price}`);
//         res.send(200, price);
//         return next();
//     } else {
//         fetch("https://api.coingecko.com/api/v3/simple/price?ids=stader&vs_currencies=eth", {
//             method: 'GET'
//         }).then(async (r) => {
//             const result = await r.json();
//             console.log(`SD/ETH price is currently ${result.stader.eth}`);
//             cache.put("sdprice", result.stader.eth, 1000 * 60 * 5) // cache 5 mins
//             res.send(200, result.stader.eth);
//             return next();
//         }).catch(e => {
//             console.log(e);
//             res.send(500, e);
//             return next();
//         });
//     }
// });


// server.post("/setFeeRecipient", async (req: restify.Request, res: restify.Response, next: restify.Next) => {
//     if (!req.body) {
//         res.send(400, "not enough parameters");
//         return next();
//     } else {
//         const pubKey = req.body.pubkey
//         const feeRecipientAddress = req.body.feeRecipientAddress

//         console.log(`Setting fee recipient for ${pubKey} to ${feeRecipientAddress}`)

//         const message = {
//             "ethaddress": feeRecipientAddress
//         }

//         const clients = (await getInstalledBCClients())
//         if (clients.length == 0 || clients[0].name !== "teku") {
//             res.send(500, "Missing or unsupported Beacon chain client");
//             return next()
//         }

//         const keymanagerUrl = `${clients[0].validatorAPI}/eth/v1/validator/${pubKey}/feerecipient`;
//         postToKeyManager(keymanagerUrl, JSON.stringify(message), res, next);
//     }
// });

// function postToKeyManager(keymanagerUrl: string, body: string, res: restify.Response, next: restify.Next) {
//     console.log(`postToKeyManager: posting to ${keymanagerUrl}`);
//     console.log(`body: ${JSON.stringify(JSON.parse(body), null, 2)}`)
//     fetch(keymanagerUrl, {
//         method: 'POST',
//         headers: { 'content-type': 'application/json;charset=UTF-8' },
//         body: body,
//     }).then(async (r) => {
//         const result = await r.text();
//         console.log("postToKeyManager result: ", result);
//         res.send(200, result);
//         return next();
//     }).catch(e => {
//         console.log("postToKeyManager error: ", e);
//         res.send(500, e);
//         return next();
//     });
// }


let checkConfigRunning = false;
let configResult: object = {
    checklist: [{
        status: "nok",
        description: "Wating for configuration to be checked"
    }],
    globalStatus: false
};


server.get("/checklist", async (req: restify.Request, res: restify.Response, next: restify.Next) => {
    res.send(200, configResult);
    next();
})

const checkConfig = async () => {

    let globalStatusOK = true;

    try {
        if (checkConfigRunning) return;
        checkConfigRunning = true;
        let configResultList = [];

        console.log("---Checking config");
        const clients = await getPackages()
        console.log("Installed clients", clients);

        if (clients.includes("mevboost.avado.dnp.dappnode.eth")) {
            configResultList.push({
                status: "ok",
                description: "MEV-boost package is installed"
            })
        } else {
            configResultList.push({
                status: "nok",
                description: "MEV-boost package is not installed"
            });
            globalStatusOK = false;
        }

        if (clients.includes("avado-dnp-nethermind.public.dappnode.eth")) {
            configResultList.push({
                status: "ok",
                description: "Nethermind package is installed"
            })
        } else {
            configResultList.push({
                status: "nok",
                description: "Nethermind package is not installed"
            });
            globalStatusOK = false;
        }

        if (clients.includes("teku.avado.dnp.dappnode.eth")) {
            configResultList.push({
                status: "ok",
                description: "Teku package is installed"
            })
        } else {
            configResultList.push({
                status: "nok",
                description: "Teku package is not installed"
            });
            globalStatusOK = false;
        }

        let envs = await getEnvs("mevboost.avado.dnp.dappnode.eth");

        if (!envs) {
            configResultList.push({
                status: "nok",
                description: "MEVBoost RELAYS cannot be read (is MEVBoost installed?)"
            });
            globalStatusOK = false;
        } else {
            if (envs.RELAYS !== server_config.mev_relays) {
                console.log(`setting correct RELAYS for MEVboost : ${server_config.mev_relays}`)
                await writeEnv("mevboost.avado.dnp.dappnode.eth", "RELAYS", server_config.mev_relays)
            }

            if (envs.EXTRA_OPTS !== server_config.mev_extra_opts) {
                console.log(`setting correct EXTRA_OPTS for MEVboost : ${server_config.mev_extra_opts}`)
                await writeEnv("mevboost.avado.dnp.dappnode.eth", "EXTRA_OPTS", server_config.mev_extra_opts)
            }

            // check again
            envs = await getEnvs("mevboost.avado.dnp.dappnode.eth");

            if (envs.RELAYS !== server_config.mev_relays) {
                configResultList.push({
                    status: "nok",
                    description: "MEVBoost RELAYS are not correctly configured"
                });
                globalStatusOK = false;
            } else {
                console.log("RELAY settings for MEVBoost are correct")
                console.log(envs.RELAYS);
                configResultList.push({
                    status: "ok",
                    description: "RELAY settings for MEVBoost are correct"
                });
            }

            if (envs.EXTRA_OPTS !== server_config.mev_extra_opts) {
                configResultList.push({
                    status: "nok",
                    description: "MEVBoost EXTRA_OPTS are not correctly configured"
                });
                globalStatusOK = false;
            } else {
                console.log("EXTRA_OPTS settings for MEVBoost are correct")
                console.log(envs.EXTRA_OPTS);
                configResultList.push({
                    status: "ok",
                    description: "EXTRA_OPTS settings for MEVBoost are correct"
                });
            }

        }
        configResult = { checklist: configResultList, globalStatus: globalStatusOK }
        return;

    } catch (e) {
        console.log("-- invalid config");
        // await Promise.all([
        //     supervisorCtl.callMethod('supervisor.stopProcess', ["ssvnode", true]),
        // ])
        configResult = { checklist: configResult, globalStatus: globalStatusOK }

    } finally {
        console.log("-- finished checkConfig");
        checkConfigRunning = false;
    }
}


// Schedule a task to run every minute
cron.schedule('42 * * * *', async () => {
    console.log("CRON checkconfig started");
    await checkConfig();
});


server.listen(9999, function () {
    console.log("%s listening at %s", server.name, server.url);
    // supervisorCtl.callMethod("supervisor.getState", []).then((value: any) => {
    //     console.log("supervisor", value.statename)
    // })
});