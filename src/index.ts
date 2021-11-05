import {
  ConfigPlugin,
  ExportedConfigWithProps,
  withAppBuildGradle,
  withMainApplication,
  withPlugins,
  withProjectBuildGradle,
  withXcodeProject,
} from '@expo/config-plugins'
import { withDangerousMod } from '@expo/config-plugins'
import { ApplicationProjectFile } from '@expo/config-plugins/build/android/Paths'
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
        path.resolve(__dirname, './caf/ios/CombateAFraude.m'),
        cfg.modRequest.platformProjectRoot + '/CombateAFraude.m'
      )
      await fs.copyFile(
        path.resolve(__dirname, './caf/ios/CombateAFraude.swift'),
        cfg.modRequest.platformProjectRoot + '/CombateAFraude.swift'
      )

      // Replace Main Briding-Header
      await fs.copyFile(
        path.resolve(__dirname, './caf/ios/Bridging-Header.h'),
        srcRoot + `/${projName}-Bridging-Header.h`
      )

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
        filepath: cfg.modRequest.platformProjectRoot + '/Bridging-Header.h',
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
            newSrc: `  pod 'DocumentDetector', '~> 4.8.3'`,
            anchor: /use_react_native!/,
            offset: 0,
            comment: '#',
          })
          results = mergeContents({
            tag: 'PassiveFaceLiveness',
            src: results.contents,
            newSrc: `  pod 'PassiveFaceLiveness', '~> 3.7.2'`,
            anchor: /use_react_native!/,
            offset: 0,
            comment: '#',
          })
          results = mergeContents({
            tag: 'FaceAuthenticator',
            src: results.contents,
            newSrc: `  pod 'FaceAuthenticator', '~> 2.5.0'`,
            anchor: /use_react_native!/,
            offset: 0,
            comment: '#',
          })
          results = mergeContents({
            tag: 'useFrameworks',
            src: results.contents,
            newSrc: `use_frameworks!\n`,
            anchor: /platform :ios/,
            offset: 1,
            comment: '#',
          })
          results.contents =
            results.contents +
            "source 'https://github.com/combateafraude/iOS.git'\n" +
            "source 'https://cdn.cocoapods.org/'\n"
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

  return withPlugins(config, [
    [withXcodeFiles, {}],
    [withPods, {}],
  ])
}

const withCafAndroid: ConfigPlugin<void> = (config) => {
  const withCafSource: ConfigPlugin<any> = (expoCfg) => {
    return withDangerousMod(expoCfg, [
      'android',
      async (config) => {
        await fs.copyFile(
          path.resolve(__dirname, './caf/android/CombateAFraudeModule.java'),
          config.modRequest.platformProjectRoot +
            '/app/src/main/java/br/com/b4u/CombateAFraudeModule.java'
        )

        await fs.copyFile(
          path.resolve(__dirname, './caf/android/CombateAFraudePackage.java'),
          config.modRequest.platformProjectRoot +
            '/app/src/main/java/br/com/b4u/CombateAFraudePackage.java'
        )

        return config
      },
    ])
  }

  const withMainAtv: ConfigPlugin<any> = (config) => {
    return withMainApplication(config, async (config) => {
      let mainApplication = config.modResults.contents
      mainApplication = mergeContents({
        tag: 'Package',
        src: config.modResults.contents,
        newSrc: `      packages.add(new CombateAFraudePackage());`,
        anchor: /new PackageList\(this\)\.getPackages\(\)/,
        offset: 1,
        comment: '//',
      }).contents
      // console.log('MAIN APPLICATION => ', mainApplication)
      return Object.assign(config, {
        modResults: {
          contents: mainApplication,
        },
      })
    })
  }

  const withBuildGradle: ConfigPlugin<void> = (config) => {
    const projectBuild: ConfigPlugin<void> = (expoCfg) =>
      withProjectBuildGradle(expoCfg, async (config) => {
        let mainApplication = config.modResults.contents
        mainApplication = mergeContents({
          tag: 'Maven Repo',
          src: config.modResults.contents,
          newSrc: `        maven { url "https://repo.combateafraude.com/android/release" }`,
          anchor: /mavenLocal\(\)/,
          offset: 1,
          comment: '//',
        }).contents
        // console.log('PROJECT BUILD GRADLE => ', mainApplication)
        return Object.assign(config, {
          modResults: {
            contents: mainApplication,
          },
        })
      })
    const appBuild: ConfigPlugin<void> = (expoCfg) =>
      withAppBuildGradle(expoCfg, async (config) => {
        let mainApplication = config.modResults.contents
        mainApplication = mergeContents({
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
        }).contents
        mainApplication = mergeContents({
          tag: 'Dependencies',
          src: config.modResults.contents,
          newSrc: `
    implementation "com.combateafraude.sdk:passive-face-liveness:+"
    implementation "com.combateafraude.sdk:document-detector:+"
    implementation "com.combateafraude.sdk:face-authenticator:+"
          `,
          anchor: /dependencies {/,
          offset: 1,
          comment: '//',
        }).contents
        console.log('APP BUILD GRADLE => ', mainApplication)
        return Object.assign(config, {
          modResults: {
            contents: mainApplication,
          },
        })
      })

    return withPlugins(config, [
      [projectBuild, {}],
      [appBuild, {}],
    ])
  }

  return withPlugins(config, [
    [withCafSource, {}],
    [withMainAtv, {}],
    [withBuildGradle, {}],
  ])
}

const mainPlugin: ConfigPlugin<void> = (config) =>
  withPlugins(config, [
    [withCafIos, {}],
    [withCafAndroid, {}],
  ])

export default mainPlugin
