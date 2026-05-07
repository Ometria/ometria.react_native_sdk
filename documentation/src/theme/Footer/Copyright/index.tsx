import React from 'react';
import { useLocation } from '@docusaurus/router';

const SDK_GITHUB_URLS = {
  ios: 'https://github.com/Ometria/ometria.ios_sdk',
  android: 'https://github.com/Ometria/ometria.android_sdk',
  'react-native': 'https://github.com/Ometria/ometria.react_native_sdk',
};

const SECTION_RE = /(?:^|\/)(ios|android|react-native)(?:\/|$)/;

export default function Copyright() {
  const { pathname } = useLocation();
  const match = pathname.match(SECTION_RE);
  const githubUrl = match
    ? SDK_GITHUB_URLS[match[1] as keyof typeof SDK_GITHUB_URLS]
    : null;

  return (
    <div className="footer__copyright">
      {githubUrl && (
        <>
          <a href={githubUrl} target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
          {' · '}
        </>
      )}
      <a href="https://ometria.com" target="_blank" rel="noopener noreferrer">
        Ometria
      </a>
      {' · '}
      <a href="https://support.ometria.com/" target="_blank" rel="noopener noreferrer">
        Support
      </a>
      {' · Copyright © '}
      {new Date().getFullYear()} Ometria
    </div>
  );
}
