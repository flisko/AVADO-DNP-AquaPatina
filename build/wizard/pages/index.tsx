import type { NextPage } from 'next';
import { OperatorInfo } from '../components/OperatorInfo';
import { useNetwork, useOperatorPublicKey } from '../hooks/read/useMonitor';
import { DownloadBackup } from '../components/DownloadBackup';
import { SSVInfo } from '../components/SSVInfo';
import { HealthCheck } from '../components/HealthCheck';
import { server_config } from "../config"

const Home: NextPage = () => {

  const { data: operatorPubKey, error: pubkey_error, isLoading: isLoadingPubKey } = useOperatorPublicKey();
  const { data: network, error: network_error, isLoading: isLoadingNetwork } = useNetwork();

  // console.log("operatorPubKey", operatorPubKey?.data)
  // console.log("network", network?.data)

  if (isLoadingPubKey || isLoadingNetwork) {
    return (
      <div>Loading...</div>
    )
  }

  if (pubkey_error || network_error) {
    return (
      <>
        <div>SSV api unavailable</div>
      </>
    )
  }

  return (
    // <div className={styles.container}>
    //   <Head>
    //     <title>Avado SSV</title>
    //     <meta
    //       name="Avado SSV package"
    //     />
    //     <link rel="icon" href="/favicon.ico" />
    //   </Head>

    //   <main className={styles.main}>
    <div className="min-h-full">


      <div className="py-10">
        <header>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900">{server_config.title} Operator Dashboard</h1>
          </div>
        </header>
        <main>
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

            {operatorPubKey && network && (
              <>
                <ul role="list" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
                  <li className="col-span-1 divide-y divide-gray-200 rounded-lg bg-white shadow">
                    <HealthCheck />
                  </li>
                  <li className="col-span-1 divide-y divide-gray-200 rounded-lg bg-white shadow">
                    <OperatorInfo operatorPubKey={operatorPubKey.data} network={network.data} />
                  </li>
                  <li className="col-span-1 divide-y divide-gray-200 rounded-lg bg-white shadow">
                    <DownloadBackup />
                  </li>
                  <li className="col-span-1 divide-y divide-gray-200 rounded-lg bg-white shadow">
                    <SSVInfo operatorPubKey={operatorPubKey.data} network={network.data} />
                  </li>


                </ul>
              </>
            )}



          </div>
        </main>
      </div>

    </div>

    //   <footer className={styles.footer}>
    //     <a href="http://my.ava.do/#/Packages/ssv.avado.dappnode.eth/detail">Logs</a>
    //     <br />
    //     <a href="https://ava.do" target="_blank" rel="noopener noreferrer">
    //       Made with ❤️ by your frens at Avado
    //     </a>
    //   </footer>
    // </div>
  );
};

export default Home;
