# Extensions Framework 😐

👩‍🔬  Please be aware that this package is still experimental —
changes to the interface  and underlying implementation are likely,
and future development or maintenance is not guaranteed.

---

<!-- TOC -->

- [Aknowledgements](#aknowledgements)
- [Expected knowledge](#expected-knowledge)
- [Key Concepts](#key-concepts)
  - [Service](#service)
  - [Extension](#extension)
  - [ExtensionProvider](#extensionprovider)
  - [Container](#container)
  - [Application](#application)
- [Plugins](#plugins)
  - [Plugin resolver (TBD)](#plugin-resolver-tbd)
  - [Authoring a plugin](#authoring-a-plugin)
  - [Loading plugins into your application](#loading-plugins-into-your-application)

<!-- /TOC -->

## Aknowledgements

The Framework is based and heavily inspired by the internal plugin system used in [Theia IDE](https://github.com/theia-ide/theia). Precisely [@theia/core package version v0.3.7](https://github.com/theia-ide/theia/blob/f81fe0139dfa1a8ef36a0eae2b4439d8ef3d2fe2/packages/core/package.json). The version was distributed under Apache 2.0 license.

## Expected knowledge

Developer is expected to have prior knowledge of [inversify.js](http://inversify.io/) and Dependency Injection pattern.

## Key Concepts

The framework provides a way of modularizing applications. It brings two key concepts: `Service` and `Extension`.

### Service

Service represents a place of your app you'd like to have extendable. Service has a named `ExtensionProvider` and expects its extensions to implement a certain interface.

```ts
export const MyServiceExtension = Symbol("MyServiceExtension");

export interface IMyServiceExtension {
  // ...
}

@injectable
export class MyService {
  constructor(
    @inject(ExtensionProvider) @named(MyServiceExtension) extensionProvider: ExtensionProvider
  ) {
    this._extensionProvider = extensionProvider;
  }
}
```

The Framework comes with one service `Application`.

### Extension

Piece of code that implements interface of a specific `Service`

```ts
export class MyExtension implements IMyServiceExtension {
  // ...
}
```

Extensions are ment to be bound to an `ExtensionProvider`.

### ExtensionProvider

Extension provider holds references to a container and a service identifier. The puropse of the provider is to fetch extensions from the container named after the service identifier.

Unless you need a very specific behaviour from an extension provider you are highly encouraged to use the provided implementation. Otherwise you're free to implement your own provider.

To bind an extension provider to a service identifier use `bindExtensionProvider` helper:

```ts
new ContainerModule((bind) => {
  bindExtensionProvider(bind, MyServiceExtension);
})
```

then you can simply bind extensions to the provider:

```ts
new ContainerModule((bind) => {
  bind(MyServiceExtension).to(MyExtension1);
  bind(MyServiceExtension).to(MyExtension2);
});
```

### Container

Extends inversify.js `Container` and wraps `EventEmitter`. The container emitts events on every `bind`, `unbind` and `rebind` method calls.

`ExtensionProvider` uses this feature to expose observable interface, so that your service can be notified every time a new extension is being bound to the container.

### Application

`Application` service is a generic application for you to use.

`Application` exposes one public method `start`. The method subscribes to the internal `ExtensionProvider` observable and initializes `ApplicationExtension`s bound to the container on the fly.

`ApplicationExtension` is the interface that declares one method `onStart` that receives instance of the Application as the only argument.

It can be used like this:

```ts
container.load(extensionsFramework);

container.bind(ApplicationExtension).to(Auth);
container.bind(ApplicationExtension).to(Greeter);

const app = container.get(Application);
app.start();
```

## Plugins

### Plugin resolver (TBD)

There's no plugin resolver mechanis in place yet.

### Authoring a plugin

Typical plugin consists of one or several `Extensions`.

The default export of a plugin should be a factory function that accepts one argument `context` and returns a [ContainerModule](https://github.com/inversify/InversifyJS/blob/4d9f2fc363be94850bb20fde80ad06aca15b700e/wiki/container_modules.md).

```ts
export default (_context) => {
  return new ContainerModule((bind) => {
    // Do all the bindings you need here
  });
};
```

`context` argument is optional and will be used by the resolver (TBD) to parameterize the plugin. There's no more information currently, we just would like to establish the interface so that nobody will have to adjust their plugins in the future.

### Loading plugins into your application

As there's no resolver yet, you should figure out the way of loading all your plugins either at compile time or runtime or both.

At compile time in your application's [composition root](http://blog.ploeh.dk/2011/07/28/CompositionRoot/) you can import plugins and load them into a container.

```ts
import extensionFramework, { Container } from "extension-framework";
import pluginFactory from "your-plugin";

const container = new Container();

container.load(extensionsFramework);

const plugin = pluginFactory();
container.load(plugin);

export default container;
```