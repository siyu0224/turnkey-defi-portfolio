export interface DCATransactionParams {
  fromToken: string;
  toToken: string;
  amount: number;
  maxGasPrice: number;
  walletAddress: string;
  strategyId: string;
}

export interface DCAExecutionGuard {
  canExecute: boolean;
  reason?: string;
}

// Check if a DCA transaction should be executed
export async function checkDCAExecutionGuard(
  params: DCATransactionParams,
  strategy: any
): Promise<DCAExecutionGuard> {
  // 1. Check amount limits
  if (params.amount > parseFloat(strategy.config.amount)) {
    return {
      canExecute: false,
      reason: `Amount ${params.amount} exceeds strategy limit ${strategy.config.amount}`
    };
  }

  // 2. Check gas price limits
  if (params.maxGasPrice > parseFloat(strategy.config.maxGasPrice) * 1e9) {
    return {
      canExecute: false,
      reason: `Gas price too high. Current: ${params.maxGasPrice / 1e9} Gwei, Max: ${strategy.config.maxGasPrice} Gwei`
    };
  }

  // 3. Check token pairs match
  if (params.fromToken !== strategy.config.fromToken || params.toToken !== strategy.config.toToken) {
    return {
      canExecute: false,
      reason: `Token pair mismatch. Expected ${strategy.config.fromToken}→${strategy.config.toToken}, got ${params.fromToken}→${params.toToken}`
    };
  }

  // 4. Check daily execution limit (simplified - in production, track in database)
  const lastExecution = strategy.config.lastExecution;
  if (lastExecution) {
    const lastExecutionDate = new Date(lastExecution);
    const now = new Date();
    const hoursSinceLastExecution = (now.getTime() - lastExecutionDate.getTime()) / (1000 * 60 * 60);
    
    if (strategy.config.frequency === 'daily' && hoursSinceLastExecution < 24) {
      return {
        canExecute: false,
        reason: `Daily limit reached. Last execution was ${hoursSinceLastExecution.toFixed(1)} hours ago`
      };
    }
  }

  // 5. Check total budget
  const executedAmount = parseFloat(strategy.config.executedAmount || '0');
  const totalBudget = parseFloat(strategy.config.totalBudget || '0');
  
  if (executedAmount + params.amount > totalBudget) {
    return {
      canExecute: false,
      reason: `Budget exhausted. Executed: ${executedAmount}, Budget: ${totalBudget}`
    };
  }

  // All checks passed
  return {
    canExecute: true
  };
}

// Log execution for audit trail
export function logDCAExecution(
  strategyId: string,
  params: DCATransactionParams,
  result: 'success' | 'failed',
  txHash?: string,
  error?: string
) {
  const log = {
    strategyId,
    timestamp: new Date().toISOString(),
    params,
    result,
    txHash,
    error
  };
  
  // In production, save to database
  console.log('DCA Execution Log:', log);
  
  // For demo, save to localStorage
  const logs = JSON.parse(localStorage.getItem('dca-execution-logs') || '[]');
  logs.push(log);
  localStorage.setItem('dca-execution-logs', JSON.stringify(logs));
}