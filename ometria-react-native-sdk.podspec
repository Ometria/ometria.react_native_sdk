require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "ometria-react-native-sdk"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => "11.0" }
  s.source       = { :git => "https://github.com/Ometria/ometria.react-native_sdk.git", :tag => "#{s.version}" }
  s.requires_arc = true
  s.static_framework = true
  s.swift_version = '5.0'

  s.source_files = "ios/**/*.{h,m,mm,swift}"

  s.dependency "React-Core"
  s.dependency "Ometria", '~> 1.8.2'

  if ENV['RCT_NEW_ARCH_ENABLED'] == '1'
    if respond_to?(:install_modules_dependencies, true)
      install_modules_dependencies(s)
    else
      s.dependency 'React-Codegen'
      s.dependency 'RCTRequired'
      s.dependency 'RCTTypeSafety'
      s.dependency 'ReactCommon/turbomodule/core'
    end

    # Post-install script to patch Codegen output
    s.script_phase = {
      :name => 'Patch Codegen for TurboModule Registration',
      :script => 'node "${PODS_TARGET_SRCROOT}/scripts/patch-codegen.js" "${PODS_ROOT}/../"',
      :execution_position => :after_compile
    }
  end
end
