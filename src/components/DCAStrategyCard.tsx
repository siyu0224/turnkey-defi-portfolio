"use client";

interface DCAStrategyCardProps {
  strategy: any;
  onExecute: () => void;
  executing: boolean;
}

export default function DCAStrategyCard({ strategy, onExecute, executing }: DCAStrategyCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{strategy.name}</h3>
          <p className="text-sm text-gray-600 mt-1">
            {strategy.config.amount} {strategy.config.fromToken} → {strategy.config.toToken} {strategy.config.frequency}
          </p>
        </div>
        <span className={`px-3 py-1 text-sm rounded-full font-medium ${
          strategy.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
        }`}>
          {strategy.status}
        </span>
      </div>

      {/* Strategy Rules */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Execution Rules:</h4>
        <ul className="space-y-1 text-sm text-gray-600">
          <li>✓ Amount: {strategy.config.amount} {strategy.config.fromToken} per transaction</li>
          <li>✓ Max Gas: {strategy.config.maxGasPrice} Gwei</li>
          <li>✓ Slippage: {strategy.config.slippageTolerance}%</li>
          <li>✓ Frequency: {strategy.config.frequency}</li>
          <li>✓ Budget: ${strategy.config.executedAmount} / ${strategy.config.totalBudget}</li>
        </ul>
      </div>

      {/* Associated Policy */}
      <div className="bg-blue-50 rounded-lg p-3 mb-4">
        <p className="text-xs text-blue-700">
          <strong>Policy:</strong> This strategy has an associated Turnkey policy that allows automated transaction signing. 
          The actual execution rules above are enforced by the application.
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Progress</span>
          <span>{strategy.config.executionCount} executions</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
            style={{
              width: `${(parseFloat(strategy.config.executedAmount) / parseFloat(strategy.config.totalBudget)) * 100}%`
            }}
          />
        </div>
      </div>

      <button
        onClick={onExecute}
        disabled={executing || strategy.status !== 'active'}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-all"
      >
        {executing ? 'Executing...' : 'Execute Now'}
      </button>
    </div>
  );
}