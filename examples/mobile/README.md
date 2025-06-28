# UrsaAuth example application (Flutter)

A Flutter project for UrsaAuth example, for mobile applications.

(Currently, iOS application settings only.)

## setup
### .env file preparation
define your `.env.development` file contains these values:
- `LS_APPLICATION_QUERY_SCHEMES`:
  - for ios/Runner/Info.plist. your application's custum scheme, like `your-application://`.
- `CUSTOM_SCHEME`: 
  - for ios/Runner/Info.plist and application config. your application's custom scheme, like `your-application://`, same as the above.
- `AUTH_SERVER_URL`:
  - for application config. your authentication server url, like `https://auth.your-server.com`.
- `AUTH_SIGNIN_PATH`:
  - for application config. your authentication server's singin endpoint, like `/api/auth/signin`.
- `AUTH_TOKEN_PATH`:
  - for application config. your authentication server's token endpoint, like `/token`.
- `CALLBACK_URL`:
  - for application config. your authentication server's callbackUrl setting, like `https://auth.your-server.com/mobile?callbackUrl=your-application://callback`.

### run-flutter
this script inject variables in your .env file into:
- ios/Runner/Info.plist: iOS native application settings
- `--dart-define` options: accessible by `String.fromEnvironment('ENV_VAL_NAME')`

and `flutter run` command is called in this bash script.

