import { Contract, providers, utils } from "ethers";
import Head from "next/head";
import React, { useState, useEffect, useRef } from 'react';
import Web3Modal from "web3modal";
import { abi, NFT_CONTRACT_ADDRESS } from "../../constants";
import styles from "../styles/Home.module.css";

export default function Home() {

  // walletConnected to keep track of whether the user's wallet is connected or not
  const [walletConnected, setWalletConnected] = useState(false);

  // presaleStarted to keep track of whether the presale has started or not 
  const [presaleStarted, setPresaleStarted] = useState(false);

  // presaleEnded to keep track of whether the presale has ended or not
  const [presaleEnded, setPresaleEnded] = useState(false);

  // loading is true when waiting for a transaction to be completed
  const [loading, setLoading] = useState(false);

  // checks if the connected wallet is the owner of the contract
  const [isOwner, setIsOwner] = useState(false);

  // tokenIdsMinted to keep track of number of tokens minted
  const [tokenIdsMinted, setTokenIdsMinted] = useState(0);

  // reference to Web3 Modal 
  const web3ModalRef = useRef();

  // mint an NFT during presale
  const presaleMint = async() => {
    try {
      // getting signer as it is a write operation
      const signer = await getProviderOrSigner(true);

      // creating an instance of the NFT contract with a signer 
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);

      // calling the preSaleMint from the contract, only whitelisted users will be able to mint
      const transaction = await nftContract.presaleMint({ value: utils.parseEther("0.01") });
      setLoading(true);

      // waiting for the transaction to finish
      await transaction.wait()
      setLoading(false);

      window.alert("You have successfully minted a CryptoDev NFT");
    } catch (error) {
      console.error(error);
      window.alert("Failed to mint");
    }
  };

  // Mint an NFT after presale has ended
  const publicMint = async() => {
    try {
      const signer = await getProviderOrSigner(true);
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);
      const transaction = await nftContract.mint({
        value: utils.parseEther("0.01"),
      });
      setLoading(true);
      await transaction.wait();
      setLoading(false);
      window.alert("You have successfully minted an NFT");
    } catch (error) {
      console.error(error);
    }
  };

  // connects the metamask wallet
  const connectWallet = async() => {
    try {
      // get provider from web3modal which is metamask
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (error) {
      console.error(error);
    }
  };

  // starts presale
  const startPresale = async() => {
    try {

      // get signer as it is a write transaction 
      const signer = await getProviderOrSigner(true);

      // new instance of the contract
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);

      // calling the startPresale function
      const transaction = await nftContract.startPresale();
      setLoading(true);

      // wait for the transaction to finish
      await transaction.wait();
      setLoading(false);

      await checkIfPresaleStarted();
    } catch (error) {
      console.error(error);
    }
  };

  // checks if presale has started 
  // function implemented only to better readability. the state variable presaleStared is the same thing
  const checkIfPresaleStarted = async() => {
    try {
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
      const _presaleStarted = await nftContract.presaleStarted();
      if (!_presaleStarted) {
        await getOwner();
      }
      setPresaleStarted(_presaleStarted);
      return _presaleStarted;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  // checks if presale has ended 
  const checkIfPresaleEnded = async() => {
    try {
      const signer = await getProviderOrSigner(true);
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);
      const _presaleEnded = await nftContract.presaleEnded();

      // _presaleEnded is a BigNumber so we use lt (less than)
      // Date.now() / 1000 returns the current time in seconds
      const hasEnded = _presaleEnded.lt(Math.floor(Date.now() / 1000));
      if (hasEnded) {
        setPresaleEnded(true);
      } else {
        setPresaleEnded(false);
      }
      return hasEnded;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  const getOwner = async() => {
    try {
      // provider as we are only reading from blockchain
      const provider = await getProviderOrSigner();
      
      // read only access
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);

      // getting owner of the contract
      const _owner = await nftContract.owner();

      // get signer to extract address of the currently connected account
      const signer = await getProviderOrSigner(true); 
      
      // give the address associated to signer which is connected to metamask
      const address = await signer.getAddress();

      if (address.toLowerCase() === _owner.toLowerCase()) {
        setIsOwner(true);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // getTokenIdsMinted: gets the number of tokens minted
  const getTokenIdsMinted = async() => {
    try {
      // getting the provider as it is a read transaction
      const provider = await getProviderOrSigner();

      // making an instance of nft contract
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);

      // _tokenIds is the total number of NFTs minted
      const _tokenIds = await nftContract.tokenIds();

      // _tokenIds is a BigNumber 
      setTokenIdsMinted(_tokenIds.toString());
    } catch (error) {
      console.error(error);
    }
  };

  const getProviderOrSigner = async (needSigner = false) => {
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    // getting the chainId of the current account connected
    const { chainId } = await web3Provider.getNetwork();

    // if user is not connected to sepolia, inform them and throw an error
    if (chainId != 11155111) {
      window.alert("Change network to Sepolia!");
      throw new Error("Change network to Sepolia");
    }
    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };

  // gets triggered when walletConnected state variable has changes
  useEffect(() => {
    // if wallet is not connected, make a reference to the web3Modal to connect to Metamask
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "sepolia",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();

      // check if presale and stared and ended
      const _presaleStarted = checkIfPresaleStarted();
      if (_presaleStarted) {
        checkIfPresaleEnded();
      }

      getTokenIdsMinted();

      // set an interval which gets called every 5 seconds to check if presale has ended or not
      const presaleEndedInterval = setInterval(async function () {
        const _presaleStarted = await checkIfPresaleStarted();
        if (_presaleStarted) {
          const _presaleEnded = checkIfPresaleEnded();
          if (_presaleEnded) {
            clearInterval(presaleEndedInterval);
          }
        }
      }, 5 * 1000);
      
      // set an interval to get the number of tokenIds Minted every 5 seconds
      const tokenIdsMinted = setInterval(async function() {
        await getTokenIdsMinted();
      }, 5 * 1000);  
    }
  }, [walletConnected]);

  // render button: renders button based on state of dapp
  const renderButton = () => {
    // if wallet not connected, render a button to connect to wallet
    if (!walletConnected) {
      return (
        <button onClick={connectWallet} className={styles.button}>
          Connect Your Wallet
        </button>
      );
    }

    // if we are waiting for something to load, return a loading button
    if (loading) {
      return (
        <button className={styles.button}>
          Loading...
        </button>
      );
    }

    // if the connected account is the onwer and presale hasns't started, allow them to start the presale
    if (isOwner && !presaleStarted) {
      return (
        <button onClick={startPresale} className={styles.button}>
          Start Presale!
        </button>
      );
    }

    // if presale has not started, tell user 
    if (!presaleStarted) {
      return (
        <div>
          <div className={styles.description}>
            Presale hasn&#39;t started yet!
          </div>
        </div>
      );
    }

    // if presale has started and not yet ended only whitelisted accounts can mint NFT
    if (presaleStarted && !presaleEnded) {
      return (
        <div>
          <div className={styles.description}>
            Presale has started!!! If your account is whitelisted, Mint a CryptoDev
          </div>
          <button className={styles.button} onClick={presaleMint}>
            Presale Mint 🚀
          </button>
        </div>
      );
    }

    // if presale has ended allow public minting
    if (presaleStarted && presaleEnded) {
      return (
        <button className={styles.button} onClick={publicMint}>
          Mint a CryptoDev 🚀
        </button>
      );
    }
  };

  return (
    <div>
      <Head>
        <title>Crypto Devs</title>
        <meta name="description" content="Whitelist-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Crypto Devs!</h1>
          <div className={styles.description}>
            It&#39;s an NFT collection for developers in Crypto.
          </div>
          <div className={styles.description}>
            {tokenIdsMinted}/20 have been minted
          </div>
          {renderButton()}
        </div>
        <div>
          <img className={styles.image} src="./cryptodevs/0.svg" />
        </div>
      </div>

      <footer className={styles.footer}>
        Made with &#10084; by Crypto Devs
      </footer>
    </div>
  );
}
