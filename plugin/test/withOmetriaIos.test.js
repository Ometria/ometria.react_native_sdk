const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  addFirebaseConfigure,
  shouldAddFirebaseConfigure,
} = require('../build/withOmetriaIos');

// Unmodified AppDelegate.swift from expo-template-bare-minimum (SDK 57 and 58)
const fixture = (name) =>
  fs.readFileSync(path.join(__dirname, 'fixtures', name), 'utf8');
const expo57 = fixture('AppDelegate-expo57.swift');
const expo58 = fixture('AppDelegate-expo58.swift');

const count = (haystack, needle) => haystack.split(needle).length - 1;

test('Expo 58: inserts a guarded FirebaseApp.configure() before return super.application', () => {
  const result = addFirebaseConfigure(expo58);

  assert.equal(count(result, 'FirebaseApp.configure()'), 1);
  assert.match(
    result,
    /\n    if FirebaseApp\.app\(\) == nil \{\n      FirebaseApp\.configure\(\)\n    \}\n    return super\.application\(application, didFinishLaunchingWithOptions: launchOptions\)/
  );
});

test('Expo 58: adds import FirebaseCore after import Expo', () => {
  const result = addFirebaseConfigure(expo58);

  assert.equal(count(result, 'import FirebaseCore'), 1);
  assert.match(result, /^internal import Expo\nimport FirebaseCore\n/);
});

test('Expo 58: keeps an existing import FirebaseCore (added by RNFB 26)', () => {
  const withImport = expo58.replace(
    'internal import Expo\n',
    'internal import Expo\nimport FirebaseCore\n'
  );
  const result = addFirebaseConfigure(withImport);

  assert.equal(count(result, 'import FirebaseCore'), 1);
  assert.equal(count(result, 'FirebaseApp.configure()'), 1);
});

for (const existingImport of [
  'internal import FirebaseCore',
  '@preconcurrency import FirebaseCore',
  'import Firebase',
]) {
  test(`Expo 58: doesn't add import FirebaseCore next to "${existingImport}"`, () => {
    const withImport = expo58.replace(
      'internal import Expo\n',
      `internal import Expo\n${existingImport}\n`
    );
    const result = addFirebaseConfigure(withImport);

    assert.equal(count(result, '\nimport FirebaseCore\n'), 0);
    assert.equal(count(result, 'FirebaseApp.configure()'), 1);
  });
}

test('Expo 57: inserts before factory.startReactNative, like RNFB', () => {
  const result = addFirebaseConfigure(expo57);

  assert.equal(count(result, 'FirebaseApp.configure()'), 1);
  assert.ok(
    result.indexOf('FirebaseApp.configure()') <
      result.indexOf('factory.startReactNative(')
  );
});

test('no-op when FirebaseApp.configure() is already there', () => {
  const configured = expo58.replace(
    '    return super.application(application, didFinishLaunchingWithOptions: launchOptions)',
    'FirebaseApp.configure()\n    return super.application(application, didFinishLaunchingWithOptions: launchOptions)'
  );

  assert.equal(addFirebaseConfigure(configured), configured);
});

test('is idempotent across repeated prebuilds', () => {
  const once = addFirebaseConfigure(expo58);

  assert.equal(addFirebaseConfigure(once), once);
});

test('leaves the file unchanged when there is no anchor', () => {
  const noAnchor = 'import UIKit\n\nclass AppDelegate {}\n';
  const warn = console.warn;
  console.warn = () => {};
  try {
    assert.equal(addFirebaseConfigure(noAnchor), noAnchor);
  } finally {
    console.warn = warn;
  }
});

const projectWith = (dependencies) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ometria-plugin-'));
  fs.writeFileSync(
    path.join(dir, 'package.json'),
    JSON.stringify({ dependencies })
  );
  return dir;
};

test('gating: only Swift apps with RNFB and a GoogleService-Info.plist', () => {
  const withRnfb = projectWith({ '@react-native-firebase/app': '^26.4.1' });
  const withoutRnfb = projectWith({ expo: '~58.0.21' });
  const plist = './GoogleService-Info.plist';

  assert.equal(shouldAddFirebaseConfigure('swift', plist, withRnfb), true);
  assert.equal(shouldAddFirebaseConfigure('objc', plist, withRnfb), false);
  assert.equal(shouldAddFirebaseConfigure('swift', undefined, withRnfb), false);
  assert.equal(shouldAddFirebaseConfigure('swift', plist, withoutRnfb), false);
  assert.equal(
    shouldAddFirebaseConfigure('swift', plist, path.join(os.tmpdir(), 'missing')),
    false
  );
});
