import { ISafetyDataAdapter } from './interface'
import { MockSafetyDataAdapter } from './mock.adapter'

const provider = process.env.NEXT_PUBLIC_SAFETY_DATA_PROVIDER ?? 'mock'

const adapters: Record<string, ISafetyDataAdapter> = {
  mock: MockSafetyDataAdapter,
  // TODO: Register real API adapters here as they are built
  // 'crime-api': CrimeApiAdapter,
  // 'custom-api': CustomApiAdapter,
}

export const SafetyDataAdapter: ISafetyDataAdapter = adapters[provider] ?? MockSafetyDataAdapter
export type { ISafetyDataAdapter }
