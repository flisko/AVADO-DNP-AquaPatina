import useSWR from "swr";
import axios from "axios";
import { OperatorType, ValidatorType } from "../types";
import { server_config } from "../config"

function get(api_url: string) {
    const fetcher = async (url: string) => await axios.get(url).then((res) => res.data);
    const { data, error } = useSWR(api_url, fetcher);
    return { data: data?.data, error: error };
}

export function useOperatorOwnedBy({
    address,
}: {
    address?: string,
}) {
    const api_url: string = `${server_config.monitor_url}/operators/owned_by/${address}`;
    const { data, error } = get(api_url)
    return { data: data?.operators[0] as OperatorType, error: error };
}

export function useValidatorsInOperator({
    operatorId,
}: {
    operatorId?: bigint,
}) {
    const api_url: string = `${server_config.monitor_url}/validators/in_operator/${operatorId}`;
    const { data, error } = get(api_url)
    return { data: data?.validators as ValidatorType[], error: error };
}

export function useOperatorStatus({
    operatorId,
}: {
    operatorId?: bigint,
}) {
    const api_url: string = `${server_config.monitor_url}/operators/${operatorId}`;
    const { data, error } = get(api_url)
    return { data: data as OperatorType, error: error };
}

export function useOperatorPublicKey() {
    const api_url: string = `${server_config.monitor_url}/operatorPublicKey`;
    const { data, error } = get(api_url)
    return { data: data as string, error: error };
}

export function isRegistered() {
    const api_url: string = `${server_config.monitor_url}/isRegistered`;
    return get(api_url);
}

export function useOperatorId() {
    const api_url: string = `${server_config.monitor_url}/operatorId`;
    const { data, error } = get(api_url)
    if (error)
        console.log(error)
    // console.log(data)
    const operatorId = data ? BigInt(data) : undefined
    return { data: operatorId, error: error };
}

export function useBeaconNodeStatus() {
    const api_url: string = `${server_config.monitor_url}/beaconNodeStatus`;
    const { data, error } = get(api_url)
    if (error)
        console.log(error)
    return { data: data, error: error };
}
