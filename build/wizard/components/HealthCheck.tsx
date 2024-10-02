
import { useChecklist } from '../hooks/read/useMonitor';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/solid';

type ChecklistItem = {
  status: string;
  description: string;
};

type Checklist = {
  checklist: ChecklistItem[];
  globalStatus: boolean;
};

export const HealthCheck = () => {
  const { data, error, isLoading } = useChecklist() as { data: Checklist, error: any, isLoading: boolean };;
  if (error) {
    return (<div>Loading error: {error}</div>)
  }
  if (isLoading) {
    return (<div>Loading...</div>)
  }
  return (
    <>

      <div className="bg-white sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="flex text-base font-semibold leading-6 text-gray-900">
            <span>AVADO setup health-check</span>
            {(data.globalStatus ? (
              <span className="ml-auto inline-flex flex-shrink-0 items-center rounded-full bg-green-50 px-1.5 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                OK
              </span>
            ) : (
              <span className="ml-auto inline-flex flex-shrink-0 items-center rounded-full bg-red-50 px-1.5 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
                Not OK
              </span>
            ))}

          </h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <ul role="list" className="divide-y divide-gray-100">
              {data.checklist?.map((checklistitem, i) => (
                <li key={`checklistitem_${i}`} className="flex justify-between gap-x-6">
                  <div className="flex min-w-0 gap-x-4">
                    {(checklistitem.status === "ok") ? (
                      <CheckCircleIcon className="h-6 w-6 text-green-500" />
                    ) : (
                      <ExclamationCircleIcon className="h-6 w-6 text-red-500" />
                    )}

                    {/* <img alt="" src={checklistitem.imageUrl} className="h-12 w-12 flex-none rounded-full bg-gray-50" /> */}
                    <div className="min-w-0 flex-auto">
                      <p className="text-sm font-semibold leading-6 text-gray-900">{checklistitem.description}</p>
                    </div>
                  </div>
                </li>

              ))}
            </ul >
          </div>

        </div>
      </div>


    </>
  )
}


