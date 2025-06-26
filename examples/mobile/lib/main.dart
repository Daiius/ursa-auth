import 'package:flutter/material.dart';
import 'package:flutter_web_auth_2/flutter_web_auth_2.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import 'package:http/http.dart';
import 'dart:math';
import 'dart:convert';
import 'package:crypto/crypto.dart';

const String _authServerUrl = String.fromEnvironment('AUTH_SERVER_URL');
const String _signInPath = String.fromEnvironment('AUTH_SIGNIN_PATH');
const String _tokenPath = String.fromEnvironment('AUTH_TOKEN_PATH');
const String _callbackUrl = String.fromEnvironment('CALLBACK_URL');
const String _customScheme = String.fromEnvironment('CUSTOM_SCHEME');

const _storage = FlutterSecureStorage();
//const String _codeVerifierKey = 'code_verifier';
const String _tokenKey = 'ursa-auth-token';

String _base64UrlEncode(List<int> bytes) =>
  base64Url.encode(bytes).replaceAll('=', '');

String _generateCodeVerifier() {
  final random = Random.secure();
  final values = List<int>.generate(32, (_) => random.nextInt(256));
  return _base64UrlEncode(values);
}

String _calculateCodeChallenge(String codeVerifier) {
  final bytes = utf8.encode(codeVerifier);
  final digest = sha256.convert(bytes);
  return _base64UrlEncode(digest.bytes);
}



void main() {
  runApp(const MainApp());
}

class MainApp extends StatefulWidget {
  const MainApp({super.key});

  @override
  State<MainApp> createState() => _MainAppState();
}

class _MainAppState extends State<MainApp> {
  String? _receivedUrl;
  String? _receivedInfo;

  Future<void> _launchAuthFlow() async {
    try {
      final codeVerifier = _generateCodeVerifier();
      //await _storage.write(key: codeVerifierKey, value: codeVerifier);
      final codeChallenge = _calculateCodeChallenge(codeVerifier);

      final callbackUrlWithCodeChallenge = Uri.encodeComponent(
        "$_callbackUrl?codeChallenge=$codeChallenge"
      )
      ;
      final url = Uri.parse(
        "$_authServerUrl$_signInPath?callbackUrl=$callbackUrlWithCodeChallenge"
      );

      //print(url.toString());

      final result = await FlutterWebAuth2.authenticate(
        url: url.toString(),
        callbackUrlScheme: _customScheme,
      );
      setState(() {
        _receivedUrl = result;
      });

      final uriWithCode = Uri.parse(result);
      final code = uriWithCode.queryParameters['code'];
      if (code == null) throw 'No code received';
      
      //await _storage.read(key: 'code_verifier');

      final tokenResponse = await post(
        Uri.parse('$_authServerUrl$_tokenPath'),
        headers: { 'Content-Type': 'application/json' },
        body: jsonEncode({
          'code': code,
          'code_verifier': codeVerifier,
        }),
      );
      final token = tokenResponse.body;

      // 認証情報を保存
      await _storage.write(key: _tokenKey, value: token);

      final meResponse = await get(
        Uri.parse('$_authServerUrl/me'),
        headers: { 'Authorization': 'Bearer $token' },
      );
      final info = meResponse.body;

      setState(() {
        _receivedInfo = info;
      });

    } catch (e) {
      setState(() {
        _receivedUrl = 'Error: $e';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              ElevatedButton(
                onPressed: _launchAuthFlow,
                child:  Text('launch browser!'),
              ),
              Text('Received link: $_receivedUrl'),
              Text('info: $_receivedInfo'),
            ],
          ),
        ),
      ),
    );
  }
}

