import { deployments, getNamedAccounts, network, ethers } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { networkConfig, developmentChains } from "../helper-hardhat-config";
import { verify } from "../utils/verify";

const VRF_SUBS_FUND = ethers.utils.parseEther("1");
const deployRaffle: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, network, ethers } = hre;
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();

    //lets create constructor arugements for the smart contract constrcutor function.
    //for local network we need to mock the deployment of any dependent smart contracts.
    //for testnet/mainnet we need to use address of smart contract deployed at that net.
    const chainId = network.config.chainId;
    let vrfCoordinatorV2Address,
        subscriptionId,
        waitConfirmations = 1;
    if (chainId == 31337) {
        const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock");
        vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address;

        //creating subscription and funding for mock chainlink
        const transactipnResop = await vrfCoordinatorV2Mock.createSubscription();
        const transactipnReceipt = await transactipnResop.wait();
        subscriptionId = transactipnReceipt.events[0].args.subId;
        //funidng. Under some real network (testnet/mainnet) We have to fund the subscription with real `Link` token.
        await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, VRF_SUBS_FUND);
    } else {
        vrfCoordinatorV2Address = networkConfig[chainId!].vrfCoordinatorV2;
        subscriptionId = networkConfig[chainId!].subscriptionId;
        waitConfirmations = 4;
    }

    const args: any[] = [
        vrfCoordinatorV2Address,
        subscriptionId,
        networkConfig[chainId!].raffleEntranceFee,
        networkConfig[chainId!].gasLane,
        networkConfig[chainId!].callBackGasLimit,
        networkConfig[chainId!].keepersUpdateInterval,
    ];

    //deploying
    const raffle = await deploy("Raffle", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: waitConfirmations,
    });

    //verifying
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        await verify(raffle.address, args);
    }
};
export default deployRaffle;
deployRaffle.tags = ["all", "raffle"];
