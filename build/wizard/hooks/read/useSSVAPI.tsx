import axios from "axios";
import useSWR from "swr";
import { server_config } from "../../config";

function get(api_url: string) {
    console.log("API_URL", api_url);
    const fetcher = async (url: string) => await axios.get(url).then((res) => res.data);
    const { data, error } = useSWR(api_url, fetcher);
    return { data: data, error: error };
}


export function useOperatorByPubKey(pubkey: string, network: string) {
    const api_url = `${server_config.ssv_api_url}/${network}/operators/public_key/${pubkey}`
    const { data, error } = get(api_url);
    return { data, error }
}

export function useOperatorById(Id: string, network: string) {
    const api_url = `${server_config.ssv_api_url}/${network}/operators/${Id}`
    const { data, error } = get(api_url);
    return { data, error }
}


