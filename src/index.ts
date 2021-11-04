import {
  ConfigPlugin,
  withPlugins,
  withXcodeProject,
} from '@expo/config-plugins'
import { withDangerousMod } from '@expo/config-plugins'
import { getSourceRoot } from '@expo/config-plugins/build/ios/Paths'
import {
  addBuildSourceFileToGroup,
  getProjectName,
} from '@expo/config-plugins/build/ios/utils/Xcodeproj'
import { mergeContents } from '@expo/config-plugins/build/utils/generateCode'
import fs from 'fs-extra'
import path from 'path'

const withCombateAFraude: ConfigPlugin<void> = (config) => {
  return withDangerousMod(config, [
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
}

const withCafFiles: ConfigPlugin = (config) => {
  return withXcodeProject(config, async (cfg) => {
    const srcRoot = getSourceRoot(cfg.modRequest.projectRoot)
    const projName = getProjectName(cfg.modRequest.projectRoot)

    // Copy CombateAFraude Source Files
    await fs.copyFile(
      path.resolve(__dirname, './caf/CombateAFraude.m'),
      cfg.modRequest.platformProjectRoot + '/CombateAFraude.m'
    )
    await fs.copyFile(
      path.resolve(__dirname, './caf/CombateAFraude.swift'),
      cfg.modRequest.platformProjectRoot + '/CombateAFraude.swift'
    )

    // Replace Main Briding-Header
    await fs.copyFile(
      path.resolve(__dirname, './caf/Bridging-Header.h'),
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
}

const mainPlugin: ConfigPlugin<void> = (config) =>
  withPlugins(config, [
    [withCombateAFraude, {}],
    [withCafFiles, {}],
  ])

export default mainPlugin
