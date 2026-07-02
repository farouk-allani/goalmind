// Web-only mock of @tetherto/wdk (default export `WDK`).
//
// The real WDK does native key management / signing and cannot run in a
// browser. This stub is aliased in metro.config.js for `platform === 'web'`
// so the wallet UI is browsable. Native builds resolve the real WDK.
//
// It mirrors the real surface the app uses: registerWallet / registerPolicy
// chaining, getAccount → getAddress/transfer/sendTransaction/simulate, and
// PolicyViolationError. The mock policy engine actually evaluates DENY rules
// so agent spending limits are demonstrable in web preview too.

const WORDS = [
  'ability', 'ocean', 'tiger', 'valley', 'orbit', 'harvest', 'copper', 'signal',
  'meadow', 'puzzle', 'ranch', 'velvet', 'anchor', 'bison', 'cactus', 'domino',
  'ember', 'falcon', 'glacier', 'hazel', 'ivory', 'jungle', 'kettle', 'lantern',
];

export class PolicyViolationError extends Error {
  constructor(message, policyId, ruleName) {
    super(message);
    this.name = 'PolicyViolationError';
    this.policyId = policyId;
    this.ruleName = ruleName;
    this.reason = message;
  }
}

export class PolicyConfigurationError extends Error {}

class MockAccount {
  constructor(policies, seed, chain) {
    this._policies = policies;
    this._seed = seed;
    this._chain = chain;
    this.simulate = {
      transfer: async (params) => this._evaluate('transfer', params),
      sendTransaction: async (params) => this._evaluate('sendTransaction', params),
    };
  }

  async getAddress() {
    // Deterministic pseudo-address from seed+chain (UI preview only).
    let h = 0;
    const s = `${this._seed}:${this._chain}`;
    for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0;
    return `0x${Math.abs(h).toString(16).padStart(8, '0').repeat(5).slice(0, 40)}`;
  }

  _evaluate(operation, params) {
    for (const policy of this._policies) {
      for (const rule of policy.rules ?? []) {
        if (rule.operation !== operation && rule.operation !== '*') continue;
        const matches = (rule.conditions ?? []).every((c) => {
          try {
            return c({ params, operation });
          } catch {
            return false;
          }
        });
        if (matches && rule.action === 'DENY') {
          return {
            decision: 'DENY',
            policy_id: policy.id,
            matched_rule: rule.name,
            reason: `Denied by rule "${rule.name}" of policy "${policy.id}"`,
          };
        }
      }
    }
    return { decision: 'ALLOW' };
  }

  _guard(operation, params) {
    const result = this._evaluate(operation, params);
    if (result.decision === 'DENY') {
      throw new PolicyViolationError(result.reason, result.policy_id, result.matched_rule);
    }
  }

  async transfer(params) {
    this._guard('transfer', params);
    throw new Error('[Web preview] Real transfers require the native app with WDK.');
  }

  async sendTransaction(params) {
    this._guard('sendTransaction', params);
    throw new Error('[Web preview] Real transactions require the native app with WDK.');
  }
}

export default class WDK {
  constructor(seed) {
    this._seed = seed;
    this._wallets = new Map();
    this._policies = [];
  }

  static getRandomSeedPhrase(wordCount = 12) {
    return new Array(wordCount)
      .fill(0)
      .map(() => WORDS[Math.floor(Math.random() * WORDS.length)])
      .join(' ');
  }

  static isValidSeed(seed) {
    const words = String(seed).trim().split(/\s+/);
    return words.length === 12 || words.length === 24;
  }

  registerWallet(id, Manager, config) {
    this._wallets.set(id, { Manager, config });
    return this;
  }

  registerPolicy(policy) {
    this._policies.push(policy);
    return this;
  }

  async getAccount(blockchain, index = 0) {
    if (!this._wallets.has(blockchain)) {
      throw new Error(`No wallet registered for "${blockchain}"`);
    }
    return new MockAccount(this._policies, this._seed, blockchain);
  }

  dispose() {}
}
