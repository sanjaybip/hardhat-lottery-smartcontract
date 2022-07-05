import { run } from "hardhat";
export const verify = async (contractAddress: string, args: any[]) => {
    console.log(`---------------------------`);
    console.log(`Verifying Contracts`);

    try {
        await run("verify:verify", {
            address: contractAddress,
            constructorArguments: args,
        });
    } catch (e: any) {
        if (e.message.toLowerCase().includes("already verified")) {
            console.log(`Already Verified!`);
        } else {
            console.log(e);
        }
    }
};
