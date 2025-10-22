import React, { useState, useEffect } from "react";
import Web3Modal from "web3modal";
import { ethers } from "ethers";

// imports for internal purpose
import tracking from "./contract/Tracking.json";
const ContractAddress = "0xcB45ea683e4c6ba4220737de2a60343C71987E52";
const ContractABI = tracking.abi;

// functions for fetching Purpose

const fetchContract = (signerOrProvider) =>
  new ethers.Contract(ContractAddress, ContractABI, signerOrProvider);

export const TrackingContext = React.createContext();

export const TrackingProvider = ({ children }) => {
  // STATE VARIABLE

  const DappName = "Product Tracking Dapp";

  const [currentUser, setCurrentUser] = useState("");

  const createShipment = async (items) => {
    console.log(items);
    const { receiver, pickupTime, distance, price } = items;

    try {
      const web3Modal = new Web3Modal();
      const connection = await web3Modal.connect();
      const provider = new ethers.providers.Web3Provider(connection);
      const signer = provider.getSigner();
      const contract = fetchContract(signer);
      console.log(contract);
      const createItem = await contract.createshipment(
        receiver,
        new Date(pickupTime).getTime(),
        distance,
        ethers.utils.parseUnits(price, 18),
        {
          value: ethers.utils.parseUnits(price, 18),
        }
      );
      await createItem.wait();
      console.log(createItem);
    } catch (error) {
      console.log("something Went Wrong", error);
    }
  };

  const getAllShipment = async () => {
    try {
      // Change this line
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = fetchContract(provider);
      console.log("i am here to get all shipments");

      const shipment = await contract.getAlltransactions();
      console.log("getting it",shipment);
      const allShipments = shipment.map((shipment) => ({
        sender: shipment.sender,
        receiver: shipment.receiver,
        price: ethers.utils.formatEther(shipment.price.toString()),
        pickupTime: shipment.pickupTime.toNumber(),
        deliveryTime: shipment.deliveryTime.toNumber(),
        distance: shipment.distance.toNumber(),
        isPaid: shipment.ispaid,
        status: shipment.status,
      }));
      console.log("ALL Shipments",allShipments);
      return allShipments;
    } catch (error) {
      console.log("error want, getting Shipment", error);
    }
  };

  const getShipmentCount = async () => {
    try {
      if (!window.ethereum) return "Install MetaMask";

      const account = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      // Change this line
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = fetchContract(provider);
      const shipmentCount = await contract.getShipmentCount(account[0]);
      return shipmentCount.toNumber();
    } catch (error) {
      console.log("error want , getting shipment", error);
    }
  };

  const completeShipment = async (completeShip) => {
    console.log(completeShip);
    const { receiver, index } = completeShip;
    try {
      if (!window.ethereum) return "Install Metamask";

      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });
      const web3Modal = new Web3Modal();
      const connection = await web3Modal.connect();
      const provider = new ethers.providers.Web3Provider(connection);
      const signer = provider.getSigner();
      const contract = fetchContract(signer);

      const transaction = await contract.completeShipment(
        accounts[0],
        receiver,
        index,
        {
          gasLimit: 300000,
        }
      );
      await transaction.wait();
      console.log(transaction);
    } catch (error) {
      console.log("wrong completeShipment", error);
    }
  };

  const getShipment = async (index) => {
    console.log(index * 1);
    try {
      if (!window.ethereum) return "Install Metamask";

      const account = await window.ethereum.request({
        method: "eth_accounts",
      });
      const provider = new ethers.providers.JsonRpcProvider();
      const contract = fetchContract(provider);
      const shipment = await contract.getShipment(account[0], index * 1);

      const SingleShipment = {
        sender: shipment[0],
        receiver: shipment[1],
        pickupTime: shipment[2].toNumber(),
        deliveryTime: shipment[3].toNumber(),
        distance: shipment[4].toNumber(),
        price: ethers.utils.formatEther(shipment[5].toString()),
        status: shipment[6],
        isPaid: shipment[7],
      };
      return SingleShipment;
    } catch (error) {
      console.log("Sorry No Shipment");
    }
  };

  const startShipment = async (getProduct) => {
    const { receiver, index } = getProduct;
    try {
      if (!window.ethereum) return "install MetaMask";

      // Basic validations
      if (!receiver || !index) {
        throw new Error("Missing required parameters");
      }

      // Validate receiver address
      if (!ethers.utils.isAddress(receiver)) {
        throw new Error("Invalid Ethereum address format for receiver");
      }

      const web3Modal = new Web3Modal();
      const connection = await web3Modal.connect();
      const provider = new ethers.providers.Web3Provider(connection);
      const signer = provider.getSigner();
      const contract = fetchContract(signer);

      // Get the current account
      const accounts = await provider.listAccounts();
      const account = accounts[0];

      // Add try-catch for the actual transaction
      try {
        const shipment = await contract.startShipment(
          account,
          receiver,
          Number(index),
          {
            gasLimit: 300000,
            // Add gasPrice estimation
            gasPrice: await provider.getGasPrice()
          }
        );

        // Wait for transaction confirmation
        const receipt = await shipment.wait();
        
        // Check transaction status
        if (receipt.status === 0) {
          throw new Error("Transaction failed");
        }

        console.log("Shipment started successfully:", receipt);
        return receipt;

      } catch (txError) {
        // Handle specific transaction errors
        if (txError.code === 'CALL_EXCEPTION') {
          throw new Error(`Transaction reverted: ${txError.reason || 'Unknown reason'}`);
        }
        throw txError;
      }

    } catch (error) {
      console.error("Error in startShipment:", error);
      throw error;
    }
  };

  const checkIfWalletConnected = async () => {
    try {
      if (!window.ethereum) return "Install Metamask";
      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });

      if (accounts.length) {
        setCurrentUser(accounts[0]);
      } else {
        return "No account";
      }
    } catch (error) {
      return "not connected";
    }
  };

  // connect Wallet Function
  const connectWallet = async () => {
    try {
      if (!window.ethereum) return "Install Metamask";
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setCurrentUser(accounts[0]);
    } catch (error) {
      return "Something Went Wrong";
    }
  };

  useEffect(() => {
    checkIfWalletConnected();
  }, []);

  return (
    <TrackingContext.Provider
      value={{
        connectWallet,
        createShipment,
        getAllShipment,
        completeShipment,
        getShipment,
        startShipment,
        getShipmentCount,
        DappName,
        currentUser,
      }}
    >
      {children}
    </TrackingContext.Provider>
  );
};
