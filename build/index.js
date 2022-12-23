"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("@expo/config-plugins");
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
        await fs_extra_1.default.copyFile(path_1.default.resolve(__dirname, './ios/CombateAFraude.m'), cfg.modRequest.platformProjectRoot + '/CombateAFraude.m');
        await fs_extra_1.default.copyFile(path_1.default.resolve(__dirname, './ios/CombateAFraude.swift'), cfg.modRequest.platformProjectRoot + '/CombateAFraude.swift');
        // Replace Main Briding-Header
        await fs_extra_1.default.copyFile(path_1.default.resolve(__dirname, './ios/Bridging-Header.h'), srcRoot + `/${projName}-Bridging-Header.h`);
        cfg.modResults.addKnownRegion('pt-BR');
        cfg.modResults.removeKnownRegion('en');
        cfg.modResults.removeKnownRegion('Base');
        cfg.modResults.pbxProjectSection()[cfg.modResults.getFirstProject()['uuid']]['developmentRegion'] = 'pt-BR';
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
        return cfg;
    });
    const withPods = (config) => (0, config_plugins_1.withDangerousMod)(config, [
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
                    newSrc: `  pod 'DocumentDetector', '~> 6.2.0'`,
                    anchor: /use_react_native!/,
                    offset: 0,
                    comment: '#',
                });
                results = (0, generateCode_1.mergeContents)({
                    tag: 'PassiveFaceLiveness',
                    src: results.contents,
                    newSrc: `  pod 'PassiveFaceLiveness', '~> 5.7.0'`,
                    anchor: /use_react_native!/,
                    offset: 0,
                    comment: '#',
                });
                results = (0, generateCode_1.mergeContents)({
                    tag: 'FaceAuthenticator',
                    src: results.contents,
                    newSrc: `  pod 'FaceAuthenticator', '~> 5.1.0'`,
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
                results.contents = `${results.contents}
source 'https://github.com/combateafraude/iOS.git'
source 'https://cdn.cocoapods.org/'
            `;
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
    return (0, config_plugins_1.withPlugins)(config, [withXcodeFiles, withPods]);
};
const withCafAndroid = (config) => {
    const withCafSource = (expoCfg) => {
        return (0, config_plugins_1.withDangerousMod)(expoCfg, [
            'android',
            async (config) => {
                if (!config.android?.package)
                    throw new Error('Missing package name');
                const androidSrcPath = config.android?.package?.replace(/\./gi, '/');
                await fs_extra_1.default.copyFile(path_1.default.resolve(__dirname, './android/CombateAFraudeModule.java'), config.modRequest.platformProjectRoot +
                    '/app/src/main/java/' +
                    androidSrcPath +
                    '/CombateAFraudeModule.java');
                const moduleContents = await fs_extra_1.default.readFile(config.modRequest.platformProjectRoot +
                    '/app/src/main/java/' +
                    androidSrcPath +
                    '/CombateAFraudeModule.java');
                await fs_extra_1.default.writeFile(config.modRequest.platformProjectRoot +
                    '/app/src/main/java/' +
                    androidSrcPath +
                    '/CombateAFraudeModule.java', moduleContents
                    .toString()
                    .replace(/\[\[PACKAGE\]\]/, config.android?.package));
                await fs_extra_1.default.copyFile(path_1.default.resolve(__dirname, './android/CombateAFraudePackage.java'), config.modRequest.platformProjectRoot +
                    '/app/src/main/java/' +
                    androidSrcPath +
                    '/CombateAFraudePackage.java');
                const packageContents = await fs_extra_1.default.readFile(config.modRequest.platformProjectRoot +
                    '/app/src/main/java/' +
                    androidSrcPath +
                    '/CombateAFraudePackage.java');
                await fs_extra_1.default.writeFile(config.modRequest.platformProjectRoot +
                    '/app/src/main/java/' +
                    androidSrcPath +
                    '/CombateAFraudePackage.java', packageContents
                    .toString()
                    .replace(/\[\[PACKAGE\]\]/, config.android?.package));
                // WORKARROUND ABOUT FAILED withMainApplication ON BUILD
                // const mainAppContents = await fs.readFile(
                //   config.modRequest.platformProjectRoot +
                //     '/app/src/main/java/' +
                //     androidSrcPath +
                //     '/MainApplication.java'
                // )
                // const mainAppContentsUpdated = mergeContents({
                //   tag: 'Add Package',
                //   src: mainAppContents.toString(),
                //   newSrc: `      packages.add(new CombateAFraudePackage());`,
                //   anchor: /return packages/,
                //   offset: 0,
                //   comment: '//',
                // }).contents
                // await fs.writeFile(
                //   config.modRequest.platformProjectRoot +
                //     '/app/src/main/java/' +
                //     androidSrcPath +
                //     '/MainApplication.java',
                //   mainAppContentsUpdated
                // )
                return config;
            },
        ]);
    };
    const withFileMods = (config) => {
        // DISABLED DUE FAIL ON BUILD -- NEEDS REVIEW
        const mainActivity = (expoCfg) => (0, config_plugins_1.withMainApplication)(expoCfg, async (config) => {
            config.modResults.contents = (0, generateCode_1.mergeContents)({
                tag: 'Add Package',
                src: config.modResults.contents,
                newSrc: `      packages.add(new CombateAFraudePackage());`,
                anchor: /return packages/,
                offset: 0,
                comment: '//',
            }).contents;
            return config;
        });
        const projectBuild = (expoCfg) => (0, config_plugins_1.withProjectBuildGradle)(expoCfg, async (config) => {
            config.modResults.contents = (0, generateCode_1.mergeContents)({
                tag: 'Maven Repo',
                src: config.modResults.contents,
                newSrc: `        maven { url "https://repo.combateafraude.com/android/release" }`,
                anchor: /mavenLocal\(\)/,
                offset: 1,
                comment: '//',
            }).contents;
            return config;
        });
        const appBuild = (expoCfg) => (0, config_plugins_1.withAppBuildGradle)(expoCfg, async (config) => {
            config.modResults.contents = (0, generateCode_1.mergeContents)({
                tag: 'Android Config',
                src: config.modResults.contents,
                newSrc: `
  aaptOptions {
    noCompress "tflite"
  }

  buildFeatures {
    dataBinding true
  }

  compileOptions {
    sourceCompatibility = JavaVersion.VERSION_1_8
    targetCompatibility = JavaVersion.VERSION_1_8
  }`,
                anchor: /android {/,
                offset: 1,
                comment: '//',
            }).contents;
            config.modResults.contents = (0, generateCode_1.mergeContents)({
                tag: 'Dependencies',
                src: config.modResults.contents,
                newSrc: `
    implementation 'com.combateafraude.sdk:document-detector:6.16.5'
    implementation 'com.combateafraude.sdk:passive-face-liveness:4.16.6'
    implementation 'com.combateafraude.sdk:face-authenticator:5.0.5'
          `,
                anchor: /dependencies {/,
                offset: 1,
                comment: '//',
            }).contents;
            return config;
        });
        return (0, config_plugins_1.withPlugins)(config, [mainActivity, projectBuild, appBuild]);
    };
    return (0, config_plugins_1.withPlugins)(config, [withCafSource, withFileMods]);
};
const mainPlugin = (config) => (0, config_plugins_1.withPlugins)(config, [withCafIos, withCafAndroid]);
exports.default = mainPlugin;
