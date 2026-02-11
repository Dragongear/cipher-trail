// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title CipherTrail
 * @notice Daily puzzle with commit-reveal. Players commit hash(answer,salt,sender,day), then reveal; contract verifies and awards points.
 */
contract CipherTrail {
    event Committed(address indexed player, uint256 day, bytes32 commitment);
    event Solved(address indexed player, uint256 day, uint256 points);

    uint256 public constant BASE_POINTS = 100;
    uint256 public constant MAX_TIME_BONUS = 50;
    uint256 public constant SECONDS_PER_DAY = 86400;

    mapping(uint256 => bytes32) public answerHash; // day => keccak256(answer)
    mapping(address => mapping(uint256 => bytes32)) public commitments;
    mapping(address => mapping(uint256 => bool)) public hasSolved;

    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /// @notice Set the answer hash for a day (keccak256 of the correct answer string). Call once per day.
    function setAnswerHash(uint256 day, bytes32 _answerHash) external onlyOwner {
        answerHash[day] = _answerHash;
    }

    /// @notice Commit to an answer. commitment = keccak256(abi.encodePacked(answer, salt, msg.sender, day))
    function commit(bytes32 commitment, uint256 day) external {
        require(commitment != bytes32(0), "Zero commitment");
        require(commitments[msg.sender][day] == bytes32(0), "Already committed");
        commitments[msg.sender][day] = commitment;
        emit Committed(msg.sender, day, commitment);
    }

    /// @notice Reveal answer and salt. Contract verifies commitment and answer hash, then awards points.
    function reveal(
        string calldata answer,
        bytes32 salt,
        uint256 day
    ) external {
        require(answerHash[day] != bytes32(0), "Answer not set for day");
        require(commitments[msg.sender][day] != bytes32(0), "Not committed");
        require(!hasSolved[msg.sender][day], "Already solved");

        bytes32 expectedCommitment = keccak256(
            abi.encodePacked(answer, salt, msg.sender, day)
        );
        require(
            commitments[msg.sender][day] == expectedCommitment,
            "Commitment mismatch"
        );

        require(
            keccak256(abi.encodePacked(answer)) == answerHash[day],
            "Wrong answer"
        );

        hasSolved[msg.sender][day] = true;

        uint256 dayStart = day * SECONDS_PER_DAY;
        uint256 elapsed = block.timestamp > dayStart
            ? block.timestamp - dayStart
            : 0;
        if (elapsed > SECONDS_PER_DAY) elapsed = SECONDS_PER_DAY;
        uint256 bonus = (MAX_TIME_BONUS * (SECONDS_PER_DAY - elapsed)) /
            SECONDS_PER_DAY;
        uint256 points = BASE_POINTS + bonus;

        emit Solved(msg.sender, day, points);
    }

    /// @notice Get current UTC day index from block timestamp.
    function getCurrentDay() public view returns (uint256) {
        return block.timestamp / SECONDS_PER_DAY;
    }

    function hasCommitted(address player, uint256 day) external view returns (bool) {
        return commitments[player][day] != bytes32(0);
    }
}
