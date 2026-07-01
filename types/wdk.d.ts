// GoalMind — WDK Type Declarations
// Temporary type declarations until @tetherto/wdk publishes types.

declare module '@tetherto/wdk' {
  export interface Account {
    address: string;
    index: number;
    chain: string;
  }

  export interface Policy {
    id: string;
    name: string;
    scope: 'project' | 'global';
    rules: PolicyRule[];
  }

  export interface PolicyRule {
    name: string;
    operation: string;
    action: 'ALLOW' | 'DENY';
    conditions: Array<(params: any) => boolean>;
  }

  export interface SimulateResult {
    decision: 'ALLOW' | 'DENY';
    policy_id?: string;
    matched_rule?: string;
    reason?: string;
    trace?: any;
  }

  export default class WDK {
    constructor(seedPhrase: string);
    
    static getRandomSeedPhrase(): string;
    
    getAccount(chain: string, index: number): Promise<Account>;
    
    registerWallet(
      chain: string,
      walletManager: any,
      config?: Record<string, any>
    ): WDK;
    
    registerPolicy(policy: Policy): WDK;
  }

  export class PolicyViolationError extends Error {
    constructor(message: string, result: SimulateResult);
  }
}

declare module '@tetherto/wdk-wallet-evm' {
  export default class WalletManagerEvm {
    constructor(config: { provider: string });
  }
}

declare module '@tetherto/wdk-wallet-solana' {
  export default class WalletManagerSolana {
    constructor(config: {
      rpcUrl: string;
      commitment?: string;
    });
  }
}

declare module '@tetherto/wdk-wallet-ton' {
  export default class WalletManagerTon {
    constructor(config: {
      tonClient: { url: string };
    });
  }
}

declare module '@tetherto/wdk-wallet-tron' {
  export default class WalletManagerTron {
    constructor(config: {
      provider: string;
    });
  }
}
