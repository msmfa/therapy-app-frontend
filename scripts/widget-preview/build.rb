#!/usr/bin/env ruby
# Generates an isolated, simulator-only host and a real WidgetKit extension.
require 'xcodeproj'
require 'fileutils'
root = File.expand_path('../..', __dir__)
out = File.join(root, 'output/widget-preview')
FileUtils.mkdir_p(out)
project = Xcodeproj::Project.new(File.join(out, 'StreakPreview.xcodeproj'))
app = project.new_target(:application, 'StreakPreview', :ios, '17.0')
widget = project.new_target(:app_extension, 'ProgressWidget', :ios, '17.0')
source = project.main_group.new_group('Sources', '../../native/widget-preview')
shared = project.main_group.new_file('../../native/progress-widget/ProgressWidgetView.swift')
fixture = source.new_file('PreviewSample.swift')
app.add_file_references([shared, fixture, source.new_file('PreviewApp.swift')])
widget.add_file_references([shared, fixture, source.new_file('WidgetExtension.swift')])
fonts = project.main_group.new_group('Fonts', '../../assets/fonts')
['DMSans-Bold.ttf', 'GeneralSans-Regular.otf', 'GeneralSans-Medium.otf', 'GeneralSans-Semibold.otf'].each do |font|
  ref = fonts.new_file(font)
  [app, widget].each { |target| target.resources_build_phase.add_file_reference(ref) }
end
entitlements = {'com.apple.security.application-groups' => ['group.com.plastic-brains.widgetpreview']}
Xcodeproj::Plist.write_to_path(entitlements, File.join(out, 'Preview.entitlements'))
[app, widget].each do |target|
  is_widget = target == widget
  info = {
    'CFBundleDisplayName' => is_widget ? 'Check-in streak' : 'Streak Preview',
    'CFBundleIdentifier' => '$(PRODUCT_BUNDLE_IDENTIFIER)',
    'CFBundleExecutable' => '$(EXECUTABLE_NAME)',
    'CFBundleName' => '$(PRODUCT_NAME)',
    'CFBundlePackageType' => is_widget ? 'XPC!' : 'APPL',
    'CFBundleShortVersionString' => '1.0',
    'CFBundleVersion' => '1',
    'UIAppFonts' => ['DMSans-Bold.ttf', 'GeneralSans-Regular.otf', 'GeneralSans-Medium.otf', 'GeneralSans-Semibold.otf']
  }
  if is_widget
    info['NSExtension'] = {'NSExtensionPointIdentifier' => 'com.apple.widgetkit-extension'}
  else
    info['UILaunchScreen'] = {}
    info['UISupportedInterfaceOrientations'] = ['UIInterfaceOrientationPortrait']
    info['CFBundleURLTypes'] = [{'CFBundleURLSchemes' => ['plasticbrains-widget-preview']}]
  end
  Xcodeproj::Plist.write_to_path(info, File.join(out, "#{target.name}-Info.plist"))
  target.build_configurations.each do |config|
    config.build_settings.merge!({
      'PRODUCT_BUNDLE_IDENTIFIER' => is_widget ? 'com.plastic-brains.widgetpreview.progress' : 'com.plastic-brains.widgetpreview',
      'INFOPLIST_FILE' => "#{target.name}-Info.plist",
      'SWIFT_VERSION' => '5.0',
      'TARGETED_DEVICE_FAMILY' => '1',
      'CODE_SIGN_ENTITLEMENTS' => 'Preview.entitlements',
      'CODE_SIGNING_ALLOWED' => 'YES',
      'CODE_SIGN_IDENTITY' => '-',
      'SDKROOT' => 'iphonesimulator',
      'SUPPORTED_PLATFORMS' => 'iphonesimulator',
      'SKIP_INSTALL' => is_widget ? 'YES' : 'NO',
      'LD_RUNPATH_SEARCH_PATHS' => ['$(inherited)', '@executable_path/Frameworks', '@executable_path/../../Frameworks']
    })
    config.build_settings['APPLICATION_EXTENSION_API_ONLY'] = 'YES' if is_widget
  end
end
app.add_dependency(widget)
embed = app.new_copy_files_build_phase('Embed App Extensions')
embed.dst_subfolder_spec = '13'
embed.add_file_reference(widget.product_reference).settings = {'ATTRIBUTES' => ['RemoveHeadersOnCopy']}
project.save
scheme = Xcodeproj::XCScheme.new
scheme.add_build_target(app)
scheme.set_launch_target(app)
scheme.save_as(project.path, 'StreakPreview', true)
puts project.path
