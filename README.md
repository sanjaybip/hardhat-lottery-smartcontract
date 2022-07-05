# Lottery(Raffle) Smart Contract Using Hardhart

This is advance demonstartion of smart contract to enter a lottery. Players have to pay a minimum `ETH` to enter the Raffle. Then we are using chainlink Keeper to start a new lottery automatically after X minutes. We also use Chainlink VRF to get a truly temper proof and decentarlzied way of getting a random winner. We also use VRFCooridnator package from the chainlink.

This code is written while following the free course on Solidity by Patrick Collions.

This project is developed with `hardhat` framework using `TypeScript`. This project demonstrates an advanced Hardhat use case, integrating other tools commonly used alongside Hardhat in the ecosystem.

Smart contracts is in `/contracts` folder. All the test code is in `/test` folder. Deploy scripts are inside the `/deploy` folder.

## Network
We have tested the code in or `hardhat` local network. For testnet we have used `rinkeby`. Make sure you have some ETH in your testnet network before you deploy and test code. You can get free testnet ETH on major testnet network through chainlink website. 


## Chainlink Keeper and VRF
* [Chainlink Keeper](https://docs.chain.link/docs/chainlink-keepers/introduction/)
* [Chainlink VRF](https://docs.chain.link/docs/chainlink-vrf/)

## Running the code
To run and test the code in your local development machine copy the repo with following command. We have used `yarn` package manager. You can use `NPM`.
```shell
git clone https://github.com/sanjaydefidev/hardhat-lottery-smartcontract
```
Installing all the dependencies
```shell
yarn install
```
## Shell commands
To comile the solidity.
```shell
yarn hardhat compile
```

To deploy on testnet.
```shell
yarn hardhat deploy --network rinkeby
```
To run the mocha tests on local.
```shell
yarn hardhat test
```
To run the mocha tests on testnet.
```shell
yarn hardhat test --network rinkeby
```

To run the coverage of code.
```shell
yarn hardhat coverage
```
For futher detail of this tutorial [check this link](https://github.com/PatrickAlphaC/hardhat-smartcontract-lottery-fcc).

## Note
Thank you @PatrickAlphaC for creating such and awesome tutorial.
