// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title DailyTournament
 * @notice Daily puzzle tournament with ETH prize pools
 * @dev Players pay entry fee, fastest solvers split the pot
 */
contract DailyTournament {
    address public owner;
    
    uint256 public entryFee = 0.001 ether;
    uint256 public constant PRIZE_SPLIT_TOP_3 = 3;
    uint256 public constant HOUSE_FEE_BPS = 500; // 5%
    
    struct DayTournament {
        uint256 prizePool;
        uint256 participantCount;
        address[] winners;
        bool finalized;
    }
    
    struct Participant {
        bool entered;
        bool solved;
        uint256 solveTime;
    }
    
    // day => tournament data
    mapping(uint256 => DayTournament) public tournaments;
    
    // day => player => participant data
    mapping(uint256 => mapping(address => Participant)) public participants;
    
    // day => list of players who entered
    mapping(uint256 => address[]) public dayParticipants;
    
    // day => sorted solvers (fastest first)
    mapping(uint256 => address[]) public daySolvers;
    
    // day => player => claimed prize
    mapping(uint256 => mapping(address => bool)) public prizeClaimed;
    
    event TournamentEntered(address indexed player, uint256 day, uint256 prizePool);
    event PuzzleSolved(address indexed player, uint256 day, uint256 rank);
    event TournamentFinalized(uint256 day, address[] winners, uint256[] prizes);
    event PrizeClaimed(address indexed player, uint256 day, uint256 amount);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    /// @notice Get current day (UTC)
    function getCurrentDay() public view returns (uint256) {
        return block.timestamp / 1 days;
    }
    
    /// @notice Enter today's tournament
    function enterTournament() external payable {
        uint256 day = getCurrentDay();
        require(msg.value >= entryFee, "Insufficient entry fee");
        require(!participants[day][msg.sender].entered, "Already entered");
        
        participants[day][msg.sender].entered = true;
        dayParticipants[day].push(msg.sender);
        tournaments[day].prizePool += msg.value;
        tournaments[day].participantCount++;
        
        emit TournamentEntered(msg.sender, day, tournaments[day].prizePool);
    }
    
    /// @notice Record a solve (called by authorized game contract or owner)
    function recordSolve(address player, uint256 day) external onlyOwner {
        require(participants[day][player].entered, "Not entered");
        require(!participants[day][player].solved, "Already solved");
        
        participants[day][player].solved = true;
        participants[day][player].solveTime = block.timestamp;
        daySolvers[day].push(player);
        
        uint256 rank = daySolvers[day].length;
        emit PuzzleSolved(player, day, rank);
    }
    
    /// @notice Finalize tournament for a past day
    function finalizeTournament(uint256 day) external onlyOwner {
        require(day < getCurrentDay(), "Cannot finalize current day");
        require(!tournaments[day].finalized, "Already finalized");
        
        tournaments[day].finalized = true;
        
        address[] memory solvers = daySolvers[day];
        uint256 numWinners = solvers.length < PRIZE_SPLIT_TOP_3 ? solvers.length : PRIZE_SPLIT_TOP_3;
        
        address[] memory winners = new address[](numWinners);
        for (uint256 i = 0; i < numWinners; i++) {
            winners[i] = solvers[i];
        }
        tournaments[day].winners = winners;
        
        // Calculate prizes (after house fee)
        uint256 houseFee = (tournaments[day].prizePool * HOUSE_FEE_BPS) / 10000;
        uint256 distributablePool = tournaments[day].prizePool - houseFee;
        
        uint256[] memory prizes = new uint256[](numWinners);
        if (numWinners == 1) {
            prizes[0] = distributablePool;
        } else if (numWinners == 2) {
            prizes[0] = (distributablePool * 60) / 100;
            prizes[1] = (distributablePool * 40) / 100;
        } else if (numWinners >= 3) {
            prizes[0] = (distributablePool * 50) / 100;
            prizes[1] = (distributablePool * 30) / 100;
            prizes[2] = (distributablePool * 20) / 100;
        }
        
        // Transfer house fee to owner
        if (houseFee > 0) {
            payable(owner).transfer(houseFee);
        }
        
        emit TournamentFinalized(day, winners, prizes);
    }
    
    /// @notice Claim prize for a finalized tournament
    function claimPrize(uint256 day) external {
        require(tournaments[day].finalized, "Not finalized");
        require(!prizeClaimed[day][msg.sender], "Already claimed");
        
        uint256 prize = getPrize(day, msg.sender);
        require(prize > 0, "No prize to claim");
        
        prizeClaimed[day][msg.sender] = true;
        payable(msg.sender).transfer(prize);
        
        emit PrizeClaimed(msg.sender, day, prize);
    }
    
    /// @notice Get prize amount for a player
    function getPrize(uint256 day, address player) public view returns (uint256) {
        address[] memory winners = tournaments[day].winners;
        uint256 houseFee = (tournaments[day].prizePool * HOUSE_FEE_BPS) / 10000;
        uint256 distributablePool = tournaments[day].prizePool - houseFee;
        
        for (uint256 i = 0; i < winners.length; i++) {
            if (winners[i] == player) {
                if (winners.length == 1) {
                    return distributablePool;
                } else if (winners.length == 2) {
                    return i == 0 ? (distributablePool * 60) / 100 : (distributablePool * 40) / 100;
                } else {
                    if (i == 0) return (distributablePool * 50) / 100;
                    if (i == 1) return (distributablePool * 30) / 100;
                    if (i == 2) return (distributablePool * 20) / 100;
                }
            }
        }
        return 0;
    }
    
    /// @notice Get tournament info
    function getTournamentInfo(uint256 day) external view returns (
        uint256 prizePool,
        uint256 participantCount,
        uint256 solverCount,
        bool finalized
    ) {
        return (
            tournaments[day].prizePool,
            tournaments[day].participantCount,
            daySolvers[day].length,
            tournaments[day].finalized
        );
    }
    
    /// @notice Get participant status
    function getParticipantStatus(uint256 day, address player) external view returns (
        bool entered,
        bool solved,
        uint256 rank
    ) {
        Participant memory p = participants[day][player];
        uint256 playerRank = 0;
        if (p.solved) {
            address[] memory solvers = daySolvers[day];
            for (uint256 i = 0; i < solvers.length; i++) {
                if (solvers[i] == player) {
                    playerRank = i + 1;
                    break;
                }
            }
        }
        return (p.entered, p.solved, playerRank);
    }
    
    /// @notice Get top solvers for a day
    function getTopSolvers(uint256 day, uint256 limit) external view returns (address[] memory) {
        address[] memory solvers = daySolvers[day];
        uint256 count = solvers.length < limit ? solvers.length : limit;
        address[] memory top = new address[](count);
        for (uint256 i = 0; i < count; i++) {
            top[i] = solvers[i];
        }
        return top;
    }
    
    /// @notice Update entry fee (owner only)
    function setEntryFee(uint256 newFee) external onlyOwner {
        entryFee = newFee;
    }
    
    /// @notice Transfer ownership
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid owner");
        owner = newOwner;
    }
    
    /// @notice Emergency withdraw (owner only, for stuck funds)
    function emergencyWithdraw() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
    
    receive() external payable {}
}
