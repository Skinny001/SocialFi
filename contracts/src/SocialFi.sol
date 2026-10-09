// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract SocialFi is Ownable, Pausable, ReentrancyGuard {
    uint256 public constant MAX_HANDLE_LENGTH = 20;
    uint256 public constant MAX_BIO_LENGTH = 160;
    uint256 public constant MAX_POST_LENGTH = 280;

    struct Profile { string handle; string bio; string avatarCid; uint32 followers; uint32 following; uint32 postCount; uint64 createdAt; bool exists; }
    struct Post { uint256 id; address author; string text; uint256 parentId; uint64 createdAt; uint32 likes; uint32 replies; uint256 tipsReceived; bool hidden; }

    mapping(address => Profile) public profiles;
    mapping(bytes32 => address) public handleOwner;
    Post[] private posts;
    mapping(address => uint256[]) private postsByAuthor;
    mapping(uint256 => uint256[]) private repliesOf;
    mapping(uint256 => mapping(address => bool)) public liked;
    mapping(address => mapping(address => bool)) public isFollowing;
    mapping(address => address[]) private followingList;
    mapping(address => uint256) public pendingRewards;
    mapping(address => uint256) public totalEarned;
    mapping(address => mapping(uint32 => uint8)) private rewardedPostsPerDay;
    mapping(uint256 => uint16) public rewardedLikes;
    mapping(address => uint64) public lastPostAt;
    mapping(address => bool) public moderators;
    uint256 public postReward = 0.0001 ether;
    uint256 public likeReward = 0.00005 ether;
    uint8 public maxRewardedPostsPerDay = 3;
    uint16 public maxRewardedLikesPerPost = 20;
    uint64 public minPostInterval = 30;
    uint256 public totalPending;
    uint256 public platformFeeBps;

    event HandleRegistered(address indexed user, string handle);
    event PostCreated(uint256 indexed id, address indexed author, uint256 parentId);
    event Liked(uint256 indexed id, address indexed user);
    event Followed(address indexed follower, address indexed user);
    event Unfollowed(address indexed follower, address indexed user);
    event Tipped(uint256 indexed postId, address indexed from, address indexed to, uint256 amount);
    event RewardAccrued(address indexed user, uint256 amount, string reason);
    event RewardClaimed(address indexed user, uint256 amount);
    event PostHidden(uint256 indexed id, address indexed by);

    modifier onlyRegistered() { require(profiles[msg.sender].exists, "profile required"); _; }
    modifier validPost(uint256 id) { require(id > 0 && id < posts.length, "invalid post"); _; }

    constructor(address initialOwner) Ownable(initialOwner) { posts.push(); }

    function registerHandle(string calldata handle, string calldata bio, string calldata avatarCid) external whenNotPaused {
        require(!profiles[msg.sender].exists, "profile exists");
        bytes memory value = bytes(handle);
        require(value.length >= 3 && value.length <= MAX_HANDLE_LENGTH, "invalid handle length");
        bytes32 key = keccak256(_lower(handle));
        require(handleOwner[key] == address(0), "handle taken");
        require(_validHandle(value), "invalid handle");
        require(bytes(bio).length <= MAX_BIO_LENGTH, "bio too long");
        profiles[msg.sender] = Profile(handle, bio, avatarCid, 0, 0, 0, uint64(block.timestamp), true);
        handleOwner[key] = msg.sender;
        emit HandleRegistered(msg.sender, handle);
    }

    function updateProfile(string calldata bio, string calldata avatarCid) external onlyRegistered { require(bytes(bio).length <= MAX_BIO_LENGTH, "bio too long"); profiles[msg.sender].bio = bio; profiles[msg.sender].avatarCid = avatarCid; }

    function createPost(string calldata text, uint256 parentId) external onlyRegistered whenNotPaused {
        require(bytes(text).length > 0 && bytes(text).length <= MAX_POST_LENGTH, "invalid text");
        require(block.timestamp >= lastPostAt[msg.sender] + minPostInterval, "posting too fast");
        if (parentId != 0) { require(parentId < posts.length, "invalid parent"); posts[parentId].replies++; repliesOf[parentId].push(posts.length); }
        uint256 id = posts.length;
        posts.push(Post(id, msg.sender, text, parentId, uint64(block.timestamp), 0, 0, 0, false));
        postsByAuthor[msg.sender].push(id); profiles[msg.sender].postCount++; lastPostAt[msg.sender] = uint64(block.timestamp);
        uint32 day = uint32(block.timestamp / 1 days);
        if (rewardedPostsPerDay[msg.sender][day] < maxRewardedPostsPerDay) { rewardedPostsPerDay[msg.sender][day]++; _accrue(msg.sender, postReward, "post"); }
        emit PostCreated(id, msg.sender, parentId);
    }

    function likePost(uint256 id) external onlyRegistered whenNotPaused validPost(id) { require(!liked[id][msg.sender], "already liked"); liked[id][msg.sender] = true; posts[id].likes++; if (posts[id].author != msg.sender && rewardedLikes[id] < maxRewardedLikesPerPost) { rewardedLikes[id]++; _accrue(posts[id].author, likeReward, "like"); } emit Liked(id, msg.sender); }
    function follow(address user) external onlyRegistered whenNotPaused { require(user != msg.sender && profiles[user].exists, "invalid user"); require(!isFollowing[msg.sender][user], "already following"); isFollowing[msg.sender][user] = true; followingList[msg.sender].push(user); profiles[msg.sender].following++; profiles[user].followers++; emit Followed(msg.sender, user); }
    function unfollow(address user) external onlyRegistered { require(isFollowing[msg.sender][user], "not following"); isFollowing[msg.sender][user] = false; profiles[msg.sender].following--; profiles[user].followers--; emit Unfollowed(msg.sender, user); }
    function tip(uint256 id) external payable nonReentrant onlyRegistered validPost(id) { Post storage post = posts[id]; require(!post.hidden && msg.value > 0, "tip unavailable"); uint256 fee = msg.value * platformFeeBps / 10000; post.tipsReceived += msg.value - fee; (bool sent,) = payable(post.author).call{value: msg.value - fee}(""); require(sent, "tip failed"); emit Tipped(id, msg.sender, post.author, msg.value); }
    function claimRewards() external nonReentrant { uint256 amount = pendingRewards[msg.sender]; require(amount > 0, "no rewards"); pendingRewards[msg.sender] = 0; totalPending -= amount; (bool sent,) = payable(msg.sender).call{value: amount}(""); require(sent, "claim failed"); emit RewardClaimed(msg.sender, amount); }
    function hidePost(uint256 id) external validPost(id) { require(posts[id].author == msg.sender || moderators[msg.sender] || owner() == msg.sender, "not authorized"); posts[id].hidden = true; emit PostHidden(id, msg.sender); }

    function fundPool() external payable onlyOwner {}
    function setRewardConfig(uint256 _postReward, uint256 _likeReward, uint8 _maxPosts, uint16 _maxLikes, uint64 _interval) external onlyOwner { postReward = _postReward; likeReward = _likeReward; maxRewardedPostsPerDay = _maxPosts; maxRewardedLikesPerPost = _maxLikes; minPostInterval = _interval; }
    function setPlatformFee(uint256 bps) external onlyOwner { require(bps <= 1000, "fee too high"); platformFeeBps = bps; }
    function addModerator(address user) external onlyOwner { moderators[user] = true; }
    function removeModerator(address user) external onlyOwner { moderators[user] = false; }
    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    function getPost(uint256 id) external view validPost(id) returns (Post memory) { return posts[id]; }
    function getPosts(uint256 offset, uint256 limit) external view returns (Post[] memory result) { return _page(posts.length, offset, limit, false, address(0), 0); }
    function getPostsByAuthor(address author, uint256 offset, uint256 limit) external view returns (Post[] memory result) { uint256[] storage ids = postsByAuthor[author]; result = new Post[](_count(ids.length, offset, limit)); for (uint256 i=0;i<result.length;i++) result[i] = posts[ids[ids.length-1-offset-i]]; }
    function getReplies(uint256 parentId, uint256 offset, uint256 limit) external view returns (Post[] memory result) { uint256[] storage ids = repliesOf[parentId]; result = new Post[](_count(ids.length, offset, limit)); for (uint256 i=0;i<result.length;i++) result[i] = posts[ids[ids.length-1-offset-i]]; }
    function getProfile(address user) external view returns (Profile memory) { return profiles[user]; }
    function handleToAddress(string calldata handle) external view returns (address) { return handleOwner[keccak256(_lower(handle))]; }
    function getFollowing(address user) external view returns (address[] memory) { return followingList[user]; }
    function poolBalance() external view returns (uint256) { return address(this).balance - totalPending; }
    receive() external payable {}

    function _accrue(address user, uint256 amount, string memory reason) internal { if (amount > 0 && address(this).balance >= totalPending + amount) { pendingRewards[user] += amount; totalEarned[user] += amount; totalPending += amount; emit RewardAccrued(user, amount, reason); } }
    function _count(uint256 length, uint256 offset, uint256 limit) internal pure returns (uint256) { if (offset >= length) return 0; uint256 remaining = length - offset; return remaining < limit ? remaining : limit; }
    function _page(uint256 length, uint256 offset, uint256 limit, bool, address, uint256) internal view returns (Post[] memory result) { uint256 count = _count(length - 1, offset, limit); result = new Post[](count); for (uint256 i=0;i<count;i++) result[i] = posts[length - 1 - offset - i]; }
    function _validHandle(bytes memory value) internal pure returns (bool) { for (uint256 i=0;i<value.length;i++) { bytes1 c = value[i]; if (!((c >= 0x61 && c <= 0x7a) || (c >= 0x30 && c <= 0x39) || c == 0x5f)) return false; } return true; }
    function _lower(string calldata input) internal pure returns (bytes memory result) { bytes memory value = bytes(input); result = new bytes(value.length); for(uint256 i=0;i<value.length;i++){ bytes1 c=value[i]; result[i]=(c>=0x41&&c<=0x5A)?bytes1(uint8(c)+32):c; } }
}
