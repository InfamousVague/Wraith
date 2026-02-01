const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Add support for the Ghost package
const ghostPath = path.resolve(__dirname, "../Ghost");

config.watchFolders = [ghostPath];

config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, "node_modules"),
  path.resolve(ghostPath, "node_modules"),
];

// Ensure we can resolve the Ghost package
config.resolver.extraNodeModules = {
  "@wraith/ghost": ghostPath,
};

module.exports = config;
