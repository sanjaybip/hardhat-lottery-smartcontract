interface networkConfigItem {
    name: string;
    vrfCoordinatorV2?: string;
    raffleEntranceFee?: string;
    gasLane?: string;
    subscriptionId?: number;
    callBackGasLimit?: string;
    keepersUpdateInterval?: string;
}
interface networkConfigInfo {
    [key: number]: networkConfigItem;
}
const networkConfig: networkConfigInfo = {
    4: {
        name: "rinkeby",
        vrfCoordinatorV2: "0x6168499c0cffcacd319c818142124b7a15e857ab",
        raffleEntranceFee: "10000000000000000", // 0.01 ETH
        gasLane: "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc", //30 gwei
        subscriptionId: 7783,
        callBackGasLimit: "500000", // 500,000 gas
        keepersUpdateInterval: "30", // in seconds
    },
    31337: {
        name: "localhost",
        raffleEntranceFee: "10000000000000000", // 0.01 ETH
        gasLane: "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc", //30 gwei
        callBackGasLimit: "500000", // 500,000 gas
        keepersUpdateInterval: "30",
    },
};
const developmentChains = ["hardhat", "localhost"];

export { networkConfig, developmentChains };
