import { ethers } from "hardhat";

async function main() {
  // const contract = await ethers.deployContract("SquirrelPay", [], {});
  // await contract.waitForDeployment();

  const Contract = await ethers.getContractFactory("SquirrelPay");
  const contract = await Contract.deploy({});
  await contract.waitForDeployment();

  console.log(
    `deployed contract: ${contract.target}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
