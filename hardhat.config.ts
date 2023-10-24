import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import 'hardhat-contract-sizer'


const config: HardhatUserConfig = {
  contractSizer:{
    alphaSort:true,
    runOnCompile:true,
    disambiguatePaths:false
  },
  solidity: "0.8.19",
  // defaultNetwork: "sepolia",
  // networks: {
  //   hardhat: {},
  //   sepolia: {
  //     url: "https://eth-sepolia.g.alchemy.com/v2/demo",
  //     accounts: [`0xdfa728acc3c323d4166064d4e7f00f8b06c1592d17bcb16ddff70900274bdb42`]
  //   }
  // },
};

export default config;
