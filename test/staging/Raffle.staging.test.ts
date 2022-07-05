import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { assert, expect } from "chai";
import { BigNumber } from "ethers";
import { ethers, network } from "hardhat";
import { developmentChains } from "../../helper-hardhat-config";
import { Raffle } from "../../typechain-types";

//run onlu on test/main net
developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle Staging Test", function () {
          let player: SignerWithAddress;
          let deployer: SignerWithAddress;
          let raffle: Raffle;
          let raffleEntranceFee: BigNumber;
          beforeEach(async () => {
              const accounts = await ethers.getSigners();
              deployer = accounts[0];
              player = accounts[1];

              raffle = await ethers.getContract("Raffle", deployer); //connecting account[0]/deployer with contract. We can use player account to using .connect(player). But make sure you have more signer on testnet.
              raffleEntranceFee = await raffle.getEnteranceFee();
          });
          describe("fulfillRandomWords", function () {
              it("works with live Chainlink Keepers and Chainlink VRF, we get a random winner", async () => {
                  //enter the raffle
                  console.log("Setting up test...");
                  const startingTimeStamp = await raffle.getLastTimeStamp();

                  console.log("Setting up Listener...");
                  await new Promise<void>(async (resolve, reject) => {
                      // setup listener before we enter the raffle. Just in case the blockchain moves REALLY fast
                      let winnerStartingBalance: BigNumber;
                      raffle.once("WinnerPicked", async () => {
                          console.log("WinnerPicked event fired!");
                          try {
                              // get data after the winner is picked and event is fired.
                              const recentWinner = await raffle.getRecentWinner();

                              const raffleState = await raffle.getRaffleState();
                              const endingTimeStamp = await raffle.getLastTimeStamp();
                              const winnerFinalBalance = await deployer.getBalance(); //here account[0]/deployer is the only entrant also. So he is the winner.
                              //start assertation

                              assert.equal(raffleState, 0);
                              assert.equal(recentWinner.toString(), deployer.address);
                              assert(endingTimeStamp > startingTimeStamp);
                              await expect(raffle.getPlayer(0)).to.be.reverted;
                              assert.equal(
                                  winnerFinalBalance.toString(),
                                  winnerStartingBalance.add(raffleEntranceFee).toString()
                              );
                              resolve();
                          } catch (e) {
                              console.log(e);
                              reject(e);
                          }
                      });

                      try {
                          //Entering the raffle
                          console.log("Entering Raffle...");
                          const tx = await raffle.enterRaffle({ value: raffleEntranceFee });
                          await tx.wait(1);
                          winnerStartingBalance = await deployer.getBalance(); //here account[0]/deployer is the only entrant also. So he is the winner
                          //await raffle.performUpkeep("0x");
                      } catch (error) {
                          console.log(error);
                          reject(error);
                      }

                      // And this code Wont compelte untill our listener (above) has finished listening.
                      console.log("Ok, time to wait...");
                  });
              });
          });
      });
