// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title WeeklyTournament
 * @notice Weekly puzzle tournaments with prize pools
 * Players enter with ETH, top 3 split the pot
 */
contract WeeklyTournament {
    // Events
    event TournamentCreated(uint256 indexed tournamentId, uint256 startDay, uint256 endDay, uint256 entryFee);
    event PlayerEntered(uint256 indexed tournamentId, address indexed player);
    event PointsAwarded(uint256 indexed tournamentId, address indexed player, uint256 points);
    event TournamentFinalized(uint256 indexed tournamentId, address[3] winners, uint256[3] prizes);
    event PrizeClaimed(uint256 indexed tournamentId, address indexed player, uint256 amount);

    struct Tournament {
        uint256 startDay;
        uint256 endDay;
        uint256 entryFee;
        uint256 prizePool;
        uint256 playerCount;
        bool finalized;
        address[3] winners;
        uint256[3] prizes;
    }

    struct PlayerStats {
        uint256 totalPoints;
        uint256 daysPlayed;
        bool entered;
        bool claimed;
    }

    // State
    address public owner;
    address public gameContract;
    
    uint256 public currentTournamentId;
    uint256 public constant WEEK_DAYS = 7;
    
    mapping(uint256 => Tournament) public tournaments;
    mapping(uint256 => mapping(address => PlayerStats)) public playerStats;
    mapping(uint256 => address[]) public tournamentPlayers;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyGame() {
        require(msg.sender == gameContract || msg.sender == owner, "Not authorized");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /// @notice Set the game contract address
    function setGameContract(address _gameContract) external onlyOwner {
        gameContract = _gameContract;
    }

    /// @notice Create a new weekly tournament
    function createTournament(uint256 startDay, uint256 entryFee) external onlyOwner {
        currentTournamentId++;
        
        tournaments[currentTournamentId] = Tournament({
            startDay: startDay,
            endDay: startDay + WEEK_DAYS - 1,
            entryFee: entryFee,
            prizePool: 0,
            playerCount: 0,
            finalized: false,
            winners: [address(0), address(0), address(0)],
            prizes: [uint256(0), uint256(0), uint256(0)]
        });

        emit TournamentCreated(currentTournamentId, startDay, startDay + WEEK_DAYS - 1, entryFee);
    }

    /// @notice Enter the current tournament
    function enter() external payable {
        Tournament storage t = tournaments[currentTournamentId];
        require(currentTournamentId > 0, "No tournament");
        require(!t.finalized, "Tournament ended");
        require(msg.value >= t.entryFee, "Insufficient fee");
        require(!playerStats[currentTournamentId][msg.sender].entered, "Already entered");

        uint256 currentDay = block.timestamp / 1 days;
        require(currentDay <= t.endDay, "Tournament ended");

        playerStats[currentTournamentId][msg.sender].entered = true;
        tournamentPlayers[currentTournamentId].push(msg.sender);
        t.playerCount++;
        t.prizePool += msg.value;

        emit PlayerEntered(currentTournamentId, msg.sender);
    }

    /// @notice Record points for a player (called by game contract)
    function recordPoints(address player, uint256 tournamentId, uint256 points) external onlyGame {
        require(playerStats[tournamentId][player].entered, "Not entered");
        require(!tournaments[tournamentId].finalized, "Tournament ended");

        playerStats[tournamentId][player].totalPoints += points;
        playerStats[tournamentId][player].daysPlayed++;

        emit PointsAwarded(tournamentId, player, points);
    }

    /// @notice Finalize tournament and determine winners
    function finalize(uint256 tournamentId) external onlyOwner {
        Tournament storage t = tournaments[tournamentId];
        require(!t.finalized, "Already finalized");
        
        uint256 currentDay = block.timestamp / 1 days;
        require(currentDay > t.endDay, "Tournament not ended");

        // Find top 3 players
        address[] memory players = tournamentPlayers[tournamentId];
        
        // Simple bubble sort for top 3 (gas efficient for small top-k)
        for (uint256 i = 0; i < players.length && i < 3; i++) {
            for (uint256 j = i + 1; j < players.length; j++) {
                if (playerStats[tournamentId][players[j]].totalPoints > 
                    playerStats[tournamentId][players[i]].totalPoints) {
                    (players[i], players[j]) = (players[j], players[i]);
                }
            }
            if (players.length > i) {
                t.winners[i] = players[i];
            }
        }

        // Calculate prizes (50%, 30%, 20%)
        if (t.prizePool > 0) {
            t.prizes[0] = (t.prizePool * 50) / 100;
            t.prizes[1] = (t.prizePool * 30) / 100;
            t.prizes[2] = t.prizePool - t.prizes[0] - t.prizes[1]; // remaining ~20%
        }

        t.finalized = true;
        emit TournamentFinalized(tournamentId, t.winners, t.prizes);
    }

    /// @notice Claim prize for a finalized tournament
    function claimPrize(uint256 tournamentId) external {
        Tournament storage t = tournaments[tournamentId];
        require(t.finalized, "Not finalized");
        require(!playerStats[tournamentId][msg.sender].claimed, "Already claimed");

        uint256 prizeAmount = 0;
        for (uint256 i = 0; i < 3; i++) {
            if (t.winners[i] == msg.sender) {
                prizeAmount = t.prizes[i];
                break;
            }
        }

        require(prizeAmount > 0, "No prize to claim");
        
        playerStats[tournamentId][msg.sender].claimed = true;
        
        (bool success, ) = msg.sender.call{value: prizeAmount}("");
        require(success, "Transfer failed");

        emit PrizeClaimed(tournamentId, msg.sender, prizeAmount);
    }

    // View functions
    function getTournament(uint256 tournamentId) external view returns (
        uint256 startDay,
        uint256 endDay,
        uint256 entryFee,
        uint256 prizePool,
        uint256 playerCount,
        bool finalized
    ) {
        Tournament storage t = tournaments[tournamentId];
        return (t.startDay, t.endDay, t.entryFee, t.prizePool, t.playerCount, t.finalized);
    }

    function getPlayerStats(uint256 tournamentId, address player) external view returns (
        uint256 totalPoints,
        uint256 daysPlayed,
        bool entered,
        bool claimed
    ) {
        PlayerStats storage s = playerStats[tournamentId][player];
        return (s.totalPoints, s.daysPlayed, s.entered, s.claimed);
    }

    function getWinners(uint256 tournamentId) external view returns (
        address[3] memory winners,
        uint256[3] memory prizes
    ) {
        Tournament storage t = tournaments[tournamentId];
        return (t.winners, t.prizes);
    }

    function getLeaderboard(uint256 tournamentId, uint256 limit) external view returns (
        address[] memory players,
        uint256[] memory points
    ) {
        address[] memory allPlayers = tournamentPlayers[tournamentId];
        uint256 count = limit < allPlayers.length ? limit : allPlayers.length;
        
        // Copy to memory for sorting
        address[] memory sorted = new address[](allPlayers.length);
        for (uint256 i = 0; i < allPlayers.length; i++) {
            sorted[i] = allPlayers[i];
        }

        // Sort by points (descending)
        for (uint256 i = 0; i < count; i++) {
            for (uint256 j = i + 1; j < sorted.length; j++) {
                if (playerStats[tournamentId][sorted[j]].totalPoints > 
                    playerStats[tournamentId][sorted[i]].totalPoints) {
                    (sorted[i], sorted[j]) = (sorted[j], sorted[i]);
                }
            }
        }

        players = new address[](count);
        points = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            players[i] = sorted[i];
            points[i] = playerStats[tournamentId][sorted[i]].totalPoints;
        }
    }

    /// @notice Emergency withdraw (owner only)
    function emergencyWithdraw() external onlyOwner {
        (bool success, ) = owner.call{value: address(this).balance}("");
        require(success, "Transfer failed");
    }

    receive() external payable {}
}
