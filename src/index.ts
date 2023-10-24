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

      // Copy CafModule Source Files
      await fs.copyFile(
        path.resolve(__dirname, './ios/CafModule.m'),
        cfg.modRequest.platformProjectRoot + '/CafModule.m'
      )
      await fs.copyFile(
        path.resolve(__dirname, './ios/CafModule.swift'),
        cfg.modRequest.platformProjectRoot + '/CafModule.swift'
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

      cfg.modResults = addBuildSourceFileToGroup({
        filepath: cfg.modRequest.platformProjectRoot + '/CafModule.swift',
        groupName: projName,
        project: cfg.modResults,
      })

      cfg.modResults = addBuildSourceFileToGroup({
        filepath: cfg.modRequest.platformProjectRoot + '/CafModule.m',
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
            newSrc: [
              `  pod 'DocumentDetectorNoSentry', '~> 8.0.3'`,
              `  pod 'PassiveFaceLivenessNoSentry', '~> 6.0.0-rc02'`,
              `  pod 'FaceAuthenticatorNoSentry', '~> 5.11.0'`,
              `  pod 'FaceLivenessNoSentry', '~> 3.1.2'`,
            ].join('\n'),
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
          path.resolve(__dirname, './android/CafModule.java'),
          config.modRequest.platformProjectRoot +
            '/app/src/main/java/' +
            androidSrcPath +
            '/CafModule.java'
        )
        const moduleContentsCaf = await fs.readFile(
          config.modRequest.platformProjectRoot +
            '/app/src/main/java/' +
            androidSrcPath +
            '/CafModule.java'
        )

        await fs.writeFile(
          config.modRequest.platformProjectRoot +
            '/app/src/main/java/' +
            androidSrcPath +
            '/CafModule.java',
          moduleContentsCaf
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

        await fs.copyFile(
          path.resolve(__dirname, './android/CafPackage.java'),
          config.modRequest.platformProjectRoot +
            '/app/src/main/java/' +
            androidSrcPath +
            '/CafPackage.java'
        )
        const packageContentsCaf = await fs.readFile(
          config.modRequest.platformProjectRoot +
            '/app/src/main/java/' +
            androidSrcPath +
            '/CafPackage.java'
        )
        await fs.writeFile(
          config.modRequest.platformProjectRoot +
            '/app/src/main/java/' +
            androidSrcPath +
            '/CafPackage.java',
          packageContentsCaf
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
          newSrc: `      packages.add(new CombateAFraudePackage()); packages.add(new CafPackage());`,
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
          newSrc: `
            maven { url "https://raw.githubusercontent.com/iProov/android/master/maven/" }
            maven { url "https://repo.combateafraude.com/android/release" }
          `,
          anchor: /https:\/\/www.jitpack.io/,
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
  buildFeatures {
    dataBinding = true
  }

  compileOptions {
    sourceCompatibility = JavaVersion.VERSION_1_8
    targetCompatibility = JavaVersion.VERSION_1_8
  }

  aaptOptions {
    noCompress "tflite"
  }`,
          anchor: /android {/,
          offset: 1,
          comment: '//',
        }).contents

        config.modResults.contents = mergeContents({
          tag: 'Dependencies',
          src: config.modResults.contents,
          newSrc: `
          implementation 'com.combateafraude.sdk:document-detector:7.0.0'
          implementation 'com.combateafraude.sdk:passive-face-liveness:6.0.0-rc07'
          implementation 'com.combateafraude.sdk:face-authenticator:5.8.14'
          implementation 'com.combateafraude.sdk:new-face-liveness:1.5.1'
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
