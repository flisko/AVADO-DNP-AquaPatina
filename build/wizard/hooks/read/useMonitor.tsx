import useSWR from "swr";
import { server_config } from "../../config"

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useOperatorPublicKey() {
    return useSWR(`${server_config.monitor_url}/operatorPublicKey`, fetcher);
}

export function useNetwork() {
    return useSWR(`${server_config.monitor_url}/network`, fetcher);
}

export function useChecklist() {
    return useSWR(`${server_config.monitor_url}/checklist`, fetcher);
}