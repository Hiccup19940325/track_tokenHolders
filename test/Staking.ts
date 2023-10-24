import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "hardhat/internal/hardhat-network/stack-traces/model";

describe("Staking", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployStaking() {
    const startTime = 24 * 3600;
    const endTime = 2 * 24 * 3600;


    // Contracts are deployed using the first signer/account by default
    const [account1, account2, account3, account4, account5] = await ethers.getSigners();

    const StakingToken = await ethers.getContractFactory("StakingToken");
    const stakingtoken = await StakingToken.connect(account1).deploy();

    const RewardToken = await ethers.getContractFactory("RewardToken");
    const rewardtoken = await RewardToken.connect(account2).deploy();

    const Stake = await ethers.getContractFactory("Stake");
    const stake = await Stake.connect(account3).deploy(startTime, endTime, await stakingtoken.getAddress(), await rewardtoken.getAddress());

    return { stake, stakingtoken, rewardtoken, account1, account2, account3, account4, account5, startTime, endTime };
  }


  describe("Deployment", function () {
    it("Should set the initial values", async function () {
      const { stakingtoken, rewardtoken, stake, account1, account2, account3, startTime, endTime } = await loadFixture(deployStaking);

      const latestTime = await time.latest();

      expect(await stakingtoken.name()).to.equal("Staking Token");
      expect(await stakingtoken.symbol()).to.equal("ST");
      expect(await stakingtoken.decimals()).to.equal(12);

      expect(await rewardtoken.name()).to.equal("RewardToken");
      expect(await rewardtoken.symbol()).to.equal("RT");
      expect(await rewardtoken.decimals()).to.equal(18);

      expect(await stake.startTime()).to.equal(latestTime + startTime);
      expect(await stake.endTime()).to.equal(latestTime + endTime);
      expect(await stake.stakingToken()).to.equal(stakingtoken.target);
      expect(await stake.rewardToken()).to.equal(rewardtoken.target);
    });

  });

  describe("MintTokens", function () {
    it("should fail with the right error if you are not a owner", async function () {
      const { stakingtoken, rewardtoken, stake, account1, account2, account3, account4, account5, startTime, endTime } = await loadFixture(deployStaking);
      await expect(stakingtoken.connect(account2).mint(account4.address, 300)).to.be.reverted;
      await expect(rewardtoken.connect(account1).mint(account4.address, 300)).to.be.reverted;
    })

    it("mint the tokens without errors", async function () {
      const { stakingtoken, rewardtoken, stake, account1, account2, account3, account4, account5, startTime, endTime } = await loadFixture(deployStaking);
      await stakingtoken.connect(account1).mint(account4.address, 300);
      await rewardtoken.connect(account2).mint(account4.address, 300);
      expect(await stakingtoken.balanceOf(account4.address)).to.equal(300);
      expect(await rewardtoken.balanceOf(account4.address)).to.equal(300);
    })
  })

  describe("Deposite", function () {
    it("you should fail with the right error if you deposite 0 token", async function () {
      const { stakingtoken, rewardtoken, stake, account1, account2, account3, startTime, endTime } = await loadFixture(deployStaking);
      await expect(stake.deposite(0)).to.be.revertedWith("you should deposite more than 0 token");
    })

    it("you should fail with the right error if you deposite too soon", async function () {
      const { stakingtoken, rewardtoken, stake, account1, account2, account3, startTime, endTime } = await loadFixture(deployStaking);
      await expect(stake.deposite(20)).to.be.revertedWith("you should wait until startTime");
    })

    it("you should not fail with the right error if all conditions are ok", async function () {
      const { stakingtoken, rewardtoken, stake, account1, account2, account3, account4, account5, startTime, endTime } = await loadFixture(deployStaking);
      const latestTime = await time.latest();
      await stakingtoken.connect(account1).mint(account4.address, 100);
      await stakingtoken.connect(account4).approve(await stake.getAddress(), 100);
      await time.increaseTo(latestTime + startTime);
      await expect(stake.connect(account4).deposite(20)).not.to.reverted;
      await expect(stake.connect(account4).deposite(20)).not.to.reverted;

      const getPoolValue = await stake.getPool();
      expect(getPoolValue[0]).to.equal(40);
      expect(getPoolValue[1]).to.equal(0);
    })
  })

  describe("Withdraw", function () {
    it("you should fail with the right error if you call too soon", async function () {
      const { stakingtoken, rewardtoken, stake, account1, account2, account3, account4, account5, startTime, endTime } = await loadFixture(deployStaking);
      await expect(stake.connect(account4).withdraw(20)).to.be.revertedWith("you should withdraw wait until endTime");
    })

    it("you should fail with the right error if you call without deposite", async function () {
      const { stakingtoken, rewardtoken, stake, account1, account2, account3, account4, account5, startTime, endTime } = await loadFixture(deployStaking);
      const latestTime = await time.latest();
      await time.increaseTo(latestTime + endTime);
      await expect(stake.connect(account4).withdraw(0)).to.be.revertedWith("you can not withdraw 0 token");
    })

    it("you should not fail with the right error if all conditions are ok", async function () {
      const { stakingtoken, rewardtoken, stake, account1, account2, account3, account4, account5, startTime, endTime } = await loadFixture(deployStaking);
      const latestTime = await time.latest();
      await stakingtoken.connect(account1).mint(account4.address, 100);
      await stakingtoken.connect(account4).approve(await stake.getAddress(), 100);
      await time.increaseTo(latestTime + startTime);
      await stake.connect(account4).deposite(50);
      await time.increaseTo(latestTime + endTime);
      await expect(stake.connect(account4).withdraw(20)).not.to.reverted;
    })

    it("should fail with the right error if your requirement is more than deposit", async function () {
      const { stakingtoken, rewardtoken, stake, account1, account2, account3, account4, account5, startTime, endTime } = await loadFixture(deployStaking);
      const latestTime = await time.latest();
      await stakingtoken.connect(account1).mint(account4.address, 100);
      await stakingtoken.connect(account4).approve(await stake.getAddress(), 100);
      await time.increaseTo(latestTime + startTime);
      await stake.connect(account4).deposite(50);
      await time.increaseTo(latestTime + endTime);
      await expect(stake.connect(account4).withdraw(60)).to.be.revertedWith("you can not withdraw your requirement");
    })
  })

  describe("roleManage", function () {
    it("you should fail with the right error if you are not owner", async function () {
      const { stakingtoken, rewardtoken, stake, account1, account2, account3, account4, account5, startTime, endTime } = await loadFixture(deployStaking);
      await expect(stake.connect(account1).registerMods([account4.address])).to.be.reverted;
      await expect(stake.connect(account1).removeMods([account4.address])).to.be.reverted;
    })
  })

  describe("ReceiveRewards", function () {
    // it("you should fail with the right error if you are not allowed", async function () {
    //   const { stakingtoken, rewardtoken, stake, account1, account2, account3, account4, account5, startTime, endTime } = await loadFixture(deployStaking);
    //   await stake.registerMods([account4.address]);
    //   await stake.removeMods([account4.address]);
    //   await expect(stake.connect(account4).receiveReward(0)).to.be.reverted;
    // })

    // it("you should fail with the right error if you call with 0 token", async function () {
    //   const { stakingtoken, rewardtoken, stake, account1, account2, account3, account4, account5, startTime, endTime } = await loadFixture(deployStaking);
    //   await stake.registerMods([account4.address]);
    //   await expect(stake.connect(account4).receiveReward(0)).to.be.revertedWith("you should give rewards more than 0 token");
    // })

    it("you should not fail with the right error if you call with more than 0 token", async function () {
      const { stakingtoken, rewardtoken, stake, account1, account2, account3, account4, account5, startTime, endTime } = await loadFixture(deployStaking);
      await rewardtoken.connect(account2).mint(account4.address, 100);
      await stake.registerMods([account4.address]);
      await rewardtoken.connect(account4).approve(await stake.getAddress(), 100);
      await expect(stake.connect(account4).receiveReward(50)).not.to.reverted;
    })
  })

  describe("getPending", function () {
    it("get the pending", async function () {
      const { stakingtoken, rewardtoken, stake, account1, account2, account3, account4, account5, startTime, endTime } = await loadFixture(deployStaking);
      const latestTime = await time.latest();
      await stakingtoken.connect(account1).mint(account4.address, 300);
      await stakingtoken.connect(account1).mint(account5.address, 200);
      await stakingtoken.connect(account4).approve(await stake.getAddress(), 300);
      await stakingtoken.connect(account5).approve(await stake.getAddress(), 200);
      await rewardtoken.connect(account2).mint(account3.address, 500);
      await rewardtoken.connect(account3).approve(await stake.getAddress(), 500);
      await time.increaseTo(latestTime + startTime);
      await stake.connect(account4).deposite(200);
      await stake.connect(account5).deposite(200);
      await stake.connect(account3).receiveReward(200);
      expect(await stake.pendingRewards(account4.address)).to.equal(100);
    })
  })

  describe("GetRewards", function () {
    it("Your rewards correct it all conditions are ok", async function () {
      const { stakingtoken, rewardtoken, stake, account1, account2, account3, account4, account5, startTime, endTime } = await loadFixture(deployStaking);
      const latestTime = await time.latest();
      await stakingtoken.connect(account1).mint(account4.address, 300);
      await stakingtoken.connect(account1).mint(account5.address, 200);
      await stakingtoken.connect(account4).approve(await stake.getAddress(), 300);
      await stakingtoken.connect(account5).approve(await stake.getAddress(), 200);
      await rewardtoken.connect(account2).mint(account3.address, 500);
      await rewardtoken.connect(account3).approve(await stake.getAddress(), 500);
      await time.increaseTo(latestTime + startTime);
      await stake.connect(account4).deposite(200);
      await stake.connect(account5).deposite(200);
      await stake.connect(account3).receiveReward(200);
      await stake.connect(account4).deposite(100);
      await stake.connect(account3).receiveReward(200);
      await time.increaseTo(latestTime + endTime);
      await stake.connect(account4).withdraw(200);
      await stake.connect(account5).withdraw(100);
      const accA = [await stakingtoken.balanceOf(account4.address), await rewardtoken.balanceOf(account4)];
      const accB = [await stakingtoken.balanceOf(account5.address), await rewardtoken.balanceOf(account5)];
      const accC = await rewardtoken.balanceOf(account3.address);
      expect(accA[0]).to.equal(200);
      expect(accA[1]).to.equal(220);
      expect(accB[0]).to.equal(100);
      expect(accB[1]).to.equal(180);
      expect(accC).to.equal(100);
    })
  })
});
