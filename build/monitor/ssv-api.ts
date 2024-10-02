import { server_config } from "./server_config";
import { Server, Request, Response, Next } from 'restify';
import * as YAML from 'js-yaml';
import fs from 'fs';
import axios from 'axios';

export module SSVAPI {


  const get = async (url: string, res: Response, next: Next) => {
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

  // export const getConfig = async (): Promise<any> => {
  //   try {
  //     const config = await YAML.load(fs.readFileSync(server_config.config_file_path, 'utf8'))
  //     console.log("config", config)
  //     return typeof config === 'object' && config !== null ? config : {};
  //   } catch (e) {
  //     console.log("Error reading SSV config", e)
  //     return {};
  //   }
  // }

  // const getKeyFile = async (): Promise<any> => {
  //   try {
  //     const config = JSON.parse(await fs.readFileSync(server_config.private_key_file, 'utf8'))
  //     return config ? config : {}
  //   } catch (e) {
  //     return {};
  //   }
  // }

  export function attach(server: Server) {

    server.get("/operators/:id", async (req: Request, res: Response, next: Next) => {
      const id = req.params.id;
      if (id) {
        const url = `https://api.ssv.network/api/v4/${server_config.network}/operators/${id}`
        if (server_config.dev)
          console.log(url)
        get(url, res, next)
      }
    });

    server.get("/operators/owned_by/:address", async (req: Request, res: Response, next: Next) => {
      const address = req.params.address;
      if (address) {
        const url = `https://api.ssv.network/api/v4/${server_config.network}/operators/owned_by/${address}`
        if (server_config.dev)
          console.log(url)
        get(url, res, next)
      }
    });

    server.get("/validators/in_operator/:id", async (req: Request, res: Response, next: Next) => {
      const id = req.params.id;
      if (id) {
        const url = `https://api.ssv.network/api/v4/${server_config.network}/validators/in_operator/${id}`
        if (server_config.dev)
          console.log(url)
        get(url, res, next)
      }
    });

    server.get("/operators/public_key/:pubkey", async (req: Request, res: Response, next: Next) => {
      const pubkey = req.params.pubkey;
      if (pubkey) {
        const url = `https://api.ssv.network/api/v4/${server_config.network}/operators/public_key/${pubkey}`
        if (server_config.dev)
          console.log(url)
        get(url, res, next)
      }
    });



  }

}