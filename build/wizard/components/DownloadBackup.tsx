import { server_config } from "../config"
import { useState } from 'react';
import { RestoreBackup } from '../components/RestoreBackup';
import { useNetwork } from "../hooks/read/useMonitor";

export const DownloadBackup = () => {
    const [showRestore, setShowRestore] = useState(false);
    const { data: network, error: network_error, isLoading: isLoadingNetwork } = useNetwork();
    return (

        <div className="bg-white sm:rounded-lg">
            {(!showRestore) ? (
                <div className="px-4 py-5 sm:p-6">
                    <h3 className="flex text-base font-semibold leading-6 text-gray-900">
                        <span>Backup Operator key</span>
                    </h3>
                    <div className="mt-2 max-w-xl text-sm text-gray-500">
                        <p>
                            It is important to have a backup of your Operator Key.
                            Whenever you need te re-install this package, you can use this backup to
                            restore this node in its old state.
                        </p>
                        <p>
                            <b>KEEP A BACKUP OF THIS FILE IN A SAFE LOCATION</b>
                        </p>
                    </div>
                    <div className="mt-5 flex justify-between w-full">
                        <a
                            href={`${server_config.monitor_url}/getBackup`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                        >
                            Download backup
                        </a>
                        <button
                            onClick={() => { setShowRestore(!showRestore) }}
                            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                        >
                            Restore Backup
                        </button>
                    </div>

                </div>
            ) : (


                <div className="px-4 py-5 sm:p-6">
                    <h3 className="flex text-base font-semibold leading-6 text-gray-900">
                        <span>Restore Operator key</span>
                        <button
                            onClick={() => { setShowRestore(!showRestore) }}
                            className="ml-auto inline-flex items-center rounded-md bg-indigo-600 px-2 py-1 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                        >
                            Go Back
                        </button>
                    </h3>

                    <div className="mt-5 flex justify-between w-full">

                        <RestoreBackup network={network?.data} />



                    </div>

                </div>

            )}
        </div>


    );
};


