// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/CipherTrail.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        CipherTrail trail = new CipherTrail();
        console.log("CipherTrail deployed at", address(trail));
        vm.stopBroadcast();
    }
}
