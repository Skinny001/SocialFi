// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/SocialFi.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address initialOwner = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);
        
        SocialFi socialFi = new SocialFi(initialOwner);
        
        // Fund the pool with a small amount if deploying with funds
        // socialFi.fundPool{value: 0.01 ether}();
        
        vm.stopBroadcast();
        
        console.log("SocialFi deployed to:", address(socialFi));
    }
}
