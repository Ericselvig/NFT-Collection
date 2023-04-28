const { ethers } = require('hardhat');
require("dotenv").config({ path: ".env" });
const { WHITELIST_CONTRACT_ADDRESS, METADATA_URL } = require("../constants");

async function main() {
  // Address of whitelist contract
  const whitelistContract = WHITELIST_CONTRACT_ADDRESS;

  // URL to extract metadata for the CryptoDev NFT
  const metadataURL = METADATA_URL;

  // cryptoDevsContract is the factory for making instances of CryptoDevs contract
  const cryptoDevsContract = await ethers.getContractFactory("CryptoDevs"); 

  // deploying the contract
  const deployedCryptoDevsContract = await cryptoDevsContract.deploy(
    metadataURL,
    whitelistContract
  );
  
  // wait for deployment to finish
  await deployedCryptoDevsContract.deployed(); 

  // printing the address of the deployed contract
  console.log(deployedCryptoDevsContract.address);
}

// calling the main function 
main() 
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });