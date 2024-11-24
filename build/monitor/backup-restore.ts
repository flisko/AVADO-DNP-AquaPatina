
import { server_config } from "./server_config";
import { Server, Request, Response, Next } from 'restify';
import * as YAML from 'js-yaml';
import fs from 'fs';
import { SSV } from './ssv';
export module BackupRestore {


    export function attach(server: Server) {

        server.get("/getBackup", async (req: Request, res: Response, next: Next) => {
            const keyfile = await SSV.getKeyFile();
            const password = fs.readFileSync(server_config.password_file, 'utf8')
            const network = server_config.network;

            const backup = {
                keyfile, password, network
            }

            const jsonString = JSON.stringify(backup);

            // Set the headers to prompt a download in the browser
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="ssv-${network}-backup.json"`);
            res.setHeader('Content-Length', Buffer.byteLength(jsonString));

            // Send the JSON string as a response
            res.write(jsonString);
            res.end();

            return next();
        });

        server.post("/restoreBackup", (req: Request, res: Response, next: Next) => {
            if (!req.body || !req.body.backup) {
                res.send(400, "not enough parameters");
                return next();
            } else {
                const { keyfile, password, network } = JSON.parse(req.body.backup);
                if (network === server_config.network) {
                    console.log("Restoring configuration from a backup")
                    fs.writeFileSync(server_config.private_key_file, JSON.stringify(keyfile), 'utf8');
                    fs.writeFileSync(server_config.password_file, password, 'utf8');

                    // // Restart ssvnode
                    // console.log("Restarting SSVNode")
                    // const command = "supervisorctl restart ssvnode";
                    // exec(command, (error, stdout, stderr) => {
                    //     if (error) {
                    //         console.error(`exec error: ${error}`);
                    //         return;
                    //     }
                    //     if (stderr) {
                    //         console.error(`stderr: ${stderr}`);
                    //         return;
                    //     }
                    //     console.log(`stdout: ${stdout}`);
                    // });
                    const dir = server_config.db_path;

                    fs.rm(dir, { recursive: true, force: true }, err => {
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

    }
}