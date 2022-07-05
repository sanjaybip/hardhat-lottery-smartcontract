import { getNamedAccounts, deployments, network, ethers } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const BASE_FEE = ethers.utils.parseEther("0.25"); //Chianlink cost 0.25 Link to perform task
const GAS_PRICE_LINK = 1e9; // Link per gas // 0.000000001 LINK per gas
const deployMock: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, network, ethers } = hre;
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId;

    if (chainId == 31337) {
        console.log(`Localnetwork detected. Deploying mocks...`);
        //Deploy VRFCoordinatorV2
        await deploy("VRFCoordinatorV2Mock", {
            from: deployer,
            log: true,
            args: [BASE_FEE, GAS_PRICE_LINK],
            waitConfirmations: 1,
        });
        console.log(`Mock deployed..`);
        console.log(`-----------------------`);
    }
};
export default deployMock;
deployMock.tags = ["all", "mocks"];
