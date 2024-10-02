// import CopyToClipboard from 'react-copy-to-clipboard';
import { useOperatorByPubKey, useOperatorById } from '../hooks/read/useSSVAPI';
import { SsvButtons } from './SsvButtons';
import { DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
interface ShortenTextProps extends React.HTMLAttributes<HTMLSpanElement> {
    text: string;
}

const ShortenText: React.FC<ShortenTextProps> = ({ text, ...rest }) => {
    const length = 6;
    if (text.length <= 2 * length) {
        return <span {...rest}>{text}</span>;
    }
    const firstPart = text.substring(0, length);
    const lastPart = text.substring(text.length - length);
    return <span {...rest}>{firstPart}...{lastPart}</span>;
};

interface CopyToClipboardProps {
    text: string;
    children: React.ReactNode;
}

const CopyToClipboard: React.FC<CopyToClipboardProps> = ({ text, children }) => {
    const [isCopied, setIsCopied] = useState<boolean>(false);

    const copyToClipboard = async (): Promise<void> => {
        try {
            await navigator.clipboard.writeText(text);
            setIsCopied(true);
            setTimeout(() => {
                setIsCopied(false);
            }, 1000);
        } catch (err) {
            console.error("Failed to copy: ", err);
        }
    };

    return (
        <button onClick={copyToClipboard}>
            {isCopied ? "Copied!" : children}
        </button>
    );
};




export const OperatorInfo = ({ operatorPubKey, network }: { operatorPubKey: string, network: string }) => {
    const { data: operatorData } = useOperatorByPubKey(operatorPubKey, network);
    const { data: operatorDetails } = useOperatorById(operatorData?.data?.id, network);
    const [copiedText, setCopiedText] = useState<string>("++");

    if (!operatorData || !operatorDetails) {
        return (
            <div className="bg-white sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                    <h3 className="flex text-base font-semibold leading-6 text-gray-900">
                        <span>SSV Operator health check</span>
                        <span className="ml-auto inline-flex flex-shrink-0 items-center rounded-full bg-red-50 px-1.5 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
                            Not OK
                        </span>

                    </h3>
                    <div className="mt-2 max-w-xl text-sm text-gray-500">
                        <p>
                            Please go to the <a href="https://app.ssv.network/my-account/operators-dashboard">SSV account page</a> to register your operator
                        </p>

                        <p>Your operator pubKey is:
                            <div className="">
                                <ShortenText text={operatorPubKey} />
                                <CopyToClipboard text={operatorPubKey}>
                                    <><DocumentDuplicateIcon className="h-3 w-3" /> </>
                                </CopyToClipboard>
                            </div>
                        </p>
                    </div>
                    <div className="mt-5">
                        <a
                            href="https://app.ssv.network/my-account/operators-dashboard"
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                        >
                            Register operator
                        </a>
                    </div>
                </div>
            </div>

            // <>
            //     <div className="px-4 sm:px-0">
            //         <div className="m-1">
            //             <h3 className="text-base flex font-semibold leading-7 text-gray-900">
            //                 <span>SSV operator health-check</span>
            //                 <span className="ml-auto inline-flex flex-shrink-0 items-center rounded-full bg-red-50 px-1.5 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
            //                     Not OK
            //                 </span>
            //             </h3>
            //         </div>
            //     </div>
            //     <div className="m-1">
            //     </div>


            //     <div>Please go to the <a href="https://app.ssv.network/my-account/operators-dashboard">SSV account page</a> to register your operator</div>
            //     <p>Your operator pubKey is
            //         <ShortenText text={operatorPubKey} />
            //         <CopyToClipboard text={operatorPubKey}>
            //             <><DocumentDuplicateIcon className="h-6 w-6" /> </>
            //         </CopyToClipboard>
            //     </p>
            // </>

        )
    }

    return (


        <div className="bg-white sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
                <h3 className="flex text-base font-semibold leading-6 text-gray-900">
                    <span>SSV Operator health check</span>
                    <span className="ml-auto inline-flex flex-shrink-0 items-center rounded-full bg-green-50 px-1.5 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                        OK
                    </span>

                </h3>
                <div className="mt-2 max-w-xl text-sm text-gray-500">



                    <div className="mt-8 flow-root">
                        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                                    <table className="min-w-full divide-y divide-gray-300">
                                        {/* <thead className="bg-gray-50">
                                            <tr>
                                                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                                                    Name
                                                </th>
                                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                                    Title
                                                </th>
                                            </tr>
                                        </thead> */}
                                        <tbody className="divide-y divide-gray-200 bg-white">

                                            <tr>
                                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                                    Network
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{network}</td>
                                            </tr>
                                            <tr>
                                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                                    Operator Public Key
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    <div className="">
                                                        <ShortenText text={operatorPubKey} />
                                                        <CopyToClipboard text={operatorPubKey}>
                                                            <><DocumentDuplicateIcon className="h-3 w-3" /> </>
                                                        </CopyToClipboard>
                                                    </div>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                                    Operator ID
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    {JSON.stringify(operatorData.data.id, null, 2)}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>



                </div>
                <div className="mt-5">
                    <a
                        href="https://app.ssv.network/my-account/operators-dashboard"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                    >
                        Manage Operator
                    </a>
                </div>
            </div>
        </div>



        // <>
        //     <h2>Operator</h2>
        //     <textarea>{operatorPubKey}</textarea>
        //     <p>Network: {network}</p>
        //     <p>Operator ID:{JSON.stringify(operatorData.data.id, null, 2)}</p>
        //     <p>Name: {operatorDetails.setup_provider}</p>
        //     <p>Status: {operatorDetails.status}</p>
        //     <p>Validators count: {operatorDetails.validators_count}</p>
        //     <SsvButtons operatorId={operatorData.data.id} />

        // </>

    )

}

