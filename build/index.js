"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("@expo/config-plugins");
const config_plugins_2 = require("@expo/config-plugins");
const Paths_1 = require("@expo/config-plugins/build/ios/Paths");
const Xcodeproj_1 = require("@expo/config-plugins/build/ios/utils/Xcodeproj");
const generateCode_1 = require("@expo/config-plugins/build/utils/generateCode");
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const withCombateAFraude = (config) => {
    return (0, config_plugins_2.withDangerousMod)(config, [
        'ios',
        async (config) => {
            const filePath = path_1.default.join(config.modRequest.platformProjectRoot, 'Podfile');
            const contents = await fs_extra_1.default.readFile(filePath, 'utf-8');
            let results = {
                contents,
            };
            try {
                results = (0, generateCode_1.mergeContents)({
                    tag: 'DocumentDetector',
                    src: results.contents,
                    newSrc: `  pod 'DocumentDetector', '~> 4.8.3'`,
                    anchor: /use_react_native!/,
                    offset: 0,
                    comment: '#',
                });
                results = (0, generateCode_1.mergeContents)({
                    tag: 'PassiveFaceLiveness',
                    src: results.contents,
                    newSrc: `  pod 'PassiveFaceLiveness', '~> 3.7.2'`,
                    anchor: /use_react_native!/,
                    offset: 0,
                    comment: '#',
                });
                results = (0, generateCode_1.mergeContents)({
                    tag: 'FaceAuthenticator',
                    src: results.contents,
                    newSrc: `  pod 'FaceAuthenticator', '~> 2.5.0'`,
                    anchor: /use_react_native!/,
                    offset: 0,
                    comment: '#',
                });
                results = (0, generateCode_1.mergeContents)({
                    tag: 'useFrameworks',
                    src: results.contents,
                    newSrc: `use_frameworks!\n`,
                    anchor: /platform :ios/,
                    offset: 1,
                    comment: '#',
                });
                results.contents =
                    results.contents +
                        "source 'https://github.com/combateafraude/iOS.git'\n" +
                        "source 'https://cdn.cocoapods.org/'\n";
            }
            catch (error) {
                if (error.code === 'ERR_NO_MATCH') {
                    throw new Error(`Cannot add Combate a Fraude to the project's ios/Podfile because it's malformed. Please report this with a copy of your project Podfile.`);
                }
                throw error;
            }
            if (results.didMerge || results.didClear) {
                await fs_extra_1.default.writeFile(filePath, results.contents);
            }
            return config;
        },
    ]);
};
const withCafFiles = (config) => {
    return (0, config_plugins_1.withXcodeProject)(config, async (cfg) => {
        const srcRoot = (0, Paths_1.getSourceRoot)(cfg.modRequest.projectRoot);
        const projName = (0, Xcodeproj_1.getProjectName)(cfg.modRequest.projectRoot);
        // Copy CombateAFraude Source Files
        await fs_extra_1.default.copyFile(path_1.default.resolve(__dirname, './caf/CombateAFraude.m'), cfg.modRequest.platformProjectRoot + '/CombateAFraude.m');
        await fs_extra_1.default.copyFile(path_1.default.resolve(__dirname, './caf/CombateAFraude.swift'), cfg.modRequest.platformProjectRoot + '/CombateAFraude.swift');
        // Replace Main Briding-Header
        await fs_extra_1.default.copyFile(path_1.default.resolve(__dirname, './caf/Bridging-Header.h'), srcRoot + `/${projName}-Bridging-Header.h`);
        cfg.modResults = (0, Xcodeproj_1.addBuildSourceFileToGroup)({
            filepath: cfg.modRequest.platformProjectRoot + '/CombateAFraude.swift',
            groupName: projName,
            project: cfg.modResults,
        });
        cfg.modResults = (0, Xcodeproj_1.addBuildSourceFileToGroup)({
            filepath: cfg.modRequest.platformProjectRoot + '/CombateAFraude.m',
            groupName: projName,
            project: cfg.modResults,
        });
        cfg.modResults = (0, Xcodeproj_1.addBuildSourceFileToGroup)({
            filepath: cfg.modRequest.platformProjectRoot + '/Bridging-Header.h',
            groupName: projName,
            project: cfg.modResults,
        });
        return cfg;
    });
};
const mainPlugin = (config) => (0, config_plugins_1.withPlugins)(config, [
    [withCombateAFraude, {}],
    [withCafFiles, {}],
]);
exports.default = mainPlugin;
