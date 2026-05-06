import React from 'react';
import { useLocation } from '@docusaurus/router';
import DefaultNavbarItem from '@theme/NavbarItem/DefaultNavbarItem';
import type { Props as DefaultNavbarItemProps } from '@theme/NavbarItem/DefaultNavbarItem';

const URLS = {
  ios: 'https://github.com/Ometria/ometria.ios_sdk/',
  android: 'https://github.com/Ometria/ometria.android_sdk/',
  'react-native': 'https://github.com/Ometria/ometria.react_native_sdk',
};
const DEFAULT_URL = 'https://github.com/Ometria/';

const SECTION_RE = /(?:^|\/)(ios|android|react-native)(?:\/|$)/;

export default function SdkGithubLink(props: DefaultNavbarItemProps) {
  const { pathname } = useLocation();
  const match = pathname.match(SECTION_RE);
  const href = match ? URLS[match[1] as keyof typeof URLS] : DEFAULT_URL;
  return <DefaultNavbarItem {...props} href={href} />;
}
