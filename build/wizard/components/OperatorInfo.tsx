// import CopyToClipboard from 'react-copy-to-clipboard';
import { useOperatorByPubKey, useOperatorById } from '../hooks/read/useSSVAPI';
import { useState } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'

interface ShortenTextProps extends React.HTMLAttributes<HTMLSpanElement> {
    text: string;
}

const ShortenText: React.FC<ShortenTextProps> = ({ text, ...rest }) => {
    if (!text) return null;
    const length = 6;
    if (text.length <= 2 * length) {
        return <span {...rest}>{text}</span>;
    }
    const firstPart = text.substring(0, length);
    const lastPart = text.substring(text.length - length);
    return <span {...rest}>{firstPart}...{lastPart}</span>;
};

function TextDialog({ text }: { text: string }) {
    const [open, setOpen] = useState(false)

    return (
        <>
            <ShortenText className="underline" onClick={() => setOpen(true)} text={text} />
            {open && (
                <Dialog open={open} onClose={setOpen} className="relative z-10">
                    <DialogBackdrop
                        transition
                        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in"
                    />

                    <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                            <DialogPanel
                                transition
                                className="relative transform overflow-hidden rounded-lg bg-white px-6 pb-6 pt-6 text-left shadow-xl transition-all data-[closed]:translate-y-4 data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in sm:my-8 sm:w-full sm:max-w-lg sm:p-8 data-[closed]:sm:translate-y-0 data-[closed]:sm:scale-95"
                            >
                                <div>
                                    <div className="mt-3 text-center sm:mt-5">
                                        <DialogTitle as="h3" className="text-base font-semibold leading-6 text-gray-900">
                                            Your operator public key
                                        </DialogTitle>

                                        <div className="mt-2">
                                            <pre className="break-words whitespace-normal">{text}</pre>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-5 sm:mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setOpen(false)}
                                        className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                                    >
                                        Close
                                    </button>
                                </div>
                            </DialogPanel>
                        </div>
                    </div>
                </Dialog>
            )}
        </>
    )
}



export const OperatorInfo = ({ operatorPubKey, network }: { operatorPubKey: string, network: string }) => {
    const { data: operatorData, isLoading: isLoadingOperatorId } = useOperatorByPubKey(operatorPubKey, network);
    const { data: operatorDetails, isLoading: isLoadingOperatorDetails } = useOperatorById(operatorData?.data?.id, network);

    if (isLoadingOperatorDetails || isLoadingOperatorId) {
        return (
            <div className="bg-white sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                    <h3 className="flex text-base font-semibold leading-6 text-gray-900">
                        <span>SSV Operator health check</span>
                        <span className="ml-auto inline-flex flex-shrink-0 items-center rounded-full bg-grey-50 px-1.5 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
                            Loading...
                        </span>
                    </h3>
                </div>
            </div>
        );
    }


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
                            <TextDialog text={operatorPubKey} />
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
                                                    {/* <div className="">
                                                        <ShortenText text={operatorPubKey} />
                                                        <CopyToClipboard text={operatorPubKey}>
                                                            <><DocumentDuplicateIcon className="h-3 w-3" /> </>
                                                        </CopyToClipboard>
                                                    </div> */}
                                                    <TextDialog text={operatorPubKey} />
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

