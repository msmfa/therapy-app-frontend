const JestNodeEnvironmentModule = require('jest-environment-node');
const NodeEnvironment =
    JestNodeEnvironmentModule.TestEnvironment ??
    JestNodeEnvironmentModule.default ??
    JestNodeEnvironmentModule;

class ReactNativeLikeFormData {
    constructor() {
        this._parts = [];
    }

    append(name, value) {
        this._parts.push([String(name), value]);
    }

    getAll(name) {
        return this._parts.filter((entry) => entry[0] === name).map((entry) => entry[1]);
    }

    getParts() {
        return this._parts.map(([key, value]) => ({
            headers: { 'content-disposition': `form-data; name="${key}"` },
            string: typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value),
        }));
    }
}

class ExpoNodeEnvironment extends NodeEnvironment {
    constructor(config, context) {
        super(config, context);

        if (typeof this.global.FormData === 'undefined') {
            this.global.FormData = ReactNativeLikeFormData;
        }
    }
}

module.exports = ExpoNodeEnvironment;
