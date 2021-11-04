import { ConfigPlugin } from '@expo/config-plugins';
import { withDangerousMod } from '@expo/config-plugins';
import { mergeContents } from '@expo/config-plugins/build/utils/generateCode';
import fs from 'fs-extra';
import path from 'path';

const withCombateAFraude: ConfigPlugin<{ name?: string }> = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const filePath = path.join(
        config.modRequest.platformProjectRoot,
        'Podfile'
      );
      const contents = await fs.readFile(filePath, 'utf-8');
      let results: any = {
        contents,
      };
      try {
        results = addExternalPod(
          results.contents,
          `'DocumentDetector', '~> 4.8.3'`
        );
        results = addExternalPod(
          results.contents,
          `'PassiveFaceLiveness', '~> 3.7.2'`
        );
        results = addExternalPod(
          results.contents,
          `'FaceAuthenticator', '~> 2.5.0'`
        );
        // results = mergeContents({
        //   tag: 'useExpoSources',
        //   src: results.contents,
        //   newSrc: `$ExpoUseSources = ['@unimodules/core']\n`,
        //   anchor: /platform :ios/,
        //   offset: 0,
        //   comment: '#',
        // });
        results = mergeContents({
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
      } catch (error: any) {
        if (error.code === 'ERR_NO_MATCH') {
          throw new Error(
            `Cannot add Combate a Fraude to the project's ios/Podfile because it's malformed. Please report this with a copy of your project Podfile.`
          );
        }
        throw error;
      }

      if (results.didMerge || results.didClear) {
        await fs.writeFile(filePath, results.contents);
      }
      await fs.copyFile(
        './CAF/CombateAFraude.m',
        config.modRequest.platformProjectRoot + '/CombateAFraude.m'
      );
      await fs.copyFile(
        './CAF/CombateAFraude.swift',
        config.modRequest.platformProjectRoot + '/CombateAFraude.swift'
      );
      await fs.copyFile(
        './CAF/CombateAFraude-Bridging-Header.h',
        config.modRequest.platformProjectRoot +
          '/CombateAFraude-Bridging-Header.h'
      );

      await fs.copyFile(
        './CAF/CombateAFraude.m',
        config.modRequest.platformProjectRoot + '/4UBank/CombateAFraude.m'
      );
      await fs.copyFile(
        './CAF/CombateAFraude.swift',
        config.modRequest.platformProjectRoot + '/4UBank/CombateAFraude.swift'
      );
      await fs.copyFile(
        './CAF/CombateAFraude-Bridging-Header.h',
        config.modRequest.platformProjectRoot +
          '/4UBank/CombateAFraude-Bridging-Header.h'
      );
      console.log(
        '-------------------------------------------------------------------------'
      );
      console.log(results.contents);
      console.log(
        '-------------------------------------------------------------------------'
      );
      console.log({ dir: config.modRequest.platformProjectRoot });
      return config;
    },
  ]);
};

function addExternalPod(src: string, podName: string) {
  return mergeContents({
    tag: 'ExternalPod' + String(Math.random()).substring(-3),
    src,
    newSrc: `  pod ${podName}`,
    anchor: /use_react_native!/,
    offset: 0,
    comment: '#',
  });
}

export default withCombateAFraude;
