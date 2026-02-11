// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CipherBadges
 * @notice Soulbound (non-transferable) achievement badges for CipherTrail
 * @dev Badges are minted by the game contract or owner, cannot be transferred
 */
contract CipherBadges is ERC721, Ownable {
    // Badge types
    uint256 public constant BADGE_FIRST_SOLVE = 1;      // First puzzle solved
    uint256 public constant BADGE_STREAK_3 = 2;         // 3 day streak
    uint256 public constant BADGE_STREAK_7 = 3;         // 7 day streak
    uint256 public constant BADGE_STREAK_30 = 4;        // 30 day streak
    uint256 public constant BADGE_TOP_10 = 5;           // Top 10 daily
    uint256 public constant BADGE_SPEED_DEMON = 6;      // Solved in first hour
    uint256 public constant BADGE_EARLY_ADOPTER = 7;    // First 100 players

    // Token ID counter
    uint256 private _tokenIdCounter;

    // Base URI for metadata
    string private _baseTokenURI;

    // Mapping: tokenId => badgeType
    mapping(uint256 => uint256) public tokenBadgeType;

    // Mapping: player => badgeType => hasBadge
    mapping(address => mapping(uint256 => bool)) public hasBadge;

    // Mapping: player => badgeType => tokenId
    mapping(address => mapping(uint256 => uint256)) public playerBadgeToken;

    // Authorized minters (game contracts)
    mapping(address => bool) public authorizedMinters;

    // Player stats for streak tracking
    mapping(address => uint256) public lastSolveDay;
    mapping(address => uint256) public currentStreak;

    // Total players (for early adopter badge)
    uint256 public totalPlayers;

    event BadgeMinted(address indexed player, uint256 indexed badgeType, uint256 tokenId);
    event MinterAuthorized(address indexed minter, bool authorized);

    modifier onlyMinter() {
        require(authorizedMinters[msg.sender] || msg.sender == owner(), "Not authorized minter");
        _;
    }

    constructor(string memory baseURI) ERC721("CipherTrail Badges", "CBADGE") Ownable(msg.sender) {
        _baseTokenURI = baseURI;
    }

    /// @notice Authorize a minter (game contract)
    function setMinter(address minter, bool authorized) external onlyOwner {
        authorizedMinters[minter] = authorized;
        emit MinterAuthorized(minter, authorized);
    }

    /// @notice Set base URI for metadata
    function setBaseURI(string memory baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
    }

    /// @notice Mint a badge to a player
    function mintBadge(address player, uint256 badgeType) external onlyMinter returns (uint256) {
        require(!hasBadge[player][badgeType], "Already has this badge");
        require(badgeType >= 1 && badgeType <= 7, "Invalid badge type");

        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;

        _safeMint(player, tokenId);
        tokenBadgeType[tokenId] = badgeType;
        hasBadge[player][badgeType] = true;
        playerBadgeToken[player][badgeType] = tokenId;

        // Track early adopter
        if (badgeType == BADGE_FIRST_SOLVE) {
            totalPlayers++;
            if (totalPlayers <= 100 && !hasBadge[player][BADGE_EARLY_ADOPTER]) {
                _mintInternal(player, BADGE_EARLY_ADOPTER);
            }
        }

        emit BadgeMinted(player, badgeType, tokenId);
        return tokenId;
    }

    /// @notice Record a solve and update streak, mint streak badges
    function recordSolve(address player, uint256 day, bool isTopTen, bool isFirstHour) external onlyMinter {
        // First solve badge
        if (!hasBadge[player][BADGE_FIRST_SOLVE]) {
            _mintInternal(player, BADGE_FIRST_SOLVE);
        }

        // Speed demon badge
        if (isFirstHour && !hasBadge[player][BADGE_SPEED_DEMON]) {
            _mintInternal(player, BADGE_SPEED_DEMON);
        }

        // Top 10 badge
        if (isTopTen && !hasBadge[player][BADGE_TOP_10]) {
            _mintInternal(player, BADGE_TOP_10);
        }

        // Streak tracking
        uint256 lastDay = lastSolveDay[player];
        if (lastDay == 0) {
            // First solve
            currentStreak[player] = 1;
        } else if (day == lastDay + 1) {
            // Consecutive day
            currentStreak[player]++;
        } else if (day > lastDay + 1) {
            // Streak broken
            currentStreak[player] = 1;
        }
        // Same day = no change to streak

        lastSolveDay[player] = day;

        // Check streak badges
        uint256 streak = currentStreak[player];
        if (streak >= 3 && !hasBadge[player][BADGE_STREAK_3]) {
            _mintInternal(player, BADGE_STREAK_3);
        }
        if (streak >= 7 && !hasBadge[player][BADGE_STREAK_7]) {
            _mintInternal(player, BADGE_STREAK_7);
        }
        if (streak >= 30 && !hasBadge[player][BADGE_STREAK_30]) {
            _mintInternal(player, BADGE_STREAK_30);
        }
    }

    /// @dev Internal mint without checks
    function _mintInternal(address player, uint256 badgeType) internal {
        if (hasBadge[player][badgeType]) return;

        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;

        _safeMint(player, tokenId);
        tokenBadgeType[tokenId] = badgeType;
        hasBadge[player][badgeType] = true;
        playerBadgeToken[player][badgeType] = tokenId;

        emit BadgeMinted(player, badgeType, tokenId);
    }

    /// @notice Get all badges for a player
    function getPlayerBadges(address player) external view returns (uint256[] memory) {
        uint256 count = 0;
        for (uint256 i = 1; i <= 7; i++) {
            if (hasBadge[player][i]) count++;
        }

        uint256[] memory badges = new uint256[](count);
        uint256 idx = 0;
        for (uint256 i = 1; i <= 7; i++) {
            if (hasBadge[player][i]) {
                badges[idx] = i;
                idx++;
            }
        }
        return badges;
    }

    /// @notice Get player streak info
    function getStreakInfo(address player) external view returns (uint256 streak, uint256 lastDay) {
        return (currentStreak[player], lastSolveDay[player]);
    }

    // ========== SOULBOUND: Disable transfers ==========

    function transferFrom(address, address, uint256) public pure override {
        revert("Soulbound: transfers disabled");
    }

    function safeTransferFrom(address, address, uint256, bytes memory) public pure override {
        revert("Soulbound: transfers disabled");
    }

    function approve(address, uint256) public pure override {
        revert("Soulbound: approvals disabled");
    }

    function setApprovalForAll(address, bool) public pure override {
        revert("Soulbound: approvals disabled");
    }

    // ========== Metadata ==========

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        uint256 badgeType = tokenBadgeType[tokenId];
        return string(abi.encodePacked(_baseTokenURI, _toString(badgeType), ".json"));
    }

    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits--;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
