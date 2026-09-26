const fs = require('fs');
const path = require('path');
const plist = require('@expo/plist').default;
const { withEntitlementsPlist, withXcodeProject } = require('expo/config-plugins');
const TARGET = 'ProgressWidget';
const GROUP = 'group.com.plastic-brains.app.progress';

function configureProject(project, root, iosRoot, version = '1.0.0', build = '1') {
    const dir = path.join(iosRoot, TARGET);
    fs.mkdirSync(dir, { recursive: true });
    for (const name of ['ProgressWidget.swift', 'ProgressWidgetView.swift', 'ProgressWidgetBridge.swift', 'ProgressWidgetBridge.m']) {
        fs.copyFileSync(path.join(root, 'native/progress-widget', name), path.join(dir, name));
    }
    const fonts = ['DMSans-Bold.ttf', 'GeneralSans-Regular.otf', 'GeneralSans-Medium.otf'];
    fonts.forEach(name => fs.copyFileSync(path.join(root, 'assets/fonts', name), path.join(dir, name)));
    fs.writeFileSync(path.join(dir, 'ProgressWidget-Info.plist'), plist.build({
        CFBundleDisplayName: 'Plastic Brains', CFBundleIdentifier: '$(PRODUCT_BUNDLE_IDENTIFIER)',
        CFBundleExecutable: '$(EXECUTABLE_NAME)', CFBundleName: '$(PRODUCT_NAME)', CFBundlePackageType: 'XPC!',
        CFBundleShortVersionString: '$(MARKETING_VERSION)', CFBundleVersion: '$(CURRENT_PROJECT_VERSION)',
        NSExtension: { NSExtensionPointIdentifier: 'com.apple.widgetkit-extension' }, UIAppFonts: fonts,
    }));
    fs.writeFileSync(path.join(dir, 'ProgressWidget.entitlements'), plist.build({ 'com.apple.security.application-groups': [GROUP] }));
    let target = Object.entries(project.pbxNativeTargetSection()).find(([key, value]) => !key.endsWith('_comment') && value.name?.replaceAll('"', '') === TARGET);
    let uuid;
    if (target) uuid = target[0];
    else {
        const created = project.addTarget(TARGET, 'app_extension', TARGET, 'com.plastic-brains.app.progress');
        uuid = created.uuid;
        project.addBuildPhase([], 'PBXSourcesBuildPhase', 'Sources', uuid);
        project.addBuildPhase([], 'PBXResourcesBuildPhase', 'Resources', uuid);
        project.addBuildPhase([], 'PBXFrameworksBuildPhase', 'Frameworks', uuid);
    }
    const main = project.getFirstTarget().uuid;
    const group = project.findPBXGroupKey({ name: TARGET }) || project.addPbxGroup([], TARGET, TARGET).uuid;
    const rootGroup = project.getFirstProject().firstProject.mainGroup;
    const rootChildren = project.getPBXGroupByKey(rootGroup).children;
    if (!rootChildren.some(child => child.value === group)) rootChildren.push({ value: group, comment: TARGET });
    for (const name of ['ProgressWidget.swift', 'ProgressWidgetView.swift']) {
        if (!project.hasFile(name)) project.addSourceFile(name, { target: uuid }, group);
    }
    for (const name of ['ProgressWidgetBridge.swift', 'ProgressWidgetBridge.m']) {
        if (!project.hasFile(name)) project.addSourceFile(name, { target: main }, group);
    }
    if (!project.pbxGroupByName('Resources')) {
        const resources = project.addPbxGroup([], 'Resources').uuid;
        rootChildren.push({ value: resources, comment: 'Resources' });
    }
    fonts.forEach(name => {
        // Use unique file names/paths: the main app already has these fonts.
        const fontPath = `${TARGET}/${name}`;
        if (!project.hasFile(fontPath)) project.addResourceFile(fontPath, { target: uuid }, rootGroup);
    });
    const nativeTarget = project.pbxNativeTargetSection()[uuid];
    const configs = project.pbxXCConfigurationList()[nativeTarget.buildConfigurationList].buildConfigurations;
    const mainTarget = project.pbxNativeTargetSection()[main];
    const mainConfigs = project.pbxXCConfigurationList()[mainTarget.buildConfigurationList].buildConfigurations;
    configs.forEach(ref => {
        const cfg = project.pbxXCBuildConfigurationSection()[ref.value];
        const host = mainConfigs.map(r => project.pbxXCBuildConfigurationSection()[r.value]).find(c => c.name === cfg.name)?.buildSettings ?? {};
        Object.assign(cfg.buildSettings, {
            SWIFT_VERSION: '5.0', IPHONEOS_DEPLOYMENT_TARGET: '17.0', TARGETED_DEVICE_FAMILY: '"1,2"',
            APPLICATION_EXTENSION_API_ONLY: 'YES', CODE_SIGN_STYLE: 'Automatic',
            CODE_SIGN_ENTITLEMENTS: `${TARGET}/ProgressWidget.entitlements`,
            PRODUCT_BUNDLE_IDENTIFIER: 'com.plastic-brains.app.progress',
            MARKETING_VERSION: host.MARKETING_VERSION ?? version,
            CURRENT_PROJECT_VERSION: host.CURRENT_PROJECT_VERSION ?? build,
            ...(host.DEVELOPMENT_TEAM ? { DEVELOPMENT_TEAM: host.DEVELOPMENT_TEAM } : {}),
        });
    });
    return project;
}

module.exports = function withProgressWidget(config) {
    const extensions = config.extra?.eas?.build?.experimental?.ios?.appExtensions ?? [];
    config.extra = { ...config.extra, eas: { ...config.extra?.eas, build: {
        ...config.extra?.eas?.build, experimental: { ...config.extra?.eas?.build?.experimental, ios: {
            ...config.extra?.eas?.build?.experimental?.ios,
            appExtensions: [...extensions.filter(ext => ext.targetName !== TARGET), {
                targetName: TARGET, bundleIdentifier: 'com.plastic-brains.app.progress',
                entitlements: { 'com.apple.security.application-groups': [GROUP] },
            }],
        } },
    } } };
    config = withEntitlementsPlist(config, mod => {
        mod.modResults['com.apple.security.application-groups'] = [...new Set([...(mod.modResults['com.apple.security.application-groups'] ?? []), GROUP])];
        return mod;
    });
    return withXcodeProject(config, mod => {
        configureProject(mod.modResults, mod.modRequest.projectRoot, mod.modRequest.platformProjectRoot, config.version, config.ios?.buildNumber);
        return mod;
    });
};
module.exports.configureProject = configureProject;
