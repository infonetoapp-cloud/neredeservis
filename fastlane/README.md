# Fastlane Setup

This folder defines the requested lanes:

- `beta_android`
- `release_android`
- `beta_ios`
- `release_ios`

## Prerequisites

- Ruby + Fastlane installed
- Flutter SDK available in PATH
- Store credentials exported as env vars when upload is needed

## Local build only (no upload)

```bash
fastlane beta_android flavor:stg
fastlane release_android flavor:prod
fastlane beta_ios flavor:stg
fastlane release_ios flavor:prod
```

By default uploads are disabled. Set these flags to enable:

- Android upload: `PLAY_UPLOAD=1`
- iOS upload: `IOS_UPLOAD=1`

## Environment variables

- `PLAY_PACKAGE_NAME`
- `SUPPLY_JSON_KEY`
- `IOS_BUNDLE_ID`
- `APPLE_ID`
- `ASC_TEAM_ID`
- `APPLE_TEAM_ID`

Optional flavor env file support:

- If `.env.dev`, `.env.stg`, `.env.prod` exists, the lane auto-appends
  `--dart-define-from-file=.env.<flavor>`.
