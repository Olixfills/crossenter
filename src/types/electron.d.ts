import { CrossenterBridge } from '../../electron/preload'

declare global {
  interface Window {
    crossenter: CrossenterBridge
  }
}
