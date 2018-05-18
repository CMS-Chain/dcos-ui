import { Container as InversifyContainer, interfaces } from "inversify";
import { EventEmitter } from "events";

const BOUND = "BOUND";
const UNBOUND = "UNBOUND";
const REBOUND = "REBOUND";

interface IEventEmmiter {
  addEventListener<T>(
    type: string,
    callback: (identifier: interfaces.ServiceIdentifier<T>) => void
  ): void;
}

export default class Container extends InversifyContainer
  implements IEventEmmiter {
  private eventEmitter: EventEmitter;

  constructor(containerOptions?: interfaces.ContainerOptions) {
    super(containerOptions);

    this.eventEmitter = new EventEmitter();
  }

  public addEventListener<T>(
    type: string,
    callback: (identifier: interfaces.ServiceIdentifier<T>) => void
  ) {
    this.eventEmitter.addListener(type, callback);
  }

  public bind<T>(serviceIdentifier: interfaces.ServiceIdentifier<T>) {
    const bindingToSyntax = super.bind(serviceIdentifier);
    this.eventEmitter.emit(BOUND, serviceIdentifier);

    return bindingToSyntax;
  }

  public rebind<T>(serviceIdentifier: interfaces.ServiceIdentifier<T>) {
    const bindingToSyntax = super.rebind(serviceIdentifier);
    this.eventEmitter.emit(REBOUND, serviceIdentifier);

    return bindingToSyntax;
  }

  public unbind<T>(serviceIdentifier: interfaces.ServiceIdentifier<T>) {
    super.unbind(serviceIdentifier);
    this.eventEmitter.emit(UNBOUND, serviceIdentifier);
  }

  static get BOUND(): string {
    return BOUND;
  }

  static get UNBOUND(): string {
    return UNBOUND;
  }

  static get REBOUND(): string {
    return REBOUND;
  }
}
