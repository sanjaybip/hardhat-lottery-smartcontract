import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import fs from "fs";
import { frontEndContractsFile, frontEndAbiFile } from "../helper-hardhat-config";

const updateUI: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { network, ethers } = hre;
    if (process.env.UPDATE_FRONT_END) {
        console.log("Writing to front end...");

        //Updating Contract Address on front end JSON file.
        const raffle = await ethers.getContract("Raffle");
        const contractAddresses = JSON.parse(fs.readFileSync(frontEndContractsFile, "utf8")); //reading current data
        const chainId = network.config.chainId!.toString(); //getting chainId from hardhat config
        if (chainId in contractAddresses) {
            if (!contractAddresses[chainId].includes(raffle.address)) {
                contractAddresses[chainId].push(raffle.address);
            }
        } else {
            contractAddresses[chainId] = [raffle.address];
        }
        fs.writeFileSync(frontEndContractsFile, JSON.stringify(contractAddresses)); // finally writing the new addressess.

        //Updating ABI on front end JSON file
        fs.writeFileSync(
            frontEndAbiFile,
            raffle.interface.format(ethers.utils.FormatTypes.json) as string
        );
    }
};

export default updateUI;
updateUI.tags = ["all", "frontend"];
