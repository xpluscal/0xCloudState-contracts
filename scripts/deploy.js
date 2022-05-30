const hre = require("hardhat");

async function main() {

  await run("verify:verify", {
    address: '0x93965f495597D4185955C83f1dcC0a87fA77e36b',
    constructorArguments: [],
  });

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
