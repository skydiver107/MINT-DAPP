/* eslint-disable no-useless-escape */
/* eslint-disable no-unused-vars */
import logo from '../src/assets/image/logo.png';
import './App.css';
import { useState, useEffect } from 'react';
import {ethers} from 'ethers';
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import WaifuClanGenesis from './constants/WaifuClanGenesis.json';

const waifuClanGenesisAddress = "0x2E81e78aa1E4cFe0c2127C8B72E8595E88e8EB63";

const App = () => {
  // const CHAIN_ID = 43113; //This is mainnet ChainID. Provide 43113 if U wan2 test;
  const [mintCount, setMintCount] = useState(1);
  const [isOwner, setIsOwner] = useState(false);
  const [royaltyAddress, setRoyaltyAddress] = useState('');
  const [nftUri, setNftUri] = useState('');
  const [isMintPossible, setIsMintPossible] = useState(false);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  
  const requestAccount = async () => {
    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });
      const networkId = await window.ethereum.request({
        method: "net_version",
      });
      if ( networkId !== 4) {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [
            { chainId: '0x4' }
          ]
        });
      }
      return accounts[0];
    } catch (error) {
      console.log(error);
      return ''
    }

  }

  const mint = async () => {
    if ( isMetamaskInstalled()) {
      const contract = getContract();
      let canUserMint = await contract.canUserMint.call();
      setIsMintPossible(canUserMint);
      try {
        if (canUserMint) {
          let tx = await contract.mint(mintCount);
          await tx.wait();
          toast.success('Mint success', {theme: 'light'})
        } else {
          toast.warn(`You can't mint`, {theme: 'dark'})
        }
      } catch (error) {
        toast.error(`${error.reason || "You rejected request"}`, {theme: 'dark'})
      }
    } 
  }

  const changeMintStatus = async () => {
    if (isMetamaskInstalled()) {
      const contract = getContract();
      let tx = await contract.changeMintingStatus();
      if (isOwner) await tx.wait();
      setIsMintPossible(!isMintPossible);
      toast.success('Mint status changed', {theme: 'light'})
    }
  }

  const reveal = async() => {
    if ( isMetamaskInstalled()) {
      const contract = getContract();
      let tx = await contract.reveal();
      if (isOwner) tx.wait();
      toast.success('Reveal success', { theme: 'light'});
    }
  } 

  const setBaseUri = async ( baseUri ) => {
    if ( isMetamaskInstalled() ) {
      const contract = getContract();
      if (isValidUrl(baseUri)) {
        let tx = await contract.setBaseUri(baseUri);
        if ( isOwner ) tx.wait();
        toast.success('Set BaseUri success', { theme: 'light'});
      } else {
        toast.error("Input valid Url", { theme: 'colored'});
      }
    }
  }

  const setRoyaltyWallet = async (address) => {
    if ( isMetamaskInstalled()) {
      const contract = getContract();
      let isvalidAddress = ethers.utils.isAddress(address);
      if (!isvalidAddress) {
        toast.error("Input valid address", { theme: 'colored'});
        return;
      }
      let tx = await contract.setRoyaltiesWalletAddress(address);
      if ( isOwner ) tx.wait();
      toast.success('Set RoyaltyAddress success', { theme: 'light'});
    }
  }

  const getContract = () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(waifuClanGenesisAddress, WaifuClanGenesis.abi, signer);
    return contract;
  }

  const initialize = async() => {
    let address = await requestAccount();
    const contract = await getContract();
    let owner = await contract.owner();
    console.log("contract owener is", owner)
    let isOwner = address !== '' && address === owner.toLowerCase();
    let canUserMint = await contract.canUserMint.call();
    setIsMintPossible(canUserMint);
    setIsOwner(isOwner);
    setIsWalletConnected(true);
  }

  const isMetamaskInstalled = () => {
    if (typeof window.ethereum !== 'undefined') {
      return true;
    } else {
      toast.error('Install Metamask on Browser', { theme: 'colored'});
      return false;
    }
  }

  const isValidUrl = (baseUri) => {
    let res = baseUri.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);
    return (res !== null)
  }

  const handleChange = (e) => {
    let value = e.target.value;
    let name = e.target.name;
    if (name === 'wallet') {
      setRoyaltyAddress(value)
    } else if (name === 'nftUri') {
      setNftUri(value)
    } else {
      return;
    }
  }

  return (
    <div className="App">
      <div className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
      </div>
      <div className={'btn_wrapper'}>
        {!isOwner && isWalletConnected && <button className={'btn_mint'} onClick={() => mint()}>
              {"MINT NOW"}
        </button>}
        {!isWalletConnected && <button className={'btn_mint'} onClick={() => initialize()}>
              {"CONNECT WALLET"}
        </button>}
        { isOwner && isWalletConnected && <>
            <button className={'btn_mint'} onClick={() => changeMintStatus()}>
                  {isMintPossible ? "Disable Mint" : " EnableMint"}
            </button>
            <button className={'btn_mint'} onClick={() => reveal()}>
                  {"REVEAL"}
            </button>
          </>
        }
        {
          isOwner && isWalletConnected &&
            <div className={'admin_set_part'}>
              <div className={'royalty_wallet'}>
                <input value={royaltyAddress} name={'wallet'} onChange={(e) => handleChange(e)} placeholder={"Input royalty wallet address"}/>
                <button className={'btn_mint'} onClick={() => setRoyaltyWallet(royaltyAddress)}>
                  {"SUBMIT"}
                </button>
              </div>
              <div className={'base_uri'}>
                <input value={nftUri} name={'nftUri'} onChange={(e) => handleChange(e)} placeholder={"Input metadata base uri"} />
                <button className={'btn_mint'} onClick={() => setBaseUri(nftUri)}>
                  {"SUBMIT"}
                </button>
              </div>
            </div>
        }
      </div>
      <ToastContainer />
    </div>
  );
}

export default App;
