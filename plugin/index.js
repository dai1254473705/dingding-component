import { setSdk, setLifecycleSdk } from './api/sdk';

export function registerWorktab(obj) {
  console.log(obj,'obj');
  setSdk(obj.sdk)
  setLifecycleSdk(obj.lifecycle)
}



