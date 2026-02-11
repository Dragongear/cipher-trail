// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/CipherTrail.sol";

contract CipherTrailTest is Test {
    CipherTrail public trail;

    address public owner;
    address public player1;
    address public player2;

    uint256 public constant DAY = 20000; // arbitrary day index

    function setUp() public {
        owner = address(1);
        player1 = address(2);
        player2 = address(3);
        vm.prank(owner);
        trail = new CipherTrail();
    }

    function test_CommitRevealFlow() public {
        string memory answer = "secret";
        bytes32 answerHash = keccak256(abi.encodePacked(answer));
        vm.prank(owner);
        trail.setAnswerHash(DAY, answerHash);

        bytes32 salt = keccak256("randomsalt");
        bytes32 commitment = keccak256(
            abi.encodePacked(answer, salt, player1, DAY)
        );

        vm.prank(player1);
        trail.commit(commitment, DAY);
        assertTrue(trail.hasCommitted(player1, DAY));

        vm.warp(DAY * 86400 + 3600); // 1 hour into day
        vm.prank(player1);
        trail.reveal(answer, salt, DAY);

        assertTrue(trail.hasSolved(player1, DAY));
    }

    function test_CannotRevealWithoutCommit() public {
        string memory answer = "secret";
        bytes32 answerHash = keccak256(abi.encodePacked(answer));
        vm.prank(owner);
        trail.setAnswerHash(DAY, answerHash);

        vm.prank(player1);
        vm.expectRevert("Not committed");
        trail.reveal(answer, keccak256("salt"), DAY);
    }

    function test_CannotSolveTwice() public {
        string memory answer = "secret";
        bytes32 answerHash = keccak256(abi.encodePacked(answer));
        vm.prank(owner);
        trail.setAnswerHash(DAY, answerHash);

        bytes32 salt = keccak256("salt");
        bytes32 commitment = keccak256(
            abi.encodePacked(answer, salt, player1, DAY)
        );
        vm.prank(player1);
        trail.commit(commitment, DAY);

        vm.warp(DAY * 86400 + 100);
        vm.prank(player1);
        trail.reveal(answer, salt, DAY);

        vm.prank(player1);
        vm.expectRevert("Already solved");
        trail.reveal(answer, salt, DAY);
    }

    function test_WrongAnswerReverts() public {
        string memory answer = "secret";
        bytes32 answerHash = keccak256(abi.encodePacked(answer));
        vm.prank(owner);
        trail.setAnswerHash(DAY, answerHash);

        bytes32 salt = keccak256("salt");
        bytes32 commitment = keccak256(
            abi.encodePacked("wrong", salt, player1, DAY)
        );
        vm.prank(player1);
        trail.commit(commitment, DAY);

        vm.prank(player1);
        vm.expectRevert("Wrong answer");
        trail.reveal("wrong", salt, DAY);
    }

    function test_TimeBonusFasterMorePoints() public {
        string memory answer = "secret";
        bytes32 answerHash = keccak256(abi.encodePacked(answer));
        vm.prank(owner);
        trail.setAnswerHash(DAY, answerHash);

        // Player1 solves 1 hour in
        bytes32 salt1 = keccak256("salt1");
        vm.prank(player1);
        trail.commit(
            keccak256(abi.encodePacked(answer, salt1, player1, DAY)),
            DAY
        );
        vm.warp(DAY * 86400 + 3600);
        vm.prank(player1);
        vm.expectEmit(true, true, true, true);
        emit Solved(player1, DAY, 100 + 50 * (86400 - 3600) / 86400);
        trail.reveal(answer, salt1, DAY);
    }
}
