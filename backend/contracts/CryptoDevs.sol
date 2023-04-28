// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IWhitelist.sol";

contract CryptoDevs is ERC721Enumerable, Ownable {
    
    // _baseTokenURI is the base URI for all URIs
    string _baseTokenURI;

    // _price is the price of one CryptoDev NFT
    uint256 public _price = 0.01 ether;

    // _paused is used to stop the contract in case of an emergency
    bool public _paused;

    // max number of CryptoDevs NFTs
    uint256 public maxTokenIds = 20;

    // total number of tokenIds minted
    uint256 public tokenIds;

    // Whitelist contract Interface
    IWhitelist whitelist;

    // bool to keep track of whether the presale started 
    bool public presaleStarted;

    // timestamp for when the presale will end
    uint256 public presaleEnded;

    modifier onlyWhenNotPaused {
        require(!_paused, "Contract is currently paused");
        _;
    }

    // constructor to set the baseURI and make instance of whitelist interface,
    // The ERC721 constrctor takes name of the token and the symbol
    constructor(string memory baseURI, address whitelistContract) ERC721("CryptoDevs", "$CD") {
        _baseTokenURI = baseURI;
        whitelist = IWhitelist(whitelistContract);
    }

    // startPresale starts presale for the whitelisted accounts 
    function startPresale() public onlyOwner {
        presaleStarted = true;
        presaleEnded = block.timestamp + 5 minutes;
    }

    // presaleMint allows user to mint 1 NFT per transaction during presale
    function presaleMint() public payable onlyWhenNotPaused() {
        require (presaleStarted && block.timestamp < presaleEnded, "Presale is not running");
        require (whitelist.whitelistedAddresses(msg.sender), "You are not whitelisted");
        require (tokenIds < maxTokenIds, "exceeded max supply of CryptoDevs");
        require (msg.value >= _price, "amount of ether sent is not correct");
        tokenIds++;

        _safeMint(msg.sender, tokenIds);
    }

    // allows users to mint 1 NFT per transaction after the presale has ended
    function mint() public payable onlyWhenNotPaused {
        require(presaleStarted && block.timestamp >= presaleEnded, "Presale has not yet ended");
        require(tokenIds < maxTokenIds, "exceeded max supply of CryptoDevs");
        require(msg.value >= _price, "amount of ether sent is not correct");
        tokenIds++;

        _safeMint(msg.sender, tokenIds);
    }

    // overrites the _baseURI implementation of openzeppelin which returns an empty string 
    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }

    // makes the contract stay paused or unpaused
    function setPaused(bool val) public onlyOwner {
        _paused = val;
    }

    // withdraw sends all the ether in the contract to the owner of the contract 
    function withdraw() public onlyOwner() {
        address _owner = owner();
        uint256 amount = address(this).balance;
        (bool sent, ) = _owner.call{value: amount}("");
        require(sent, "Failed to send Ether");
    }

    /*
        receive() and fallback() are special type of functions that are implemented when the contract expects ETH to be sent 
        ref: https://solidity-by-example.org/sending-ether/
    */

    // function to recieve ether, msg.data must be empty
    receive() external payable{}

    // fallback function is called when msg.data is not empty
    fallback() external payable{}

}

