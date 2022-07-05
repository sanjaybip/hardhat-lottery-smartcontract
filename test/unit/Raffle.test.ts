import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { assert, expect } from "chai";
import { BigNumber } from "ethers";
import { deployments, ethers, network } from "hardhat";
import { developmentChains, networkConfig } from "../../helper-hardhat-config";
import { Raffle, VRFCoordinatorV2Mock } from "../../typechain-types";

//runs only on local newtork
!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle Unit Tests", function () {
          let raffle: Raffle;
          let raffleContract: Raffle;
          let vrfCoordinatorV2Mock: VRFCoordinatorV2Mock;
          let player: SignerWithAddress;
          let raffleEntranceFee: BigNumber;
          let interval: number;
          let accounts: SignerWithAddress[];
          beforeEach(async function () {
              accounts = await ethers.getSigners();
              //deployer = accounts[0]; //first account is deployer
              player = accounts[1];
              //const {deployer} = await getNamedAccounts(); //we can use this to get deployer/players too.
              await deployments.fixture(["mocks", "raffle"]);
              raffleContract = await ethers.getContract("Raffle");
              raffle = raffleContract.connect(player);
              vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock");

              raffleEntranceFee = await raffle.getEnteranceFee();
              interval = (await raffle.getInterval()).toNumber();
          });

          describe("constructor", function () {
              it("intitiallizes the raffle correctly", async () => {
                  // Ideally, we'd separate these out so that only 1 assert per "it" block
                  // And ideally, we'd make this check everything
                  const raffleState = await raffle.getRaffleState();
                  const interval = await raffle.getInterval();
                  assert(raffleState.toString(), "0");
                  assert(
                      interval.toString(),
                      networkConfig[network.config.chainId!].keepersUpdateInterval
                  );
              });
          });

          describe("enterRaffle", function () {
              it("reverts if entry fee is low", async () => {
                  await expect(raffle.enterRaffle()).to.be.revertedWith(
                      "Raffle__SendMoreToEnterRaffle"
                  );
              });
              it("records player when they enter the Raffle", async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee });
                  const contractPlayer = await raffle.getPlayer(0);
                  assert.equal(player.address, contractPlayer);
              });
              it("Emits event on enter", async () => {
                  //testing a function emits event
                  await expect(raffle.enterRaffle({ value: raffleEntranceFee })).to.emit(
                      raffleContract,
                      "RaffleEnter"
                  );
              });
              //check if raffle is not open, if so players cannot participate
              it("doesn't allow entrance when raffle is calculating", async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee });
                  await network.provider.send("evm_increaseTime", [interval + 1]);
                  await network.provider.send("evm_mine", []);
                  //we can write above code as below too.
                  //await network.provider.request({ method: "evm_mine", params: [] })

                  //Pretend to be chain link upkeeper
                  await raffle.performUpkeep([]); //now we are in perfomUpkeep, that means Raffle status is now changed to calculating
                  await expect(raffle.enterRaffle({ value: raffleEntranceFee })).to.be.revertedWith(
                      "Raffle__RaffleIsNotOpen"
                  );
              });
          });

          describe("checkUpkeep", function () {
              it("return false if player has not sent ETH", async () => {
                  await network.provider.send("evm_increaseTime", [interval + 1]);
                  await network.provider.send("evm_mine", []);
                  // we can use callStatic to just simulate a method and this will avoid the transaction associated with that method. This is helpful if you want to just get value from the function
                  const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x");
                  assert(!upkeepNeeded);
              });
              it("returns false if raffle isn't open", async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee });
                  await network.provider.send("evm_increaseTime", [interval + 1]);
                  await network.provider.send("evm_mine", []);
                  await raffle.performUpkeep("0x");
                  const raffleState = await raffle.getRaffleState();
                  const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x");
                  assert.equal(raffleState.toString() == "1", upkeepNeeded == false);
              });
              it("returns false if enough time hasn't passed", async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee });
                  await network.provider.send("evm_increaseTime", [interval - 1]);
                  await network.provider.send("evm_mine", []);
                  await raffle.performUpkeep("0x");
                  const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x");
                  assert(!upkeepNeeded);
              });
              it("returns true if enough time has passed, has players, eth, and is open", async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee });
                  await network.provider.send("evm_increaseTime", [interval + 1]);
                  await network.provider.send("evm_mine", []);
                  const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x");
                  assert(upkeepNeeded);
              });
          });

          describe("performUpkeep", function () {
              //unit testing performUpkeep method.
              it("can only run if checkUpkeep returns true", async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee });
                  await network.provider.send("evm_increaseTime", [interval + 1]);
                  await network.provider.request({ method: "evm_mine", params: [] }); //using alternate syntax
                  const transactipnResop = await raffle.performUpkeep("0x");
                  assert(transactipnResop);
              });

              it("reverts if checkUpkeep retruns false", async () => {
                  await expect(raffle.performUpkeep("0x")).to.be.revertedWith(
                      "Raffle__UpkeepNotNeeded"
                  );
              });

              it("updates the raffle state and emits a requestId", async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee });
                  await network.provider.send("evm_increaseTime", [interval + 1]);
                  await network.provider.request({ method: "evm_mine", params: [] }); //using alternate syntax
                  const transactipnResop = await raffle.performUpkeep("0x");
                  const transactipnReceipt = await transactipnResop.wait();
                  const raffleState = await raffle.getRaffleState();
                  const reqstId = transactipnReceipt!.events![1].args!.requestId; //getting requestId from second event, first is
                  assert(reqstId.toNumber() > 0);
                  assert.equal(raffleState.toString(), "1");
              });
          });

          describe("fulfillRandomWords", function () {
              //before we play randomwords, we want to make sure someone is in lottery, we have passed the interval and mined blocks.
              beforeEach(async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee });
                  await network.provider.send("evm_increaseTime", [interval + 1]);
                  await network.provider.request({ method: "evm_mine", params: [] });
              });
              it("can only be called after performupkeep", async () => {
                  await expect(
                      vrfCoordinatorV2Mock.fulfillRandomWords(0, raffle.address)
                  ).to.be.revertedWith("nonexistent request");
              });

              // This test is too big...
              it("picks a winner, resets, and sends money", async () => {
                  const additionalEnterants = 3;
                  const startingAccountIndex = 2;
                  for (
                      let i = startingAccountIndex;
                      i < additionalEnterants + startingAccountIndex;
                      i++
                  ) {
                      raffle = raffleContract.connect(accounts[i]);
                      await raffle.enterRaffle({ value: raffleEntranceFee });
                  }
                  const startingTimeStamp = await raffle.getLastTimeStamp();
                  //perfromUpkeep (Mock the chainlink keeper)
                  //run `fulfillRandomWords` (Mock the chainlink VRF)
                  // Wait for `fulfillRandomWords` being called.
                  // on local we can bypass it by simulating `fulfillRandomWords` being called. But on testnet/mainnet we have to wait.
                  // We need to set event in order to simulate the waiting, we need to setup a listner. So we don't want to finish our test unless we are done listening the event.
                  //Below we will use Promises to simulate the event firing and waiting to listen to that event on the testnet/mainnet.
                  await new Promise<void>(async (resolve, reject) => {
                      // this is basically means, once winnerpicked event is fired, listen it in async arrow function
                      raffle.once("WinnerPicked", async () => {
                          console.log("WinnerPicked event fired!");
                          // assert throws an error if it fails, so we need to wrap it in a try/catch so that the promise returns event if it fails.
                          try {
                              const recentWinner = await raffle.getRecentWinner();
                              /*
                              Done to check the winner. In our case its accounts[2]
                              console.log(recentWinner);
                              console.log(accounts[0].address);
                              console.log(accounts[1].address);
                              console.log(accounts[2].address);
                              console.log(accounts[3].address);
                              console.log(accounts[4].address);
                              */

                              const raffleState = await raffle.getRaffleState();
                              const endingTimeStamp = await raffle.getLastTimeStamp();
                              const winnerBalance = await accounts[2].getBalance();
                              await expect(raffle.getPlayer(0)).to.be.reverted;
                              assert.equal(raffleState, 0);
                              assert(endingTimeStamp > startingTimeStamp);
                              assert.equal(
                                  winnerBalance.toString(),
                                  winnerStartingBalance
                                      .add(
                                          raffleEntranceFee
                                              .mul(additionalEnterants)
                                              .add(raffleEntranceFee)
                                      )
                                      .toString()
                              );
                              resolve();
                          } catch (e) {
                              reject(e);
                          }
                      });

                      //below, we will fire up the event, and above listener will pick it up.

                      //Mocking chainlink Keeper
                      const txRespo = await raffle.performUpkeep("0x");
                      const txReceipt = await txRespo.wait();
                      const winnerStartingBalance = await accounts[2].getBalance(); //we are checking winners account balance before he declared as winner.
                      //we are mocking chainlink vrf fullfillRandomWords, and this is were event "WinnerPicked" will be fired too.
                      await vrfCoordinatorV2Mock.fulfillRandomWords(
                          txReceipt!.events![1].args!.requestId,
                          raffle.address
                      );
                  });
              });
          });
      });
