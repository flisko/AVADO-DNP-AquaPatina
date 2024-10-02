import styles from '../styles/Home.module.css';
import Web3 from 'web3';

const web3 = new Web3();

export const SsvButtons = ({ operatorId }: { operatorId: bigint }) => {
    return (
        <div>
            <a href={`https://app.ssv.network/`} className="">Manage operator on SSV dapp</a><br/>
            <a href={`https://explorer.ssv.network/operators/${operatorId}`} className="" >View operator on SSV Explorer</a>
        </div>
    );
};


