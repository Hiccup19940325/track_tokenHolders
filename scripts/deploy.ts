import { ethers } from "hardhat";

async function main() {
  const currentTimestampInSeconds = Math.round(Date.now() / 1000);
  const unlockTime = currentTimestampInSeconds + 60;

  const lockedAmount = ethers.parseEther("0.001");

  const lock = await ethers.deployContract("Lock", [unlockTime], {
    value: lockedAmount,
  });

  await lock.waitForDeployment();

  console.log(
    `Lock with ${ethers.formatEther(
      lockedAmount
    )}ETH and unlock timestamp ${unlockTime} deployed to ${lock.target}`
  );
}
// async function main() {
//   const startTime = 24*3600;
//   const endTime = 2*24*3600;


//   // Contracts are deployed using the first signer/account by default

//   const StakingToken = await ethers.getContractFactory("StakingToken");
//   const stakingtoken = await StakingToken.deploy();
//   console.log("StakingToken Contract Deployed to Address:", await stakingtoken.getAddress());

//   const RewardToken = await ethers.getContractFactory("RewardToken");
//   const rewardtoken = await RewardToken.deploy();
//   console.log("RewardToken Contract Deployed to Address:", await rewardtoken.getAddress());

//   const Stake = await ethers.getContractFactory("Stake");
//   const stake = await Stake.deploy(startTime, endTime, await stakingtoken.getAddress(), await rewardtoken.getAddress());
//   console.log("Staking Contract Deployed to Address:", await stake.getAddress());

// }

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
