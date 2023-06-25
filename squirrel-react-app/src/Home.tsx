import React, { useEffect, useState } from "react";
import styled from "styled-components";
import GradientBar from "./components/GradientBar";
import { useAccount, useSigner } from "wagmi";
import { useModal } from "connectkit";
import {
  CUSTOM_SCHEMAS,
  EASContractAddress,
  getAttestation,
  timeFormatString,
} from "./utils/utils";
import {
  EAS,
  Offchain,
  SchemaEncoder,
  TypedDataSigner,
} from "@ethereum-attestation-service/eas-sdk";
import invariant from "tiny-invariant";
import { Signer, ethers } from "ethers";
import { Link, useSearchParams } from "react-router-dom";
import { useNavigate } from "react-router";
import axios from "axios";
import { CustomConnectButton } from "./components/ui/CustomConnectKit";
import { ERC20_ABI } from "./erc20-abi";
import { SQUIRRELPAY_ABI } from "./squirrelpay-abi";

const Title = styled.div`
  color: #163a54;
  font-size: 22px;
  font-family: Montserrat, sans-serif;
`;

const Container = styled.div`
  @media (max-width: 700px) {
    width: 100%;
  }
`;

const MetButton = styled.div`
  border-radius: 10px;
  border: 1px solid #cfb9ff;
  background: #333342;
  width: 100%;
  padding: 20px 10px;
  box-sizing: border-box;
  color: #fff;
  font-size: 18px;
  font-family: Montserrat, sans-serif;
  font-weight: 700;
  cursor: pointer;
`;

const SubText = styled(Link)`
  display: block;
  cursor: pointer;
  text-decoration: underline;
  color: #ababab;
  margin-top: 20px;
`;

const InputContainer = styled.div`
  position: relative;
  height: 90px;
`;

const InputBlock = styled.input`
  position: absolute;
  top: 0;
  left: 0;
  border-radius: 10px;
  border: 1px solid rgba(19, 30, 38, 0.33);
  background: rgba(255, 255, 255, 0.5);
  color: #131e26;
  font-size: 18px;
  font-family: Chalkboard, sans-serif;
  padding: 20px 10px;
  text-align: center;
  margin-top: 12px;
  box-sizing: border-box;
  width: 100%;
`;

const WhiteBox = styled.div`
  box-shadow: 0 4px 33px rgba(168, 198, 207, 0.15);
  background-color: #fff;
  padding: 36px;
  max-width: 650px;
  border-radius: 10px;
  margin: 40px auto 0;
  box-sizing: border-box;

  @media (max-width: 700px) {
    width: 100%;
  }
`;

const eas = new Offchain(
  {
    address: "0x0000000000000000000000000000000000000000",
    chainId: 1101,
    version: "0.26",
  },
  1
);

function Home() {
  const { status, address } = useAccount();
  const { data: signer } = useSigner();

  const [business, setBusiness] = useState("");
  const [purpose, setPurpose] = useState("");
  const [amount, setAmount] = useState("");
  const [txnId, setTxnId] = useState("");

  const createAttestation = async (
    business: string,
    purpose: string,
    sender: string
  ) => {
    // your actual implementation of createAttestation should go here
    const schemaEncoder = new SchemaEncoder(
      "string business,string purpose,address sender"
    );
    const encoded = schemaEncoder.encodeData([
      { name: "business", type: "string", value: "test business" },
      { name: "purpose", type: "string", value: "test purpose" },
      {
        name: "sender",
        type: "address",
        value: "0xC16BA0330334B747582D9B7D2d89bdde6008E4a1",
      },
    ]);

    console.log("signing");
    const attestation = await eas.signOffchainAttestation(
      {
        recipient: "0x0000000000000000000000000000000000000000",
        data: encoded,
        refUID: ethers.constants.HashZero,
        revocable: true,
        expirationTime: 0,
        schema:
          "0x5d049e4ded23e4da491315b28e7db21d123ee2e340c59341f4f027eacef61022",
        version: 1,
        time: Math.floor(Date.now() / 1000),
      },
      signer as unknown as TypedDataSigner
    );

    console.log("offchain attestation:", JSON.stringify(attestation));
    return JSON.stringify(attestation);
  };

  const depositFunds = async (amount: number, attestation: string) => {
    try {
      const tokenAddress = "0xd6b9a0b261dda05ba06dc51821c3ba12318d9ae1";
      const squirrelPayContractAddress =
        "0x4CDc868C0E642A0a1bD587035603916A23a21bD0";

      const tokenContract = new ethers.Contract(
        tokenAddress,
        // Assuming the ABI for the token contract is already available
        ERC20_ABI,
        signer!
      );

      // Approve unlimited spending
      const unlimitedAmount = ethers.constants.MaxUint256;
      await tokenContract.approve(squirrelPayContractAddress, unlimitedAmount);

      // Call the deposit function on the smart contract
      const contract = new ethers.Contract(
        squirrelPayContractAddress,
        SQUIRRELPAY_ABI,
        signer!
      );

      const depositTx = await contract.deposit(attestation, amount);
      console.log("Transaction ID:", depositTx.hash);
      setTxnId(depositTx.hash);
    } catch (error) {
      console.error("Error depositing funds:", error);
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const attestation = await createAttestation(
      business,
      purpose,
      address as string
    );
    depositFunds(Number(amount), attestation);
  };

  if (status !== "connected") {
    return (
      <Container>
        <div className="flex justify-center items-center min-h-screen">
          <div className="bg-white rounded-md shadow-md p-6 flex flex-col items-center space-y-4">
            <img src="./logo-wide.png" alt="Logo" className="w-96" />
            <h1 className="text-2xl font-semibold">Connect Your Wallet</h1>
            {/* <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={connect}>
              Connect
            </button> */}
            <CustomConnectButton />
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <GradientBar />
      <WhiteBox>
        <div className="flex justify-center items-center">
          <img src="./logo-wide.png" alt="Logo" className="w-96" />
        </div>

        <p className="my-4">Connected as: {address}</p>

        <div className="container mx-auto">
          <h1 className="text-xl font-bold mb-4">Deposit into payroll pool</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="business" className="block text-sm font-medium">
                Business
              </label>
              <input
                type="text"
                id="business"
                value={business}
                onChange={(e) => setBusiness(e.target.value)}
                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:border-primary-500"
              />
            </div>
            <div>
              <label htmlFor="purpose" className="block text-sm font-medium">
                Purpose
              </label>
              <input
                type="text"
                id="purpose"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:border-primary-500"
              />
            </div>
            <div>
              <label htmlFor="amount" className="block text-sm font-medium">
                Amount
              </label>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:border-primary-500"
              />
            </div>
            <button
              type="submit"
              className="bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded shadow-md transition duration-300 ease-in-out"
            >
              Submit
            </button>
            {txnId && (
              <p className="mt-4">
                <a href={"https://zkevm.polygonscan.com/tx/" + txnId}>
                  Transaction ID: {txnId}
                </a>
              </p>
            )}
          </form>
          <div className="h-8" />
          <TransferBeneficialOwnership />
          <div className="h-8" />
          <WithdrawWithAttestation />
        </div>
      </WhiteBox>
    </Container>
  );
}

const TransferBeneficialOwnership = () => {
  const [batchID, setBatchID] = useState("");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [txnId, setTxnId] = useState("");
  const { data: signer } = useSigner();

  const transferBeneficialOwnership = async (
    batchID: string,
    recipient: string,
    amount: number
  ) => {
    const squirrelPayContractAddress =
      "0x4CDc868C0E642A0a1bD587035603916A23a21bD0";

    const contract = new ethers.Contract(
      squirrelPayContractAddress,
      SQUIRRELPAY_ABI,
      signer!
    );

    const depositTx = await contract.transferBeneficialOwnership(
      Number(batchID),
      recipient,
      amount
    );
    console.log("Transaction ID:", depositTx.hash);
    setTxnId(depositTx.hash);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await transferBeneficialOwnership(batchID, recipient, Number(amount));
  };

  return (
    <div className="container mx-auto">
      <h1 className="text-xl font-bold mb-4">Transfer beneficial ownership</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="batchID" className="block text-sm font-medium">
            Batch ID
          </label>
          <input
            type="text"
            id="batchID"
            value={batchID}
            onChange={(e) => setBatchID(e.target.value)}
            className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:border-primary-500"
          />
        </div>
        <div>
          <label htmlFor="recipient" className="block text-sm font-medium">
            Recipient
          </label>
          <input
            type="text"
            id="recipient"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:border-primary-500"
          />
        </div>
        <div>
          <label htmlFor="amount" className="block text-sm font-medium">
            Amount
          </label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:border-primary-500"
          />
        </div>
        <button
          type="submit"
          className="bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded shadow-md transition duration-300 ease-in-out"
        >
          Submit
        </button>
        {txnId && (
          <p className="mt-4">
            <a href={"https://zkevm.polygonscan.com/tx/" + txnId}>
              Transaction ID: {txnId}
            </a>
          </p>
        )}
      </form>
    </div>
  );
};

const WithdrawWithAttestation = () => {
  const [batchID, setBatchID] = useState("");
  const [amount, setAmount] = useState("");
  const [txnId, setTxnId] = useState("");
  const { data: signer } = useSigner();

  const doWithdrawWithAttestation = async (batchID: string, amount: number) => {
    const squirrelPayContractAddress =
      "0x4CDc868C0E642A0a1bD587035603916A23a21bD0";

    const contract = new ethers.Contract(
      squirrelPayContractAddress,
      SQUIRRELPAY_ABI,
      signer!
    );

    const meta = "";

    const depositTx = await contract.withdrawWithAttestation(
      Number(batchID),
      amount,
      meta
    );
    console.log("Transaction ID:", depositTx.hash);
    setTxnId(depositTx.hash);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await doWithdrawWithAttestation(batchID, Number(amount));
  };

  return (
    <div className="container mx-auto">
      <h1 className="text-xl font-bold mb-4">Withdraw with attestation</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="batchID" className="block text-sm font-medium">
            Batch ID
          </label>
          <input
            type="text"
            id="batchID"
            value={batchID}
            onChange={(e) => setBatchID(e.target.value)}
            className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:border-primary-500"
          />
        </div>
        <div>
          <label htmlFor="amount" className="block text-sm font-medium">
            Amount
          </label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:border-primary-500"
          />
        </div>
        <button
          type="submit"
          className="bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded shadow-md transition duration-300 ease-in-out"
        >
          Submit
        </button>
        {txnId && (
          <p className="mt-4">
            <a href={"https://zkevm.polygonscan.com/tx/" + txnId}>
              Transaction ID: {txnId}
            </a>
          </p>
        )}
      </form>
    </div>
  );
};


export default Home;
