import { server_config } from "./server_config";
import { Server, Request, Response, Next } from 'restify';
import * as YAML from 'js-yaml';
import fs from 'fs';

export module SSV {

  export const getConfig = async (): Promise<any> => {
    try {
      console.log("getConfig: reading config file",server_config.config_file_path);
      const config = await YAML.load(fs.readFileSync(server_config.config_file_path, 'utf8'))
      console.log("config read:", config)
      return typeof config === 'object' && config !== null ? config : {};
    } catch (e) {
      console.log("Error reading SSV config", e)
      return {};
    }
  }

  export const getKeyFile = async (): Promise<any> => {
    try {
      const config = JSON.parse(await fs.readFileSync(server_config.private_key_file, 'utf8'))
      return config ? config : {}
    } catch (e) {
      return {};
    }
  }

  export function attach(server: Server) {

    // Attach the "/network" route to the server
    server.get("/ssvnetwork", (req: Request, res: Response, next: Next) => {
      res.send(200, { data: server_config.network });
      next();
    });

    // server.get("/network", (req: Request, res: Response, next: Next) => {
    //   res.send(200, { "data": server_config.network });
    //   next();
    // });

    server.get("/isRegistered", async (req: Request, res: Response, next: Next) => {
      const config = await getConfig();
      res.send(200, { "data": config.isRegistered });
      next();
    });

    server.get("/operatorPublicKey", async (req: Request, res: Response, next: Next) => {
      const config = await getKeyFile();
      const key = config.publicKey;
      res.send(200, { "data": key });
      next()
    });


  }

}