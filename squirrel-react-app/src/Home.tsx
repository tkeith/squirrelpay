import React, { useEffect, useState } from "react";
import styled from "styled-components";
import GradientBar from "./components/GradientBar";
import { useAccount, useEnsName, useSigner } from "wagmi";
import { useModal } from "connectkit";
import {
  CUSTOM_SCHEMAS,
  EASContractAddress,
  getAddressForENS,
  getAttestation,
  timeFormatString,
} from "./utils/utils";
import { EAS, Offchain, SchemaEncoder, TypedDataSigner } from "@ethereum-attestation-service/eas-sdk";
import invariant from "tiny-invariant";
import { Signer, ethers } from "ethers";
import { Link, useSearchParams } from "react-router-dom";
import { useNavigate } from "react-router";
import axios from "axios";

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

const EnsLogo = styled.img`
  position: absolute;
  left: 14px;
  top: 28px;
  width: 30px;
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
  max-width: 590px;
  border-radius: 10px;
  margin: 40px auto 0;
  text-align: center;
  box-sizing: border-box;

  @media (max-width: 700px) {
    width: 100%;
  }
`;

const eas = new Offchain({address: '0x0000000000000000000000000000000000000000', chainId: 1101, version: '0.26'}, 1);

function Home() {
  const { status } = useAccount();
  const modal = useModal();
  const [address, setAddress] = useState("");
  const { data: signer } = useSigner();
  const [attesting, setAttesting] = useState(false);
  const [ensResolvedAddress, setEnsResolvedAddress] = useState("Dakh.eth");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const addressParam = searchParams.get("address");
    if (addressParam) {
      setAddress(addressParam);
    }
  }, []);

  useEffect(() => {
    async function checkENS() {

    }

    checkENS();
  }, [address]);

  return (
    <Container>
      <GradientBar />
      <WhiteBox>
        <Title>
          I <b>attest</b> that I met
        </Title>

        <MetButton
          onClick={async () => {
            console.log('clicked')
            if (status !== "connected") {
              modal.setOpen(true);
            } else {
              console.log('attesting')
              setAttesting(true);
              try {
                const schemaEncoder = new SchemaEncoder("string business,string purpose,address sender");
                const encoded = schemaEncoder.encodeData([
                  { name: "business", type: "string", value: "test business" },
                  { name: "purpose", type: "string", value: "test purpose" },
                  { name: "sender", type: "address", value: "0xC16BA0330334B747582D9B7D2d89bdde6008E4a1" },
                ]);

                // invariant(signer, "signer must be defined");
                // eas.connect(signer);

                console.log('signing')
                const attestation = await eas.signOffchainAttestation({
                    recipient: "0x0000000000000000000000000000000000000000",
                    data: encoded,
                    refUID: ethers.constants.HashZero,
                    revocable: true,
                    expirationTime: 0,
                    schema: '0x5d049e4ded23e4da491315b28e7db21d123ee2e340c59341f4f027eacef61022',
                    version: 1,
                    time: Math.floor(Date.now() / 1000)
                  }, signer as unknown as TypedDataSigner);

                console.log('offchain attestation:', JSON.stringify(attestation));

              } catch (e) {}

              setAttesting(false);
            }
          }}
        >
          {attesting
            ? "Attesting..."
            : status === "connected"
            ? "Make attestation"
            : "Connect wallet"}
        </MetButton>

        {status === "connected" && (
          <>
            <SubText to={"/qr"}>Show my QR code</SubText>
            <SubText to={"/connections"}>Connections</SubText>
          </>
        )}
      </WhiteBox>
    </Container>
  );
}

export default Home;
