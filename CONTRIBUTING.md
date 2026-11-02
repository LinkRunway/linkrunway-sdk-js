# Contributing to LinkRunway

Bug reports, documentation fixes, and focused code changes are welcome. Read the repository README and [code of conduct](https://github.com/LinkRunway/.github/blob/main/CODE_OF_CONDUCT.md) first. Report vulnerabilities through the [security policy](https://github.com/LinkRunway/.github/blob/main/SECURITY.md), never a public issue.

## Before changing code

1. Search existing issues and releases. For a substantial API or behavior change, open an issue describing the problem and proposed approach first.
2. Fork the affected repository and create a branch from its current default branch. Public SDK contributions do not require access to a private repository.
3. Keep changes focused. Preserve compatibility, consent handling, credential boundaries, and documented retry/idempotency behavior. Add a regression test when fixing a behavioral defect.
4. Run the relevant checks below and update examples or documentation when behavior changes.
5. Open a pull request explaining the problem, resulting behavior, and checks actually run. State any unavailable device or provider checks. Do not claim an unrun check passed.

## Local checks

Run commands from the repository root. Requirements for integrating the SDK into an app may differ from those for developing the SDK itself.

| Repository                               | Development requirements                           | Checks                                                                                                               |
| ---------------------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| JavaScript, React Native, Expo           | Node.js 22.13+ and npm                             | `npm install`, `npm run typecheck`, `npm test`, `npm run build`, `npm audit`                                         |
| iOS                                      | Swift 6 / a compatible Xcode installation          | `swift test`; use `sh Scripts/verify.sh <scratch-path>` for the available Apple simulator checks                     |
| Android                                  | JDK 17 and Android SDK 35                          | `./gradlew testDebugUnitTest assembleRelease`; `./gradlew connectedDebugAndroidTest` also needs a device or emulator |
| Dart / Flutter                           | Dart 3.7+ or a compatible Flutter SDK              | `dart pub get`, `dart analyze --fatal-infos`, `dart test`, `dart format --output=none --set-exit-if-changed .`       |
| Organization profile and community files | A Markdown editor; YAML validation for issue forms | Check rendered Markdown, links, form IDs/required fields, and public visibility of referenced resources              |

Use disposable test accounts and sandbox provider credentials. Never commit `.env` files, secrets, databases, build output, or personal/customer data. For native integrations, clearly distinguish unit/emulator results from physical-device and store-distributed app checks.

## Review and releases

SDK repositories publish independently. Maintainers synchronize accepted SDK changes with the internal source and regenerate exports before release; you can submit a normal pull request to the public repository. Do not change package versions or rewrite published tags/assets as part of an unrelated fix.

Use concise commit subjects. In SDK repositories, enable the existing local commit hook with `git config core.hooksPath .githooks`. Maintainers run release checks locally; do not assume a missing hosted CI check means verification passed.

SDK contributions remain under the repository's existing MIT license. Preserve third-party notices and explain any new dependency. The private platform's licensing and contributor requirements are documented separately in that repository.
