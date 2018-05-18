import { injectable, interfaces } from "inversify";
import { BehaviorSubject } from "rxjs";

import Container from "./Container";

export interface IExtensionProvider<T> {
  subscribe(callback: () => void): any;
  getAllExtensions(): T[];
  getTaggedExtensions(tagName: string, tagValue: any): T[];
}

@injectable()
export class ExtensionProvider<T> implements IExtensionProvider<T> {
  private serviceIdentifier: interfaces.ServiceIdentifier<T>;
  private container: Container;
  private extensions$: BehaviorSubject<any>;

  constructor(
    serviceIdentifier: interfaces.ServiceIdentifier<T>,
    container: Container
  ) {
    this.serviceIdentifier = serviceIdentifier;
    this.container = container;
    this.extensions$ = new BehaviorSubject<any>(null);

    this.container.addEventListener<
      T
    >(
      Container.BOUND,
      (
        identifier: interfaces.ServiceIdentifier<T>
      ) => {
        if (identifier === this.serviceIdentifier) {
          this.extensions$.next(identifier);
        }
      }
    );
  }

  public subscribe(callback: () => void) {
    this.extensions$.subscribe(callback);
  }

  public getAllExtensions(): T[] {
    let extensions: T[] = [];
    if (this.container.isBound(this.serviceIdentifier)) {
      try {
        extensions = this.container.getAll<T>(this.serviceIdentifier);
      } catch (error) {
        // tslint:disable-next-line:no-console
        console.error(error);
      }
    }

    return extensions;
  }

  public getTaggedExtensions(tagName: string, tagValue: any): T[] {
    let extensions: T[] = [];
    if (this.container.isBound(this.serviceIdentifier)) {
      try {
        extensions = this.container.getAllTagged<T>(
          this.serviceIdentifier,
          tagName,
          tagValue
        );
      } catch (error) {
        // tslint:disable-next-line:no-console
        console.error(error);
      }
    }

    return extensions;
  }
}

export function bindExtensionProvider(
  bind: interfaces.Bind,
  id: symbol | string
): void {
  bind(ExtensionProvider)
    .toDynamicValue(
      context =>
        new ExtensionProvider(id, context.container as Container)
    )
    .inSingletonScope()
    .whenTargetNamed(id);
}
