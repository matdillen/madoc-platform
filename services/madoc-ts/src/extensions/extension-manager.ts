import { ApiClient } from '../gateway/api';

export interface BaseExtension {
  api: ApiClient;
}

type MethodArgs<T> = T extends (arg: infer R, ..._: any[]) => Promise<infer R> ? R : never;

export class ExtensionManager<T extends BaseExtension> {
  extensions: T[];

  constructor(extensions: T[]) {
    this.extensions = extensions;
  }

  async dispatch<Type extends MethodArgs<T[R]>, R extends keyof T>(name: R, arg: Type, ...args: any[]) {
    let ret = arg;
    for (const extension of this.extensions) {
      try {
        ret = await (extension[name] as any).call(extension, arg, args);
      } catch (err) {
        console.log(`Error while dispatching ${name}`, err);
      }
    }
    return ret;
  }
}
