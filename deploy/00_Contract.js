const { Defaults } = require('../test/helpers/helpers');

module.exports = async ({getNamedAccounts, deployments}) => {
    const {deploy} = deployments;
    const {deployer} = await getNamedAccounts();
    res = await deploy('NetworkStateSoulsUpgradeable', {
      from: deployer,
      log: true,
      proxy: {
        proxyContract: "OptimizedTransparentProxy",
        execute: {
          init: {
            methodName: 'initialize',
            args:[deployer, "Network State Souls", "NTWRKSLS"]
          }
        }
      },
      args: []
    });
    // await res.deployed();
    console.log("Final Address: ",res.address);

  };
  module.exports.tags = ['NetworkStateSoulsUpgradeable'];
