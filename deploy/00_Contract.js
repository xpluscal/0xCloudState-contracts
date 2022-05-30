const { Defaults } = require('../test/helpers/helpers');

module.exports = async ({getNamedAccounts, deployments}) => {
    const {deploy} = deployments;
    const {deployer} = await getNamedAccounts();
    res = await deploy('CloudStateSoulboundUpgradeable', {
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
    console.log(res.implementation);
    console.log("Final Address: ",res.address);

    await run("verify:verify", {
      address: res.implementation,
      constructorArguments: [],
    });

  };
  module.exports.tags = ['CloudStateSoulboundUpgradeable'];
