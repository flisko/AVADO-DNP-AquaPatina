export type OperatorType = {
    "id": number,
    "id_str": string,
    "declared_fee": number,
    "previous_fee": number,
    "fee": number,
    "name": string,
    "public_key": string,
    "owner_address": string,
    "address": string,
    // "location": "",
    // "setup_provider": "",
    // "eth1_node_client": "",
    // "eth2_node_client": "",
    // "description": "",
    // "website_url": "",
    // "twitter_url": "",
    // "linkedin_url": "",
    // "logo": "",
    // "type": "operator",
    "performance": {
        "24h": number,
        "30d": number
    },
    // "is_valid": true,
    // "is_deleted": false,
    // "is_active": 0,
    // "status": "Inactive",
    "validators_count": number
}

export type ValidatorType = {
    "public_key": string,
    "owner_address": string,
    "status": string,
    "operators": OperatorType[],
    "validator_info": {
        "index": number,
        "status": string,
        "activation_epoch": number
    }
}
