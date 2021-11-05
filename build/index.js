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
const withCafIos = (config) => {
    const withXcodeFiles = (config) => (0, config_plugins_1.withXcodeProject)(config, async (cfg) => {
        const srcRoot = (0, Paths_1.getSourceRoot)(cfg.modRequest.projectRoot);
        const projName = (0, Xcodeproj_1.getProjectName)(cfg.modRequest.projectRoot);
        // Copy CombateAFraude Source Files
        await fs_extra_1.default.copyFile(path_1.default.resolve(__dirname, './caf/ios/CombateAFraude.m'), cfg.modRequest.platformProjectRoot + '/CombateAFraude.m');
        await fs_extra_1.default.copyFile(path_1.default.resolve(__dirname, './caf/ios/CombateAFraude.swift'), cfg.modRequest.platformProjectRoot + '/CombateAFraude.swift');
        // Replace Main Briding-Header
        await fs_extra_1.default.copyFile(path_1.default.resolve(__dirname, './caf/ios/Bridging-Header.h'), srcRoot + `/${projName}-Bridging-Header.h`);
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
    const withPods = (config) => (0, config_plugins_2.withDangerousMod)(config, [
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
    return (0, config_plugins_1.withPlugins)(config, [
        [withXcodeFiles, {}],
        [withPods, {}],
    ]);
};
const withCafAndroid = (config) => {
    const withCafSource = (expoCfg) => {
        return (0, config_plugins_2.withDangerousMod)(expoCfg, [
            'android',
            async (config) => {
                var _a, _b, _c;
                if (!((_a = config.android) === null || _a === void 0 ? void 0 : _a.package))
                    throw new Error('Missing package name');
                await fs_extra_1.default.copyFile(path_1.default.resolve(__dirname, './caf/android/CombateAFraudeModule.java'), config.modRequest.platformProjectRoot +
                    '/app/src/main/java/br/com/b4u/CombateAFraudeModule.java');
                const moduleContents = await fs_extra_1.default.readFile(config.modRequest.platformProjectRoot +
                    '/app/src/main/java/br/com/b4u/CombateAFraudeModule.java');
                await fs_extra_1.default.writeFile(config.modRequest.platformProjectRoot +
                    '/app/src/main/java/br/com/b4u/CombateAFraudeModule.java', moduleContents
                    .toString()
                    .replace(/\[\[PACKAGE\]\]/, (_b = config.android) === null || _b === void 0 ? void 0 : _b.package));
                await fs_extra_1.default.copyFile(path_1.default.resolve(__dirname, './caf/android/CombateAFraudePackage.java'), config.modRequest.platformProjectRoot +
                    '/app/src/main/java/br/com/b4u/CombateAFraudePackage.java');
                const packageContents = await fs_extra_1.default.readFile(config.modRequest.platformProjectRoot +
                    '/app/src/main/java/br/com/b4u/CombateAFraudePackage.java');
                await fs_extra_1.default.writeFile(config.modRequest.platformProjectRoot +
                    '/app/src/main/java/br/com/b4u/CombateAFraudePackage.java', packageContents
                    .toString()
                    .replace(/\[\[PACKAGE\]\]/, (_c = config.android) === null || _c === void 0 ? void 0 : _c.package));
                return config;
            },
        ]);
    };
    const withMainAtv = (config) => {
        return (0, config_plugins_1.withMainApplication)(config, async (config) => {
            let mainApplication = config.modResults.contents;
            mainApplication = (0, generateCode_1.mergeContents)({
                tag: 'Package',
                src: config.modResults.contents,
                newSrc: `      packages.add(new CombateAFraudePackage());`,
                anchor: /new PackageList\(this\)\.getPackages\(\)/,
                offset: 1,
                comment: '//',
            }).contents;
            // console.log('MAIN APPLICATION => ', mainApplication)
            return Object.assign(config, {
                modResults: {
                    contents: mainApplication,
                },
            });
        });
    };
    const withBuildGradle = (config) => {
        const projectBuild = (expoCfg) => (0, config_plugins_1.withProjectBuildGradle)(expoCfg, async (config) => {
            let mainApplication = config.modResults.contents;
            mainApplication = (0, generateCode_1.mergeContents)({
                tag: 'Maven Repo',
                src: config.modResults.contents,
                newSrc: `        maven { url "https://repo.combateafraude.com/android/release" }`,
                anchor: /mavenLocal\(\)/,
                offset: 1,
                comment: '//',
            }).contents;
            // console.log('PROJECT BUILD GRADLE => ', mainApplication)
            return Object.assign(config, {
                modResults: {
                    contents: mainApplication,
                },
            });
        });
        const appBuild = (expoCfg) => (0, config_plugins_1.withAppBuildGradle)(expoCfg, async (config) => {
            let mainApplication = config.modResults.contents;
            mainApplication = (0, generateCode_1.mergeContents)({
                tag: 'Android Config',
                src: config.modResults.contents,
                newSrc: `
  aaptOptions {
    noCompress "tflite"
  }

  dataBinding {
    enabled = true
  }`,
                anchor: /android {/,
                offset: 1,
                comment: '//',
            }).contents;
            mainApplication = (0, generateCode_1.mergeContents)({
                tag: 'Dependencies',
                src: mainApplication,
                newSrc: `
    implementation "com.combateafraude.sdk:passive-face-liveness:+"
    implementation "com.combateafraude.sdk:document-detector:+"
    implementation "com.combateafraude.sdk:face-authenticator:+"
          `,
                anchor: /dependencies {/,
                offset: 1,
                comment: '//',
            }).contents;
            // console.log('APP BUILD GRADLE => ', mainApplication)
            return Object.assign(config, {
                modResults: {
                    contents: mainApplication,
                },
            });
        });
        return (0, config_plugins_1.withPlugins)(config, [
            [projectBuild, {}],
            [appBuild, {}],
        ]);
    };
    return (0, config_plugins_1.withPlugins)(config, [
        [withCafSource, {}],
        [withMainAtv, {}],
        [withBuildGradle, {}],
    ]);
};
const mainPlugin = (config) => (0, config_plugins_1.withPlugins)(config, [
    [withCafIos, {}],
    [withCafAndroid, {}],
]);
exports.default = mainPlugin;
