// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/SocialFi.sol";

contract SocialFiTest is Test {
    SocialFi public socialFi;
    address public admin = address(1);
    address public alice = address(2);
    address public bob = address(3);
    address public charlie = address(4);
    address public moderator = address(5);

    function setUp() public {
        vm.warp(1000);
        vm.prank(admin);
        socialFi = new SocialFi(admin);
        
        vm.deal(admin, 10 ether);
        vm.prank(admin);
        socialFi.fundPool{value: 1 ether}();
        
        vm.prank(admin);
        socialFi.addModerator(moderator);
        
        vm.deal(alice, 10 ether);
        vm.deal(bob, 10 ether);
        vm.deal(charlie, 10 ether);
    }
    
    // Handle tests
    function test_RegisterHandle_Valid() public {
        vm.prank(alice);
        socialFi.registerHandle("alice", "hello", "");
        
        SocialFi.Profile memory p = socialFi.getProfile(alice);
        assertEq(p.handle, "alice");
        assertEq(p.bio, "hello");
        assertTrue(p.exists);
        
        address owner = socialFi.handleToAddress("ALICE");
        assertEq(owner, alice);
    }
    
    function test_RegisterHandle_InvalidLength() public {
        vm.prank(alice);
        vm.expectRevert("invalid handle length");
        socialFi.registerHandle("al", "hello", "");
        
        vm.prank(alice);
        vm.expectRevert("invalid handle length");
        socialFi.registerHandle("thisiswaytoolongtobeavalidhandle123", "hello", "");
    }
    
    function test_RegisterHandle_InvalidChars() public {
        vm.prank(alice);
        vm.expectRevert("invalid handle");
        socialFi.registerHandle("ali@ce", "hello", "");
        
        vm.prank(alice);
        vm.expectRevert("invalid handle");
        socialFi.registerHandle("alIce", "hello", ""); 
    }
    
    function test_RegisterHandle_Uniqueness() public {
        vm.prank(alice);
        socialFi.registerHandle("alice", "hello", "");
        
        vm.prank(bob);
        vm.expectRevert("handle taken");
        socialFi.registerHandle("ALICE", "hello2", "");
    }
    
    function test_RegisterHandle_OnePerAddress() public {
        vm.prank(alice);
        socialFi.registerHandle("alice", "hello", "");
        
        vm.prank(alice);
        vm.expectRevert("profile exists");
        socialFi.registerHandle("alice2", "hello", "");
    }

    // Posting tests
    function test_CreatePost_Valid() public {
        vm.startPrank(alice);
        socialFi.registerHandle("alice", "hello", "");
        socialFi.createPost("first post", 0);
        
        SocialFi.Post memory p = socialFi.getPost(1);
        assertEq(p.text, "first post");
        assertEq(p.author, alice);
        assertEq(p.parentId, 0);
        vm.stopPrank();
    }
    
    function test_CreatePost_LengthBounds() public {
        vm.startPrank(alice);
        socialFi.registerHandle("alice", "hello", "");
        vm.expectRevert("invalid text");
        socialFi.createPost("", 0);
        
        string memory longStr = new string(281);
        vm.expectRevert("invalid text");
        socialFi.createPost(longStr, 0);
        vm.stopPrank();
    }
    
    function test_CreatePost_Interval() public {
        vm.startPrank(alice);
        socialFi.registerHandle("alice", "hello", "");
        socialFi.createPost("post 1", 0);
        
        vm.expectRevert("posting too fast");
        socialFi.createPost("post 2", 0);
        
        vm.warp(block.timestamp + 30);
        socialFi.createPost("post 2", 0);
        vm.stopPrank();
    }
    
    function test_CreatePost_Reply() public {
        vm.prank(alice);
        socialFi.registerHandle("alice", "", "");
        vm.prank(alice);
        socialFi.createPost("post 1", 0);
        
        vm.prank(bob);
        socialFi.registerHandle("bob", "", "");
        vm.prank(bob);
        socialFi.createPost("reply 1", 1);
        
        SocialFi.Post memory p = socialFi.getPost(1);
        assertEq(p.replies, 1);
        
        SocialFi.Post memory p2 = socialFi.getPost(2);
        assertEq(p2.parentId, 1);
    }
    
    function test_HidePost() public {
        vm.prank(alice);
        socialFi.registerHandle("alice", "", "");
        vm.prank(alice);
        socialFi.createPost("post 1", 0);
        
        vm.prank(bob);
        vm.expectRevert("not authorized");
        socialFi.hidePost(1);
        
        vm.prank(moderator);
        socialFi.hidePost(1);
        
        SocialFi.Post memory p = socialFi.getPost(1);
        assertTrue(p.hidden);
    }

    // Rewards tests
    function test_Rewards_DailyCap_And_Rollover() public {
        vm.startPrank(alice);
        socialFi.registerHandle("alice", "", "");
        
        for (uint i = 0; i < 4; i++) {
            socialFi.createPost("post", 0);
            vm.warp(block.timestamp + 30);
        }
        vm.stopPrank();
        
        assertEq(socialFi.pendingRewards(alice), 0.0003 ether);
        
        vm.warp(block.timestamp + 1 days);
        vm.startPrank(alice);
        socialFi.createPost("post new day", 0);
        vm.stopPrank();
        
        assertEq(socialFi.pendingRewards(alice), 0.0004 ether);
    }
    
    function test_Rewards_LikeCap_And_SelfLike() public {
        vm.prank(alice);
        socialFi.registerHandle("alice", "", "");
        vm.prank(alice);
        socialFi.createPost("post 1", 0);
        
        vm.prank(alice);
        socialFi.likePost(1);
        
        assertEq(socialFi.pendingRewards(alice), 0.0001 ether);
        
        vm.prank(bob);
        socialFi.registerHandle("bob", "", "");
        vm.prank(bob);
        socialFi.likePost(1);
        
        assertEq(socialFi.pendingRewards(alice), 0.00015 ether); 
        
        vm.prank(admin);
        socialFi.setRewardConfig(0.0001 ether, 0.00005 ether, 3, 2, 30);
        
        vm.prank(charlie);
        socialFi.registerHandle("charlie", "", "");
        vm.prank(charlie);
        socialFi.likePost(1);
        
        assertEq(socialFi.pendingRewards(alice), 0.00020 ether);
        
        address dave = address(6);
        vm.prank(dave);
        socialFi.registerHandle("dave", "", "");
        vm.prank(dave);
        socialFi.likePost(1); 
        
        assertEq(socialFi.pendingRewards(alice), 0.00020 ether);
    }
    
    function test_Rewards_InsufficientPool() public {
        vm.prank(alice);
        socialFi.registerHandle("alice", "", "");
        
        SocialFi emptyPool = new SocialFi(admin);
        
        vm.prank(alice);
        emptyPool.registerHandle("alice", "", "");
        vm.prank(alice);
        emptyPool.createPost("post", 0);
        
        assertEq(emptyPool.pendingRewards(alice), 0);
    }
    
    function test_Rewards_Claim() public {
        vm.startPrank(alice);
        socialFi.registerHandle("alice", "", "");
        socialFi.createPost("post 1", 0);
        vm.stopPrank();
        
        assertEq(socialFi.pendingRewards(alice), 0.0001 ether);
        
        uint256 preBalance = alice.balance;
        vm.prank(alice);
        socialFi.claimRewards();
        
        assertEq(socialFi.pendingRewards(alice), 0);
        assertEq(alice.balance, preBalance + 0.0001 ether);
    }

    // Solvency tests
    function test_SolvencyInvariant() public {
        vm.startPrank(alice);
        socialFi.registerHandle("alice", "", "");
        socialFi.createPost("post 1", 0);
        vm.stopPrank();
        
        assertTrue(address(socialFi).balance >= socialFi.totalPending());
        
        vm.prank(bob);
        socialFi.registerHandle("bob", "", "");
        vm.prank(bob);
        socialFi.tip{value: 1 ether}(1);
        
        assertTrue(address(socialFi).balance >= socialFi.totalPending());
    }

    // Tipping tests
    function test_Tip_Valid() public {
        vm.prank(alice);
        socialFi.registerHandle("alice", "", "");
        vm.prank(alice);
        socialFi.createPost("post 1", 0);
        
        vm.prank(bob);
        socialFi.registerHandle("bob", "", "");
        
        uint256 alicePre = alice.balance;
        vm.prank(bob);
        socialFi.tip{value: 0.5 ether}(1);
        
        assertEq(alice.balance, alicePre + 0.5 ether);
        SocialFi.Post memory p = socialFi.getPost(1);
        assertEq(p.tipsReceived, 0.5 ether);
    }
    
    function test_Tip_RevertHiddenOrZero() public {
        vm.prank(alice);
        socialFi.registerHandle("alice", "", "");
        vm.prank(alice);
        socialFi.createPost("post 1", 0);
        
        vm.prank(bob);
        socialFi.registerHandle("bob", "", "");
        
        vm.prank(bob);
        vm.expectRevert("tip unavailable");
        socialFi.tip{value: 0}(1);
        
        vm.prank(alice);
        socialFi.hidePost(1);
        
        vm.prank(bob);
        vm.expectRevert("tip unavailable");
        socialFi.tip{value: 0.5 ether}(1);
    }

    // Follow tests
    function test_Follow() public {
        vm.prank(alice);
        socialFi.registerHandle("alice", "", "");
        vm.prank(bob);
        socialFi.registerHandle("bob", "", "");
        
        vm.prank(alice);
        socialFi.follow(bob);
        
        SocialFi.Profile memory pa = socialFi.getProfile(alice);
        SocialFi.Profile memory pb = socialFi.getProfile(bob);
        
        assertEq(pa.following, 1);
        assertEq(pb.followers, 1);
        assertTrue(socialFi.isFollowing(alice, bob));
        
        vm.prank(alice);
        vm.expectRevert("already following");
        socialFi.follow(bob);
        
        vm.prank(alice);
        vm.expectRevert("invalid user");
        socialFi.follow(alice);
    }
}
