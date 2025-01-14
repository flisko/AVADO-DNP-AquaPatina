const localdev = process.env.LOCALDEV || false;

const network = () => {
  var env_network = process.env.NETWORK ?? "mainnet";
  return env_network;
};

const packageName = () => {
  switch (network()) {
    case "mainnet":
      return "aquapatina-node.avado.dappnode.eth";
    default:
      return "aquapatina-node-holesky.avado.dappnode.eth";
  }
};

export const server_config = {
  network: network(),
  name: packageName(),
  https_options: {},
  packageName: packageName(),
  monitor_url: localdev
    ? "http://localhost:9999"
    : `http://${packageName()}:9999`,
  config_file_path: `/data/${network()}/config.yml`,
  private_key_file: `/data/${network()}/encrypted_private_key.json`,
  password_file: `/data/${network()}/password.txt`,
  db_path: `/data/${network()}/db`,
  dev: localdev,
  mev_relays:
    "https://0xac6e77dfe25ecd6110b8e780608cce0dab71fdd5ebea22a16c0205200f2f8e2e3ad3b71d3499c54ad14d6c21b41a37ae@boost-relay.flashbots.net,https://0x8b5d2e73e2a3a55c6c87b8b6eb92e0149a125c852751db1422fa951e42a09b82c142c3ea98d0d9930b056a3bc9896b8f@bloxroute.max-profit.blxrbdn.com,https://0xb3ee7afcf27f1f1259ac1787876318c6584ee353097a50ed84f51a1f21a323b3736f271a895c7ce918c038e4265918be@relay.edennetwork.io,https://0xa1559ace749633b997cb3fdacffb890aeebdb0f5a3b6aaa7eeeaf1a38af0a8fe88b9e4b1f61f236d2e64d95733327a62@relay.ultrasound.money,https://0xa15b52576bcbf1072f4a011c0f99f9fb6c66f3e1ff321f11f461d15e31b1cb359caa092c71bbded0bae5b5ea401aab7e@aestus.live,https://0x98650451ba02064f7b000f5768cf0cf4d4e492317d82871bdc87ef841a0743f69f0f1eea11168503240ac35d101c9135@mainnet-relay.securerpc.com,https://0xa7ab7a996c8584251c8f925da3170bdfd6ebc75d50f5ddc4050a6fdc77f2a3b5fce2cc750d0865e05d7228af97d69561@agnostic-relay.net,https://0x8c4ed5e24fe5c6ae21018437bde147693f68cda427cd1122cf20819c30eda7ed74f72dece09bb313f2a1855595ab677d@titanrelay.xyz,https://0x8c7d33605ecef85403f8b7289c8058f440cbb6bf72b055dfe2f3e2c6695b6a1ea5a9cd0eb3a7982927a463feb4c3dae2@relay.wenmerge.com",
  mev_extra_opts: "-min-bid 0.03",
};
