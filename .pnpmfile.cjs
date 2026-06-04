/**
 * The Ometria SDK does not use `expo` to build — it only needs
 * `@expo/config-plugins` (which has no `expo` dependency). `expo` is declared
 * only as an OPTIONAL peer dependency to signal Expo SDK compatibility to
 * consumers. We strip that optional peer during resolution so pnpm's
 * `autoInstallPeers` doesn't pull the whole Expo CLI toolchain into this
 * library's dev lockfile (which otherwise floods security scans with
 * build-tooling CVEs that never ship). The real Expo app lives in
 * `example-expo/` and keeps `expo` in its own lockfile.
 */
function readPackage(pkg) {
  if (pkg.peerDependenciesMeta?.expo?.optional) {
    if (pkg.peerDependencies) delete pkg.peerDependencies.expo;
    delete pkg.peerDependenciesMeta.expo;
  }
  return pkg;
}

module.exports = { hooks: { readPackage } };
