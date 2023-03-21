import {
  ConfigPlugin,
  withAppBuildGradle,
  withDangerousMod,
  withMainApplication,
  withPlugins,
  withProjectBuildGradle,
  withXcodeProject,
} from '@expo/config-plugins'
import { getSourceRoot } from '@expo/config-plugins/build/ios/Paths'
import {
  addBuildSourceFileToGroup,
  getProjectName,
} from '@expo/config-plugins/build/ios/utils/Xcodeproj'
import { mergeContents } from '@expo/config-plugins/build/utils/generateCode'
import fs from 'fs-extra'
import path from 'path'

const withCafIos: ConfigPlugin<void> = (config) => {
  const withXcodeFiles: ConfigPlugin<void> = (config) =>
    withXcodeProject(config, async (cfg) => {
      const srcRoot = getSourceRoot(cfg.modRequest.projectRoot)
      const projName = getProjectName(cfg.modRequest.projectRoot)

      // Copy CombateAFraude Source Files
      await fs.copyFile(
        path.resolve(__dirname, './ios/CombateAFraude.m'),
        cfg.modRequest.platformProjectRoot + '/CombateAFraude.m'
      )
      await fs.copyFile(
        path.resolve(__dirname, './ios/CombateAFraude.swift'),
        cfg.modRequest.platformProjectRoot + '/CombateAFraude.swift'
      )

      // Replace Main Briding-Header
      await fs.copyFile(
        path.resolve(__dirname, './ios/Bridging-Header.h'),
        srcRoot + `/${projName}-Bridging-Header.h`
      )

      cfg.modResults.addKnownRegion('pt-BR')
      cfg.modResults.removeKnownRegion('en')
      cfg.modResults.removeKnownRegion('Base')

      cfg.modResults.pbxProjectSection()[
        cfg.modResults.getFirstProject()['uuid']
      ]['developmentRegion'] = 'pt-BR'

      cfg.modResults = addBuildSourceFileToGroup({
        filepath: cfg.modRequest.platformProjectRoot + '/CombateAFraude.swift',
        groupName: projName,
        project: cfg.modResults,
      })

      cfg.modResults = addBuildSourceFileToGroup({
        filepath: cfg.modRequest.platformProjectRoot + '/CombateAFraude.m',
        groupName: projName,
        project: cfg.modResults,
      })

      return cfg
    })

  const withPods: ConfigPlugin<void> = (config) =>
    withDangerousMod(config, [
      'ios',
      async (config) => {
        const filePath = path.join(
          config.modRequest.platformProjectRoot,
          'Podfile'
        )
        const contents = await fs.readFile(filePath, 'utf-8')
        let results: any = {
          contents,
        }
        try {
          results = mergeContents({
            tag: 'DocumentDetector',
            src: results.contents,
            newSrc: `  pod 'DocumentDetectorNoSentry', '~> 7.12.0'`,
            anchor: /use_react_native!/,
            offset: 0,
            comment: '#',
          })
          results = mergeContents({
            tag: 'PassiveFaceLiveness',
            src: results.contents,
            newSrc: `  pod 'PassiveFaceLivenessNoSentry', '~> 5.25.0'`,
            anchor: /use_react_native!/,
            offset: 0,
            comment: '#',
          })
          results = mergeContents({
            tag: 'FaceAuthenticator',
            src: results.contents,
            newSrc: `  pod 'FaceAuthenticatorNoSentry', '~> 5.11.0'`,
            anchor: /use_react_native!/,
            offset: 0,
            comment: '#',
          })
          results.contents = `${results.contents}
source 'https://github.com/combateafraude/iOS.git'
source 'https://cdn.cocoapods.org/'
            `
        } catch (error: any) {
          if (error.code === 'ERR_NO_MATCH') {
            throw new Error(
              `Cannot add Combate a Fraude to the project's ios/Podfile because it's malformed. Please report this with a copy of your project Podfile.`
            )
          }
          throw error
        }

        if (results.didMerge || results.didClear) {
          await fs.writeFile(filePath, results.contents)
        }

        return config
      },
    ])

  return withPlugins(config, [withXcodeFiles, withPods])
}

const withCafAndroid: ConfigPlugin<void> = (config) => {
  const withCafSource: ConfigPlugin<void> = (expoCfg) => {
    return withDangerousMod(expoCfg, [
      'android',
      async (config) => {
        if (!config.android?.package) throw new Error('Missing package name')

        const androidSrcPath = config.android?.package?.replace(/\./gi, '/')

        await fs.copyFile(
          path.resolve(__dirname, './android/CombateAFraudeModule.java'),
          config.modRequest.platformProjectRoot +
            '/app/src/main/java/' +
            androidSrcPath +
            '/CombateAFraudeModule.java'
        )
        const moduleContents = await fs.readFile(
          config.modRequest.platformProjectRoot +
            '/app/src/main/java/' +
            androidSrcPath +
            '/CombateAFraudeModule.java'
        )

        await fs.writeFile(
          config.modRequest.platformProjectRoot +
            '/app/src/main/java/' +
            androidSrcPath +
            '/CombateAFraudeModule.java',
          moduleContents
            .toString()
            .replace(/\[\[PACKAGE\]\]/, config.android?.package)
        )
        await fs.copyFile(
          path.resolve(__dirname, './android/CombateAFraudePackage.java'),
          config.modRequest.platformProjectRoot +
            '/app/src/main/java/' +
            androidSrcPath +
            '/CombateAFraudePackage.java'
        )
        const packageContents = await fs.readFile(
          config.modRequest.platformProjectRoot +
            '/app/src/main/java/' +
            androidSrcPath +
            '/CombateAFraudePackage.java'
        )
        await fs.writeFile(
          config.modRequest.platformProjectRoot +
            '/app/src/main/java/' +
            androidSrcPath +
            '/CombateAFraudePackage.java',
          packageContents
            .toString()
            .replace(/\[\[PACKAGE\]\]/, config.android?.package)
        )

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

        return config
      },
    ])
  }

  const withFileMods: ConfigPlugin<void> = (config) => {
    // DISABLED DUE FAIL ON BUILD -- NEEDS REVIEW
    const mainActivity: ConfigPlugin<void> = (expoCfg) =>
      withMainApplication(expoCfg, async (config) => {
        config.modResults.contents = mergeContents({
          tag: 'Add Package',
          src: config.modResults.contents,
          newSrc: `      packages.add(new CombateAFraudePackage());`,
          anchor: /return packages/,
          offset: 0,
          comment: '//',
        }).contents
        return config
      })
    const projectBuild: ConfigPlugin<void> = (expoCfg) =>
      withProjectBuildGradle(expoCfg, async (config) => {
        config.modResults.contents = mergeContents({
          tag: 'Maven Repo',
          src: config.modResults.contents,
          newSrc: `        maven { url "https://repo.combateafraude.com/android/release" }`,
          anchor: /mavenLocal\(\)/,
          offset: 1,
          comment: '//',
        }).contents
        return config
      })
    const appBuild: ConfigPlugin<void> = (expoCfg) =>
      withAppBuildGradle(expoCfg, async (config) => {
        config.modResults.contents = mergeContents({
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
        }).contents

        config.modResults.contents = mergeContents({
          tag: 'Dependencies',
          src: config.modResults.contents,
          newSrc: `
    implementation 'com.combateafraude.sdk:document-detector:6.39.0'
    implementation 'com.combateafraude.sdk:passive-face-liveness:5.25.12'
    implementation 'com.combateafraude.sdk:face-authenticator:5.8.13'
          `,
          anchor: /dependencies {/,
          offset: 1,
          comment: '//',
        }).contents

        return config
      })

    return withPlugins(config, [mainActivity, projectBuild, appBuild])
  }

  return withPlugins(config, [withCafSource, withFileMods])
}

const mainPlugin: ConfigPlugin<void> = (config) =>
  withPlugins(config, [withCafIos, withCafAndroid])

export default mainPlugin
