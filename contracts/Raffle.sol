// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/KeeperCompatible.sol";

error Raffle__SendMoreToEnterRaffle();
error Raffle__RaffleIsNotOpen();
error Raffle__TransferFailed();
error Raffle__UpkeepNotNeeded(uint256 currentBalance, uint256 numPlayers, uint256 raffleState);

contract Raffle is VRFConsumerBaseV2, KeeperCompatibleInterface {
    /** Type declaration */
    enum RaffleState {
        Open,
        Calculating
    }
    /*state variables*/
    // Lottery Variables
    uint256 private immutable i_enteranceFee;
    address payable[] private s_players;
    address private s_recentWinner;
    uint256 private s_lastTimeStamp;
    uint256 private immutable i_interval;
    RaffleState private s_raffleState;

    //chainlink variables
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    bytes32 private immutable i_gasLane;
    uint64 private immutable i_subscriptionId;
    uint16 private constant REQUEST_CONFIRMATION = 3;
    uint32 private immutable i_callbackGasLimit;
    uint32 private constant NUM_WORDS = 1;

    /* Events: Named events with the function name reversed */
    event RaffleEnter(address indexed player);
    event RequestRafflewinner(uint256 indexed requestId);
    event WinnerPicked(address indexed winner);

    constructor(
        address vrfCoordinatorV2,
        uint64 subscriptionId,
        uint256 enteranceFee,
        bytes32 gasLane,
        uint32 callbackGasLimit,
        uint256 interval
    ) VRFConsumerBaseV2(vrfCoordinatorV2) {
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_subscriptionId = subscriptionId;
        i_enteranceFee = enteranceFee;
        i_gasLane = gasLane;
        i_callbackGasLimit = callbackGasLimit;
        i_interval = interval;
        s_raffleState = RaffleState.Open;
        s_lastTimeStamp = block.timestamp;
    }

    // To enter into lottery
    function enterRaffle() public payable {
        if (msg.value < i_enteranceFee) {
            revert Raffle__SendMoreToEnterRaffle();
        }
        //If raffle is not open
        if (s_raffleState != RaffleState.Open) {
            revert Raffle__RaffleIsNotOpen();
        }
        s_players.push(payable(msg.sender)); //we need to type cast msg.sender as payable address. Since we have declared s_players as payable storage array.

        // Emit an event when we update a dynamic array or mapping
        emit RaffleEnter(msg.sender);
    }

    /**
    This function is required by the chainlink keeper to check the value of `upkeepNeeded` so that it can exacute `function performUpkeep` if it return true.
    * the following should be true for this to return true:
    * 1. The time interval has passed between raffle runs.
    * 2. The lottery is open.
    * 3. The contract has ETH.
    * 4. Implicity, your subscription is funded with LINK.
    */
    function checkUpkeep(
        bytes memory /* checkData */
    ) public view override returns (bool upkeepNeeded, bytes memory performData) {
        bool isOpen = (RaffleState.Open == s_raffleState);
        bool timePassed = ((block.timestamp - s_lastTimeStamp) > i_interval);
        bool hasPlayers = (s_players.length > 0);
        bool hasBalance = (address(this).balance > 0);
        upkeepNeeded = (isOpen && timePassed && hasPlayers && hasBalance);

        return (upkeepNeeded, "0x");
    }

    //To pick a winner, used by chainlink keeper automatically.
    function performUpkeep(
        bytes calldata /* performData */
    ) external override {
        /*
        (bool upkeepNeeded, ) = checkUpkeep("0x");

        if (!upkeepNeeded) {
            revert Raffle__UpkeepNotNeeded(
                address(this).balance,
                s_players.length,
                uint256(s_raffleState)
            );
        }
        */
        s_raffleState = RaffleState.Calculating;
        uint256 requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQUEST_CONFIRMATION,
            i_callbackGasLimit,
            NUM_WORDS
        );
        emit RequestRafflewinner(requestId);
    }

    function fulfillRandomWords(
        uint256, /*requestId*/
        uint256[] memory randomWords
    ) internal override {
        //using Modulo operator to get the index of random
        uint256 indexOfWinner = randomWords[0] % s_players.length;
        address payable recentWinner = s_players[indexOfWinner];
        s_recentWinner = recentWinner;
        s_players = new address payable[](0);
        s_raffleState = RaffleState.Open;
        s_lastTimeStamp = block.timestamp;
        //giving price to winner
        (bool success, ) = recentWinner.call{value: address(this).balance}("");
        if (!success) {
            revert Raffle__TransferFailed();
        }
        emit WinnerPicked(recentWinner);
    }

    /** Getter Functions (view/pure) */
    //In case we need the value of enteranceFee outside the smart contracts
    function getEnteranceFee() public view returns (uint256) {
        return i_enteranceFee;
    }

    function getPlayer(uint256 index) public view returns (address) {
        return s_players[index];
    }

    function getRecentWinner() public view returns (address) {
        return s_recentWinner;
    }

    function getRaffleState() public view returns (RaffleState) {
        return s_raffleState;
    }

    function getNumberOfPlayers() public view returns (uint256) {
        return s_players.length;
    }

    function getLastTimeStamp() public view returns (uint256) {
        return s_lastTimeStamp;
    }

    function getInterval() public view returns (uint256) {
        return i_interval;
    }

    // Here we set state to `pure` because NUM_WORDS is constant and its not in storage vairables. So its not in view and hence `view` state is not needed. Same for immutable variables.
    function getNumWords() public pure returns (uint256) {
        return NUM_WORDS;
    }

    function getRequestConfirmations() public pure returns (uint256) {
        return REQUEST_CONFIRMATION;
    }
}
