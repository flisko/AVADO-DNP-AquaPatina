import axios from "axios";
import useSWR from "swr";
import { server_config } from "../../config";

const fetcher = async (url: string) => await axios.get(url).then((res) => res.data);

function get(api_url: string) {
    console.log("API_URL", api_url);
    
    const { data, error } = useSWR(api_url, fetcher);
    return { data: data, error: error };
}


export function useOperatorByPubKey(pubkey: string, network: string) {
    const api_url = pubkey && `${server_config.ssv_api_url}/${network}/operators/public_key/${pubkey}`
    return useSWR(api_url,fetcher);
}

export function useOperatorById(Id: string, network: string) {
    const api_url = Id && `${server_config.ssv_api_url}/${network}/operators/${Id}`
    return useSWR(api_url,fetcher);
}

export function useValidatorsByOperatorId(Id: string, network: string) {
    const api_url = Id && `${server_config.ssv_api_url}/${network}/validators/in_operator/${Id}`
    return useSWR(api_url,fetcher);
}

