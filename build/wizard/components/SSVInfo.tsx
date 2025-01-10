import {
  useOperatorByPubKey,
  useValidatorsByOperatorId,
} from "../hooks/read/useSSVAPI";

export const SSVInfo = ({
  operatorPubKey,
  network,
}: {
  operatorPubKey: string;
  network: string;
}) => {
  const { data: operatorData, isLoading: isLoadingOperatorId } =
    useOperatorByPubKey(operatorPubKey, network);
  const { data: validators, isLoading: isLoadingValidators } =
    useValidatorsByOperatorId(operatorData?.data?.id, network);

  if (!operatorPubKey) {
    return null;
  }

  if (isLoadingValidators || isLoadingOperatorId) {
    return (
      <div className="bg-white sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="flex text-base font-semibold leading-6 text-gray-900">
            <span>Assigned validators</span>
            <span className="ml-auto inline-flex flex-shrink-0 items-center rounded-full bg-grey-50 px-1.5 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
              Loading...
            </span>
          </h3>
        </div>
      </div>
    );
  }

  if (!validators?.validators) {
    return (
      <div className="bg-white sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="flex text-base font-semibold leading-6 text-gray-900">
            <span>Assigned validators</span>
          </h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>No validators assigned to your node yet</p>
          </div>
        </div>
      </div>
    );
  }

  const bcURL = `https://beaconcha.in/dashboard?validators=${validators?.validators
    ?.map((v: any) => `0x${v.public_key}`)
    .join(",")}#validators-table`;

  return (
    <div className="bg-white sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="flex text-base font-semibold leading-6 text-gray-900">
          <span>Assigned validators</span>
        </h3>
        <div className="mt-2 max-w-xl text-sm text-gray-500">
          <p>Total: {validators.pagination.total}</p>
          <br />
          {validators?.validators?.map((validator: any, i: number) => {
            return (
              <span
                key={`validator-${i}`}
                className="ml-auto inline-flex flex-shrink-0 items-center rounded-full bg-green-50 
                px-1.5 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20 mr-2"
              >
                {`0x${validator.public_key.slice(0, 5)}...`}
              </span>
            );
          })}
        </div>

        <div className="mt-5">
          <a
            href={bcURL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
          >
            Show on Beacon Chain
          </a>
        </div>
      </div>
    </div>
  );
};
