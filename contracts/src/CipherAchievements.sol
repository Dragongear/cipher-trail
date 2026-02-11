// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title CipherAchievements
 * @notice Soulbound achievement badges for CipherTrail. Non-transferable NFTs.
 */
contract CipherAchievements {
    // Events
    event BadgeMinted(address indexed player, uint256 indexed badgeId, uint256 tokenId);
    event BadgeCreated(uint256 indexed badgeId, string name, string uri);

    // Badge definition
    struct Badge {
        string name;
        string uri;         // metadata URI
        uint256 requirement; // e.g., solves needed, streak needed
        bool active;
    }

    // Token data
    struct Token {
        uint256 badgeId;
        address owner;
        uint256 mintedAt;
    }

    // State
    address public owner;
    address public gameContract; // CipherTrail contract that can mint
    
    uint256 public nextBadgeId = 1;
    uint256 public nextTokenId = 1;
    
    mapping(uint256 => Badge) public badges;
    mapping(uint256 => Token) public tokens;
    mapping(address => mapping(uint256 => bool)) public hasBadge; // player => badgeId => has
    mapping(address => uint256[]) public playerBadges; // player => tokenIds
    mapping(address => uint256) public solveCount; // track solves per player
    mapping(address => uint256) public currentStreak; // current streak
    mapping(address => uint256) public bestStreak; // best streak ever
    mapping(address => uint256) public lastSolveDay; // last day solved

    // Badge IDs (constants for known badges)
    uint256 public constant BADGE_FIRST_SOLVE = 1;
    uint256 public constant BADGE_STREAK_3 = 2;
    uint256 public constant BADGE_STREAK_7 = 3;
    uint256 public constant BADGE_STREAK_30 = 4;
    uint256 public constant BADGE_SOLVES_10 = 5;
    uint256 public constant BADGE_SOLVES_50 = 6;
    uint256 public constant BADGE_SOLVES_100 = 7;
    uint256 public constant BADGE_SPEED_DEMON = 8; // solved in first hour

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
        
        // Initialize default badges
        _createBadge("First Solve", "ipfs://first-solve", 1);
        _createBadge("3-Day Streak", "ipfs://streak-3", 3);
        _createBadge("Week Warrior", "ipfs://streak-7", 7);
        _createBadge("Monthly Master", "ipfs://streak-30", 30);
        _createBadge("10 Solves", "ipfs://solves-10", 10);
        _createBadge("50 Solves", "ipfs://solves-50", 50);
        _createBadge("Century Solver", "ipfs://solves-100", 100);
        _createBadge("Speed Demon", "ipfs://speed-demon", 1);
    }

    function _createBadge(string memory name, string memory uri, uint256 requirement) internal {
        badges[nextBadgeId] = Badge({
            name: name,
            uri: uri,
            requirement: requirement,
            active: true
        });
        emit BadgeCreated(nextBadgeId, name, uri);
        nextBadgeId++;
    }

    /// @notice Set the game contract address
    function setGameContract(address _gameContract) external onlyOwner {
        gameContract = _gameContract;
    }

    /// @notice Record a solve and mint eligible badges
    function recordSolve(address player, uint256 day, uint256 points) external onlyGame {
        solveCount[player]++;
        
        // Update streak
        if (lastSolveDay[player] == day - 1) {
            currentStreak[player]++;
        } else if (lastSolveDay[player] != day) {
            currentStreak[player] = 1;
        }
        lastSolveDay[player] = day;
        
        if (currentStreak[player] > bestStreak[player]) {
            bestStreak[player] = currentStreak[player];
        }

        // Check and mint eligible badges
        _checkAndMint(player, BADGE_FIRST_SOLVE, solveCount[player] >= 1);
        _checkAndMint(player, BADGE_STREAK_3, currentStreak[player] >= 3);
        _checkAndMint(player, BADGE_STREAK_7, currentStreak[player] >= 7);
        _checkAndMint(player, BADGE_STREAK_30, currentStreak[player] >= 30);
        _checkAndMint(player, BADGE_SOLVES_10, solveCount[player] >= 10);
        _checkAndMint(player, BADGE_SOLVES_50, solveCount[player] >= 50);
        _checkAndMint(player, BADGE_SOLVES_100, solveCount[player] >= 100);
        
        // Speed demon: solved with high points (meaning early in the day)
        if (points >= 140) { // BASE_POINTS(100) + near-max bonus(40+)
            _checkAndMint(player, BADGE_SPEED_DEMON, true);
        }
    }

    function _checkAndMint(address player, uint256 badgeId, bool eligible) internal {
        if (eligible && !hasBadge[player][badgeId] && badges[badgeId].active) {
            _mint(player, badgeId);
        }
    }

    function _mint(address player, uint256 badgeId) internal {
        uint256 tokenId = nextTokenId++;
        tokens[tokenId] = Token({
            badgeId: badgeId,
            owner: player,
            mintedAt: block.timestamp
        });
        hasBadge[player][badgeId] = true;
        playerBadges[player].push(tokenId);
        
        emit BadgeMinted(player, badgeId, tokenId);
    }

    /// @notice Admin mint for special badges
    function adminMint(address player, uint256 badgeId) external onlyOwner {
        require(badges[badgeId].active, "Badge not active");
        require(!hasBadge[player][badgeId], "Already has badge");
        _mint(player, badgeId);
    }

    /// @notice Create a new badge type
    function createBadge(string calldata name, string calldata uri, uint256 requirement) external onlyOwner {
        _createBadge(name, uri, requirement);
    }

    /// @notice Update badge URI
    function updateBadgeUri(uint256 badgeId, string calldata uri) external onlyOwner {
        badges[badgeId].uri = uri;
    }

    // View functions
    function getPlayerBadges(address player) external view returns (uint256[] memory) {
        return playerBadges[player];
    }

    function getPlayerStats(address player) external view returns (
        uint256 totalSolves,
        uint256 streak,
        uint256 best,
        uint256 badgeCount
    ) {
        return (
            solveCount[player],
            currentStreak[player],
            bestStreak[player],
            playerBadges[player].length
        );
    }

    function getBadgeInfo(uint256 badgeId) external view returns (
        string memory name,
        string memory uri,
        uint256 requirement,
        bool active
    ) {
        Badge storage b = badges[badgeId];
        return (b.name, b.uri, b.requirement, b.active);
    }

    function tokenURI(uint256 tokenId) external view returns (string memory) {
        require(tokens[tokenId].owner != address(0), "Token does not exist");
        return badges[tokens[tokenId].badgeId].uri;
    }

    // SBT: Disable transfers
    function transferFrom(address, address, uint256) external pure {
        revert("Soulbound: non-transferable");
    }

    function safeTransferFrom(address, address, uint256) external pure {
        revert("Soulbound: non-transferable");
    }

    function safeTransferFrom(address, address, uint256, bytes calldata) external pure {
        revert("Soulbound: non-transferable");
    }

    function approve(address, uint256) external pure {
        revert("Soulbound: non-transferable");
    }

    function setApprovalForAll(address, bool) external pure {
        revert("Soulbound: non-transferable");
    }

    // ERC721 metadata
    function name() external pure returns (string memory) {
        return "CipherTrail Achievements";
    }

    function symbol() external pure returns (string memory) {
        return "CIPHER";
    }

    function balanceOf(address player) external view returns (uint256) {
        return playerBadges[player].length;
    }

    function ownerOf(uint256 tokenId) external view returns (address) {
        require(tokens[tokenId].owner != address(0), "Token does not exist");
        return tokens[tokenId].owner;
    }
}
